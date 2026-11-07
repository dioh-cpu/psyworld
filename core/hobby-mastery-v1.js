/* PSYWORLD — Hobby Mastery V1. Each hobby owns its points and skills.
   Rare spots are rolled AFTER successful harvest; old saves stay compatible. */
(function(W,D){
'use strict';
if(W.PsyHobbyMastery)return;
const H=()=>W.PsyHobbies;
const player=()=>{try{return typeof P!=='undefined'?P:W.P}catch(_){return W.P}};
const n=v=>Math.max(0,Math.floor(Number(v)||0));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const GROUPS={
 miner:[
 ['strike','Golpe Pesado','⛏','hits',2,[],1,'Reduz os golpes necessários para extrair minério.'],
 ['radar','Radar Mineral','◎','rare',3,['strike'],2,'Melhora a descoberta de cristais raros.'],
 ['vein','Veia Rara','◆','rare',3,['strike'],2,'Encontra minério precioso perto de casa.'],
 ['extra','Cristais Bônus','✦','quantity',2,['vein'],4,'Chance de obter mais de um material.'],
 ['rest','Menos Respawn','◷','respawn',3,['radar'],5,'Acelera o renascimento dos spots.'],
 ['epic','Veia Épica','❖','epic',3,['vein','radar'],7,'Revela veios épicos nos mapas iniciais.'],
 ['legend','Veia Lendária','✧','legend',1,['epic','extra'],12,'Chance maior de cristais lendários.']
 ],
 gardener:[
 ['botany','Botânica Inicial','❀','quantity',2,[],1,'Aprenda a aproveitar cada flor.'],
 ['seeds','Sementes Fortes','❧','rare',3,['botany'],2,'Aumenta as florações raras.'],
 ['bloom','Floração Rara','✿','rare',3,['botany'],2,'Incentiva flores mágicas em Kanto.'],
 ['care','Coleta Delicada','☘','respawn',3,['seeds'],4,'Ajuda os canteiros a renascer antes.'],
 ['essence','Essências Extras','✣','quantity',2,['care'],5,'Chance de colher flores adicionais.'],
 ['epic','Jardim Épico','❃','epic',3,['bloom','care'],7,'Plantas épicas começam a surgir.'],
 ['legend','Flor Lendária','✽','legend',1,['epic','essence'],12,'Potencializa flores lendárias.']
 ],
 fisher:[
 ['bait','Isca Melhorada','♒','rare',3,[],1,'Atrai peixes raros desde o primeiro lago.'],
 ['tension','Tensão Precisa','◉','tension',3,['bait'],2,'Amplia a zona segura durante a pesca.'],
 ['shoal','Cardume Raro','🐟','rare',3,['bait'],2,'Aumenta a chegada de cardumes raros.'],
 ['care','Linha Resistente','⌁','tension',2,['tension'],4,'Facilita o controle da tensão.'],
 ['bonus','Tesouros do Lago','✦','quantity',2,['shoal'],5,'Chance de pescar uma unidade extra.'],
 ['epic','Cardume Épico','❖','epic',3,['shoal','tension'],7,'Atrai peixes épicos para lagos iniciais.'],
 ['legend','Peixe Lendário','✧','legend',1,['epic','bonus'],12,'Eleva a chance do peixe mais raro.']
 ],
 lumber:[
 ['blade','Lâmina Afiada','🪓','hits',2,[],1,'Reduz os golpes necessários para cortar.'],
 ['cut','Corte Eficiente','✦','hits',2,['blade'],2,'Melhora o ritmo da colheita.'],
 ['rare','Madeira Rara','❧','rare',3,['blade'],2,'Árvores especiais surgem nas rotas iniciais.'],
 ['impact','Força de Impacto','⚒','quantity',2,['cut'],4,'Chance de ganhar madeira adicional.'],
 ['planks','Tábuas Extras','▤','quantity',2,['impact'],5,'Melhora o rendimento dos troncos.'],
 ['epic','Tronco Épico','❖','epic',3,['rare','impact'],7,'Traz madeira épica à floresta.'],
 ['legend','Árvore Lendária','✧','legend',1,['epic','planks'],12,'Eleva a chance de árvores lendárias.']
 ]
};
const NAMES={
 engineer:['Ferramentas de Precisão','Engrenagens de Mestre','Projeto Avançado'],
 herbalist:['Folhas Curativas','Misturas Delicadas','Elixir do Bosque'],
 researcher:['Lupa do Pesquisador','Dados de Campo','Sabedoria Antiga'],
 professor:['Aula de Campo','Mentoria Gentil','Conhecimento Supremo'],
 stylist:['Agulha Encantada','Costura Criativa','Ateliê Brilhante'],
 echo:['Ecos Delicados','Trama Etérea','Harmonia Sombria'],
 dream:['Rascunho dos Sonhos','Mapas Estelares','Horizonte Onírico'],
 twilight:['Luz do Crepúsculo','Véu Protetor','Guarda da Noite'],
 alchemist:['Primeira Poção','Reação Brilhante','Alquimia Suprema']
};
for(const [id,names] of Object.entries(NAMES))GROUPS[id]=[
 ['base',names[0],'✦','stat',3,[],1,'Aprimora o bônus natural deste hobby.'],
 ['middle',names[1],'❖','stat',3,['base'],3,'Melhora ainda mais sua especialidade.'],
 ['master',names[2],'✧','stat',2,['middle'],7,'Desbloqueia uma pequena maestria permanente.']
];
const PROPS={miner:{art:'miner',subtitle:'Escave cristais e descubra raridades perto de casa.',accent:'#78dcff'},
 gardener:{art:'gardener',subtitle:'Cultive flores mágicas e jardins encantados.',accent:'#fface1'},
 fisher:{art:'fisher',subtitle:'Explore lagos e encontre cardumes especiais.',accent:'#83dcff'},
 lumber:{art:'lumber',subtitle:'Descubra madeira rara nas florestas de Kanto.',accent:'#ffd28d'}};
const REWARDS={
 miner:{common:'Minério Bruto',rare:'Minério Luminoso',epic:'Cristal Arcano',legend:'Cristal Lendário'},
 gardener:{common:'Flor do Campo',rare:'Flor Encantada',epic:'Flor Astral',legend:'Flor Lendária'},
 lumber:{common:'Madeira Bruta',rare:'Madeira Encantada',epic:'Tronco Rúnico',legend:'Madeira Celestial'},
 fisher:{common:'Peixe de Rio',rare:'Carpa Prateada',epic:'Peixe Cristalino',legend:'Peixe Dourado'}
};
const LABEL={common:'Comum',rare:'Raro',epic:'Épico',legend:'Lendário'};
const ICON={common:'◈',rare:'◆',epic:'❖',legend:'✦'};
function ledger(){const u=player();if(!u)return{};u.meta=u.meta||{};return u.meta.hobbyMasteryV1||(u.meta.hobbyMasteryV1={});}
function skillDefs(id){return (GROUPS[id]||[]).map(([id,name,icon,effect,max,requires,minLevel,description])=>({id,name,icon,effect,max,requires,minLevel,description}));}
function ranks(id){const all=ledger();const x=all[id]||(all[id]={});x.skills=x.skills||{};return x.skills;}
function rank(id,node){return n(ranks(id)[node]);}
function level(id){return n(H()?.state?.()[id]?.level);}
function points(id){return Math.max(0,level(id)-Object.values(ranks(id)).reduce((s,v)=>s+n(v),0));}
function canBuy(id,nodeId){
 const def=skillDefs(id).find(x=>x.id===nodeId);if(!def||!level(id)||points(id)<1||rank(id,nodeId)>=def.max||level(id)<def.minLevel)return false;
 return def.requires.every(dep=>rank(id,dep)>=1);
}
function buy(id,nodeId){
 if(!canBuy(id,nodeId))return false;
 const r=ranks(id);r[nodeId]=rank(id,nodeId)+1;
 W.autoSave?.();W.notif?.('Nova habilidade de '+(H()?.definitions?.find(x=>x.id===id)?.name||id)+'!',2300);
 return true;
}
function effect(id,kind){return skillDefs(id).reduce((s,d)=>s+(d.effect===kind?rank(id,d.id):0),0);}
function chances(id){
 const lv=level(id);if(!lv)return {common:100,rare:0,epic:0,legend:0};
 const base=({miner:[5,1,.2],gardener:[6,1.5,.3],fisher:[7,2,.4],lumber:[5.5,1.2,.25]})[id]||[5,1,.2];
 const rare=clamp(base[0]+(lv-1)*.18+effect(id,'rare')*.9,0,32);
 const epic=clamp(base[1]+(lv-1)*.06+effect(id,'epic')*.4,0,12);
 const legend=clamp(base[2]+(lv-1)*.012+effect(id,'legend')*.25,0,3);
 return {common:Math.max(0,100-rare-epic-legend),rare,epic,legend};
}
function plannedMaterial(id,rarity){return REWARDS[id]?.[rarity]||REWARDS[id]?.common||null;}
function statBonus(stat){let result=0;for(const j of H()?.definitions||[])if(j.stat===stat)result+=effect(j.id,'stat')*.25;return Math.min(12,result);}
function fmt(v){return v.toLocaleString('pt-BR',{minimumFractionDigits:v<1?2:1,maximumFractionDigits:2})+'%';}
function el(tag,cls,text){const x=D.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function renderInto(parent,id,rerender){
 const defs=skillDefs(id);if(!defs.length||!level(id))return;
 const j=H()?.definitions?.find(x=>x.id===id),c=chances(id),art=PROPS[id]?.art||j?.art;
 const section=el('section','ph-mastery');section.style.setProperty('--mastery-accent',PROPS[id]?.accent||'#d3b0ff');
 const top=el('div','ph-mastery-hero');
 const avatar=el('div','ph-mastery-portrait');
 const img=el('img');img.src=(j?.starter||id==='alchemist')?'assets/hobbies/'+art+'.svg':'assets/professions/'+art+'.webp';img.alt='Arte de '+j.name;img.loading='lazy';avatar.appendChild(img);
 const summary=el('div','ph-mastery-summary');summary.appendChild(el('small','ph-mastery-eyebrow','✧ MAESTRIA DO HOBBY ✧'));summary.appendChild(el('h3','',j.name));
 summary.appendChild(el('p','',PROPS[id]?.subtitle||'Aprimore sua especialidade com habilidades exclusivas.'));
 const tags=el('div','ph-mastery-tags');tags.appendChild(el('span','', '✦ '+points(id)+' ponto(s) disponível(is)'));tags.appendChild(el('span','','Nível '+level(id)));summary.appendChild(tags);
 top.append(avatar,summary);section.appendChild(top);
 if(REWARDS[id]){
  const rarity=el('section','ph-rarity-box');rarity.appendChild(el('h4','','✧ Prévia de raridades ✧'));
  rarity.appendChild(el('p','','Valores de referência para as futuras raridades. Esta prévia ainda não altera as coletas.'));
  const row=el('div','ph-rarity-row');
  for(const k of ['common','rare','epic','legend']){const badge=el('div','ph-rarity-tier ph-rarity-'+k);badge.appendChild(el('span','ph-rarity-gem',ICON[k]));badge.appendChild(el('b','',LABEL[k]));badge.appendChild(el('strong','',fmt(c[k])));badge.appendChild(el('small','',plannedMaterial(id,k)));row.appendChild(badge)}
  rarity.appendChild(row);section.appendChild(rarity);
 }
 const heading=el('div','ph-tree-heading');heading.appendChild(el('h4','','✦ Árvore de Habilidades ✦'));
 heading.appendChild(el('p','','Cada nível libera 1 ponto exclusivo. Os nós exigem os anteriores e um nível mínimo.'));
 section.appendChild(heading);
 const grid=el('div','ph-mastery-tree');
 for(const def of defs){
  const r=rank(id,def.id),ready=canBuy(id,def.id),requires=def.requires.map(key=>defs.find(d=>d.id===key)?.name||key);
  const node=el('button','ph-skill-node '+(r?'is-active':ready?'is-ready':'is-locked'));
  node.type='button';node.disabled=!ready;node.setAttribute('aria-label',def.name+', nível '+r+' de '+def.max+(requires.length?', requer '+requires.join(' e '):''));
  node.appendChild(el('span','ph-skill-icon',r?'✦ '+def.icon:def.icon));
  node.appendChild(el('b','',def.name));node.appendChild(el('small','', 'Nv. '+r+'/'+def.max));
  node.appendChild(el('span','ph-skill-desc',def.description));
  node.appendChild(el('em','',r===def.max?'DOMINADO':ready?'DESBLOQUEAR · 1 PONTO':r?'EM PROGRESSO': 'Requer Nv. '+def.minLevel+(requires.length?' · '+requires.join(' + '):'')));
  if(ready)node.onclick=()=>{if(buy(id,def.id))rerender()};
  grid.appendChild(node);
 }
 section.appendChild(grid);
 section.appendChild(el('p','ph-mastery-note','Pontos e melhorias pertencem somente a este hobby e ficam salvos com o personagem.'));
 parent.appendChild(section);
}
W.PsyHobbyMastery={skillDefs,ranks,rank,points,canBuy,buy,effect,chances,statBonus,renderInto};
})(window,document);
