/* PSYWORLD GLOBAL HUB V3 — uma entrada única para menus, coleção e conta. */
(function(W,D){
  'use strict';
  if(W.PSY_GLOBAL_HUB_V3)return;
  W.PSY_GLOBAL_HUB_V3=true;

  const STORE='psyworld_global_hub_v3';
  const LANGS={
    'pt-BR':{flag:'🇧🇷',name:'Português — Brasil'},
    'pt-PT':{flag:'🇵🇹',name:'Português — Portugal'},
    en:{flag:'🇺🇸',name:'English'},
    fr:{flag:'🇫🇷',name:'Français'},
    de:{flag:'🇩🇪',name:'Deutsch'},
    ar:{flag:'🇸🇦',name:'العربية'},
    es:{flag:'🇪🇸',name:'Español'}
  };
  const TEXT={
    'pt-BR':{menu:'MENU',inventory:'BOLSA',shop:'LOJA',team:'TIME / BOX',album:'ÁLBUM',eggs:'OVOS',skills:'HABILIDADES',evolutions:'EVOLUÇÕES',books:'MAGIC BOOKS',cards:'CARDS',adventureShop:'LOJA AVENTURA',quests:'QUESTS',achievements:'CONQUISTAS',pokedex:'POKÉDEX',dungeons:'DUNGEONS',hunts:'HUNTS',gyms:'GINÁSIOS',afk:'MODO AFK',survivor:'SURVIVOR / PSYDUCK',battlepass:'BATTLE PASS',vip:'VIP',trainer:'TALENTOS',cash:'CASH SHOP',heal:'CURAR',adventure:'AVENTURA',world:'WORLD',moveHud:'AJUSTAR CONTROLES',config:'CONFIG',close:'FECHAR',general:'GERAL',language:'IDIOMA',hotkeys:'HOTKEYS',sound:'SOM',save:'SALVAR',load:'CARREGAR',choose:'Escolha um idioma'},
    'pt-PT':{menu:'MENU',inventory:'INVENTÁRIO',shop:'LOJA',team:'EQUIPA / BOX',album:'ÁLBUM',eggs:'OVOS',skills:'HABILIDADES',evolutions:'EVOLUÇÕES',books:'LIVROS MÁGICOS',cards:'CARTAS',adventureShop:'LOJA AVENTURA',quests:'MISSÕES',achievements:'CONQUISTAS',pokedex:'POKÉDEX',dungeons:'MASMORRAS',hunts:'CAÇADAS',gyms:'GINÁSIOS',afk:'MODO AFK',survivor:'SURVIVOR / PSYDUCK',battlepass:'PASSE DE BATALHA',vip:'VIP',trainer:'TALENTOS',cash:'LOJA PREMIUM',heal:'CURAR',adventure:'AVENTURA',world:'WORLD',moveHud:'AJUSTAR CONTROLOS',config:'CONFIGURAÇÕES',close:'FECHAR',general:'GERAL',language:'IDIOMA',hotkeys:'ATALHOS',sound:'SOM',save:'GUARDAR',load:'CARREGAR',choose:'Escolha um idioma'},
    en:{menu:'MENU',inventory:'INVENTORY',shop:'SHOP',team:'TEAM / BOX',album:'ALBUM',eggs:'EGGS',skills:'SKILLS',evolutions:'EVOLUTIONS',books:'MAGIC BOOKS',cards:'CARDS',adventureShop:'ADVENTURE SHOP',quests:'QUESTS',achievements:'ACHIEVEMENTS',pokedex:'POKÉDEX',dungeons:'DUNGEONS',hunts:'HUNTS',gyms:'GYMS',afk:'AFK MODE',survivor:'SURVIVOR / PSYDUCK',battlepass:'BATTLE PASS',vip:'VIP',trainer:'TRAINER TALENTS',cash:'CASH SHOP',heal:'HEAL',adventure:'ADVENTURE',world:'WORLD',moveHud:'ADJUST CONTROLS',config:'SETTINGS',close:'CLOSE',general:'GENERAL',language:'LANGUAGE',hotkeys:'HOTKEYS',sound:'SOUND',save:'SAVE',load:'LOAD',choose:'Choose a language'},
    fr:{menu:'MENU',inventory:'SAC',shop:'BOUTIQUE',team:'ÉQUIPE / BOÎTE',album:'ALBUM',eggs:'ŒUFS',skills:'COMPÉTENCES',evolutions:'ÉVOLUTIONS',books:'LIVRES MAGIQUES',cards:'CARTES',adventureShop:'BOUTIQUE AVENTURE',quests:'QUÊTES',achievements:'SUCCÈS',pokedex:'POKÉDEX',dungeons:'DONJONS',hunts:'CHASSES',gyms:'ARÈNES',afk:'MODE AFK',survivor:'SURVIVOR / PSYDUCK',battlepass:'PASSE DE COMBAT',vip:'VIP',trainer:'TALENTS',cash:'BOUTIQUE PREMIUM',heal:'SOIGNER',adventure:'AVENTURE',world:'MONDE',moveHud:'AJUSTER LES COMMANDES',config:'CONFIGURATION',close:'FERMER',general:'GÉNÉRAL',language:'LANGUE',hotkeys:'TOUCHES',sound:'SON',save:'SAUVEGARDER',load:'CHARGER',choose:'Choisissez une langue'},
    de:{menu:'MENÜ',inventory:'INVENTAR',shop:'SHOP',team:'TEAM / BOX',album:'ALBUM',eggs:'EIER',skills:'FÄHIGKEITEN',evolutions:'ENTWICKLUNGEN',books:'MAGISCHE BÜCHER',cards:'KARTEN',adventureShop:'ABENTEUER-SHOP',quests:'QUESTS',achievements:'ERFOLGE',pokedex:'POKÉDEX',dungeons:'DUNGEONS',hunts:'JAGDEN',gyms:'ARENEN',afk:'AFK-MODUS',survivor:'SURVIVOR / PSYDUCK',battlepass:'BATTLE PASS',vip:'VIP',trainer:'TRAINER-TALENTE',cash:'CASH-SHOP',heal:'HEILEN',adventure:'ABENTEUER',world:'WELT',moveHud:'STEUERUNG ANPASSEN',config:'EINSTELLUNGEN',close:'SCHLIESSEN',general:'ALLGEMEIN',language:'SPRACHE',hotkeys:'TASTEN',sound:'TON',save:'SPEICHERN',load:'LADEN',choose:'Sprache wählen'},
    ar:{menu:'القائمة',inventory:'الحقيبة',shop:'المتجر',team:'الفريق',album:'الألبوم',eggs:'البيض',skills:'المهارات',evolutions:'التطورات',books:'الكتب السحرية',cards:'البطاقات',adventureShop:'متجر المغامرة',quests:'المهام',achievements:'الإنجازات',pokedex:'موسوعة بوكيمون',dungeons:'الزنزانات',hunts:'الصيد',gyms:'الصالات',afk:'وضع AFK',survivor:'البقاء',battlepass:'بطاقة المعركة',vip:'VIP',trainer:'مواهب المدرب',cash:'المتجر المميز',heal:'علاج',adventure:'المغامرة',world:'العالم',moveHud:'تعديل التحكم',config:'الإعدادات',close:'إغلاق',general:'عام',language:'اللغة',hotkeys:'اختصارات',sound:'الصوت',save:'حفظ',load:'تحميل',choose:'اختر لغة'},
    es:{menu:'MENÚ',inventory:'INVENTARIO',shop:'TIENDA',team:'EQUIPO / CAJA',album:'ÁLBUM',eggs:'HUEVOS',skills:'HABILIDADES',evolutions:'EVOLUCIONES',books:'LIBROS MÁGICOS',cards:'CARTAS',adventureShop:'TIENDA AVENTURA',quests:'MISIONES',achievements:'LOGROS',pokedex:'POKÉDEX',dungeons:'MAZMORRAS',hunts:'CAZAS',gyms:'GIMNASIOS',afk:'MODO AFK',survivor:'SURVIVOR / PSYDUCK',battlepass:'PASE DE BATALLA',vip:'VIP',trainer:'TALENTOS',cash:'TIENDA PREMIUM',heal:'CURAR',adventure:'AVENTURA',world:'MUNDO',moveHud:'AJUSTAR CONTROLES',config:'CONFIGURACIÓN',close:'CERRAR',general:'GENERAL',language:'IDIOMA',hotkeys:'ATAJOS',sound:'SONIDO',save:'GUARDAR',load:'CARGAR',choose:'Elige un idioma'}
  };
  const TIERS=['E','D','C','B','A','S','SS','SSS','UR','UR+','UR++'];
  const CARD_BUFF={E:3,D:5,C:7,B:10,A:15,S:20,SS:50,SSS:100,UR:150,'UR+':200,'UR++':300};
  const TIER_COLOR={E:'#f8fafc',D:'#94a3b8',C:'#3b82f6',B:'#a855f7',A:'#fb923c',S:'#f97316',SS:'#ef4444',SSS:'#f43f5e',UR:'#facc15','UR+':'#c084fc','UR++':'#22d3ee'};
  const DEFAULT_KEYS={menu:'Escape',inventory:'KeyI',album:'KeyL',eggs:'KeyO',team:'KeyT',skills:'KeyK',evolutions:'KeyE',shop:'KeyH',books:'KeyM',cards:'KeyC',basic:'Digit1',skill1:'Digit2',skill2:'Digit3',special:'Digit4',jump:'Space',potion:'KeyP',up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
  const KEY_LABEL={menu:'Menu',inventory:'Inventário',album:'Álbum',eggs:'Ovos',team:'Time',skills:'Habilidades',evolutions:'Evoluções',shop:'Loja aventura',books:'Magic Books',cards:'Cards',basic:'Ataque básico',skill1:'Habilidade 1',skill2:'Habilidade 2',special:'Especial',jump:'Pular',potion:'Poção',up:'Movimentação cima',down:'Movimentação baixo',left:'Movimentação esquerda',right:'Movimentação direita'};
  let cfg={language:'pt-BR',keys:{...DEFAULT_KEYS},sound:{master:1,music:1,sfx:1,voice:1}};
  try{cfg={...cfg,...JSON.parse(localStorage.getItem(STORE)||'{}')};cfg.keys={...DEFAULT_KEYS,...(cfg.keys||{})};delete cfg.keys.skill3;cfg.sound={...{master:1,music:1,sfx:1,voice:1},...(cfg.sound||{})}}catch(e){}
  const tr=k=>(TEXT[cfg.language]||TEXT['pt-BR'])[k]||TEXT['pt-BR'][k]||k;
  const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const saveCfg=()=>{try{localStorage.setItem(STORE,JSON.stringify(cfg))}catch(e){}};
  function profile(){return W.P||null}
  function notify(msg){try{W.notif?.(msg,2600)}catch(e){console.log(msg)}}
  function activeAdventure(){const el=D.getElementById('psy-adventure');return !!el&&getComputedStyle(el).display!=='none'}
  function getRoot(id){let el=D.getElementById(id);if(!el){el=D.createElement('div');el.id=id;D.body.appendChild(el)}return el}
  function setText(el,value){if(el&&el.textContent!==String(value))el.textContent=String(value)}
  function setDisplay(el,value){if(el&&el.style.display!==value)el.style.display=value}
  function addStyle(){
    if(D.getElementById('psy-global-hub-style'))return;
    const s=D.createElement('style');s.id='psy-global-hub-style';s.textContent=`
      #psy-global-menu,#psy-global-config,#psy-global-language,#psy-unified-album{position:fixed;inset:0;z-index:2000000;display:none;align-items:center;justify-content:center;padding:14px;background:radial-gradient(circle at 50% 8%,#12355acc,#020617f5 72%);font-family:Inter,system-ui,sans-serif;color:#eaf8ff}
      #psy-global-menu.show,#psy-global-config.show,#psy-global-language.show,#psy-unified-album.show{display:flex}
      .psy-gh-panel{width:min(960px,96vw);max-height:92vh;overflow:auto;border:1px solid #67e8f9;border-radius:26px;background:linear-gradient(145deg,#071827f8,#111a38f7);box-shadow:0 24px 100px #000d,0 0 42px #22d3ee33;padding:18px}
      .psy-gh-head{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #38bdf866;padding-bottom:12px}.psy-gh-title{font-size:clamp(20px,4vw,31px);font-weight:1000;color:#fef3c7}.psy-gh-sub{color:#7dd3fc;font-size:11px;margin-top:4px}
      .psy-gh-close,.psy-gh-tab,.psy-gh-action,.psy-gh-key{border:1px solid #67e8f9;border-radius:11px;background:linear-gradient(180deg,#164e63,#071827);color:#fff;font-weight:1000;padding:9px 12px;cursor:pointer}.psy-gh-close{font-size:22px;background:linear-gradient(#ef4444,#991b1b);border-color:#fecaca}
      .psy-gh-wallet{display:flex;flex-wrap:wrap;gap:8px;margin:13px 0}.psy-gh-wallet span{border:1px solid #facc15;border-radius:999px;background:#2b210d;padding:7px 11px;color:#fef3c7;font-size:12px;font-weight:900}
      .psy-gh-section{color:#facc15;font-weight:1000;font-size:11px;letter-spacing:.14em;margin:15px 0 8px}.psy-gh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}.psy-gh-action{min-height:58px;text-align:left;box-shadow:inset 0 1px #fff1,0 8px 18px #0005}.psy-gh-action:hover,.psy-gh-tab:hover{filter:brightness(1.2);transform:translateY(-1px)}.psy-gh-action small{display:block;color:#7dd3fc;font-size:9px;margin-top:3px}
      .psy-gh-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;border-bottom:1px solid #ffffff12;padding:10px 0}.psy-gh-row small{display:block;color:#7dd3fc;font-size:10px}.psy-gh-key{min-width:112px;background:#0f2740}.psy-gh-language-grid,.psy-gh-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-top:14px}
      .psy-gh-lang{display:flex;align-items:center;gap:9px;border:1px solid #31597d;border-radius:13px;background:#071827;color:#fff;padding:11px;text-align:left;font-weight:900}.psy-gh-lang.active{border-color:#facc15;box-shadow:0 0 18px #facc1544}.psy-gh-lang i{font-size:25px;font-style:normal}
      .psy-gh-card{border:1px solid var(--tier);border-radius:15px;background:linear-gradient(145deg,#102b43,#071322);padding:10px;box-shadow:inset 0 1px #fff1,0 8px 18px #0005}.psy-gh-card img{display:block;width:112px;height:112px;object-fit:contain;margin:auto;filter:drop-shadow(0 5px 9px #0009)}.psy-gh-card b,.psy-gh-card span,.psy-gh-card small{display:block;margin-top:5px}.psy-gh-card span,.psy-gh-card small{color:#bae6fd;font-size:10px}.psy-gh-card button{width:100%;margin-top:8px;padding:7px;border:1px solid var(--tier);border-radius:9px;background:#082f49;color:#fff;font-weight:900}
      .psy-gh-range{width:min(300px,55vw);accent-color:#67e8f9}.psy-gh-start{position:absolute;right:12px;top:12px;border:1px solid #67e8f9;border-radius:10px;background:#082f49;color:#fff;padding:8px 10px;font-weight:900;cursor:pointer}
      @media(max-width:520px){.psy-gh-panel{padding:12px}.psy-gh-grid{grid-template-columns:1fr 1fr}.psy-gh-action{min-height:52px;padding:8px;font-size:11px}.psy-gh-row{grid-template-columns:1fr}.psy-gh-key,.psy-gh-range{width:100%}}
    `;D.head.appendChild(s)
  }

  const actions=[
    ['world','🌍','world'],['inventory','🎒','openBag'],['shop','🏪','openShop'],['team','👥','openTeam'],['album','📒','album'],['eggs','🥚','eggs'],['skills','🧠','skills'],['evolutions','🧬','evolutions'],
    ['quests','📜','openQuestsV11'],['achievements','🏆','openAchievements'],['pokedex','📘','openPokedex'],['dungeons','🏰','openDungeons'],['hunts','🗺️','openHunts'],['gyms','🏅','openGyms'],['afk','🌙','openAfkV9'],['survivor','🦆','survivor'],['battlepass','🎫','openBattlePass'],['vip','⭐','openVIP'],['trainer','🧑‍🏫','openTrainerShop'],['heal','💚','heal']
  ];
  function invoke(kind){
    if(kind==='adventure')return W.openAdventureMode?.();
    if(kind==='world')return W.enterWorldMode?.();
    if(kind==='team'&&activeAdventure()&&typeof W.showAdventureTeam==='function')return W.showAdventureTeam();
    if(kind==='afk'&&activeAdventure()&&typeof W.showAdventureAfk==='function')return W.showAdventureAfk();
    if(kind==='album')return activeAdventure()&&typeof W.showAdventureAlbum==='function'?W.showAdventureAlbum('codex'):(typeof W.openCardMode==='function'?W.openCardMode():openCards());
    if(kind==='eggs')return activeAdventure()&&typeof W.showEggPanel==='function'?W.showEggPanel():W.openEggCenter?.();
    if(kind==='cards')return activeAdventure()&&typeof W.showAdventureCards==='function'?W.showAdventureCards():(typeof W.openCardMode==='function'?W.openCardMode():openCards());
    if(kind==='skills')return activeAdventure()&&typeof W.showAdventureTree==='function'?W.showAdventureTree():W.openTrainerShop?.();
    if(kind==='evolutions')return activeAdventure()&&typeof W.showAdventureAlbum==='function'?W.showAdventureAlbum('evolutions'):W.openTeam?.();
    if(kind==='books')return activeAdventure()&&typeof W.showAdventureMagicBooks==='function'?W.showAdventureMagicBooks():notify('Magic Books ficam disponíveis na Aventura.');
    if(kind==='adventureShop')return activeAdventure()&&typeof W.showAdventureShopV54==='function'?W.showAdventureShopV54('store'):notify('Abra o Modo Aventura para acessar a loja da aventura.');
    if(kind==='moveHud')return activeAdventure()&&typeof W.adventureMoveHud==='function'?W.adventureMoveHud():notify('O ajuste de controles só está disponível na Aventura.');
    if(kind==='survivor')return W.openPsyduckDungeon5?.()||W.psy19OpenPsyduck?.();
    if(kind==='heal')return W.curarTimeCity?.()||W.openBag?.();
    const fn=kind==='openQuestsV11'?'openQuestsV11':kind;
    if(typeof W[fn]==='function')return W[fn]();
    return notify('Este módulo ainda não foi carregado.');
  }
  function openMenu(){
    // O Mundo Aventura tem seu próprio hub consolidado. O hub global da
    // cidade não deve abrir por cima dele nem reutilizar seus painéis.
    if(activeAdventure()){
      closeMenu();
      return W.PSY?.adventureSystemsV63?.openMenu?.()||W.showAdventureMenu?.();
    }
    // Na cidade, o botão MENU volta a abrir o menu legado do Mundo Pokémon.
    // Ele contém o álbum de figurinhas original (screen-card-mode/v15),
    // incluindo coleção, deck, gacha e os sistemas já existentes do Mundo.
    if(typeof W.toggleMenu==='function')return W.toggleMenu();
    addStyle();
    const r=getRoot('psy-global-menu');r.className='show';
    const x=profile()||{},gold=Number(x.gold||0),diamonds=Number(x.diamonds||0),psy=Number(x.psyCoin||x.psycoin||0);
    const groups=[actions.slice(0,12),actions.slice(12)];
    let h='<div class="psy-gh-panel"><div class="psy-gh-head"><div><div class="psy-gh-title">☰ '+esc(tr('menu'))+' PSYWORLD</div><div class="psy-gh-sub">Uma entrada única. Moedas, inventário e progresso são compartilhados.</div></div><button class="psy-gh-close" data-close>×</button></div><div class="psy-gh-wallet"><span>💰 '+gold.toLocaleString('pt-BR')+' Gold</span><span>💎 '+diamonds.toLocaleString('pt-BR')+' Diamantes</span><span>🪙 '+psy.toLocaleString('pt-BR')+' PsyCoin</span></div>';
    groups.forEach((group,i)=>{h+='<div class="psy-gh-section">'+(i?'SISTEMAS':'JOGAR E COLECIONAR')+'</div><div class="psy-gh-grid">'+group.map(a=>'<button class="psy-gh-action" data-action="'+a[2]+'">'+a[1]+' '+esc(tr(a[0]))+'<small>'+((a[0]==='album')?'Ovos • Stars • Cards • Codex • Evoluções':'Abrir sistema')+'</small></button>').join('')+'</div>'});
    h+='<div class="psy-gh-section">CONTA</div><div class="psy-gh-grid"><button class="psy-gh-action" data-config>⚙️ '+esc(tr('config'))+'<small>Idioma, hotkeys e som</small></button><button class="psy-gh-action" data-save>💾 '+esc(tr('save'))+'</button><button class="psy-gh-action" data-load>📂 '+esc(tr('load'))+'</button><button class="psy-gh-action" data-download>⬇ BAIXAR SAVE.PSY</button><button class="psy-gh-action" data-upload>⬆ CARREGAR ARQUIVO.PSY</button></div></div>';
    r.innerHTML=h;r.querySelector('[data-close]').onclick=closeMenu;r.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{closeMenu();invoke(b.dataset.action)});r.querySelector('[data-config]').onclick=()=>openConfig('general');r.querySelector('[data-save]').onclick=()=>W.saveGame?.();r.querySelector('[data-load]').onclick=()=>W.loadGame?.();r.querySelector('[data-download]').onclick=()=>W.downloadSave?.();r.querySelector('[data-upload]').onclick=()=>D.getElementById('fileInput')?.click();setDisplay(D.getElementById('menu'),'none')
  }
  function closeMenu(){D.getElementById('psy-global-menu')?.classList.remove('show')}
  function openConfig(tab){
    const r=getRoot('psy-global-config');r.className='show';let body='';
    if(tab==='hotkeys'){
      body='<p class="psy-gh-sub">Clique numa função e pressione uma tecla, botão do mouse ou botão do controle.</p>'+Object.keys(KEY_LABEL).map(k=>'<div class="psy-gh-row"><div><b>'+esc(KEY_LABEL[k])+'</b><small>'+esc(k)+'</small></div><button class="psy-gh-key" data-key="'+esc(k)+'">'+esc(cfg.keys[k])+'</button></div>').join('')+'<button class="psy-gh-tab" data-reset>↻ Restaurar padrão</button>';
    }else if(tab==='sound'){
      body=['master','music','sfx','voice'].map(k=>'<div class="psy-gh-row"><div><b>'+({master:'Volume geral',music:'Música',sfx:'Efeitos',voice:'Voz dos NPCs'}[k])+'</b><small>'+Math.round(Number(cfg.sound[k])*100)+'%</small></div><input class="psy-gh-range" type="range" min="0" max="1" step=".01" value="'+Number(cfg.sound[k])+'" data-sound-level="'+k+'"></div>').join('');
    }else{
      body='<div class="psy-gh-row"><div><b>'+esc(tr('language'))+'</b><small>Texto e voz dos NPCs.</small></div><button class="psy-gh-tab" data-language>'+LANGS[cfg.language].flag+' '+esc(LANGS[cfg.language].name)+'</button></div><div class="psy-gh-row"><div><b>'+esc(tr('hotkeys'))+'</b><small>Teclado, mouse e gamepad.</small></div><button class="psy-gh-tab" data-tab="hotkeys">'+esc(tr('hotkeys'))+'</button></div><div class="psy-gh-row"><div><b>'+esc(tr('sound'))+'</b><small>Música, efeitos e voz.</small></div><button class="psy-gh-tab" data-tab="sound">'+esc(tr('sound'))+'</button></div>';
    }
    r.innerHTML='<div class="psy-gh-panel"><div class="psy-gh-head"><div><div class="psy-gh-title">⚙️ '+esc(tr('config'))+'</div><div class="psy-gh-sub">'+esc(tr(tab))+'</div></div><button class="psy-gh-close" data-close>×</button></div><div class="psy-gh-grid" style="margin:14px 0"><button class="psy-gh-tab" data-tab="general">'+esc(tr('general'))+'</button><button class="psy-gh-tab" data-tab="hotkeys">'+esc(tr('hotkeys'))+'</button><button class="psy-gh-tab" data-tab="sound">'+esc(tr('sound'))+'</button></div>'+body+'</div>';
    r.querySelector('[data-close]').onclick=()=>r.classList.remove('show');r.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>openConfig(b.dataset.tab));r.querySelector('[data-language]')?.addEventListener('click',openLanguage);r.querySelectorAll('[data-sound-level]').forEach(input=>input.oninput=()=>{cfg.sound[input.dataset.soundLevel]=Number(input.value);saveCfg();applySound();openConfig('sound')});
    if(tab==='hotkeys')captureKeys(r)
  }
  function captureKeys(r){
    let target=null;r.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{target=b.dataset.key;setText(b,'Pressione...')});
    r.addEventListener('keydown',e=>{if(!target)return;e.preventDefault();cfg.keys[target]=e.code||e.key;target=null;saveCfg();openConfig('hotkeys')});
    r.addEventListener('mousedown',e=>{if(!target||e.target.closest('[data-key]'))return;e.preventDefault();cfg.keys[target]='Mouse'+e.button;target=null;saveCfg();openConfig('hotkeys')});
    r.querySelector('[data-reset]')?.addEventListener('click',()=>{cfg.keys={...DEFAULT_KEYS};saveCfg();openConfig('hotkeys')})
  }
  function openLanguage(){
    const r=getRoot('psy-global-language');r.className='show';r.innerHTML='<div class="psy-gh-panel"><div class="psy-gh-head"><div><div class="psy-gh-title">🌐 '+esc(tr('language'))+'</div><div class="psy-gh-sub">'+esc(tr('choose'))+'</div></div><button class="psy-gh-close" data-close>×</button></div><div class="psy-gh-language-grid">'+Object.entries(LANGS).map(([id,l])=>'<button class="psy-gh-lang '+(id===cfg.language?'active':'')+'" data-lang="'+id+'"><i>'+l.flag+'</i><span>'+esc(l.name)+'</span></button>').join('')+'</div></div>';
    r.querySelector('[data-close]').onclick=()=>r.classList.remove('show');r.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{cfg.language=b.dataset.lang;saveCfg();r.classList.remove('show');applyLanguage();openConfig('general')})
  }
  function applySound(){
    const master=Math.max(0,Math.min(1,Number(cfg.sound.master)||0));
    D.querySelectorAll('audio,video').forEach(el=>{if(!el.dataset.psyOriginalVolume)el.dataset.psyOriginalVolume=String(el.volume||1);el.volume=Number(el.dataset.psyOriginalVolume)*master});
    try{W.psyAudio?.setMasterVolume?.(master);W.psyAudio?.setMusicVolume?.(Number(cfg.sound.music));W.psyAudio?.setSfxVolume?.(Number(cfg.sound.sfx));W.psyNpcVoice?.setVolume?.(Number(cfg.sound.voice))}catch(e){}
  }
  function applyLanguage(){
    const changed=D.documentElement.lang!==cfg.language;
    D.documentElement.lang=cfg.language;
    const login=D.getElementById('login-box');
    if(login){let b=login.querySelector('[data-psy-start-language]');if(!b){b=D.createElement('button');b.dataset.psyStartLanguage='1';b.className='psy-gh-start';login.style.position='relative';login.appendChild(b);b.onclick=openLanguage}setText(b,LANGS[cfg.language].flag+' '+tr('language'))}
    if(W.psyNpcVoice?.settings)W.psyNpcVoice.settings.language=cfg.language;
    try{W.psyNpcVoice?.setLanguage?.(cfg.language);if(changed)W.updateHUD?.()}catch(e){}
  }
  function adventureDisplayName(value){
    const raw=typeof value==='object'?value?.name:value;
    const runtime=W.PSY?.adventureRuntime;
    let name=runtime?.creatureLabel?.(raw)||raw||'Criatura';
    return name==='Bellsprout'||name==='Belsprout'||name==='Florvânti'?'Floravanti':String(name)
  }
  function ensureCards(){
    const x=profile();if(!x)return{};x.meta=x.meta||{};const m=x.meta.unifiedCards||(x.meta.unifiedCards={});
    if(!x.meta.unifiedCardsMigrated){
      for(const [k,v] of Object.entries(x.meta.adventureCards||{})){const p=String(k).split('|');const name=adventureDisplayName(p[0]);m['a:'+name+'|'+(p[1]||'E')]={id:null,name,tier:p[1]||'E',copies:Number(v||0)}}
      for(const c of Object.values(x.cardGame?.collection||{})){const tier=c.cardTier||c.tier||'E';const id=Number(c.id);const name=W.getPokeName?.(id)||String(c.id);m['p:'+c.id+'|'+tier]={id:Number.isFinite(id)?id:null,name,tier,copies:Number(c.copies||1)}}
      x.meta.unifiedCardsMigrated=true;try{W.autoSave?.()}catch(e){}
    }
    return m
  }
  function cardName(mon){return adventureDisplayName(typeof mon==='number'?(W.getPokeName?.(mon)||String(mon)):mon)}
  function cardId(mon){const id=Number(mon?.id??mon);return Number.isFinite(id)&&id>0?id:null}
  function rollCardTier(){const n=Math.random();if(n<.0008)return'UR++';if(n<.0028)return'UR+';if(n<.007)return'UR';if(n<.018)return'SSS';if(n<.04)return'SS';if(n<.085)return'S';if(n<.17)return'A';if(n<.30)return'B';if(n<.46)return'C';if(n<.66)return'D';return'E'}
  function cardSummary(){
    const m=ensureCards(),by={},out={cards:m,atk:0,hp:0};
    for(const c of Object.values(m)){const t=TIERS.includes(c.tier)?c.tier:'E',v=CARD_BUFF[t];out.atk+=v;out.hp+=v;const id=c.id!=null?'p:'+c.id:'a:'+c.name;by[id]=(by[id]||0)+1}
    const milestone=v=>v>=11?15:v>=9?10:v>=5?5:v>=3?3:0;out.milestone=Object.values(by).reduce((a,v)=>a+milestone(v),0);return out
  }
  function recordCard(mon,source,forcedTier){
    const x=profile();if(!x)return null;const m=ensureCards(),id=cardId(mon),name=cardName(mon),tier=forcedTier||rollCardTier(),key=(id!=null?'p:'+id:'a:'+name)+'|'+tier,c=m[key];
    if(c)c.copies=Number(c.copies||0)+1;else{m[key]={id,name,tier,copies:1,firstSeen:Date.now(),source};x.diamonds=Number(x.diamonds||0)+1;notify('🃏 Card nova: '+name+' ['+tier+'] • +1 💎')}
    x.meta=x.meta||{};x.meta.cardDropCounter=Number(x.meta.cardDropCounter||0)+1;try{W.autoSave?.();W.updateHUD?.()}catch(e){}return m[key]
  }
  function cardDrop(mon,source){if(!mon||mon._psyUnifiedCardRolled)return null;mon._psyUnifiedCardRolled=true;const boost=Number(W.getTotalBuff?.('drop')||0),chance=Math.min(.35,.12*(1+boost/100));return Math.random()<chance?recordCard(mon,source):null}
  function fuseCard(key){
    const x=profile(),m=ensureCards(),c=m[key];if(!x||!c||Number(c.copies||0)<5)return notify('São necessárias 5 cópias da mesma card.');const i=TIERS.indexOf(c.tier);if(i<0||i>=TIERS.length-1)return notify('Esta card já está no tier máximo UR++.');c.copies-=5;if(c.copies<=0)delete m[key];recordCard({id:c.id,name:c.name},'fusion',TIERS[i+1]);try{W.autoSave?.()}catch(e){}openCards()
  }
  function frontSprite(name,size=112){
    const fn=W.PSY?.getAdventureFrontSprite||W.PSY?.adventureRuntime?.frontSprite;
    try{const src=fn?.(name,size);if(src)return String(src)}catch(e){}
    return ''
  }
  function cardSprite(c){
    let src='';if(c.id!=null&&typeof W.getRealSprite==='function'){try{src=W.getRealSprite({id:c.id})}catch(e){}}
    if(!src)src=frontSprite(c.name,112);
    return src?'<img data-card-image="1" data-creature="'+esc(c.name)+'" src="'+esc(src)+'" alt="'+esc(c.name)+'">':'<div data-card-image="1" data-creature="'+esc(c.name)+'" style="height:112px;display:grid;place-items:center;font-size:42px">✦</div>'
  }
  function normalizeGlobalCardSprites(){
    const fn=W.PSY?.getAdventureFrontSprite||W.PSY?.adventureRuntime?.frontSprite;if(typeof fn!=='function')return;
    D.querySelectorAll('#psy-unified-album [data-card-image]').forEach(img=>{const src=fn(img.dataset.creature,112);if(!src)return;if(img.tagName==='IMG'){if(img.src!==src)img.src=src}else{const n=D.createElement('img');n.src=src;n.alt=img.dataset.creature;n.dataset.cardImage='1';n.dataset.creature=img.dataset.creature;img.replaceWith(n)}})
  }
  function openCards(){
    const r=getRoot('psy-unified-album');r.className='show';const m=ensureCards(),s=cardSummary();
    r.innerHTML='<div class="psy-gh-panel"><div class="psy-gh-head"><div><div class="psy-gh-title">📒 ÁLBUM DE FIGURINHAS</div><div class="psy-gh-sub">Coleção alimentada por Packs e pelas recompensas próprias da Aventura. 5 repetidas do mesmo tier → 1 do tier seguinte, até UR++.</div></div><button class="psy-gh-close" data-close>×</button></div><div class="psy-gh-wallet"><span>⚔ +'+s.atk+' ATK</span><span>❤ +'+s.hp+' HP</span><span>⭐ +'+s.milestone+'% XP / DROP / GOLD</span></div><p class="psy-gh-sub">Marcos por criatura: 3 = 3%, 5 = 5%, 9 = 10%, 11 = 15%. A card repetida fica disponível para fusão.</p><div class="psy-gh-card-grid">'+(Object.entries(m).map(([key,c])=>{const t=TIERS.includes(c.tier)?c.tier:'E';return'<article class="psy-gh-card" style="--tier:'+TIER_COLOR[t]+'">'+cardSprite(c)+'<b>'+esc(c.name||c.id)+'</b><span>'+t+' • x'+Number(c.copies||0)+'</span><small>⚔ +'+CARD_BUFF[t]+' ATK • ❤ +'+CARD_BUFF[t]+' HP</small><button data-fuse="'+esc(key)+'" '+(Number(c.copies||0)>=5&&t!=='UR++'?'':'disabled')+'>FUNDIR → '+(TIERS[TIERS.indexOf(t)+1]||'MÁXIMO')+'</button></article>'}).join('')||'<div class="psy-gh-row">Nenhuma card registrada.</div>')+'</div></div>';
    r.querySelector('[data-close]').onclick=()=>r.classList.remove('show');r.querySelectorAll('[data-fuse]').forEach(b=>b.onclick=()=>fuseCard(b.dataset.fuse));setTimeout(normalizeGlobalCardSprites,0)
  }
  function recordAdventureMilestone(kind,value){const x=profile();if(!x)return false;x.meta=x.meta||{};x.meta.adventureMilestones=x.meta.adventureMilestones||{};const key=String(kind)+':'+String(value);if(x.meta.adventureMilestones[key])return false;x.meta.adventureMilestones[key]=1;x.diamonds=Number(x.diamonds||0)+1;notify('💎 Nova conquista de Aventura: +1 Diamante');try{W.autoSave?.()}catch(e){}return true}
  W.psyUnifiedCards={ensure:ensureCards,record:recordCard,drop:cardDrop,summary:cardSummary,fuse:fuseCard,open:openCards,tiers:TIERS,buffs:CARD_BUFF};W.PSY=W.PSY||{};W.PSY.recordUnifiedCardDrop=cardDrop;W.PSY.recordAdventureMilestone=recordAdventureMilestone;

  function hookEconomy(){
    /* V22: Cards individuais são exclusivos do fluxo próprio da Aventura/Álbum.
       WORLD, Wild, Hunt e Fast alimentam o Álbum por Packs; nunca concedem
       uma Card diretamente ao derrotar um Pokémon. */
    const buff=W.getTotalBuff;if(typeof buff==='function'&&!buff.__psyGlobalWrapped){W.getTotalBuff=function(k){const base=Number(buff.apply(this,arguments)||0),bonus=Number(cardSummary().milestone||0);return['gold','xp','drop'].includes(k)?base+bonus:base};W.getTotalBuff.__psyGlobalWrapped=true}
    const recalc=W.recalcPoke;if(typeof recalc==='function'&&!recalc.__psyGlobalWrapped){W.recalcPoke=function(mon){const out=recalc.apply(this,arguments),s=cardSummary(),old=mon?mon._psyCardBonus||{atk:0,hp:0}:{atk:0,hp:0};if(mon){const baseAtk=Math.max(1,Number(mon.atk||0)-Number(old.atk||0)),baseHp=Math.max(1,Number(mon.maxHp||0)-Number(old.hp||0));mon.atk=Math.max(1,Math.floor(baseAtk+s.atk));mon.maxHp=Math.max(1,Math.floor(baseHp+s.hp));mon.hp=Math.min(mon.maxHp,Number(mon.hp||mon.maxHp));mon._psyCardBonus={atk:s.atk,hp:s.hp}}return out};W.recalcPoke.__psyGlobalWrapped=true}
  }
  function hookAdventure(){
    const r=W.PSY?.adventureRuntime;if(!r||r.__psyGlobalWrapped)return;r.__psyGlobalWrapped=true;const old=r.hooks.update;r.hooks.update=function(dt){const out=old(dt);for(const mon of r.mons||[])if(mon.hp<=0)cardDrop(mon,'adventure');return out}
  }
  function hideDuplicates(){
    const legacyMenu=D.getElementById('menu'),cityDock=D.getElementById('world-btn-float');
    const city=D.getElementById('menuBtn');
    const adv=D.getElementById('psy-adventure'),inAdventure=!!adv&&getComputedStyle(adv).display!=='none';
    if(!inAdventure){
      // Não fechar o menu legado em cada ciclo: o jogador precisa conseguir
      // mantê-lo aberto e acessar o álbum antigo sem a camada global
      // reescrevê-lo. O estado inicial é restaurado ao sair da Aventura.
      D.getElementById('psy-global-menu')?.classList.remove('show');
      if(city){city.hidden=false;city.removeAttribute('hidden');city.style.display='';setText(city,'🎒 MENU');city.dataset.psyCentral='legacy';city.onclick=()=>typeof W.toggleMenu==='function'?W.toggleMenu():openMenu()}
      if(cityDock){cityDock.hidden=false;cityDock.removeAttribute('hidden');cityDock.style.display='flex'}
      return
    }
    // O hub global pertence ao Mundo Pokémon. No Mundo Aventura só existe o
    // menu criado pelo próprio módulo da Aventura.
    D.getElementById('psy-global-menu')?.classList.remove('show');
    setDisplay(cityDock,'none');setDisplay(legacyMenu,'none');setDisplay(D.getElementById('screen-card-mode'),'none');
    if(city)city.style.display='none';
    adv.querySelectorAll('#a-menu-toggle').forEach(button=>button.remove());
    const button=adv.querySelector('#a-v63-menu-button');if(button){setText(button,'☰ MENU');if(button.dataset.psyAdventureMenu!=='1'){button.dataset.psyAdventureMenu='1';button.onclick=()=>W.PSY?.adventureSystemsV63?.openMenu?.()||W.showAdventureMenu?.()}}
    setDisplay(adv.querySelector('#a-tools-drawer'),'none');
    ['#a-eggs','#a-team','#a-afk','#a-album','#a-cards','#a-stars','#a-tree','#a-evolution','#a-magic-books','#a-move-hud','#a-move-left','#a-move-right'].forEach(sel=>{const el=adv.querySelector(sel);if(el)el.setAttribute('hidden','')});hookAdventure()
  }
  function dispatchHotkey(code){
    const key=Object.keys(cfg.keys).find(k=>cfg.keys[k]===code);if(!key)return;const r=W.PSY?.adventureRuntime;
    if(key==='menu')return activeAdventure()?(W.PSY?.adventureSystemsV63?.openMenu?.()||W.showAdventureMenu?.()):openMenu();if(key==='basic')return r?.hooks?.cast?.(0);if(key==='skill1')return r?.hooks?.cast?.(1);if(key==='skill2')return r?.hooks?.cast?.(2);if(key==='special')return r?.hooks?.cast?.(3);if(key==='potion')return r?.ui?.querySelector('#a-potion')?.click()||W.usePotion?.();
    if(key==='jump'){if(r?.keys){r.keys.add(' ');setTimeout(()=>r.keys.delete(' '),100)}return}
    if(['up','down','left','right'].includes(key)){const mapped={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[key];r?.keys?.add(mapped);return}
    const map={inventory:'openBag',album:'album',eggs:'eggs',team:'openTeam',skills:'skills',evolutions:'evolutions',shop:'adventureShop',books:'books',cards:'cards'};if(map[key])return invoke(map[key])
  }
  function releaseHotkey(code){const key=Object.keys(cfg.keys).find(k=>cfg.keys[k]===code);if(['up','down','left','right'].includes(key)){const mapped={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[key];W.PSY?.adventureRuntime?.keys?.delete(mapped)}}
  const padState=new WeakMap();
  function gamepad(){
    for(const pad of navigator.getGamepads?.()||[]){if(!pad)continue;const r=W.PSY?.adventureRuntime?.keys,x=Number(pad.axes?.[0]||0),y=Number(pad.axes?.[1]||0),set=(k,on)=>{if(!r)return;on?r.add(k):r.delete(k)};set('ArrowLeft',x<-.25);set('ArrowRight',x>.25);set('ArrowUp',y<-.25);set('ArrowDown',y>.25);let old=padState.get(pad);if(!old){old=[];padState.set(pad,old)}[[0,'Space'],[1,'Escape'],[2,'KeyI'],[3,'KeyC']].forEach(([i,c])=>{const on=!!pad.buttons?.[i]?.pressed;if(on&&!old[i])dispatchHotkey(c);old[i]=on})}
    W.requestAnimationFrame(gamepad)
  }
  D.addEventListener('keydown',e=>{const a=D.activeElement;if(a&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.isContentEditable))return;if(!e.repeat)dispatchHotkey(e.code||e.key)},{capture:true});
  D.addEventListener('keyup',e=>releaseHotkey(e.code||e.key),{capture:true});
  D.addEventListener('mousedown',e=>dispatchHotkey('Mouse'+e.button),{capture:true});
  W.psyLanguage={get:()=>cfg.language,set:id=>{if(LANGS[id]){cfg.language=id;saveCfg();applyLanguage()}},languages:LANGS,t:tr};

  addStyle();applySound();hookEconomy();hideDuplicates();applyLanguage();W.requestAnimationFrame(gamepad);
  let refreshPending=false;const refresh=()=>{if(refreshPending)return;refreshPending=true;W.setTimeout(()=>{refreshPending=false;hideDuplicates();hookEconomy();hookAdventure();applyLanguage()},0)};
  const observer=new MutationObserver(refresh);observer.observe(D.body,{childList:true,subtree:true});setInterval(()=>{hideDuplicates();hookEconomy();hookAdventure();applySound()},1500);
  console.log('✅ PSYWORLD Global Hub V4: menu do Mundo Pokémon restaurado, álbum antigo preservado e Aventura isolada');
})(window,document);
