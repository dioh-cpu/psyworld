(function(){
'use strict';
const W=window,D=document,$=id=>D.getElementById(id),fmt=n=>Number(n||0).toLocaleString('pt-BR'),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function toast(m,t=2600){try{W.notif?.(m,t)}catch(e){console.log(m)}}
function save(){try{W.autoSave?.()}catch(e){}}
function core(){W.P=W.P||{};P.meta=P.meta||{};P.inventory=P.inventory||{};P.team=P.team||[];P.box=P.box||[];P.cardGame=P.cardGame||{};P.cardGame.packs=P.cardGame.packs||{};P.cardGame.stickers=P.cardGame.stickers||{};P.cardGame.stickerHistory=P.cardGame.stickerHistory||[];P.psyduck=P.psyduck||{};}

/* ===== authoritative spawn exclusions ===== */
const EEVEE_LINE=new Set([133,134,135,136,196,197,470,471,700]);
W.PSY_NO_WILD_WORLD=EEVEE_LINE;
function stripEeveeFromList(arr){return Array.isArray(arr)?arr.filter(x=>!EEVEE_LINE.has(Number(x?.id??x))):arr}
try{if(typeof WILD_ZONES_GEN1==='object')for(const k of Object.keys(WILD_ZONES_GEN1))WILD_ZONES_GEN1[k]=stripEeveeFromList(WILD_ZONES_GEN1[k])}catch(e){}
const oldWorldPool=W.getWorldPool; if(typeof oldWorldPool==='function')W.getWorldPool=function(){return stripEeveeFromList(oldWorldPool.apply(this,arguments))};

/* ===== mobile city bounds + true dynamic invisible joystick ===== */
function installCityJoy(){const g=$('game-wrap');if(!g||g.dataset.cleanJoy)return;g.dataset.cleanJoy='1';const old=$('joystick');if(old)old.style.display='none';let pid=null,ox=0,oy=0,active=false;const dot=D.createElement('div');dot.id='psy-clean-city-joy';dot.style.cssText='position:fixed;width:98px;height:98px;border:2px solid #fff2;border-radius:50%;background:#fff1;z-index:100000;pointer-events:none;opacity:0;transform:translate(-50%,-50%);transition:opacity .08s';dot.innerHTML='<i style="position:absolute;left:50%;top:50%;width:38px;height:38px;border-radius:50%;background:#facc1544;border:2px solid #facc1577;transform:translate(-50%,-50%)"></i>';D.body.appendChild(dot);const knob=dot.firstElementChild;
 const move=(x,y)=>{let dx=x-ox,dy=y-oy,mag=Math.hypot(dx,dy)||1,max=42;if(mag>max){dx*=max/mag;dy*=max/mag}knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;W.joyX=dx/max;W.joyY=dy/max;};
 g.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;if(e.target.closest('button,input,select,.screen,[id*="screen-"]'))return;pid=e.pointerId;ox=e.clientX;oy=e.clientY;active=true;dot.style.left=ox+'px';dot.style.top=oy+'px';dot.style.opacity='.22';try{g.setPointerCapture(pid)}catch(_){}move(ox,oy)},{passive:true});
 g.addEventListener('pointermove',e=>{if(active&&e.pointerId===pid)move(e.clientX,e.clientY)},{passive:true});
 const up=e=>{if(!active||e.pointerId!==pid)return;active=false;pid=null;W.joyX=0;W.joyY=0;knob.style.transform='translate(-50%,-50%)';dot.style.opacity='0'};g.addEventListener('pointerup',up,{passive:true});g.addEventListener('pointercancel',up,{passive:true});
}
function clampCity(){try{if(typeof player==='undefined'||!player)return;const cv=$('gameCanvas');const w=Number(W.MAP_W||W.MAP_WIDTH||cv?.width||innerWidth),h=Number(W.MAP_H||W.MAP_HEIGHT||cv?.height||innerHeight);if(Number.isFinite(player.x))player.x=Math.max(20,Math.min(w-20,player.x));if(Number.isFinite(player.y))player.y=Math.max(20,Math.min(h-20,player.y))}catch(e){}}

/* ===== Survivor: own working tab routing + mobile controller + exit ===== */
function psyState(){core();P.psyduck.survSkills=P.psyduck.survSkills||{power:0,rate:0,hp:0,speed:0,luck:0,helper:0,nova:0};delete P.psyduck.survSkills.bounce;P.psyduck.helperTrees=P.psyduck.helperTrees||{};P.psyduck.trialsDone=P.psyduck.trialsDone||{};P.psyduck.survivorBest=Number(P.psyduck.survivorBest||0);return P.psyduck}
const SKILLS={power:['Poder Mental','+8% dano inicial por nível',10],rate:['Fluxo de Água','-4% intervalo de tiro por nível',10],hp:['Corpo Psíquico','+7% HP inicial por nível',10],speed:['Passo Fluido','+3% velocidade por nível',10],luck:['Caçador de Relíquias','+5% chance relativa de loot por nível',10],helper:['Laço Pokémon','Aumenta a presença de escolhas de Ajudantes ao subir o Run Level',8],nova:['Psy Nova','Aumenta dano/frequência da explosão psíquica',10]};
function skillCost(k,lv){const wt={power:1.1,rate:1.15,hp:1,speed:.9,luck:1.25,helper:1.35,nova:1.45}[k]||1;return Math.ceil((15000*wt*Math.pow(lv+1,1.35))/500)*500}
W.v12BuyPsySkill=function(k){const s=psyState(),d=SKILLS[k],lv=Number(s.survSkills[k]||0);if(!d||lv>=d[2])return;const c=skillCost(k,lv);if(Number(P.gold||0)<c)return toast(`Precisa ${fmt(c)} Gold.`);P.gold-=c;s.survSkills[k]=lv+1;save();W.v12PsyTab?.('tree')};
W.v12RenderPsyTree=function(c){if(!c)return;const s=psyState(),normal='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png',shiny='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/54.png';c.innerHTML=`<div class="psy20-card"><h3 style="margin:0;color:#67e8f9">🌌 CONSTELAÇÃO PSYDUCK — ÁRVORE SURVIVOR</h3><div class="psy20-sub">Caminhos permanentes do Survivor. Todos os upgrades custam Gold.</div></div><div class="psy22-skilltree" style="margin-top:10px">${Object.entries(SKILLS).map(([k,d],i)=>{const lv=Number(s.survSkills[k]||0),max=lv>=d[2],cost=skillCost(k,lv);return `<div class="psy22-node ${max?'max':''}"><img src="${i>3?shiny:normal}"><h4>${esc(d[0])} • ${lv}/${d[2]}</h4><div class="psy20-sub" style="min-height:36px">${esc(d[1])}</div><button class="psy20-btn ${max?'green':'purple'}" style="width:100%" ${max?'disabled':''} onclick="v12BuyPsySkill('${k}')">${max?'MÁXIMO':fmt(cost)+' Gold'}</button></div>`}).join('')}</div>`};

const SURV_HELPERS=[
  {key:'pikachu',id:25,name:'Pikachu',role:'Tempestade de Raios',color:'#fde047',desc:'Raios caem do céu sobre alvos aleatórios. Lv.1–5 aumenta de 3 para 15 raios; MAX amplia impacto e dano.'},
  {key:'charizard',id:6,name:'Charizard',role:'Chuva de Meteoros',color:'#fb923c',desc:'Meteoros caem em alvos aleatórios e explodem em área. MAX invoca 3 meteoros gigantes a cada 5s.'},
  {key:'slowpoke',id:79,name:'Slowpoke',role:'Jatos de Água Persistentes',color:'#60a5fa',desc:'Jatos atravessam inimigos por 2s e causam dano a cada 0,3s. MAX dispara duas sequências por ativação.'},
  {key:'gengar',id:94,name:'Gengar',role:'Buracos Negros',color:'#c084fc',desc:'Cria zonas de dano contínuo. MAX invoca a cada 10s um buraco negro magnético de 10 SQM.'},
  {key:'lapras',id:131,name:'Lapras',role:'Cones de Gelo',color:'#67e8f9',desc:'Emite de 1 a 5 cones gelados. MAX aumenta tamanho, alcance e lentidão aplicada aos inimigos.'},
  {key:'dragonite',id:149,name:'Dragonite',role:'Tornados Perseguidores',color:'#a78bfa',desc:'Tornados perseguem alvos e explodem em 3 SQM. MAX lança 10 tornados gigantes, perfurantes e persistentes.'},
  {key:'blissey',id:242,name:'Blissey',role:'Corações Restauradores',color:'#f9a8d4',desc:'Caça inimigos com corações perseguidores que explodem em 3 SQM, curam aliados próximos e empurram inimigos. Seus ataques causam +50% de dano. Lv.3 vira Shiny, Lv.5 mantém Shiny e fica 2x maior; MAX fica 3x maior e cria o Santuário.'}
];
function helperTreeEnsure(){const s=psyState();for(const h of SURV_HELPERS){s.helperTrees[h.key]=s.helperTrees[h.key]||{damage:0,rate:0,special:0};for(const k of ['damage','rate','special'])s.helperTrees[h.key][k]=Number(s.helperTrees[h.key][k]||0)}return s.helperTrees}
function helperTreeCost(h,k,lv){const idx=SURV_HELPERS.findIndex(x=>x.key===h);const mult=k==='special'?1.35:k==='rate'?1.12:1;return Math.ceil(((12000+idx*1800)*mult*Math.pow(lv+1,1.32))/500)*500}
W.psyBuyHelperSkill=function(h,k){const t=helperTreeEnsure(),node=t[h]?.[k];if(node==null||node>=5)return;const cost=helperTreeCost(h,k,node);if(Number(P.gold||0)<cost)return toast(`Precisa ${fmt(cost)} Gold.`);P.gold-=cost;t[h][k]=node+1;save();W.v12PsyTab?.('helpers')};
W.v12RenderHelperTree=function(c){if(!c)return;const t=helperTreeEnsure();c.innerHTML=`<div class="psy20-card psy-helper-tree-head"><h3 style="margin:0;color:#facc15">🤝 EQUIPE DE APOIO — ÁRVORES DOS AJUDANTES</h3><div class="psy20-sub">Cada ajudante tem ataque próprio. Estas melhorias são permanentes e entram em vigor quando o ajudante aparece na run.</div></div><div class="psy-helper-tree-grid">${SURV_HELPERS.map(h=>{const a=t[h.key];return `<section class="psy-helper-tree-card" style="--helper:${h.color}"><div class="psy-helper-tree-hero"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${h.id}.png"><div><h3>${h.name}</h3><b>${h.role}</b><small>${h.desc}</small></div></div>${[['damage','DANO','+10% dano por nível'],['rate','CADÊNCIA','-6% recarga por nível'],['special','ESPECIAL','Fortalece dano e efeito da habilidade exclusiva']].map(([k,n,d])=>{const lv=a[k],max=lv>=5,cost=helperTreeCost(h.key,k,lv);return `<div class="psy-helper-node"><span><b>${n}</b><small>${d}</small></span><button ${max?'disabled':''} onclick="psyBuyHelperSkill('${h.key}','${k}')">${max?'MAX':`Lv.${lv} → ${lv+1}<br>${fmt(cost)} G`}</button></div>`}).join('')}</section>`}).join('')}</div>`};

function installSurvivorJoy(){const sc=$('screen-survivor-v12');if(!sc||sc.dataset.cleanJoy)return;sc.dataset.cleanJoy='1';let pid=null,ox=0,oy=0;const dot=D.createElement('div');dot.className='psy-surv-touch-stick';dot.innerHTML='<i></i>';D.body.appendChild(dot);const knob=dot.firstElementChild;function keys(dx,dy){W.V12_KEYS=W.V12_KEYS||{};W.V12_KEYS.left=dx<-.18;W.V12_KEYS.right=dx>.18;W.V12_KEYS.up=dy<-.18;W.V12_KEYS.down=dy>.18}function mv(x,y){let sx=x-ox,sy=y-oy,portrait=innerHeight>innerWidth,dx=portrait?sy:sx,dy=portrait?-sx:sy,m=Math.hypot(dx,dy)||1,lim=48;if(m>lim){dx*=lim/m;dy*=lim/m}const visx=portrait?-dy:dx,visy=portrait?dx:dy;knob.style.transform=`translate(calc(-50% + ${visx}px),calc(-50% + ${visy}px))`;keys(dx/lim,dy/lim)}sc.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.target.closest('button,.psy-surv-levelup,.psy-clean-surv-pause'))return;pid=e.pointerId;ox=e.clientX;oy=e.clientY;dot.style.left=ox+'px';dot.style.top=oy+'px';dot.style.opacity='.34';mv(ox,oy);try{sc.setPointerCapture(pid)}catch(_){}},{passive:true});sc.addEventListener('pointermove',e=>{if(e.pointerId===pid)mv(e.clientX,e.clientY)},{passive:true});const up=e=>{if(e.pointerId!==pid)return;pid=null;keys(0,0);knob.style.transform='translate(-50%,-50%)';dot.style.opacity='0';try{sc.releasePointerCapture(e.pointerId)}catch(_){}};sc.addEventListener('pointerup',up,{passive:true});sc.addEventListener('pointercancel',up,{passive:true})}

/* ===== standalone Psyduck state used by Ascension + Survivor runtime ===== */
function psyDuckPoke(){core();let p=[...(P.team||[]),...(P.box||[])].find(x=>Number(x?.id)===54&&x?.psyduckChosen)||[...(P.team||[]),...(P.box||[])].find(x=>Number(x?.id)===54);if(!p){p={id:54,name:'Psyduck',level:1,exp:0,maxExp:100,resets:0,psyduckChosen:true,maxHp:125,hp:125};P.box.push(p)}p.resets=Number(p.resets||0);p.level=Number(p.level||1);return p}

const PSY_ASC_QUALITIES=['Lixo','Quase Lixo','Nice','Belezura','Lêndea','Bombado','Pika das Galáxias','DEUS','CRIADOR','VOID','OBLIVION','SQUIZO'];
const PSY_ASC_TIERS=['E','D','C','B','A','S','SS','SSS','UR','UR+','UR++','SP'];
const PSY_ASC_RESET_LIMIT=999;
const PSY_ASC_TRIAL_RESET_REQ=[9,18,27,36,45,55,64,73,82,91,100,109,118,127,136,145,155,164,173,182,191,200,225,250];
const PSY_ASC_TRIALS=[];
for(let step=0;step<11;step++){
  const tierN=step*2+1,qualN=tierN+1;
  PSY_ASC_TRIALS.push({kind:'tier',from:PSY_ASC_TIERS[step],to:PSY_ASC_TIERS[step+1],label:`Tier ${PSY_ASC_TIERS[step]} → ${PSY_ASC_TIERS[step+1]}`,resetReq:PSY_ASC_TRIAL_RESET_REQ[tierN-1],phase:Math.min(200,12+step*8),diff:1.40+step*.16});
  PSY_ASC_TRIALS.push({kind:'quality',from:PSY_ASC_QUALITIES[step],to:PSY_ASC_QUALITIES[step+1],label:`Qualidade ${PSY_ASC_QUALITIES[step]} → ${PSY_ASC_QUALITIES[step+1]}`,resetReq:PSY_ASC_TRIAL_RESET_REQ[qualN-1],phase:Math.min(200,16+step*8),diff:1.48+step*.16});
}
PSY_ASC_TRIALS.push({kind:'tierMastery',from:'SP',to:'SP',label:'Domínio do Tier SP',resetReq:225,phase:196,diff:3.55});
PSY_ASC_TRIALS.push({kind:'qualityMastery',from:'SQUIZO',to:'SQUIZO',label:'Domínio da Qualidade SQUIZO',resetReq:250,phase:200,diff:3.80});
function psyAscXpStart(reset){
  reset=Math.max(0,Math.min(PSY_ASC_RESET_LIMIT,Number(reset)||0));
  if(reset<=200)return Math.max(100,Math.floor(100*(1+reset*.12+reset*reset*.0025)));
  const d=reset-200,base=100*(1+200*.12+200*200*.0025);
  return Math.floor(base*(1+d*.035+Math.pow(d,1.35)*.002));
}
function psyAscGoldCost(reset){
  reset=Math.max(0,Math.min(PSY_ASC_RESET_LIMIT,Number(reset)||0));
  if(reset<=200)return Math.floor(60000+reset*18000+reset*reset*1200);
  const d=reset-200,base=60000+200*18000+200*200*1200;
  return Math.floor(base*(1+d*.018+Math.pow(d,1.22)*.0015));
}
function psyAscTrialState(){const s=psyState();s.ascensionTrials=s.ascensionTrials||{};return s}
function psySquizoRarity(){const o=psyFindRarityByName('OBLIVION');return {...o,n:'SQUIZO',color:'#ff3df2',mult:Math.max(55,Number(o?.mult||40)*1.35),cap:0.03,psyduckExclusive:true}}
function psyAscApplyProgress(p){
  const st=psyAscTrialState();let tier='E',quality='Lixo';
  for(let i=0;i<PSY_ASC_TRIALS.length;i++)if(st.ascensionTrials['a'+(i+1)]){
    const t=PSY_ASC_TRIALS[i];if(t.kind==='tier')tier=t.to;if(t.kind==='quality')quality=t.to;
  }
  p.tier=tier;
  p.rarity=quality==='SQUIZO'?psySquizoRarity():{...psyFindRarityByName(quality)};
  recalcPoke(p);p.hp=p.maxHp;
}
function psyAscCompleteTrial(n){
  const t=PSY_ASC_TRIALS[Number(n)-1],st=psyAscTrialState(),p=psyDuckPoke();if(!t)return;
  st.ascensionTrials['a'+n]=true;psyAscApplyProgress(p);
  if(t.kind==='tier')toast(`🏆 Provação ${n} concluída! Tier ${t.from} → ${t.to}`,4200);
  else if(t.kind==='quality')toast(`🏆 Provação ${n} concluída! Qualidade ${t.from} → ${t.to}`,4200);
  else toast(`🏆 Provação ${n} concluída! ${t.label}`,4200);
}
W.v12RenderTrials=function(c){if(!c)return;const st=psyAscTrialState(),p=psyDuckPoke(),r=Number(p.resets||0);psyAscApplyProgress(p);c.innerHTML=`<div class="psy20-card"><h3 style="margin:0;color:#facc15">🏆 PROVAÇÕES DO PSYDUCK — ${PSY_ASC_TRIALS.length}</h3><div class="psy20-sub">Reset e Provações são sistemas separados. Os Resets fortalecem o Psyduck; as Provações são runs exclusivas que exigem marcos de Reset para desafiar e evoluem alternadamente <b>Tier primeiro</b> e depois <b>Qualidade</b>. A Qualidade SQUIZO é alcançável no marco de Reset 200, e o Tier SP é exclusivo do Psyduck.</div></div><div class="psy20-trials" style="margin-top:9px">${PSY_ASC_TRIALS.map((t,i)=>{const n=i+1,id='a'+n,done=!!st.ascensionTrials[id],prev=i===0||!!st.ascensionTrials['a'+i],open=r>=t.resetReq&&prev&&!done;return `<div class="psy20-trial ${done?'done':open?'open':''}"><b>Provação ${n} • ${esc(t.label)}</b><div>Run exclusiva • desafio x${t.diff.toFixed(2)}</div><small>Requer Reset <b>${t.resetReq}</b>${t.kind==='tierMastery'||t.kind==='qualityMastery'?' • Provação de domínio':t.kind==='tier'?' • Evolui o Tier':' • Evolui a Qualidade'}</small><button class="psy20-btn ${open?'gold':''}" ${!open?'disabled':''} onclick="psyStartAscensionTrial(${n})">${done?'CONCLUÍDA':!prev?'🔒 PROVAÇÃO ANTERIOR':r<t.resetReq?'🔒 RESET '+t.resetReq:'INICIAR PROVAÇÃO'}</button></div>`}).join('')}</div>`};
W.psyStartAscensionTrial=function(n){const t=PSY_ASC_TRIALS[Number(n)-1],p=psyDuckPoke(),st=psyAscTrialState(),id='a'+n,prev=Number(n)===1||!!st.ascensionTrials['a'+(Number(n)-1)];if(!t||Number(p.resets||0)<t.resetReq||!prev||st.ascensionTrials[id])return;W.v12StartSurvivor(Math.max(0,t.phase-1),{trialNumber:Number(n),trialDifficulty:t.diff,trialLabel:t.label});};
W.v12RenderAscend=function(c){if(!c)return;const p=psyDuckPoke(),r=Number(p.resets||0),next=r+1,cost=psyAscGoldCost(r);psyAscApplyProgress(p);const post200=r>=200?'<div style="margin-top:8px;color:#fb7185">⚠ Após o Reset 200, a curva de EXP e Gold fica significativamente mais pesada.</div>':'';c.innerHTML=`<div class="psy20-card"><h3>♻ RESET / ASCENSÃO DO PSYDUCK</h3><div class="psy20-sub">Reset é independente das Provações. Cada Reset concede <b>+10% permanente em todos os atributos</b> e <b>+1 PsyCoin</b>. Para resetar basta chegar ao Lv.100 e pagar o Gold crescente. As Provações apenas usam determinados marcos de Reset como requisito para serem desafiadas.</div><div style="margin-top:10px">Atual: Reset <b>${r}/${PSY_ASC_RESET_LIMIT}</b> • Qualidade <b>${esc(p.rarity?.n||'Lixo')}</b> • Tier <b>${esc(p.tier||'E')}</b><br>Próximo Reset: <b>${next}</b> • Custo: <b>${fmt(cost)} Gold</b> • EXP inicial pós-reset: <b>${fmt(psyAscXpStart(next))}</b></div>${post200}<button class="psy20-btn gold" ${p.level<100||r>=PSY_ASC_RESET_LIMIT?'disabled':''} onclick="psyCleanAscend()">${r>=PSY_ASC_RESET_LIMIT?'RESET MÁXIMO 999':p.level<100?'REQUER LV.100':'ASCENDER • +1 PSYCOIN'}</button></div>`};
W.psyCleanAscend=function(){const p=psyDuckPoke(),r=Number(p.resets||0);if(r>=PSY_ASC_RESET_LIMIT)return toast('Psyduck já atingiu o limite de 999 Resets.');if(p.level<100)return toast('Psyduck precisa chegar ao Lv.100.');const cost=psyAscGoldCost(r);if(Number(P.gold||0)<cost)return toast(`Precisa ${fmt(cost)} Gold.`);P.gold-=cost;p.resets=r+1;p.level=1;p.exp=0;p.maxExp=psyAscXpStart(p.resets);P.psycoin=Number(P.psycoin||0)+1;psyAscApplyProgress(p);save();toast(`♻ Reset ${p.resets}/999! +10% atributos permanentes • +1 PsyCoin`,4200);W.openPsyduckDungeon5();W.v12PsyTab('ascend')};
W.openPsyduckDungeon5=function(){core();const p=psyDuckPoke(),s=psyState();psyAscApplyProgress(p);let sc=$('screen-psyduck-v12');if(!sc){sc=D.createElement('div');sc.id='screen-psyduck-v12';D.body.appendChild(sc)}sc.style.cssText='display:block;position:fixed;inset:0;z-index:1000500;background:#020617f5;padding:10px;overflow:auto';sc.innerHTML=`<div class="psy20-panel" style="width:min(1180px,98vw);margin:auto"><button class="psy20-close" onclick="document.getElementById('screen-psyduck-v12').style.display='none'">×</button><div style="display:flex;gap:12px;align-items:center"><img src="https://play.pokemonshowdown.com/sprites/ani/psyduck.gif" style="width:110px;height:110px;object-fit:contain"><div><h2 class="psy20-title">PSYDUCK — PROVAÇÃO SUPREMA</h2><div>Lv real <b>${p.level}/100</b> • EXP ${fmt(p.exp||0)}/${fmt(p.maxExp||100)} • Resets <b>${p.resets}/${PSY_ASC_RESET_LIMIT}</b></div><div>Melhor Survivor: <b>${s.survivorBest}/200</b></div><div class="psy20-sub">A evolução da run acontece por Power-Ups; Ascensões fortalecem permanentemente o Psyduck e as Provações testam essa progressão.</div></div></div><div class="psy20-tabs"><button onclick="v12PsyTab('survivor')">🎮 SURVIVOR</button><button onclick="v12PsyTab('trials')">🏆 PROVAÇÕES</button><button onclick="v12PsyTab('ascend')">♻ RESET / ASCENSÃO</button><button onclick="v12PsyTutorial()">❔ TUTORIAL</button></div><div id="psy-v12-tab"></div></div>`;W.v12PsyTab('survivor')};W.renderPsyduckDungeon5=W.openPsyduckDungeon5;W.psy19OpenPsyduck=W.openPsyduckDungeon5;

