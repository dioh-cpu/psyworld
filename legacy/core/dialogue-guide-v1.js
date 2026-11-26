/* Shared anchored dialogue and tutorial guide. */
(function(W,D){
'use strict';
let root,card,spot,arrow,current,scheduled=0,previousFocus;
const mascot='assets/psyduck/normal.png';
function ensure(){
 if(root)return;
 const style=D.createElement('style');style.textContent=`
#psy-guide{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:system-ui}
#psy-guide[hidden]{display:none!important}
#psy-guide-spot{position:fixed;border:2px solid #98edf0;border-radius:14px;box-shadow:0 0 0 250vmax #03091bc4,0 0 24px #68dcff88;pointer-events:none}
#psy-guide-arrow{position:fixed;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
#psy-guide-card{position:fixed;box-sizing:border-box;width:min(590px,calc(100vw - 24px));border:1px solid #be9d6b;border-radius:20px;background:linear-gradient(145deg,#14283afc,#22183dfc);box-shadow:0 16px 50px #0009;color:#f3f6ff;padding:18px;pointer-events:auto;max-height:calc(100dvh - 24px);overflow-y:auto}
#psy-guide-card .pg-copy{display:grid;grid-template-columns:92px minmax(0,1fr);gap:15px;align-items:center}
#psy-guide-card .pg-portrait{width:92px;height:114px;background-repeat:no-repeat;background-position:center;background-size:contain;filter:drop-shadow(0 5px 5px #0008)}
#psy-guide-card h3{margin:0 0 7px;color:#8ae8ed;font-size:16px}
#psy-guide-card p{margin:0;font-size:15px;line-height:1.55;white-space:pre-line}
#psy-guide-card .pg-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:15px}
#psy-guide-card button{min-height:42px;padding:9px 14px;border:1px solid #7e9ba5;border-radius:11px;background:#223f55;color:#fff;font:bold 12px system-ui;cursor:pointer}
#psy-guide-card button.primary{background:linear-gradient(110deg,#16777d,#4456a1);border-color:#96ded7}
#psy-guide-card button:focus-visible{outline:3px solid #f7d68a;outline-offset:2px}
@media(max-width:600px){#psy-guide-card{padding:13px;border-radius:16px}#psy-guide-card .pg-copy{grid-template-columns:66px minmax(0,1fr);gap:10px}#psy-guide-card .pg-portrait{width:66px;height:92px}#psy-guide-card p{font-size:13px;line-height:1.5}#psy-guide-card h3{font-size:14px}}
@media(prefers-reduced-motion:no-preference){#psy-guide-card{animation:pg-appear .18s ease-out}@keyframes pg-appear{from{opacity:0}to{opacity:1}}}
`;D.head.appendChild(style);
 root=D.createElement('div');root.id='psy-guide';root.hidden=true;
 root.innerHTML='<div id="psy-guide-spot"></div><svg id="psy-guide-arrow" aria-hidden="true"><defs><marker id="pg-arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#a3f0ef"/></marker></defs><path data-arrow fill="none" stroke="#a3f0ef" stroke-width="3" stroke-linecap="round" marker-end="url(#pg-arrowhead)"/></svg><section id="psy-guide-card" role="dialog" aria-modal="true" aria-labelledby="pg-speaker"><div class="pg-copy"><div class="pg-portrait" role="img"></div><div><h3 id="pg-speaker"></h3><p></p></div></div><div class="pg-actions"></div></section>';
 D.body.appendChild(root);card=root.querySelector('#psy-guide-card');spot=root.querySelector('#psy-guide-spot');arrow=root.querySelector('[data-arrow]');
}
function targetRect(){
 let target=typeof current?.target==='function'?current.target():typeof current?.target==='string'?D.querySelector(current.target):current?.target;
 if(target?.getBoundingClientRect){if(!target.getClientRects().length)return null;const canvas=target.tagName==='CANVAS';target=target.getBoundingClientRect();if(canvas){const x=(target.left+target.right)/2,y=(target.top+target.bottom)/2;target={left:x-32,right:x+32,top:y-48,bottom:y+24};}}
 if(!target||!Number.isFinite(target.left))return null;return target;
}
function place(){
 scheduled=0;if(!current||root.hidden)return;
 const vv=W.visualViewport,left=vv?.offsetLeft||0,top=vv?.offsetTop||0,width=vv?.width||W.innerWidth,height=vv?.height||W.innerHeight;
 card.style.width=Math.min(590,width-24)+'px';card.style.maxHeight=(height-24)+'px';
 const t=targetRect(),h=card.offsetHeight,w=card.offsetWidth,margin=12;
 let x=left+(width-w)/2,y=top+height-h-margin;
 const visible=t&&t.right>left&&t.left<left+width&&t.bottom>top&&t.top<top+height;
 if(visible){
  const below=top+height-t.bottom-margin,above=t.top-top-margin;
  y=below>=h+30?t.bottom+30:above>=h+30?t.top-h-30:top+height-h-margin;
  const l=Math.max(left+4,t.left-7),tt=Math.max(top+4,t.top-7),r=Math.min(left+width-4,t.right+7),b=Math.min(top+height-4,t.bottom+7);
  Object.assign(spot.style,{left:l+'px',top:tt+'px',width:Math.max(8,r-l)+'px',height:Math.max(8,b-tt)+'px'});
  const targetX=Math.max(left+12,Math.min(left+width-12,(t.left+t.right)/2));
  const targetY=y>=t.bottom?t.bottom+4:t.top-4,startY=y>=t.bottom?y:y+h;
  arrow.setAttribute('d','M '+(x+w*.65)+' '+startY+' Q '+targetX+' '+((startY+targetY)/2)+' '+targetX+' '+targetY);arrow.style.display='';
 }else{Object.assign(spot.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px',border:'0'});arrow.style.display='none';}
 card.style.left=x+'px';card.style.top=Math.max(top+margin,Math.min(top+height-h-margin,y))+'px';
}
const schedule=()=>{if(!scheduled)scheduled=W.requestAnimationFrame(place)};
function close(){
 if(!current)return;const old=current;current=null;root.hidden=true;
 W.removeEventListener('resize',schedule);W.removeEventListener('scroll',schedule,true);W.visualViewport?.removeEventListener('resize',schedule);
 if(scheduled)W.cancelAnimationFrame(scheduled);scheduled=0;
 old.onClose?.();previousFocus?.focus?.();
}
function show(options){
 ensure();if(current)close();previousFocus=D.activeElement;current=options;root.hidden=false;
 card.querySelector('h3').textContent=options.speaker||'Psyduck · Seu guia';
 card.querySelector('p').textContent=options.text||'';
 const portrait=card.querySelector('.pg-portrait');portrait.style.backgroundImage='url("'+(options.portrait||mascot).replace(/"/g,'')+'")';
 portrait.style.backgroundSize=options.sheet==='brock'?'400% 100%':options.sheet==='professor'?'200% 200%':(!options.portrait||options.portrait===mascot)?'400% 600%':'contain';
 portrait.style.backgroundPosition=(options.sheet||!options.portrait||options.portrait===mascot)?'left top':'center';
 portrait.setAttribute('aria-label',options.speaker||'Psyduck');
 const actions=card.querySelector('.pg-actions');actions.replaceChildren();
 (options.actions?.length?options.actions:[{text:'CONTINUAR'}]).forEach(a=>{
  const b=D.createElement('button');b.type='button';b.textContent=a.text;b.className=a.primary?'primary':'';
  b.onclick=()=>{close();a.run?.();};actions.appendChild(b);
 });
 W.addEventListener('resize',schedule);W.addEventListener('scroll',schedule,true);W.visualViewport?.addEventListener('resize',schedule);
 spot.style.border='2px solid #98edf0';place();actions.querySelector('button')?.focus();
}
function tutorial(steps,index=0){
 const step=steps[index];if(!step)return;
 step.prepare?.();
 const actions=[{text:'PULAR TUTORIAL',run:()=>step.finish?.()}];
 if(index)actions.push({text:'← VOLTAR',run:()=>tutorial(steps,index-1)});
 actions.push({text:index===steps.length-1?'CONCLUIR':'CONTINUAR →',primary:true,run:()=>{if(index<steps.length-1)tutorial(steps,index+1);else step.finish?.();}});
 show({...step,speaker:step.speaker||'Psyduck · Seu guia',actions});
}
D.addEventListener('keydown',e=>{if(e.key==='Escape'&&current){e.preventDefault();e.stopImmediatePropagation();if(!current.required)close();}},true);
W.PsyGuide={show,close,tutorial,isOpen:()=>!!current,mascot};
})(window,document);
