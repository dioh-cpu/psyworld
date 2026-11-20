/* PSYWORLD — Crystal Grotto treasure hunting. Server-authoritative rewards online. */
(function(W,D){
'use strict';
if(W.PsyTreasureHuntV1)return;
const PLAYER=()=>W.P||null, n=v=>Math.max(0,Math.floor(Number(v)||0)), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MAX_LEVEL=100, SITE_HITS=5, STONES=['Heart Stone','Crystal Stone','Earth Stone','Rock Stone'];
const HUNTER_SKILLS=[
 {id:'radar',name:'Ressonância Mineral',max:3,min:2,requires:[],description:'Melhora a chance de encontrar baús acima do comum.'},
 {id:'keen',name:'Olho de Geólogo',max:3,min:4,requires:['radar'],description:'Amplia a descoberta de fragmentos e pedras nas rachaduras.'},
 {id:'trail',name:'Trilha Revelada',max:1,min:5,requires:['radar'],description:'Revela uma rachadura de tesouro adicional na Rota 1.'},
 {id:'deep',name:'Veio Profundo',max:3,min:8,requires:['keen','trail'],description:'Aumenta gradualmente a chance de baús épicos e relíquia.'}
];
const LOOTER_SKILLS=[
 {id:'appraiser',name:'Avaliação de Relíquias',max:3,min:2,requires:[],description:'Recebe mais XP ao abrir baús.'},
 {id:'collector',name:'Mão Experiente',max:3,min:4,requires:['appraiser'],description:'Pequena chance de encontrar uma recompensa adicional em baús.'},
 {id:'rollluck',name:'Destino Favorável',max:3,min:8,requires:['collector'],description:'Melhora as probabilidades raras do Treasure Roll.'},
 {id:'connoisseur',name:'Relicário Antigo',max:1,min:10,requires:['rollluck'],description:'Aumenta a chance de obter o traje do Caçador de Recompensas.'}
];
const local=()=>{const p=PLAYER();if(!p)return null;p.meta=p.meta||{};return p.meta.treasureHuntV1||(p.meta.treasureHuntV1={hobbies:{treasureHunter:{level:0,xp:0,points:0,skills:{}},looter:{level:0,xp:0,points:0,skills:{}}},sites:{},chests:{},stats:{digs:0,chestsOpened:0},psycoinTenths:0,cosmetic:{bountyHunter:false,equipped:false},titles:{}})};
const hobbyState=id=>{const s=local();if(!s)return {level:0,xp:0,points:0,skills:{}};s.hobbies=s.hobbies||{};return s.hobbies[id]||(s.hobbies[id]={level:0,xp:0,points:0,skills:{}})};
const syncHobbies=()=>{const p=PLAYER(),s=local();if(!p||!s)return;p.meta.auxHobbiesV1=p.meta.auxHobbiesV1||{};for(const id of ['treasureHunter','looter']){const h=s.hobbies[id]||{};p.meta.auxHobbiesV1[id]={...(p.meta.auxHobbiesV1[id]||{}),level:n(h.level),xp:n(h.xp),base:{}}}};
function save(){syncHobbies();try{W.autoSave?.();W.updateHUD?.()}catch(_){}}
function isOnline(){try{return !!W.psyOnlineAuthorityV26?.online?.()}catch(_){return false}}
function key(){return 'treasure:'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,12)}
let authorityReady=false,authorityOnlineProbe=false;
function isAvailable(){
 if(!isOnline()){authorityReady=false;authorityOnlineProbe=false;return true}
 if(!authorityOnlineProbe){authorityOnlineProbe=true;Promise.resolve().then(()=>refresh()).catch(()=>{authorityReady=false;refreshHobbyView()})}
 return authorityReady;
}
function refreshHobbyView(){if(W.PsyHobbies?.isOpen?.())W.PsyHobbies.refresh?.()}
async function probeAuthority(){
 if(!isOnline()){authorityReady=false;authorityOnlineProbe=false;return false}
 authorityOnlineProbe=true;authorityReady=false;
 try{const data=await W.psyOnlineAuthorityV26.request('treasure-action',{payload:{action:'status'}},key());authorityReady=data?.ok===true&&Number(data.version)===1}
 catch(_){authorityReady=false}
 return authorityReady;
}
function merge(result){const p=PLAYER();if(!p||!result)return;const pl=result.player||{},system=result.system||{};for(const k of ['gold','diamonds','psycoin'])if(pl[k]!==undefined)p[k]=Number(pl[k])||0;
 if(result.inventory&&typeof result.inventory==='object'){p.inventory=p.inventory||{};for(const [k,v] of Object.entries(result.inventory)){const q=n(v);if(q)p.inventory[k]=q;else delete p.inventory[k]}}
 p.meta=p.meta||{};if(system.treasure_hunt){p.meta.treasureHuntV1=system.treasure_hunt;applySites(system.treasure_hunt)}
 if(system.packs&&typeof system.packs==='object'){p.cardGame=p.cardGame||{};p.cardGame.packs={...(p.cardGame.packs||{}),...system.packs}}
 syncHobbies();save();return result;
}
async function server(action,payload={}){
 const api=W.psyOnlineAuthorityV26;if(!api?.request)throw new Error('autoridade online indisponível');
 if(!authorityReady||!authorityOnlineProbe)throw new Error('Caça ao tesouro online temporariamente indisponível.');
 const data=await api.request('treasure-action',{payload:{action,...payload}},key());if(!data?.ok)throw new Error(data?.error||'ação não confirmada');merge(data);return data;
}
async function refresh(){if(!isOnline()){authorityReady=false;authorityOnlineProbe=false;return local()}try{if(!await probeAuthority()){refreshHobbyView();return local()}const data=await W.psyOnlineAuthorityV26.state();if(data?.system?.treasure_hunt){merge(data);applySites(data.system.treasure_hunt)}refreshHobbyView();return local()}catch(e){authorityReady=false;refreshHobbyView();console.warn('[PSYWORLD treasure state]',e)}return local()}
function applySites(s){const p=PLAYER();if(!p||!s?.sites)return;p.meta=p.meta||{};const h=p.meta.hobbyGatherV2||(p.meta.hobbyGatherV2={nodes:{},decor:[]});h.nodes=h.nodes||{};for(const [id,v] of Object.entries(s.sites)){const route=id.startsWith('route1-'),node='d'+id.slice(route?7:5),scenes=route?['route-1']:['route-cave','kanto-hunt-rift',...(W.PsyKantoJourneyV1?.places||[]).filter(place=>place.kind==='dungeon').map(place=>place.id)];for(const scene of scenes)h.nodes[scene+':'+node]={hits:n(v.hits),respawnAt:n(v.depletedUntil)}}}
async function act(action,payload={}){if(isOnline()){if(!authorityReady||!authorityOnlineProbe)throw new Error('Caça ao tesouro online temporariamente indisponível.');return server(action,payload)}const s=local();if(!s)throw new Error('save indisponível');return localAction(action,payload,s)}
function roll(max){return Math.floor(Math.random()*max)+1}
function xpNeed(id){const lv=Math.max(1,n(hobbyState(id).level));return Math.ceil(100*Math.pow(lv,1.55))}
function bumpXP(id,amount){const h=hobbyState(id);if(!h.level)return;h.xp=n(h.xp)+n(amount);}
function addInventory(item,q){const p=PLAYER();p.inventory=p.inventory||{};p.inventory[item]=n(p.inventory[item])+q}
function itemRoll(id,tier){let reward={},gold=0;
 if(id==='open-chest'){
  if(tier==='common')reward['Fragmento Antigo']=1;
  else if(tier==='rare')reward['Heart Stone']=1;
  else{reward['Crystal Stone']=tier==='epic'?2:3;reward.Diamante=tier==='epic'?1:3+Math.floor(Math.random()*3)}
  gold=(tier==='legendary'?700:tier==='epic'?360:tier==='rare'?170:60);
 }
 return {reward,gold};
}
function localAction(action,payload,s){
 const p=PLAYER();p.meta=p.meta||{};s.hobbies=s.hobbies||{};s.sites=s.sites||{};s.chests=s.chests||{};s.stats=s.stats||{digs:0,chestsOpened:0};s.titles=s.titles||{};s.cosmetic=s.cosmetic||{bountyHunter:false,equipped:false};
 if(action==='unlock'){
  const id=payload.hobby;if(!['treasureHunter','looter'].includes(id))throw new Error('Hobby inválido.');
  if(id==='treasureHunter'&&n(p.trainerLevel)<3)throw new Error('É necessário alcançar o nível 3 de Treinador.');
  if(id==='looter'&&!Object.values(s.chests).some(n))throw new Error('Encontre seu primeiro baú na Gruta dos Cristais.');
  const h=hobbyState(id);if(!h.level){h.level=1;h.xp=0;h.points=1;h.skills={}};save();return {ok:true,system:{treasure_hunt:s}};
 }
 if(action==='dig'){
  const id=String(payload.site||'');if(!/^cave-[123]$/.test(id)&&!/^route1-[12]$/.test(id))throw new Error('Rachadura inválida.');
  const hunter=hobbyState('treasureHunter');if(!hunter.level)throw new Error('Desbloqueie Caçador de Tesouros nos Hobbies.');
  const min=id==='route1-2'?5:1;if(hunter.level<min||id==='route1-2'&&!n(hunter.skills?.trail))throw new Error('Esta rachadura exige Caçador de Tesouros nível 5 e Trilha Revelada.');
  const site=s.sites[id]||(s.sites[id]={hits:0,depletedUntil:0});if(site.depletedUntil>Date.now())throw new Error('A rachadura está se recompondo.');
  site.hits=n(site.hits)+1;if(site.hits<SITE_HITS){save();return {ok:true,hit:site.hits,total:SITE_HITS,complete:false,system:{treasure_hunt:s}}}
  site.hits=0;site.depletedUntil=Date.now()+180000+Math.random()*180000;s.stats.digs=n(s.stats.digs)+1;
  const radar=n(hunter.skills?.radar),deep=n(hunter.skills?.deep),boost=s.cosmetic.equipped?3.5:0,rare=Math.min(38,7+(hunter.level-1)*.35+radar*2+boost),epic=Math.min(14,1+(hunter.level-1)*.12+deep*.5),legendary=Math.min(4,.15+(hunter.level-1)*.03+deep*.1);
  const r=Math.random()*100,tier=r<legendary?'legendary':r<legendary+epic?'epic':r<legendary+epic+rare?'rare':'common';s.chests[tier]=n(s.chests[tier])+1;
  bumpXP('treasureHunter',65);let gold=35+roll(55),item=tier==='epic'||tier==='legendary'?'Pedra Antiga':'Fragmento Antigo',items={[item]:1};
  if(Math.random()<Math.min(.55,.18+n(hunter.skills?.keen)*.035)){const stone=STONES[roll(STONES.length)-1];items[stone]=1}
  if(s.cosmetic.equipped)gold=Math.floor(gold*1.1);
  if(tier==='epic'&&Math.random()<.08)items.Diamante=n(items.Diamante)+1;if(tier==='legendary'){items.Diamante=roll(2);items['Crystal Stone']=1;gold+=450}
  for(const [name,q]of Object.entries(items)){if(name==='Diamante')p.diamonds=n(p.diamonds)+q;else addInventory(name,q)}
  p.gold=n(p.gold)+gold;const titles=[];for(const [count,id,name]of [[10,'treasure-hunter:beginner','Caçador Iniciante'],[100,'treasure-hunter:veteran','Caçador Veterano'],[1000,'treasure-hunter:master','Caçador Mestre'],[5000,'treasure-hunter:insane','Caçador Insano']])if(s.stats.digs>=count&&!s.titles[id]){s.titles[id]=true;titles.push({id,name})}
  for(const t of titles)W.PsyTitles?.acquire?.(t.id,true);bumpXP('looter',0);save();return {ok:true,hit:SITE_HITS,total:SITE_HITS,complete:true,tier,gold,items,titles,system:{treasure_hunt:s}};
 }
 if(action==='open-chest'){
  const tier=String(payload.tier||'common');if(!['common','rare','epic','legendary'].includes(tier)||n(s.chests[tier])<1)throw new Error('Você não possui esse baú.');
  if(!hobbyState('looter').level){if(!Object.values(s.chests).some(n))throw new Error('Encontre um baú primeiro.');hobbyState('looter').level=1;hobbyState('looter').points=1;hobbyState('looter').skills={}}
  s.chests[tier]--;s.stats.chestsOpened=n(s.stats.chestsOpened)+1;const looter=hobbyState('looter'),factor=1+n(looter.skills?.appraiser)*.15+(s.cosmetic.equipped?.1:0),gain=Math.floor(({common:60,rare:100,epic:180,legendary:360}[tier])*factor);bumpXP('looter',gain);
  const result=itemRoll(action,tier);if(n(looter.skills?.collector)>0&&Math.random()<Math.min(.3,n(looter.skills.collector)*.05))result.reward['Fragmento Antigo']=n(result.reward['Fragmento Antigo'])+1;for(const [name,q]of Object.entries(result.reward)){if(name==='Diamante')p.diamonds=n(p.diamonds)+q;else addInventory(name,q)}
  const gold=Math.floor(result.gold*(s.cosmetic.equipped?1.1:1));p.gold=n(p.gold)+gold;save();return {ok:true,tier,xp:gain,items:result.reward,gold,system:{treasure_hunt:s}};
 }
 if(action==='level-up'){
  const id=payload.hobby;if(!['treasureHunter','looter'].includes(id))throw new Error('Hobby inválido.');const h=hobbyState(id);if(!h.level)throw new Error('Desbloqueie o Hobby primeiro.');if(h.level>=MAX_LEVEL)throw new Error('Nível máximo.');
  const need=xpNeed(id);if(h.xp<need)throw new Error('Faltam '+(need-h.xp)+' XP de Hobby.');const inv=p.inventory||{},fragment='Fragmento Antigo',cost=2+h.level*2;
  if(n(inv[fragment])<cost)throw new Error('Requer '+cost+' '+fragment+'.');if(h.level%5===4&&n(inv['Crystal Stone'])<1)throw new Error('Requer 1 Crystal Stone.');inv[fragment]-=cost;if(h.level%5===4)inv['Crystal Stone']--;
  h.xp-=need;h.level++;h.points=n(h.points)+1;save();return {ok:true,hobby:id,level:h.level,system:{treasure_hunt:s}};
 }
 if(action==='skill-buy'){
  const id=payload.hobby,defs=id==='treasureHunter'?HUNTER_SKILLS:id==='looter'?LOOTER_SKILLS:null,def=defs?.find(x=>x.id===payload.skill),h=hobbyState(id);if(!def||!h.level)throw new Error('Habilidade indisponível.');h.skills=h.skills||{};const rank=n(h.skills[def.id]);if(h.level<def.min||rank>=def.max||n(h.points)<1||def.requires.some(k=>!n(h.skills[k])))throw new Error('Nível, ponto ou pré-requisito insuficiente.');h.points--;h.skills[def.id]=rank+1;save();return {ok:true,hobby:id,skill:def.id,rank:rank+1,system:{treasure_hunt:s}};
 }
 if(action==='treasure-roll'){
  const looter=hobbyState('looter');if(n(looter.level)<10)throw new Error('Treasure Roll desbloqueia no nível 10 de Looter.');if(n(p.diamonds)<10)throw new Error('O Treasure Roll custa 10 diamantes.');p.diamonds-=10;const r=Math.random()*100,connoisseur=n(looter.skills?.connoisseur),rollLuck=n(looter.skills?.rollluck);let prize;
  if(r<45){const q=roll(4)+1;p.diamonds+=q;prize={kind:'diamonds',quantity:q}}
  else if(r<75){const q=roll(3)+2,item=STONES[roll(STONES.length)-1];addInventory(item,q);prize={kind:'stones',item,quantity:q}}
  else if(r<Math.min(94.5,93+rollLuck*.5)){p.cardGame=p.cardGame||{};p.cardGame.packs=p.cardGame.packs||{};const pack=['urp','urpp'][roll(2)-1];p.cardGame.packs[pack]=n(p.cardGame.packs[pack])+1;prize={kind:'pack',pack,quantity:1}}
  else if(r<100-Math.min(2,.5+connoisseur*.5+n(looter.skills?.rollluck)*.1)){s.psycoinTenths=n(s.psycoinTenths)+1;if(s.psycoinTenths>=10){s.psycoinTenths-=10;p.psycoin=n(p.psycoin)+1}prize={kind:'psycoin',amount:'0.1'}}
  else{s.cosmetic.bountyHunter=true;s.cosmetic.equipped=true;prize={kind:'bountyHunter',name:'Traje do Caçador de Recompensas'}}
  save();return {ok:true,prize,system:{treasure_hunt:s}};
 }
 if(action==='equip-cosmetic'){
  if(!s.cosmetic.bountyHunter)throw new Error('O traje ainda não foi encontrado.');s.cosmetic.equipped=!!payload.equipped;save();return {ok:true,equipped:s.cosmetic.equipped,system:{treasure_hunt:s}};
 }
 throw new Error('Ação de tesouro inválida.');
}
function offline(){return !isOnline()}
function localState(){return local()||{hobbies:{treasureHunter:{level:0,xp:0,points:0,skills:{}},looter:{level:0,xp:0,points:0,skills:{}}},sites:{},chests:{},stats:{digs:0,chestsOpened:0},cosmetic:{bountyHunter:false,equipped:false},titles:{}}}
async function action(action,payload){try{return await act(action,payload)}catch(e){W.notif?.(String(e?.message||e).replaceAll('_',' '),3200);return null}}
async function unlock(id){if(hobbyState(id).level)return true;const r=await action('unlock',{hobby:id});if(r){W.notif?.((id==='treasureHunter'?'Caçador de Tesouros':'Looter')+' desbloqueado!',2400);W.PsyHobbies?.openDetail?.(id);return true}return false}
async function levelUp(id){const r=await action('level-up',{hobby:id});if(r){W.notif?.('Nível '+r.level+' de '+(id==='looter'?'Looter':'Caçador de Tesouros')+'!',2600);W.PsyHobbies?.openDetail?.(id);return true}return false}
async function buySkill(id,skill){const r=await action('skill-buy',{hobby:id,skill});if(r){W.notif?.('Habilidade desbloqueada: '+skill+'.',2200);W.PsyHobbies?.openDetail?.(id);return true}return false}
function digSiteForScene(scene,node){const place=W.PsyKantoJourneyV1?.places?.find?.(value=>value.id===scene);const cave=scene==='route-cave'||scene==='kanto-hunt-rift'||place?.kind==='dungeon'||/(cave|cavern|grotto|gruta|mt-moon|diglett)/i.test(String(scene));return (cave?'cave-':'route1-')+String(node.id).replace(/^d/,'')}
async function hit(scene,node){const site=digSiteForScene(scene,node);const localProgress=n(node.hits)+1;const r=await action('dig',{site});if(!r)return false;applySites(r.system?.treasure_hunt||localState());
 if(r.complete){W.PsyHobbiesVFX?.onSpotHit?.({scene,node,hit:SITE_HITS,total:SITE_HITS,completed:true});const items=Object.entries(r.items||{}).map(([k,q])=>k+' ×'+q).join(' · ');W.notif?.('Escavação concluída · '+(r.tier||'comum')+' · +'+n(r.gold)+' Gold'+(items?' · '+items:''),3800);for(const t of r.titles||[])W.PsyTitles?.acquire?.(t.id,true);if(r.titles?.length)W.PsyTitles?.open?.()}else{W.PsyHobbiesVFX?.onSpotHit?.({scene,node,hit:r.hit||localProgress,total:SITE_HITS,completed:false});W.notif?.('Escavação '+(r.hit||localProgress)+'/'+SITE_HITS,1100)}
 syncHobbies();return true;
}
function tierName(t){return ({common:'Simples',rare:'Polido',epic:'Ornamentado',legendary:'Relíquia'})[t]||t}
function localHud(id){const s=localState(),h=hobbyState(id);return {s,h}}
function el(tag,cls,text){const x=D.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x}
function button(text,handler,disabled=false){const b=el('button','th-button',text);b.type='button';b.disabled=!!disabled;b.onclick=handler;return b}
function renderInto(parent,id,rerender){const {s,h}=localHud(id),isHunter=id==='treasureHunter',defs=isHunter?HUNTER_SKILLS:LOOTER_SKILLS,section=el('section','th-panel');
 section.appendChild(el('h4','th-title',isHunter?'✦ EXPLORAÇÃO DE TESOUROS':'✦ RELICÁRIO DO LOOTER'));
 if(!isAvailable()){section.appendChild(el('p','th-note','Caça ao tesouro temporariamente indisponível nesta conta. O progresso e as recompensas online só serão ativados quando a autoridade de servidor estiver pronta.'));parent.appendChild(section);return;}
 const summary=el('div','th-summary');summary.appendChild(el('div','',`Nível ${n(h.level)} · XP ${n(h.xp)}/${xpNeed(id)} · ${n(h.points)} ponto(s) de habilidade`));
 summary.appendChild(el('div','',`Escavações: ${n(s.stats?.digs)} · Baús descobertos: ${Object.values(s.chests||{}).reduce((a,b)=>a+n(b),0)} · Baús abertos: ${n(s.stats?.chestsOpened)}`));section.appendChild(summary);
 if(!h.level){const text=isHunter?'Requer Treinador nível 3. Encontre rachaduras de solo na Gruta dos Cristais.':'Encontre seu primeiro baú com o Caçador de Tesouros para liberar esta especialidade.';section.appendChild(el('p','th-note',text));section.appendChild(button('DESBLOQUEAR HOBBY',async()=>{await unlock(id);rerender()},isHunter?n(PLAYER()?.trainerLevel)<3:!Object.values(s.chests||{}).some(n)));parent.appendChild(section);return;}
 const need=xpNeed(id),inv=PLAYER()?.inventory||{},mat='Fragmento Antigo',cost=2+h.level*2,req=need<=n(h.xp)&&n(inv[mat])>=cost&&(h.level%5!==4||n(inv['Crystal Stone'])>=1);
 const up=button('SUBIR PARA NÍVEL '+(h.level+1),async()=>{await levelUp(id);rerender()},h.level>=MAX_LEVEL||!req);section.appendChild(up);section.appendChild(el('p','th-note',`Próximo nível: ${need} XP + ${cost} ${mat}${h.level%5===4?' + 1 Crystal Stone':''}. Nível 30 é uma etapa alta; o progresso continua até o nível 100.`));
 if(isHunter){const chest=el('div','th-chest-row');for(const t of ['common','rare','epic','legendary']){const qty=n(s.chests?.[t]);const row=el('div','th-chest','▣ '+tierName(t)+' ×'+qty);row.appendChild(button('ABRIR',async()=>{const r=await action('open-chest',{tier:t});if(r){W.notif?.('Baú aberto · +'+n(r.xp)+' XP Looter · +'+n(r.gold)+' Gold · '+Object.entries(r.items||{}).map(([k,q])=>k+' ×'+q).join(' · '),3600);rerender()}},qty<1));chest.appendChild(row)}section.appendChild(chest)}else{
  section.appendChild(el('p','th-note',`Diamantes: ${n(PLAYER()?.diamonds)} · o Treasure Roll custa 10 diamantes e requer Looter nível 10.`));section.appendChild(button('✧ USAR TREASURE ROLL · 10 ◈',async()=>{const r=await action('treasure-roll');if(r){const pz=r.prize||{};W.notif?.('Treasure Roll: '+(pz.name||pz.pack||pz.item||pz.kind)+(pz.quantity?' ×'+pz.quantity:''),3800);rerender()}},h.level<10||n(PLAYER()?.diamonds)<10));
 }
 const skillBox=el('div','th-skills');skillBox.appendChild(el('h4','','Árvore de habilidades'));for(const d of defs){const rank=n(h.skills?.[d.id]),prereq=d.requires.every(x=>n(h.skills?.[x])),ready=h.level>=d.min&&h.points>0&&rank<d.max&&prereq;const row=el('article','th-skill '+(ready?'ready':''));row.appendChild(el('strong','',d.name+' · '+rank+'/'+d.max));row.appendChild(el('small','',d.description+' Requer nível '+d.min+(d.requires.length?' e '+d.requires.join(', '):'')+'.'));row.appendChild(button(rank>=d.max?'DOMINADO':'DESBLOQUEAR · 1 PONTO',async()=>{await buySkill(id,d.id);rerender()},!ready));skillBox.appendChild(row)}section.appendChild(skillBox);
 if(!isHunter){const equip=!!s.cosmetic?.equipped,owned=!!s.cosmetic?.bountyHunter;section.appendChild(el('h4','th-title','✧ TRAJE DO CAÇADOR DE RECOMPENSAS'));section.appendChild(el('p','th-note',owned?'Capa pixel art e aura dourada contínua · +10% Gold e XP em batalhas e Hobbies · +10 pontos de Drop · +3,5 pontos percentuais na chance de baú raro.': 'Traje raro do Treasure Roll. Ao equipar, adiciona uma capa pixel art e uma aura dourada no mapa.'));if(owned)section.appendChild(button(equip?'DESEQUIPAR TRAJE':'EQUIPAR TRAJE',async()=>{await action('equip-cosmetic',{equipped:!equip});rerender()}));}
 parent.appendChild(section);
}
function drawScene(c,scene,now){if(scene!=='route-cave')return;const t=now/1000;c.save();c.imageSmoothingEnabled=false;
 // The hand-painted map already contains the rails; add mine carts over its authored cart bays.
 for(const [x,y,sway]of [[130,558,0],[770,238,1]]){c.save();c.translate(x,Math.round(y+Math.sin(t*.6+sway)*.65));c.fillStyle='#211d2b88';c.beginPath();c.ellipse(0,1,33,6,0,0,Math.PI*2);c.fill();c.fillStyle='#593e35';c.strokeStyle='#d2a361';c.lineWidth=2;c.beginPath();c.moveTo(-27,-21);c.lineTo(-21,-5);c.lineTo(21,-5);c.lineTo(27,-21);c.closePath();c.fill();c.stroke();c.fillStyle='#986442';c.fillRect(-24,-20,48,4);c.fillStyle='#b89b70';for(let i=-2;i<=2;i++)c.fillRect(i*8-2,-17,4,10);c.fillStyle='#d4b881';for(const wx of [-18,18]){c.beginPath();c.arc(wx,-3,5,0,Math.PI*2);c.fill();c.stroke()}c.restore()}
 for(let i=0;i<5;i++){const x=285+i*86,y=396+Math.sin(t*1.1+i*1.7)*1.5;c.globalAlpha=.35+Math.sin(t*1.5+i)*.15;c.fillStyle=i%2?'#74efda':'#c29aff';c.fillRect(Math.round(x),Math.round(y),2,2)}c.restore();
}
function drawBountyAura(c,x,y,now=performance.now()){const s=localState();if(!s.cosmetic?.equipped||D.hidden)return;const t=now/1000,reduced=W.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;c.save();c.imageSmoothingEnabled=false;
 // Pixel mantle behind the trainer, held on a stable ground anchor.
 c.fillStyle='#522f43';c.strokeStyle='#f1c86a';c.lineWidth=1;c.beginPath();c.moveTo(x-13,y-45);c.lineTo(x-19,y-18);c.lineTo(x-12,y-11);c.lineTo(x-8,y-18);c.lineTo(x,y-14);c.lineTo(x+8,y-18);c.lineTo(x+13,y-11);c.lineTo(x+19,y-18);c.lineTo(x+13,y-45);c.closePath();c.fill();c.stroke();c.fillStyle='#8c5147';for(let i=0;i<4;i++)c.fillRect(Math.round(x-11+i*6),Math.round(y-23+(i%2)*3),3,2);
 c.globalAlpha=.35;c.strokeStyle='#ffd36b';c.beginPath();c.ellipse(x,y-26,22+(reduced?0:Math.sin(t*2)*2),34+(reduced?0:Math.sin(t*1.4)*2),0,0,Math.PI*2);c.stroke();c.globalAlpha=1;
 if(!reduced)for(let i=0;i<4;i++){const phase=t*.9+i*Math.PI/2,px=x+Math.cos(phase)*22,py=y-25+Math.sin(phase*1.2)*27;c.fillStyle=i%2?'#ffe8a0':'#fff5ca';c.fillRect(Math.round(px),Math.round(py),2,2)}c.restore();}
function registerTitles(){for(const [id,name,goal]of [['treasure-hunter:beginner','Caçador Iniciante',10],['treasure-hunter:veteran','Caçador Veterano',100],['treasure-hunter:master','Caçador Mestre',1000],['treasure-hunter:insane','Caçador Insano',5000]])W.PsyTitles?.register?.({id,name,metric:'treasureDigs',goal,bonus:{drop:id.endsWith('insane')?1.5:.25},glyph:'✦',color:'#e8bd72',note:'Explorações concluídas na Gruta dos Cristais.'})}
function stats(){return localState()}
function levelRequirements(id){const h=hobbyState(id),need=xpNeed(id),inv=PLAYER()?.inventory||{},required=2+n(h.level)*2;return {need,available:n(h.xp),material:'Fragmento Antigo',required,ready:n(h.level)>0&&n(h.level)<MAX_LEVEL&&n(h.xp)>=need&&n(inv['Fragmento Antigo'])>=required&&(h.level%5!==4||n(inv['Crystal Stone'])>=1)}}
W.PsyTreasureHuntV1={version:1,siteHits:SITE_HITS,unlock,levelUp,levelRequirements,hit,collect:hit,renderInto,drawScene,drawBountyAura,action,refresh,stats,hobbyState,skills:{treasureHunter:HUNTER_SKILLS,looter:LOOTER_SKILLS},isOnline,isAvailable,localAction};
W.addEventListener('load',()=>{registerTitles();refresh()},{once:true});
})(window,document);