W.v12PsyTab=function(tab){const c=$('psy-v12-tab');if(!c)return;if(tab==='survivor'||tab==='tree'||tab==='helpers')return W.v12RenderSurvZones(c);if(tab==='trials')return W.v12RenderTrials(c);if(tab==='ascend')return W.v12RenderAscend(c)}
function survScreen(){
  let sc=$('screen-survivor-v12');
  if(!sc){sc=D.createElement('div');sc.id='screen-survivor-v12';D.body.appendChild(sc)}
  sc.innerHTML=`<div class="psy-clean-surv">
    <div class="psy-clean-surv-top">
      <div class="psy-surv-status">
        <div class="psy-surv-avatar"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png"></div>
        <div class="psy-surv-bars"><div class="psy-surv-hpline"><b id="psy-surv-hptext">HP</b><i><span id="psy-surv-hpbar"></span></i></div><div class="psy-surv-xpline"><b id="psy-surv-lvtext">RUN LV.1</b><i><span id="psy-surv-xpbar"></span></i></div></div>
      </div>
      <div class="psy-surv-center"><b id="psy-surv-phase">FASE 1</b><strong id="psy-surv-clock">00:00</strong><small id="psy-surv-next">HORDA EM BREVE</small></div>
      <div class="psy-surv-right"><span id="psy-surv-kills">⚔ 0</span><span id="psy-surv-gold">🪙 0</span><button class="psy-surv-pausebtn" onclick="psyCleanPause()" aria-label="Pausar Survivor">Ⅱ</button></div>
    </div>
    <canvas id="psy-clean-surv-canvas"></canvas>
    <div id="psy-clean-surv-pause" class="psy-clean-surv-pause">
      <div class="psy-surv-dialog">
        <h2>⏸ SURVIVOR PAUSADO</h2>
        <div id="psy-clean-surv-current" class="psy-surv-pause-list"></div>
        <div class="psy-surv-dialog-actions"><button class="psy20-btn green" onclick="psyCleanPause(false)">CONTINUAR</button><button class="psy20-btn" style="background:#991b1b" onclick="psyCleanEnd(false,true)">SAIR DA FASE</button></div>
      </div>
    </div>
    <div id="psy-clean-surv-up" class="psy-surv-levelup">
      <div class="psy-surv-levelbox">
        <div class="psy-surv-level-title"><span>RUN LEVEL UP!</span><b>ESCOLHA UM APRIMORAMENTO</b></div>
        <div id="psy-clean-surv-upgrid" class="psy-surv-upgrid"></div>
      </div>
    </div>
  </div>`;
  sc.style.cssText='display:block;position:fixed;inset:0;z-index:1001000;background:#020617;overflow:hidden';
  return sc
}
const SURV_ENEMY_POOLS={early:[19,41,92,48,43,74,81,109,120,161,163,167,179,263,265,396,399,504,506,659,661,731,819,821,915],mid:[20,42,93,49,44,75,82,110,162,164,168,180,264,266,397,400,505,507,660,662,732,820,822,916],late:[18,24,45,47,51,55,57,65,68,71,76,78,80,85,87,89,91,97,101,105,112,119,121,127,130,141,149,169,181,186,214,224,229,232,237,248,262,267,398,405,409,419,423,426,430,435,445,452,454,461,464,466,468,472,473,475,477,478,500,503,508,521,523,526,530,534,537,542,545,553,555,558,560,565,567,571,573,576,579,584,586,589,591,594,596,598,601,604,606,609,612,614,617,620,623,625,628,630,632,635,637,639,641,652,655,658,663,666,668,671,673,675,678,681,683,685,687,689,691,693,695,697,699,701,703,706,709,711,713,715,717,719,721,724,727,730,733,735,738,740,743,745,748,750,752,754,756,758,760,763,765,768,770,772,774,776,778,780,783,784,785,786,787,788,790,792,794,796,798,800,801,802,804,805,806,807,808,809,812,815,818,823,826,828,830,832,834,836,839,841,842,844,845,847,849,851,853,855,858,861,862,864,866,869,870,873,874,876,877,879,880,882,883,885,887,889,892,894,895,897,899,901,903,905,908,910,911,913,914,918,920,922,923,925,927,929,930,932,934,936,937,939,941,943,945,947,949,951,952,954,956,958,959,961,962,964,965,967,968,970,972,973,975,976,978,980,981,983]};
const SURV_BOSS_POOL=[130,149,248,376,445,635,706,887];
const SURV_SQM=42;
const SURV_ATTACK_RANGE=SURV_SQM*10;
const SURV_HELPER_CAP=3;
const SURV_PSY_ABILITY_CAP=3;
const SURV_PSY_ABILITY_IDS=new Set(['nova','vortex','rain']);
const SURV_NORMAL_POP=14;
const SURV_SPECIAL_MAX=10;
const SURV_ELITE_INTERVAL=90000;
const SURV_RESPAWN_MIN=2200;
const SURV_RESPAWN_MAX=3400;
function survSpawnSlotPoint(s,side,t){const vw=Number(s.viewW||1000),vh=Number(s.viewH||500),m=SURV_SQM*1.05,cx=Number(s.camX||Math.max(0,s.x-vw/2)),cy=Number(s.camY||Math.max(0,s.y-vh/2));side=Number.isFinite(Number(side))?Number(side):Math.floor(Math.random()*4);t=Number.isFinite(Number(t))?Number(t):(.10+Math.random()*.80);let x,y;if(side===0){x=cx+vw*t;y=cy-m}else if(side===1){x=cx+vw+m;y=cy+vh*t}else if(side===2){x=cx+vw*t;y=cy+vh+m}else{x=cx-m;y=cy+vh*t}const pad=38;x=Math.max(pad,Math.min(Number(s.worldW||3600)-pad,x));y=Math.max(pad,Math.min(Number(s.worldH||2200)-pad,y));return{x,y,spawnSide:side,spawnT:t}}
function survNormalCount(s){return(s.enemies||[]).filter(e=>!e.dead&&e.slotId!=null).length}
function survSpecialCount(s){return(s.enemies||[]).filter(e=>!e.dead&&e.slotId==null&&!e.boss).length}
function survNextBossMinute(s){const m=Math.floor(Math.max(0,s.elapsed)/60000);return m<4?4:m<8?8:m<12?12:m<16?16:20}
function survEstimateBossHp(s,minute=survNextBossMinute(s)){const base=42+s.phase*4.4+Math.min(150,s.elapsed/12000),bossScale=minute>=20?13:minute>=15?8:minute>=10?6:4,minuteHpMult=1+Math.floor(Math.max(0,s.elapsed)/60000)*.10;return Math.max(26,Math.floor(base*2.45*34*bossScale*minuteHpMult))}
function survRewardScale(s,e){const normalBase=Math.max(1,42+s.phase*4.4+Math.min(150,s.elapsed/12000)),ratio=Math.max(1,Number(e?.max||normalBase)/normalBase),phase=1+Math.max(0,Number(s.phase||1)-1)*.008;return Math.max(1,Math.min(9,(1+Math.log2(ratio)*.30)*phase))}
function survDropScale(s,e){const normalBase=Math.max(1,42+s.phase*4.4+Math.min(150,s.elapsed/12000)),ratio=Math.max(1,Number(e?.max||normalBase)/normalBase),phase=1+Math.max(0,Number(s.phase||1)-1)*.006;return Math.max(1,Math.min(14,(1+Math.log2(ratio)*.52)*phase))}
function survDropSource(e){if(e?.boss)return e.finalBoss?'Chefe Final':'Boss';if(e?.timedElite)return'Elite 2min';if(e?.mega&&e?.shiny)return'Mega Shiny';if(e?.mega)return'Mega';if(e?.shiny)return'Shiny';if(e?.champion)return'Campeão';if(e?.elite)return'Elite';return'Pokémon'}
function survDropLog(s,e,name,qty=1,rarity='rare'){s.dropHistory=s.dropHistory||[];s.dropAlerts=s.dropAlerts||[];const row={time:Number(s.elapsed||0),name,qty,source:survDropSource(e),rarity};s.dropHistory.unshift(row);if(s.dropHistory.length>120)s.dropHistory.length=120;s.dropAlerts.unshift({...row,life:3600});if(s.dropAlerts.length>5)s.dropAlerts.length=5}
function survPackKey(name){const n=String(name||'').toLowerCase();if(n.includes('ur++'))return'urpp';if(n.includes('ur+'))return'urp';if(/\bur\b/.test(n))return'ur';if(n.includes('sss'))return'sss';if(/\bss\b/.test(n))return'ss';if(/\bs\b/.test(n)&&!n.includes('ss'))return's';if(n.includes('épico')||n.includes('epico')||n.includes('epic'))return'epic';if(n.includes('raro')||n.includes('rare'))return'rare';return'normal'}
function survAwardItem(s,e,type,name,visual='rare'){if(type==='pack'){const key=survPackKey(name);s.packLoot=s.packLoot||{};s.packLoot[key]=Number(s.packLoot[key]||0)+1;s.cardPacks=Number(s.packLoot.normal||0)}else{s.loot=s.loot||{};s.loot[name]=Number(s.loot[name]||0)+1}survDropLog(s,e,name,1,visual);return true}
function survMilestoneEnsure(){core();P.meta=P.meta||{};const m=P.meta.survivorMilestones||(P.meta.survivorMilestones={});for(const k of ['totalKills','shinyProgress','shinyFails','megaProgress','megaFails','packNormalProgress','packRareProgress','packEpicProgress','evoStoneProgress'])m[k]=Math.max(0,Number(m[k]||0));return m}
function survMilestoneKill(s,e){const m=survMilestoneEnsure();m.totalKills++;m.shinyProgress++;m.megaProgress++;m.packNormalProgress++;m.packRareProgress++;m.packEpicProgress++;m.evoStoneProgress++;
  while(m.evoStoneProgress>=1000){m.evoStoneProgress-=1000;const st=SURV_COMMON_STONES[Math.floor(Math.random()*SURV_COMMON_STONES.length)];survAwardItem(s,e,'loot',st,'rare')}
  if(m.shinyProgress>=1000000){const guaranteed=m.shinyFails>=1,win=guaranteed||Math.random()<.50;m.shinyProgress=0;if(win){m.shinyFails=0;survAwardItem(s,e,'loot','Shiny Stone','rare')}else m.shinyFails++}
  if(m.megaProgress>=5000000){const guaranteed=m.megaFails>=3,win=guaranteed||Math.random()<.25;m.megaProgress=0;if(win){m.megaFails=0;survAwardItem(s,e,'loot','Fragmento Mega Stone','rare')}else m.megaFails++}
  while(m.packNormalProgress>=300000){m.packNormalProgress-=300000;survAwardItem(s,e,'pack','Pack Normal','rare')}
  while(m.packRareProgress>=600000){m.packRareProgress-=600000;survAwardItem(s,e,'pack','Pack Raro','rare')}
  while(m.packEpicProgress>=2000000){m.packEpicProgress-=2000000;survAwardItem(s,e,'pack','Pack Épico','epic')}
}

function survPsyAbilityActive(s,id){return id==='nova'||survRunUpLv(s,id)>0||survRunMaxed(s,id)}
function survPsyAbilityCount(s){return [...SURV_PSY_ABILITY_IDS].filter(id=>survPsyAbilityActive(s,id)).length}
function survPerfProfile(){
  const coarse=!!(W.matchMedia?.('(pointer:coarse)')?.matches),cores=Number(navigator.hardwareConcurrency||0),mem=Number(navigator.deviceMemory||0),low=coarse&&((cores>0&&cores<=4)||(mem>0&&mem<=4));
  return{mobile:coarse,low,vfxQuality:low?.62:coarse?.82:1,fxCap:low?125:coarse?180:280,particleCap:low?6:coarse?10:14,enemyCap:64,bulletCap:low?145:coarse?190:260,enemyBulletCap:low?110:coarse?155:220,textCap:low?58:coarse?82:120,fieldCap:low?72:coarse?96:130,avgDt:16.7,frameCount:0};
}
function survInView(s,x,y,pad=120){if(!Number.isFinite(x)||!Number.isFinite(y))return true;const cx=Number(s.camX||0),cy=Number(s.camY||0),vw=Number(s.viewW||s.c?.width||1000),vh=Number(s.viewH||s.c?.height||500);return x>=cx-pad&&x<=cx+vw+pad&&y>=cy-pad&&y<=cy+vh+pad}
const SURV_COMMON_STONES=['Fire Stone','Water Stone','Leaf Stone','Thunder Stone','Ice Stone','Punch Stone','Venom Stone','Earth Stone','Feather Stone','Enigma Stone','Cocoon Stone','Rock Stone','Crystal Stone','Darkness Stone','Metal Stone','Heart Stone'];
function survRareDrop(s,e){
  const luck=1+Number(s.skills?.luck||0)*.05,globalDrop=(1+Math.max(0,Number(getTotalBuff?.('drop')||0))/100)*(1+Math.max(0,Number(s.survLootBonus||0))/100),variant=e?.mega&&e?.shiny?2.25:e?.mega?1.8:e?.shiny?1.35:1,boss=e?.boss?4.5:1,diff=survDropScale(s,e),m=luck*globalDrop*variant*boss*diff,r=Math.random();
  /* Standard rare rolls coexist with the long-term pity counters. Rates remain internal. */
  if(r<.000060*m)return survAwardItem(s,e,'loot','Fragmento Mega Stone','rare');
  if(r<.000140*m)return survAwardItem(s,e,'loot','Shiny Stone','rare');
  if(r<.000850*m){const st=SURV_COMMON_STONES[Math.floor(Math.random()*SURV_COMMON_STONES.length)];return survAwardItem(s,e,'loot',st,'rare')}
}
const SURV_RUN_UPS=[
  {id:'rate',name:'Jato Rápido',kind:'OFENSIVO',poke:7,desc:'-8% no intervalo de tiro por nível',max:5},
  {id:'runxp',name:'Treino Intensivo',kind:'PROGRESSÃO',poke:531,desc:'+10% EXP da RUN por nível • só acelera o Run Level',max:5},
  {id:'multi',name:'Rajada',kind:'OFENSIVO',poke:121,desc:'+1 projétil do Psyduck e +1 golpe por ativação de cada ajudante por nível',max:5},
  {id:'pierce',name:'Perfuração',kind:'OFENSIVO',poke:130,desc:'+1 alvo atravessado por nível',max:5,maxDesc:'MAX: +3 perfurações extras'},
  {id:'speed',name:'Passo Fluido',kind:'MOBILIDADE',poke:134,desc:'+6% velocidade por nível',max:5},
  {id:'helper_pikachu',helperKey:'pikachu',maxReq:'rain',maxReqName:'Chuva Psíquica',name:'Pikachu',kind:'AJUDANTE',poke:25,desc:'3 / 5 / 7 / 10 / 15 raios em alvos aleatórios • MAX requer Chuva Psíquica 5/5',max:5,maxDesc:'MAX: raios maiores, dano elevado e impacto em 1 SQM'},
  {id:'helper_charizard',helperKey:'charizard',maxReq:'rate',maxReqName:'Jato Rápido',name:'Charizard',kind:'AJUDANTE',poke:6,desc:'1 / 2 / 4 / 6 / 10 meteoros com impacto em 2 SQM • MAX requer Jato Rápido 5/5',max:5,maxDesc:'MAX: +3 meteoros gigantes a cada 5s, cobrindo 10 SQM'},
  {id:'helper_slowpoke',helperKey:'slowpoke',maxReq:'nova',maxReqName:'Psy Nova',name:'Slowpoke',kind:'AJUDANTE',poke:79,desc:'1 / 2 / 3 / 4 / 5 jatos por 2s; cada inimigo recebe 1 impacto por jato • MAX requer Psy Nova 5/5',max:5,maxDesc:'MAX: os 5 jatos ficam maiores e disparam duas vezes por ativação'},
  {id:'helper_gengar',helperKey:'gengar',maxReq:'multi',maxReqName:'Rajada',name:'Gengar',kind:'AJUDANTE',poke:94,desc:'1 / 2 / 3 / 4 / 5 buracos negros; cada inimigo recebe 1 impacto por área • MAX requer Rajada 5/5',max:5,maxDesc:'MAX: buraco negro magnético de 10 SQM a cada 10s'},
  {id:'helper_lapras',helperKey:'lapras',maxReq:'regen',maxReqName:'Água Restauradora',name:'Lapras',kind:'AJUDANTE',poke:131,desc:'1 / 2 / 3 / 4 / 5 cones de gelo que reduzem velocidade • MAX requer Água Restauradora 5/5 • Santuário MAX: cura, escudo e corações gigantes',max:5,maxDesc:'MAX: 5 cones maiores, mais alcance e lentidão intensa'},
  {id:'helper_dragonite',helperKey:'dragonite',maxReq:'runxp',maxReqName:'Treino Intensivo',name:'Dragonite',kind:'AJUDANTE',poke:149,desc:'1 / 2 / 3 / 4 / 5 tornados perseguidores com impacto em 3 SQM • MAX requer Treino Intensivo 5/5',max:5,maxDesc:'MAX: 10 tornados gigantes, perfurantes e com área de impacto único'},
  {id:'helper_blissey',helperKey:'blissey',maxReq:'regen',maxReqName:'Água Restauradora',name:'Blissey',kind:'AJUDANTE',poke:242,desc:'1 / 2 / 3 / 4 / 5 corações perseguidores (+ Rajada); +50% dano; explosão de 3 SQM cura aliados e empurra inimigos • Lv.3 Shiny • Lv.5 Shiny 2x maior • MAX requer Água Restauradora 5/5',max:5,maxDesc:'MAX: Blissey Shiny fica 3x maior e cria o Santuário com cura, escudo e corações gigantes'},
  {id:'nova',name:'Psy Nova',kind:'ÁREA',poke:150,desc:'Explosão psíquica maior e mais frequente',max:5,maxDesc:'MAX: dupla explosão'},
  {id:'vortex',name:'Vórtice Mental',kind:'ÁREA',poke:196,desc:'Pulso em área que danifica inimigos próximos',max:5,maxDesc:'MAX: também puxa inimigos para o centro'},
  {id:'rain',name:'Chuva Psíquica',kind:'ÁREA',poke:151,desc:'Golpeia alvos aleatórios próximos periodicamente',max:5,maxDesc:'MAX: cada alvo recebe uma segunda descarga'},
  {id:'regen',name:'Água Restauradora',kind:'DEFESA',poke:79,desc:'+0,25% HP/s por nível • HP máximo: +3% / +5% / +7% / +10% / +15%',max:5}
]
function survEnemyPool(phase){return phase<=20?SURV_ENEMY_POOLS.early:phase<=60?SURV_ENEMY_POOLS.mid:SURV_ENEMY_POOLS.late}
function survEnemy(s,opt={}){
  const pool=survEnemyPool(s.phase),megaPool=[3,6,9,15,18,65,80,94,115,127,130,142,181,208,212,214,229,248,254,257,260,282,302,303,306,308,310,319,323,334,354,359,362,373,376,428,445,448,460,475,531];
  let id=Number(opt.id||pool[Math.floor(Math.random()*pool.length)]),boss=!!opt.boss,finalBoss=!!opt.finalBoss,bossMinute=Number(opt.bossMinute||0),forceMega=!!opt.forceMega,forceShiny=!!opt.forceShiny;
  if((forceMega||opt.forceMegaShiny)&&!opt.id)id=megaPool[Math.floor(Math.random()*megaPool.length)];if(opt.forceMegaShiny){forceMega=true;forceShiny=true}
  const allowStrong=opt.allowStrong!==false,allowVariant=opt.allowVariant!==false;
  const champion=!boss&&(opt.champion!=null?!!opt.champion:(allowStrong&&Math.random()<Math.min(.22,.065+s.elapsed/420000+s.phase*.00045)));
  const elite=!boss&&(opt.elite!=null?!!opt.elite:(allowStrong&&(champion||Math.random()<Math.min(.16,.055+s.elapsed/620000+s.phase*.00028))));
  const ranged=!boss&&(opt.ranged!=null?!!opt.ranged:Math.random()<Math.min(.30,.09+s.elapsed/540000+s.phase*.00055));
  const megaCap=!boss&&((typeof OFFICIAL_MEGA_SET!=='undefined'&&OFFICIAL_MEGA_SET.has(id))||forceMega),mega=!boss&&megaCap&&(forceMega||(allowVariant&&Math.random()<Math.min(.025,.006+s.elapsed/48000000+s.phase*.00002))),shiny=!boss&&(forceShiny||(allowVariant&&Math.random()<Math.min(.012,.0045+s.elapsed/90000000+s.phase*.000012)));
  const base=42+s.phase*4.4+Math.min(150,s.elapsed/12000),bossScale=boss?(bossMinute>=20?13:bossMinute>=15?8:bossMinute>=10?6:4):1,variantHp=mega&&shiny?5.2:mega?3.6:shiny?2.0:1,minuteHpMult=1+Math.floor(Math.max(0,s.elapsed)/60000)*.10,hpMult=(champion?3.8:elite?2.45:1)*(boss?34*bossScale:1)*variantHp*minuteHpMult;
  let hp=Math.max(26,Math.floor(base*hpMult*Math.max(1,Number(s.trialDifficulty||1))));if(Number(opt.hpOverride)>0)hp=Math.max(26,Math.floor(Number(opt.hpOverride)*Math.max(1,Number(s.trialDifficulty||1))));
  const size=(finalBoss?108:boss?92:opt.timedElite?78:champion?66:elite?57:47)*1.5*(mega?1.15:1),pt=(Number.isFinite(Number(opt.spawnX))&&Number.isFinite(Number(opt.spawnY)))?{x:Number(opt.spawnX),y:Number(opt.spawnY),spawnSide:Number(opt.spawnSide||0),spawnT:Number(opt.spawnT||.5)}:survSpawnSlotPoint(s,opt.spawnSide,opt.spawnT);
  let sp=(.82+Math.min(2.05,s.phase*.015+s.elapsed/900000))*(boss?.82:champion?.96:1);
  sp*=Math.sqrt(Math.max(1,Number(s.trialDifficulty||1)));
  return{x:pt.x,y:pt.y,spawnX:pt.x,spawnY:pt.y,spawnSide:pt.spawnSide,spawnT:pt.spawnT,slotId:opt.slotId??null,specialSpawn:!!opt.specialSpawn,timedElite:!!opt.timedElite,specialKind:opt.specialKind||'',hp,max:hp,sp,id,boss,elite,champion,ranged,finalBoss,bossMinute,shiny,mega,size,hit:(boss?.34:opt.timedElite?.30:champion?.27:elite?.22:.16)*Math.max(1,Number(s.trialDifficulty||1)),shootCd:350+Math.random()*750,shootRate:Math.max(620,1550-s.phase*3.0-s.elapsed/2600),attackRange:170+Math.random()*80,slow:0,orbitCd:0}
}
function survEnemySprite(s,arg){
  const e=typeof arg==='object'&&arg?arg:{id:arg},id=Number(e.id||1),megaForm=e.megaForm||null,key=`${id}:${e.shiny?1:0}:${e.mega?1:0}:${megaForm||''}`;s.spriteCache=s.spriteCache||{};
  if(!s.spriteCache[key]){const im=new Image();let src='';if(e.mega){try{src=window.getRealSprite?.({id,shiny:!!e.shiny,isMega:true,megaForm:megaForm||(id===6?'charizard-megax':id===150?'mewtwo-megax':null)})||''}catch(_){}}if(!src)src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${e.shiny?'shiny/':''}${id}.png`;im.decoding='async';im.src=src;im.onerror=function(){this.onerror=null;this.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`};s.spriteCache[key]=im}
  return s.spriteCache[key]
}
const SURV_PSYDUCK_ANIME_SHEET='assets/psyduck/normal.png';
const SURV_PSYDUCK_ANIM_ROWS={idle:0,walk:1,attack:2,special:3,hurt:4,defeat:5};
const SURV_PSYDUCK_FORM_SHEETS={
  shiny:'assets/psyduck/shiny.webp',
  mega:'assets/psyduck/mega.webp',
  mega_shiny:'assets/psyduck/mega_shiny.webp',
  squizo:'assets/psyduck/squizo.webp'
};
const SURV_PSYDUCK_MEGA_FRAME_RECTS=[
  [[8,9,123,141],[148,10,101,140],[267,10,105,141],[385,9,115,141]],
  [[14,155,106,119],[143,156,103,119],[269,158,100,118],[383,157,113,120]],
  [[6,281,111,122],[138,282,106,121],[265,284,123,119],[394,284,108,121]],
  [[3,407,123,123],[142,410,104,121],[254,414,117,117],[385,411,114,120]],
  [[17,536,90,113],[137,535,101,117],[271,537,87,115],[396,537,89,114]],
  [[24,653,93,108],[156,656,84,100],[263,662,93,95],[376,690,126,61]]
];
const SURV_PSYDUCK_MEGA_SHINY_FRAME_RECTS=[
  [[20,4,98,150],[140,4,98,150],[262,4,97,150],[387,4,92,150]],
  [[24,150,84,130],[147,150,81,130],[271,150,81,129],[389,150,80,129]],
  [[22,282,100,128],[141,281,102,129],[265,281,110,129],[389,282,101,128]],
  [[18,410,95,126],[140,410,96,126],[255,410,113,126],[376,410,122,126]],
  [[22,535,82,117],[146,538,80,114],[271,537,77,115],[394,537,78,115]],
  [[22,647,79,117],[141,648,74,116],[270,654,74,108],[391,650,79,116]]
]
const SURV_PSYDUCK_SHINY_HURT_RECTS=[
  [0,520,128,120],
  [128,520,128,120],
  [256,520,128,120],
  [384,520,128,120]
];
W.PSY_PSYDUCK_SHEETS={normal:SURV_PSYDUCK_ANIME_SHEET,shiny:SURV_PSYDUCK_FORM_SHEETS.shiny,mega:SURV_PSYDUCK_FORM_SHEETS.mega,mega_shiny:SURV_PSYDUCK_FORM_SHEETS.mega_shiny,squizo:SURV_PSYDUCK_FORM_SHEETS.squizo};
W.PSY_PSYDUCK_MEGA_RECTS=SURV_PSYDUCK_MEGA_FRAME_RECTS;
W.PSY_PSYDUCK_MEGA_SHINY_RECTS=SURV_PSYDUCK_MEGA_SHINY_FRAME_RECTS;
W.PSY_PSYDUCK_SHINY_HURT_RECTS=SURV_PSYDUCK_SHINY_HURT_RECTS;

