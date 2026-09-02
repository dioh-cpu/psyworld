(function(W){
  'use strict';
  /* PSYWORLD Shared Combat Drops V2
     Uma única autoridade para materiais de craft/quest nos modos de combate.
     - Wild / Fast / Hunt / Aventura: 100% das taxas base.
     - World / Survivor: 50% das taxas base.
     - Cada item possui rolagem independente; um único abate pode entregar
       Essência + material comum + material raro + pack no mesmo evento.
     - Travas são por EVENTO, não por espécie, para nunca bloquear drops de
       respawns posteriores do mesmo Pokémon/monstrinho.
  */
  if(W.__PSYWORLD_SHARED_MODE_DROPS_V2__)return;
  W.__PSYWORLD_SHARED_MODE_DROPS_V2__=true;
  W.__PSYWORLD_SHARED_MODE_DROPS_V1__=true; // compatibilidade com guards antigos

  const BUILD='SHARED_MODE_DROPS_V10_HUNT_CRAFT';
  try{if(typeof P!=='undefined'&&P)W.P=P}catch(e){}

  const TYPES=['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
  const TYPE_PT={Normal:'Normal',Fire:'Fogo',Water:'Água',Grass:'Planta',Electric:'Elétrico',Ice:'Gelo',Fighting:'Lutador',Poison:'Veneno',Ground:'Terra',Flying:'Voador',Psychic:'Psíquico',Bug:'Inseto',Rock:'Pedra',Ghost:'Fantasma',Dragon:'Dragão',Dark:'Sombrio',Steel:'Metal',Fairy:'Fada'};
  const TYPE_ALIASES={normal:'Normal',comum:'Normal',fire:'Fire',fogo:'Fire',water:'Water',agua:'Water',grass:'Grass',planta:'Grass',natureza:'Grass',electric:'Electric',eletrico:'Electric',energia:'Electric',ice:'Ice',gelo:'Ice',fighting:'Fighting',lutador:'Fighting',poison:'Poison',veneno:'Poison',venenoso:'Poison',ground:'Ground',terra:'Ground',areia:'Ground',sand:'Ground',flying:'Flying',voador:'Flying',ar:'Flying',psychic:'Psychic',psiquico:'Psychic',bug:'Bug',inseto:'Bug',rock:'Rock',pedra:'Rock',ghost:'Ghost',fantasma:'Ghost',undead:'Ghost',dragon:'Dragon',dragao:'Dragon',dark:'Dark',sombrio:'Dark',noturno:'Dark',steel:'Steel',metal:'Steel',aco:'Steel',fairy:'Fairy',fada:'Fairy',holy:'Fairy',luz:'Fairy'};
  const ESSENCE_FALLBACK={
    Normal:{ess:'Essência Normal',ball:'Normal Ball',ico:'⚪'},Fire:{ess:'Essência Fogo',ball:'Fire Ball',ico:'🔥'},Water:{ess:'Essência Água',ball:'Water Ball',ico:'💧'},Grass:{ess:'Essência Planta',ball:'Grass Ball',ico:'🍃'},Electric:{ess:'Essência Elétrica',ball:'Electric Ball',ico:'⚡'},Ice:{ess:'Essência Gelo',ball:'Ice Ball',ico:'❄️'},Fighting:{ess:'Essência Lutador',ball:'Fighting Ball',ico:'🥊'},Poison:{ess:'Essência Veneno',ball:'Poison Ball',ico:'☠️'},Ground:{ess:'Essência Terra',ball:'Ground Ball',ico:'⛰️'},Flying:{ess:'Essência Voador',ball:'Flying Ball',ico:'🪽'},Psychic:{ess:'Essência Psíquica',ball:'Psychic Ball',ico:'🔮'},Bug:{ess:'Essência Inseto',ball:'Bug Ball',ico:'🐛'},Rock:{ess:'Essência Pedra',ball:'Rock Ball',ico:'🪨'},Ghost:{ess:'Essência Fantasma',ball:'Ghost Ball',ico:'👻'},Dragon:{ess:'Essência Dragão',ball:'Dragon Ball',ico:'🐉'},Dark:{ess:'Essência Sombria',ball:'Dark Ball',ico:'🌑'},Steel:{ess:'Essência Metal',ball:'Steel Ball',ico:'⚙️'},Fairy:{ess:'Essência Fada',ball:'Fairy Ball',ico:'🧚'}
  };
  const QUEST_LOOT={
    Normal:['Rubber Ball','Giant Piece Of Fur'],Fire:['Essence Of Fire','Fire Tail'],Water:['Water Gem','Water Pendant'],Grass:['Seed','Great Petal'],Electric:['Screw','Electric Rat Tail'],Ice:['Snowball','Ice Orb'],Fighting:['Band Aid','Belt Of Champion'],Poison:['Bottle Of Poison','Bug Venom'],Ground:['Earth Ball','Piece Of Diglett'],Flying:['Straw','Giant Beak'],Psychic:['Enchanted Gem','Psychic Spoon'],Bug:['Bug Gosme','Bug Antenna'],Rock:['Small Stone','Strange Rock'],Ghost:['Ghost Essence','Bat Wing'],Dragon:['Dragon Scale','Dragon Tooth'],Dark:['Dark Gem','Dark Ear'],Steel:['Piece Of Steel','Metal Hull'],Fairy:['Rubber Ball','Cute Ball']
  };
  const SURV_COMMON_STONES=['Fire Stone','Water Stone','Leaf Stone','Thunder Stone','Ice Stone','Punch Stone','Venom Stone','Earth Stone','Feather Stone','Enigma Stone','Cocoon Stone','Rock Stone','Crystal Stone','Darkness Stone','Metal Stone','Heart Stone'];
  const EXCLUSIVE_REWARDS={survivor:['Fragmento Mega Stone','Shiny Stone','pedras e packs da run'],wild:['TMs compatíveis','Ultra Ball','Boost Stone'],fast:['TMs compatíveis','recompensas de Fast Encounter'],hunt:['TMs compatíveis','recompensas da Hunt'],world:['capturas e hordas do Mundo Pokémon'],adventure:['Ovos da Aventura','equipamentos','Essência da Floresta','recompensas de fase']};

  const norm=v=>String(v==null?'':v).trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const profile=()=>{try{if(typeof P!=='undefined'&&P){if(W.P!==P)W.P=P;return P}}catch(e){}return W.P||(W.P={})};
  function ensure(){const p=profile();if(!p.inventory||typeof p.inventory!=='object')p.inventory={};if(!p.meta||typeof p.meta!=='object')p.meta={};return p}
  function save(){try{W.autoSave?.()}catch(e){}try{W.updateHUD?.()}catch(e){}}
  function notify(m){try{W.notif?.(m,3000)}catch(e){console.log('[PSYWORLD DROPS]',m)}}
  function buff(k){try{return Math.max(0,num(W.getTotalBuff?.(k),0))}catch(e){return 0}}
  function typeFromValue(v){
    if(Array.isArray(v)){for(const x of v){const t=typeFromValue(x);if(t)return t}return null}
    if(v&&typeof v==='object')return typeFromValue(v.name||v.type||v.element);
    const raw=norm(v);if(!raw)return null;for(const part of raw.split(/[\s/|,;+:]+/).filter(Boolean)){if(TYPE_ALIASES[part])return TYPE_ALIASES[part]}return TYPE_ALIASES[raw]||null;
  }
  function enemyId(e){if(typeof e==='number'&&Number.isFinite(e))return Math.floor(e);if(typeof e==='string'&&/^\d+$/.test(e.trim()))return Number(e);if(e&&typeof e==='object'){const n=e.id??e.pokemonId??e.dexId??e.speciesId;if(Number.isFinite(Number(n)))return Math.floor(Number(n))}return null}
  function typeFromId(id){if(id==null)return null;const table=W.TYPE_BY_ID_FULL||W.TYPE_BY_ID_EXT||W.TYPE_BY_ID_ALL||{};return typeFromValue(table[id])}
  function enemyType(e){if(e&&typeof e==='object'){for(const v of [e.types,e.type,e.element,e.primaryType,e.elements]){const t=typeFromValue(v);if(t)return t}try{const a=W.PSY?.getAdventureCreature?.(e.name||e.spriteKey);const t=typeFromValue(a?.types||a?.element);if(t)return t}catch(_){}}return typeFromId(enemyId(e))||'Normal'}
  function essence(t){const table=W.PSY_ELEMENT_DATA||{};return table[t]||table[TYPE_PT[t]]||ESSENCE_FALLBACK[t]||ESSENCE_FALLBACK.Normal}
  function addItem(p,n,q=1){if(!n)return 0;const qty=Math.max(1,Math.floor(num(q,1)));p.inventory[n]=Math.max(0,num(p.inventory[n],0))+qty;return qty}
  function ensurePacks(p){p.cardGame=p.cardGame&&typeof p.cardGame==='object'?p.cardGame:{};p.cardGame.packs=p.cardGame.packs&&typeof p.cardGame.packs==='object'?p.cardGame.packs:{};for(const k of ['normal','rare','epic','s','ss','sss','ur','urp','urpp'])p.cardGame.packs[k]=Math.max(0,Math.floor(num(p.cardGame.packs[k],0)));return p.cardGame.packs}
  function packKey(e){const raw=norm(e?.tier||e?.rarity?.n||e?.rarity||e?.quality||'normal');if(raw.includes('ur++'))return'urpp';if(raw.includes('ur+'))return'urp';if(/\bur\b/.test(raw))return'ur';if(raw.includes('sss'))return'sss';if(/\bss\b/.test(raw))return'ss';if(/\bs\b/.test(raw)&&!raw.includes('ss'))return's';if(raw.includes('epic')||raw.includes('epico'))return'epic';if(raw.includes('rare')||raw.includes('raro'))return'rare';return'normal'}
  function addPack(p,k){const packs=ensurePacks(p);packs[k]=num(packs[k],0)+1}

  function inferMode(){const p=ensure();if(W.fastEncounter)return'fast';if(String(p.currentHunt||'').toLowerCase().startsWith('psy19:'))return'hunt';return'wild'}
  function modeName(src){const ctx=String(W.__psyDropContext?.mode||'').toLowerCase();if(ctx)return ctx;const s=String(src||'auto').toLowerCase();return['survivor','world','adventure','cards','wild','fast','hunt','idle'].includes(s)?s:inferMode()}
  function label(m){return({wild:'Wild',fast:'Fast Encounter',hunt:'Hunt',survivor:'Survivor',world:'Mundo Pokémon',adventure:'Mundo Aventura',idle:'World Idle'}[m]||m)}
  function scale(m){
    if(m==='world'||m==='survivor'||m==='idle')return .25;
    /* Fast Encounter entrega um novo alvo a cada ~2–3 s.
       Para não superar Wild/Hunt apenas por cadência, usa 40% da taxa cheia.
       Quem não mata em insta-kill naturalmente recebe menos drops por hora. */
    if(m==='fast')return .4;
    return 1;
  }
  function chanceScale(mode=''){
    const eq=mode==='adventure'?Math.max(0,num(W.PSY?.getAdventureEquipmentDropBonus?.(),0)):0;
    const d=buff('drop')+eq;
    /* V5 LOW VOLUME:
       Drop continua ajudando, mas com retorno controlado.
       Mesmo com buffs extremos, o multiplicador de materiais para em 2x.
       Isso impede farm infinito no Survivor/World quando o jogador passa a
       matar centenas de inimigos por minuto. */
    const materialBoost=Math.min(2,1+d/300);
    return{drop:d,globalDrop:buff('drop'),equipmentDrop:eq,materialBoost}
  }

  function eventAlreadyAwarded(enemy,mode){
    const ctx=W.__psyDropContext;if(ctx?.commonAwarded)return true;
    if(['wild','fast','hunt'].includes(mode)&&W.battleData?._psyGlobalDropsV2)return true;
    if(mode==='adventure'&&enemy&&typeof enemy==='object'&&enemy._psySharedDropGiven)return true;
    return false;
  }
  function markEvent(enemy,mode){
    const ctx=W.__psyDropContext;if(ctx)ctx.commonAwarded=true;
    if(['wild','fast','hunt'].includes(mode)&&W.battleData)W.battleData._psyGlobalDropsV2=true;
    if(mode==='adventure'&&enemy&&typeof enemy==='object')enemy._psySharedDropGiven=true;
  }

  const idDropProfiles=new Map();
  function dropProfile(enemy,mode){
    const id=enemyId(enemy),type=enemyType(enemy),cs=chanceScale(mode),rs=scale(mode),key=id==null?null:`${id}:${mode}:${cs.drop}`;
    if(key&&idDropProfiles.has(key))return idDropProfiles.get(key);
    const ess=essence(type),pair=QUEST_LOOT[type]||QUEST_LOOT.Normal;
    /* O perfil é construído por ID. Cada entrada possui sua própria chance e
       sua própria rolagem; não existe limite de um item por inimigo. */
    const profile={id,type,entries:[
      /* Taxas deliberadamente baixas porque Survivor/World possuem volume
         enorme de abates. Cada item continua com rolagem independente.
         Base em modos normais: 0,60% / 1,20% / 0,25%.
         Survivor/World aplicam 50% e o bônus de Drop pode no máximo dobrar
         essas chances. Assim, mesmo no teto, 700 abates geram em média
         ~14,35 materiais de Craft/Quest, antes do RNG. */
      {kind:'craft',name:ess.ess,chance:rs*.006*cs.materialBoost},
      {kind:'quest-common',name:pair[0],chance:rs*.012*cs.materialBoost},
      {kind:'quest-rare',name:pair[1],chance:rs*.0025*cs.materialBoost}
    ]};
    if(key)idDropProfiles.set(key,profile);
    return profile;
  }

/* Limite de segurança de economia para os modos de altíssimo volume.
     Cada bloco de 700 abates no Survivor/World pode entregar no máximo
     15 materiais do pool global de Craft/Quest. Drops raros próprios,
     Stones e Packs não entram neste teto. */
  function materialQuota(p,mode){
    const caps={
      survivor:{kills:700,items:15},
      world:{kills:700,items:15},
      wild:{kills:700,items:30},
      fast:{kills:700,items:15},
      hunt:{kills:700,items:30},
      idle:{kills:700,items:30}
    };
    const cap=caps[mode];
    if(!cap)return null;
    p.meta.sharedMaterialQuota=p.meta.sharedMaterialQuota&&typeof p.meta.sharedMaterialQuota==='object'?p.meta.sharedMaterialQuota:{};
    let q=p.meta.sharedMaterialQuota[mode];
    if(!q||typeof q!=='object')q=p.meta.sharedMaterialQuota[mode]={kills:0,items:0};
    q.kills=Math.max(0,Math.floor(num(q.kills,0)));
    q.items=Math.max(0,Math.floor(num(q.items,0)));
    if(q.kills>=cap.kills){q.kills=0;q.items=0}
    q.kills++;
    q.capKills=cap.kills;
    q.capItems=cap.items;
    return q;
  }

  function survivorVisualDrop(enemy,name,kind='craft',qty=1){
    if(!name)return;
    try{
      if(typeof W.psySurvRegisterSharedDrop==='function'){
        W.psySurvRegisterSharedDrop(enemy,name,kind,qty);
        return;
      }
      const run=W.PSY_CLEAN_SURV;
      if(!run)return;
      run.dropHistory=Array.isArray(run.dropHistory)?run.dropHistory:[];
      run.dropAlerts=Array.isArray(run.dropAlerts)?run.dropAlerts:[];
      const visual=kind==='quest-rare'?'rare':kind==='pack'?'epic':kind==='craft'?'craft':'common';
      const source=enemy?.boss?'Boss':enemy?.timedElite?'Elite':enemy?.mega&&enemy?.shiny?'Mega Shiny':enemy?.mega?'Mega':enemy?.shiny?'Shiny':'Pokémon';
      const row={time:Number(run.elapsed||0),name,qty:Math.max(1,Number(qty||1)),source,rarity:visual,shared:true};
      run.dropHistory.unshift(row);
      if(run.dropHistory.length>160)run.dropHistory.length=160;
      run.dropAlerts.unshift({...row,life:3600});
      if(run.dropAlerts.length>5)run.dropAlerts.length=5;
    }catch(e){console.warn('[PSYWORLD SURVIVOR] falha ao registrar drop compartilhado',e)}
  }
  function awardCommon(enemy,source='auto'){
    const mode=modeName(source);if(mode==='cards')return[];
    if(eventAlreadyAwarded(enemy,mode))return[];markEvent(enemy,mode);
    const p=ensure(),profile=dropProfile(enemy,mode),cs=chanceScale(mode),rs=scale(mode),got=[],quota=materialQuota(p,mode);

    /* TODAS as entradas do perfil do ID são roladas independentemente.
       Survivor/World respeitam também o teto duro de 15 materiais por
       bloco de 700 abates. */
    for(const entry of profile.entries){
      if(quota&&quota.items>=quota.capItems)break;
      if(Math.random()<entry.chance){
        addItem(p,entry.name);
        got.push(entry.name);
        if(quota)quota.items++;
        if(mode==='survivor')survivorVisualDrop(enemy,entry.name,entry.kind,1);
      }
    }

    const id=profile.id;
    if(['wild','fast','hunt','idle'].includes(mode)&&id!=null){try{W.psyRollTMDrop?.(id)}catch(e){console.warn('[PSYWORLD DROPS V2] TM',e)}}

    const boss=(enemy?.boss||enemy?.isBoss)?4.5:1,shiny=enemy?.shiny?1.35:1,mega=(enemy?.mega||enemy?.isMega)?1.8:1;
    const packBase=mode==='adventure'?.012:.0005;
    if(Math.random()<rs*packBase*Math.min(3,cs.quest)*boss*shiny*mega){const k=packKey(enemy),packName='Pack '+(k==='rare'?'Raro':k==='epic'?'Épico':k==='normal'?'Normal':k.toUpperCase());addPack(p,k);got.push(packName);if(mode==='survivor')survivorVisualDrop(enemy,packName,'pack',1)}

    p.meta.sharedDropV2=p.meta.sharedDropV2&&typeof p.meta.sharedDropV2==='object'?p.meta.sharedDropV2:{};
    p.meta.sharedDropV2.kills=num(p.meta.sharedDropV2.kills,0)+1;
    p.meta.sharedDropV2.byMode=p.meta.sharedDropV2.byMode||{};p.meta.sharedDropV2.byMode[mode]=num(p.meta.sharedDropV2.byMode[mode],0)+1;
    if(got.length){p.meta.sharedDropV2.items=num(p.meta.sharedDropV2.items,0)+got.length;save();notify(`🎁 ${label(mode)} • ${got.join(' + ')}`)}
    else{try{W.autoSave?.()}catch(e){}}
    return got;
  }

  function awardWildVictory(enemy){return awardCommon(enemy,modeName())}

  function worldRareDrop(target){
    const p=ensure(),level=Math.max(1,num(target?.lvl??target?.level,1)),phase=Math.max(1,Math.floor((level-1)/10)+1),normalBase=Math.max(1,42+phase*4.4),maxHp=Math.max(1,num(target?.maxHp??target?.max??target?.baseMaxHp,100)),ratio=Math.max(1,maxHp/normalBase),diff=Math.max(1,Math.min(14,(1+Math.log2(ratio)*.52)*(1+Math.max(0,phase-1)*.006))),variant=(target?.mega&&target?.shiny)?2.25:target?.mega?1.8:target?.shiny?1.35:1,boss=(target?.boss||target?.isBoss)?4.5:1,mult=(1+buff('drop')/100)*variant*boss*diff,items=[];
    /* World usa metade da chance e cada item continua independente. */
    if(Math.random()<.5*.000060*mult)items.push('Fragmento Mega Stone');
    if(Math.random()<.5*.000080*mult)items.push('Shiny Stone');
    if(Math.random()<.5*.000710*mult)items.push(SURV_COMMON_STONES[Math.floor(Math.random()*SURV_COMMON_STONES.length)]);
    if(!items.length)return[];items.forEach(i=>addItem(p,i));save();notify(`🌍 Mundo Pokémon • ${items.join(' + ')}`);return items;
  }

  function installEndBattle(){
    const old=W.endBattle;if(typeof old!=='function'||old.__psySharedDropsV2End)return;
    const wrapped=function(won){
      const mode=inferMode(),previous=W.__psyDropContext,ctx={mode,commonAwarded:false};W.__psyDropContext=ctx;
      try{
        const inGym=(()=>{try{return typeof gymBattle!=='undefined'&&!!gymBattle}catch(e){return false}})();
        if(won&&!inGym&&W.battleData?.wild)awardCommon(W.battleData.wild,mode);
        return old.apply(this,arguments);
      }finally{W.__psyDropContext=previous}
    };
    wrapped.__psySharedDropsV2End=true;wrapped.__psySharedOriginal=old;W.endBattle=wrapped;try{endBattle=wrapped}catch(e){}
  }
  function installWorldKill(){
    const old=W.handleWorldKill;if(typeof old!=='function'||old.__psySharedDropsV2World)return;
    const wrapped=function(target){const prev=W.__psyDropContext,ctx={mode:'world',commonAwarded:false};W.__psyDropContext=ctx;try{const r=old.apply(this,arguments);if(!ctx.commonAwarded)awardCommon(target,'world');worldRareDrop(target);return r}finally{W.__psyDropContext=prev}};
    wrapped.__psySharedDropsV2World=true;wrapped.__psySharedOriginal=old;W.handleWorldKill=wrapped;try{handleWorldKill=wrapped}catch(e){}
  }
  function installCardContext(){const old=W.cgWinStage;if(typeof old!=='function'||old.__psySharedDropsV2Card)return;const wrapped=function(){const prev=W.__psyDropContext;W.__psyDropContext={mode:'cards',commonAwarded:true};try{return old.apply(this,arguments)}finally{W.__psyDropContext=prev}};wrapped.__psySharedDropsV2Card=true;W.cgWinStage=wrapped;try{cgWinStage=wrapped}catch(e){}}

  W.psySharedCombatDrop=awardCommon;
  W.psySharedWildVictoryDrop=awardWildVictory;
  W.psySharedWorldRareDrop=worldRareDrop;
  W.psyCommonDropHooks=function(id){return awardCommon(id,W.__psyDropContext?.mode||'auto')};
  W.PSY=W.PSY||{};
  W.PSY.sharedModeDrops={build:BUILD,dropTableForId:(id,mode='wild')=>dropProfile(id,mode),common:{craftEssences:[...new Set(TYPES.map(t=>essence(t).ess))],questMaterials:[...new Set(Object.values(QUEST_LOOT).flat())]},exclusive:EXCLUSIVE_REWARDS,rates:{craftEssence:'0,60% base; World/Survivor/Idle = 0,15%; bônus de Drop até 2x',questCommon:'1,20% base; World/Survivor/Idle = 0,30%; bônus de Drop até 2x',questRare:'0,25% base; World/Survivor/Idle = 0,0625%; bônus de Drop até 2x',rule:'rolagens independentes; múltiplos itens podem cair na mesma kill; Survivor/World/Idle: 25% da taxa cheia + teto 15/700; Fast Encounter: 40% da taxa cheia + teto 15/700; Wild/Hunt: taxa cheia + teto 30/700'},awardCommon,awardWildVictory,awardWorldRare:worldRareDrop};

  installEndBattle();installWorldKill();installCardContext();
  console.log('✅ PSYWORLD Shared Drops V10: rolls independentes de craft/quest em Wild/Hunt/Fast; paridade World/Idle preservada.');
})(window);
