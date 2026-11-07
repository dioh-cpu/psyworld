/* PSYWORLD — HOBBIES V2 (all careers become non-exclusive hobbies).
 * Existing profession inventories and queues remain in saves for compatibility.
 * Level advances are manual; transactions consume actual materials atomically.
 */
(function(W,D){
'use strict';
const RAW=[
 ['miner','Minerador','miner',['Terra','Pedra'],'def',1,'Minério Bruto','Lingote de Mina'],
 ['gardener','Jardineiro','gardener',['Planta','Fada'],'hp',1,'Flor do Campo','Vaso Floral'],
 ['fisher','Pescador','fisher',['Água'],'cap',.5,'Peixe de Rio','Isca de Rio'],
 ['lumber','Lenhador','lumber',['Planta','Inseto'],'atk',1,'Madeira Bruta','Tábuas de Carvalho'],
 ['engineer','Engenheiro','engineer',['Normal'],'cap',.5,'Essência Normal','Normal Ball'],
 ['herbalist','Herborista','herbalist',['Planta'],'hp',1,'Essência Planta','Bálsamo Restaurador'],
 ['researcher','Pesquisador','researcher',['Psíquico'],'xp',1,'Essência Psíquica','Caderno de Pesquisa'],
 ['professor','Professor','professor',['Normal'],'xp',1,'Essência Normal','Guia de Treinamento'],
 ['stylist','Estilista','stylist',['Fada'],'cap',.5,'Essência Fada','Tecido Encantado'],
 ['echo','Tecelão de Ecos','echo',['Fantasma'],'drop',1,'Essência Fantasma','Cristal Harmônico'],
 ['dream','Cartógrafo Onírico','dream',['Psíquico'],'gold',1,'Essência Psíquica','Mapa dos Sonhos'],
 ['twilight','Guardião do Crepúsculo','twilight',['Noturno'],'def',1,'Essência Noturno','Selo Crepuscular'],
 ['alchemist','Alquimista','alchemist',['Fogo','Planta'],'atk',1,'Essência Fogo','Tônico de Ataque']
];
const JOBS=RAW.map(([id,name,art,types,stat,per,material,product])=>({id,name,art,types,stat,per,material,product,starter:['miner','gardener','fisher','lumber'].includes(id)}));
const BALLS=[
 ['Normal','Normal Ball','Essência Normal'],['Fogo','Fire Ball','Essência Fogo'],['Água','Water Ball','Essência Água'],
 ['Planta','Grass Ball','Essência Planta'],['Elétrico','Electric Ball','Essência Elétrica'],['Gelo','Ice Ball','Essência Gelo'],
 ['Lutador','Fighting Ball','Essência Lutador'],['Veneno','Poison Ball','Essência Veneno'],
 ['Terra','Ground Ball','Essência Terra'],['Voador','Flying Ball','Essência Voador'],
 ['Psíquico','Psychic Ball','Essência Psíquica'],['Inseto','Bug Ball','Essência Inseto'],['Pedra','Rock Ball','Essência Pedra'],
 ['Fantasma','Ghost Ball','Essência Fantasma'],['Dragão','Dragon Ball','Essência Dragão'],
 ['Noturno','Dark Ball','Essência Noturno'],['Metal','Steel Ball','Essência Metal'],['Fada','Fairy Ball','Essência Fada']
];
const translate={normal:'normal',ground:'terra',rock:'pedra',grass:'planta',fairy:'fada',water:'agua',fire:'fogo',electric:'eletrico',ice:'gelo',fighting:'lutador',poison:'veneno',flying:'voador',psychic:'psiquico',bug:'inseto',ghost:'fantasma',dragon:'dragao',dark:'noturno',steel:'metal'};
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'');
const key=v=>translate[norm(v)]||norm(v);
const p=()=>{try{return typeof P!=='undefined'?P:W.P||{}}catch(_){return W.P||{}}};
const count=v=>Math.max(0,Math.floor(Number(v)||0));
const find=id=>JOBS.find(j=>j.id===id);
let selected=null;
const root=()=>D.getElementById('psy-hobbies');
function inventory(){const u=p();return u.inventory||(u.inventory={})}
function save(){try{W.autoSave?.();W.updateHUD?.()}catch(_){}}
function state(){
 const u=p();u.meta=u.meta||{};const h=u.meta.auxHobbiesV1||(u.meta.auxHobbiesV1={});
 for(const j of JOBS){
  const x=h[j.id]||(h[j.id]={level:0,xp:0});
  x.level=count(x.level);x.xp=count(x.xp);x.base=x.base||{};
  if(!x.careerMigrated&&u.meta.professionsV1?.jobs?.[j.id]){
   const prev=u.meta.professionsV1.jobs[j.id];x.level=Math.max(x.level,count(prev.level));x.xp=Math.max(x.xp,count(prev.xp));x.careerMigrated=true;
  }
 }
 return h;
}
function typesFor(id){
 const raw=W.psyHobbyTypesForId?.(Number(id))||W.TYPE_BY_ID_ALL?.[Number(id)]||'';
 return (Array.isArray(raw)?raw:String(raw).split(/[\/,|]+/)).map(key).filter(Boolean);
}
function kills(type){
 const u=p(),k=key(type),stats=u.meta?.hobbyTypeKillsV2||{},old=u.meta?.typeKills||{};
 let total=count(stats[k]);for(const [name,n]of Object.entries(old))if(key(name)===k)total=Math.max(total,count(n));return total;
}
function defeated(types){return types.reduce((a,t)=>a+kills(t),0)}
function captured(types){
 const target=new Set(types.map(key));let total=0;
 for(const [id,owned]of Object.entries(p().meta?.caughtDex||{}))if(owned&&typesFor(id).some(t=>target.has(t)))total++;
 return total;
}
function unlockProgress(j){return {defeats:defeated(j.types),caught:captured(j.types),
 ready:j.starter?defeated(j.types)>=10&&captured(j.types)>=5:!!p().gymProgress?.includes('kanto_brock')}}
function unlock(id){
 const j=find(id),x=state()[id];if(!j||!x)return false;if(x.level>0)return true;
 if(!unlockProgress(j).ready){W.notif?.('Conclua a quest de desbloqueio.',2500);return false}
 x.level=1;x.xp=0;
 if(id==='engineer'&&BALLS[1])x.base[key(BALLS[1][0])]=kills(BALLS[1][0]);
 for(const t of j.types)x.base[key(t)]=kills(t);
 save();render();return true;
}
const xpNeed=x=>100*Math.max(1,x.level);
function levelRequirements(id){
 const j=find(id),x=state()[id];if(!j||!x?.level||x.level>=100)return {ready:false};
 const ball=id==='engineer'?BALLS[x.level]:null;
 const material=ball?ball[2]:j.material,need=ball?100:Math.max(10,10*x.level);
 const t=ball?ball[0]:j.types[0],won=Math.max(0,kills(t)-count(x.base[key(t)])),caught=captured([t]),available=count(inventory()[material]);
 return {material,need,available,defeats:won,captured:caught,xp:x.xp,xpRequired:xpNeed(x),
  ball:ball?.[1],type:t,ready:available>=need&&x.xp>=xpNeed(x)&&(id!=='engineer'||won>=100&&caught>=5)};
}
function levelUp(id){
 const j=find(id),x=state()[id],req=levelRequirements(id);if(!j||!x||!req.ready)return false;
 const inv=inventory();if(count(inv[req.material])<req.need)return false;
 inv[req.material]-=req.need;x.xp-=xpNeed(x);x.level++;
 if(id==='engineer'&&BALLS[x.level])x.base[key(BALLS[x.level][0])]=kills(BALLS[x.level][0]);
 else for(const t of j.types)x.base[key(t)]=kills(t);
 save();render();W.notif?.('Novo nível em '+j.name+'!',2500);return true;
}
function addXP(id,amount){const x=state()[id];if(!x?.level)return false;x.xp+=Math.min(1000,count(amount));save();return true}
function recordKill(id){const u=p();u.meta=u.meta||{};const h=u.meta.hobbyTypeKillsV2||(u.meta.hobbyTypeKillsV2={});for(const t of new Set(typesFor(id)))h[t]=count(h[t])+1}
function exchangePlan(id,ballIndex){
 const j=find(id),x=state()[id];if(!j||!x?.level)return null;
 if(id==='engineer'){const i=Number(ballIndex);if(!Number.isInteger(i)||i<0||i>=x.level||i>=BALLS.length)return null;
  const b=BALLS[i];return {out:b[1],inputs:{[b[2]]:2}};
 }
 if(id==='gardener')return {out:'Vaso Floral',inputs:{'Flor do Campo':3,'Essência Planta':2,'Essência Fada':2}};
 if(id==='alchemist')return {out:'Tônico de Ataque',inputs:{'Essência Fogo':5,'Essência Planta':3}};
 if(id==='herbalist')return {out:'Bálsamo Restaurador',inputs:{'Essência Planta':4}};
 return {out:j.product,inputs:{[j.material]:Math.max(2,Math.ceil(x.level/3))}};
}
function exchange(id,index){
 const plan=exchangePlan(id,index),inv=inventory();if(!plan)return false;
 if(Object.entries(plan.inputs).some(([a,q])=>count(inv[a])<q)){W.notif?.('Faltam materiais para a troca.',2200);return false}
 for(const [a,q]of Object.entries(plan.inputs))inv[a]-=q;
 inv[plan.out]=count(inv[plan.out])+1;
 addXP(id,id==='engineer'?10:12);save();render();return true;
}
function healMultiplier(){return 1+Math.min(.5,count(state().herbalist?.level)*.015)}
function bonus(stat){
 const k=({capture:'cap',damage:'atk',health:'hp'})[stat]||stat;
 let value=0;for(const j of JOBS)if(j.stat===k)value+=count(state()[j.id].level)*j.per;
 for(const v of Object.values(p().meta?.hobbyBuffsV2||{}))if(v.kind===k&&v.until>Date.now())value+=count(v.amount);
 return Math.min(100,value);
}
function useConsumable(name){
 const config={'Tônico de Ataque':{kind:'atk',amount:12},'Bálsamo Restaurador':{kind:'hp',amount:10}};
 const conf=config[name],inv=inventory();if(!conf||count(inv[name])<1)return false;
 inv[name]--;p().meta.hobbyBuffsV2=p().meta.hobbyBuffsV2||{};
 p().meta.hobbyBuffsV2[name]={...conf,until:Date.now()+15*60*1000};
 save();render();return true;
}
function field(){const u=p();u.meta=u.meta||{};const s=u.meta.hobbyGatherV2||(u.meta.hobbyGatherV2={nodes:{},decor:[]});s.nodes=s.nodes||{};s.decor=s.decor||[];return s}
const FIELD={
 'route-1':[
  ['f1','gardener',276,301,'Flor do Campo'],['f2','gardener',411,296,'Flor do Campo'],['f3','gardener',605,250,'Flor do Campo'],
  ['t1','lumber',521,280,'Madeira Bruta']],
 'route-cave':[['o1','miner',260,374,'Minério Bruto'],['o2','miner',390,370,'Minério Bruto']]
};
function visibleNodes(scene){
 const now=Date.now(),nodes=field().nodes;
 return (FIELD[scene]||[]).filter(([id])=>count(nodes[scene+':'+id]?.respawnAt)<=now)
 .map(([id,kind,x,y,item])=>({id,kind,x,y,item,hits:count(nodes[scene+':'+id]?.hits)}));
}
function nearby(scene,pos,radius=65){
 let found=null,dist=radius;for(const node of visibleNodes(scene)){const d=Math.hypot(pos.x-node.x,pos.y-node.y);if(d<dist){found=node;dist=d}}return found;
}
function collect(scene,id){
 const node=visibleNodes(scene).find(v=>v.id===id);if(!node)return false;
 if(!state()[node.kind]?.level){W.notif?.('Primeiro desbloqueie '+find(node.kind).name+' em Hobbies.',2500);return false}
 const f=field(),record=f.nodes[scene+':'+id]||{},hit=node.kind==='miner'||node.kind==='lumber'?count(record.hits)+1:5;
 if(hit<5){f.nodes[scene+':'+id]={hits:hit,respawnAt:0};save();W.notif?.('Progresso de coleta: '+hit+'/5',1200);return true}
 f.nodes[scene+':'+id]={hits:0,respawnAt:Date.now()+(3+Math.random()*5)*60000};
 const inv=inventory();inv[node.item]=count(inv[node.item])+1;addXP(node.kind,16);
 W.psyHobbyGrantFieldXp?.(18,8);
 save();W.notif?.(node.item+' coletado! +XP para Hobby, Pokémon e Treinador.',2500);return true;
}
function drawField(c,scene){
 for(const a of visibleNodes(scene)){
  c.save();c.translate(a.x,a.y);const t=1-a.hits*.16;c.scale(t,t);
  c.fillStyle=a.kind==='miner'?'#79def5':a.kind==='gardener'?'#fface2':'#ad784a';c.strokeStyle='#fff1c7';c.lineWidth=2;
  c.beginPath();
  if(a.kind==='miner'){c.moveTo(-16,7);c.lineTo(-11,-16);c.lineTo(1,-30);c.lineTo(17,-2);c.lineTo(12,9);c.closePath()}
  else if(a.kind==='lumber'){c.rect(-12,-28,24,35)}
  else{for(let i=0;i<6;i++){const an=i*Math.PI/3;c.moveTo(0,-10);c.ellipse(Math.sin(an)*11,Math.cos(an)*11-10,7,10,an,0,Math.PI*2)}}
  c.fill();c.stroke();c.restore();
 }
}
function decorate(name){
 if(count(inventory()[name])<1)return false;
 field().placing=name;close();W.notif?.('Entre na sua casa e toque no lugar para posicionar '+name+'.',3200);return true;
}
function place(room,x,y,bounds){
 const f=field();if(!['home','house-east','house-west'].includes(room)||!f.placing||count(inventory()[f.placing])<1)return false;
 f.decor.push({room,id:f.placing,x:Math.max(25,Math.min(bounds.w-25,x)),y:Math.max(170,Math.min(bounds.h-30,y))});
 inventory()[f.placing]--;f.placing=null;save();return true;
}
function decorAt(room,x,y){const decor=field().decor;for(let i=decor.length-1;i>=0;i--)if(decor[i].room===room&&Math.hypot(decor[i].x-x,decor[i].y-y)<30)return i;return -1}
function moveDecor(i,x,y,b){const d=field().decor[i];if(!d)return false;d.x=Math.max(25,Math.min(b.w-25,x));d.y=Math.max(170,Math.min(b.h-30,y));save();return true}
function drawDecor(c,room){
 for(const a of field().decor.filter(v=>v.room===room)){
  c.save();c.translate(a.x,a.y);c.fillStyle='#517558';c.fillRect(-10,-6,20,15);
  for(let i=0;i<6;i++){const t=i*Math.PI/3;c.fillStyle='#efa6d2';c.beginPath();c.ellipse(Math.sin(t)*10,-19+Math.cos(t)*10,7,5,t,0,Math.PI*2);c.fill()}
  c.fillStyle='#ffde90';c.beginPath();c.arc(0,-19,5,0,Math.PI*2);c.fill();c.restore();
 }
}
let overlay;
function button(text,click,disabled){const b=D.createElement('button');b.type='button';b.textContent=text;b.disabled=!!disabled;if(click)b.onclick=click;return b}
function para(parent,text){const e=D.createElement('p');e.textContent=text;parent.appendChild(e)}
function ensure(){
 if(root())return root();
 const el=D.createElement('section');el.id='psy-hobbies';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML='<div class="ph-shell"><header class="ph-header"><div><small>PSYWORLD · ATIVIDADES DO TREINADOR</small><h2>HOBBIES</h2><p>Todos podem aprender todos os Hobbies. Toque na imagem para abrir suas trocas e sua evolução.</p></div><button data-hobbies-close type="button" aria-label="Fechar">×</button></header><div class="ph-grid" data-hobbies-grid></div><div data-hobby-details hidden></div><p class="ph-foot">Trocas exclusivas por Hobby substituem o Craft e as antigas profissões.</p></div>';
 D.body.appendChild(el);el.querySelector('[data-hobbies-close]').onclick=close;
 el.addEventListener('click',e=>{if(e.target===el)close()});
 D.addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('show')){e.stopImmediatePropagation();if(selected){selected=null;render()}else close()}},true);
 return el;
}
function render(){
 const el=ensure(),grid=el.querySelector('[data-hobbies-grid]'),details=el.querySelector('[data-hobby-details]');grid.replaceChildren();details.replaceChildren();
 grid.hidden=!!selected;details.hidden=!selected;const records=state();
 if(!selected){
  for(const j of JOBS){
   const x=records[j.id],card=D.createElement('article');card.className='ph-card';
   const cover=button('',()=>openDetail(j.id));cover.className='ph-illustration ph-select';cover.setAttribute('aria-label','Abrir '+j.name);
   const img=D.createElement('img');img.src='assets/hobbies/'+j.art+'.svg';img.alt=j.name;img.loading='lazy';cover.appendChild(img);
   const tag=D.createElement('span');tag.className='ph-level';tag.textContent='LV. '+x.level;cover.appendChild(tag);
   const body=D.createElement('div');body.className='ph-card-body';const title=D.createElement('h3');title.textContent=j.name;body.appendChild(title);
   para(body,x.level?'Status: +'+(x.level*j.per).toFixed(1)+'% '+j.stat:(j.starter?'Quest: 10 derrotas + 5 capturas':'Desbloqueio após Brock'));
   body.appendChild(button('ABRIR HOBBY',()=>openDetail(j.id)));card.append(cover,body);grid.appendChild(card);
  }
  return;
 }
 const j=find(selected),x=records[selected];if(!j){selected=null;render();return}
 details.appendChild(button('← VOLTAR A TODOS OS HOBBIES',()=>{selected=null;render()}));
 const header=D.createElement('div');header.className='ph-detail-head';
 const img=D.createElement('img');img.src='assets/hobbies/'+j.art+'.svg';img.alt=j.name;header.appendChild(img);
 const h=D.createElement('div'),name=D.createElement('h3');name.textContent=j.name+' • Nível '+x.level;h.appendChild(name);
 para(h,'Bônus +'+(x.level*j.per).toFixed(1)+'% '+j.stat+' • XP '+x.xp+'/'+xpNeed(x));header.appendChild(h);details.appendChild(header);
 if(!x.level){
  const pr=unlockProgress(j);
  para(details,j.starter?'Derrotas: '+Math.min(pr.defeats,10)+'/10 • Pokédex: '+Math.min(pr.caught,5)+'/5.':'Vença o primeiro Ginásio de Kanto para liberar.');
  details.appendChild(button(pr.ready?'DESBLOQUEAR HOBBY':'QUEST INCOMPLETA',()=>unlock(j.id),!pr.ready));return;
 }
 const req=levelRequirements(j.id),box=D.createElement('section');box.className='ph-upgrade';
 para(box,'SUBIR DE NÍVEL • Requer XP '+x.xp+'/'+req.xpRequired);
 if(j.id==='engineer'&&req.material)para(box,'Próxima '+req.ball+': '+req.defeats+'/100 derrotas do tipo '+req.type+', '+req.captured+'/5 espécies capturadas, '+req.available+'/100 '+req.material,box);
 else if(req.material)para(box,req.available+'/'+req.need+' '+req.material);
 box.appendChild(button('SUBIR DE NÍVEL',()=>levelUp(j.id),!req.ready));details.appendChild(box);
 const title=D.createElement('h3');title.textContent='TROCAS EXCLUSIVAS';details.appendChild(title);
 const rows=j.id==='engineer'?BALLS.map((b,i)=>({plan:exchangePlan(j.id,i),label:b[1]+' • Lv.'+(i+1),index:i})):
 [{plan:exchangePlan(j.id),label:j.product}];
 for(const row of rows){
  const div=D.createElement('section');div.className='ph-exchange';
  para(div,row.label);if(row.plan)para(div,Object.entries(row.plan.inputs).map(([k,q])=>q+' '+k+' (possui '+count(inventory()[k])+')').join(' + '));
  div.appendChild(button(j.id==='engineer'?'FABRICAR BALL':'TROCAR MATERIAIS',()=>exchange(j.id,row.index),!row.plan));
  details.appendChild(div);
 }
 if(j.id==='gardener'||j.id==='lumber')details.appendChild(button('DECORAR MINHA HOUSE',()=>decorate(j.product),count(inventory()[j.product])<1));
 if(j.id==='alchemist'||j.id==='herbalist')details.appendChild(button('USAR '+j.product,()=>useConsumable(j.product),count(inventory()[j.product])<1));
}
function open(){selected=null;ensure();render();root().classList.add('show')}
function openDetail(id){if(!find(id))return false;selected=id;ensure();render();root().classList.add('show');root().querySelector('.ph-shell').scrollTop=0;return true}
function close(){root()?.classList.remove('show');selected=null}
W.PsyHobbies={open,openDetail,close,unlock,levelUp,levelRequirements,exchange,addXP,recordKill,state,definitions:JOBS,ballLadder:BALLS,unlockProgress,healMultiplier,bonus,useConsumable,visibleNodes,nearby,collect,drawField,place,decorAt,moveDecor,drawDecor,decorate,field};
})(window,document);
