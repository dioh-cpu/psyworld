/* PSYWORLD — Battle Status System V10 / Tier-Rarity V27
   Applies major status conditions consistently to Wild/Hunt/Fast Encounter/Gym battles.
   Loaded after legacy-runtime so it becomes the authoritative turn handler. */
(function(){
  'use strict';
  const W=window,D=document;
  const BUILD='BATTLE_STATUS_TIER_RARITY_V27';
  const PVE_ENEMY_DAMAGE_SCALE=.72;

  const STATUS_META={
    sleep:{label:'SONO',icon:'💤',color:'#818cf8',bg:'#1e1b4b'},
    paralysis:{label:'PARALISIA',icon:'⚡',color:'#facc15',bg:'#422006'},
    poison:{label:'VENENO',icon:'☠️',color:'#d946ef',bg:'#3b0764'},
    burn:{label:'BURN',icon:'🔥',color:'#fb923c',bg:'#431407'},
    leechseed:{label:'LEECH SEED',icon:'🌱',color:'#4ade80',bg:'#052e16'}
  };
  const compact=n=>String(n||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
  const typesOf=p=>String(p?.type||'').split('/').map(x=>compact(x));

  /* Direct status moves. Keys use Showdown-style compact names so both "Thunder Wave"
     and the current learnset label "Thunderwave" resolve to the same effect. */
  const DIRECT_STATUS={
    sing:{status:'sleep',chance:1},sleeppowder:{status:'sleep',chance:1},hypnosis:{status:'sleep',chance:1},
    spore:{status:'sleep',chance:1},lovelykiss:{status:'sleep',chance:1},grasswhistle:{status:'sleep',chance:1},darkvoid:{status:'sleep',chance:1},
    thunderwave:{status:'paralysis',chance:1},stunspore:{status:'paralysis',chance:1},glare:{status:'paralysis',chance:1},
    poisonpowder:{status:'poison',chance:1},toxic:{status:'poison',chance:1},poisongas:{status:'poison',chance:1},toxicthread:{status:'poison',chance:1},
    willowisp:{status:'burn',chance:1},leechseed:{status:'leechseed',chance:1},leechseedattack:{status:'leechseed',chance:1}
  };

  /* Secondary effects for common damaging moves. */
  const SECONDARY_STATUS={
    poisonsting:{status:'poison',chance:.30},sludge:{status:'poison',chance:.30},sludgebomb:{status:'poison',chance:.30},sludgewave:{status:'poison',chance:.10},
    poisonjab:{status:'poison',chance:.30},gunkshot:{status:'poison',chance:.30},crosspoison:{status:'poison',chance:.10},twineedle:{status:'poison',chance:.20},
    thundershock:{status:'paralysis',chance:.10},spark:{status:'paralysis',chance:.30},thunderbolt:{status:'paralysis',chance:.10},discharge:{status:'paralysis',chance:.30},
    thunder:{status:'paralysis',chance:.30},dragonbreath:{status:'paralysis',chance:.30},lick:{status:'paralysis',chance:.30},bodyslam:{status:'paralysis',chance:.30},
    forcepalm:{status:'paralysis',chance:.30},bounce:{status:'paralysis',chance:.30},nuzzle:{status:'paralysis',chance:1},zapcannon:{status:'paralysis',chance:1},
    ember:{status:'burn',chance:.10},flamewheel:{status:'burn',chance:.10},flamethrower:{status:'burn',chance:.10},fireblast:{status:'burn',chance:.10},
    lavaplume:{status:'burn',chance:.30},scald:{status:'burn',chance:.30},inferno:{status:'burn',chance:1},sacredfire:{status:'burn',chance:.50},flareblitz:{status:'burn',chance:.10},blueflare:{status:'burn',chance:.20}
  };

  const STATUS_MOVE_TYPE={
    sing:'Normal',sleeppowder:'Grass',hypnosis:'Psychic',spore:'Grass',lovelykiss:'Normal',grasswhistle:'Grass',darkvoid:'Dark',
    thunderwave:'Electric',stunspore:'Grass',glare:'Normal',poisonpowder:'Poison',toxic:'Poison',poisongas:'Poison',toxicthread:'Poison',willowisp:'Fire',leechseed:'Grass'
  };

  function state(){
    if(typeof battleData==='undefined'||!battleData)return null;
    battleData.majorStatus=battleData.majorStatus||{enemy:null,player:null};
    battleData.statusFx=battleData.statusFx||{enemyAtk:0,enemyAtkTurns:0,enemyDef:0,enemyDefTurns:0,myAtk:0,myAtkTurns:0,myDef:0,myDefTurns:0,protect:0};
    return battleData.majorStatus;
  }

  function statusImmune(target,status){
    const poke=target==='enemy'?battleData?.wild:P?.team?.[0];
    const t=typesOf(poke);
    if(status==='poison'&&(t.includes('poison')||t.includes('veneno')||t.includes('venenoso')||t.includes('steel')||t.includes('aco')||t.includes('metal')))return true;
    if(status==='burn'&&(t.includes('fire')||t.includes('fogo')))return true;
    if(status==='paralysis'&&(t.includes('electric')||t.includes('eletrico')))return true;
    if(status==='leechseed'&&t.includes('grass'))return true;
    return false;
  }

  function targetName(target){return target==='enemy'?(battleData?.wild?.name||'Inimigo'):(P?.team?.[0]?.name||'Seu Pokémon')}

  function applyStatus(target,status,sourceText){
    const s=state();if(!s||!STATUS_META[status])return {ok:false,text:''};
    const now=Date.now();
    if(s[target]&&s[target].id!==status)return {ok:false,text:`${targetName(target)} já está com ${STATUS_META[s[target].id]?.label||'um status'}.`};
    if(statusImmune(target,status))return {ok:false,text:`${targetName(target)} é imune a ${STATUS_META[status].label}.`};
    if(s[target]){
      s[target].expiresAt=Math.max(Number(s[target].expiresAt||now),now)+2000;
      return {ok:true,text:`${STATUS_META[status].icon} ${STATUS_META[status].label} prolongado por +2s.`};
    }
    const obj={id:status,appliedAt:now,expiresAt:now+3000,nextTickAt:now+1000};
    if(status==='leechseed')obj.source=target==='enemy'?'player':'enemy';
    s[target]=obj;
    renderStatus();
    const m=STATUS_META[status];
    return {ok:true,text:`${m.icon} ${targetName(target)} ficou com ${m.label}${sourceText?' por '+sourceText:''}!`};
  }

  function clearStatus(target){const s=state();if(s)s[target]=null;renderStatus()}

  function ensureBadgeHost(side){
    const root=D.getElementById(side==='enemy'?'battle-enemy':'battle-player');if(!root)return null;
    let el=D.getElementById(side+'-status-indicators');
    if(!el){el=D.createElement('div');el.id=side+'-status-indicators';el.className='psy-battle-status-indicators';root.appendChild(el)}
    return el;
  }

  function badge(status){
    const m=STATUS_META[status.id];if(!m)return '';
    const seconds=Math.max(0,Math.ceil((Number(status.expiresAt||0)-Date.now())/1000));
    const timer=seconds?` ${seconds}s`:'';
    return `<span class="psy-major-status" style="--sc:${m.color};--sbg:${m.bg}">${m.icon} ${m.label}${timer}</span>`;
  }

  function fxBadges(side){
    if(typeof battleData==='undefined'||!battleData)return '';
    const f=battleData.statusFx||{};const out=[];
    if(side==='enemy'){
      if(f.enemyAtk)out.push(`<span class="psy-stat-status">ATK ${f.enemyAtk>0?'+':''}${f.enemyAtk}%${f.enemyAtkTurns?' '+f.enemyAtkTurns+'t':''}</span>`);
      if(f.enemyDef)out.push(`<span class="psy-stat-status">DEF ${f.enemyDef>0?'+':''}${f.enemyDef}%${f.enemyDefTurns?' '+f.enemyDefTurns+'t':''}</span>`);
    }else{
      if(f.myAtk)out.push(`<span class="psy-stat-status">ATK ${f.myAtk>0?'+':''}${f.myAtk}%${f.myAtkTurns?' '+f.myAtkTurns+'t':''}</span>`);
      if(f.myDef)out.push(`<span class="psy-stat-status">DEF ${f.myDef>0?'+':''}${f.myDef}%${f.myDefTurns?' '+f.myDefTurns+'t':''}</span>`);
      if(f.protect)out.push(`<span class="psy-stat-status">🛡️ PROTECT</span>`);
    }
    return out.join('');
  }

  function renderStatus(){
    const s=state();if(!s)return;
    const e=ensureBadgeHost('enemy'),p=ensureBadgeHost('player');
    if(e)e.innerHTML=(s.enemy?badge(s.enemy):'')+fxBadges('enemy');
    if(p)p.innerHTML=(s.player?badge(s.player):'')+fxBadges('player');
  }
  W.psyBattleRenderStatus=renderStatus;

  function preAction(target){
    const s=state();const st=s?.[target];if(!st)return {canAct:true,text:''};
    if(Number(st.expiresAt||0)<=Date.now()){s[target]=null;renderStatus();return {canAct:true,text:''};}
    if(st.id==='sleep'){
      return {canAct:false,text:`💤 ${targetName(target)} está dormindo e não consegue agir!`};
    }
    if(st.id==='paralysis'&&Math.random()<.25)return {canAct:false,text:`⚡ ${targetName(target)} está paralisado e não conseguiu se mover!`};
    return {canAct:true,text:''};
  }

  function residual(target){
    const s=state();const st=s?.[target];if(!st)return null;
    const now=Date.now();
    if(Number(st.expiresAt||0)<=now){s[target]=null;return null}
    if(Number(st.nextTickAt||0)>now)return null;
    st.nextTickAt=now+1000;
    if(st.id==='leechseed'){
      const source=st.source||'player',targetMax=source==='player'?Number(battleData?.wildMaxHp||1):Number(P?.team?.[0]?.maxHp||1),dmg=Math.max(1,Math.floor(targetMax/16));
      if(source==='player'){
        battleData.wildHp=Math.max(0,Number(battleData.wildHp||0)-dmg);
        P.team[0].hp=Math.min(Number(P.team[0].maxHp||1),Number(P.team[0].hp||0)+dmg);
      }else{
        P.team[0].hp=Math.max(0,Number(P.team[0].hp||0)-dmg);
        battleData.wildHp=Math.min(Number(battleData.wildMaxHp||1),Number(battleData.wildHp||0)+dmg);
      }
      return {dmg,text:`🌱 Leech Seed drenou ${dmg} HP e curou ${source==='player'?P.team[0].name:targetName('enemy')}!`};
    }
    if(st.id!=='poison'&&st.id!=='burn')return null;
    const max=target==='enemy'?Number(battleData?.wildMaxHp||1):Number(P?.team?.[0]?.maxHp||1);
    const pct=st.id==='poison'?1/8:1/16;
    const dmg=Math.max(1,Math.floor(max*pct));
    if(target==='enemy')battleData.wildHp=Math.max(0,Number(battleData.wildHp||0)-dmg);
    else P.team[0].hp=Math.max(0,Number(P.team[0].hp||0)-dmg);
    const m=STATUS_META[st.id];return {dmg,text:`${m.icon} ${targetName(target)} sofreu ${dmg} de dano de ${m.label}!`};
  }

  function tickFx(){
    const f=battleData?.statusFx;if(!f)return;
    const now=Date.now();
    if(Number(f.__nextTickAt||0)>now)return;
    f.__nextTickAt=now+1000;
    if(f.enemyAtkTurns>0&&--f.enemyAtkTurns<=0)f.enemyAtk=0;
    if(f.enemyDefTurns>0&&--f.enemyDefTurns<=0)f.enemyDef=0;
    if(f.myAtkTurns>0&&--f.myAtkTurns<=0)f.myAtk=0;
    if(f.myDefTurns>0&&--f.myDefTurns<=0)f.myDef=0;
  }

  function bumpFx(f,key){
    const turns=key+'Turns';
    f[turns]=Number(f[turns]||0)>0?Number(f[turns])+2:3;
  }

  function moveStatusInfo(move){
    const k=compact(move?.name);return {key:k,direct:DIRECT_STATUS[k]||null,secondary:SECONDARY_STATUS[k]||null};
  }

  const STAT_STATUS_KEYS=new Set(['growl','tailwhip','leer','harden','defensecurl','swordsdance','howl','calmmind','protect']);
  function normalizeMove(move){
    const m={...(move||{})};const k=compact(m.name);const ds=DIRECT_STATUS[k];
    if(ds){m.power=0;m.type=STATUS_MOVE_TYPE[k]||m.type||'Status';m._majorStatus=ds.status}
    else if(STAT_STATUS_KEYS.has(k)){m.power=0;m.type='Status'}
    return m;
  }

  function tierOf(w){
    try{return String((W.getTier||getTier)(Number(w?.id||1),!!w?.shiny,!!w?.isMega,!!w?.isBoss)||'E')}catch(_){return 'E'}
  }
  function ensureWildRarity(w){
    if(!w||!w.id)return {n:'Lixo',mult:1};
    if(w.rarity&&Number(w.rarity.mult||0)>0)return w.rarity;
    const tier=tierOf(w);
    try{w.rarity=(W.rollRarity||rollRarity)(tier)}catch(_){w.rarity={n:'Lixo',mult:1}}
    return w.rarity;
  }
  function wildBaseAtk(w){
    if(!w)return 1;
    const rarity=ensureWildRarity(w),lv=Math.max(1,Number(w.level||w.lvl||1));
    let atk=20+lv*7;
    try{const fn=W.calcBaseAtkV14||calcBaseAtkV14;atk=Number(fn(lv,Number(rarity.mult||1),!!w.shiny,!!w.isMega,Number(w.id||1)))||atk}catch(_){}
    return Math.max(1,Math.floor(atk));
  }
  W.psyBattleWildBaseAtkV27=wildBaseAtk;

  function appendLog(text){const l=D.getElementById('battle-log');if(l&&text)l.textContent=(l.textContent?l.textContent+' ':'')+text}
  function setLog(text){const l=D.getElementById('battle-log');if(l)l.textContent=text}

  function finishWildWin(extraText){
    if(!battleData||battleData.state!=='active')return;
    battleData.state='won';
    const w=battleData.wild,lvl=Number(w.level||5),wildType=w.type||'Normal';
    const xp=Math.floor((lvl*85+150)*(1+Number(getTotalBuff?.('xp')||0)/100));
    const gold=Math.floor((lvl*18+80)*(1+Number(getTotalBuff?.('gold')||0)/100));
    P.team[0].exp=(P.team[0].exp||0)+xp;P.gold=(P.gold||0)+gold;
    /* The active Pokémon keeps its normal XP. A Psyduck owned in the box also
       receives this same global XP channel, so it progresses outside Survivor. */
    try{W.psyAwardGlobalPsyduckXp?.(xp,'battle')}catch(e){console.warn('[PSYWORLD] global Psyduck XP',e)}
    try{gainTrainerXp(Math.floor(xp*.1))}catch(e){}
    try{tryDropStone(wildType,lvl)}catch(e){}
    setLog(`🎉 Derrotou Lv.${lvl} ${w.name}! +${xp} EXP +${gold}G${extraText?' '+extraText:''}`);
    try{checkLevelUp();updateHUD()}catch(e){}
    if(typeof gymBattle!=='undefined'&&gymBattle){gymBattle.current++;setTimeout(()=>startNextGymPoke(),900);return}
    setTimeout(()=>endBattle(true),900);
  }

  function finishPlayerLoss(){
    if(!P?.team?.[0]||P.team[0].hp>0)return false;
    if(typeof W.psyHandleBattleFaint==='function'){W.psyHandleBattleFaint();return true}
    if(typeof W.psyOpenBattleSwitch==='function'){setTimeout(()=>W.psyOpenBattleSwitch(true),250);return true}
    setTimeout(()=>endBattle(false),850);return true;
  }

  function applyResiduals(){
    const lines=[];const e=residual('enemy');if(e)lines.push(e.text);const p=residual('player');if(p)lines.push(p.text);
    try{updateBattleHP();updateHUD()}catch(e){}renderStatus();
    if(lines.length)appendLog(lines.join(' '));
    if(Number(battleData?.wildHp||0)<=0){finishWildWin('☠️ KO por status.');return 'win'}
    if(Number(P?.team?.[0]?.hp||0)<=0){finishPlayerLoss();return 'loss'}
    return null;
  }

  function enemyStatusMoveEffect(move){
    const k=compact(move?.name),f=battleData.statusFx,ds=DIRECT_STATUS[k];
    if(ds){if(Math.random()>ds.chance)return 'O efeito falhou.';return applyStatus('player',ds.status,move.name).text}
    if(k==='growl'){f.myAtk=Math.max(-60,(f.myAtk||0)-20);bumpFx(f,'myAtk');return 'ATK do seu Pokémon -20% por 3s.'}
    if(k==='tailwhip'){f.myDef=Math.max(-60,(f.myDef||0)-18);bumpFx(f,'myDef');return 'DEF do seu Pokémon -18% por 3s.'}
    if(k==='leer'){f.myDef=Math.max(-60,(f.myDef||0)-15);bumpFx(f,'myDef');return 'DEF do seu Pokémon -15% por 3s.'}
    if(k==='harden'||k==='defensecurl'){f.enemyDef=Math.min(100,(f.enemyDef||0)+20);bumpFx(f,'enemyDef');return 'DEF do inimigo +20% por 3s.'}
    if(k==='swordsdance'){f.enemyAtk=Math.min(120,(f.enemyAtk||0)+40);bumpFx(f,'enemyAtk');return 'ATK do inimigo +40% por 3s.'}
    if(k==='howl'){f.enemyAtk=Math.min(120,(f.enemyAtk||0)+20);bumpFx(f,'enemyAtk');return 'ATK do inimigo +20% por 3s.'}
    if(k==='calmmind'){f.enemyAtk=Math.min(120,(f.enemyAtk||0)+20);f.enemyDef=Math.min(100,(f.enemyDef||0)+20);bumpFx(f,'enemyAtk');bumpFx(f,'enemyDef');return 'ATK e DEF do inimigo +20% por 3s.'}
    if(k==='protect'){f.enemyProtect=1;return 'O inimigo se protege contra o próximo golpe.'}
    return 'O efeito não alterou o combate.';
  }

  function chooseEnemyMove(){
    const w=battleData?.wild;if(!w)return {name:'Ataque',type:'Normal',power:40};
    try{
      const list=(typeof getMovesForLevel==='function'?getMovesForLevel(w.id,w.level||1):[]).map(normalizeMove).filter(Boolean);
      if(list.length)return list[Math.floor(Math.random()*list.length)];
    }catch(e){}
    return {name:'Ataque',type:String(w.type||'Normal').split('/')[0],power:40};
  }

  function enemyTurn(done,reasonPrefix){
    if(!battleData||battleData.state!=='active'||!P?.team?.[0]){done?.();return}
    const pre=preAction('enemy');
    if(pre.text)appendLog(pre.text);
    if(!pre.canAct){
      tickFx();const res=applyResiduals();
      battleData.turnLock=false;renderStatus();if(!res)done?.();return;
    }
    const em=normalizeMove(chooseEnemyMove()),info=moveStatusInfo(em),w=battleData.wild,p=P.team[0];
    setTimeout(()=>{
      if(!battleData||battleData.state!=='active'){done?.();return}
      try{attackAnimation('enemy')}catch(e){}
      const enemyIsStatus=!!info.direct||Number(em.power||0)<=0||String(em.type||'').toLowerCase()==='status';
      if(enemyIsStatus){
        const txt=enemyStatusMoveEffect(em);
        appendLog(`✨ ${w.name} usou ${em.name}! ${txt}`);
      }else{
        const f=battleData.statusFx||{},stats=calcDetailedStats(p);
        const atk=Math.floor(wildBaseAtk(w)*(1+(f.enemyAtk||0)/100));
        battleData.wildAtk=atk;w.atk=atk;w.tier=tierOf(w);
        const myDef=Math.floor(Number(stats.finalDef||0)*(1+(f.myDef||0)/100));
        const eff=getEffectiveness(String(em.type||w.type||'Normal').split('/')[0],typeof psyResolvePokemonTypes==='function'?psyResolvePokemonTypes(p):(p.type||'Normal'));
        const power=Math.max(1,Number(em.power||40));
        let base=Math.floor((atk*power/55)+(Number(w.level||1)*3));
        let dmg=f.protect?0:Math.floor(base*PVE_ENEMY_DAMAGE_SCALE*eff*(100/(100+myDef*.15)));
        if(!f.protect&&dmg<3)dmg=3;
        if(f.protect){f.protect=0;appendLog(`🛡️ O ataque de ${w.name} foi bloqueado!`)}
        else{
          p.hp=Math.max(0,Number(p.hp||0)-dmg);try{showDmgPopup(dmg,false,false);setPlayerBlink()}catch(e){}
          appendLog(`💢 ${w.name} usou ${em.name}: ${dmg} dmg! ATK ${atk}`);
          if(info.secondary&&Math.random()<=info.secondary.chance){const r=applyStatus('player',info.secondary.status,em.name);if(r.text)appendLog(r.text)}
        }
      }
      tickFx();try{updateBattleHP();updateHUD()}catch(e){}renderStatus();
      if(finishPlayerLoss()){battleData.turnLock=false;return}
      const res=applyResiduals();battleData.turnLock=false;renderStatus();if(!res)done?.();
    },650);
  }

  function statusMoveEffect(move){
    const k=compact(move?.name),f=battleData.statusFx,ds=DIRECT_STATUS[k];
    if(ds){if(Math.random()>ds.chance)return 'O efeito falhou.';return applyStatus('enemy',ds.status,move.name).text}
    if(k==='growl'){f.enemyAtk=Math.max(-60,(f.enemyAtk||0)-20);bumpFx(f,'enemyAtk');return 'ATK do inimigo -20% por 3s.'}
    if(k==='tailwhip'){f.enemyDef=Math.max(-60,(f.enemyDef||0)-18);bumpFx(f,'enemyDef');return 'DEF do inimigo -18% por 3s.'}
    if(k==='leer'){f.enemyDef=Math.max(-60,(f.enemyDef||0)-15);bumpFx(f,'enemyDef');return 'DEF do inimigo -15% por 3s.'}
    if(k==='harden'||k==='defensecurl'){f.myDef=Math.min(100,(f.myDef||0)+20);bumpFx(f,'myDef');return 'DEF +20% por 3s.'}
    if(k==='swordsdance'){f.myAtk=Math.min(120,(f.myAtk||0)+40);bumpFx(f,'myAtk');return 'ATK +40% por 3s.'}
    if(k==='howl'){f.myAtk=Math.min(120,(f.myAtk||0)+20);bumpFx(f,'myAtk');return 'ATK +20% por 3s.'}
    if(k==='calmmind'){f.myAtk=Math.min(120,(f.myAtk||0)+20);f.myDef=Math.min(100,(f.myDef||0)+20);bumpFx(f,'myAtk');bumpFx(f,'myDef');return 'ATK e DEF +20% por 3s.'}
    if(k==='protect'){f.protect=1;return 'Protege contra o próximo ataque.'}
    return 'Efeito de status aplicado.';
  }

  const oldStart=W.startBattle;
  if(typeof oldStart==='function'){
    W.startBattle=startBattle=function(wild){
      try{
        if(wild?.id){wild.tier=tierOf(wild);ensureWildRarity(wild);
          const inGym=typeof gymBattle!=='undefined'&&!!gymBattle;
          const special=!!(wild.isBoss||wild.psyduckDungeon||wild.eeveeDungeon||W.isDungeonBoss||W.isDungeonMega||W.isDungeonShiny);
          if(inGym&&!special){
            const hpFn=W.calcBaseHpV14||calcBaseHpV14;
            const hp=Math.max(1,Math.floor(Number(hpFn(Number(wild.level||wild.lvl||1),Number(wild.rarity?.mult||1),!!wild.shiny,!!wild.isMega,Number(wild.id)))||1));
            wild.maxHp=hp;wild.hp=hp;
          }
        }
      }catch(e){console.warn('[PSYWORLD V27] wild pre-balance',e)}
      const r=oldStart.apply(this,arguments);
      try{if(battleData){battleData.majorStatus={enemy:null,player:null};battleData.turnLock=false;if(battleData.wild){ensureWildRarity(battleData.wild);battleData.wild.tier=tierOf(battleData.wild);battleData.wildAtk=wildBaseAtk(battleData.wild);battleData.wild.atk=battleData.wildAtk;}renderStatus()}}catch(e){}
      return r
    };
  }

  const oldUpdateHP=W.updateBattleHP||((typeof updateBattleHP==='function')?updateBattleHP:null);
  if(typeof oldUpdateHP==='function'){
    W.updateBattleHP=updateBattleHP=function(){const r=oldUpdateHP.apply(this,arguments);try{renderStatus()}catch(e){}return r};
  }

  W.battleAction=battleAction=function(action,moveData){
    try{ensureTrainerData()}catch(e){}
    if(typeof inBattle==='undefined'||!inBattle||!battleData||battleData.state!=='active')return;
    if(action!=='move'){
      /* Keep bag/capture/flee behavior from the existing engine. */
      if(action==='heal')return openBagSelector('potion');
      if(action==='capture'){if((typeof gymBattle!=='undefined'&&!!gymBattle)||document.getElementById('gym-progress')?.style.display==='block')return notif('🚫 Não é permitido capturar Pokémon em Ginásios.',3000);return (typeof window.openBattleBallSelector==='function'?window.openBattleBallSelector():openBagSelector('ball'));}
      if(action==='flee'){try{gymBattle=null}catch(e){}battleData.state='fled';setTimeout(()=>endBattle(false),350);return}
      return;
    }
    if(battleData.turnLock)return;
    battleData.turnLock=true;state();renderStatus();
    const pre=preAction('player');
    if(pre.text)setLog(pre.text);
    if(!pre.canAct){return enemyTurn(()=>{},'status')}
    if(pre.text)appendLog(pre.text);

    const move=normalizeMove(moveData),info=moveStatusInfo(move),key=info.key;
    const explicitStatus=!!DIRECT_STATUS[key];
    const isStatus=explicitStatus||Number(move.power||0)<=0||String(move.type||'').toLowerCase()==='status';
    const f=battleData.statusFx,log=D.getElementById('battle-log');
    let wildType=typeof psyResolvePokemonTypes==='function'?psyResolvePokemonTypes(battleData.wild):(battleData.wild.type||'Normal');
    const stats=calcDetailedStats(P.team[0]);

    try{attackAnimation('player')}catch(e){}
    if(isStatus){
      const txt=statusMoveEffect(move);setLog(`✨ ${P.team[0].name} usou ${move.name}! ${txt}`);renderStatus();
      return enemyTurn(()=>{});
    }

    const eff=getEffectiveness(move.type,wildType),crit=Math.random()<(0.12+Number(getTotalBuff?.('crit')||0)/100);
    const myAtk=Math.floor(Number(stats.finalAtk||0)*(1+(f.myAtk||0)/100));
    const wildDef=Math.floor(Number(battleData.wildMaxHp||100)*.18*(1+(f.enemyDef||0)/100));
    let base=Math.floor((myAtk*Number(move.power||0)/55)+(Number(P.team[0].level||1)*3));
    base=Math.floor(base*(1+Number(getTotalBuff?.('dmg')||0)/100));
    let dmg=eff===0?0:Math.floor(base*eff*(crit?1.9:1)*(100/(100+wildDef*.15)));
    if(eff!==0&&dmg<15)dmg=15+Math.floor(Math.random()*10);
    try{showDmgPopup(dmg,true,crit);if(crit||eff!==1)showEffPopup(eff,crit);setEnemyBlink()}catch(e){}
    if(f.enemyProtect){f.enemyProtect=0;dmg=0;appendLog(`🛡️ ${battleData.wild.name} bloqueou o golpe com Protect!`)}
    battleData.wildHp=Math.max(0,Number(battleData.wildHp||0)-dmg);
    const effTxt=crit?' ⭐ CRÍTICO!':eff===0?' 😴 IMUNE!':eff>=2?' 🔥 SUPER EFETIVO!':eff<=.5?' 💧 NÃO MUITO...':'';
    setLog(`💥 ${P.team[0].name} usou ${move.name}! ${dmg} dmg! ATK ${myAtk}${effTxt}`);
    if(info.secondary&&dmg>0&&Math.random()<=info.secondary.chance){const r=applyStatus('enemy',info.secondary.status,move.name);if(r.text)appendLog(r.text)}
    try{updateBattleHP();updateHUD()}catch(e){}renderStatus();
    if(Number(battleData.wildHp||0)<=0){battleData.turnLock=false;return finishWildWin()}
    return enemyTurn(()=>{});
  };

  /* Failed capture is still a consumed turn, but now the enemy respects Sleep/Paralysis
     and can use its own move/status effects consistently. */
  W.psyV9EnemyTurnAfterCapture=function(){
    if(!battleData?.wild||!P?.team?.[0]||P.team[0].hp<=0)return;
    if(battleData.turnLock)return;battleData.turnLock=true;enemyTurn(()=>{});
  };

  const oldEnd=W.endBattle;
  if(typeof oldEnd==='function'){
    W.endBattle=endBattle=function(){try{battleData&&(battleData.turnLock=false,battleData.majorStatus=null);const e=D.getElementById('enemy-status-indicators'),p=D.getElementById('player-status-indicators');if(e)e.innerHTML='';if(p)p.innerHTML=''}catch(e){}return oldEnd.apply(this,arguments)};
  }

  /* Correct the visual metadata of direct status moves, including Pokémon that already
     had a move saved with the old fallback PWR 40 / Normal metadata. */
  const oldLoad=W.loadMoveButtons;
  if(typeof oldLoad==='function'){
    W.loadMoveButtons=loadMoveButtons=function(){
      let moves=[];try{const p=P?.team?.[0];if(p?.moves){p.moves=p.moves.map(normalizeMove);moves=p.moves}}catch(e){}
      const r=oldLoad.apply(this,arguments);
      try{D.querySelectorAll('#move-buttons button').forEach((btn,i)=>{const mv=moves[i];if(!mv)return;const k=compact(mv.name);if(DIRECT_STATUS[k]||STAT_STATUS_KEYS.has(k)){const small=btn.querySelector('small');if(small)small.textContent=`${mv.type||'Status'} • STATUS`;if(DIRECT_STATUS[k])btn.dataset.majorStatus=DIRECT_STATUS[k].status}})}catch(e){}
      return r;
    };
  }

  const css=D.createElement('style');css.id='psy-battle-status-v10-style';css.textContent=`
    .psy-battle-status-indicators{min-height:22px;margin:4px auto 0;display:flex;gap:4px;justify-content:center;align-items:center;flex-wrap:wrap;max-width:180px}
    .psy-major-status,.psy-stat-status{display:inline-flex;align-items:center;gap:3px;border:1px solid var(--sc,#64748b);background:var(--sbg,#0f172a);color:var(--sc,#e2e8f0);border-radius:999px;padding:3px 7px;font-size:8px;font-weight:1000;letter-spacing:.25px;box-shadow:0 0 8px color-mix(in srgb,var(--sc,#64748b) 35%,transparent)}
    .psy-stat-status{--sc:#93c5fd;--sbg:#0c1c35}
    #battle-enemy:has(.psy-major-status),#battle-player:has(.psy-major-status){filter:drop-shadow(0 0 5px #ffffff22)}
  `;D.head.appendChild(css);
  console.log('[PSYWORLD]',BUILD,'ativo: status + Tier/Raridade em HP/ATK/dano inimigo.');
})();
