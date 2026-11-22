(function(){
  'use strict';

  const KEY='madplan_shared_recipe_library_v1';
  const BASE_KEY='madplan_recipe_library_base_v1';
  const SECTIONS=['recipes','marks'];
  const stored=store.get(KEY,{});
  let data=read(stored);
  let migrated=stored.migrated===true;
  let base=[];
  let ready=false;
  let lastEdit=0;

  function recipeDefinition(value,recipeId){
    const {id,name,type,ingredients}=normalizeRecipe({...value,id:recipeId});
    return {id,name,type,ingredients};
  }

  function read(value){
    const result={v:1,recipes:{},marks:{}};
    for(const section of SECTIONS){
      result[section]=Object.fromEntries(Object.entries(value?.[section]||{}).flatMap(([recipeId,entry])=>{
        if(typeof entry?.stamp!=='string')return [];
        const value=entry.value;
        if(section==='marks')return typeof value==='boolean'?[[recipeId,{stamp:entry.stamp,value}]]:[];
        if(value===null)return [[recipeId,{stamp:entry.stamp,value}]];
        if(typeof value?.name!=='string'||!Array.isArray(value.ingredients))return [];
        const recipe=recipeDefinition(value,recipeId);
        return recipe.name?[[recipeId,{stamp:entry.stamp,value:recipe}]]:[];
      }));
    }
    return result;
  }

  function persist(){
    store.set(KEY,{...data,migrated});
  }

  function rebuild(){
    const library=new Map(base.map(recipe=>[recipe.id,recipe]));
    for(const [recipeId,{value}] of Object.entries(data.recipes)){
      if(value===null)library.delete(recipeId);
      else library.set(recipeId,{...value,kidFriendly:library.get(recipeId)?.kidFriendly});
    }
    recipes=[...library.values()];
  }

  function merge(next){
    const incoming=read(next);
    let changed=false;
    for(const section of SECTIONS){
      for(const [recipeId,entry] of Object.entries(incoming[section])){
        const current=Object.hasOwn(data[section],recipeId)?data[section][recipeId]:undefined;
        if(current&&current.stamp>=entry.stamp)continue;
        data[section]={...data[section],[recipeId]:entry};
        if(entry.stamp.startsWith('1:'))lastEdit=Math.max(lastEdit,Number(entry.stamp.split(':')[1])||0);
        changed=true;
      }
    }
    if(changed){
      persist();
      if(ready)rebuild();
    }
    return changed;
  }

  function legacyMarks(marks,version=''){
    const entries=Object.entries(marks||{}).filter(([,value])=>typeof value==='boolean');
    return merge({marks:Object.fromEntries(entries.map(([id,value])=>[id,{stamp:'0:'+version+':'+Number(value),value}]))});
  }

  function initialise(official, fallback){
    const cached=store.get(BASE_KEY,[]);
    const legacy=store.get('madplan_recipes_v1',[]);
    const hasBase=official.length>0||cached.length>0;
    if(official.length)store.set(BASE_KEY,official);
    base=official.length?official:cached.length?cached:legacy.length?legacy.map(normalizeRecipe):fallback;
    if(!migrated&&hasBase){
      const defaults=new Map(base.map(item=>[item.id,recipeDefinition(item,item.id)]));
      const local=legacy.map(normalizeRecipe).filter(item=>item.name);
      const localDefinitions=local.map(item=>[item.id,recipeDefinition(item,item.id)]);
      const differences=localDefinitions.filter(([id,value])=>JSON.stringify(defaults.get(id))!==JSON.stringify(value));
      merge({recipes:Object.fromEntries(differences.map(([id,value])=>{
        const hash=Array.from(JSON.stringify(value)).reduce((sum,char)=>Math.imul(sum^char.charCodeAt(0),16777619),2166136261);
        return [id,{stamp:'0:legacy:'+(hash>>>0).toString(16),value}];
      }))});
      legacyMarks(Object.fromEntries(local.filter(item=>typeof item.kidFriendly==='boolean').map(item=>[item.id,item.kidFriendly])));
      migrated=true;
      persist();
    }
    legacyMarks(store.get('madplan_kid_friendly_v1',{}),'0-local');
    ready=true;
    rebuild();
  }

  function snapshot(){
    return {v:1,recipes:{...data.recipes},marks:{...data.marks}};
  }

  function includes(have,wanted=snapshot()){
    return SECTIONS.every(section=>Object.entries(wanted[section]).every(([id,entry])=>
      Object.hasOwn(have?.[section]||{},id)&&have[section][id].stamp>=entry.stamp));
  }

  function modify(edits,marks={}){
    const latest=SECTIONS.flatMap(section=>Object.values(data[section])).reduce((time,entry)=>
      entry.stamp.startsWith('1:')?Math.max(time,Number(entry.stamp.split(':')[1])||0):time,lastEdit);
    lastEdit=Math.max(Date.now(),latest+1);
    const stamp='1:'+String(lastEdit).padStart(15,'0')+':'+id();
    const entries=values=>Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{stamp,value}]));
    merge({recipes:entries(edits),marks:entries(marks)});
  }

  function save(recipe, label){
    const current=recipes.find(item=>item.id===recipe.id);
    const value=recipeDefinition(recipe,recipe.id);
    const changed=!current||JSON.stringify(recipeDefinition(current,current.id))!==JSON.stringify(value);
    const marks=typeof label==='boolean'?{[recipe.id]:label}:{};
    if(changed||Object.keys(marks).length)modify(changed?{[recipe.id]:value}:{},marks);
    return changed||Object.keys(marks).length>0;
  }

  function replaceAll(list){
    const next=new Map(list.map(recipe=>[recipe.id,recipe]));
    const edits=new Map(recipes.filter(recipe=>!next.has(recipe.id)).map(recipe=>[recipe.id,null]));
    for(const recipe of next.values()){
      const current=recipes.find(item=>item.id===recipe.id);
      const value=recipeDefinition(recipe,recipe.id);
      if(!current||JSON.stringify(recipeDefinition(current,current.id))!==JSON.stringify(value))
        edits.set(recipe.id,value);
    }
    const marks=Object.fromEntries([...next.values()].filter(recipe=>typeof recipe.kidFriendly==='boolean').map(recipe=>[recipe.id,recipe.kidFriendly]));
    modify(Object.fromEntries(edits),marks);
  }

  window.madplanRecipeLibrary={
    initialise,
    merge,
    legacyMarks,
    read,
    snapshot,
    includes,
    save,
    replaceAll,
    remove:recipeId=>modify({[recipeId]:null}),
    mark:(recipeId,checked)=>modify({},{[recipeId]:checked}),
    markFor:recipeId=>Object.hasOwn(data.marks,recipeId)?data.marks[recipeId].value:undefined,
    defaultMarkFor:recipeId=>base.some(recipe=>recipe.id===recipeId&&recipe.kidFriendly===true)
  };
})();
