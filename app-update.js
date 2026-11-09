(function(){
  'use strict';
  // Hjemmeskærmsappen kan blive hængende på en gammel HTML-side.
  // Check versions without disturbing the local meal plan or shopping list.
  const CHECK_EVERY_MS=5*60*1000;
  const MIN_CHECK_GAP_MS=60*1000;
  const UPDATE_ATTEMPT_KEY='madplan_app_update_attempt_v1';
  let checking=false;
  let lastCheck=0;

  function checksum(input){
    let hash=2166136261;
    for(let i=0;i<input.length;i++){
      hash=Math.imul(hash^input.charCodeAt(i),16777619);
    }
    return (hash>>>0).toString(16);
  }
  function scriptSignature(doc){
    const scripts=[...doc.querySelectorAll('script')].map(node=>{
      const src=node.getAttribute('src');
      return src?'file:'+src:'inline:'+checksum(node.textContent||'');
    });
    const styles=[...doc.querySelectorAll('style')]
      .map(node=>'style:'+checksum(node.textContent||''));
    return [...scripts,...styles].join('|');
  }
  function savedWithoutPendingChanges(){
    try{
      if(localStorage.getItem('madplan_pending_sync_v1'))return false;
      if(window.madplanBootstrapping)return false;
      const status=window.madplanSyncStatus&&window.madplanSyncStatus.label;
      return status==='Synkroniseret';
    }catch(e){return false;}
  }
  function wasRecentlyAttempted(signature){
    try{
      const attempt=JSON.parse(sessionStorage.getItem(UPDATE_ATTEMPT_KEY)||'null');
      return !!(attempt&&attempt.signature===signature&&Date.now()-attempt.ts<10*60*1000);
    }catch(e){return false;}
  }
  async function checkVersion(){
    if(checking||document.hidden||Date.now()-lastCheck<MIN_CHECK_GAP_MS)return;
    checking=true;
    lastCheck=Date.now();
    try{
      const url=new URL('index.html',location.href);
      url.searchParams.set('_appcheck',String(Date.now()));
      const response=await fetch(url.toString(),{cache:'no-store'});
      if(!response.ok)return;
      const html=await response.text();
      const fresh=new DOMParser().parseFromString(html,'text/html');
      const updated=scriptSignature(fresh);
      const current=scriptSignature(document);
      if(!updated||!current||updated===current)return;
      // Never restart an app with unsent changes.
      if(!savedWithoutPendingChanges()||wasRecentlyAttempted(updated))return;
      sessionStorage.setItem(UPDATE_ATTEMPT_KEY,
        JSON.stringify({signature:updated,ts:Date.now()}));
      const destination=new URL(location.href);
      destination.searchParams.set('_appversion',String(Date.now()));
      location.replace(destination.toString());
    }catch(e){
      // Failure to check for a new version must never interrupt meal planning.
    }finally{checking=false;}
  }

  setTimeout(checkVersion,5000);
  setInterval(checkVersion,CHECK_EVERY_MS);
  window.addEventListener('focus',checkVersion);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)checkVersion();
  });
})();
