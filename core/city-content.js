/* City content panel owns its layout, independently from the legacy dock. */
(function(W,D){
 'use strict';
 let panel,grid,modal,dock,launcher;
 const important=(el,values)=>Object.entries(values).forEach(([key,value])=>el.style.setProperty(key,value,'important'));
 function layout(){
  if(!modal)return;
  const vv=W.visualViewport,width=vv?.width||W.innerWidth,height=vv?.height||W.innerHeight;
  important(modal,{position:'fixed',left:(vv?.offsetLeft||0)+'px',top:(vv?.offsetTop||0)+'px',width:width+'px',height:height+'px',right:'auto',bottom:'auto',transform:'none',padding:'12px','box-sizing':'border-box','z-index':'10000030'});
  important(panel,{width:Math.min(620,width-24)+'px','max-width':'100%','max-height':'100%','min-height':'0',display:'flex','flex-direction':'column',gap:'12px',padding:'14px','box-sizing':'border-box',overflow:'hidden',margin:'auto',position:'relative',transform:'none',left:'auto',right:'auto',top:'auto',bottom:'auto'});
  important(grid,{display:'grid','grid-template-columns':width<600?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))',gap:'10px',width:'100%','min-width':'0','max-width':'100%','min-height':'0',height:'auto','max-height':'none',flex:'1 1 auto','overflow-y':'auto','overflow-x':'hidden',position:'static',transform:'none',margin:'0',padding:'2px 2px 10px','box-sizing':'border-box','align-self':'stretch'});
  for(const b of grid.children)if(b.tagName==='BUTTON')important(b,{width:'100%','min-width':'0','max-width':'100%',height:'auto','min-height':'54px',padding:'12px 8px',margin:'0','box-sizing':'border-box','font-size':'13px','align-content':'start','line-height':'1.35','white-space':'normal','overflow-wrap':'anywhere',position:'relative',left:'auto',right:'auto',top:'auto',bottom:'auto',transform:'none','flex-shrink':'0','border-radius':'14px'});
 }
 W.toggleCityGameContent=function(force){
  if(!modal||!dock||!launcher)return;
  const collapsed=typeof force==='boolean'?force:!modal.hidden;
  modal.hidden=collapsed;
  // The old dock is now only the launcher, never the expanded panel.
  dock.classList.add('city-content-collapsed');
  launcher.innerHTML='🎃 CONTEÚDO DO JOGO';launcher.setAttribute('aria-expanded',String(!collapsed));
  launcher.title=collapsed?'Abrir conteúdo do jogo':'Fechar conteúdo do jogo';
  if(!collapsed){layout();modal.querySelector('[data-content-close]').focus();}
  else launcher.focus();
 };
 function install(){
  if(D.getElementById('psy-content-modal'))return;
  dock=D.getElementById('world-btn-float');launcher=D.getElementById('btn-city-content-toggle');grid=D.getElementById('city-game-content-buttons');
  if(!dock||!launcher||!grid)return;
  D.getElementById('psy-content-backdrop')?.remove();
  const style=D.createElement('style');style.textContent=`
#psy-content-modal{display:flex;align-items:center;justify-content:center;background:#020617b8;backdrop-filter:blur(5px);overscroll-behavior:contain}
#psy-content-modal[hidden]{display:none!important}
#psy-content-panel{border:1px solid #cda66b;border-radius:20px;background:radial-gradient(ellipse at top right,#63426d50,transparent 65%),#101a2b;color:#f8ead0;box-shadow:0 18px 60px #0009}
#psy-content-panel>header{display:flex;justify-content:space-between;align-items:center;gap:10px;flex:0 0 auto}
#psy-content-panel h2{margin:0;font:800 16px/1.3 system-ui;letter-spacing:.03em}
#psy-content-panel [data-content-close]{width:40px;height:40px;flex:0 0 40px;padding:0;border:1px solid #ffffff40;border-radius:12px;background:#ffffff09;color:white;font-size:26px;cursor:pointer}
#psy-content-panel #city-game-content-buttons>button{border:1px solid #ffffff35!important;box-shadow:inset 0 1px #ffffff15,0 3px 10px #0003!important;color:white!important;touch-action:manipulation}
#psy-content-panel #city-game-content-buttons>button small{display:block;font-size:10px!important;margin-top:4px}
#psy-content-panel #city-game-content-buttons{touch-action:pan-y;scrollbar-width:thin;scrollbar-color:#a184b2 transparent}
#psy-content-panel button:focus-visible{outline:2px solid #ffe1a3;outline-offset:1px}
body:has(.psy-halloween-screen.is-open) #psy-content-modal,body.psy-kanto-v2-active #psy-content-modal{display:none!important}
`;D.head.appendChild(style);
  modal=D.createElement('section');modal.id='psy-content-modal';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','psy-content-title');
  panel=D.createElement('div');panel.id='psy-content-panel';panel.innerHTML='<header><h2 id="psy-content-title">CONTEÚDO DO JOGO</h2><button type="button" data-content-close aria-label="Fechar conteúdo do jogo">×</button></header>';
  panel.appendChild(grid);modal.appendChild(panel);D.body.appendChild(modal);
  panel.querySelector('[data-content-close]').onclick=()=>W.toggleCityGameContent(true);
  modal.addEventListener('click',e=>{if(e.target===modal)W.toggleCityGameContent(true)});
  grid.addEventListener('click',e=>{if(e.target.closest('button'))W.toggleCityGameContent(true)});
  const collect=()=>{for(const el of [...dock.children])if(el.tagName==='BUTTON'&&el!==launcher)grid.appendChild(el);layout();};
  collect();new MutationObserver(collect).observe(dock,{childList:true});
  // Producers run again after lazy modules load. Keep one entry per action.
  let cleaning=false;
  const dedupe=()=>{if(cleaning)return;cleaning=true;try{const seen=new Set();for(const b of [...grid.children]){if(b.tagName!=='BUTTON')continue;const key=b.dataset.psy20Quests||b.dataset.psyQuestsCity?'quests':b.dataset.psy20Vip?'vip':b.dataset.psy20Pass?'pass':b.getAttribute('onclick')?.replace(/window\.|\?\.|\s/g,'')||b.id||b.textContent.trim();if(seen.has(key))b.remove();else seen.add(key);}layout();}finally{cleaning=false;}};
  dedupe();new MutationObserver(dedupe).observe(grid,{childList:true});
  D.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden){e.preventDefault();e.stopImmediatePropagation();W.toggleCityGameContent(true);}},true);
  W.addEventListener('resize',layout);W.visualViewport?.addEventListener('resize',layout);W.visualViewport?.addEventListener('scroll',layout);
  W.toggleCityGameContent(true);
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window,document);
/* PSYWORLD Audio System V1 — carregamento global */
(function psyLoadAudioSystem(){
  if(document.getElementById('psy-audio-system-script'))return;
  const s=document.createElement('script');
  s.id='psy-audio-system-script';
  s.src='core/audio.js?v=HALLOWEEN_ECONOMY_V23';
  s.async=true;
  document.head.appendChild(s);
})();