function survPsyFormForLevel(lv){lv=Number(lv||1);return lv>=20?'squizo':lv>=15?'mega_shiny':lv>=10?'mega':lv>=5?'shiny':'normal'}
function survPsyFormLabel(form){return ({normal:'PSYDUCK',shiny:'SHINY PSYDUCK',mega:'MEGA PSYDUCK',mega_shiny:'MEGA SHINY PSYDUCK',squizo:'PSYDUCK SQUIZO'})[form]||'PSYDUCK'}
function survEnsurePsyFormImages(s){
  s.psyFormImgs=s.psyFormImgs||{normal:s.psyImg};
  for(const [k,src] of Object.entries(SURV_PSYDUCK_FORM_SHEETS))if(!s.psyFormImgs[k]){const im=new Image();im._survAnimeSheet=true;im.decoding='async';im.src=src;s.psyFormImgs[k]=im}
  const form=survPsyFormForLevel(s.runLevel);if(s.psyForm!==form){s.psyForm=form;s.psyFormChangedAt=Number(s.elapsed||0);s.effects?.push?.({type:'burst',x:s.x,y:s.y,r:12,max:92,life:28,color:form==='squizo'?'#d946ef':form.includes('shiny')?'#22d3ee':'#facc15'});s.texts?.push?.({x:s.x,y:s.y-92,text:survPsyFormLabel(form),life:80,color:form==='squizo'?'#f0abfc':form.includes('shiny')?'#67e8f9':'#fde047',big:true})}
  return s.psyFormImgs[form]||s.psyImg
}
function survPsyAnimTrigger(s,state,duration=400){
  if(!s||!SURV_PSYDUCK_ANIM_ROWS.hasOwnProperty(state))return;const now=Number(s.elapsed||0),rank={idle:0,walk:0,attack:1,special:2,hurt:3,defeat:4};
  if(now<Number(s.psyAnimUntil||0)&&s.psyAnimState===state){s.psyAnimUntil=Math.max(Number(s.psyAnimUntil||0),now+Math.min(180,Number(duration||400)));return}
  if(now<Number(s.psyAnimUntil||0)&&(rank[state]||0)<(rank[s.psyAnimState]||0))return;
  s.psyAnimState=state;s.psyAnimStart=now;s.psyAnimUntil=state==='defeat'?Infinity:now+Math.max(120,Number(duration||400));
}
function survPsyAnimFrame(s,form){
  const now=Number(s.elapsed||0);let state=s.hp<=0?'defeat':now<Number(s.psyAnimUntil||0)?String(s.psyAnimState||'idle'):s.psyMoving?'walk':'idle';
  let row=SURV_PSYDUCK_ANIM_ROWS[state]??0,oneShot=['attack','special','hurt','defeat'].includes(state),speed=state==='idle'?190:state==='walk'?115:state==='special'?125:105;
  const elapsed=Math.max(0,now-Number(s.psyAnimStart||0));let frame=state==='attack'?(elapsed<205?1:0):oneShot?Math.max(0,Math.min(3,Math.floor(elapsed/speed))):Math.floor(now/speed)%4;
  // Shiny: no portal/projectile frames. Basic attack uses only the approved blue aura in the hand.
  if(form==='shiny'&&state==='attack'){row=SURV_PSYDUCK_ANIM_ROWS.attack;frame=1}
  if(form==='shiny'&&state==='special'){row=SURV_PSYDUCK_ANIM_ROWS.idle;frame=0}
  if(form==='mega_shiny'&&state==='special'&&frame===3)frame=2
  return{state,row,frame}
}
function survBeginDefeat(s){if(!s||s.done||s.ending)return;s.hp=0;s.ending=true;s.endAt=Number(s.elapsed||0)+650;survPsyAnimTrigger(s,'defeat',650)}
function survDrawPsyduck(s,ctx){
  let im=survEnsurePsyFormImages(s);const form=s.psyForm||'normal';if(!im?.complete||!im.naturalWidth){im=s.psyFormImgs?.normal||s.psyImg;if(!im?.complete||!im.naturalWidth)return}const drawSize=(form==='mega'||form==='mega_shiny'?88:form==='squizo'?78:72),pulse=.5+.5*Math.sin(s.elapsed/125);ctx.globalAlpha=.13+.08*pulse;ctx.fillStyle='#67e8f9';ctx.beginPath();ctx.arc(s.x,s.y,58+4*pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle='#f0abfc';ctx.lineWidth=2;ctx.globalAlpha=.30+.15*pulse;ctx.beginPath();ctx.arc(s.x,s.y,48+7*pulse,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.shadowColor='#fde047';ctx.shadowBlur=13;ctx.save();ctx.translate(s.x,s.y);if(Number(s.psyFacing||1)<0)ctx.scale(-1,1);
  if(im._survAnimeSheet){
    const a=survPsyAnimFrame(s,form);
    if(form==='mega'||form==='mega_shiny'){
      const rects=form==='mega_shiny'?SURV_PSYDUCK_MEGA_SHINY_FRAME_RECTS:SURV_PSYDUCK_MEGA_FRAME_RECTS;
      const rr=rects?.[a.row]?.[a.frame];
      if(rr){
        const [sx,sy,sw,sh]=rr,scale=Math.min(drawSize/sw,drawSize/sh),dw=sw*scale,dh=sh*scale,bottom=drawSize*.40;
        ctx.drawImage(im,sx,sy,sw,sh,-dw/2,bottom-dh,dw,dh);
      }
    }else if(form==='shiny'&&a.row===SURV_PSYDUCK_ANIM_ROWS.hurt){
      const rr=SURV_PSYDUCK_SHINY_HURT_RECTS?.[a.frame];
      if(rr&&rr[0]>=0&&rr[1]>=0&&rr[0]+rr[2]<=im.naturalWidth&&rr[1]+rr[3]<=im.naturalHeight){
        const [sx,sy,sw,sh]=rr,scale=Math.min(drawSize/sw,drawSize/sh),dw=sw*scale,dh=sh*scale,bottom=drawSize*.40;
        ctx.drawImage(im,sx,sy,sw,sh,-dw/2,bottom-dh,dw,dh);
      }else{
        const sw=im.naturalWidth/4,sh=im.naturalHeight/6;
        ctx.drawImage(im,a.frame*sw,a.row*sh,sw,sh,-drawSize/2,-drawSize*.60,drawSize,drawSize);
      }
    }else{
      const sw=im.naturalWidth/4,sh=im.naturalHeight/6;
      ctx.drawImage(im,a.frame*sw,a.row*sh,sw,sh,-drawSize/2,-drawSize*.60,drawSize,drawSize);
    }
  }else ctx.drawImage(im,-51,-51,102,102);
  ctx.restore();ctx.shadowBlur=0
}
function survRunUpLv(s,id){return Number(s.upgradeLevels?.[id]||0)}
function survRunMaxed(s,id){return !!s.upgradeMaxed?.[id]}
function survHelperUpgradeId(key){return 'helper_'+key}
function survHelperLv(s,key){return survRunUpLv(s,survHelperUpgradeId(key))}
function survHelperMaxed(s,key){return survRunMaxed(s,survHelperUpgradeId(key))}
function survHelperVisual(s,key){
  const def=SURV_HELPERS.find(h=>h.key===key);if(!def)return null;
  const lv=survHelperLv(s,key),maxed=survHelperMaxed(s,key);s.helperForms=s.helperForms||{};
  let shiny=false,mega=false,megaForm=null,label='NORMAL';
  if(key==='blissey'){
    if(maxed){shiny=true;label='SHINY MAX'}
    else if(lv>=5){shiny=true;label='SHINY GIGANTE'}
    else if(lv>=3){shiny=true;label='SHINY'}
  }else{
    if(maxed){shiny=true;mega=true;label='SHINY MEGA'}
    else if(lv>=5){mega=true;label='MEGA'}
    else if(lv>=3){shiny=true;label='SHINY'}
  }
  if(mega&&def.id===6){if(!s.helperForms.charizardMega)s.helperForms.charizardMega=Math.random()<.5?'charizard-megax':'charizard-megay';megaForm=s.helperForms.charizardMega}
  return{id:def.id,shiny,mega,megaForm,label,def,lv,maxed}
}
function survRunAvail(s){const helperIds=s.helperIds||[],abilityCount=survPsyAbilityCount(s);return SURV_RUN_UPS.filter(u=>{const lv=survRunUpLv(s,u.id),helperMaxReady=!!u.helperKey&&lv>=u.max&&!survRunMaxed(s,u.id)&&(!u.maxReq||survRunUpLv(s,u.maxReq)>=5),normalMaxReady=!u.helperKey&&lv>=u.max&&!survRunMaxed(s,u.id)&&['pierce','nova','vortex','rain'].includes(u.id),base=lv<u.max||helperMaxReady||normalMaxReady;if(!base)return false;if(u.helperKey&&!helperIds.includes(u.helperKey)&&helperIds.length>=SURV_HELPER_CAP)return false;if(SURV_PSY_ABILITY_IDS.has(u.id)&&!survPsyAbilityActive(s,u.id)&&abilityCount>=SURV_PSY_ABILITY_CAP)return false;return true})}
function survPowerIcon(u,s=null,targetMax=false){
  if(u?.helperKey&&s){const current=survHelperLv(s,u.helperKey),targetLv=targetMax?current:Math.min(u.max,current+1),vis={id:u.poke,shiny:false,mega:false,megaForm:null};if(u.helperKey==='blissey'){if(targetMax||targetLv>=3)vis.shiny=true}else if(targetMax){vis.shiny=true;vis.mega=true}else if(targetLv>=5)vis.mega=true;else if(targetLv>=3)vis.shiny=true;if(vis.mega&&Number(u.poke)===6){s.helperForms=s.helperForms||{};if(!s.helperForms.charizardMega)s.helperForms.charizardMega=Math.random()<.5?'charizard-megax':'charizard-megay';vis.megaForm=s.helperForms.charizardMega}try{return window.getRealSprite?.({id:vis.id,shiny:vis.shiny,isMega:vis.mega,megaForm:vis.megaForm})||`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${vis.shiny?'shiny/':''}${vis.id}.png`}catch(_){}}
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${u.poke||54}.png`
}
function survShuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function survShowLevelUp(s,title='RUN LEVEL UP!',subtitle='ESCOLHA UM APRIMORAMENTO',restoredOfferIds=null){
  if(s.levelUpOpen||s.done)return;
  const all=survShuffle(survRunAvail(s).slice()),helperAvail=all.filter(u=>u.helperKey),g=$('psy-clean-surv-upgrid'),ov=$('psy-clean-surv-up');
  if(!g||!ov)return;
  const availableIds=new Set(all.map(u=>u.id));
  let avail=Array.isArray(restoredOfferIds)?restoredOfferIds.map(id=>SURV_RUN_UPS.find(u=>u.id===id)).filter(u=>u&&availableIds.has(u.id)).slice(0,5):all.slice(0,5);
  if(!avail.length)avail=all.slice(0,5);
  if(helperAvail.length&&!(avail.some(u=>u.helperKey))&&(s.helperIds?.length||0)<SURV_HELPER_CAP)avail[avail.length-1]=helperAvail[Math.floor(Math.random()*helperAvail.length)];
  s.levelUpOpen=true;s.paused=true;s.rewardMode='levelup';s.rewardOfferIds=avail.map(u=>u.id);g.style.gridTemplateColumns='repeat(5,minmax(125px,1fr))';const titleEl=ov.querySelector('.psy-surv-level-title span'),subEl=ov.querySelector('.psy-surv-level-title b');if(titleEl)titleEl.textContent=title;if(subEl)subEl.textContent=subtitle;
  g.innerHTML=avail.length?avail.map(u=>{const lv=survRunUpLv(s,u.id),isMaxOffer=lv>=u.max&&!survRunMaxed(s,u.id);return`<button type="button" class="psy-surv-upcard ${isMaxOffer?'max':''}" data-surv-upgrade="${u.id}"><span class="psy-surv-upkind">${u.kind}</span><div class="psy-surv-upimg"><img src="${survPowerIcon(u,s,isMaxOffer)}" onerror="this.onerror=null;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${u.poke}.png'"></div><h3>${u.name}</h3><p>${isMaxOffer?u.maxDesc:u.desc}</p><b>${isMaxOffer?'APRIMORAR PARA MAX':`Lv.${lv} → ${lv+1}/${u.max}`}</b></button>`}).join(''):'<div class="psy20-card">Todos os power-ups desta run estão completos.</div>';
  /* Power-Up selection uses delegated pointer handling so every card, including Rajada,
     remains selectable in local-file Chrome and on touch devices. */
  const pickUpgrade=(ev)=>{
    const btn=ev.target?.closest?.('[data-surv-upgrade]');if(!btn||!g.contains(btn))return;
    ev.preventDefault?.();ev.stopPropagation?.();
    const id=String(btn.dataset.survUpgrade||'');if(!id)return;
    if(s._upgradePickLock)return;
    s._upgradePickLock=true;
    try{W.psySurvChooseUpgrade(id)}finally{setTimeout(()=>{if(W.PSY_CLEAN_SURV===s)s._upgradePickLock=false},120)}
  };
  g.onpointerup=pickUpgrade;
  g.onclick=pickUpgrade;
  g.querySelectorAll('[data-surv-upgrade]').forEach(btn=>{btn.style.pointerEvents='auto';btn.style.cursor='pointer';btn.style.touchAction='manipulation'});
  ov.style.display='flex';psySurvSaveResume(true)
}
function survAddHelper(s,key){s.helperIds=s.helperIds||[];if(!key||s.helperIds.includes(key))return;if(s.helperIds.length>=SURV_HELPER_CAP){toast(`Limite de ${SURV_HELPER_CAP} ajudantes por run.`);return}const pick=SURV_HELPERS.find(h=>h.key===key);if(!pick)return;s.helperIds.push(key);survHelperState(s,key,s.helperIds.length-1);s.texts.push({x:s.x,y:s.y-70,text:`🤝 ${pick.name} entrou na equipe!`,life:95,color:pick.color,big:true});s.helpers=s.helperIds.length}
function survApplyUpgrade(s,u){
  if(!s||!u||s.done)return false;const id=u.id,lv=survRunUpLv(s,id),maxOffer=lv>=u.max&&!survRunMaxed(s,id);
  if(u.helperKey&&!s.helperIds?.includes(u.helperKey)&&(s.helperIds?.length||0)>=SURV_HELPER_CAP)return false;
  if(SURV_PSY_ABILITY_IDS.has(id)&&!survPsyAbilityActive(s,id)&&survPsyAbilityCount(s)>=SURV_PSY_ABILITY_CAP)return false;
  if(u.helperKey){
    if(maxOffer){if(u.maxReq&&survRunUpLv(s,u.maxReq)<5)return false;s.upgradeMaxed[id]=true;s.texts.push({x:s.x,y:s.y-70,text:`✨ ${u.name} MAX!`,life:100,color:SURV_HELPERS.find(h=>h.key===u.helperKey)?.color||'#fff',big:true})}
    else if(lv<u.max){s.upgradeLevels[id]=lv+1;survAddHelper(s,u.helperKey)}else return false;
  }else if(maxOffer){s.upgradeMaxed[id]=true;if(id==='pierce')s.pierce+=3;if(id==='nova')s.novaMax=true;if(id==='vortex')s.vortexMax=true;if(id==='rain')s.rainMax=true;}
  else if(lv<u.max){s.upgradeLevels[id]=lv+1;if(id==='rate')s.fireRate=Math.max(135,s.fireRate*.92);if(id==='multi')s.multi=Math.min(6,s.multi+1);if(id==='pierce')s.pierce=Math.min(6,s.pierce+1);if(id==='speed')s.speed*=1.06;if(id==='nova')s.nova++;if(id==='vortex')s.vortex++;if(id==='rain')s.rain++;if(id==='regen'){const hpSteps=[0,.03,.05,.07,.10,.15],oldPct=hpSteps[lv]||0,newPct=hpSteps[Math.min(5,lv+1)]||oldPct,oldMax=s.maxHp;s.maxHp*=((1+newPct)/(1+oldPct));s.hp=Math.min(s.maxHp,s.hp+(s.maxHp-oldMax));s.regen+=.0025}}else return false;
  return true
}
function survCloseRewardOverlay(s){const ov=$('psy-clean-surv-up');if(ov)ov.style.display='none';s.levelUpOpen=false;s.paused=false;s.rewardMode='';s.rewardOfferIds=[];if(!s.finalBossDead)survRunLevel(s);psySurvSaveResume(true)}
W.psySurvChooseUpgrade=function(id){
  const s=W.PSY_CLEAN_SURV,u=SURV_RUN_UPS.find(x=>x.id===id);if(!s||!u||s.done)return;
  const lv=survRunUpLv(s,id),maxOffer=lv>=u.max&&!survRunMaxed(s,id);
  if(u.helperKey&&maxOffer&&u.maxReq&&survRunUpLv(s,u.maxReq)<5)return toast(`${u.name} MAX requer ${u.maxReqName||u.maxReq} 5/5.`);
  if(!survApplyUpgrade(s,u))return;
  survCloseRewardOverlay(s)
};
function survOwnedUpgradeable(s){return SURV_RUN_UPS.filter(u=>{const lv=survRunUpLv(s,u.id);if(lv<=0&&!survRunMaxed(s,u.id))return false;if(survRunMaxed(s,u.id))return false;if(lv<u.max)return true;if(u.helperKey)return lv>=u.max&&(!u.maxReq||survRunUpLv(s,u.maxReq)>=5);return lv>=u.max&&['pierce','nova','vortex','rain'].includes(u.id)})}
function survApplyEliteStatBonus(s,e){let pct=0;if(e?.shiny)pct+=.002;if(e?.mega)pct+=.005;if(pct<=0)return;s.specialStatBonus=Number(s.specialStatBonus||0)+pct;s.power*=1+pct;s.basePower*=1+pct;const old=s.maxHp;s.maxHp*=1+pct;s.hp=Math.min(s.maxHp,s.hp+(s.maxHp-old))}
function survShowEliteReward(s){
  if(s.levelUpOpen||s.done)return;const g=$('psy-clean-surv-upgrid'),ov=$('psy-clean-surv-up');if(!g||!ov)return;s.levelUpOpen=true;s.paused=true;s.rewardMode='elite';s.rewardOfferIds=[];g.style.gridTemplateColumns='repeat(4,minmax(150px,1fr))';const titleEl=ov.querySelector('.psy-surv-level-title span'),subEl=ov.querySelector('.psy-surv-level-title b');if(titleEl)titleEl.textContent='ELITE DERROTADO!';if(subEl)subEl.textContent='ESCOLHA UMA RECOMPENSA';
  g.innerHTML=`<button class="psy-surv-upcard" onclick="psySurvEliteReward('atk')"><span class="psy-surv-upkind">BÔNUS</span><div class="psy-surv-upimg"><img src="${survPowerIcon({poke:68})}"></div><h3>Força Crescente</h3><p>Aumenta seu poder ofensivo.</p><b>+10% ATK</b></button><button class="psy-surv-upcard" onclick="psySurvEliteReward('hp')"><span class="psy-surv-upkind">BÔNUS</span><div class="psy-surv-upimg"><img src="${survPowerIcon({poke:113})}"></div><h3>Vitalidade</h3><p>Aumenta a vida máxima e recupera a diferença.</p><b>+10% VIDA</b></button><button class="psy-surv-upcard" onclick="psySurvEliteReward('loot')"><span class="psy-surv-upkind">BÔNUS</span><div class="psy-surv-upimg"><img src="${survPowerIcon({poke:52})}"></div><h3>Instinto de Caça</h3><p>Melhora suas próximas recompensas de drop.</p><b>+5% LOOT</b></button><button class="psy-surv-upcard" onclick="psySurvEliteReward('random')"><span class="psy-surv-upkind">ROLETA</span><div class="psy-surv-upimg"><img src="${survPowerIcon({poke:201})}"></div><h3>Eco de Poder</h3><p>Aprimora aleatoriamente algo que você já escolheu.</p><b>GIRAR HABILIDADE</b></button>`;ov.style.display='flex';psySurvSaveResume(true)
}
W.psySurvEliteReward=function(kind){const s=W.PSY_CLEAN_SURV;if(!s||s.done||!s.levelUpOpen)return;if(kind==='atk'){s.power*=1.10;s.basePower*=1.10;s.eliteAtkBonus=Number(s.eliteAtkBonus||0)+10;survCloseRewardOverlay(s);return}if(kind==='hp'){const old=s.maxHp;s.maxHp*=1.10;s.hp=Math.min(s.maxHp,s.hp+(s.maxHp-old));s.eliteHpBonus=Number(s.eliteHpBonus||0)+10;survCloseRewardOverlay(s);return}if(kind==='loot'){s.survLootBonus=Number(s.survLootBonus||0)+5;survCloseRewardOverlay(s);return}if(kind!=='random')return;const pool=survOwnedUpgradeable(s),g=$('psy-clean-surv-upgrid');if(!pool.length){s.power*=1.10;s.basePower*=1.10;s.eliteAtkBonus=Number(s.eliteAtkBonus||0)+10;toast('Nenhum aprimoramento anterior disponível; recebeu +10% ATK.');survCloseRewardOverlay(s);return}if(g){g.style.gridTemplateColumns='1fr';g.innerHTML='<div class="psy-surv-upcard" style="min-height:210px;display:grid;place-items:center"><div><span class="psy-surv-upkind">ROLETA</span><h3 id="psy-elite-roll-name" style="font-size:28px">...</h3><p>Escolhendo entre seus aprimoramentos...</p></div></div>'}let ticks=0;const timer=setInterval(()=>{if(W.PSY_CLEAN_SURV!==s||s.done){clearInterval(timer);return}const u=pool[Math.floor(Math.random()*pool.length)],el=$('psy-elite-roll-name');if(el)el.textContent=u.name;if(++ticks>=14){clearInterval(timer);const pick=pool[Math.floor(Math.random()*pool.length)];survApplyUpgrade(s,pick);const el2=$('psy-elite-roll-name');if(el2)el2.textContent=`✨ ${pick.name}!`;setTimeout(()=>{if(W.PSY_CLEAN_SURV===s&&!s.done)survCloseRewardOverlay(s)},650)}},85)};
function survRunLevel(s){
  if(s.levelUpOpen)return;
  if(s.runXp>=s.runXpNext){s.runXp-=s.runXpNext;s.runLevel++;s.runXpNext=Math.floor(s.runXpNext*1.14+15);survShowLevelUp(s)}
}
function survDropPickup(s,e,type,v,name,visual=''){
  if(type==='gold'){s.gold+=Number(v||0);return null}
  s.pickups=s.pickups||[];const rare=visual==='rare'||visual==='epic';if(s.pickups.length>105){const ix=s.pickups.findIndex(p=>!p.visual&&(p.type==='xp'||p.type==='heal'));if(ix>=0)s.pickups.splice(ix,1);else if(!rare)return null}
  const p={x:e?.x??s.x,y:e?.y??s.y,type,v:v||0,name:name||'',visual,life:rare?90000:52000};s.pickups.push(p);return p
}
function survKill(s,e){
  s.kills++;survApplyEliteStatBonus(s,e);
  const reward=survRewardScale(s,e),xp=Math.floor((8+(e.elite?10:0)+(e.boss?50:0))*(1+s.phase*.025)*reward),gold=Math.floor((6+(e.elite?12:0)+(e.boss?90:0))*(1+s.phase*.02)*reward);
  const goldMult=1+Math.max(0,Number(getTotalBuff?.('gold')||0))/100,xpMult=1+Math.max(0,Number(getTotalBuff?.('xp')||0))/100,runXpMult=1+survRunUpLv(s,'runxp')*.10;
  s.runXp+=Math.max(1,Math.floor(xp*runXpMult));s.realXp+=Math.floor(xp*(1.05+s.phase*.012)*xpMult);s.gold+=Math.floor(gold*goldMult);
  try{P.meta.kills=Number(P.meta.kills||0)+1}catch(_){ }
  try{window.psyPassTrackSurvivor?.(Number(e?.id||0))}catch(err){console.error('Battle Pass Survivor tracking failed:',err)}
  const luck=1+Number(s.skills?.luck||0)*.05;if(Math.random()<.045*luck)survDropPickup(s,e,'heal',.18);
  survRareDrop(s,e);survMilestoneKill(s,e);
  if(e.boss){s.bossKills++;survDropPickup(s,e,'heal',.35);if(e.finalBoss)s.finalBossDead=true;survShowLevelUp(s,'CHEFE DERROTADO!','ESCOLHA UM APRIMORAMENTO')}
  else if(e.timedElite)survShowEliteReward(s);
  if(e.slotId!=null&&!e.boss){s.respawnQueue=s.respawnQueue||[];s.respawnQueue.push({slotId:e.slotId,spawnSide:e.spawnSide,spawnT:e.spawnT,spawnX:e.spawnX,spawnY:e.spawnY,readyAt:Number(s.elapsed||0)+SURV_RESPAWN_MIN+Math.random()*(SURV_RESPAWN_MAX-SURV_RESPAWN_MIN)})}
  if(!s.levelUpOpen)survRunLevel(s)
}
function survConsumePickup(s,p){
  if(!p||p.dead)return;p.dead=true;
  if(p.type==='heal')s.hp=Math.min(s.maxHp,s.hp+s.maxHp*p.v);
  if(p.type==='gold')s.gold+=p.v;
  if(p.type==='loot'){s.loot[p.name]=Number(s.loot[p.name]||0)+1}
  if(p.type==='pack'){s.packLoot=s.packLoot||{normal:0,ss:0};if(p.name==='Pack SS')s.packLoot.ss++;else s.packLoot.normal++;s.cardPacks=Number(s.packLoot.normal||0)}
  if(p.visual){const label=p.visual==='epic'?`🎁 ${p.name} obtido!`:`★ ${p.name} obtido!`;if((s.texts?.length||0)<Number(s.perf?.textCap||90))s.texts.push({x:s.x,y:s.y-62,text:label,life:95,color:p.visual==='epic'?'#fde047':'#facc15',big:true})}
}
function survCollect(s){
  for(const p of s.pickups){if(p.dead)continue;p.life-=16;if(p.life<=0){p.dead=true;continue}let d=Math.hypot(p.x-s.x,p.y-s.y);if(p.gengarPull){p.gengarPullLife=Number(p.gengarPullLife||0)-16;const dx=s.x-p.x,dy=s.y-p.y,dist=Math.hypot(dx,dy)||1,step=Math.min(dist,30);p.x+=dx/dist*step;p.y+=dy/dist*step;d=Math.hypot(p.x-s.x,p.y-s.y);if(p.gengarPullLife<=0)p.gengarPull=false}if(d<s.magnet+10)survConsumePickup(s,p)}
  s.pickups=s.pickups.filter(p=>!p.dead);survRunLevel(s)
}
function survSpawnMiniHorde(s){
  s.texts.push({x:s.x,y:s.y-90,text:'⚠ PRESSÃO AUMENTOU!',life:90,color:'#fb7185',big:true});
}
function survSpawnBoss(s,minute,finalBoss){
  if(s.bossMarks.has(minute))return;s.bossMarks.add(minute);
  const id=SURV_BOSS_POOL[(s.phase+minute)%SURV_BOSS_POOL.length];
  s.enemies.push(survEnemy(s,{id,boss:true,elite:true,finalBoss:!!finalBoss,bossMinute:minute,specialSpawn:true}));
  s.texts.push({x:s.x,y:s.y-90,text:finalBoss?'⚠ CHEFE FINAL — DERROTE-O PARA CONCLUIR!':'⚠ CHEFE EM CAMPO!',life:150,color:'#facc15',big:true})
}


function survSpawnTimedElite(s){if(survSpecialCount(s)>=SURV_SPECIAL_MAX){const old=(s.enemies||[]).find(e=>!e.dead&&!e.boss&&e.slotId==null&&!e.timedElite);if(old)old.dead=true}const next=survNextBossMinute(s),hp=Math.floor(survEstimateBossHp(s,next)*.50),pool=survEnemyPool(s.phase),id=pool[Math.floor(Math.random()*pool.length)],e=survEnemy(s,{id,elite:true,champion:true,timedElite:true,specialSpawn:true,allowVariant:false,hpOverride:hp});s.enemies.push(e);s.texts.push({x:s.x,y:s.y-88,text:`⚠ POKÉMON ELITE ENTROU NA ARENA!`,life:120,color:'#fb7185',big:true})}
function survSpawnVariantSpecial(s){if(survSpecialCount(s)>=SURV_SPECIAL_MAX)return;const r=Math.random(),opt={specialSpawn:true,allowStrong:false},next=survNextBossMinute(s),subBossHp=Math.max(1,Math.floor(survEstimateBossHp(s,next)*.50));if(r<.15){opt.forceMegaShiny=true;opt.specialKind='mega_shiny';opt.hpOverride=Math.floor(subBossHp*.75)}else if(r<.50){opt.forceMega=true;opt.specialKind='mega';opt.hpOverride=Math.floor(subBossHp*.50)}else{opt.forceShiny=true;opt.specialKind='shiny';opt.hpOverride=Math.floor(subBossHp*.25)}const e=survEnemy(s,opt);s.enemies.push(e);const label=opt.forceMegaShiny?'🌈 MEGA SHINY':opt.forceMega?'🧬 MEGA':'✨ SHINY';s.texts.push({x:s.x,y:s.y-80,text:`${label} ENTROU NA ARENA!`,life:90,color:opt.forceMegaShiny?'#f0abfc':opt.forceMega?'#c084fc':'#fde047',big:true})}
function survProcessRespawns(s){const q=s.respawnQueue||[];let spawned=0;for(let i=0;i<q.length&&spawned<2;){const slot=q[i];if(Number(slot.readyAt||0)>Number(s.elapsed||0)){i++;continue}q.splice(i,1);if((s.enemies||[]).some(e=>!e.dead&&e.slotId===slot.slotId))continue;const maxD=Math.hypot(Number(s.viewW||1000)/2,Number(s.viewH||500)/2)+SURV_SQM*1.25,d=Math.hypot(Number(slot.spawnX||s.x)-s.x,Number(slot.spawnY||s.y)-s.y);let x=slot.spawnX,y=slot.spawnY;if(!Number.isFinite(Number(x))||!Number.isFinite(Number(y))||d>maxD){const pt=survSpawnSlotPoint(s,slot.spawnSide,slot.spawnT);x=pt.x;y=pt.y}const e=survEnemy(s,{slotId:slot.slotId,spawnSide:slot.spawnSide,spawnT:slot.spawnT,spawnX:x,spawnY:y,allowVariant:false,allowStrong:false});s.enemies.push(e);spawned++}}
/* Survivor boss specials: red floor telegraphs + meteors / volleys / charges / traps */
function survBossHurt(s,dmg,x=s.x,y=s.y,label=''){
  if(!s||s.done||dmg<=0)return;
  s.hp=Math.max(0,s.hp-Math.max(1,dmg));survPsyAnimTrigger(s,s.hp<=0?'defeat':'hurt',s.hp<=0?700:420);
  survFxPush(s,{type:'impact',x,y,r:8,max:42,life:16,color:'#ef4444',heavy:true});
  if(label&&(s.texts?.length||0)<Number(s.perf?.textCap||90))s.texts.push({x:s.x,y:s.y-68,text:label,life:42,color:'#fecaca',big:true});
  if(s.hp<=0)survBeginDefeat(s)
}
function survBossHazardPush(s,h){
  s.bossHazards=s.bossHazards||[];h.delay=Math.max(0,Number(h.delay||0));h.duration=Math.max(0,Number(h.duration||0));h.maxDelay=Math.max(1,Number(h.maxDelay||h.delay||1));h.tickAcc=0;s.bossHazards.push(h);
  if(s.bossHazards.length>42)s.bossHazards.splice(0,s.bossHazards.length-42)
}
function survBossSkillName(k){return k==='meteor'?'☄ METEOROS':k==='volley'?'🔻 RAJADA':k==='charge'?'💥 INVESTIDA':'⚠ ARMADILHAS'}
function survQueueBossSkill(s,e,kind){
  if(!e||e.dead)return;const m=Math.max(5,Number(e.bossMinute||5)),final=!!e.finalBoss,dist=Math.hypot(e.x-s.x,e.y-s.y);if(dist>Math.max(720,(s.attackRange||SURV_ATTACK_RANGE)*1.65))return;
  const announce=survBossSkillName(kind);if(survInView(s,e.x,e.y,160))s.texts.push({x:e.x,y:e.y-e.size*.62-30,text:announce,life:62,color:'#fca5a5',big:true});
  if(kind==='meteor'){
    const count=final?8:m>=15?6:m>=10?5:4,rad=final?76:m>=15?68:60,warn=final?720:900;
    for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,rr=i===0?0:35+Math.random()*(135+m*2),lead=i===0?1:.72;const x=Math.max(rad,Math.min(s.worldW-rad,s.x*lead+e.x*(1-lead)+Math.cos(a)*rr)),y=Math.max(rad,Math.min(s.worldH-rad,s.y*lead+e.y*(1-lead)+Math.sin(a)*rr));survBossHazardPush(s,{kind:'bossMeteor',x,y,r:rad,delay:warn+i*55,maxDelay:warn+i*55,dmg:s.maxHp*(final?.16:.10+m*.0025),source:e})}
  }else if(kind==='volley'){
    const a=Math.atan2(s.y-e.y,s.x-e.x),count=final?11:m>=15?9:m>=10?7:5,spread=final?.16:.13,warn=650;
    survBossHazardPush(s,{kind:'bossVolley',x:e.x,y:e.y,a,len:Math.min(760,dist+220),width:22,delay:warn,maxDelay:warn,count,spread,dmg:s.maxHp*(final?.060:.043+m*.00055),source:e})
  }else if(kind==='charge'){
    const a=Math.atan2(s.y-e.y,s.x-e.x),len=Math.min(620,Math.max(330,dist+120)),warn=820;
    survBossHazardPush(s,{kind:'bossCharge',x:e.x,y:e.y,a,len,width:final?58:48,delay:warn,maxDelay:warn,dmg:s.maxHp*(final?.22:.16+m*.002),source:e})
  }else if(kind==='trap'){
    const count=final?7:m>=15?6:m>=10?5:4,rad=final?58:50,warn=760;
    for(let i=0;i<count;i++){const a=i*Math.PI*2/count+Math.random()*.5,rr=i===0?70:90+Math.random()*180,x=Math.max(rad,Math.min(s.worldW-rad,s.x+Math.cos(a)*rr)),y=Math.max(rad,Math.min(s.worldH-rad,s.y+Math.sin(a)*rr));survBossHazardPush(s,{kind:'bossTrap',x,y,r:rad,delay:warn+i*45,maxDelay:warn+i*45,duration:final?5200:4400,dmg:s.maxHp*(final?.065:.045),tickEvery:720,source:e})}
  }
}
function survUpdateBossSkills(s,dt){
  s.bossHazards=s.bossHazards||[];
  for(const e of s.enemies){
    if(!e.boss||e.dead)continue;
    if(!Number.isFinite(e.bossSkillCd))e.bossSkillCd=1500+Math.random()*1300;
    if(!Number.isFinite(e.bossSkillCycle))e.bossSkillCycle=Math.floor(Math.random()*4);
    e.bossSkillCd-=dt;
    if(e.bossSkillCd<=0){
      const m=Math.max(5,Number(e.bossMinute||5)),list=m>=15?['meteor','volley','charge','trap']:m>=10?['meteor','volley','trap']:['meteor','volley'];const kind=list[e.bossSkillCycle%list.length];e.bossSkillCycle++;
      survQueueBossSkill(s,e,kind);
      const base=e.finalBoss?2850:m>=15?3350:m>=10?3900:4550;e.bossSkillCd=base*(.88+Math.random()*.28)
    }
  }
  for(const h of s.bossHazards){
    if(h.dead)continue;
    if(h.delay>0){h.delay-=dt;if(h.delay>0)continue;
      if(h.kind==='bossMeteor'){
        if(Math.hypot(s.x-h.x,s.y-h.y)<=h.r+24)survBossHurt(s,h.dmg,h.x,h.y,'☄ IMPACTO!');
        survFxPush(s,{type:'meteorStrike',x:h.x,y:h.y,life:24,color:'#ef4444',giant:true,radius:h.r});survFxImpact(s,h.x,h.y,'#ef4444',h.r,true);h.dead=true;continue
      }
      if(h.kind==='bossVolley'){
        const src=h.source;if(src&&!src.dead){for(let i=0;i<h.count;i++){const aa=h.a+(i-(h.count-1)/2)*h.spread,spd=6.8+(src.finalBoss?1.6:.5);s.enemyBullets.push({x:src.x,y:src.y,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,dmg:h.dmg,radius:src.finalBoss?9:7,color:'#ef4444',life:2600,bossSpecial:true})}survFxPush(s,{type:'burst',x:src.x,y:src.y,r:8,max:54,life:18,color:'#ef4444'})}h.dead=true;continue
      }
      if(h.kind==='bossCharge'){
        const src=h.source;if(src&&!src.dead){src.charge={active:true,a:h.a,left:src.finalBoss?720:610,speed:src.finalBoss?18:15,dmg:h.dmg,hit:false};survFxPush(s,{type:'burst',x:src.x,y:src.y,r:8,max:64,life:18,color:'#ef4444'})}h.dead=true;continue
      }
      if(h.kind==='bossTrap'){h.active=true;h.tickAcc=0;continue}
    }
    if(h.kind==='bossTrap'&&h.active){h.duration-=dt;h.tickAcc+=dt;if(h.tickAcc>=h.tickEvery){h.tickAcc%=h.tickEvery;if(Math.hypot(s.x-h.x,s.y-h.y)<=h.r+20)survBossHurt(s,h.dmg,h.x,h.y,'⚠ ARMADILHA!')}if(h.duration<=0)h.dead=true}
  }
  s.bossHazards=s.bossHazards.filter(h=>!h.dead)
}
function survDamageHelper(s,key,dmg,x,y){const i=(s.helperIds||[]).indexOf(key);if(i<0)return false;const h=survHelperState(s,key,i);h.hp=Math.max(0,h.hp-Math.max(0,Number(dmg||0)));if(h.hp<=h.maxHp*.25)h.retreat=true;if(survInView(s,h.x,h.y,70)&&(s.texts?.length||0)<Number(s.perf?.textCap||90))s.texts.push({x:h.x,y:h.y-34,text:`-${Math.max(1,Math.floor(dmg))}`,life:18,color:'#fda4af'});return true}
function survEnemyTarget(s,e,dt){
  e.helperTargetCd=Number(e.helperTargetCd||0)-dt;let key=e.targetHelperKey||'';
  if(key&&!s.helperIds?.includes(key))key='';
  if(e.helperTargetCd<=0){e.helperTargetCd=700+Math.random()*700;key='';const candidates=(s.helperIds||[]).filter((k,i)=>{const h=survHelperState(s,k,i);return h.hp>0&&Math.hypot(h.x-e.x,h.y-e.y)<=SURV_SQM*8});const helperChance=e.boss?.10:e.elite?.18:.24;if(candidates.length&&Math.random()<helperChance)key=candidates[Math.floor(Math.random()*candidates.length)];e.targetHelperKey=key}
  if(key){const i=s.helperIds.indexOf(key),h=survHelperState(s,key,i);return{kind:'helper',key,x:h.x,y:h.y,h}}
  return{kind:'psyduck',key:'',x:s.x,y:s.y,h:null}
}
function survNearestEnemy(s,x,y,exclude,maxRange=Infinity){let best=null,bd=maxRange;for(const e of s.enemies){if(e.dead||e===exclude)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<=bd){bd=d;best=e}}return best}
function survEnemiesNear(s,x,y,maxRange){return s.enemies.filter(e=>!e.dead&&Math.hypot(e.x-x,e.y-y)<=maxRange)}
function survBullet(s,o={}){s.bullets.push({x:o.x,y:o.y,vx:o.vx,vy:o.vy,dmg:o.dmg,pierce:o.pierce||0,chain:o.chain||0,chainMul:o.chainMul||.7,crit:!!o.crit,hit:new Set(),helper:!!o.helper,kind:o.kind||'psy',color:o.color||'#67e8f9',radius:o.radius||5,aoe:o.aoe||0,slow:o.slow||0,life:o.life||1800,travel:0,maxRange:Number(o.maxRange||s.attackRange||SURV_ATTACK_RANGE),homing:!!o.homing,target:o.target||null,impactField:o.impactField||null,onHit:o.onHit||''})}
function survShoot(s,originX=s.x,originY=s.y,helper=false){
  if(!s.enemies.length)return;const limit=Number(s.attackRange||SURV_ATTACK_RANGE),targets=s.enemies.slice().filter(e=>!e.dead&&Math.hypot(e.x-originX,e.y-originY)<=limit).sort((a,b)=>Math.hypot(a.x-originX,a.y-originY)-Math.hypot(b.x-originX,b.y-originY));if(!targets.length)return;
  const count=helper?1:s.multi,aim=targets[0]?Math.atan2(targets[0].y-originY,targets[0].x-originX):0;if(!helper){s.psyFacing=Math.cos(aim)<0?-1:1;survPsyAnimTrigger(s,'attack',410)}
  for(let k=0;k<count;k++){const t=targets[k%targets.length],a=Math.atan2(t.y-originY,t.x-originX)+(helper?0:(k-(count-1)/2)*.075);survBullet(s,{x:originX,y:originY,vx:Math.cos(a)*8.8,vy:Math.sin(a)*8.8,dmg:(helper?10:18)*s.power,pierce:helper?0:s.pierce,chain:0,chainMul:0,crit:Math.random()<s.crit,helper,kind:'psy',color:'#67e8f9',radius:helper?5:7,maxRange:limit})}
}
function survDamageEnemy(s,e,dmg,color,slow=0){if(!e||e.dead)return false;e.hp-=dmg;if(slow)e.slow=Math.max(e.slow,slow);if(survInView(s,e.x,e.y,80)&&((s.texts?.length||0)<Number(s.perf?.textCap||90)||e.boss))s.texts.push({x:e.x,y:e.y,text:`-${Math.max(1,Math.floor(dmg))}`,life:24,color:color||'#fff'});if(e.hp<=0&&!e.dead){e.dead=true;survKill(s,e);return true}return false}
function survAreaDamage(s,x,y,range,dmg,color,exclude=null,slow=0){for(const e of s.enemies){if(e.dead||e===exclude)continue;if(Math.hypot(e.x-x,e.y-y)<=range)survDamageEnemy(s,e,dmg,color,slow)}survFxPush(s,{type:'burst',x,y,r:8,max:range,life:22,color})}
function survHitArea(s,x,y,range,dmg,color,slow=0){for(const e of s.enemies){if(e.dead)continue;if(Math.hypot(e.x-x,e.y-y)<=range)survDamageEnemy(s,e,dmg,color,slow)}survFxPush(s,{type:'burst',x,y,r:8,max:range,life:22,color})}
function survFxPush(s,fx){
  s.effects=s.effects||[];if(Number.isFinite(fx?.x)&&Number.isFinite(fx?.y)&&!survInView(s,fx.x,fx.y,280))return;fx.life=Number(fx.life||18);fx.maxLife=Number(fx.maxLife||fx.life);fx.seed=Number(fx.seed||Math.random()*9999);s.effects.push(fx);const cap=Number(s.perf?.fxCap||260);if(s.effects.length>cap)s.effects.splice(0,s.effects.length-cap)
}
function survFxParticles(s,x,y,color,count=8,speed=3,size=4,life=18,gravity=0){
  const q=Number(s.perf?.vfxQuality||1),cap=Math.min(Number(s.perf?.particleCap||14),Math.max(1,Math.ceil(count*q)));for(let i=0;i<cap;i++){const a=Math.random()*Math.PI*2,v=speed*(.35+Math.random()*.8);survFxPush(s,{type:'particle',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,gravity,color,size:size*(.55+Math.random()*.8),life:life+Math.floor(Math.random()*7),drag:.93})}
}
function survFxLightning(s,x1,y1,x2,y2,color='#fde047',thick=5,life=12,power=1){survFxPush(s,{type:'lightning',x:x1,y:y1,x2,y2,color,thick,life,power,seed:Math.random()*9999})}
function survFxImpact(s,x,y,color='#fff',r=42,heavy=false){survFxPush(s,{type:'impact',x,y,r:5,max:r,life:heavy?24:17,color,heavy});survFxParticles(s,x,y,color,heavy?14:8,heavy?5:3.2,heavy?6:4,heavy?25:18,heavy?.10:.04);if(heavy)s.shake=Math.max(Number(s.shake||0),10)}
function survFxCast(s,x,y,color='#67e8f9',a=0){survFxPush(s,{type:'cast',x,y,a,color,r:12,max:46,life:13});for(let i=0;i<4;i++)survFxPush(s,{type:'petal',x,y,a:a+(i-1.5)*.42,color,life:12+i*2,len:22+i*4})}
function survNova(s){survPsyAnimTrigger(s,'special',500);const range=Math.min(s.attackRange,135+22*s.nova),dmg=18*s.power*(1+s.nova*.18);survHitArea(s,s.x,s.y,range,dmg,'#d8b4fe');survFxPush(s,{type:'nova',x:s.x,y:s.y,r:20,max:range,life:28,color:'#d8b4fe',color2:'#67e8f9'});survFxParticles(s,s.x,s.y,'#f0abfc',12,4.4,5,25,.02);s.shake=Math.max(Number(s.shake||0),3);if(s.novaMax)setTimeout(()=>{if(W.PSY_CLEAN_SURV===s&&!s.done){survHitArea(s,s.x,s.y,range,12*s.power,'#f0abfc');survFxPush(s,{type:'nova',x:s.x,y:s.y,r:16,max:range*.92,life:22,color:'#67e8f9',color2:'#f0abfc',reverse:true})}},180)}
function survVortex(s){if(!s.vortex)return;survPsyAnimTrigger(s,'special',500);const range=Math.min(s.attackRange,105+s.vortex*18),dmg=(9+s.vortex*4)*s.power;for(const e of s.enemies){if(e.dead)continue;const dx=s.x-e.x,dy=s.y-e.y,d=Math.hypot(dx,dy);if(d<range){survDamageEnemy(s,e,dmg,'#a78bfa');if(s.vortexMax&&d>12&&!e.dead){e.x+=dx/d*14;e.y+=dy/d*14}}}survFxPush(s,{type:'vortex',x:s.x,y:s.y,r:range,life:28,color:'#a78bfa',color2:'#22d3ee',maxed:!!s.vortexMax});survFxParticles(s,s.x,s.y,'#c084fc',8,3.6,4,20,-.01)}
function survPsyRain(s){if(!s.rain)return;survPsyAnimTrigger(s,'special',500);const live=survShuffle(survEnemiesNear(s,s.x,s.y,s.attackRange)).slice(0,Math.min(2+s.rain,7));for(const e of live){const dmg=(14+s.rain*3.5)*s.power;survFxLightning(s,e.x+(Math.random()-.5)*20,e.y-145,e.x,e.y,'#f0abfc',5,14,1.25);survFxPush(s,{type:'psyblade',x:e.x,y:e.y-52,x2:e.x,y2:e.y+10,color:'#67e8f9',life:15,w:16});survDamageEnemy(s,e,dmg,'#f0abfc');survFxImpact(s,e.x,e.y,'#c084fc',30,false);if(s.rainMax&&!e.dead){survDamageEnemy(s,e,dmg*.55,'#c084fc');survFxLightning(s,e.x-18,e.y-120,e.x+10,e.y,'#67e8f9',3,10,1)}}}
function helperRuntime(s,key){const h=SURV_HELPERS.find(x=>x.key===key);return{h,tree:null,dm:.5,rate:1,sp:0,lv:survHelperLv(s,key),maxed:survHelperMaxed(s,key)}}
function survAddField(s,f){s.fields=s.fields||[];s.fields.push(Object.assign({life:0,tickAcc:0,startDelay:0,hitSet:new Set()},f));const cap=Number(s.perf?.fieldCap||120);if(s.fields.length>cap){const ix=s.fields.findIndex(x=>!x.mega&&!x.giant&&Number(x.life||0)<700);if(ix>=0)s.fields.splice(ix,1);else s.fields.splice(0,s.fields.length-cap)}}
function survPointSegmentDistance(px,py,x1,y1,x2,y2){const vx=x2-x1,vy=y2-y1,wx=px-x1,wy=py-y1,c1=vx*wx+vy*wy,c2=vx*vx+vy*vy,t=c2?Math.max(0,Math.min(1,c1/c2)):0,x=x1+t*vx,y=y1+t*vy;return Math.hypot(px-x,py-y)}
function survHelperState(s,key,index=0){
  s.helperState=s.helperState||{};let h=s.helperState[key];
  if(!h){const n=Math.max(1,s.helperIds?.length||1),a=index*Math.PI*2/n,maxHp=Math.max(30,Number(s.maxHp||125)*.60);h=s.helperState[key]={x:s.x+Math.cos(a)*92,y:s.y+Math.sin(a)*92,hp:maxHp,maxHp,retreat:false,target:null};}
  const wanted=Math.max(30,Number(s.maxHp||125)*.60);if(Math.abs(wanted-h.maxHp)>1){const ratio=Math.max(.01,h.hp/Math.max(1,h.maxHp));h.maxHp=wanted;h.hp=Math.min(h.maxHp,h.maxHp*ratio)}return h
}
function survHelperPos(s,index){const key=s.helperIds?.[index],h=key?survHelperState(s,key,index):null;if(h)return{x:h.x,y:h.y};const n=Math.max(1,s.helperIds?.length||1),a=s.elapsed/780+index*Math.PI*2/n,rad=92;return{x:s.x+Math.cos(a)*rad,y:s.y+Math.sin(a)*rad}}
function survHealAllies(s,x,y,range,pct=.01){
  if(Math.hypot(s.x-x,s.y-y)<=range)s.hp=Math.min(s.maxHp,s.hp+s.maxHp*pct);
  for(let i=0;i<(s.helperIds?.length||0);i++){const key=s.helperIds[i],h=survHelperState(s,key,i);if(Math.hypot(h.x-x,h.y-y)<=range)h.hp=Math.min(h.maxHp,h.hp+h.maxHp*pct)}
}
function survBlisseyPulse(s,x,y,damage=0,sqm=3){const r=SURV_SQM*sqm;survHealAllies(s,x,y,r,.01);for(const e of s.enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy)||1;if(d<=r+e.size*.20){if(damage>0)survDamageEnemy(s,e,damage,'#f9a8d4');if(!e.dead){const push=26;e.x+=dx/d*push;e.y+=dy/d*push}}}survFxPush(s,{type:'heartBurst',x,y,r:12,max:r,life:24,color:'#f9a8d4'})}
function survBlisseySanctuary(s,h,now){
  if(!h)return;const r=SURV_SQM*6;h.sanctuaryUntil=now+5000;h.sanctuaryNext=now+10000;h.sanctuaryId=Number(h.sanctuaryId||0)+1;h.sanctuaryX=h.x;h.sanctuaryY=h.y;survFxPush(s,{type:'sanctuary',x:h.x,y:h.y,r,max:r,life:300,maxLife:300,color:'#f9a8d4'});
}
function survApplyBlisseySanctuary(s,dt){
  const now=Number(s.elapsed||0);for(let i=0;i<(s.helperIds?.length||0);i++){const key=s.helperIds[i];if(key!=='blissey'||!survHelperMaxed(s,key))continue;const h=survHelperState(s,key,i);if(!h.sanctuaryNext||now>=h.sanctuaryNext)survBlisseySanctuary(s,h,now);if(now>=Number(h.sanctuaryUntil||0))continue;const x=Number(h.sanctuaryX||h.x),y=Number(h.sanctuaryY||h.y),r=SURV_SQM*6;if(Math.hypot(s.x-x,s.y-y)<=r){s.blisseyRegenUntil=Math.max(Number(s.blisseyRegenUntil||0),now+5000);if(h.playerShieldSanctuaryId!==h.sanctuaryId){h.playerShieldSanctuaryId=h.sanctuaryId;s.blisseyShield=Math.max(Number(s.blisseyShield||0),s.maxHp*.05);s.blisseyShieldUntil=now+10000}}for(let j=0;j<(s.helperIds?.length||0);j++){const hk=s.helperIds[j],a=survHelperState(s,hk,j);if(Math.hypot(a.x-x,a.y-y)<=r){a.blisseyRegenUntil=Math.max(Number(a.blisseyRegenUntil||0),now+5000);if(a.blisseyShieldSanctuaryId!==h.sanctuaryId){a.blisseyShieldSanctuaryId=h.sanctuaryId;a.blisseyShield=Math.max(Number(a.blisseyShield||0),a.maxHp*.05);a.blisseyShieldUntil=now+10000}}}for(const e of s.enemies){if(e.dead)continue;const dx=e.x-x,dy=e.y-y,d=Math.hypot(dx,dy)||1;if(d<=r+e.size*.2){survDamageEnemy(s,e,(2.2*s.power)*dt/1000,'#f9a8d4');if(!e.dead&&d>4){e.x-=dx/d*.28*dt/16;e.y-=dy/d*.28*dt/16}}}}
  if(now<Number(s.blisseyRegenUntil||0))s.hp=Math.min(s.maxHp,s.hp+s.maxHp*.01*dt/1000);if(now>=Number(s.blisseyShieldUntil||0))s.blisseyShield=0;for(let i=0;i<(s.helperIds?.length||0);i++){const h=survHelperState(s,s.helperIds[i],i);if(now<Number(h.blisseyRegenUntil||0))h.hp=Math.min(h.maxHp,h.hp+h.maxHp*.01*dt/1000);if(now>=Number(h.blisseyShieldUntil||0))h.blisseyShield=0}
}
function survHurtPlayer(s,dmg){let left=Math.max(0,Number(dmg||0)),now=Number(s.elapsed||0);if(now<Number(s.blisseyShieldUntil||0)&&Number(s.blisseyShield||0)>0){const take=Math.min(left,s.blisseyShield);s.blisseyShield-=take;left-=take}if(left>0){s.hp-=left;survPsyAnimTrigger(s,s.hp<=0?'defeat':'hurt',s.hp<=0?700:420)}return s.hp<=0}

function survUpdateHelperAI(s,dt,key,index){
  const h=survHelperState(s,key,index),maxDist=SURV_SQM*6,low=.25,ready=.50,dxP=s.x-h.x,dyP=s.y-h.y,dP=Math.hypot(dxP,dyP)||1;
  if(!h.retreat&&h.hp<=h.maxHp*low)h.retreat=true;
  if(h.retreat){const sp=7.2;if(dP>46){h.x+=dxP/dP*sp*dt/16;h.y+=dyP/dP*sp*dt/16}else h.hp=Math.min(h.maxHp,h.hp+h.maxHp*.035*dt/1000);if(h.hp>=h.maxHp*ready)h.retreat=false;h.target=null;return h}
  let t=h.target;if(!t||t.dead||Math.hypot(t.x-s.x,t.y-s.y)>maxDist)t=survNearestEnemy(s,h.x,h.y,null,maxDist+SURV_SQM*2);h.target=t||null;
  let tx,ty;if(t&&Math.hypot(t.x-s.x,t.y-s.y)<=maxDist){const dd=Math.hypot(t.x-h.x,t.y-h.y)||1,desired=72;tx=t.x-(t.x-h.x)/dd*desired;ty=t.y-(t.y-h.y)/dd*desired}else{const n=Math.max(1,s.helperIds?.length||1),a=s.elapsed/1050+index*Math.PI*2/n;tx=s.x+Math.cos(a)*96;ty=s.y+Math.sin(a)*96}
  let mx=tx-h.x,my=ty-h.y,md=Math.hypot(mx,my)||1,sp=5.3;if(md>8){h.x+=mx/md*sp*dt/16;h.y+=my/md*sp*dt/16}
  let pdx=h.x-s.x,pdy=h.y-s.y,pd=Math.hypot(pdx,pdy)||1;if(pd>maxDist){h.x=s.x+pdx/pd*maxDist;h.y=s.y+pdy/pd*maxDist}
  h.x=Math.max(35,Math.min(s.worldW-35,h.x));h.y=Math.max(35,Math.min(s.worldH-35,h.y));return h
}
function survHelperAttack(s,key,hx,hy){
  const R=helperRuntime(s,key),lv=Math.max(1,Math.min(5,R.lv||1)),maxed=R.maxed,limit=Number(s.attackRange||SURV_ATTACK_RANGE),targets=survEnemiesNear(s,hx,hy,limit);if(!R.h||!targets.length)return;
  const dm=R.dm*(1+R.sp*.04),rajada=Math.max(0,survRunUpLv(s,'multi')),randomTargets=()=>survShuffle(targets.slice());
  survFxPush(s,{type:'helperAura',x:hx,y:hy,color:R.h.color,life:16,r:18,max:42,helper:key});
  if(key==='pikachu'){
    const counts=[0,3,5,7,10,15],count=counts[lv]+rajada,pool=randomTargets(),dmg=16*s.power*dm*(maxed?1.55:1),aoe=maxed?SURV_SQM:0;
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length],sx=t.x+(Math.random()-.5)*28,sy=t.y-(155+Math.random()*55);survFxLightning(s,sx,sy,t.x,t.y,'#fde047',maxed?8:5,16,maxed?1.7:1.15);survFxPush(s,{type:'thunderSeal',x:t.x,y:t.y,r:10,max:maxed?48:34,life:18,color:'#facc15'});survDamageEnemy(s,t,dmg,'#fde047');survFxParticles(s,t.x,t.y,'#fff7ae',maxed?10:6,maxed?5:3.5,maxed?5:3,20,.04);if(aoe)survAreaDamage(s,t.x,t.y,aoe,dmg*.55,'#facc15',t)}
  }else if(key==='lapras'){
    const count=lv+rajada,pool=randomTargets(),range=Math.min(limit,240+lv*28+(maxed?55:0)),width=.20+lv*.018+(maxed?.10:0),slow=.24+lv*.055+(maxed?.16:0),dmg=(11+lv*2.4)*s.power*dm;
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length],a=Math.atan2(t.y-hy,t.x-hx);for(const e of s.enemies){if(e.dead)continue;const ex=e.x-hx,ey=e.y-hy,d=Math.hypot(ex,ey),ang=Math.abs(Math.atan2(Math.sin(Math.atan2(ey,ex)-a),Math.cos(Math.atan2(ey,ex)-a)));if(d<=range&&ang<=width)survDamageEnemy(s,e,dmg,'#67e8f9',slow)}survFxPush(s,{type:'iceCone',x:hx,y:hy,a,range,width,life:22,color:'#67e8f9',maxed});for(let q=0;q<5;q++){const rr=range*(.35+Math.random()*.6),aa=a+(Math.random()*2-1)*width*.9;survFxPush(s,{type:'iceShard',x:hx+Math.cos(aa)*rr,y:hy+Math.sin(aa)*rr,a:aa,color:'#dbeafe',life:14+q*2,size:maxed?10:7})}}
  }else if(key==='charizard'){
    const counts=[0,1,2,4,6,10],count=counts[lv]+rajada,pool=randomTargets(),rad=SURV_SQM*2,dmg=(18+lv*2)*s.power*dm;
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length];survAddField(s,{kind:'meteor',x:t.x,y:t.y,startDelay:300+Math.random()*160,radius:rad,dmg,color:'#fb923c',giant:false,trail:true})}survFxPush(s,{type:'flameWing',x:hx,y:hy,a:Math.atan2(pool[0].y-hy,pool[0].x-hx),color:'#fb923c',life:19,maxed})
  }else if(key==='slowpoke'){
    const count=lv+rajada,pool=randomTargets(),len=Math.min(limit,270+lv*25+(maxed?25:0)),width=18+lv*3+(maxed?8:0),dmg=(6.5+lv*1.45)*s.power*dm;
    const makeSalvo=delay=>{for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length],a=Math.atan2(t.y-hy,t.x-hx);survAddField(s,{kind:'waterjet',x:hx,y:hy,a,length:len,width,dmg,color:'#60a5fa',life:2000,startDelay:delay,tickEvery:300,maxed})}};makeSalvo(0);if(maxed)makeSalvo(420);survFxPush(s,{type:'waterCast',x:hx,y:hy,color:'#60a5fa',life:20,r:18,max:50})
  }else if(key==='gengar'){
    const count=lv+rajada,pool=randomTargets(),rad=SURV_SQM*2,dmg=(6+lv*1.7)*s.power*dm;
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length];survAddField(s,{kind:'blackhole',x:t.x,y:t.y,radius:rad,dmg,color:'#c084fc',life:1800,tickEvery:300,impact:(14+lv*2)*s.power*dm,maxPull:0,magnet:false,maxed})}survFxPush(s,{type:'shadowClaw',x:hx,y:hy,a:Math.atan2(pool[0].y-hy,pool[0].x-hx),color:'#c084fc',life:17})
  }else if(key==='dragonite'){
    const count=(maxed?10:lv)+rajada,pool=randomTargets(),dmg=(17+lv*2.1)*s.power*dm;
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length],a=Math.atan2(t.y-hy,t.x-hx),spd=maxed?7.2:6.6;survBullet(s,{x:hx,y:hy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,pierce:maxed?6:0,helper:true,kind:'tornado',color:'#a78bfa',radius:maxed?15:10,aoe:SURV_SQM*3,life:2600,maxRange:limit,homing:true,target:t,impactField:maxed?{kind:'tornadozone',radius:SURV_SQM*2,life:2000,tickEvery:300,dmg:dmg*.38,color:'#c4b5fd'}:null})}survFxPush(s,{type:'windCast',x:hx,y:hy,color:'#c4b5fd',life:20,r:16,max:55,maxed})
  }else if(key==='blissey'){
    const hs=s.helperIds?.includes(key)?survHelperState(s,key,s.helperIds.indexOf(key)):null,inSanct=maxed&&hs&&Number(s.elapsed||0)<Number(hs.sanctuaryUntil||0),count=(inSanct?10:lv)+rajada,pool=randomTargets(),dmg=(15+lv*2.0)*s.power*dm*1.50;survBlisseyPulse(s,hx,hy,dmg*.35);
    for(let i=0;i<count&&pool.length;i++){const t=pool[i%pool.length],a=Math.atan2(t.y-hy,t.x-hx),spd=6.4;survBullet(s,{x:hx,y:hy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,helper:true,kind:'heart',color:'#f9a8d4',radius:inSanct?18:maxed?13:9,life:2700,maxRange:limit,homing:true,target:t,onHit:inSanct?'blisseyHeartMax':'blisseyHeart'})}survFxPush(s,{type:'heartBurst',x:hx,y:hy,r:10,max:SURV_SQM*3,life:22,color:'#f9a8d4'})
  }
}
function survUpdateHelpers(s,dt){
  if(!s.helperIds?.length)return;s.helperTimers=s.helperTimers||{};s.helperSpecialTimers=s.helperSpecialTimers||{};
  const base={pikachu:1550,charizard:2100,slowpoke:2350,gengar:2200,lapras:1800,dragonite:1650,blissey:1750};
  for(let i=0;i<s.helperIds.length;i++){
    const key=s.helperIds[i],R=helperRuntime(s,key);survUpdateHelperAI(s,dt,key,i);const pos=survHelperPos(s,i);if(!R.lv)continue;
    s.helperTimers[key]=Number(s.helperTimers[key]||0)+dt;if(s.helperTimers[key]>=base[key]*R.rate){s.helperTimers[key]=0;survHelperAttack(s,key,pos.x,pos.y)}
    if(R.maxed&&key==='charizard'){s.helperSpecialTimers.charizard=Number(s.helperSpecialTimers.charizard||0)+dt;if(s.helperSpecialTimers.charizard>=5000){s.helperSpecialTimers.charizard=0;const live=survShuffle(survEnemiesNear(s,pos.x,pos.y,s.attackRange));for(let j=0;j<3&&live.length;j++){const t=live[j%live.length];survAddField(s,{kind:'meteor',x:t.x,y:t.y,startDelay:480+j*90,radius:SURV_SQM*10,dmg:34*s.power*R.dm,color:'#f97316',giant:true,trail:true});survFxPush(s,{type:'meteorWarning',x:t.x,y:t.y,r:18,max:SURV_SQM*10,life:28,color:'#fb923c'})}}}
    if(R.maxed&&key==='gengar'){s.helperSpecialTimers.gengar=Number(s.helperSpecialTimers.gengar||0)+dt;if(s.helperSpecialTimers.gengar>=10000){s.helperSpecialTimers.gengar=0;const t=survNearestEnemy(s,pos.x,pos.y,null,s.attackRange);const gx=t?.x??s.x,gy=t?.y??s.y;survAddField(s,{kind:'blackhole',x:gx,y:gy,radius:SURV_SQM*10,dmg:10*s.power*R.dm,color:'#7e22ce',life:3500,tickEvery:300,impact:24*s.power*R.dm,maxPull:10,magnet:true,mega:true});survFxPush(s,{type:'voidOpen',x:gx,y:gy,r:12,max:SURV_SQM*10,life:34,color:'#a855f7'})}}
  }
}
function survUpdateFields(s,dt){
  s.fields=s.fields||[];
  for(const f of s.fields){if(f.dead)continue;if(f.startDelay>0){f.startDelay-=dt;continue}
    if(f.kind==='meteor'){survHitArea(s,f.x,f.y,f.radius,f.dmg,f.color);survFxPush(s,{type:'meteorStrike',x:f.x,y:f.y,life:f.giant?28:20,color:f.color,giant:!!f.giant,radius:f.radius});survFxImpact(s,f.x,f.y,f.color,Math.min(f.radius,f.giant?180:95),!!f.giant);survFxParticles(s,f.x,f.y,'#fde68a',f.giant?18:10,f.giant?8:5,f.giant?8:5,f.giant?30:22,.16);f.dead=true;continue}
    f.life-=dt;f.tickAcc=Number(f.tickAcc||0)+dt;
    if(f.kind==='blackhole'){
      if(!f.started){f.started=true;survFxImpact(s,f.x,f.y,f.color,Math.min(f.radius,90),!!f.mega)}
      if(f.maxPull){const near=survEnemiesNear(s,f.x,f.y,f.radius).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y)).slice(0,f.maxPull);for(const e of near){const dx=f.x-e.x,dy=f.y-e.y,d=Math.hypot(dx,dy)||1;e.x+=dx/d*Math.min(14,dt*.34);e.y+=dy/d*Math.min(14,dt*.34)}}
      if(f.magnet){for(const p of s.pickups){if(!p.dead&&Math.hypot(p.x-f.x,p.y-f.y)<=f.radius){p.gengarPull=true;p.gengarPullLife=Math.max(Number(p.gengarPullLife||0),4200)}}}
    }
    const every=Number(f.tickEvery||300);while(f.tickAcc>=every){f.tickAcc-=every;
      if(f.kind==='waterjet'){const x2=f.x+Math.cos(f.a)*f.length,y2=f.y+Math.sin(f.a)*f.length;for(const e of s.enemies){if(e.dead||f.hitSet.has(e))continue;if(survPointSegmentDistance(e.x,e.y,f.x,f.y,x2,y2)<=f.width+e.size*.18){f.hitSet.add(e);survDamageEnemy(s,e,f.dmg,f.color,.08)}}if(Math.random()<.65){const rr=Math.random()*f.length;survFxPush(s,{type:'bubble',x:f.x+Math.cos(f.a)*rr+(Math.random()-.5)*f.width,y:f.y+Math.sin(f.a)*rr+(Math.random()-.5)*f.width,vx:(Math.random()-.5)*.5,vy:-.5-Math.random(),color:'#bae6fd',life:15,size:3+Math.random()*4})}}
      else if(f.kind==='blackhole'){for(const e of s.enemies){if(e.dead||f.hitSet.has(e))continue;if(Math.hypot(e.x-f.x,e.y-f.y)<=f.radius){f.hitSet.add(e);survDamageEnemy(s,e,Number(f.impact||f.dmg),f.color)}}}
      else if(f.kind==='tornadozone'){for(const e of s.enemies){if(e.dead||f.hitSet.has(e))continue;if(Math.hypot(e.x-f.x,e.y-f.y)<=f.radius){f.hitSet.add(e);survDamageEnemy(s,e,f.dmg,f.color)}}}
    }
    if(f.life<=0)f.dead=true
  }
  s.fields=s.fields.filter(f=>!f.dead);s.pickups=s.pickups.filter(p=>!p.dead);survRunLevel(s)
}
function survOrbitTick(s,dt){if(!s.orbit)return;s.orbitAcc+=dt;if(s.orbitAcc<110)return;s.orbitAcc=0;const count=Math.min(8,1+s.orbit+(s.orbitMax?2:0)),rad=58+s.orbit*7+(s.orbitMax?18:0);for(const e of s.enemies){if(e.dead)continue;e.orbitCd=Math.max(0,Number(e.orbitCd||0)-110);if(e.orbitCd>0)continue;for(let i=0;i<count;i++){const a=s.elapsed/520+i*Math.PI*2/count,ox=s.x+Math.cos(a)*rad,oy=s.y+Math.sin(a)*rad;if(Math.hypot(e.x-ox,e.y-oy)<e.size*.35+12){e.orbitCd=260;const dmg=(7+s.orbit*2.5)*s.power;e.hp-=dmg;s.effects.push({type:'burst',x:ox,y:oy,r:3,max:20,life:10,color:'#60a5fa'});if(e.hp<=0){e.dead=true;survKill(s,e)}break}}}}
function survDraw(s){
  const ctx=s.ctx,viewW=Number(s.viewW||s.c.width),viewH=Number(s.viewH||s.c.height),worldW=Number(s.worldW||s.w),worldH=Number(s.worldH||s.h);
  const targetX=Math.max(0,Math.min(Math.max(0,worldW-viewW),s.x-viewW/2)),targetY=Math.max(0,Math.min(Math.max(0,worldH-viewH),s.y-viewH/2));
  if(!Number.isFinite(s.camX))s.camX=targetX;if(!Number.isFinite(s.camY))s.camY=targetY;s.camX+=(targetX-s.camX)*.28;s.camY+=(targetY-s.camY)*.28;
  const shake=Math.max(0,Number(s.shake||0)),shakeX=shake?(Math.random()-.5)*shake:0,shakeY=shake?(Math.random()-.5)*shake:0;s.shake=shake*.82;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,viewW,viewH);const bg=['#064e3b','#083344','#3f1d2e','#312e81','#1f2937'][(Math.floor((s.phase-1)/20))%5];ctx.fillStyle=bg;ctx.fillRect(0,0,viewW,viewH);
  if(!s._vignette||s._vignette.w!==viewW||s._vignette.h!==viewH){const g=ctx.createRadialGradient(viewW*.5,viewH*.5,Math.min(viewW,viewH)*.12,viewW*.5,viewH*.5,Math.max(viewW,viewH)*.72);g.addColorStop(0,'#ffffff05');g.addColorStop(.72,'#00000005');g.addColorStop(1,'#00000055');s._vignette={w:viewW,h:viewH,g}}ctx.fillStyle=s._vignette.g;ctx.fillRect(0,0,viewW,viewH);
  ctx.save();ctx.translate(-s.camX+shakeX,-s.camY+shakeY);ctx.fillStyle='#ffffff0d';const gx0=Math.floor(s.camX/170)-1,gx1=Math.ceil((s.camX+viewW)/170)+1,gy0=Math.floor(s.camY/125)-1,gy1=Math.ceil((s.camY+viewH)/125)+1;for(let gy=gy0;gy<=gy1;gy++)for(let gx=gx0;gx<=gx1;gx++){const px=gx*170+((gy*53)%90),py=gy*125+((gx*37)%65),rw=20+((gx+gy)&3)*7,rh=11+((gx*3+gy)&2)*5;ctx.beginPath();ctx.ellipse(px,py,rw,rh,0,0,Math.PI*2);ctx.fill()}
  /* boss floor telegraphs */
  for(const h of s.bossHazards||[]){
    if(h.dead||!survInView(s,h.x,h.y,Math.min(800,Number(h.len||h.r||120)+120)))continue;const warning=h.delay>0,pulse=.72+.28*Math.sin(s.elapsed/75);ctx.save();ctx.lineCap='round';
    if(h.kind==='bossMeteor'||h.kind==='bossTrap'){
      const r=Number(h.r||52),pct=warning?1-Math.max(0,h.delay)/Math.max(1,h.maxDelay):1;ctx.globalAlpha=warning?.15+.16*pulse:.18;ctx.fillStyle='#ef4444';ctx.beginPath();ctx.arc(h.x,h.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=warning?.9:.68;ctx.strokeStyle=warning?'#ff3131':'#991b1b';ctx.lineWidth=warning?4:3;ctx.setLineDash(warning?[10,7]:[4,5]);ctx.beginPath();ctx.arc(h.x,h.y,r*(warning?.86+.14*pct:1),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);if(warning){ctx.globalAlpha=.72;ctx.strokeStyle='#fecaca';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(h.x-r*.5,h.y);ctx.lineTo(h.x+r*.5,h.y);ctx.moveTo(h.x,h.y-r*.5);ctx.lineTo(h.x,h.y+r*.5);ctx.stroke()}else if(h.kind==='bossTrap'){for(let q=0;q<6;q++){const a=q*Math.PI/3+s.elapsed/260;ctx.strokeStyle='#f87171';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(h.x+Math.cos(a)*r*.35,h.y+Math.sin(a)*r*.35);ctx.lineTo(h.x+Math.cos(a)*r*.82,h.y+Math.sin(a)*r*.82);ctx.stroke()}}
    }else if(h.kind==='bossVolley'||h.kind==='bossCharge'){
      const a=Number(h.a||0),len=Number(h.len||500),w=Number(h.width||24),x2=h.x+Math.cos(a)*len,y2=h.y+Math.sin(a)*len,px=-Math.sin(a)*w,py=Math.cos(a)*w;ctx.globalAlpha=.13+.08*pulse;ctx.fillStyle='#ef4444';ctx.beginPath();ctx.moveTo(h.x+px,h.y+py);ctx.lineTo(x2+px,y2+py);ctx.lineTo(x2-px,y2-py);ctx.lineTo(h.x-px,h.y-py);ctx.closePath();ctx.fill();ctx.globalAlpha=.86;ctx.strokeStyle='#ff3131';ctx.lineWidth=h.kind==='bossCharge'?5:3;ctx.setLineDash([12,8]);ctx.stroke();ctx.setLineDash([]);if(h.kind==='bossVolley'){for(let q=-1;q<=1;q++){const aa=a+q*.12;ctx.globalAlpha=.48;ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.lineTo(h.x+Math.cos(aa)*len,h.y+Math.sin(aa)*len);ctx.stroke()}}
    }
    ctx.restore()
  }
  for(const p of s.pickups){if(!survInView(s,p.x,p.y,80))continue;if(p.visual==='epic'){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='30px sans-serif';ctx.shadowColor='#fde047';ctx.shadowBlur=14;ctx.fillText('🎁',p.x,p.y);ctx.restore();continue}if(p.visual==='rare'){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 28px sans-serif';ctx.fillStyle='#fde047';ctx.shadowColor='#f59e0b';ctx.shadowBlur=12;ctx.fillText('★',p.x,p.y);ctx.restore();continue}const col=p.type==='heal'?'#22c55e':'#38bdf8';ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=Number(s.perf?.vfxQuality||1)>.7?7:3;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(p.type==='heal'?'+':'•',p.x,p.y+3);ctx.textAlign='left'}
  for(const f of s.fields||[]){
    if(!survInView(s,f.x,f.y,Math.min(260,Number(f.radius||120)+80)))continue;
    if(f.kind==='meteor'){
      const warn=Math.max(0,Number(f.startDelay||0)),pulse=.72+.28*Math.sin(s.elapsed/80);ctx.globalAlpha=.18+.18*pulse;ctx.fillStyle='#fb923c';ctx.beginPath();ctx.arc(f.x,f.y,Math.min(f.radius,80)*pulse,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle='#fde68a';ctx.lineWidth=f.giant?5:2;ctx.beginPath();ctx.arc(f.x,f.y,Math.min(f.radius,f.giant?180:95),0,Math.PI*2);ctx.stroke();if(warn>0){const h=f.giant?260:180;const grad=ctx.createLinearGradient(f.x,f.y-h,f.x,f.y);grad.addColorStop(0,'#fff7ed00');grad.addColorStop(.35,'#fdba74aa');grad.addColorStop(1,'#f97316');ctx.strokeStyle=grad;ctx.lineWidth=f.giant?18:10;ctx.beginPath();ctx.moveTo(f.x+35,f.y-h);ctx.lineTo(f.x,f.y);ctx.stroke()}ctx.globalAlpha=1;continue
    }
    if(f.startDelay>0)continue;
    if(f.kind==='waterjet'){
      const x2=f.x+Math.cos(f.a)*f.length,y2=f.y+Math.sin(f.a)*f.length,perpX=-Math.sin(f.a),perpY=Math.cos(f.a),phase=s.elapsed/85;ctx.lineCap='round';for(let layer=0;layer<3;layer++){ctx.beginPath();for(let q=0;q<=14;q++){const t=q/14,amp=(f.width*(.34-layer*.07))*Math.sin(phase+t*16+layer*1.7),xx=f.x+(x2-f.x)*t+perpX*amp,yy=f.y+(y2-f.y)*t+perpY*amp;if(q===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.strokeStyle=layer===0?'#0ea5e9':layer===1?'#7dd3fc':'#e0f2fe';ctx.globalAlpha=layer===0?.28:layer===1?.58:.9;ctx.lineWidth=Math.max(3,f.width*(1.35-layer*.42));ctx.stroke()}ctx.globalAlpha=1;ctx.lineCap='butt'
    }else if(f.kind==='blackhole'){
      const pulse=.84+.16*Math.sin(s.elapsed/100),core=Math.min(f.radius*(f.mega?.32:.40),135),g=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,Math.max(core,20));g.addColorStop(0,'#000');g.addColorStop(.4,'#020617');g.addColorStop(.72,f.mega?'#581c87':'#3b0764');g.addColorStop(1,'#c084fc00');ctx.fillStyle=g;ctx.globalAlpha=.96;ctx.beginPath();ctx.arc(f.x,f.y,core*pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=f.mega?6:3;for(let k=0;k<4;k++){ctx.globalAlpha=.72-k*.12;ctx.beginPath();ctx.arc(f.x,f.y,core*(.55+k*.22),s.elapsed/(150-k*12)+k,s.elapsed/(150-k*12)+k+Math.PI*(1.1+k*.11));ctx.stroke()}ctx.globalAlpha=.11;ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(f.x,f.y,Math.min(f.radius,420),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
    }else if(f.kind==='tornadozone'){
      ctx.strokeStyle=f.color;ctx.shadowColor=f.color;ctx.shadowBlur=14;ctx.lineCap='round';for(let k=0;k<5;k++){ctx.globalAlpha=.74-k*.09;ctx.lineWidth=Math.max(2,7-k);ctx.beginPath();ctx.arc(f.x,f.y,Math.max(10,f.radius*(.18+k*.15)),s.elapsed/120+k*.8,s.elapsed/120+k*.8+Math.PI*1.55);ctx.stroke()}ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.lineCap='butt'
    }
  }
  for(const e of s.enemies){if(!survInView(s,e.x,e.y,e.size+90))continue;const im=survEnemySprite(s,e);if(e.shiny||e.mega){ctx.strokeStyle=e.mega?'#c084fc':'#fde047';ctx.lineWidth=e.mega?5:3;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(e.x,e.y,e.size*.58+(e.mega?7:3),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}if(e.champion){ctx.strokeStyle='#fb7185';ctx.lineWidth=3;ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(e.x,e.y,e.size*.56,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}if(e.ranged&&!e.boss){ctx.fillStyle='#f59e0b';ctx.globalAlpha=.9;ctx.beginPath();ctx.arc(e.x+e.size*.32,e.y-e.size*.32,5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}if(im.complete&&im.naturalWidth)ctx.drawImage(im,e.x-e.size/2,e.y-e.size/2,e.size,e.size);if(e.boss||e.elite){ctx.fillStyle='#0f172a';ctx.fillRect(e.x-e.size/2,e.y-e.size/2-12,e.size,7);ctx.fillStyle=e.finalBoss?'#f43f5e':e.boss?'#ef4444':e.champion?'#fb7185':'#facc15';ctx.fillRect(e.x-e.size/2,e.y-e.size/2-12,e.size*Math.max(0,e.hp/e.max),7);if(e.finalBoss){ctx.fillStyle='#fde047';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('CHEFE FINAL',e.x,e.y-e.size/2-18);ctx.textAlign='left'}}}
  for(const b of s.enemyBullets){if(!survInView(s,b.x,b.y,50))continue;ctx.fillStyle=b.color||'#fb7185';ctx.shadowColor=b.color||'#fb7185';ctx.shadowBlur=b.bossSpecial?16:8;if(b.bossSpecial){const sp=Math.max(.1,Math.hypot(b.vx,b.vy)),ux=b.vx/sp,uy=b.vy/sp;ctx.strokeStyle='#ef4444';ctx.globalAlpha=.35;ctx.lineWidth=(b.radius||7)*1.35;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-ux*34,b.y-uy*34);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;ctx.lineCap='butt'}ctx.beginPath();ctx.arc(b.x,b.y,b.radius||5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
  for(const b of s.bullets){
    if(!survInView(s,b.x,b.y,70))continue;const col=b.color||'#67e8f9',spd=Math.max(.01,Math.hypot(b.vx,b.vy)),ux=b.vx/spd,uy=b.vy/spd;ctx.save();ctx.shadowColor=col;ctx.shadowBlur=b.kind==='tornado'?20:15;
    if(b.kind==='heart'){ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);ctx.fillStyle='#f9a8d4';ctx.globalAlpha=.95;ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-15,-3,-10,-16,0,-8);ctx.bezierCurveTo(10,-16,15,-3,0,8);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore();continue}if(b.kind==='tornado'){ctx.translate(b.x,b.y);ctx.rotate(s.elapsed/160);ctx.strokeStyle='#e0e7ff';ctx.lineCap='round';for(let j=0;j<4;j++){ctx.globalAlpha=.85-j*.13;ctx.lineWidth=Math.max(2,6-j);ctx.beginPath();ctx.arc(0,0,(b.radius||10)*(1+j*.45),j*.7,j*.7+Math.PI*1.45);ctx.stroke()}ctx.globalAlpha=1;ctx.restore();continue}
    ctx.strokeStyle=col;ctx.globalAlpha=.36;ctx.lineWidth=(b.radius||5)*1.45;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-ux*34,b.y-uy*34);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=1;const rg=ctx.createRadialGradient(b.x,b.y,1,b.x,b.y,(b.radius||5)*2.2);rg.addColorStop(0,'#fff');rg.addColorStop(.25,col);rg.addColorStop(1,col+'00');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(b.x,b.y,(b.radius||5)*2.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,Math.max(2,(b.radius||5)*.42),0,Math.PI*2);ctx.fill();ctx.restore()
  }
  if(s.orbit){const count=Math.min(8,1+s.orbit+(s.orbitMax?2:0)),rad=72+s.orbit*8+(s.orbitMax?20:0);for(let i=0;i<count;i++){const a=s.elapsed/520+i*Math.PI*2/count,ox=s.x+Math.cos(a)*rad,oy=s.y+Math.sin(a)*rad;ctx.strokeStyle='#bae6fd';ctx.globalAlpha=.32;ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,s.y,rad,Math.max(0,a-.55),a);ctx.stroke();ctx.globalAlpha=1;const og=ctx.createRadialGradient(ox-2,oy-2,1,ox,oy,13);og.addColorStop(0,'#fff');og.addColorStop(.3,'#7dd3fc');og.addColorStop(1,'#0284c700');ctx.fillStyle=og;ctx.shadowColor='#38bdf8';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ox,oy,13,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}}
  for(let h=0;h<(s.helperIds?.length||0);h++){const key=s.helperIds[h],vis=survHelperVisual(s,key),def=vis?.def;if(!def)continue;const pos=survHelperPos(s,h),hs=survHelperState(s,key,h),im=survEnemySprite(s,vis),pulse=.72+.28*Math.sin(s.elapsed/170+h),blisseyScale=key==='blissey'?(vis.maxed?3:(vis.lv>=5?2:1)):1,sz=60*blisseyScale,aura=key==='blissey'&&vis.maxed?88:key==='blissey'&&vis.lv>=5?58:39;ctx.strokeStyle=vis.maxed?'#f472b6':vis.mega?'#c084fc':vis.shiny?'#fde047':def.color;ctx.globalAlpha=.32;ctx.lineWidth=vis.maxed?4:vis.mega?3:2;ctx.beginPath();ctx.arc(pos.x,pos.y,aura+5*pulse,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=.10;ctx.fillStyle=def.color;ctx.beginPath();ctx.arc(pos.x,pos.y,aura-3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(im.complete&&im.naturalWidth){ctx.shadowColor=vis.maxed?'#f472b6':vis.mega?'#c084fc':vis.shiny?'#fde047':def.color;ctx.shadowBlur=vis.maxed?18:vis.mega?14:10;ctx.save();if(vis.shiny&&!vis.mega&&Number(vis.id)===94)ctx.filter='brightness(0.42) saturate(0.72) contrast(1.45)';ctx.drawImage(im,pos.x-sz/2,pos.y-sz/2,sz,sz);ctx.restore();ctx.shadowBlur=0}const bw=Math.max(42,Math.min(90,sz*.65)),by=pos.y+sz*.34;ctx.fillStyle='#0f172a';ctx.fillRect(pos.x-bw/2,by,bw,5);ctx.fillStyle=hs.retreat?'#facc15':'#22c55e';ctx.fillRect(pos.x-bw/2,by,bw*Math.max(0,Math.min(1,hs.hp/Math.max(1,hs.maxHp))),5)}
  for(const fx of s.effects){
    if(!survInView(s,fx.x,fx.y,220))continue;const life=Math.max(0,fx.life/Math.max(1,fx.maxLife||fx.life||1));ctx.save();ctx.globalAlpha=Math.min(1,.18+life*.82);ctx.strokeStyle=fx.color||'#fff';ctx.fillStyle=fx.color||'#fff';ctx.shadowColor=fx.color||'#fff';ctx.shadowBlur=10;
    if(fx.type==='particle'||fx.type==='bubble'){ctx.globalAlpha=Math.min(.95,life);ctx.beginPath();ctx.arc(fx.x,fx.y,Math.max(1,Number(fx.size||4)*(.45+life*.55)),0,Math.PI*2);ctx.fill();if(fx.type==='bubble'){ctx.strokeStyle='#e0f2fe';ctx.globalAlpha*=.75;ctx.stroke()}}
    else if(fx.type==='burst'||fx.type==='impact'){ctx.lineWidth=fx.heavy?6:3;ctx.beginPath();ctx.arc(fx.x,fx.y,Math.max(2,fx.r||8),0,Math.PI*2);ctx.stroke();if(fx.type==='impact'){ctx.globalAlpha*=.20;ctx.fill();for(let q=0;q<6;q++){const a=q*Math.PI/3+fx.seed,rr=(fx.r||12)*.72;ctx.globalAlpha=.55*life;ctx.beginPath();ctx.moveTo(fx.x+Math.cos(a)*rr*.45,fx.y+Math.sin(a)*rr*.45);ctx.lineTo(fx.x+Math.cos(a)*rr,fx.y+Math.sin(a)*rr);ctx.stroke()}}}
    else if(fx.type==='lightning'){const seg=8,dx=(fx.x2-fx.x)/seg,dy=(fx.y2-fx.y)/seg,nx=-(fx.y2-fx.y),ny=(fx.x2-fx.x),nl=Math.hypot(nx,ny)||1;ctx.lineCap='round';for(let glow=0;glow<2;glow++){ctx.beginPath();ctx.moveTo(fx.x,fx.y);for(let j=1;j<seg;j++){const jitter=Math.sin(fx.seed+j*8.13)*11*(j/seg)*(1-j/seg)*Number(fx.power||1),xx=fx.x+dx*j+nx/nl*jitter,yy=fx.y+dy*j+ny/nl*jitter;ctx.lineTo(xx,yy)}ctx.lineTo(fx.x2,fx.y2);ctx.strokeStyle=glow?'#fffbea':fx.color;ctx.lineWidth=glow?Math.max(2,(fx.thick||4)*.35):(fx.thick||4)*1.8;ctx.globalAlpha=glow?.9:.28;ctx.stroke()}ctx.globalAlpha=.52*life;for(let br=0;br<2;br++){const t=.35+br*.28,bx=fx.x+(fx.x2-fx.x)*t,by=fx.y+(fx.y2-fx.y)*t,a=Math.atan2(fx.y2-fx.y,fx.x2-fx.x)+(br?1:-1)*.85;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(a)*24,by+Math.sin(a)*24);ctx.strokeStyle=fx.color;ctx.lineWidth=2;ctx.stroke()}ctx.lineCap='butt'}
    else if(fx.type==='iceCone'||fx.type==='cone'){const range=fx.range||120,width=fx.width||.25,a=fx.a||0,g=ctx.createRadialGradient(fx.x,fx.y,5,fx.x,fx.y,range);g.addColorStop(0,'#e0f2fecc');g.addColorStop(.45,'#38bdf855');g.addColorStop(1,'#0ea5e900');ctx.fillStyle=g;ctx.globalAlpha=.34*life;ctx.beginPath();ctx.moveTo(fx.x,fx.y);ctx.arc(fx.x,fx.y,range,a-width,a+width);ctx.closePath();ctx.fill();ctx.globalAlpha=.8*life;ctx.strokeStyle='#bae6fd';ctx.lineWidth=fx.maxed?4:2;for(let q=-2;q<=2;q++){const aa=a+width*q/2;ctx.beginPath();ctx.moveTo(fx.x,fx.y);ctx.lineTo(fx.x+Math.cos(aa)*range,fx.y+Math.sin(aa)*range);ctx.stroke()}}
    else if(fx.type==='iceShard'){ctx.translate(fx.x,fx.y);ctx.rotate((fx.a||0)+Math.PI/4);ctx.fillStyle='#e0f2fe';ctx.beginPath();ctx.moveTo(0,-fx.size);ctx.lineTo(fx.size*.45,0);ctx.lineTo(0,fx.size);ctx.lineTo(-fx.size*.45,0);ctx.closePath();ctx.fill()}
    else if(fx.type==='meteorStrike'){const h=fx.giant?250:180;ctx.strokeStyle='#fff7ed';ctx.lineWidth=fx.giant?18:10;ctx.globalAlpha=.75*life;ctx.beginPath();ctx.moveTo(fx.x+55,fx.y-h);ctx.lineTo(fx.x,fx.y);ctx.stroke();ctx.strokeStyle='#fb923c';ctx.lineWidth=fx.giant?36:22;ctx.globalAlpha=.24*life;ctx.stroke();ctx.globalAlpha=.35*life;ctx.fillStyle='#f97316';ctx.beginPath();ctx.arc(fx.x,fx.y,Math.min(fx.radius||60,fx.giant?180:85)*(1-life*.35),0,Math.PI*2);ctx.fill()}
    else if(fx.type==='psyblade'){ctx.lineCap='round';ctx.strokeStyle=fx.color;ctx.lineWidth=fx.w||12;ctx.globalAlpha=.28*life;ctx.beginPath();ctx.moveTo(fx.x,fx.y);ctx.lineTo(fx.x2,fx.y2);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.globalAlpha=.92*life;ctx.stroke();ctx.lineCap='butt'}
    else if(fx.type==='nova'){const rr=fx.r||30;ctx.strokeStyle=fx.color;ctx.lineWidth=5;ctx.globalAlpha=.75*life;for(let q=0;q<3;q++){ctx.beginPath();ctx.arc(fx.x,fx.y,rr*(.55+q*.22),s.elapsed/180+q, s.elapsed/180+q+Math.PI*1.55);ctx.stroke()}ctx.strokeStyle=fx.color2||'#67e8f9';ctx.lineWidth=2;for(let q=0;q<8;q++){const a=q*Math.PI/4+s.elapsed/300,ri=rr*.32,ro=rr*.88;ctx.beginPath();ctx.moveTo(fx.x+Math.cos(a)*ri,fx.y+Math.sin(a)*ri);ctx.quadraticCurveTo(fx.x+Math.cos(a+.25)*rr*.62,fx.y+Math.sin(a+.25)*rr*.62,fx.x+Math.cos(a)*ro,fx.y+Math.sin(a)*ro);ctx.stroke()}}
    else if(fx.type==='vortex'){ctx.lineCap='round';for(let q=0;q<5;q++){ctx.strokeStyle=q%2?fx.color2:fx.color;ctx.lineWidth=6-q;ctx.globalAlpha=(.72-q*.09)*life;ctx.beginPath();ctx.arc(fx.x,fx.y,(fx.r||80)*(.2+q*.16),s.elapsed/(120+q*10)+q,s.elapsed/(120+q*10)+q+Math.PI*1.65);ctx.stroke()}ctx.lineCap='butt'}
    else if(fx.type==='sanctuary'){const rr=Number(fx.r||SURV_SQM*6);ctx.globalAlpha=.16+.12*life;ctx.fillStyle='#f9a8d4';ctx.beginPath();ctx.arc(fx.x,fx.y,rr,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.75*life;ctx.strokeStyle='#fbcfe8';ctx.lineWidth=5;ctx.beginPath();ctx.arc(fx.x,fx.y,rr,0,Math.PI*2);ctx.stroke();for(let q=0;q<10;q++){const a=q*Math.PI/5+s.elapsed/700,px=fx.x+Math.cos(a)*rr*.72,py=fx.y+Math.sin(a)*rr*.72;ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.fillText('♥',px-7,py+6)}}
    else if(['cast','helperAura','thunderSeal','waterCast','windCast','meteorWarning','voidOpen','heartBurst'].includes(fx.type)){ctx.lineWidth=fx.type==='voidOpen'?6:3;ctx.globalAlpha=.72*life;ctx.beginPath();ctx.arc(fx.x,fx.y,Math.max(4,fx.r||18),0,Math.PI*2);ctx.stroke();if(fx.type==='thunderSeal'){for(let q=0;q<6;q++){const a=q*Math.PI/3;ctx.beginPath();ctx.moveTo(fx.x+Math.cos(a)*(fx.r*.35),fx.y+Math.sin(a)*(fx.r*.35));ctx.lineTo(fx.x+Math.cos(a)*(fx.r*.92),fx.y+Math.sin(a)*(fx.r*.92));ctx.stroke()}}}
    else if(fx.type==='petal'){const a=fx.a||0,len=fx.len||24;ctx.translate(fx.x,fx.y);ctx.rotate(a);ctx.strokeStyle=fx.color;ctx.lineWidth=4;ctx.globalAlpha=.7*life;ctx.beginPath();ctx.moveTo(4,0);ctx.quadraticCurveTo(len*.55,-len*.22,len,0);ctx.stroke()}
    else if(fx.type==='flameWing'||fx.type==='shadowClaw'){const a=fx.a||0;ctx.translate(fx.x,fx.y);ctx.rotate(a);ctx.strokeStyle=fx.color;ctx.lineCap='round';for(let q=-1;q<=1;q++){ctx.lineWidth=6-Math.abs(q)*2;ctx.globalAlpha=(.72-Math.abs(q)*.15)*life;ctx.beginPath();ctx.moveTo(-8,q*8);ctx.quadraticCurveTo(28,q*17,58,q*4);ctx.stroke()}ctx.lineCap='butt'}
    ctx.restore()
  }
  survDrawPsyduck(s,ctx);
  for(const t of s.texts){if(!survInView(s,t.x,t.y,80))continue;ctx.fillStyle=t.color||'#fff';ctx.font=(t.big?'bold 18px':'bold 12px')+' sans-serif';ctx.textAlign='center';ctx.fillText(t.text,t.x,t.y);ctx.textAlign='left'}
  ctx.restore();ctx.setTransform(1,0,0,1,0,0);
  {const alerts=(s.dropAlerts||[]).slice(0,4);ctx.textAlign='right';for(let i=0;i<alerts.length;i++){const a=alerts[i],alpha=Math.max(.15,Math.min(1,Number(a.life||0)/700)),y=18+i*28;ctx.globalAlpha=alpha;ctx.fillStyle='#020617dd';ctx.fillRect(viewW-330,y-14,316,23);ctx.strokeStyle=a.rarity==='epic'?'#facc15':'#38bdf8';ctx.strokeRect(viewW-330,y-14,316,23);ctx.fillStyle=a.rarity==='epic'?'#fde047':'#e0f2fe';ctx.font='bold 12px sans-serif';ctx.fillText(`${a.rarity==='epic'?'🎁':'★'} ${a.qty}x ${a.name} • ${a.source}`,viewW-22,y+2)}ctx.globalAlpha=1;ctx.textAlign='left'}
  if(!s._hudDrawAt||s.elapsed-s._hudDrawAt>=100){s._hudDrawAt=s.elapsed;
  const sec=Math.floor(s.elapsed/1000),mm=Math.floor(sec/60),ss=sec%60,hpPct=Math.max(0,Math.min(100,s.hp/s.maxHp*100)),xpPct=Math.max(0,Math.min(100,s.runXp/s.runXpNext*100));
  const hpbar=$('psy-surv-hpbar'),xpbar=$('psy-surv-xpbar');if(hpbar)hpbar.style.width=hpPct+'%';if(xpbar)xpbar.style.width=xpPct+'%';const hptext=$('psy-surv-hptext');if(hptext)hptext.textContent=`${Math.ceil(s.hp)}/${Math.ceil(s.maxHp)}`;const lvtext=$('psy-surv-lvtext');if(lvtext)lvtext.textContent=`RUN LV.${s.runLevel} • ${Math.floor(s.runXp)}/${s.runXpNext}`;
  const ph=$('psy-surv-phase');if(ph)ph.textContent=`FASE ${s.phase}`;const cl=$('psy-surv-clock');if(cl)cl.textContent=`${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;const nextBoss=s.elapsed<240000?240000:s.elapsed<480000?480000:s.elapsed<720000?720000:s.elapsed<960000?960000:1200000,remain=Math.max(0,Math.ceil((nextBoss-s.elapsed)/1000)),nr=$('psy-surv-next');if(nr)nr.textContent=s.finalSpawned?'CHEFE FINAL EM CAMPO':`${nextBoss===1200000?'CHEFE FINAL':'CHEFE'} EM ${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}`;
  const ki=$('psy-surv-kills');if(ki)ki.textContent=`⚔ ${s.kills}`;const go=$('psy-surv-gold');if(go)go.textContent=`🪙 ${fmt(s.gold)}`;const info=$('psy-clean-surv-info');if(info)info.textContent=''
  }

}
function survLoop(ts){
  const s=W.PSY_CLEAN_SURV;if(!s||s.done)return;requestAnimationFrame(survLoop);const rawDt=Math.max(0,ts-(s.last||ts)),dt=Math.min(34,rawDt);s.last=ts;if(s.perf){s.perf.avgDt=s.perf.avgDt*.94+Math.min(60,rawDt||16.7)*.06;s.perf.frameCount++;if((s.perf.frameCount%45)===0){s.perf.vfxQuality=s.perf.avgDt>29?.50:s.perf.avgDt>24?.66:s.perf.low?.66:s.perf.mobile?.84:1}}if(s.paused){if(ts-Number(s._pauseDrawAt||0)>120){s._pauseDrawAt=ts;survDraw(s)}return}
  if(s.ending){s.elapsed+=dt;if(s.elapsed>=Number(s.endAt||0))return W.psyCleanEnd(false,false);survDraw(s);return}
  s.elapsed+=dt;s.hp=Math.min(s.maxHp,s.hp+s.maxHp*s.regen*dt/1000);if(Date.now()-PSY_SURV_AUTOSAVE_AT>=12000&&!s._saveQueued){s._saveQueued=true;const run=()=>{s._saveQueued=false;if(W.PSY_CLEAN_SURV===s&&!s.done)psySurvSaveResume(true)};if(W.requestIdleCallback)W.requestIdleCallback(run,{timeout:1800});else setTimeout(run,0)}
  if(!s._buffRefreshAt||ts-s._buffRefreshAt>=300){s._buffRefreshAt=ts;const liveDmgMult=1+Math.max(0,Number(getTotalBuff?.('dmg')||0))/100;if(Number.isFinite(s.globalDmgMult)&&Math.abs(liveDmgMult-s.globalDmgMult)>.0001){const ratio=liveDmgMult/Math.max(.0001,s.globalDmgMult);s.power*=ratio;s.basePower*=ratio;s.globalDmgMult=liveDmgMult}s.globalBuffs={dmg:(liveDmgMult-1)*100,gold:Number(getTotalBuff?.('gold')||0),xp:Number(getTotalBuff?.('xp')||0),drop:Number(getTotalBuff?.('drop')||0)}};
  const k=W.V12_KEYS||{},g=(typeof keys!=='undefined'&&keys)||{},left=!!(k.left||g.ArrowLeft||g.KeyA||g.a||g.A),right=!!(k.right||g.ArrowRight||g.KeyD||g.d||g.D),up=!!(k.up||g.ArrowUp||g.KeyW||g.w||g.W),down=!!(k.down||g.ArrowDown||g.KeyS||g.s||g.S),dx=(right?1:0)-(left?1:0),dy=(down?1:0)-(up?1:0),m=Math.hypot(dx,dy)||1,edge=58;s.psyMoving=!!(dx||dy);if(dx)s.psyFacing=dx<0?-1:1;s.x=Math.max(edge,Math.min((s.worldW||s.w)-edge,s.x+dx/m*s.speed*dt/16));s.y=Math.max(edge,Math.min((s.worldH||s.h)-edge,s.y+dy/m*s.speed*dt/16));
  if(s.elapsed>=240000)survSpawnBoss(s,4,false);if(s.elapsed>=480000)survSpawnBoss(s,8,false);if(s.elapsed>=720000)survSpawnBoss(s,12,false);if(s.elapsed>=960000)survSpawnBoss(s,16,false);if(s.elapsed>=1200000&&!s.finalSpawned){s.finalSpawned=true;survSpawnBoss(s,20,true)}
  while(s.elapsed>=Number(s.nextElite||SURV_ELITE_INTERVAL)){survSpawnTimedElite(s);s.nextElite=Number(s.nextElite||SURV_ELITE_INTERVAL)+SURV_ELITE_INTERVAL}if(s.elapsed>=Number(s.nextSpecial||18000)){survSpawnVariantSpecial(s);s.nextSpecial=s.elapsed+15000+Math.random()*10500}
  survProcessRespawns(s);
  {const cap=Number(s.perf?.enemyCap||64);if(s.enemies.length>cap){const keep=s.enemies.filter(e=>!e.dead&&(e.boss||e.slotId!=null)),extra=s.enemies.filter(e=>!e.dead&&!e.boss&&e.slotId==null).slice(-Math.max(0,cap-keep.length));s.enemies=keep.concat(extra)}}
  s.fire+=dt;if(s.fire>s.fireRate&&s.enemies.length){s.fire=0;survShoot(s)}survUpdateHelpers(s,dt);survApplyBlisseySanctuary(s,dt);survUpdateFields(s,dt);survUpdateBossSkills(s,dt);
  s.novaAcc+=dt;if(s.novaAcc>Math.max(1450,5200/(1+s.nova*.25))){s.novaAcc=0;survNova(s)}s.vortexAcc+=dt;if(s.vortex&&s.vortexAcc>Math.max(1250,4200-s.vortex*360)){s.vortexAcc=0;survVortex(s)}s.rainAcc+=dt;if(s.rain&&s.rainAcc>Math.max(1100,3600-s.rain*300)){s.rainAcc=0;survPsyRain(s)}
  for(const e of s.enemies){
    if(e.dead)continue;const tar=survEnemyTarget(s,e,dt);let vx=tar.x-e.x,vy=tar.y-e.y,dist=Math.hypot(vx,vy)||1,a=Math.atan2(vy,vx),slowMul=e.slow>0?.60:1;e.slow=Math.max(0,e.slow-dt/1000*.11);
    if(e.boss&&e.charge?.active){
      const ch=e.charge;e.x+=Math.cos(ch.a)*ch.speed*dt/16;e.y+=Math.sin(ch.a)*ch.speed*dt/16;ch.left-=dt;vx=s.x-e.x;vy=s.y-e.y;dist=Math.hypot(vx,vy)||1;
      if(!ch.hit&&dist<48+e.size*.25){ch.hit=true;survBossHurt(s,ch.dmg,s.x,s.y,'💥 INVESTIDA!')}
      if(ch.left<=0||e.x<e.size*.35||e.x>s.worldW-e.size*.35||e.y<e.size*.35||e.y>s.worldH-e.size*.35)ch.active=false;
    }else if(e.ranged&&!e.boss){
      if(dist>e.attackRange*1.04){e.x+=Math.cos(a)*e.sp*slowMul*dt/16;e.y+=Math.sin(a)*e.sp*slowMul*dt/16}else if(dist<e.attackRange*.64){e.x-=Math.cos(a)*e.sp*.72*slowMul*dt/16;e.y-=Math.sin(a)*e.sp*.72*slowMul*dt/16}else{e.x+=Math.cos(a+Math.PI/2)*e.sp*.42*slowMul*dt/16;e.y+=Math.sin(a+Math.PI/2)*e.sp*.42*slowMul*dt/16}e.shootCd-=dt;if(e.shootCd<=0){e.shootCd=e.shootRate*(.80+Math.random()*.34);const aa=Math.atan2(tar.y-e.y,tar.x-e.x),spd=3.6+Math.min(2.8,s.phase*.014+s.elapsed/520000);s.enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(aa)*spd,vy:Math.sin(aa)*spd,dmg:(e.champion?9:e.elite?7:5.5)*(1+s.phase*.014),radius:e.champion?7:6,color:e.champion?'#fb7185':'#f59e0b',life:3000,targetHelperKey:tar.kind==='helper'?tar.key:''})}
    }else{e.x+=Math.cos(a)*e.sp*slowMul*dt/16;e.y+=Math.sin(a)*e.sp*slowMul*dt/16}
    e.x=Math.max(e.size*.35,Math.min(s.worldW-e.size*.35,e.x));e.y=Math.max(e.size*.35,Math.min(s.worldH-e.size*.35,e.y));
    if(!(e.boss&&e.charge?.active)&&dist<34+e.size*.17){if(tar.kind==='helper')survDamageHelper(s,tar.key,e.hit*dt,e.x,e.y);else{if(survHurtPlayer(s,e.hit*dt)){survBeginDefeat(s);return}}}
  }
  for(const eb of s.enemyBullets){if(eb.dead)continue;eb.life-=dt;eb.x+=eb.vx*dt/16;eb.y+=eb.vy*dt/16;if(eb.life<=0||eb.x<-30||eb.x>s.w+30||eb.y<-30||eb.y>s.h+30){eb.dead=true;continue}if(eb.targetHelperKey&&s.helperIds?.includes(eb.targetHelperKey)){const i=s.helperIds.indexOf(eb.targetHelperKey),h=survHelperState(s,eb.targetHelperKey,i);if(Math.hypot(eb.x-h.x,eb.y-h.y)<28+(eb.radius||5)){survDamageHelper(s,eb.targetHelperKey,eb.dmg,eb.x,eb.y);eb.dead=true;s.effects.push({type:'burst',x:h.x,y:h.y,r:3,max:28,life:10,color:'#fb7185'});continue}}if(Math.hypot(eb.x-s.x,eb.y-s.y)<34+(eb.radius||5)){const dead=survHurtPlayer(s,eb.dmg);eb.dead=true;s.effects.push({type:'burst',x:s.x,y:s.y,r:3,max:30,life:10,color:'#fb7185'});if(dead){survBeginDefeat(s);return}}}
  for(const b of s.bullets){if(b.dead)continue;b.life-=dt;if(b.homing&&b.target&&!b.target.dead){const sp=Math.max(.1,Math.hypot(b.vx,b.vy)),aa=Math.atan2(b.target.y-b.y,b.target.x-b.x);b.vx=b.vx*.72+Math.cos(aa)*sp*.28;b.vy=b.vy*.72+Math.sin(aa)*sp*.28}const bx=b.vx*dt/16,by=b.vy*dt/16;b.x+=bx;b.y+=by;b.travel=Number(b.travel||0)+Math.hypot(bx,by);if(b.life<=0||b.travel>Number(b.maxRange||s.attackRange||SURV_ATTACK_RANGE)||b.x<-40||b.x>(s.worldW||s.w)+40||b.y<-40||b.y>(s.worldH||s.h)+40){b.dead=true;continue}for(const e of s.enemies){if(e.dead||b.hit.has(e))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<e.size*.42+(b.radius||5)){b.hit.add(e);const dmg=b.dmg*(b.crit?1.75:1);survDamageEnemy(s,e,dmg,b.crit?'#fde047':b.color||'#fff',b.slow||0);if(b.aoe)survAreaDamage(s,e.x,e.y,b.aoe,dmg*.50,b.color||'#fff',e,b.slow||0);if(b.impactField)survAddField(s,Object.assign({x:e.x,y:e.y},b.impactField));if(b.onHit==='blisseyHeart')survBlisseyPulse(s,e.x,e.y,dmg*.35,3);if(b.onHit==='blisseyHeartMax')survBlisseyPulse(s,e.x,e.y,dmg*.35,5);if(b.pierce>0){b.pierce--}else b.dead=true;break}}
  }
  for(const fx of s.effects){if(fx.type==='burst'||fx.type==='impact'||fx.type==='cast'||fx.type==='helperAura'||fx.type==='thunderSeal'||fx.type==='waterCast'||fx.type==='windCast'||fx.type==='meteorWarning'||fx.type==='voidOpen')fx.r+=(Number(fx.max||fx.r)-fx.r)*.22;if(fx.type==='particle'||fx.type==='bubble'){fx.x+=Number(fx.vx||0);fx.y+=Number(fx.vy||0);fx.vy=Number(fx.vy||0)+Number(fx.gravity||0);fx.vx*=Number(fx.drag||.96);fx.vy*=Number(fx.drag||.96)}fx.life--}s.effects=s.effects.filter(f=>f.life>0);for(const t of s.texts)t.life--;s.texts=s.texts.filter(t=>t.life>0);for(const a of (s.dropAlerts||[]))a.life-=dt;s.dropAlerts=(s.dropAlerts||[]).filter(a=>a.life>0);s.enemies=s.enemies.filter(e=>!e.dead);s.bullets=s.bullets.filter(b=>!b.dead).slice(-Number(s.perf?.bulletCap||260));s.enemyBullets=s.enemyBullets.filter(b=>!b.dead).slice(-Number(s.perf?.enemyBulletCap||220));if(s.texts.length>Number(s.perf?.textCap||100))s.texts.splice(0,s.texts.length-Number(s.perf?.textCap||100));survCollect(s);
  if(s.finalSpawned&&s.finalBossDead&&!s.levelUpOpen)return W.psyCleanEnd(true,false);survDraw(s)
}
const PSY_SURV_RESUME_KEY='psyworld_survivor_run_v1';
const PSY_SURV_RESUME_VERSION=1;
let PSY_SURV_RESTORING=false,PSY_SURV_AUTOSAVE_AT=0;
function psySurvClearResume(){try{localStorage.removeItem(PSY_SURV_RESUME_KEY)}catch(_){ }}
function psySurvSnapshotState(s){
  const omit=new Set(['c','ctx','psyImg','psyFormImgs','spriteCache','perf','last','effects','texts','bullets','enemyBullets','bossHazards','dropAlerts','_vignette']);
  return JSON.parse(JSON.stringify(s,(key,value)=>{
    if(omit.has(key)||typeof value==='function')return undefined;
    if((key==='target'||key==='source')&&value&&typeof value==='object')return undefined;
    if(value instanceof Set)return[...value];
    if(value instanceof Map)return[...value.entries()];
    return value
  }))
}
function psySurvReadResume(){
  try{
    const snap=JSON.parse(localStorage.getItem(PSY_SURV_RESUME_KEY)||'null'),s=snap?.state;
    if(Number(snap?.version)!==PSY_SURV_RESUME_VERSION||!s||s.done||Number(s.phase)<1||Number(s.phase)>200||Number(s.hp)<=0){if(snap)psySurvClearResume();return null}
    return snap
  }catch(_){psySurvClearResume();return null}
}
function psySurvSaveResume(force=false){
  const s=W.PSY_CLEAN_SURV;if(!s||s.done)return false;
  if(!force&&Date.now()-Number(PSY_SURV_AUTOSAVE_AT||0)<4500)return false;
  try{localStorage.setItem(PSY_SURV_RESUME_KEY,JSON.stringify({version:PSY_SURV_RESUME_VERSION,savedAt:Date.now(),state:psySurvSnapshotState(s)}));PSY_SURV_AUTOSAVE_AT=Date.now();return true}catch(e){console.warn('Survivor autosave falhou',e);return false}
}
function psySurvResumeSummary(s){
  const sec=Math.max(0,Math.floor(Number(s.elapsed||0)/1000)),mm=Math.floor(sec/60),ss=sec%60;
  return `Fase <b>${Number(s.phase||1)}</b> • Run Lv.<b>${Number(s.runLevel||1)}</b> • ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')} • ${Number(s.kills||0)} KOs`
}
W.psySurvDiscardSaved=function(){psySurvClearResume();const m=$('psy-surv-resume-modal');if(m)m.remove();toast('Run salva do Survivor descartada.')};
W.psySurvResumeSaved=function(){
  const snap=psySurvReadResume();if(!snap)return W.psySurvDiscardSaved();
  const saved=snap.state,rewardMode=String(saved.rewardMode||''),rewardOfferIds=Array.isArray(saved.rewardOfferIds)?saved.rewardOfferIds.slice():[],trialCfg=saved.trialMode?{trialNumber:Number(saved.trialNumber||0),trialDifficulty:Math.max(1,Number(saved.trialDifficulty||1)),trialLabel:String(saved.trialLabel||'')}:null;
  $('psy-surv-resume-modal')?.remove();
  PSY_SURV_RESTORING=true;
  try{W.v12StartSurvivor(Math.max(0,Number(saved.phase||1)-1),trialCfg)}finally{PSY_SURV_RESTORING=false}
  const run=W.PSY_CLEAN_SURV;if(!run)return toast('Não foi possível restaurar a run do Survivor.');
  const runtime={c:run.c,ctx:run.ctx,viewW:run.viewW,viewH:run.viewH,worldW:run.worldW,worldH:run.worldH,w:run.w,h:run.h,psyImg:run.psyImg,psyFormImgs:run.psyFormImgs};
  Object.assign(run,saved,runtime,{perf:survPerfProfile(),spriteCache:{},last:0,paused:false,done:false,levelUpOpen:false,effects:[],texts:[{x:Number(saved.x||runtime.worldW/2),y:Number(saved.y||runtime.worldH/2)-82,text:'Run do Survivor restaurada!',life:150,color:'#67e8f9',big:true}],bullets:[],enemyBullets:[],bossHazards:[],dropAlerts:[]});
  run.psyFormImgs={normal:run.psyImg};
  survEnsurePsyFormImages(run);
  run.enemies=Array.isArray(saved.enemies)?saved.enemies:[];run.pickups=Array.isArray(saved.pickups)?saved.pickups:[];run.respawnQueue=Array.isArray(saved.respawnQueue)?saved.respawnQueue:[];run.normalSlots=Array.isArray(saved.normalSlots)?saved.normalSlots:[];run.fields=(Array.isArray(saved.fields)?saved.fields:[]).map(f=>({...f,hitSet:new Set()}));run.bossMarks=new Set(Array.isArray(saved.bossMarks)?saved.bossMarks:[]);run.helperState=run.helperState&&typeof run.helperState==='object'?run.helperState:{};for(const h of Object.values(run.helperState))if(h&&typeof h==='object')h.target=null;
  PSY_SURV_AUTOSAVE_AT=0;
  if(rewardMode==='elite')survShowEliteReward(run);else if(rewardMode==='levelup')survShowLevelUp(run,'RUN LEVEL UP!','ESCOLHA UM APRIMORAMENTO',rewardOfferIds);else{run.paused=false;W.psyCleanPause()}
  psySurvSaveResume(true);toast('Survivor restaurado. Continue quando estiver pronto.',3200)
};
W.psySurvOfferResume=function(){
  if(W.PSY_CLEAN_SURV||$('psy-surv-resume-modal'))return;const snap=psySurvReadResume();if(!snap)return;
  const m=D.createElement('div');m.id='psy-surv-resume-modal';m.className='psy-clean-result';m.style.zIndex='1003000';m.innerHTML=`<div class="psy20-card" style="width:min(600px,92vw);text-align:center;border-color:#38bdf8;box-shadow:0 0 34px #38bdf833"><div style="font-size:48px">🦆</div><h2 style="color:#facc15">Você deseja retornar à fase em andamento do Survivor?</h2><p class="psy20-sub">${psySurvResumeSummary(snap.state)}</p><p>Todo o progresso salvo da run será restaurado.</p><div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="psy20-btn green" type="button" onclick="psySurvResumeSaved()">SIM</button><button class="psy20-btn" type="button" style="background:#991b1b" onclick="psySurvDiscardSaved()">NÃO</button></div></div>`;D.body.appendChild(m)
};
window.addEventListener('beforeunload',()=>psySurvSaveResume(true));
window.addEventListener('pagehide',()=>psySurvSaveResume(true));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')psySurvSaveResume(true)});
if(document.readyState==='complete')setTimeout(()=>W.psySurvOfferResume(),500);else window.addEventListener('load',()=>setTimeout(()=>W.psySurvOfferResume(),500),{once:true});
W.v12StartSurvivor=function(index=0,trialCfg=null){
  const st=psyState(),phase=Math.max(1,Math.min(200,Number(index)+1));if(!trialCfg&&phase>Number(st.survivorBest||0)+1)return toast('Conclua a fase anterior.');
  if(!PSY_SURV_RESTORING)psySurvClearResume();
  const sc=survScreen(),c=$('psy-clean-surv-canvas'),portrait=innerHeight>innerWidth,cssW=Math.max(480,portrait?innerHeight:innerWidth),cssH=Math.max(250,portrait?innerWidth:innerHeight),topH=54,canvasCssH=Math.max(230,cssH-topH),viewW=1000,viewH=Math.max(390,Math.min(560,Math.round(viewW*canvasCssH/cssW)));
  c.width=viewW;c.height=viewH;c.style.cssText=`position:absolute;left:0;top:${topH}px;width:100%;height:calc(100% - ${topH}px);touch-action:none;image-rendering:auto`;
  try{const fs=sc.requestFullscreen?.();if(fs?.then)fs.then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{});else screen.orientation?.lock?.('landscape').catch(()=>{})}catch(_){ }
  const ctx=c.getContext('2d',{alpha:false,desynchronized:true})||c.getContext('2d'),psyImg=new Image();try{ctx.imageSmoothingEnabled=false}catch(_){ }psyImg._survAnimeSheet=true;psyImg.onerror=function(){this.onerror=null;this._survAnimeSheet=false;this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png'};psyImg.src=SURV_PSYDUCK_ANIME_SHEET;const psyPoke=psyDuckPoke();let psyStats={};try{psyStats=W.calcDetailedStats?.(psyPoke)||{}}catch(_){ }const intrinsicHp=Math.max(0,Number(psyStats.afterBoostHp||psyPoke.maxHp||0)),intrinsicAtk=Math.max(0,Number(psyStats.afterBoostAtk||psyPoke.atk||0)),psyHpBonus=Math.floor(intrinsicHp*.10),psyAtkBonus=Math.floor(intrinsicAtk*.05),globalDmgPct=Math.max(0,Number(getTotalBuff?.('dmg')||0)),psyAtkScale=Math.max(1,(18+psyAtkBonus)/18),max=Math.max(125,Math.floor(125+psyHpBonus)),basePower=(1+globalDmgPct/100)*psyAtkScale,worldW=3600,worldH=2200,startX=worldW/2,startY=worldH/2;
  {const bh=$('psy22-buffs');if(bh){bh.innerHTML='';bh.style.setProperty('display','none','important')}}
  W.PSY_CLEAN_SURV={c,ctx,viewW,viewH,worldW,worldH,w:worldW,h:worldH,trialMode:!!trialCfg,trialNumber:Number(trialCfg?.trialNumber||0),trialDifficulty:Math.max(1,Number(trialCfg?.trialDifficulty||1)),trialLabel:String(trialCfg?.trialLabel||''),x:startX,y:startY,camX:startX-viewW/2,camY:startY-viewH/2,attackRange:SURV_ATTACK_RANGE,phase,hp:max,maxHp:max,speed:6.6,skills:{},basePower,power:basePower,psyHpBonus,psyAtkBonus,globalDmgMult:1+globalDmgPct/100,globalBuffs:{dmg:globalDmgPct,gold:Number(getTotalBuff?.('gold')||0),xp:Number(getTotalBuff?.('xp')||0),drop:Number(getTotalBuff?.('drop')||0)},fireRate:500,multi:1,chain:0,chainMul:0,pierce:0,helpers:0,helperIds:[],helperForms:{},helperState:{},helperTimers:{},helperSpecialTimers:{},nova:1,vortex:0,rain:0,vortexMax:false,rainMax:false,magnet:78,crit:.05,regen:0,enemies:[],bullets:[],enemyBullets:[],pickups:[],fields:[],bossHazards:[],effects:[],texts:[{x:startX,y:startY-82,text:`Psyduck Sync: +${psyHpBonus} HP • +${psyAtkBonus} ATK`,life:150,color:'#67e8f9',big:true}],spawn:0,fire:0,novaAcc:0,vortexAcc:0,rainAcc:0,orbitAcc:0,kills:0,bossKills:0,gold:0,runXp:0,runLevel:1,runXpNext:60,realXp:0,loot:{},packLoot:{normal:0,rare:0,epic:0,s:0,ss:0,sss:0,ur:0,urp:0,urpp:0},cardPacks:0,perf:survPerfProfile(),elapsed:0,last:0,paused:false,done:false,finalSpawned:false,finalBossDead:false,bossMarks:new Set(),upgradeLevels:{},upgradeMaxed:{},levelUpOpen:false,rewardMode:'',rewardOfferIds:[],survLootBonus:0,eliteAtkBonus:0,eliteHpBonus:0,specialStatBonus:0,psyImg,psyForm:'normal',psyFormImgs:{normal:psyImg},psyFacing:1,psyMoving:false,psyAnimState:'idle',psyAnimStart:0,psyAnimUntil:0,spriteCache:{},respawnQueue:[],dropHistory:[],dropAlerts:[],nextElite:SURV_ELITE_INTERVAL,nextSpecial:16500+Math.random()*7500,normalSlots:[]};
  survMilestoneEnsure();const run=W.PSY_CLEAN_SURV;for(let i=0;i<SURV_NORMAL_POP;i++){const slot={id:i,spawnSide:i%4,spawnT:.08+(((i*0.61803398875)%1)*.84)};run.normalSlots.push(slot);run.enemies.push(survEnemy(run,{slotId:slot.id,spawnSide:slot.spawnSide,spawnT:slot.spawnT,allowVariant:false,allowStrong:false}))}
  const ps=$('screen-psyduck-v12');if(ps)ps.style.display='none';installSurvivorJoy();if(!PSY_SURV_RESTORING)psySurvSaveResume(true);requestAnimationFrame(survLoop)
};
W.psyCleanPause=function(force){
  const s=W.PSY_CLEAN_SURV;if(!s||s.done)return;s.paused=force===false?false:!s.paused;const p=$('psy-clean-surv-pause');if(p)p.style.display=s.paused?'flex':'none';const g=$('psy-clean-surv-current');if(g&&s.paused){
    const chosen=SURV_RUN_UPS.filter(u=>survRunUpLv(s,u.id)||survRunMaxed(s,u.id)),helpers=(s.helperIds||[]).map(k=>SURV_HELPERS.find(h=>h.key===k)?.name).filter(Boolean),abilityCount=survPsyAbilityCount(s),hist=(s.dropHistory||[]).slice(0,40);
    const cards=chosen.map(u=>{const lv=survRunUpLv(s,u.id),maxed=survRunMaxed(s,u.id),img=survPowerIcon(u,s,maxed),tag=maxed?'MAX':`Lv.${lv}/${u.max}`;return `<div class="psy-surv-pause-power ${maxed?'max':''}"><img src="${esc(img)}" alt=""><div class="psy-surv-pause-power-copy"><small>${esc(u.kind||'POWER-UP')}</small><b>${esc(u.name)}</b><span>${esc(maxed&&u.maxDesc?u.maxDesc:u.desc||'')}</span></div><em>${tag}</em></div>`}).join('');
    const history=`<section class="psy-surv-pause-history"><div class="psy-surv-pause-section-title"><b>📦 DROPS DA FASE</b><small>${hist.length} registros recentes</small></div><div class="psy-surv-pause-history-list">${hist.length?hist.map(x=>{const sec=Math.floor(Number(x.time||0)/1000),m=Math.floor(sec/60),ss=sec%60;return `<span><b>${x.rarity==='epic'?'🎁':'★'} ${x.qty}x ${esc(x.name)}</b><small>${m}:${String(ss).padStart(2,'0')} • ${esc(x.source||'Pokémon')}</small></span>`}).join(''):'<small>Nenhum item raro caiu nesta fase ainda.</small>'}</div></section>`;
    g.innerHTML=`<div class="psy-surv-pause-summary sync"><small>🔗 SYNC PSYDUCK</small><b>+${fmt(s.psyHpBonus||0)} HP</b><b>+${fmt(s.psyAtkBonus||0)} ATK</b></div><div class="psy-surv-pause-summary buffs"><small>✨ BÔNUS ATIVOS</small><span>⚔ ${Number(s.globalBuffs?.dmg||0).toFixed(0)}%</span><span>🪙 ${Number(s.globalBuffs?.gold||0).toFixed(0)}%</span><span>⭐ ${Number(s.globalBuffs?.xp||0).toFixed(0)}%</span><span>🎁 ${Number(s.globalBuffs?.drop||0).toFixed(0)}%</span></div><div class="psy-surv-pause-summary run"><small>📈 EXP DA RUN</small><b>Treino Intensivo +${survRunUpLv(s,'runxp')*10}%</b></div><div class="psy-surv-pause-summary team"><small>🧠 EQUIPE</small><b>${helpers.length}/${SURV_HELPER_CAP} ajudantes</b><b>${abilityCount}/${SURV_PSY_ABILITY_CAP} habilidades</b></div><section class="psy-surv-pause-powers"><div class="psy-surv-pause-section-title"><b>⚡ POWER-UPS DA RUN</b><small>${chosen.length} aprimoramentos ativos</small></div><div class="psy-surv-pause-powergrid">${cards||'<div class="psy-surv-pause-empty">Nenhum Power-Up escolhido ainda.</div>'}</div></section>${helpers.length?`<section class="psy-surv-pause-helperline"><b>🤝 AJUDANTES</b><span>${helpers.join(' • ')}</span></section>`:''}${history}`
  }psySurvSaveResume(true)
};
W.psyReturnFromSurvivor=function(){
  const sc=$('screen-survivor-v12');
  try{if(document.fullscreenElement)document.exitFullscreen?.().catch?.(()=>{})}catch(_){ }
  try{screen.orientation?.unlock?.()}catch(_){ }
  try{W.V12_KEYS=W.V12_KEYS||{};W.V12_KEYS.left=W.V12_KEYS.right=W.V12_KEYS.up=W.V12_KEYS.down=false}catch(_){ }
  psySurvClearResume();W.PSY_CLEAN_SURV=null;if(sc){sc.style.display='none';sc.innerHTML=''}
  {const bh=$('psy22-buffs');if(bh)bh.style.removeProperty('display')}try{psy22BuffStrip?.()}catch(_){ }
  try{W.openPsyduckDungeon5?.();setTimeout(()=>W.v12PsyTab?.('survivor'),40)}catch(e){console.error(e);toast('Não foi possível voltar ao Psyduck.')}
};try{psyReturnFromSurvivor=W.psyReturnFromSurvivor}catch(e){}
W.psyCleanEnd=function(completed,manual){
  const s=W.PSY_CLEAN_SURV;if(!s||s.done)return;s.done=true;psySurvClearResume();
  const st=psyState(),p=psyDuckPoke();P.gold=Number(P.gold||0)+s.gold;for(const [n,q] of Object.entries(s.loot||{}))P.inventory[n]=Number(P.inventory[n]||0)+Number(q||0);const runPacks={...(s.packLoot||{})};if(!Number(runPacks.normal||0)&&Number(s.cardPacks||0))runPacks.normal=Number(s.cardPacks||0);P.cardGame=P.cardGame||{};P.cardGame.packs=P.cardGame.packs||{};for(const [k,q] of Object.entries(runPacks)){if(Number(q)>0)P.cardGame.packs[k]=Number(P.cardGame.packs[k]||0)+Number(q)}
  p.exp=Number(p.exp||0)+Number(s.realXp||0);p.maxExp=Number(p.maxExp||100);while(p.exp>=p.maxExp&&Number(p.level||1)<100){p.exp-=p.maxExp;p.level=Number(p.level||1)+1;p.maxExp=Math.floor(p.maxExp*1.14+20)}
  let first=false,trialCleared=false;if(s.trialMode){if(completed&&s.trialNumber){psyAscCompleteTrial(s.trialNumber);trialCleared=true}}else{first=completed&&s.phase>Number(st.survivorBest||0);if(first)st.survivorBest=s.phase}
  save();try{renderTeam?.();updateHUD?.()}catch(_){ }
  const sc=$('screen-survivor-v12'),lootParts=Object.entries(s.loot||{}).map(([n,q])=>`${q}x ${n}`),packLabels={normal:'Pack Normal',rare:'Pack Raro',epic:'Pack Épico',s:'Pack S',ss:'Pack SS',sss:'Pack SSS',ur:'Pack UR',urp:'Pack UR+',urpp:'Pack UR++'};for(const [k,q] of Object.entries(runPacks))if(Number(q)>0)lootParts.push(`${q}x ${packLabels[k]||('Pack '+k.toUpperCase())}`);const loot=lootParts.join(' • ');
  if(!sc)return;sc.innerHTML=`<div class="psy-clean-result"><div class="psy20-card" style="width:min(620px,92vw)"><h2>${completed?'🎉 FASE CONCLUÍDA':manual?'RUN ENCERRADA':'💀 PSYDUCK FOI DERROTADO'}</h2><p>Fase ${s.phase} • Run Lv.${s.runLevel} • ${s.kills} KOs • ${s.bossKills} chefes</p><p><b>+${fmt(s.gold)} Gold • +${fmt(s.realXp)} EXP do Psyduck real</b>${trialCleared?' • 🏆 PROVAÇÃO CONCLUÍDA':''}</p><div class="psy20-sub" style="margin:10px 0">${loot||'Sem drop raro nesta run.'}</div><button id="psy-surv-return-btn" class="psy20-btn green" type="button">VOLTAR AO PSYDUCK</button></div></div>`;
  const btn=$('psy-surv-return-btn');if(btn){btn.onclick=null;btn.addEventListener('click',()=>W.psyReturnFromSurvivor(),{once:true})}
};

