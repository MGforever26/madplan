(function(){
  // Beregn kun grundmængder ved en reel genopbygning af indkøbslisten.
  // Indlæste og manuelt justerede mængder må ikke overskrives under visning.

  function normName(x){
    return cleanName(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  function expectedQuantities(){
    const recipe=new Map();
    const standard=new Map();

    try{
      plan.map(byId).forEach((r,day)=>{
        const ext=window.madplanIngredientQuantities;
        const ingredients=ext&&typeof ext.contributions==='function'
          ?ext.contributions(day,r)
          :(r.ingredients||[]).filter(i=>ingOn(day,i)).map(i=>({name:i.name,qty:1}));
        ingredients.forEach(i=>{
          const k=normName(i.name);
          recipe.set(k,(recipe.get(k)||0)+(Number(i.qty)||1));
        });
      });
    }catch(e){}

    try{
      STANDARD.forEach(i=>{
        const k=normName(i.name);
        standard.set(k,(standard.get(k)||0)+(Number(i.qty)||1));
      });
    }catch(e){}

    return {recipe,standard};
  }

  function correctGeneratedQuantities(){
    if(!Array.isArray(shopping)) return false;
    const expected=expectedQuantities();
    let changed=false;

    shopping.forEach(i=>{
      const source=i.source==='ekstra'?'manuelt':i.source;
      const k=normName(i.name);
      let qty=null;
      if(source==='ret' && expected.recipe.has(k)) qty=expected.recipe.get(k);
      if(source==='standard' && expected.standard.has(k)) qty=expected.standard.get(k);
      if(qty!==null && Number(i.qty)!==qty){
        i.qty=qty;
        changed=true;
      }
    });

    return changed;
  }

  if(typeof buildShopping==='function'){
    const previousBuildShopping=buildShopping;
    buildShopping=function(opts={}){
      previousBuildShopping(opts);
      correctGeneratedQuantities();
    };
  }

  // Intet ekstra buildShopping() ved indlæsning. Appens eksisterende
  // initialisering genskaber listen, og synkroniseringen anvender derefter
  // de gemte antal uden at blive nulstillet af en render-funktion.
})();
