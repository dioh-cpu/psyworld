/* Grounded directional follower; samples the trainer trail, not a straight-line chase. */
(function(W,D){'use strict';
const player=()=>typeof P!=='undefined'?P:W.P||{};let manifest={},ready=false;const pages=new Map();function pageImage(page,shiny){const key=(shiny?'shiny':'normal')+'-'+page;if(!pages.has(key)){const im=new Image();im.src='assets/followers/pages/'+key+'.webp';pages.set(key,im);if(pages.size>2){const first=pages.keys().next().value;if(first!==key){pages.get(first).src='';pages.delete(first);}}}return pages.get(key);}
if(typeof fetch==='function')fetch('assets/followers/manifest-v47.json').then(r=>r.json()).then(m=>{manifest=m;ready=true;}).catch(()=>{});
// Authored two-pose gaits: light quadruped, heavy biped, small quick-footed rodent.
// Atlas soles end at y=63; retain each sheet's root rather than centering its tail.
const walkProfiles=Object.freeze({
 906:Object.freeze({poseMs:115,scale:1.5,shadowX:9,shadowY:3}),
 909:Object.freeze({poseMs:170,scale:1.65,shadowX:9,shadowY:3.5}),
 921:Object.freeze({poseMs:125,scale:1.45,shadowX:7,shadowY:2.5})
});
const trails=new Map();let serial=0;
// Distance is measured along the player's collision-approved trail, so a
// wider visual gap still follows real turns and cannot cut across obstacles.
const FOLLOWER_TRAIL_DISTANCE=64;
function key(mon){return mon.pokemon_uid||mon.followerKeyV47||(mon.followerKeyV47='partner-'+Date.now().toString(36)+'-'+(++serial));}
function selected(){const p=player(),choice=p.meta?.followerV47;if(!choice?.enabled)return null;return (p.team||[]).find(m=>(m.pokemon_uid||m.followerKeyV47)===choice.key&&Number(m.hp)>0)||null;}
function supported(mon){const entry=manifest[mon.id];return !!entry&&!mon.isMega&&!mon.halloweenForm&&(!mon.shiny||entry.shiny);}
function sample(trail,x,y,scene,valid){
 if(!trail||trail.scene!==scene||Math.hypot(x-trail.last.x,y-trail.last.y)>160){return {scene,last:{x,y},points:[{x,y}],pos:{x,y},facing:'down',moving:false,phase:0};}
 const d=Math.hypot(x-trail.last.x,y-trail.last.y);trail.moving=false;if(d<1)return trail;
 // Retain actual collision-approved positions. Never ease diagonally across a corner.
 const steps=Math.ceil(d/3),from=trail.last;for(let i=1;i<=steps;i++){const point={x:from.x+(x-from.x)*i/steps,y:from.y+(y-from.y)*i/steps};if(!valid||valid(point.x,point.y))trail.points.push(point);}
 trail.last={x,y};let length=0;for(let i=trail.points.length-1;i>0;i--)length+=Math.hypot(trail.points[i].x-trail.points[i-1].x,trail.points[i].y-trail.points[i-1].y);
 while(length>FOLLOWER_TRAIL_DISTANCE&&trail.points.length>1){const next=trail.points[1],old=trail.points.shift(),distance=Math.hypot(next.x-old.x,next.y-old.y);length-=distance;const dx=next.x-trail.pos.x,dy=next.y-trail.pos.y;trail.pos={...next};if(Math.hypot(dx,dy)>.2){trail.facing=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';trail.moving=true;trail.phase+=distance;}}
 if(trail.points.length>180)trail.points.splice(0,trail.points.length-180);return trail;
}
// Quaxly's two authored poses alternate feet; their common sole edge is y=63.
// Keep this clock separate from the collision-approved, distance-based trail.
// The default cadence preserves the approved Quaxly gait exactly.
function quaxlyStep(trail,opt,now,poseMs=140){
 const a=trail.quaxlyAnimation||(trail.quaxlyAnimation={time:now,elapsed:0,active:false,hasMoved:false,lastMotion:now,x:opt.x,y:opt.y});
 if(trail.moving){a.hasMoved=true;a.lastMotion=now;}
 const dt=now-a.time;
 // The trail consumes points in chunks. Continue through those gaps only when
 // the trainer actually advances, after the follower's first step. Repainting
 // the same simulation instant must not restart the cycle.
 const advancing=opt.x!==a.x||opt.y!==a.y;
 // Tile-based maps pause coordinates between steps (up to 160 ms). City
 // also exposes held input across its moving=false tile boundaries. A wall
 // cannot sustain the cycle because only real follower motion renews the grace.
 const continuing=(opt.moving||opt.continuing)&&now-a.lastMotion<=200;
 const active=trail.moving||(a.hasMoved&&((opt.moving&&(advancing||(dt===0&&a.active)))||continuing));
 if(!active||!a.active||dt>250||dt<0)a.elapsed=0;
 else a.elapsed+=dt;
 a.time=now;a.active=active;a.x=opt.x;a.y=opt.y;
 return active?Math.floor(a.elapsed/poseMs)%2:0;
}

// Kanto starter companions: time-based pose alternation, using original authored frames.
// Quaxly's approved function above is intentionally untouched.
const kantoGaits=Object.freeze({
  1:{cadence:165,sole:63,shadow:[9,3]},   // Bulbasaur: deliberate quadruped stride
  4:{cadence:125,sole:62,shadow:[8,3]},   // Charmander: light biped stride
  7:{cadence:145,sole:62,shadow:[8,3]},   // Squirtle: short biped stride
  152:{cadence:170,sole:63,shadow:[10,3]},  // Chikorita
  155:{cadence:145,sole:63,shadow:[8,3]},  // Cyndaquil
  158:{cadence:130,sole:63,shadow:[9,3]},  // Totodile
  252:{cadence:135,sole:63,shadow:[8,3]},  // Treecko
  255:{cadence:150,sole:63,shadow:[7,3]},  // Torchic
  258:{cadence:165,sole:63,shadow:[10,3]},  // Mudkip
  387:{cadence:175,sole:63,shadow:[10,3]},  // Turtwig
  390:{cadence:125,sole:63,shadow:[8,3]},  // Chimchar
  393:{cadence:155,sole:63,shadow:[8,3]},  // Piplup
  495:{cadence:148,sole:63,shadow:[8,3]},  // Snivy
  498:{cadence:165,sole:63,shadow:[10,3]},  // Tepig
  501:{cadence:145,sole:63,shadow:[8,3]},  // Oshawott
  650:{cadence:145,sole:63,shadow:[9,3]},  // Chespin
  653:{cadence:155,sole:63,shadow:[9,3]},  // Fennekin
  656:{cadence:120,sole:63,shadow:[9,3]},  // Froakie
  722:{cadence:175,sole:63,shadow:[8,3]},  // Rowlet
  725:{cadence:150,sole:63,shadow:[10,3]},  // Litten
  728:{cadence:168,sole:63,shadow:[10,3]},  // Popplio
  810:{cadence:145,sole:63,shadow:[8,3]},  // Grookey
  813:{cadence:115,sole:63,shadow:[8,3]},  // Scorbunny
  816:{cadence:158,sole:63,shadow:[8,3]},  // Sobble
  2:{cadence:161,sole:63,shadow:[10,3]},  // Ivysaur
  3:{cadence:192,sole:63,shadow:[13,4]},  // Venusaur
  5:{cadence:132,sole:63,shadow:[9,3]},  // Charmeleon
  6:{cadence:138,sole:63,shadow:[9,3]},  // Charizard
  8:{cadence:166,sole:63,shadow:[10,3]},  // Wartortle
  9:{cadence:198,sole:63,shadow:[13,4]},  // Blastoise
  153:{cadence:166,sole:63,shadow:[10,3]},  // Bayleef
  154:{cadence:198,sole:63,shadow:[13,4]},  // Meganium
  156:{cadence:156,sole:63,shadow:[10,3]},  // Quilava
  157:{cadence:161,sole:63,shadow:[10,3]},  // Typhlosion
  159:{cadence:171,sole:63,shadow:[9,3]},  // Croconaw
  160:{cadence:174,sole:63,shadow:[13,4]},  // Feraligatr
  253:{cadence:132,sole:63,shadow:[10,3]},  // Grovyle
  254:{cadence:138,sole:63,shadow:[10,3]},  // Sceptile
  256:{cadence:156,sole:63,shadow:[9,3]},  // Combusken
  257:{cadence:132,sole:63,shadow:[9,3]},  // Blaziken
  259:{cadence:171,sole:63,shadow:[10,3]},  // Marshtomp
  260:{cadence:174,sole:63,shadow:[13,4]},  // Swampert
  388:{cadence:166,sole:63,shadow:[10,3]},  // Grotle
  389:{cadence:198,sole:63,shadow:[13,4]},  // Torterra
  391:{cadence:144,sole:63,shadow:[9,3]},  // Monferno
  392:{cadence:126,sole:63,shadow:[9,3]},  // Infernape
  394:{cadence:171,sole:63,shadow:[9,3]},  // Prinplup
  395:{cadence:174,sole:63,shadow:[13,4]},  // Empoleon
  496:{cadence:156,sole:63,shadow:[9,3]},  // Servine
  497:{cadence:161,sole:63,shadow:[10,3]},  // Serperior
  499:{cadence:171,sole:63,shadow:[9,3]},  // Pignite
  500:{cadence:174,sole:63,shadow:[13,4]},  // Emboar
  502:{cadence:161,sole:63,shadow:[9,3]},  // Dewott
  503:{cadence:192,sole:63,shadow:[13,4]},  // Samurott
  651:{cadence:156,sole:63,shadow:[9,3]},  // Quilladin
  652:{cadence:186,sole:63,shadow:[13,4]},  // Chesnaught
  654:{cadence:171,sole:63,shadow:[9,3]},  // Braixen
  655:{cadence:151,sole:63,shadow:[10,3]},  // Delphox
  657:{cadence:161,sole:63,shadow:[9,3]},  // Frogadier
  658:{cadence:138,sole:63,shadow:[9,3]},  // Greninja
  723:{cadence:166,sole:63,shadow:[9,3]},  // Dartrix
  724:{cadence:171,sole:63,shadow:[9,3]},  // Decidueye
  726:{cadence:156,sole:63,shadow:[10,3]},  // Torracat
  727:{cadence:186,sole:63,shadow:[13,4]},  // Incineroar
  729:{cadence:171,sole:63,shadow:[9,3]},  // Brionne
  730:{cadence:151,sole:63,shadow:[9,3]},  // Primarina
  811:{cadence:156,sole:63,shadow:[9,3]},  // Thwackey
  812:{cadence:186,sole:63,shadow:[13,4]},  // Rillaboom
  814:{cadence:138,sole:63,shadow:[9,3]},  // Raboot
  815:{cadence:144,sole:63,shadow:[9,3]},  // Cinderace
  817:{cadence:161,sole:63,shadow:[9,3]},  // Drizzile
  818:{cadence:138,sole:63,shadow:[9,3]},  // Inteleon
});
function kantoStep(trail,opt,now,cadence){
 const a=trail.kantoAnimation||(trail.kantoAnimation={time:now,elapsed:0,active:false,hasMoved:false,lastMotion:now,x:opt.x,y:opt.y});
 if(trail.moving){a.hasMoved=true;a.lastMotion=now;}
 const dt=now-a.time,advancing=opt.x!==a.x||opt.y!==a.y;
 const continuing=(opt.moving||opt.continuing)&&now-a.lastMotion<=200;
 const active=trail.moving||(a.hasMoved&&((opt.moving&&(advancing||(dt===0&&a.active)))||continuing));
 if(!active||!a.active||dt>250||dt<0)a.elapsed=0;
 else a.elapsed+=dt;
 a.time=now;a.active=active;a.x=opt.x;a.y=opt.y;
 return active?Math.floor(a.elapsed/cadence)%2:0;
}

function draw(c,opt){if(player().meta?.divineHaloV48){c.save();c.strokeStyle='#dfb0ff';c.shadowColor='#8ef8ff';c.shadowBlur=9;c.lineWidth=1.8;c.beginPath();c.ellipse(opt.x,opt.y+4,22,8,0,0,Math.PI*2);c.stroke();c.restore();}const mon=selected(),trainer=opt.trainer||(()=>{});if(!mon||!supported(mon)){trainer();return;}const k=key(mon)+'@'+opt.scene,old=trails.get(k),trail=sample(old,opt.x,opt.y,opt.scene,opt.valid);trails.set(k,trail);
const quaxly=Number(mon.id)===912,profile=walkProfiles[Number(mon.id)],kantoGait=kantoGaits[Number(mon.id)]||null,grounded=quaxly||!!profile||!!kantoGait;
const timedStep=kantoGait?kantoStep(trail,opt,W.performance.now(),kantoGait.cadence):grounded?quaxlyStep(trail,opt,W.performance.now(),profile?.poseMs):0;
const entry=manifest[mon.id],image=pageImage(entry.page,!!mon.shiny);if(!image.complete||!image.naturalWidth){trainer();return;}
const paint=()=>{let dir=trail.facing||opt.facing||'down',base=dir==='up'?2:dir==='left'||dir==='right'?4:0;const right=dir==='right',separate=right&&entry.frames===8;if(separate)base=6;
const step=grounded?timedStep:trail.moving?([0,1,1,0][Math.floor(trail.phase/11)%4]):0,frame=base+step,p=trail.pos,scale=profile?profile.scale:entry.size>32?.9:1.6,presentationScale=Number.isFinite(Number(opt.scale))?Math.max(.75,Math.min(2,Number(opt.scale))):1;
c.save();c.translate(p.x,p.y+(grounded?5:6));c.scale(presentationScale,presentationScale);c.fillStyle='#0006';c.beginPath();c.ellipse(0,0,quaxly?8:profile?profile.shadowX:kantoGait?kantoGait.shadow[0]:Math.min(18,entry.size*.35),quaxly?3:profile?profile.shadowY:kantoGait?kantoGait.shadow[1]:5,0,0,Math.PI*2);c.fill();if(mon.psyballCaught){c.shadowColor='#69f2ff';c.shadowBlur=9;}c.imageSmoothingEnabled=false;if(right&&!separate)c.scale(-1,1);c.drawImage(image,entry.x+frame*64,entry.y,64,64,-32*scale,-(kantoGait?kantoGait.sole:grounded?63:64)*scale,64*scale,64*scale);c.restore();};
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
