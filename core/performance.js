(function(){

  // V70: one authoritative active-mode signal. Heavy global maintenance can
  // cheaply yield while a full-screen mode owns input/rendering.
  if(!window.PSY_RUNTIME_MODE){
    const st={active:'city',changedAt:performance.now(),cityDisplay:null};
    const visible=id=>{const e=document.getElementById(id);if(!e)return false;const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'};
    const api={
      get active(){return st.active},
      enter(mode){mode=String(mode||'city');if(st.active!==mode){st.active=mode;st.changedAt=performance.now();const city=document.getElementById('game-wrap');if((mode==='adventure'||mode==='survivor')&&city){if(st.cityDisplay===null)st.cityDisplay=city.style.display||'block';city.style.display='none'}if(mode==='city'&&city&&st.cityDisplay!==null){city.style.display=st.cityDisplay||'block';st.cityDisplay=null}window.dispatchEvent(new CustomEvent('psy:modechange',{detail:{mode}}))}return mode},
      leave(mode){if(!mode||st.active===mode)return api.enter('city');return st.active},
      is(mode){return st.active===mode},
      isExclusive(){return ['adventure','survivor','world','battle'].includes(st.active)},
      shouldRunBackground(){return !['adventure','survivor'].includes(st.active)},
      detect(){
        if(visible('psy-adventure-v95-authored'))return api.enter('adventure');
        if(visible('screen-survivor-v12')&&window.PSY_CLEAN_SURV)return api.enter('survivor');
        if(visible('screen-world'))return api.enter('world');
        if(visible('battle-screen')||visible('screen-battle'))return api.enter('battle');
        if(st.active!=='city')api.enter('city');
        return st.active;
      }
    };
    window.PSY_RUNTIME_MODE=api;
    let modeTimer=setInterval(()=>{if(!document.hidden)api.detect()},400);
    window.addEventListener('pagehide',()=>clearInterval(modeTimer),{once:true});
  }
  const critical=img=>img.id==='player-poke-sprite'||img.id==='player-img'||img.id==='enemy-img'||!!img.closest?.('#world-sprites');
  const tune=img=>{if(!(img instanceof HTMLImageElement)||img.dataset.psyPerfImg)return;img.dataset.psyPerfImg='1';try{img.decoding='async'}catch(_){}if(!critical(img)){try{img.loading='lazy'}catch(_){}try{img.fetchPriority='low'}catch(_){}}};
  const boot=()=>{document.querySelectorAll('img').forEach(tune);const mo=new MutationObserver(rows=>{for(const r of rows)for(const n of r.addedNodes){if(n?.nodeType!==1)continue;if(n.tagName==='IMG')tune(n);n.querySelectorAll?.('img').forEach(tune)}});mo.observe(document.body,{childList:true,subtree:true});window.__psyPerfImageObserver=mo};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
