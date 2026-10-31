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
    panel.style.cssText='position:absolute;top:calc(100% + 6px);left:0;width:198px;max-width:calc(100vw - 85px);z-index:25;background:#fff;border:1px solid var(--line);border-radius:11px;padding:9px;box-shadow:0 8px 22px rgba(41,24,18,.13);font-weight:400';

    const label=document.createElement('div');
    label.textContent='Byt med dag';
    label.style.cssText='margin:0 0 7px;font-size:12px;font-weight:600;color:var(--muted)';
    panel.appendChild(label);

    const choices=document.createElement('div');
    choices.style.cssText='display:flex;flex-wrap:wrap;gap:6px';
    plan.forEach((rid,day)=>{
      if(day===currentDay)return;
      const choice=document.createElement('button');
      choice.type='button';
      choice.dataset.swapTarget=String(day);
      choice.textContent=String(day+1);
      choice.setAttribute('aria-label','Byt dag '+(currentDay+1)+' med dag '+(day+1));
      choice.style.cssText='display:inline-flex;align-items:center;justify-content:center;width:37px;height:37px;flex:0 0 37px;border:1px solid var(--line);border-radius:9px;background:#fff;color:var(--text);font:inherit;font-size:14px;font-weight:600;cursor:pointer';
      choice.addEventListener('click',()=>{
        openDay=null;
        if(!swapDays(currentDay,day)){
          openDay=currentDay;
          refreshPicker();
        }
      });
      choices.appendChild(choice);
    });
    panel.appendChild(choices);

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