/* ===== hunts reliable pools ===== *//* ===== hunts reliable pools ===== */
const REGIONS={KANTO:[1,151],JOHTO:[152,251],HOENN:[252,386],SINNOH:[387,493],UNOVA:[494,649],KALOS:[650,721],ALOLA:[722,809],GALAR:[810,905],PALDEA:[906,1025]};
const HUNT_TYPES=['Normal','Fogo','Água','Planta','Elétrico','Gelo','Lutador','Veneno','Terra','Voador','Psíquico','Inseto','Pedra','Fantasma','Dragão','Sombrio','Metal','Fada'];
function normType(s){s=String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const m={normal:'normal',fire:'fogo',fogo:'fogo',water:'agua',agua:'agua',grass:'planta',planta:'planta',electric:'eletrico',eletrico:'eletrico',ice:'gelo',gelo:'gelo',fighting:'lutador',lutador:'lutador',poison:'veneno',veneno:'veneno',venenoso:'veneno',ground:'terra',terra:'terra',flying:'voador',voador:'voador',psychic:'psiquico',psiquico:'psiquico',bug:'inseto',inseto:'inseto',rock:'pedra',pedra:'pedra',ghost:'fantasma',fantasma:'fantasma',dragon:'dragao',dragao:'dragao',dark:'sombrio',sombrio:'sombrio',noturno:'sombrio',steel:'metal',metal:'metal',aco:'metal',fairy:'fada',fada:'fada'};return m[s]||s}
function huntTypesOf(id){let raw='Normal';try{raw=String(W.TYPE_BY_ID_FULL?.[id]||W.TYPE_BY_ID_ALL?.[id]||(typeof TYPE_BY_ID_ALL!=='undefined'?TYPE_BY_ID_ALL?.[id]:'')||'Normal')}catch(e){}return raw.split(/[\/|,+]/).map(x=>normType(x.trim())).filter(Boolean)}
function huntBanned(id){id=Number(id);if(EEVEE_LINE.has(id)||id===54)return true;try{if(window.LEGENDARY_IDS?.has?.(id))return true}catch(e){}try{if(typeof LEGENDARY_IDS!=='undefined'&&LEGENDARY_IDS.has(id))return true}catch(e){}try{if(window.LEGENDARY_BLOCK?.has?.(id))return true}catch(e){}try{if(typeof LEGENDARY_BLOCK!=='undefined'&&LEGENDARY_BLOCK.has(id))return true}catch(e){}try{if(window.BOSS_BAN_IDS?.has?.(id))return true}catch(e){}try{if(typeof BOSS_BAN_IDS!=='undefined'&&BOSS_BAN_IDS.has(id))return true}catch(e){}return false}
function validHuntId(id){if(huntBanned(id))return false;return !!(W.ALL_POKE_NAMES?.[id]||(typeof ALL_POKE_NAMES!=='undefined'&&ALL_POKE_NAMES[id]))}
/* V28: pool por faixa evolutiva + Rank máximo S.
   1ª forma: qualquer faixa; 2ª forma: 21-30+; 3ª forma/final de linhas com 3 estágios: 41-50+.
   Rank SS/SSS/UR+ não entra em Hunt/Fast Encounter. */
