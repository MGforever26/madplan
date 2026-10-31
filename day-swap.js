/* Ombyt to dage uden at ændre ugens øvrige indhold. */
(function(){
  'use strict';
  let chosenDay=null;

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
       a<0||b<0||a>=plan.length||b>=plan.length||a===b)return;
    const amounts=window.madplanIngredientQuantities;
    // Do not discard per-recipe quantity choices if an older cached script is loaded.
    if(amounts&&typeof amounts.overrides==='function'&&
       Object.keys(amounts.overrides()).length&&typeof amounts.swapDays!=='function'){
      alert('Opdatér siden, før du bytter dage, så dine valgte mængder bevares.');
      return;
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
  }

  function chooseDay(day){
    if(chosenDay===null){
      chosenDay=day;
      refreshChoice();
      return;
    }
    if(chosenDay===day){
      chosenDay=null;
      refreshChoice();
      return;
    }
    const first=chosenDay;
    chosenDay=null;
    swapDays(first,day);
    refreshChoice();
  }

  function refreshChoice(){
    const grid=document.querySelector('#plan .grid.days');
    if(!grid)return;
    if(chosenDay!==null&&chosenDay>=plan.length)chosenDay=null;
    grid.querySelectorAll('[data-swap-day]').forEach(button=>{
      const day=Number(button.dataset.swapDay);
      const active=day===chosenDay;
      button.setAttribute('aria-pressed',String(active));
      button.setAttribute('aria-label',chosenDay===null?'Byt dag '+(day+1):
        active?'Annullér bytning af dag '+(day+1):'Byt dag '+(chosenDay+1)+' med dag '+(day+1));
      button.title=chosenDay===null?'Byt med en anden dag':active?'Annullér bytning':'Byt med dag '+(day+1);
      button.style.color=active?'var(--accent)':'var(--muted)';
      button.style.background=active?'var(--soft)':'transparent';
      button.style.borderColor=active?'var(--accent)':'var(--line)';
    });
    let hint=document.getElementById('day-swap-hint');
    if(chosenDay===null){
      if(hint)hint.remove();
    }else{
      if(!hint){
        hint=document.createElement('p');
        hint.id='day-swap-hint';
        hint.className='sub';
        hint.style.cssText='margin:10px 2px 8px;color:var(--accent);font-size:13px';
        grid.parentNode.insertBefore(hint,grid);
      }
      hint.textContent='Dag '+(chosenDay+1)+' er valgt. Tryk på ↔ ved den dag, du vil bytte med.';
    }
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
      button.addEventListener('click',()=>chooseDay(day));
      pair.appendChild(button);
    });
    refreshChoice();
  }

  if(typeof renderPlan==='function'){
    const originalRenderPlan=renderPlan;
    renderPlan=function(){
      const result=originalRenderPlan.apply(this,arguments);
      decorate();
      return result;
    };
  }
  // Kun DOM-dekoration ved indlæsning: ingen gemning eller ny uge.
  decorate();
})();
