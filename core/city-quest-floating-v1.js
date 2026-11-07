/* PSYWORLD City Quests V1: floating, draggable, collapsible.
 * Overlay is only used in Psy City; Kanto keeps its own campaign menu.
 * Dragging never triggers quests. Position persists per device. */
(function(W,D){
'use strict';
if(W.PsyCityQuestFloating)return;
const KEY='psyworld_city_quest_fab_v1';
const style=D.createElement('style');
style.textContent=`
#psy-city-quest-fab{position:fixed;left:calc(100vw - 120px);top:54dvh;z-index:6000;min-width:92px;max-width:132px;min-height:44px;padding:9px 12px;border:1px solid #8ee9e2;border-radius:18px;background:linear-gradient(140deg,#163d55,#13263f);color:#fff;font:900 12px system-ui;box-shadow:0 5px 19px #0009;touch-action:none;user-select:none;cursor:grab}
#psy-city-quest-fab:active{cursor:grabbing}
#psy-city-quest-fab[hidden],#psy-city-quest-drawer[hidden]{display:none!important}
#psy-city-quest-fab[aria-expanded="true"]{background:linear-gradient(130deg,#285c66,#28436d);border-color:#fee2a1}
#psy-city-quest-drawer{position:fixed;z-index:6001;width:min(330px,calc(100vw - 20px));max-height:min(54dvh,440px);display:flex;flex-direction:column;border:1px solid #83d9df;border-radius:15px;background:#0c1b30f7;box-shadow:0 10px 28px #000b;color:#fff;overflow:hidden}
#psy-city-quest-drawer .psy-city-quest-head{display:flex;justify-content:space-between;align-items:center;flex:none;padding:9px 12px;background:#1a304c;border-bottom:1px solid #52718c;font:900 12px system-ui}
#psy-city-quest-drawer .psy-city-quest-head button{min-width:34px;min-height:32px;border:1px solid #88d8dd;border-radius:9px;background:#153c4b;color:#fff;font-size:19px}
#psy-city-quest-drawer #psy-campaign-quests{position:static!important;inset:auto!important;display:block!important;overflow-y:auto;overscroll-behavior:contain;width:100%!important;max-width:none!important;min-height:0;margin:0;border:0;background:transparent;padding:8px;font-size:12px}
#psy-city-quest-drawer #psy-campaign-quests[hidden]{display:none!important}
#psy-city-quest-drawer #psy-campaign-quests .pq-row{grid-template-columns:minmax(0,1fr) auto}
#psy-city-quest-drawer #psy-campaign-quests .pq-row div{min-width:0;overflow-wrap:anywhere}
@media(max-width:480px){#psy-city-quest-drawer{width:min(295px,calc(100vw - 16px));max-height:50dvh}#psy-city-quest-fab{min-width:84px;padding:8px 10px}}
`;D.head.appendChild(style);
const fab=D.createElement('button');fab.id='psy-city-quest-fab';fab.type='button';
fab.textContent='📜 QUESTS';fab.hidden=true;fab.setAttribute('aria-label','Abrir ou minimizar quests. Arraste para mover.');
fab.setAttribute('aria-expanded','false');
const drawer=D.createElement('section');drawer.id='psy-city-quest-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','Quests atuais');
const head=D.createElement('header');head.className='psy-city-quest-head';
const label=D.createElement('strong');label.textContent='📜 QUESTS ATUAIS';
const close=D.createElement('button');close.type='button';close.textContent='−';close.setAttribute('aria-label','Minimizar quests');
head.append(label,close);drawer.appendChild(head);
D.body.append(fab,drawer);
let opened=false,move=null,suppressClick=false;
function clampPosition(x,y){
 const w=fab.offsetWidth||98,h=fab.offsetHeight||44;
 fab.style.left=Math.max(8,Math.min(Math.max(8,W.innerWidth-w-8),x))+'px';
 fab.style.top=Math.max(80,Math.min(Math.max(80,W.innerHeight-h-8),y))+'px';
}
function positionDrawer(){
 const r=fab.getBoundingClientRect(),w=Math.min(330,W.innerWidth-16),h=Math.min(W.innerHeight*.54,440);
 const x=Math.max(8,Math.min(W.innerWidth-w-8,r.right-w));
 let y=r.bottom+7;if(y+h>W.innerHeight-8)y=Math.max(65,r.top-h-7);
 drawer.style.left=x+'px';drawer.style.top=y+'px';
}
function open(next){
 opened=!!next;drawer.hidden=!opened;fab.setAttribute('aria-expanded',String(opened));
 if(opened)positionDrawer();
}
function restore(){
 let pos;try{pos=JSON.parse(W.localStorage.getItem(KEY)||'null')}catch(_){}
 clampPosition(Number.isFinite(pos?.x)?pos.x:W.innerWidth-121,Number.isFinite(pos?.y)?pos.y:W.innerHeight*.51);
}
fab.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button!==0)return;
 const r=fab.getBoundingClientRect();
 move={id:e.pointerId,x:e.clientX,y:e.clientY,left:r.left,top:r.top,drag:false};
 fab.setPointerCapture?.(e.pointerId);
});
fab.addEventListener('pointermove',e=>{
 if(!move||move.id!==e.pointerId)return;
 const dx=e.clientX-move.x,dy=e.clientY-move.y;
 if(Math.hypot(dx,dy)>7)move.drag=true;
 if(move.drag){clampPosition(move.left+dx,move.top+dy);if(opened)positionDrawer();e.preventDefault()}
});
function finish(e){
 if(!move||move.id!==e.pointerId)return;
 suppressClick=move.drag;
 if(move.drag)try{W.localStorage.setItem(KEY,JSON.stringify({x:parseFloat(fab.style.left),y:parseFloat(fab.style.top)}))}catch(_){}
 move=null;
}
fab.addEventListener('pointerup',finish);
fab.addEventListener('pointercancel',finish);
fab.addEventListener('click',e=>{
 if(suppressClick){suppressClick=false;e.preventDefault();return}
 open(!opened);
});
close.onclick=()=>open(false);
W.addEventListener('resize',()=>{const r=fab.getBoundingClientRect();clampPosition(r.left,r.top);if(opened)positionDrawer()});
restore();
W.PsyCityQuestFloating={
 host:()=>drawer,
 refresh:(cityVisible,questCount)=>{
  const modalOpen=!!D.querySelector('.psy-season-modal:not([hidden]),#psy-halloween-shop:not([hidden])');
  const visible=!!cityVisible&&questCount>0&&!modalOpen&&!D.body.classList.contains('psy-kanto-v2-active')&&!D.body.classList.contains('psy-shell-open');
  fab.hidden=!visible;if(!visible){drawer.hidden=true;return}
  drawer.hidden=!opened;
  if(opened)positionDrawer();
 },
 setOpen:open,
 getPosition:()=>({x:parseFloat(fab.style.left),y:parseFloat(fab.style.top)}),
 isOpen:()=>opened
};
})(window,document);