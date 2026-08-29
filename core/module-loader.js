/* ============================================================
   PSYWORLD — PHYSICAL MODE LOADER (TEST BUILD)
   Mode manifests and shared bundles are requested only when used.
   ============================================================ */
(function(){
'use strict';
const W=window,D=document;
const STORE='psyworld_physical_modes_v1';
const MODES={
  world:{icon:'🌍',name:'WORLD',desc:'Exploração em primeira pessoa, Pokémon no mapa e combate World.',entry:['enterWorldMode']},
  hunts:{icon:'🗺️',name:'HUNTS',desc:'Hunts por região, nível e tipo.',entry:['openHunts']},
  dungeons:{icon:'🏰',name:'DUNGEONS',desc:'Bosses e desafios especiais.',entry:['openDungeons']},
  gyms:{icon:'🏆',name:'GYMS',desc:'Progressão regional de Ginásios.',entry:['openGyms']},
  cards:{icon:'🃏',name:'ÁLBUM / CARDS',desc:'Figurinhas, Packs, Gacha e Cards.',entry:['openCardMode']},
  survivor:{icon:'🦆',name:'PSYDUCK / SURVIVOR',desc:'Psyduck Supremo e Survivor.',entry:['openPsyduckDungeon5','psy19OpenPsyduck']},
  pokedex:{icon:'📘',name:'POKÉDEX',desc:'Pokédex e recompensas.',entry:['openPokedex']},
  eggs:{icon:'🥚',name:'EGG CENTER',desc:'Eggs e incubadoras.',entry:['openEggCenter','psy19OpenEggCenter']},
  quests:{icon:'📜',name:'QUESTS',desc:'Missões e progressão.',entry:['openQuestsV11']},
  achievements:{icon:'🎡',name:'CONQUISTAS / ROLETA',desc:'Conquistas e Roleta.',entry:['openAchievements']},
  afk:{icon:'🌙',name:'MODO AFK',desc:'Expedição AFK e recompensas offline.',entry:['openAfkV9']},
  battlepass:{icon:'🎫',name:'BATTLE PASS',desc:'100 níveis e missões.',entry:['openBattlePass']},
  vip:{icon:'⭐',name:'VIP',desc:'Planos e bônus VIP.',entry:['openVIP']},
  trainer:{icon:'🧑‍🏫',name:'TALENTOS',desc:'Talentos do Treinador.',entry:['openTrainerShop']},
  cashshop:{icon:'💎',name:'CASH SHOP',desc:'Loja premium.',entry:['openCashShop']}
};
const PACKAGES={}, loadedFiles=new Set(), loadingFiles=new Map(), sessionLoaded=new Set();
let state={};try{state=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){state={}}
const saveState=()=>{try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}};
const installed=k=>!!state[k];

W.PSY={
  registerModePackage(k,p){PACKAGES[k]=p},
  isModeInstalled:installed
};

function loadScript(src){
  if(loadedFiles.has(src))return Promise.resolve();
  if(loadingFiles.has(src))return loadingFiles.get(src);
  const p=new Promise((resolve,reject)=>{
    const s=D.createElement('script');s.src=src;s.async=false;s.dataset.psyPhysical='1';
    s.onload=()=>{loadedFiles.add(src);loadingFiles.delete(src);refreshGates();resolve()};
    s.onerror=()=>{loadingFiles.delete(src);reject(new Error('Falha ao carregar '+src))};
    D.head.appendChild(s);
  });
  loadingFiles.set(src,p);return p;
}
async function ensureManifest(k){
  if(PACKAGES[k])return PACKAGES[k];
  await loadScript('modes/'+k+'.js');
  if(!PACKAGES[k])throw new Error('Manifesto do modo não registrado: '+k);
  return PACKAGES[k];
}
async function physicalLoad(k,onProgress){
  const pkg=await ensureManifest(k),deps=pkg.deps||[];
  for(let i=0;i<deps.length;i++){
    onProgress?.(Math.round(((i+0.35)/(deps.length+1))*100));
    await loadScript(deps[i]);
  }
  onProgress?.(100);
  sessionLoaded.add(k);
  refreshGates();
  return pkg;
}
async function ensureMode(k,onProgress){
  if(sessionLoaded.has(k))return PACKAGES[k]||ensureManifest(k);
  return physicalLoad(k,onProgress);
}

function findModeForFn(fn){
  for(const [k,m] of Object.entries(MODES))if(m.entry.includes(fn))return k;
  return null;
}
function gate(fn,k){
  const cur=W[fn];
  if(cur?.__psyPhysicalGate)return;
  const original=typeof cur==='function'?cur:null;
  function wrapped(){
    const args=[...arguments],self=this;
    if(sessionLoaded.has(k)){
      const impl=wrapped.__psyPhysicalOriginal;
      return impl?.apply(self,args);
    }
    if(installed(k)){
      ensureMode(k).then(()=>invokeEntry(k,fn,args,self)).catch(showLoadError);
      return;
    }
    showPrompt(k,()=>ensureMode(k).then(()=>{state[k]=true;saveState();renderManager();decorateButtons();invokeEntry(k,fn,args,self)}).catch(showLoadError));
  }
  wrapped.__psyPhysicalGate=true;
  wrapped.__psyPhysicalOriginal=original;
  W[fn]=wrapped;
}
function ensureEntryStubs(){
  for(const [k,m] of Object.entries(MODES)){
    for(const fn of m.entry){
      if(typeof W[fn]!=='function'){
        const stub=function(){
          const args=[...arguments],self=this;
          if(installed(k)){
            ensureMode(k).then(()=>invokeEntry(k,fn,args,self)).catch(showLoadError);
          }else{
            showPrompt(k,()=>ensureMode(k).then(()=>{
              state[k]=true;saveState();renderManager();decorateButtons();
              invokeEntry(k,fn,args,self);
            }).catch(showLoadError));
          }
        };
        stub.__psyPhysicalGate=true;
        stub.__psyPhysicalOriginal=null;
        W[fn]=stub;
      }
    }
  }
}
function refreshGates(){
  ensureEntryStubs();
  for(const [k,m] of Object.entries(MODES)){
    for(const fn of m.entry){
      const cur=W[fn];
      if(sessionLoaded.has(k)){
        if(cur?.__psyPhysicalGate && cur.__psyPhysicalOriginal)W[fn]=cur.__psyPhysicalOriginal;
      }else{
        gate(fn,k);
      }
    }
  }
  decorateButtons();
}
function invokeEntry(k,fn,args,self){
  refreshGates();
  const f=W[fn];
  if(typeof f==='function'&&!f.__psyPhysicalGate)return f.apply(self,args||[]);
  const pkg=PACKAGES[k],candidate=(pkg?.entry||[]).map(x=>W[x]).find(x=>typeof x==='function'&&!x.__psyPhysicalGate);
  if(candidate)return candidate.apply(self,args||[]);
  throw new Error('Entrada do modo não encontrada: '+fn);
}
function showLoadError(e){
  console.error(e);
  try{W.notif?.('❌ Não foi possível carregar o módulo. Use o servidor local do ZIP.',4200)}catch(_){alert(e.message)}
}

function modeFromButton(b){
  if(!b)return null;
  const oc=String(b.getAttribute?.('onclick')||'');
  for(const [k,m] of Object.entries(MODES))if(m.entry.some(fn=>oc.includes(fn+'(')||oc.includes('window.'+fn+'(')))return k;
  const t=String(b.textContent||'').toUpperCase();
  if(/\bWORLD\b/.test(t))return'world'; if(t.includes('HUNTS'))return'hunts';
  if(t.includes('DUNGEON'))return'dungeons'; if(t.includes('GYM')||t.includes('GINÁSIO'))return'gyms';
  if(t.includes('CARDS')||t.includes('ÁLBUM'))return'cards'; if(t.includes('SURVIVOR')||t.includes('PSYDUCK SUPREMO'))return'survivor';
  if(t.includes('POKÉDEX'))return'pokedex'; if(t.includes('EGG CENTER'))return'eggs'; if(t.includes('QUEST'))return'quests';
  if(t.includes('CONQUISTA')||t.includes('ROLETA'))return'achievements'; if(t.includes('MODO AFK')||t.includes('EXPEDIÇÃO AFK'))return'afk';
  if(t.includes('BATTLE PASS')||t.includes('PASSE'))return'battlepass'; if(/\bVIP\b/.test(t))return'vip';
  if(t.includes('TALENTOS'))return'trainer'; if(t.includes('CASH SHOP'))return'cashshop';
  return null;
}
function decorateButtons(){
  D.querySelectorAll('button').forEach(b=>{
    const k=modeFromButton(b);if(!k)return;
    b.dataset.psyModule=k;b.dataset.psyInstalled=installed(k)?'1':'0';
    b.title=(installed(k)?'✓ Instalado':'⬇ Baixar modo')+' — '+MODES[k].name;
  });
}

function ensureUI(){
  if(!D.getElementById('psy-mode-download-screen')){
    const s=D.createElement('div');s.id='psy-mode-download-screen';
    s.innerHTML=`<div class="psy-mode-manager">
      <div class="psy-mode-manager-head"><div><h2>⬇ MODOS / DOWNLOADS</h2><p>Nesta versão modular, os arquivos JavaScript dos modos são carregados fisicamente somente quando necessários. Sprites do Survivor também ficam em arquivos separados.</p></div><button class="psy-mode-close" onclick="psyCloseModeManager()">×</button></div>
      <div class="psy-mode-top-actions"><button class="psy-mode-action all" onclick="psyInstallAllModes()">⬇ BAIXAR TODOS</button><button class="psy-mode-action" onclick="psyRefreshModeManager()">↻ ATUALIZAR</button></div>
      <div id="psy-mode-grid" class="psy-mode-grid"></div>
    </div>`;D.body.appendChild(s);
  }
  if(!D.getElementById('psy-mode-intro')){
    const i=D.createElement('div');i.id='psy-mode-intro';
    i.innerHTML=`<div class="psy-mode-intro-box"><div class="duck">🦆</div><h2>MODOS DO PSYWORLD</h2><p><b>Psyworld possui variações de modos jogáveis, você pode acessar o botão menu e selecionar o modo que queira baixar, ou todos se assim desejar!</b></p><div class="actions"><button onclick="psyCloseModeIntro()">ENTENDI</button><button class="primary" onclick="psyCloseModeIntro();psyOpenModeManager()">⬇ ESCOLHER MODOS</button></div></div>`;
    D.body.appendChild(i);
  }
}
function renderManager(){
  ensureUI();const g=D.getElementById('psy-mode-grid');if(!g)return;
  g.innerHTML=Object.entries(MODES).map(([k,m])=>`<div class="psy-mode-card ${installed(k)?'installed':''}" data-mode-card="${k}"><div class="icon">${m.icon}</div><h3>${m.name}</h3><small>${m.desc}</small><div class="psy-mode-status">${installed(k)?'✓ INSTALADO':'⬇ NÃO INSTALADO'}</div><div class="psy-mode-progress"><i></i></div><button onclick="psyInstallMode('${k}')">${installed(k)?'✓ INSTALADO':'⬇ BAIXAR MODO'}</button></div>`).join('');
}
W.psyOpenModeManager=function(){ensureUI();renderManager();D.getElementById('psy-mode-download-screen').classList.add('show')};
W.psyCloseModeManager=function(){D.getElementById('psy-mode-download-screen')?.classList.remove('show')};
W.psyRefreshModeManager=function(){try{state=JSON.parse(localStorage.getItem(STORE)||'{}')||{}}catch(e){}renderManager();decorateButtons()};
W.psyCloseModeIntro=function(){D.getElementById('psy-mode-intro')?.classList.remove('show')};

W.psyInstallMode=async function(k,after){
  if(!MODES[k])return;
  if(installed(k)&&sessionLoaded.has(k)){after?.();return}
  ensureUI();renderManager();
  const card=D.querySelector(`[data-mode-card="${k}"]`),bar=card?.querySelector('.psy-mode-progress i');
  card?.classList.add('downloading');
  try{
    await ensureMode(k,p=>{if(bar)bar.style.width=p+'%'});
    state[k]=true;saveState();renderManager();decorateButtons();
    try{W.notif?.(`✅ ${MODES[k].name} carregado!`,2000)}catch(e){}
    after?.();
  }catch(e){showLoadError(e);renderManager()}
};
W.psyInstallAllModes=async function(){
  for(const k of Object.keys(MODES))if(!installed(k)||!sessionLoaded.has(k))await W.psyInstallMode(k);
  try{W.notif?.('✅ Todos os módulos foram carregados.',2200)}catch(e){}
};

function showPrompt(k,go){
  ensureUI();let p=D.getElementById('psy-mode-install-prompt');
  if(!p){p=D.createElement('div');p.id='psy-mode-install-prompt';p.style.cssText='position:fixed;inset:0;z-index:1250000;background:#020617ee;display:flex;align-items:center;justify-content:center;padding:18px';D.body.appendChild(p)}
  const m=MODES[k];W.__psyPhysicalPending=go;
  p.innerHTML=`<div class="psy-mode-intro-box"><div class="duck">${m.icon}</div><h2>${m.name}</h2><p>Este modo está em um arquivo separado e ainda não foi carregado nesta instalação.</p><div class="actions"><button onclick="document.getElementById('psy-mode-install-prompt')?.remove();window.__psyPhysicalPending=null">CANCELAR</button><button class="primary" onclick="psyConfirmPhysicalInstall()">⬇ BAIXAR E ABRIR</button></div></div>`;
}
W.psyConfirmPhysicalInstall=function(){const f=W.__psyPhysicalPending;W.__psyPhysicalPending=null;D.getElementById('psy-mode-install-prompt')?.remove();f?.()};

function addMenuButton(){
  const menu=D.getElementById('menu');if(!menu||menu.querySelector('[data-psy-mode-manager]'))return;
  const b=D.createElement('button');b.type='button';b.dataset.psyModeManager='1';b.className='psy-mode-download-menu';b.innerHTML='⬇ MODOS / DOWNLOADS';b.onclick=W.psyOpenModeManager;
  const grid=menu.querySelector('.psy-main-grid');(grid||menu).appendChild(b);
}
function maybeIntro(){
  const game=D.getElementById('game-wrap');if(!game||getComputedStyle(game).display==='none')return;
  let n='player';try{n=String(W.P?.name||W.P?.nickname||'player').trim()||'player'}catch(e){}
  const key='psyworld_physical_intro_'+encodeURIComponent(n.toLowerCase());
  try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1')}catch(e){}
  ensureUI();setTimeout(()=>D.getElementById('psy-mode-intro')?.classList.add('show'),250);
}
W.psyMaybeShowModuleIntro=maybeIntro;

const oldToggle=W.toggleMenu;if(typeof oldToggle==='function'){W.toggleMenu=function(){const r=oldToggle.apply(this,arguments);setTimeout(()=>{addMenuButton();decorateButtons()},0);return r};try{toggleMenu=W.toggleMenu}catch(e){}}
const oldConfirm=W.confirmStarter;if(typeof oldConfirm==='function'){W.confirmStarter=function(){const r=oldConfirm.apply(this,arguments);setTimeout(maybeIntro,450);return r};try{confirmStarter=W.confirmStarter}catch(e){}}

refreshGates();ensureUI();addMenuButton();decorateButtons();setTimeout(()=>{refreshGates();addMenuButton();maybeIntro()},700);
const mo=new MutationObserver(()=>{addMenuButton();decorateButtons()});mo.observe(D.body,{childList:true,subtree:true});
console.log('✅ PSYWORLD physical module loader ready');
})();
