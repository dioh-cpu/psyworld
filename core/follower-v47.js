/* Grounded directional follower; samples the trainer trail, not a straight-line chase. */
(function(W,D){'use strict';
const player=()=>typeof P!=='undefined'?P:W.P||{};let manifest={},ready=false;const pages=new Map();function pageImage(page,shiny){const key=(shiny?'shiny':'normal')+'-'+page;if(!pages.has(key)){const im=new Image();im.src='assets/followers/pages/'+key+'.webp';pages.set(key,im);if(pages.size>2){const first=pages.keys().next().value;if(first!==key){pages.get(first).src='';pages.delete(first);}}}return pages.get(key);}
if(typeof fetch==='function')fetch('assets/followers/manifest-v47.json').then(r=>r.json()).then(m=>{manifest=m;ready=true;}).catch(()=>{});
const trails=new Map();let serial=0;
function key(mon){return mon.pokemon_uid||mon.followerKeyV47||(mon.followerKeyV47='partner-'+Date.now().toString(36)+'-'+(++serial));}
function selected(){const p=player(),choice=p.meta?.followerV47;if(!choice?.enabled)return null;return (p.team||[]).find(m=>(m.pokemon_uid||m.followerKeyV47)===choice.key&&Number(m.hp)>0)||null;}
function supported(mon){const entry=manifest[mon.id];return !!entry&&!mon.isMega&&!mon.halloweenForm&&(!mon.shiny||entry.shiny);}
function sample(trail,x,y,scene,valid){
 if(!trail||trail.scene!==scene||Math.hypot(x-trail.last.x,y-trail.last.y)>160){return {scene,last:{x,y},points:[{x,y}],pos:{x,y},facing:'down',moving:false,phase:0};}
 const d=Math.hypot(x-trail.last.x,y-trail.last.y);trail.moving=false;if(d<1)return trail;
 // Retain actual collision-approved positions. Never ease diagonally across a corner.
 const steps=Math.ceil(d/3),from=trail.last;for(let i=1;i<=steps;i++){const point={x:from.x+(x-from.x)*i/steps,y:from.y+(y-from.y)*i/steps};if(!valid||valid(point.x,point.y))trail.points.push(point);}
 trail.last={x,y};let length=0;for(let i=trail.points.length-1;i>0;i--)length+=Math.hypot(trail.points[i].x-trail.points[i-1].x,trail.points[i].y-trail.points[i-1].y);
 while(length>34&&trail.points.length>1){const next=trail.points[1],old=trail.points.shift(),distance=Math.hypot(next.x-old.x,next.y-old.y);length-=distance;const dx=next.x-trail.pos.x,dy=next.y-trail.pos.y;trail.pos={...next};if(Math.hypot(dx,dy)>.2){trail.facing=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';trail.moving=true;trail.phase+=distance;}}
 if(trail.points.length>180)trail.points.splice(0,trail.points.length-180);return trail;
}
function draw(c,opt){if(player().meta?.divineHaloV48){c.save();c.strokeStyle='#dfb0ff';c.shadowColor='#8ef8ff';c.shadowBlur=9;c.lineWidth=1.8;c.beginPath();c.ellipse(opt.x,opt.y+4,22,8,0,0,Math.PI*2);c.stroke();c.restore();}const mon=selected(),trainer=opt.trainer||(()=>{});if(!mon||!supported(mon)){trainer();return;}const k=key(mon)+'@'+opt.scene,old=trails.get(k),trail=sample(old,opt.x,opt.y,opt.scene,opt.valid);trails.set(k,trail);
const entry=manifest[mon.id],image=pageImage(entry.page,!!mon.shiny);if(!image.complete||!image.naturalWidth){trainer();return;}
const paint=()=>{let dir=trail.facing||opt.facing||'down',base=dir==='up'?2:dir==='left'||dir==='right'?4:0;const right=dir==='right',separate=right&&entry.frames===8;if(separate)base=6;
const step=trail.moving?([0,1,1,0][Math.floor(trail.phase/11)%4]):0,frame=base+step,p=trail.pos,scale=entry.size>32?.9:1.6;
c.save();c.translate(p.x,p.y+6);c.fillStyle='#0006';c.beginPath();c.ellipse(0,0,Math.min(18,entry.size*.35),5,0,0,Math.PI*2);c.fill();if(mon.psyballCaught){c.shadowColor='#69f2ff';c.shadowBlur=9;}c.imageSmoothingEnabled=false;if(right&&!separate)c.scale(-1,1);c.drawImage(image,entry.x+frame*64,entry.y,64,64,-32*scale,-64*scale,64*scale,64*scale);c.restore();};
if(trail.pos.y<=opt.y){paint();trainer();}else{trainer();paint();}
}
function choose(){D.getElementById('psy-follower-menu')?.remove();const root=D.createElement('section');root.id='psy-follower-menu';root.className='psy-session-modal';root.setAttribute('role','dialog');root.setAttribute('aria-label','Escolher Pokémon acompanhante');const card=D.createElement('div');root.appendChild(card);const title=D.createElement('h2');title.textContent='Seu parceiro de jornada';card.appendChild(title);const help=D.createElement('p');help.textContent='Escolha um Pokémon vivo do time para caminhar atrás de você. A seleção visual não troca o líder da batalha. Ele segue seus passos, para junto e acompanha as mudanças de direção.';card.appendChild(help);
const label=D.createElement('label');label.textContent='Pokémon acompanhante';const select=D.createElement('select');select.setAttribute('aria-label','Pokémon acompanhante');const off=D.createElement('option');off.value='';off.textContent='Nenhum acompanhante';select.appendChild(off);
for(const mon of player().team||[]){const option=D.createElement('option');option.value=key(mon);option.textContent=(mon.shiny?'Shiny ':'')+mon.name+' · Nv '+mon.level+(Number(mon.hp)<=0?' · precisa de cura':!supported(mon)?ready?' · arte desta forma indisponível':' · carregando arte':'');option.disabled=Number(mon.hp)<=0||!supported(mon);select.appendChild(option);}select.value=player().meta?.followerV47?.enabled?player().meta.followerV47.key:'';label.appendChild(select);card.appendChild(label);
const close=D.createElement('button');close.textContent='Cancelar';close.onclick=()=>root.remove();card.appendChild(close);const confirm=D.createElement('button');confirm.textContent='Confirmar acompanhante';confirm.onclick=()=>{const p=player();p.meta=p.meta||{};p.meta.followerV47={enabled:!!select.value,key:select.value};trails.clear();W.autoSave?.();root.remove();};card.appendChild(confirm);D.body.appendChild(root);
}
const launch=D.createElement('button');launch.id='psy-follower-launch';launch.textContent='♧ Acompanhante';launch.setAttribute('aria-label','Escolher Pokémon acompanhante');launch.onclick=choose;D.body.appendChild(launch);W.setInterval(()=>{launch.hidden=!player().team?.length||(typeof inBattle!=='undefined'&&inBattle);},700);
W.PsyFollower={draw,choose,sample,selected,supported,manifest:()=>manifest,clear:()=>trails.clear()};
})(window,document);
