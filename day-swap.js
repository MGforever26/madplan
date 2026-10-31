/* Ombyt to dage uden at ændre ugens øvrige indhold. */
(function(){
  'use strict';
  let openDay=null;

  function moveDayKeys(source, a, b){
    const next={};
    Object.keys(source||{}).forEach(key=>{
      const sep=key.indexOf('|');
      if(sep<0){next[key]=source[key];return;}
      const prefix=key.slice(0,sep);
      const destination=prefix===String(a)?String(b):prefix===String(b)?String(a):prefix;
      next[destination+key.slice(sep)]=source[key];
    });
    return next;
  }

  function moveSuggestionDays(source,a,b){
    const result=Object.assign({},source||{});
    Object.keys(result).forEach(id=>{
      const raw=result[id], day=Number(raw);
      if(Number.isInteger(day)&&day===a)result[id]=b;
      else if(Number.isInteger(day)&&day===b)result[id]=a;
    });
    return result;
  }

  function swapDays(a,b){
    if(!Array.isArray(plan)||!Number.isInteger(a)||!Number.isInteger(b)||
       a<0||b<0||a>=plan.length||b>=plan.length||a===b)return false;
    const amounts=window.madplanIngredientQuantities;
    // Do not discard per-recipe quantity choices if an older cached script is loaded.
    if(amounts&&typeof amounts.overrides==='function'&&
       Object.keys(amounts.overrides()).length&&typeof amounts.swapDays!=='function'){
      alert('Opdatér siden, før du bytter dage, så dine valgte mængder bevares.');
      return false;
    }
    const swapped=plan.slice();
    const temporary=swapped[a];
    swapped[a]=swapped[b];
    swapped[b]=temporary;
    plan=swapped;
    excluded=moveDayKeys(excluded,a,b);
    if(amounts&&typeof amounts.swapDays==='function')amounts.swapDays(a,b);
    if(activeWeek&&activeWeek.suggestionAssignments){
      activeWeek.suggestionAssignments=moveSuggestionDays(activeWeek.suggestionAssignments,a,b);
    }
    // Retterne og alle indkøb er de samme. Undlad derfor buildShopping(),
    // der ellers kan nulstille eller genberegne brugerens tilpasninger.
    saveSession();
    renderAll();
    return true;
  }

  function openPicker(day){
    openDay=openDay===day?null:day;
    refreshPicker();
  }

  function refreshPicker(){
    const grid=document.querySelector('#plan .grid.days');
    if(!grid)return;
    if(openDay!==null&&(openDay<0||openDay>=plan.length))openDay=null;
    grid.querySelectorAll('[data-day-swap-panel]').forEach(panel=>panel.remove());
    grid.querySelectorAll('.day').forEach(card=>{
      card.style.zIndex='';
    });
    grid.querySelectorAll('[data-swap-day]').forEach(button=>{
      const day=Number(button.dataset.swapDay);
      const active=openDay===day;
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-expanded',String(active));
      button.setAttribute('aria-label',active?'Luk bytning for dag '+(day+1):'Byt dag '+(day+1));
      button.title=active?'Luk':'Byt dag';
      button.style.color=active?'var(--accent)':'var(--muted)';
      button.style.background=active?'var(--soft)':'transparent';
      button.style.borderColor=active?'var(--accent)':'var(--line)';
    });
    if(openDay===null)return;

    const currentDay=openDay;
    const trigger=grid.querySelector('[data-swap-day="'+currentDay+'"]');
    const card=trigger&&trigger.closest('.day');
    const anchor=trigger&&trigger.parentNode;
    if(!card||!anchor||!card.contains(anchor))return;
    card.style.position='relative';
    card.style.zIndex='20';
    anchor.style.position='relative';

    // Flydende menu lige ved det valgte ikon: udvider ikke dagskortet.
    const panel=document.createElement('div');
    panel.dataset.daySwapPanel=String(currentDay);
    panel.setAttribute('role','group');
    panel.setAttribute('aria-label','Byt dag '+(currentDay+1));
    panel.style.cssText='position:absolute;top:calc(100% + 7px);left:0;width:220px;max-width:calc(100vw - 100px);z-index:25;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;box-shadow:0 10px 28px rgba(41,24,18,.14);font-weight:400';

    const label=document.createElement('label');
    label.htmlFor='day-swap-target';
    label.textContent='Byt med';
    label.style.cssText='display:block;margin:0 0 6px;font-size:12px;font-weight:600;color:var(--text)';
    panel.appendChild(label);

    const controls=document.createElement('div');
    controls.style.cssText='display:flex;align-items:center;gap:6px;min-width:0';

    const target=document.createElement('select');
    target.id='day-swap-target';
    target.style.cssText='flex:1;min-width:0;width:100%;font-size:13px;padding:8px;border:1px solid var(--line);border-radius:8px;background:white;color:var(--text)';
    const placeholder=document.createElement('option');
    placeholder.value='';
    placeholder.textContent='Vælg dag';
    target.appendChild(placeholder);
    plan.forEach((rid,day)=>{
      if(day===currentDay)return;
      const option=document.createElement('option');
      option.value=String(day);
      option.textContent='Dag '+(day+1);
      target.appendChild(option);
    });

    const submit=document.createElement('button');
    submit.type='button';
    submit.textContent='Byt';
    submit.disabled=true;
    submit.style.cssText='padding:9px 10px;flex-shrink:0;border:0;border-radius:8px;background:var(--accent);color:white;font:inherit;font-size:13px;font-weight:600;cursor:pointer;opacity:.45';
    target.addEventListener('change',()=>{
      submit.disabled=target.value==='';
      submit.style.opacity=submit.disabled?'0.45':'1';
    });
    submit.addEventListener('click',()=>{
      if(target.value==='')return;
      const otherDay=Number(target.value);
      openDay=null;
      if(!swapDays(currentDay,otherDay)){
        openDay=currentDay;
        refreshPicker();
      }
    });

    controls.appendChild(target);
    controls.appendChild(submit);
    panel.appendChild(controls);

    const explanation=document.createElement('p');
    explanation.textContent='Retterne bytter plads. Indkøbslisten bevares.';
    explanation.style.cssText='margin:7px 0 0;font-size:11px;line-height:1.35;color:var(--muted)';
    panel.appendChild(explanation);

    anchor.appendChild(panel);
  }

  function decorate(){
    const grid=document.querySelector('#plan .grid.days');
    if(!grid)return;
    grid.querySelectorAll('.day').forEach((card,day)=>{
      const heading=card.querySelector('h3');
      if(!heading||card.querySelector('[data-swap-day]'))return;
      const row=heading.parentNode;
      const pair=document.createElement('span');
      pair.style.cssText='display:inline-flex;align-items:center;gap:8px;min-width:0';
      row.insertBefore(pair,heading);
      pair.appendChild(heading);
      const button=document.createElement('button');
      button.type='button';
      button.dataset.swapDay=String(day);
      button.textContent='↔';
      button.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:29px;height:29px;min-width:29px;padding:0;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--muted);font-size:18px;line-height:1;cursor:pointer';
      button.addEventListener('click',()=>openPicker(day));
      pair.appendChild(button);
    });
    refreshPicker();
  }

  if(typeof renderPlan==='function'){
    const originalRenderPlan=renderPlan;
    renderPlan=function(){
      const result=originalRenderPlan.apply(this,arguments);
      decorate();
      return result;
    };
  }
  // Luk menuen ved tryk udenfor eller Escape. Ingen ændringer gemmes.
  document.addEventListener('pointerdown',event=>{
    if(openDay===null)return;
    const target=event.target;
    if(target&&typeof target.closest==='function'&&
       (target.closest('[data-day-swap-panel]')||target.closest('[data-swap-day]')))return;
    openDay=null;
    refreshPicker();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&openDay!==null){
      openDay=null;
      refreshPicker();
    }
  });
  // Kun DOM-dekoration ved indlæsning: ingen gemning eller ny uge.
  decorate();
})();
