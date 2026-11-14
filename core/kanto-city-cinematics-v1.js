/* PSYWORLD — city entry, Kanto campaign cinematic, and live cinematic tutorial. */
(function (W, D) {
  'use strict';
  if (W.__PSY_KANTO_CITY_CINEMATICS_V1__) return;
  W.__PSY_KANTO_CITY_CINEMATICS_V1__ = true;

  const CINEMATIC_STORY = [
    {title:'PALLET TOWN',text:'Depois de escolher quem será seu treinador, você chega a Pallet Town. A cidade é seu ponto de encontro: converse com os moradores, conheça os prédios e prepare-se no seu próprio ritmo.'},
    {title:'UM CHAMADO DE KANTO',text:'O Professor Car’alho espera por você no laboratório de Pallet. Converse com ele para preparar sua jornada e liberar a passagem ao norte, rumo à Rota 1.'},
    {title:'ESCOLHA SEU PRIMEIRO PARCEIRO',text:'Escolha seu primeiro parceiro entre os 27 iniciais das nove gerações, de Kanto a Paldea. A história começa em Kanto, independentemente da origem do seu Pokémon.'}
  ];
  const legacyCloseTutorial = W.closeTutorial;
  const TUTORIAL = [
    {icon:'🌙',title:'Sua cidade',text:'Esta é a cidade Psy. As casas, a fonte e as decorações ficam posicionadas no mundo enquanto você caminha pela cidade.',target:'#gameCanvas'},
    {icon:'💚',title:'Seu treinador e parceiro',text:'Depois que você escolher seu inicial pela campanha, este painel mostrará o nível, a vida e a experiência do Pokémon que está à frente da equipe.',target:'#hud-player'},
    {icon:'🧑‍🤝‍🧑',title:'Converse com os moradores',text:'Aproxime-se de uma pessoa e toque nela para ler suas falas e conhecer os serviços e histórias da cidade.',target:'#psy-halloween-npc-luna'},
    {icon:'🕹️',title:'Caminhe pela cidade',text:'No computador, use as setas ou WASD. No celular, arraste em qualquer área livre do mapa para caminhar. Solte para parar.',target:'#gameCanvas'},
    {icon:'🎬',title:'Entre na campanha',text:'Este botão inicia a história de Kanto. A cinemática apresenta a jornada e, em seguida, você escolhe seu parceiro entre os iniciais de todas as gerações.',target:'#btn-kanto-journey'},
    {icon:'🎒',title:'Equipe, bolsa e menu',text:'Use estes atalhos para abrir sua equipe e sua bolsa. CONTEÚDO DO JOGO reúne as atividades e a campanha. O MENU abre as opções da conta e permite rever este tutorial.',target:'#btn-team-float'},
    {icon:'♧',title:'Seu acompanhante',text:'Abra CONTEÚDO DO JOGO e procure Acompanhante. Escolha um Pokémon vivo do time e confirme para ele seguir seu treinador. Isso não troca o líder de batalha.',target:'#psy-follower-launch'},
    {icon:'🧭',title:'Você está no controle',text:'Abra CONTEÚDO DO JOGO e toque em CAMPANHA KANTO para iniciar a história. Você pode voltar à cidade Psy quando quiser.',target:'#btn-city-content-toggle'}
  ];

  function addStyles() {
    if (D.getElementById('psy-kanto-city-cinematics-style')) return;
    const s=D.createElement('style');s.id='psy-kanto-city-cinematics-style';
    s.textContent=`
      #psy-mode-intro{display:none!important}
      #world-btn-float{z-index:80!important}#hud-player,#menuBtn,#fastEncounterBtn{z-index:90!important}
      #psy-kanto-cinematic,#psy-tutorial-cinematic{position:fixed;inset:0;z-index:2147483647;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
      #psy-kanto-cinematic{display:flex;align-items:center;justify-content:center;padding:18px;background:#080716}
      .psy-kc-backdrop{position:absolute;inset:0;background:#141126 url('/assets/story/pallet-town-anime-rebuild-v2.png') center/cover no-repeat;animation:psy-kc-pan 18s ease-in-out infinite alternate}
      .psy-kc-backdrop:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,11,27,.26),rgba(9,9,25,.82) 65%,#080716)}
      @keyframes psy-kc-pan{from{transform:scale(1)}to{transform:scale(1.13) translate(-1.2%,1%)}}
      .psy-kc-card{position:relative;width:min(780px,100%);max-height:calc(100dvh - 36px);overflow:auto;border:1px solid #70e9ff88;border-radius:24px;background:linear-gradient(145deg,rgba(9,22,45,.94),rgba(28,14,43,.93));box-shadow:0 26px 90px #000a,0 0 42px #31c9ff30;padding:clamp(22px,5vw,48px);animation:psy-kc-in .5s ease both}
      @keyframes psy-kc-in{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:none}}
      .psy-kc-kicker{color:#76e8ff;font-weight:900;letter-spacing:.2em;font-size:12px}.psy-kc-card h1{font-size:clamp(30px,7vw,58px);line-height:1;margin:14px 0;color:#fff;text-shadow:0 4px 26px #42cfff88}.psy-kc-card p{font-size:clamp(16px,3vw,21px);line-height:1.6;color:#e8e7f7;max-width:60ch}.psy-kc-progress{display:flex;gap:7px;margin:22px 0}.psy-kc-progress i{height:4px;flex:1;background:#ffffff24;border-radius:5px}.psy-kc-progress i.on{background:#62e6ff;box-shadow:0 0 16px #37d9ff}
      .psy-kc-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.psy-kc-actions button,.psy-kc-choice{border:1px solid #ffffff50;border-radius:14px;padding:13px 19px;color:#fff;background:#ffffff12;font-weight:900;font-size:15px;cursor:pointer}.psy-kc-actions .primary{background:linear-gradient(110deg,#0794b5,#593bd2);border-color:#8af0ff;box-shadow:0 6px 24px #3bd7ff38}
      #psy-campaign-generation{padding:12px;margin:12px 0;border:1px solid #7bd2df;background:#102138;color:white;border-radius:10px;max-width:100%;font:inherit}.psy-kc-card h2{font-size:19px;color:#9fe8da;margin-top:28px}.psy-kc-starters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px}.psy-kc-choice{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;min-height:158px;background:linear-gradient(160deg,#102441,#15203e 55%,#28183e);transition:transform .18s,border-color .18s,box-shadow .18s}.psy-kc-choice:hover,.psy-kc-choice:focus-visible{transform:translateY(-5px);border-color:#7af0ff;box-shadow:0 8px 26px #29dfff30}.psy-kc-choice img{width:92px;height:92px;object-fit:contain;image-rendering:pixelated}.psy-kc-choice small{color:#b5dce7;font-weight:600}
      #psy-tutorial-cinematic{pointer-events:none;display:none}.psy-tc-spotlight{position:fixed;border:2px solid #79edff;border-radius:16px;box-shadow:0 0 0 9999px rgba(2,4,17,.82),0 0 24px #51dfff, inset 0 0 16px #52eaff55;transition:all .38s ease;pointer-events:none}
      .psy-tc-caption{position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(680px,calc(100% - 26px));border:1px solid #70e9ff90;border-radius:20px;padding:18px 20px;background:linear-gradient(145deg,rgba(7,19,42,.97),rgba(31,15,45,.96));box-shadow:0 16px 60px #000b;pointer-events:auto}
      .psy-tc-kicker{font-size:11px;letter-spacing:.16em;color:#81eaff;font-weight:900}.psy-tc-caption h2{margin:8px 0;font-size:clamp(21px,5vw,31px)}.psy-tc-caption p{margin:0;color:#e2e4f2;line-height:1.5;font-size:15px}.psy-tc-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px}.psy-tc-actions button{border:1px solid #ffffff38;border-radius:11px;background:#ffffff12;color:#fff;padding:11px 13px;font-weight:850;cursor:pointer}.psy-tc-actions .next{background:linear-gradient(110deg,#058eac,#5840c9);border-color:#8af0ff}.psy-tc-count{color:#9ba8c9;font-size:12px;white-space:nowrap}
      @media(max-width:520px){.psy-kc-actions{justify-content:stretch}.psy-kc-actions button{flex:1}.psy-kc-starters{gap:7px}.psy-kc-choice{min-height:138px;font-size:13px}.psy-kc-choice img{width:78px;height:78px}.psy-tc-caption{padding:15px}.psy-tc-actions button{padding:10px}.psy-kc-card{padding:22px}}
    `;D.head.appendChild(s);
  }

  function removeOldRouteVestige() {
    try {
      if (typeof ROUTE1==='undefined' || typeof map==='undefined' || typeof SOLID==='undefined') return;
      const r=ROUTE1;
      for(let y=r.y1;y<=r.y2;y++){
        map[y][r.x1]=1;map[y][r.x2]=1;
        SOLID.delete(r.x1+','+y);SOLID.delete(r.x2+','+y);
      }
      for(let x=r.x1;x<=r.x2;x++){
        map[r.y1][x]=1;SOLID.delete(x+','+r.y1);
      }
    } catch(e) { console.warn('[Kanto city] route marker cleanup',e); }
  }
  W.startKantoCityPrelude=function(){
    addStyles();removeOldRouteVestige();
    const login=D.getElementById('screen-login'),starter=D.getElementById('screen-starter'),game=D.getElementById('game-wrap');
    if(login)login.style.display='none';if(starter)starter.style.display='none';if(game)game.style.display='block';
    try{updateHUD();initEngine();updateNPCSprites?.()}catch(e){console.error('[Kanto city] could not start city',e)}
    W.setTimeout(()=>{if(!P.meta?.psyCinematicTutorialSeen)W.openTutorial?.()},900);
  };

  function closeCampaignCinematic(){D.getElementById('psy-kanto-cinematic')?.remove()}
  function showCampaignCinematic(){
    addStyles();removeOldRouteVestige();
    let root=D.getElementById('psy-kanto-cinematic');if(!root){root=D.createElement('div');root.id='psy-kanto-cinematic';D.body.appendChild(root)}
    let stage=0,selectedGeneration='all',committing=false;
    function render(){
      const story=CINEMATIC_STORY[Math.min(stage,CINEMATIC_STORY.length-1)];
      const choose=stage===CINEMATIC_STORY.length;
      root.innerHTML=`<div class="psy-kc-backdrop"></div><section class="psy-kc-card" aria-live="polite"><div class="psy-kc-kicker">PSYWORLD · CAMPANHA KANTO</div><div class="psy-kc-actions"><button data-return>VOLTAR À CIDADE PSY</button>${!choose?`<button data-skip>PULAR INTRODUÇÃO</button>`:""}</div><div class="psy-kc-progress">${CINEMATIC_STORY.map((_,i)=>`<i class="${i<=stage?'on':''}"></i>`).join('')}</div>${choose?`<h1>Escolha seu inicial</h1><p>${CINEMATIC_STORY[2].text}</p><label>Geração <select id="psy-campaign-generation" aria-label="Geração dos iniciais"><option value="all">Todas as gerações · 27 iniciais</option>${GENS.map((g,i)=>`<option value="${i}" ${selectedGeneration===String(i)?'selected':''}>${g.label}</option>`).join('')}</select></label>${GENS.map((g,i)=>selectedGeneration==='all'||selectedGeneration===String(i)?`<h2>${g.label}</h2><div class="psy-kc-starters">${g.starters.map(p=>`<button class="psy-kc-choice" data-starter="${p.id}"><img src="${getSpriteUrl(p.id)}" alt="${p.name}"><b>${p.name}</b><small>${p.type}</small></button>`).join('')}</div>`:'').join('')}`:`<h1>${story.title}</h1><p>${story.text}</p><div class="psy-kc-actions"><button data-cancel>VOLTAR À CIDADE</button><button class="primary" data-next>${stage===CINEMATIC_STORY.length-1?'ESCOLHER INICIAL':'CONTINUAR'}</button></div>`}</section>`;
      root.querySelector('#psy-campaign-generation')?.addEventListener('change',e=>{selectedGeneration=e.target.value;render()});
      const returnToCity=()=>{closeCampaignCinematic();W.startKantoCityPrelude?.();};
      root.querySelector('[data-cancel]')?.addEventListener('click',returnToCity);
      root.querySelector('[data-return]')?.addEventListener('click',returnToCity);
      root.querySelector('[data-skip]')?.addEventListener('click',()=>{stage=CINEMATIC_STORY.length;render();});
      root.querySelector('[data-next]')?.addEventListener('click',()=>{stage++;render()});
      root.querySelectorAll('[data-starter]').forEach(btn=>btn.addEventListener('click',()=>{
        if(committing||P.team?.length)return;const id=Number(btn.dataset.starter),starter=GENS.flatMap(g=>g.starters).find(p=>p.id===id);if(!starter)return;committing=true;
        chosenPoke=starter;P.meta=P.meta||{};P.meta.kantoCampaignIntroSeen=true;P.meta.kantoStarterChosen=id;
        const old=D.getElementById('screen-starter');if(old)old.style.display='none';
        closeCampaignCinematic();
        try{confirmStarter();
        if(P.team?.[0]){const mon=P.team[0];mon.hp=Number(mon.maxHp||mon.baseMaxHp||P.maxHp||1);mon.currentHp=mon.hp;mon.fainted=false;P.pokemon=mon;P.hp=mon.hp;P.maxHp=mon.hp;W.autoSave?.();}
        W.setTimeout(()=>W.PsyKantoPlayableV1?.open('pallet'),450)}
        catch(e){committing=false;console.error('[Kanto campaign] initial choice failed',e);W.notif?.('Não foi possível iniciar a campanha agora.',3000)}
      }));
    }
    render();
  }
  const oldOpenKanto=W.openKantoJourneyV1;
  if(typeof oldOpenKanto==='function')W.openKantoJourneyV1=function(){
    if(!Array.isArray(P.team)||!P.team.length)return showCampaignCinematic();
    return oldOpenKanto.apply(this,arguments);
  };
  W.openKantoCampaignCinematic=showCampaignCinematic;

  let tutorialIndex=0,tutorialRoot=null,spotlight=null;
  function tutorialTarget(step){
    const el=D.querySelector(step.target);if(el&&el.getClientRects().length)return el;
    const fallback=D.querySelector('#gameCanvas')||D.getElementById('hud-player');return fallback;
  }
  function positionSpotlight(){
    if(!spotlight)return;
    const target=tutorialTarget(TUTORIAL[tutorialIndex]);if(!target)return;
    const r=target.getBoundingClientRect(),pad=8;
    spotlight.style.left=Math.max(6,r.left-pad)+'px';spotlight.style.top=Math.max(6,r.top-pad)+'px';
    spotlight.style.width=Math.max(20,Math.min(W.innerWidth-12,r.width+pad*2))+'px';
    spotlight.style.height=Math.max(20,Math.min(W.innerHeight-12,r.height+pad*2))+'px';
  }
  function renderTutorial(){
    if(!tutorialRoot)return;
    const s=TUTORIAL[tutorialIndex],last=tutorialIndex===TUTORIAL.length-1;
    tutorialRoot.querySelector('.psy-tc-kicker').textContent=`CINEMÁTICA GUIADA · CENA ${tutorialIndex+1} DE ${TUTORIAL.length}`;
    tutorialRoot.querySelector('h2').textContent=`${s.icon} ${s.title}`;
    tutorialRoot.querySelector('p').textContent=s.text;
    tutorialRoot.querySelector('.psy-tc-count').textContent=`${tutorialIndex+1}/${TUTORIAL.length}`;
    tutorialRoot.querySelector('[data-prev]').disabled=tutorialIndex===0;
    tutorialRoot.querySelector('[data-next]').textContent=last?'COMEÇAR A JOGAR':'PRÓXIMA CENA →';
    W.requestAnimationFrame(positionSpotlight);
  }
  W.openTutorial=function(){
    const old=D.getElementById('screen-psy-tutorial');
    if(old&&old.style.display!=='none')old.style.display='none';
    if(W.PsyGuide)return W.PsyGuide.tutorial(TUTORIAL.map(step=>({text:step.text,speaker:'Psyduck · Seu guia',target:step.target,prepare:()=>{if(['#btn-kanto-journey','#btn-team-float','#psy-follower-launch'].includes(step.target))W.toggleCityGameContent?.(false);else W.toggleCityGameContent?.(true);},finish:()=>W.closeTutorial?.()})));

    addStyles();tutorialIndex=0;
    tutorialRoot=D.getElementById('psy-tutorial-cinematic');
    if(!tutorialRoot){tutorialRoot=D.createElement('div');tutorialRoot.id='psy-tutorial-cinematic';tutorialRoot.innerHTML=`<div class="psy-tc-spotlight"></div><section class="psy-tc-caption" role="dialog" aria-modal="true"><div class="psy-tc-kicker"></div><h2></h2><p></p><div class="psy-tc-actions"><button data-close>PULAR TUTORIAL</button><button data-prev>← VOLTAR</button><span class="psy-tc-count"></span><button class="next" data-next>PRÓXIMA CENA →</button></div></section>`;D.body.appendChild(tutorialRoot);}
    spotlight=tutorialRoot.querySelector('.psy-tc-spotlight');tutorialRoot.style.display='block';
    D.getElementById('menu')?.style && (D.getElementById('menu').style.display='none');
    tutorialRoot.querySelector('[data-close]').onclick=W.closeTutorial;
    tutorialRoot.querySelector('[data-prev]').onclick=()=>{tutorialIndex=Math.max(0,tutorialIndex-1);renderTutorial()};
    tutorialRoot.querySelector('[data-next]').onclick=()=>{if(tutorialIndex>=TUTORIAL.length-1)return W.closeTutorial();tutorialIndex++;renderTutorial()};
    renderTutorial();W.addEventListener('resize',positionSpotlight);W.addEventListener('scroll',positionSpotlight,true);
  };
  W.closeTutorial=function(){
    const old=D.getElementById('screen-psy-tutorial');
    if(old&&old.style.display!=='none'){
      try{legacyCloseTutorial?.()}catch(e){console.warn('Old tutorial close',e)}
      old.style.display='none';
    }
    W.PsyGuide?.close();
    if(P){P.meta=P.meta||{};P.meta.psyCinematicTutorialSeen=true;if(P.team?.length)try{autoSave()}catch(_){}else try{W.psyV9WriteLocal?.()}catch(_){}}
    W.toggleCityGameContent?.(true);if(tutorialRoot)tutorialRoot.style.display='none';
    W.removeEventListener('resize',positionSpotlight);W.removeEventListener('scroll',positionSpotlight,true);
  };
  W.psyKantoTutorialNext=function(){if(tutorialIndex<TUTORIAL.length-1){tutorialIndex++;renderTutorial()}else W.closeTutorial()};
  W.psyKantoTutorialPrev=function(){tutorialIndex=Math.max(0,tutorialIndex-1);renderTutorial()};
  W.psyKantoRenderTutorial=renderTutorial;
  W.addEventListener('keydown',e=>{if(!tutorialRoot||tutorialRoot.style.display==='none')return;if(e.key==='Escape')W.closeTutorial();else if(e.key==='ArrowRight')W.psyKantoTutorialNext();else if(e.key==='ArrowLeft')W.psyKantoTutorialPrev()});
  addStyles();removeOldRouteVestige();
})(window,document);

