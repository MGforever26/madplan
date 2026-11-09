(function(){
  'use strict';
  const FORMAT='madplan-gzip-v1';
  function toBase64(bytes){
    let text='';
    for(let i=0;i<bytes.length;i+=8192){
      text+=String.fromCharCode(...bytes.subarray(i,i+8192));
    }
    return btoa(text);
  }
  function fromBase64(encoded){
    const raw=atob(encoded);
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }
  async function compress(payload){
    if(typeof CompressionStream!=='function')
      throw new Error('Denne browser understøtter ikke komprimering');
    const source=JSON.stringify(payload);
    const stream=new Blob([source],{type:'application/json'}).stream().pipeThrough(new CompressionStream('gzip'));
    const bytes=new Uint8Array(await new Response(stream).arrayBuffer());
    // Keep the live week readable even by a device that has not yet refreshed.
    // The full, lossless state is in data and is restored by updated clients.
    return {
      __madplan_format:FORMAT,
      data:toBase64(bytes),
      v:payload.v,
      days:payload.days,
      meatDays:payload.meatDays,
      plan:payload.plan,
      recipes:payload.recipes,
      shopping:payload.shopping,
      excluded:payload.excluded,
      sx:payload.sx,
      w:payload.w
    };
  }
  async function decompress(payload){
    if(!payload||payload.__madplan_format!==FORMAT)return payload;
    if(typeof DecompressionStream!=='function')
      throw new Error('Denne browser understøtter ikke udpakning');
    if(typeof payload.data!=='string'||payload.data.length>2500000)
      throw new Error('Ugyldig komprimeret madplan');
    const bytes=fromBase64(payload.data);
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const data=JSON.parse(await new Response(stream).text());
    if(!data||typeof data!=='object'||!Array.isArray(data.plan)||!Array.isArray(data.shopping))
      throw new Error('Den udpakkede madplan har ugyldigt format');
    return data;
  }
  window.madplanPayloadCodec={compress,decompress};
})();
