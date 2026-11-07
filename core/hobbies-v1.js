/* PSYWORLD HOBBIES V1 — four independent auxiliary professions.
   All start at Lv.0, no exclusive selection, no trainer level gate.
   Unlock: 10 defeated Pokemon and five unique captured Pokedex registrations
   of qualifying types. Never grant a hobby level from merely opening the panel. */
(function(W,D){
'use strict';
if(W.PsyHobbies)return;
const H=[
 {id:'miner',name:'Minerador',icon:'⛏',art:'miner',types:['Terra','Pedra'],keys:['terra','ground','pedra','rock'],desc:'Extrai minérios, metais e cristais.',color:'#f3bb72'},
 {id:'gardener',name:'Jardineiro',icon:'✿',art:'gardener',types:['Planta','Fada'],keys:['planta','grass','fada','fairy'],desc:'Colhe flores e ervas para criação.',color:'#98edac'},
 {id:'fisher',name:'Pescador',icon:'♒',art:'fisher',types:['Água'],keys:['agua','water'],desc:'Pesca peixes para receitas e ofícios.',color:'#79d8fb'},
 {id:'lumber',name:'Lenhador',icon:'🪓',art:'lumber',types:['Planta','Inseto'],keys:['planta','grass','inseto','bug'],desc:'Corta madeira e recolhe troncos.',color:'#e3b98a'}
];
const ROOT='psy-hobbies';
const player=()=>{try{return typeof P!=='undefined'?P:W.P||{}}catch(_){return W.P||{}}};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function ledger(){const p=player();p.meta=p.meta||{};const h=p.meta.auxHobbiesV1||(p.meta.auxHobbiesV1={});for(const job of H){const x=h[job.id]||(h[job.id]={level:0,xp:0});x.level=Math.max(0,Number(x.level)||0);x.xp=Math.max(0,Number(x.xp)||0)}return h}
function typesFor(id){
 const n=Number(id)||0;let value='';
 try{value=(typeof TYPE_BY_ID_ALL!=='undefined'&&TYPE_BY_ID_ALL?.[n])||W.TYPE_BY_ID_ALL?.[n]||W.TYPE_BY_ID_FULL?.[n]||''}catch(_){}
 return String(value).split(/[\/,|]+/).map(norm).filter(Boolean);
}
function progress(job){
 const p=player(),kills=p.meta?.typeKills||{},dex=p.meta?.caughtDex||{},terms=new Set(job.keys);
 const defeats=Object.entries(kills).reduce((n,[k,v])=>n+(terms.has(norm(k))?Math.max(0,Number(v)||0):0),0);
 let captured=0;
 for(const [id,found] of Object.entries(dex)){if(!found)continue;if(typesFor(id).some(t=>terms.has(t)))captured++;}
 return {defeats,captured,ready:defeats>=10&&captured>=5};
}
function unlock(id){
 const job=H.find(h=>h.id===id);if(!job)return false;
 const x=ledger()[id];if(x.level>0)return true;
 if(!progress(job).ready){W.notif?.('Conclua os dois objetivos para desbloquear este hobby.',2900);return false}
 x.level=1;x.xp=0;
 try{W.autoSave?.()}catch(_){}
 render();W.notif?.(job.name+' desbloqueado! Nível 1.',3000);return true;
}
function addXP(id,quantity=1){
 const x=ledger()[id];if(!x||x.level<1)return false;
 let n=Math.max(0,Number(quantity)||0);x.xp+=n;
 while(x.level<100&&x.xp>=100*x.level){x.xp-=100*x.level;x.level++}
 if(x.level===100)x.xp=0;
 try{W.autoSave?.()}catch(_){}return true;
}
function render(){
 const root=D.getElementById(ROOT);if(!root)return;
 const ledgerData=ledger();
 const grid=root.querySelector('[data-hobbies-grid]');if(!grid)return;
 grid.replaceChildren();
 for(const j of H){
  const x=ledgerData[j.id],p=progress(j),unlocked=x.level>0;
  const card=D.createElement('article');card.className='ph-card';card.style.setProperty('--hobby-accent',j.color);
  const cover=D.createElement('div');cover.className='ph-illustration';
  const img=D.createElement('img');img.src='assets/hobbies/'+j.art+'.svg';img.alt='Ilustração da profissão '+j.name;img.loading='lazy';cover.appendChild(img);
  const tag=D.createElement('span');tag.className='ph-level';tag.textContent='NÍVEL '+x.level;cover.appendChild(tag);
  const body=D.createElement('div');body.className='ph-card-body';
  const title=D.createElement('h3');title.textContent=j.name;body.appendChild(title);
  const desc=D.createElement('p');desc.textContent=j.desc;body.appendChild(desc);
  const subtitle=D.createElement('small');subtitle.textContent='Quest: tipos '+j.types.join(' ou ');body.appendChild(subtitle);
  for(const [name,value,goal]of [['Derrotas',p.defeats,10],['Pokédex (capturados)',p.captured,5]]){
   const line=D.createElement('div');line.className='ph-progress-line';
   const label=D.createElement('span');label.textContent=name+' · '+Math.min(goal,value)+'/'+goal;
   const track=D.createElement('div');track.className='ph-track';
   const fill=D.createElement('i');fill.style.width=(Math.min(100,value/goal*100))+'%';track.appendChild(fill);
   line.append(label,track);body.appendChild(line);
  }
  const action=D.createElement('button');action.type='button';
  if(unlocked){action.textContent='✓ DESBLOQUEADO · NÍVEL '+x.level;action.disabled=true}
  else if(p.ready){action.textContent='DESBLOQUEAR HOBBY';action.onclick=()=>unlock(j.id)}
  else {action.textContent='QUEST EM ANDAMENTO';action.disabled=true}
  body.appendChild(action);
  card.append(cover,body);grid.appendChild(card);
 }
}
function ensure(){
 let root=D.getElementById(ROOT);if(root)return root;
 root=D.createElement('section');root.id=ROOT;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Hobbies - profissões auxiliares');
 root.innerHTML='<div class="ph-shell"><header class="ph-header"><div><small>PSYWORLD · PROFISSÕES AUXILIARES</small><h2>HOBBIES</h2><p>Todos podem aprender os quatro hobbies. Cada um começa no nível 0. Para desbloquear: derrote 10 Pokémon dos tipos indicados e registre 5 espécies desses tipos por captura na Pokédex.</p></div><button type="button" data-hobbies-close aria-label="Fechar Hobbies">×</button></header><div class="ph-grid" data-hobbies-grid></div><p class="ph-foot">As profissões principais continuam separadas e são liberadas após o primeiro Ginásio de Kanto. A mineração, pesca, coleta e corte usam os hobbies correspondentes.</p></div>';
 D.body.appendChild(root);
 root.querySelector('[data-hobbies-close]').onclick=close;
 root.addEventListener('click',e=>{if(e.target===root)close()});
 D.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('show')){e.preventDefault();e.stopImmediatePropagation();close()}},true);
 return root;
}
function open(){ensure();render();D.getElementById(ROOT).classList.add('show')}
function close(){D.getElementById(ROOT)?.classList.remove('show')}
W.PsyHobbies={open,close,unlock,addXP,progress,state:ledger,definitions:H};
})(window,document);