function psyV28HuntStage(id){try{return Math.max(1,Number(W.getEvoStage?.(id)||1))}catch(e){return 1}}
function psyV28HuntRankAllowed(id){const rank={E:0,D:1,C:2,B:3,A:4,S:5,SS:6,SSS:7,UR:8,'UR+':9,'UR++':10};let t='E';try{t=W.getTier?.(id,false,false,false)||'E'}catch(e){}return (rank[t]??99)<=rank.S}
function psyV28BandAllowed(id,band){band=Math.max(0,Math.min(9,Number(band||0)));const st=psyV28HuntStage(id);if(st>=3)return band>=4;if(st===2)return band>=2;return true}
W.psyCleanHuntPool=function(region,type,band){const [a,b]=REGIONS[region]||REGIONS.KANTO,nt=normType(type),regional=[];const accept=id=>validHuntId(id)&&psyV28HuntRankAllowed(id)&&psyV28BandAllowed(id,band)&&huntTypesOf(id).includes(nt);for(let id=a;id<=b;id++){if(accept(id))regional.push(id)}if(regional.length)return regional;/* se a região não possuir aquele elemento nessa faixa, usa fallback global do mesmo tipo mantendo as mesmas regras */const fallback=[];for(const [ra,rb] of Object.values(REGIONS)){for(let id=ra;id<=rb;id++){if(accept(id))fallback.push(id)}}return fallback};
function psyCleanRegionUnlocked(region){
  try{return typeof isRegionUnlocked==='function'?!!isRegionUnlocked(region):true}catch(e){return true}
}
function psyCleanRegionLockText(region){
  const order=Array.isArray(REGION_ORDER)?REGION_ORDER:Object.keys(REGIONS||{}),idx=order.indexOf(region);
  if(idx<=0)return '';
  const prev=order[idx-1];
  return `Conclua os Ginásios de ${prev} para liberar ${region}.`;
}
W.psyCleanRegionUnlocked=psyCleanRegionUnlocked;
W.psyCleanRegionLockText=psyCleanRegionLockText;
W.openHunts=function(){core();try{W.fastEncounter=false;if(typeof fastEncounter!=='undefined')fastEncounter=false;const fb=$('fastEncounterBtn');if(fb){fb.style.background='#dc2626';fb.title='Fast Encounter: desligado';fb.setAttribute('aria-label',fb.title)}}catch(e){}let s=$('psy-clean-hunts');if(!s){s=D.createElement('div');s.id='psy-clean-hunts';s.className='psy20-overlay';D.body.appendChild(s)}P.meta.cleanHunt=P.meta.cleanHunt||{region:'KANTO',band:0};const st=P.meta.cleanHunt;if(!psyCleanRegionUnlocked(st.region))st.region='KANTO';const lv=Number(P.team?.[0]?.level||1),lo=st.band*10+1,hi=(st.band+1)*10;s.style.display='flex';s.innerHTML=`<div class="psy20-panel" style="width:min(1180px,96vw)"><button class="psy20-close" onclick="document.getElementById('psy-clean-hunts').style.display='none'">×</button><h2 class="psy20-title">🐾 HUNTS — FAIXAS DE 10 NÍVEIS</h2><div class="psy20-sub">Escolha região, faixa e elemento. Regiões seguintes liberam ao concluir os Ginásios da região anterior. Level Cap e nível mínimo da Hunt continuam valendo.</div><div class="psy20-tabs">${Object.keys(REGIONS).map(r=>{const ok=psyCleanRegionUnlocked(r);return `<button class="psy20-btn ${st.region===r?'gold':''}" ${ok?'':`disabled title="${psyCleanRegionLockText(r)}"`} onclick="P.meta.cleanHunt=P.meta.cleanHunt||{};P.meta.cleanHunt.region='${r}';window.openHunts()">${ok?'':'🔒 '}${r}</button>`}).join('')}</div><div class="psy20-tabs">${Array.from({length:10},(_,i)=>`<button class="psy20-btn ${st.band===i?'gold':''}" onclick="P.meta.cleanHunt=P.meta.cleanHunt||{};P.meta.cleanHunt.band=${i};window.openHunts()">${i*10+1}-${(i+1)*10}</button>`).join('')}</div><div class="psy20-pill" style="margin:8px 0">Ativo Lv.${lv} • CAP ${Number(P.levelCap||20)}</div><div class="psy20-huntgrid">${HUNT_TYPES.map(t=>{const ids=W.psyCleanHuntPool(st.region,t,st.band),sample=ids.slice(0,4).map(id=>`<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">`).join(''),lockedRegion=!psyCleanRegionUnlocked(st.region),lockedCap=lo>Number(P.levelCap||20);return `<div class="psy20-hunt"><div class="psy20-row"><b>${t.toUpperCase()}</b><span>${ids.length} espécies</span></div><div class="psy20-hunt-pokes">${sample}</div><b>Lv ${lo}-${hi}</b><button class="psy20-btn green" style="width:100%;margin-top:8px" ${!ids.length||lv<lo||lockedRegion||lockedCap?'disabled':''} onclick="window.psyCleanEnterHunt('${st.region}','${t}',${st.band})">ENTRAR</button></div>`}).join('')}</div></div>`};
/* V34: duplicate psyCleanEnterHunt removed; authoritative implementation is below. */


/* ===== V27 Fast Encounter: same authoritative pool as last selected Hunt ===== */
const psyV27OldTriggerWild=W.triggerWild;
W.triggerWild=function(pool){
  const key=String(pool||P.currentHunt||'');
  if(!key.startsWith('psy19:')) return psyV27OldTriggerWild?.apply(this,arguments);
  if(((typeof inBattle!=='undefined'&&inBattle)||W.inBattle)||!P.team?.[0]) return;
  const parts=key.split(':'),region=parts[1],type=parts[2],band=Math.max(0,Math.min(9,Number(parts[3]||0)));
  const ids=W.psyCleanHuntPool(region,type,band);
  if(!ids.length){
    try{toast('A última Hunt não possui Pokémon disponíveis. Selecione outra Hunt.')}catch(e){}
    W.fastEncounter=false; try{fastEncounter=false}catch(e){}
    const b=$('fastEncounterBtn');if(b){b.style.background='#dc2626';b.title='Fast Encounter: desligado';b.setAttribute('aria-label',b.title)}
    return;
  }
  const lo=band*10+1,hi=(band+1)*10,id=ids[Math.floor(Math.random()*ids.length)],lvl=lo+Math.floor(Math.random()*(hi-lo+1));
  P.currentHunt=key;
  const rarity=W.rollRarity?.(W.getTier?.(id))||W.rollRarity?.()||{n:'Comum',mult:1};
  try{return W.startBattle?.({id,name:W.getPokeName?.(id)||`Pokémon ${id}`,level:lvl,lvl,type,rarity})}
  catch(e){console.error('Fast Encounter Hunt:',e);try{toast('Não foi possível iniciar o Fast Encounter.')}catch(_){}}
};
try{triggerWild=W.triggerWild}catch(e){}

/* Small draggable Fast Encounter orb. Position is saved for the player. */
function psyV27FastButton(){
  const b=$('fastEncounterBtn');if(!b)return;
  b.style.setProperty('position','fixed','important');
  b.style.setProperty('width','26px','important');b.style.setProperty('height','26px','important');
  b.style.setProperty('min-width','26px','important');b.style.setProperty('max-width','26px','important');
  b.style.setProperty('padding','0','important');b.style.setProperty('border-radius','50%','important');
  b.style.setProperty('touch-action','none','important');b.style.setProperty('user-select','none','important');
  b.textContent='';
  P.meta=P.meta||{};
  const pos=P.meta.fastEncounterPos;
  if(pos&&!b.dataset.psyV27Pos){
    const maxX=Math.max(0,innerWidth-30),maxY=Math.max(0,innerHeight-30);
    b.style.setProperty('left',Math.max(0,Math.min(maxX,Number(pos.x)||0))+'px','important');
    b.style.setProperty('top',Math.max(0,Math.min(maxY,Number(pos.y)||0))+'px','important');
    b.style.setProperty('right','auto','important');b.style.setProperty('bottom','auto','important');
    b.dataset.psyV27Pos='1';
  }
  if(b.dataset.psyV27Drag)return;b.dataset.psyV27Drag='1';
  let active=false,moved=false,pid=null,dx=0,dy=0;
  b.addEventListener('pointerdown',e=>{
    if(e.button!=null&&e.button!==0)return;active=true;moved=false;pid=e.pointerId;
    const r=b.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;
    try{b.setPointerCapture(pid)}catch(_){} e.preventDefault();
  },{passive:false});
  b.addEventListener('pointermove',e=>{
    if(!active||e.pointerId!==pid)return;
    const maxX=Math.max(0,innerWidth-b.offsetWidth),maxY=Math.max(0,innerHeight-b.offsetHeight);
    const x=Math.max(0,Math.min(maxX,e.clientX-dx)),y=Math.max(0,Math.min(maxY,e.clientY-dy));
    if(Math.abs(e.movementX||0)+Math.abs(e.movementY||0)>0)moved=true;
    b.style.setProperty('left',x+'px','important');b.style.setProperty('top',y+'px','important');
    b.style.setProperty('right','auto','important');b.style.setProperty('bottom','auto','important');e.preventDefault();
  },{passive:false});
  const finish=e=>{
    if(!active||e.pointerId!==pid)return;active=false;
    const r=b.getBoundingClientRect();P.meta.fastEncounterPos={x:Math.round(r.left),y:Math.round(r.top)};
    try{W.autoSave?.()}catch(_){} try{b.releasePointerCapture(pid)}catch(_){}
    if(moved){b.dataset.psyV27Suppress='1';setTimeout(()=>delete b.dataset.psyV27Suppress,120)}
  };
  b.addEventListener('pointerup',finish);b.addEventListener('pointercancel',finish);
  b.addEventListener('click',e=>{if(b.dataset.psyV27Suppress){e.preventDefault();e.stopImmediatePropagation();delete b.dataset.psyV27Suppress}},true);
}

/* ===== pass kill reconciliation: global kills is source of truth ===== */
function syncPassKills(){return 0}

/* ===== PsyCoin help button guaranteed ===== */
W.openPsyCoinTutorial=W.openPsyCoinTutorial||function(){toast('PsyCoin: Ascensões do Psyduck (+1 por Reset), Loja Premium e eventos oficiais.');};
if(!W.__psyCoinHelpClickBound){W.__psyCoinHelpClickBound=1;D.addEventListener('click',function(ev){const b=ev.target?.closest?.('#psy19-hud-coin button,#psy20-hud-coin button,[data-psycoin-help]');if(!b)return;ev.preventDefault();ev.stopPropagation();W.openPsyCoinTutorial?.()},true)}

/* ===== combat move colors + status ===== */
const MOVE_COL={Normal:'#a8a29e',Fogo:'#ef4444',Fire:'#ef4444',Agua:'#0ea5e9','Água':'#0ea5e9',Water:'#0ea5e9',Planta:'#22c55e',Grass:'#22c55e',Eletrico:'#eab308','Elétrico':'#eab308',Electric:'#eab308',Gelo:'#67e8f9',Ice:'#67e8f9',Lutador:'#f97316',Fighting:'#f97316',Veneno:'#a855f7',Poison:'#a855f7',Terra:'#a16207',Ground:'#a16207',Voador:'#60a5fa',Flying:'#60a5fa',Psiquico:'#ec4899','Psíquico':'#ec4899',Psychic:'#ec4899',Inseto:'#84cc16',Bug:'#84cc16',Pedra:'#78716c',Rock:'#78716c',Fantasma:'#8b5cf6',Ghost:'#8b5cf6',Dragao:'#6366f1','Dragão':'#6366f1',Dragon:'#6366f1',Sombrio:'#334155',Dark:'#334155',Metal:'#94a3b8',Steel:'#94a3b8',Fada:'#f472b6',Fairy:'#f472b6'};
const oldMoves=W.loadMoveButtons;W.loadMoveButtons=function(){const r=oldMoves?.apply(this,arguments);const div=$('move-buttons');if(div&&P.team?.[0])[...div.children].forEach((b,i)=>{const m=P.team[0].moves?.[i],c=MOVE_COL[m?.type]||'#0f766e';b.style.background=`linear-gradient(180deg,${c},#071426)`;b.style.borderColor=c;b.style.boxShadow=`0 0 10px ${c}66`});return r};

/* ===== responsive survivor/battle landscape ===== */
const st=D.createElement('style');st.textContent=`
@media (orientation:landscape) and (max-height:600px){#screen-survivor-v12 .psy-v12-surv-top{height:42px!important;padding:4px 8px!important}.psy-v12-surv-canvas{inset:42px 0 0!important;height:calc(100% - 42px)!important}.psy-v12-surv-info{font-size:10px!important}.battle-hud{width:min(94vw,900px)!important;height:min(84vh,500px)!important}.battle-actions{bottom:8px!important}.move-grid button{padding:7px!important;font-size:11px!important}.psy20-panel{max-height:94vh!important;overflow:auto!important}}
.psy-clean-surv{position:fixed;inset:0;background:#031421;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#fff}.psy-clean-surv-top{position:absolute;left:0;right:0;top:0;height:54px;background:linear-gradient(180deg,#050b16,#071426);border-bottom:1px solid #38bdf855;z-index:5;display:grid;grid-template-columns:minmax(220px,1fr) auto minmax(220px,1fr);align-items:center;padding:5px 9px;color:#fff;box-shadow:0 5px 20px #0008}.psy-surv-status{display:flex;align-items:center;gap:7px;min-width:0}.psy-surv-avatar{width:42px;height:42px;border:1px solid #facc1588;border-radius:11px;background:#0b1730;display:grid;place-items:center}.psy-surv-avatar img{width:39px;height:39px;object-fit:contain;image-rendering:pixelated}.psy-surv-bars{width:min(270px,28vw);display:grid;gap:4px}.psy-surv-bars b{font-size:10px;min-width:84px}.psy-surv-hpline,.psy-surv-xpline{display:flex;align-items:center;gap:6px}.psy-surv-bars i{height:8px;border-radius:20px;background:#020617;border:1px solid #ffffff30;flex:1;overflow:hidden}.psy-surv-bars i span{display:block;height:100%;width:0;transition:width .15s}.psy-surv-hpline i span{background:linear-gradient(90deg,#16a34a,#4ade80)}.psy-surv-xpline i span{background:linear-gradient(90deg,#7c3aed,#c084fc)}.psy-surv-center{text-align:center;line-height:1.05;min-width:145px}.psy-surv-center b{font-size:11px;color:#67e8f9;display:block}.psy-surv-center strong{font-size:19px;display:block}.psy-surv-center small{font-size:9px;color:#facc15}.psy-surv-right{display:flex;align-items:center;justify-content:flex-end;gap:10px;font-weight:800;font-size:11px}.psy-surv-pausebtn{width:39px;height:39px;border:1px solid #ffffff35;border-radius:10px;background:#1e293b;color:#fff;font-size:18px;font-weight:900}.psy-clean-surv-pause{display:none;position:absolute;inset:54px 0 0;background:#020617c9;backdrop-filter:blur(4px);z-index:20;align-items:center;justify-content:center}.psy-surv-dialog{width:min(590px,90%);background:linear-gradient(160deg,#0c1d36,#07111f);border:1px solid #38bdf888;border-radius:18px;padding:18px;box-shadow:0 20px 60px #000b,0 0 28px #38bdf822}.psy-surv-dialog h2{margin:0 0 10px;color:#facc15}.psy-surv-pause-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:42vh;overflow:auto}.psy-surv-pause-list>div{display:flex;justify-content:space-between;gap:8px;background:#071426;border:1px solid #24486e;border-radius:9px;padding:7px;font-size:11px}.psy-surv-pause-helpers{grid-column:1/-1}.psy-surv-dialog-actions{display:flex;gap:8px;margin-top:12px}.psy-surv-levelup{display:none;position:absolute;inset:54px 0 0;background:#020617d8;backdrop-filter:blur(3px);z-index:30;align-items:center;justify-content:center;padding:12px;overflow:auto}.psy-surv-levelbox{width:min(1050px,96%)}.psy-surv-level-title{text-align:center;margin-bottom:10px}.psy-surv-level-title span{display:block;color:#67e8f9;font-weight:1000;font-size:24px}.psy-surv-level-title b{font-size:13px;color:#cbd5e1}.psy-surv-upgrid{display:grid;grid-template-columns:repeat(5,minmax(125px,1fr));gap:8px}.psy-surv-upcard{position:relative;min-height:210px;border:2px solid #38bdf888;border-radius:15px;background:linear-gradient(180deg,#102749,#071426);color:#fff;padding:10px;text-align:center;box-shadow:0 10px 30px #0008;overflow:hidden}.psy-surv-upcard.max{border-color:#facc15;box-shadow:0 0 24px #facc1530}.psy-surv-upcard:active{transform:scale(.985)}.psy-surv-upkind{position:absolute;left:7px;top:7px;border-radius:20px;background:#020617cc;padding:3px 7px;font-size:8px;font-weight:900;color:#93c5fd}.psy-surv-upimg{height:76px;display:grid;place-items:center;margin-top:8px}.psy-surv-upimg img{width:76px;height:76px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 0 10px #ffffff55)}.psy-surv-upcard h3{margin:5px 0 2px;font-size:15px}.psy-surv-upcard p{font-size:10px;color:#cbd5e1;min-height:32px;margin:4px 0}.psy-surv-upcard b{font-size:10px;color:#facc15}.psy-surv-touch-stick{position:fixed;width:118px;height:118px;border-radius:50%;border:2px solid #fff2;background:#ffffff08;z-index:1002500;pointer-events:none;opacity:0;transform:translate(-50%,-50%);box-shadow:inset 0 0 28px #38bdf811;transition:opacity .08s}.psy-surv-touch-stick i{position:absolute;left:50%;top:50%;width:46px;height:46px;border-radius:50%;background:#67e8f944;border:2px solid #ffffff66;transform:translate(-50%,-50%);box-shadow:0 0 18px #38bdf855}.psy-helper-tree-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;margin-top:10px}.psy-helper-tree-card{background:linear-gradient(160deg,#0a1728,#050b14);border:1px solid color-mix(in srgb,var(--helper) 60%,#315174);border-radius:16px;padding:11px;box-shadow:0 0 22px color-mix(in srgb,var(--helper) 15%,transparent)}.psy-helper-tree-hero{display:flex;gap:9px;align-items:center;margin-bottom:9px}.psy-helper-tree-hero img{width:70px;height:70px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 0 8px var(--helper))}.psy-helper-tree-hero h3{margin:0;color:var(--helper)}.psy-helper-tree-hero b,.psy-helper-tree-hero small{display:block}.psy-helper-tree-hero small{color:#94a3b8;margin-top:3px}.psy-helper-node{display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #ffffff12;padding:7px 0}.psy-helper-node span small{display:block;color:#94a3b8}.psy-helper-node button{min-width:110px;background:#102749;border:1px solid var(--helper);color:#fff;border-radius:9px;padding:6px;font-weight:900}.psy-helper-node button:disabled{opacity:.6}.psy-clean-result{position:fixed;inset:0;background:#020617;display:flex;align-items:center;justify-content:center;padding:16px;z-index:1001001}@media (orientation:portrait){#screen-survivor-v12 .psy-clean-surv{width:100dvh;height:100dvw;transform:rotate(90deg) translateY(-100%);transform-origin:top left}.psy-surv-upgrid{grid-template-columns:repeat(5,minmax(118px,1fr))}.psy-clean-surv-top{grid-template-columns:minmax(180px,1fr) auto minmax(160px,1fr)}.psy-surv-bars{width:min(250px,24vw)}}@media (max-height:450px){.psy-clean-surv-top{height:48px}.psy-surv-avatar{width:36px;height:36px}.psy-surv-avatar img{width:34px;height:34px}.psy-clean-surv-pause,.psy-surv-levelup{inset:48px 0 0}.psy-surv-upcard{min-height:165px}.psy-surv-upimg{height:52px}.psy-surv-upimg img{width:48px;height:48px}.psy-surv-upcard p{min-height:22px}.psy-surv-level-title span{font-size:18px}}#psy-v12-tab{min-height:120px}.psy22-skilltree{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.psy22-node{background:#081426;border:1px solid #24486e;border-radius:16px;padding:10px;text-align:center;box-shadow:0 0 15px #38bdf822}.psy22-node img{width:72px;height:72px;object-fit:contain;image-rendering:pixelated}.psy22-zonegrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;max-height:60vh;overflow:auto}.psy22-zone{background:#081426;border:1px solid #24486e;border-radius:12px;padding:8px}.psy20-huntgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;max-height:62vh;overflow:auto}.psy20-hunt{background:#081426;border:1px solid #315174;border-radius:14px;padding:10px}.psy20-hunt-pokes{height:60px;display:flex;gap:2px;align-items:center}.psy20-hunt-pokes img{width:48px;height:48px;object-fit:contain;image-rendering:pixelated}`;D.head.appendChild(st);

function tick(){core();installCityJoy();clampCity();installSurvivorJoy();psyV27FastButton();const q=$('psy19-hud-coin')||$('psy20-hud-coin');if(q){const b=q.querySelector('button');if(b){b.type='button';b.onclick=function(ev){ev?.preventDefault?.();ev?.stopPropagation?.();return W.openPsyCoinTutorial?.()}}} }
setInterval(()=>{if(!document.hidden)tick()},2500);setTimeout(tick,100);
console.log('✅ PSYWORLD V47: evolução Shiny direta na árvore corrigida; sem corrida assíncrona do botão JÁ SHINY');
})();
