(function(){
  const critical=img=>img.id==='player-poke-sprite'||img.id==='player-img'||img.id==='enemy-img'||!!img.closest?.('#world-sprites');
  const tune=img=>{if(!(img instanceof HTMLImageElement)||img.dataset.psyPerfImg)return;img.dataset.psyPerfImg='1';try{img.decoding='async'}catch(_){}if(!critical(img)){try{img.loading='lazy'}catch(_){}try{img.fetchPriority='low'}catch(_){}}};
  const boot=()=>{document.querySelectorAll('img').forEach(tune);const mo=new MutationObserver(rows=>{for(const r of rows)for(const n of r.addedNodes){if(n?.nodeType!==1)continue;if(n.tagName==='IMG')tune(n);n.querySelectorAll?.('img').forEach(tune)}});mo.observe(document.body,{childList:true,subtree:true});window.__psyPerfImageObserver=mo};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
