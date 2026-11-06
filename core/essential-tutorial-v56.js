/* Required, per-profile essentials. Completing text alone cannot enable a follower. */
(function(W,D){
 'use strict';
 if(location.pathname.startsWith('/tests/')&&!location.pathname.endsWith('/essential-tutorial-v56.html'))return;
 let waiting=false,recovering=false,healing=false;
 const player=()=>typeof P!=='undefined'?P:W.P||null;
 const conscious=()=>player()?.team?.some(m=>Number.isFinite(Number(m.hp))&&Number(m.hp)>0&&!m.fainted&&!m._psyFaintedV31);
 const visible=el=>!!el&&!!el.getClientRects().length&&getComputedStyle(el).display!=='none';
 function record(){const p=player();if(!p)return null;p.meta=p.meta||{};return p.meta.essentialGuideV56||(p.meta.essentialGuideV56={step:0,done:false});}
 function save(){W.autoSave?.();}
 function confirmFollower(){const r=record(),p=player();if(!r||r.done||!waiting)return;const mon=W.PsyFollower?.selected();if(!p.meta.followerV47?.enabled||!mon||Number(mon.hp)<=0)return;r.done=true;r.step=4;waiting=false;save();W.toggleCityGameContent?.(true);W.PsyGuide.show({speaker:'Psyduck · Parceiro de jornada',text:mon.name+' agora acompanha você! Caminhe para vê-lo seguir seus passos. Para trocar ou desativar, volte a CONTEÚDO DO JOGO → Acompanhante. O líder de batalha continua separado.',actions:[{text:'COMEÇAR A JOGAR',primary:true}]});}
 function content(target){W.toggleCityGameContent?.(false);D.querySelector(target)?.scrollIntoView({block:'center',behavior:'auto'});}
 const steps=[
  {target:'#gameCanvas',text:'Bem-vindo! Vamos conhecer os controles essenciais. No celular, arraste em uma área livre para caminhar e solte para parar. Na campanha, um toque no chão também escolhe um caminho. No computador, use setas ou WASD. Toque nos moradores próximos para conversar.'},
  {target:'#btn-team-float',prepare:()=>content('#btn-team-float'),text:'CONTEÚDO DO JOGO reúne suas atividades. TIME / BOX organiza seus Pokémon; BOLSA guarda Balls, poções e materiais. Antes de caçar, confira a vida da equipe e os consumíveis. MENU reúne opções, conta e ajuda.'},
  {target:'#psy-hunt-launch',prepare:()=>content('#psy-hunt-launch'),text:'O quadro HISTÓRIA mostra seu objetivo; IR ajuda a encontrar o caminho. Em Sessão de caça você acompanha capturas, drops e consumo de itens. Ao usar automação, escolha Ball e poção e confirme a ativação. Você pode rever estas orientações em MENU → TUTORIAL / AJUDA.'},
  {target:'#psy-follower-launch',prepare:()=>content('#psy-follower-launch'),text:'Agora escolha quem vai caminhar com você! Toque em ABRIR ACOMPANHANTE, escolha seu inicial e confirme. O acompanhante é visual e não troca o líder de batalha. Esta etapa termina somente depois da confirmação.'}
 ];
 async function healTeam(){
  if(healing)return;const p=player();healing=true;
  try{if(typeof W.curarTimeCity!=='function')throw new Error('Cura indisponível');await W.curarTimeCity();}
  catch(e){W.notif?.('Não foi possível curar a equipe. Tente novamente.',3500);}
  finally{healing=false;if(player()===p)show();}
 }
 function show(){const r=record();if(!r||r.done)return;const i=Math.min(3,Math.max(0,Number(r.step)||0)),s=steps[i];recovering=i===3&&!conscious();if(recovering){W.PsyGuide.show({required:true,speaker:'Psyduck · Cuide da equipe',text:'Seu parceiro precisa estar consciente para caminhar com você. Vamos recuperar a equipe antes de escolher o acompanhante.',actions:[{text:'CURAR EQUIPE',primary:true,run:healTeam}]});return;}s.prepare?.();W.PsyGuide.show({required:true,speaker:'Psyduck · Essenciais '+(i+1)+'/4',target:s.target,text:s.text,actions:[{text:i===3?'ABRIR ACOMPANHANTE':'ENTENDI · CONTINUAR',primary:true,run:()=>{if(i<3){r.step=i+1;save();show();return;}waiting=true;const button=D.getElementById('psy-follower-launch');if(button)button.click();}}]});}
 function ready(){const p=player();if(!p?.team?.length||!p.playerCharacterId||!W.PsyGuide||!W.PsyFollower)return false;if(typeof inBattle!=='undefined'&&inBattle)return false;if(D.body.classList.contains('psy-kanto-v2-active')||W.PsyKantoStoryV49?.isOpen())return false;if(visible(D.getElementById('psy-halloween-character-screen'))||visible(D.getElementById('psy-tutorial-cinematic')))return false;return visible(D.getElementById('game-wrap'));}
 function tick(){if(healing||!ready())return;const r=record();if(r.done)return;if(recovering&&conscious()){show();return;}if(W.PsyGuide.isOpen())return;if(waiting&&D.getElementById('psy-follower-menu'))return;waiting=false;show();}
 D.addEventListener('click',e=>{const button=e.target.closest?.('#psy-follower-menu button');if(!button||!waiting)return;if(button.textContent==='Confirmar acompanhante')W.setTimeout(confirmFollower,0);},false);
 const old=W.openTutorial;if(typeof old==='function')W.openTutorial=function(){const r=record();if(r&&!r.done){waiting=false;show();return;}return old.apply(this,arguments);};
 W.PsyEssentialGuide={resume:tick};W.setInterval(tick,1000);W.setTimeout(tick,1200);
})(window,document);
