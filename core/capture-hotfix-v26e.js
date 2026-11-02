(function(W,D){
'use strict';
if(W.__PSYWORLD_CAPTURE_HOTFIX_V62__)return;
W.__PSYWORLD_CAPTURE_HOTFIX_V62__=true;
const BUILD='CAPTURE_V62_TALENT_BONUS_REWORK_20260906';
const FINAL_CAP=30;
const TIER_FACTOR={E:1,D:.90,C:.78,B:.66,A:.52,S:.38,SS:.27,SSS:.20,UR:.14,'UR+':.10,'UR++':.07};
let captureBusy=false,suppressBallMenuUntil=0;
const toast=(m,t=3200)=>{try{W.notif?.(m,t)}catch(_){console.log('[V40]',m)}};
const online=()=>!!W.psyOnlineAuthorityV26?.online?.();
const idem=()=>{try{return 'capture:'+crypto.randomUUID()}catch(_){return 'capture:'+Date.now()+':'+Math.random().toString(36).slice(2)}};
function activeBattle(){try{if(typeof battleData!=='undefined'&&battleData)return battleData}catch(_){}return W.battleData||null}
function player(){try{if(typeof P!=='undefined'&&P)return P}catch(_){}return W.P||null}
function gymActive(){try{if(typeof gymBattle!=='undefined'&&gymBattle)return true}catch(_){}return !!W.gymBattle||D.getElementById('gym-progress')?.style.display==='block'}
function tierOf(w){try{const fn=W.getTier||(typeof getTier==='function'?getTier:null);return String(fn?.(w.id,!!w.shiny,!!w.isMega,!!w.isBoss)||'E')}catch(_){return'E'}}
function clamp(v,a,b){v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):a}

/* V40: o legado possuía um override tardio que fazia getTotalBuff('cap') = 0.
   O bônus de captura agora é lido diretamente do save para não poder ser anulado. */
function captureBonusPoints(){
  const P0=player();if(!P0)return 0;
  /* V62: existem dois sistemas legados de bônus do treinador.
     trainerBuffs guarda compras/bonificações antigas e trainerTalents guarda
     os pontos gastos na tela atual de Talentos. Ambos precisam valer. */
  const world=Math.max(0,Number(P0.worldBuffs?.cap||0));
  const legacyTrainer=Math.max(0,Number(P0.trainerBuffs?.cap||0));
  const talentLevels=Math.max(0,Number(P0.trainerTalents?.cap||0));
  let talentPer=1;
  try{talentPer=Math.max(0,Number((W.TALENT_CONFIG||(typeof TALENT_CONFIG!=='undefined'?TALENT_CONFIG:null))?.cap?.per||1))}catch(_){}
  const trainerTalent=talentLevels*talentPer;
  let n=world+legacyTrainer+trainerTalent;
  const now=Date.now(),buffs=Array.isArray(P0.meta?.tempBuffs)?P0.meta.tempBuffs:[];
  for(const b of buffs){
    if(String(b?.kind||'').toLowerCase()!=='cap')continue;
    const active=Number(b?.remainingMs||0)>0||Number(b?.until||0)>now;
    if(active)n+=Math.max(0,Number(b?.amount||0));
  }
  return clamp(n,0,100);
}
function vipBonusPoints(){return Number(player()?.meta?.vipUntil||0)>Date.now()?20:0}
function installCaptureBuffBridge(){
  const cur=W.getTotalBuff;if(typeof cur!=='function'||cur.__psyCaptureBuffV40)return;
  const f=function(k){if(String(k||'').toLowerCase()==='cap')return captureBonusPoints();return cur.apply(this,arguments)};
  f.__psyCaptureBuffV40=true;f.__psyOriginal=cur;W.getTotalBuff=f;try{getTotalBuff=f}catch(_){}
}

function evolutionStage(w){
  const id=Number(w?.id||0);if(!id)return 1;
  try{
    const fn=W.psyTierEvolutionData||(typeof psyTierEvolutionData==='function'?psyTierEvolutionData:null);
    const st=Number(fn?.(id)?.stage||0);if(st)return Math.max(1,Math.min(3,st));
  }catch(_){}
  let parent=0,grand=0;
  try{
    const em=(typeof EVOLUTION_MAP!=='undefined'?EVOLUTION_MAP:W.EVOLUTION_MAP)||{};
    for(const [from,e] of Object.entries(em)){if(Number(e?.to)===id){parent=Number(from);break}}
    const se=(typeof SPECIAL_EVOLUTIONS!=='undefined'?SPECIAL_EVOLUTIONS:W.SPECIAL_EVOLUTIONS)||{};
    if(!parent)for(const [from,opts] of Object.entries(se)){if(Object.values(opts||{}).some(e=>Number(e?.to)===id)){parent=Number(from);break}}
    if(parent){
      for(const [from,e] of Object.entries(em)){if(Number(e?.to)===parent){grand=Number(from);break}}
      if(!grand)for(const [from,opts] of Object.entries(se)){if(Object.values(opts||{}).some(e=>Number(e?.to)===parent)){grand=Number(from);break}}
    }
  }catch(_){}
  return grand?3:parent?2:1;
}
function ballMultiplier(ballName,wild){
  try{const v=Number(W.psyCaptureBallMultiplier?.(ballName,wild));if(Number.isFinite(v)&&v>0)return v}catch(_){}
  try{return Math.max(.8,Number(W.BALL_DATA?.[ballName]?.chance||(typeof BALL_DATA!=='undefined'?BALL_DATA?.[ballName]?.chance:1)||1))}catch(_){return 1}
}
function captureDetails(ballName,wildArg){
  const bd=activeBattle(),wild=wildArg||bd?.wild;if(!wild)return {chance:0};
  const P0=player(),tier=tierOf(wild),lvl=Math.max(1,Number(wild.level||wild.lvl||1));
  const stage=evolutionStage(wild),rar=wild.rarity||{n:'Lixo',mult:1},rarMult=Math.max(1,Number(rar.mult||1));
  const maxHp=Math.max(1,Number(bd?.wildMaxHp||wild.maxHp||wild.hp||1));
  const curHp=clamp(Number(bd?.wildHp??wild.hp??maxHp),0,maxHp),hpPct=clamp(curHp/maxHp,0,1);
  const tierFactor=Number(TIER_FACTOR[tier]??.30);
  const evoFactor=stage===1?1:stage===2?.82:.68;
  const levelFactor=Math.max(.60,1-Math.max(0,lvl-10)*.0045);
  const qualityFactor=1/Math.sqrt(rarMult);
  let formFactor=1;if(wild.shiny&&wild.isMega)formFactor=.20;else if(wild.isMega)formFactor=.50;else if(wild.shiny)formFactor=.35;
  const baseChance=Math.min(20,20*tierFactor*evoFactor*levelFactor*qualityFactor*formFactor);
  const hpFactor=1+(1-hpPct)*.65,ball=ballMultiplier(ballName,wild),preBonus=baseChance*ball*hpFactor;
  const captureBonus=captureBonusPoints(),vipBonus=vipBonusPoints();
  const chance=clamp(preBonus+captureBonus+vipBonus,.01,FINAL_CAP);
  return {chance,baseChance,preBonus,captureBonus,vipBonus,ballMultiplier:ball,hpFactor,hpPct,tier,tierFactor,level:lvl,levelFactor,evolutionStage:stage,evoFactor,quality:String(rar.n||'Lixo'),rarityMult:rarMult,qualityFactor,formFactor};
}
W.PSY_CAPTURE_FINAL_CAP=FINAL_CAP;
W.psyCaptureBonusPointsV62=captureBonusPoints;
W.psyCaptureBonusPointsV40=captureBonusPoints;
W.psyCaptureBreakdownV62=function(ballName,wildArg){return captureDetails(ballName,wildArg)};
W.psyCaptureBreakdownV40=W.psyCaptureBreakdownV62;
W.psyCaptureChancePct=function(ballName,wildArg){return Number(captureDetails(ballName,wildArg).chance||0)};

function refreshBattle(){try{if(typeof updateBattleHP==='function')updateBattleHP();else W.updateBattleHP?.()}catch(_){}try{W.updateHUD?.()}catch(_){}}
function finishBattle(won){try{if(typeof endBattle==='function')return endBattle(won)}catch(_){}return W.endBattle?.(won)}
function closeBallMenu(){
  try{W.psy19CloseBalls?.()}catch(_){}
  const el=D.getElementById('psy19-ball-screen');
  if(el){el.style.display='none';el.style.pointerEvents='none';el.setAttribute('aria-hidden','true')}
}
function suppressBallMenu(ms=1800){suppressBallMenuUntil=Math.max(suppressBallMenuUntil,Date.now()+ms);closeBallMenu()}
function installBallSelectorGuard(){
  const cur=W.openBattleBallSelector;
  if(typeof cur!=='function'||cur.__psyCaptureModalV39)return;
  const f=function(){if(Date.now()<suppressBallMenuUntil){closeBallMenu();return}const r=cur.apply(this,arguments);const el=D.getElementById('psy19-ball-screen');if(el){el.style.pointerEvents='';el.removeAttribute('aria-hidden')}return r};
  f.__psyCaptureModalV39=true;f.__psyOriginal=cur;W.openBattleBallSelector=f;try{openBattleBallSelector=f}catch(_){}
}
function applyServerState(d){const P0=player();if(!P0||!d)return;if(d.player){for(const k of ['gold','diamonds','psycoin'])if(Number.isFinite(Number(d.player[k])))P0[k]=Number(d.player[k])}if(d.inventory&&typeof d.inventory==='object'&&!Array.isArray(d.inventory)){P0.inventory={};for(const [k,v] of Object.entries(d.inventory)){const q=Math.max(0,Number(v)||0);if(q>0)P0.inventory[k]=q}}try{W.updateHUD?.()}catch(_){}try{W.autoSave?.()}catch(_){}setTimeout(()=>{try{W.psyOnlineAuthorityV26?.syncServer?.(false)}catch(_){}},120)}
function enemyCounter(){
  try{if(typeof W.psyV9EnemyTurnAfterCapture==='function')return W.psyV9EnemyTurnAfterCapture()}catch(e){console.warn('[V40 counter authoritative]',e)}
  try{
    const bd=activeBattle(),P0=player(),w=bd?.wild,me=P0?.team?.[0];if(!w||!me||Number(me.hp||0)<=0)return;
    let def=Number(me.def||0);try{def=Number(W.calcDetailedStats?.(me)?.finalDef||def)}catch(_){}
    let atk=Number(bd?.wildAtk||w?.atk||0);if(!atk){try{atk=Number(W.psyBattleWildBaseAtkV27?.(w)||0)}catch(_){}}
    if(!atk)atk=Math.max(12,Math.floor(Number(w.level||w.lvl||5)*3.5+Number(bd.wildMaxHp||100)*.025));
    const dmg=Math.max(1,Math.floor(atk*.45*(100/(100+Math.max(0,def)*.15))));me.hp=Math.max(0,Number(me.hp||0)-dmg);
    const log=D.getElementById('battle-log');if(log)log.textContent=`A tentativa gastou seu turno. ${w.name||'O inimigo'} atacou: -${dmg} HP.`;
    refreshBattle();if(me.hp<=0)W.psyHandleBattleFaint?.();
  }catch(e){console.warn('[V40 counter fallback]',e)}
}
function buildPayload(ballName){
  const bd=activeBattle(),P0=player(),wild=bd?.wild;if(!bd||!P0||!wild)throw new Error('Nenhum encontro ativo para capturar.');
  if(gymActive())throw new Error('Não é permitido capturar Pokémon em Ginásios.');if((P0.inventory?.[ballName]||0)<=0)throw new Error('Você não possui esta Ball.');
  if(wild.psyduckDungeon||W.isDungeonBoss||W.isDungeonMega||wild.isBoss)throw new Error('Este encontro não pode ser capturado.');
  const tier=tierOf(wild);if(!wild.shiny&&['SS','SSS','UR','UR+','UR++'].includes(tier))throw new Error('Pokémon Tier SS+ não pode ser capturado em encontro normal.');
  let raw='';try{raw=String(W.TYPE_BY_ID_ALL?.[wild.id]||W.TYPE_BY_ID_FULL?.[wild.id]||W.TYPE_BY_ID_EXT?.[wild.id]||wild.type||'Normal')}catch(_){raw=String(wild.type||'Normal')}
  const types=raw.split(/[\/|,;]+/).map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,2),hp=Math.max(0,Math.min(1,Number(bd.wildHp??1)/Math.max(1,Number(bd.wildMaxHp||1))));
  const rar=wild.rarity||{n:'Lixo',mult:1},stage=evolutionStage(wild),preview=captureDetails(ballName,wild);
  return {wild,rar,preview,payload:{species:Number(wild.id),level:Number(wild.level||wild.lvl||1),shiny:!!wild.shiny,mega:!!wild.isMega,boss:!!wild.isBoss,tier,rarity:rar.n||'Lixo',rarity_mult:Number(rar.mult||1),hp_pct:hp,ball:String(ballName),target_types:types,cap_buff:captureBonusPoints(),pokemon_data:{id:Number(wild.id),name:wild.name,level:Number(wild.level||wild.lvl||1),shiny:!!wild.shiny,isMega:!!wild.isMega,megaForm:wild.megaForm||'',tier,rarity:rar,evolutionStage:stage}}};
}
function install(){
  installCaptureBuffBridge();installBallSelectorGuard();
  /* Reaplica a fórmula V40 caso algum bundle legado tente sobrescrevê-la depois. */
  if(W.psyCaptureChancePct!==v40Chance)W.psyCaptureChancePct=v40Chance;
  const cur=W.tryCaptureBattle;if(typeof cur!=='function'||cur.__psyCaptureV40)return;
  const offline=cur.__offlineOriginal||cur.__psyV26Original||cur;
  const fixed=async function(ballName){
    suppressBallMenu(2200);
    if(!online()){try{return await offline.apply(this,arguments)}finally{closeBallMenu()}}
    if(captureBusy){closeBallMenu();return toast('⏳ Uma tentativa de captura já está em andamento.')}
    captureBusy=true;W.__psyCaptureBusyV26F=true;
    try{
      const {wild,rar,payload,preview}=buildPayload(ballName),api=W.psyOnlineAuthorityV26?.request;if(typeof api!=='function')throw new Error('Autoridade online ainda não está pronta.');
      const key=idem();console.log('[V40 capture] enviando',{ball:ballName,species:wild.id,level:payload.level,tier:payload.tier,quality:payload.rarity,evolution_stage:payload.pokemon_data.evolutionStage,hp_pct:payload.hp_pct,base_chance:+preview.baseChance.toFixed(3),ball_multiplier:preview.ballMultiplier,capture_bonus:payload.cap_buff,vip_bonus:preview.vipBonus,chance_preview:+preview.chance.toFixed(3)});
      const d=await api('capture-attempt',payload,key);if(!d)throw new Error('Servidor não retornou a tentativa.');closeBallMenu();
      console.log('[V40 capture] retorno',{version:d.capture_version,captured:!!d.captured,chance:Number(d.chance||0),base_chance:Number(d.base_chance||0),pre_bonus:Number(d.pre_bonus_chance||0),capture_bonus:Number(d.capture_bonus||0),vip_bonus:Number(d.vip_bonus||0),evolution_stage:Number(d.evolution_stage||0),ball_multiplier:Number(d.ball_multiplier??1),remaining:Number(d.ball_remaining??-1)});
      applyServerState(d);const chance=Number(d.chance||0),txt=chance<1?chance.toFixed(2):chance.toFixed(1);
      if(d.captured){
        const P1=player();let pk;try{pk=W.createCapturedPoke?.(wild.id,rar,!!wild.shiny,false,!!wild.isMega)}catch(_){}if(!pk)pk={id:wild.id,name:wild.name||('Pokémon '+wild.id),level:1,shiny:!!wild.shiny,isMega:!!wild.isMega,rarity:rar};
        if(d.pokemon_uid)pk.pokemon_uid=d.pokemon_uid;P1.box=P1.box||[];P1.box.push(pk);P1.meta=P1.meta||{};P1.meta.captures=Math.max(Number(P1.meta.captures||0)+1,Number(d?.system?.progress?.captures||0));
        const log=D.getElementById('battle-log');if(log)log.textContent=`🎯 Chance de captura: ${txt}% • ${pk.name} capturado!`;toast(`✅ ${pk.name} capturado! • Chance: ${txt}%`,3200);
        try{W.renderTeam?.();W.autoSave?.()}catch(_){}setTimeout(()=>W.psyOnlineAuthorityV26?.syncServer?.(false),150);finishBattle(true);
      }else{
        const log=D.getElementById('battle-log');if(log)log.textContent=`🎯 Chance de captura: ${txt}% • ${wild.name||'Pokémon'} escapou.`;toast(`❌ Escapou! • Chance: ${txt}%`,2800);setTimeout(enemyCounter,280);
      }
    }catch(e){console.error('[V40 capture]',e);toast('❌ Captura online: '+String(e?.message||e).replaceAll('_',' '),4200)}
    finally{captureBusy=false;W.__psyCaptureBusyV26F=false;suppressBallMenu(900);[0,80,250,600].forEach(ms=>setTimeout(closeBallMenu,ms))}
  };
  fixed.__psyCaptureHotfixV26E=true;fixed.__psyCaptureHotfixV26F=true;fixed.__psyCaptureModalV39=true;fixed.__psyCaptureV40=true;fixed.__psyV26=true;fixed.__psyV26Original=offline;fixed.__offlineOriginal=offline;
  W.tryCaptureBattle=fixed;try{tryCaptureBattle=fixed}catch(_){}console.log('🎯 PSYWORLD Capture V62 instalado • talentos + world + VIP • qualidade/evolução/força • bônus aditivo • teto 30%');
}
function v40Chance(ballName,wildArg){return Number(captureDetails(ballName,wildArg).chance||0)}
W.psyCaptureChancePct=v40Chance;
setInterval(install,1200);setTimeout(install,60);D.addEventListener('visibilitychange',()=>{if(D.visibilityState==='visible')install()});
console.log('🎯 PSYWORLD Capture V62 carregado',BUILD);
})(window,document);
