/* Authored Pallet / Route 1 scenes, driven by actual map and quest events. */
(function(W,D){'use strict';
const player=()=>typeof P!=='undefined'?P:W.P||{},world=()=>W.PsyKantoWorldV2;
const ART={pallet:'assets/story/pallet-town-artist-v2.webp',lab:'assets/kanto/interiors/lab-v30.webp',departure:'assets/kanto/cinematics/pallet-05.webp',route:'assets/story/route-1-artist-v2.webp',oak:'assets/kanto/approved/professor-expressions.webp'};
let running=null,typing=0,transition=0,previousFocus;
function memory(){const p=player();p.meta=p.meta||{};return p.meta.kantoStoryV49||(p.meta.kantoStoryV49={seen:{}});}
function save(){W.autoSave?.();}function stopTimers(){W.clearInterval(typing);W.clearTimeout(transition);typing=0;transition=0;}
function close(completed){if(!running)return;const old=running;stopTimers();running=null;D.getElementById('psy-kanto-story')?.remove();world()?.setStoryLock(false);if(completed){memory().seen[old.id]=true;delete memory()[old.id];save();old.done?.();}previousFocus?.focus?.();}
function play(id,beats,done,quest=false){if(running)return false;W.PsyGuide?.close();W.PsyCampaignAutomation?.stop();previousFocus=D.activeElement;world()?.setStoryLock(true);
const root=D.createElement('section');root.id='psy-kanto-story';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Cena da campanha de Kanto');
root.innerHTML='<div class="ks49-image" aria-hidden="true"></div><div class="ks49-shade"></div><header><span class="ks49-chapter"></span><button data-leave></button></header><div class="ks49-location"></div><article class="ks49-dialogue"><div class="ks49-portrait" role="img"></div><div class="ks49-copy"><span class="ks49-speaker"></span><h2></h2><p aria-live="polite"></p></div><footer><span class="ks49-count"></span><div class="ks49-actions"></div></footer></article>';
D.body.appendChild(root);running={id,beats,done,quest,index:Math.min(beats.length-1,Number(memory()[id]||0)),root,full:'',rendered:0};
root.querySelector('[data-leave]').textContent=quest?'CONTINUAR DEPOIS':'PULAR CENA';root.querySelector('[data-leave]').onclick=()=>close(!quest);render();return true;}
function reveal(){if(!running)return;W.clearInterval(typing);typing=0;running.root.querySelector('p').textContent=running.full;running.rendered=running.full.length;}
function render(){if(!running)return;stopTimers();const ctx=running,beat=ctx.beats[ctx.index],root=ctx.root;
root.dataset.scene=ctx.id;root.dataset.beat=String(ctx.index);root.classList.remove('ks49-reveal');void root.offsetWidth;root.classList.add('ks49-reveal');
const image=root.querySelector('.ks49-image');image.style.backgroundImage='url("'+(beat.art||ART.pallet)+'")';image.classList.toggle('interior',beat.art===ART.lab);
root.querySelector('.ks49-chapter').textContent=beat.chapter||'KANTO · OS PRIMEIROS PASSOS';root.querySelector('.ks49-location').textContent=beat.location||'';
root.querySelector('.ks49-speaker').textContent=beat.speaker||'Sua jornada';root.querySelector('h2').textContent=beat.title||'';
const portrait=root.querySelector('.ks49-portrait');portrait.style.backgroundImage=beat.professor?'url("'+ART.oak+'")':beat.portrait?'url("'+beat.portrait+'")':'';portrait.classList.toggle('professor',!!beat.professor);portrait.style.backgroundPosition=beat.professor?['left top','right top','left bottom','right bottom'][beat.expression||0]:'center';portrait.hidden=!beat.professor&&!beat.portrait;portrait.setAttribute('aria-label',beat.speaker||'');
ctx.full=beat.text;ctx.rendered=0;const text=root.querySelector('p');text.textContent='';text.setAttribute('aria-label',beat.text);root.querySelector('.ks49-count').textContent=(ctx.index+1)+' / '+ctx.beats.length;
const actions=root.querySelector('.ks49-actions');actions.replaceChildren();const choices=beat.choices||[{label:ctx.index===ctx.beats.length-1?(ctx.quest?'ACEITAR A PESQUISA':'CONTINUAR A JORNADA'):'CONTINUAR',primary:true}];
for(const choice of choices){const button=D.createElement('button');button.textContent=choice.label;button.className=choice.primary?'primary':'';button.onclick=()=>{if(typing){reveal();return;}if(choice.response){ctx.beats.splice(ctx.index+1,0,{...beat,choices:null,title:'Uma boa pergunta',text:choice.response});}if(ctx.index===ctx.beats.length-1){close(true);return;}ctx.index++;memory()[ctx.id]=ctx.index;save();render();};actions.appendChild(button);}
const reduced=W.matchMedia?.('(prefers-reduced-motion: reduce)').matches;if(reduced)reveal();else typing=W.setInterval(()=>{if(!running||running!==ctx)return;ctx.rendered=Math.min(ctx.full.length,ctx.rendered+2);text.textContent=ctx.full.slice(0,ctx.rendered);if(ctx.rendered===ctx.full.length){W.clearInterval(typing);typing=0;}},24);actions.querySelector('button')?.focus();
}
function enter(from,to){if(running||from===to)return;const m=memory();if(to==='pallet'){
 if(m.seen.palletArrival)return;
 const name=String(player().name||'Treinador'),partner=player().team?.[0]?.name||'seu parceiro';
 play('palletArrival',[
 {art:ART.pallet,location:'PALLET TOWN',title:'Onde os primeiros laços nascem',text:'O vento atravessa as árvores de Pallet. Ao longe, uma porta se abre no laboratório. Hoje, a estrada parece chamar pelo seu nome.'},
 {art:ART.pallet,speaker:'Elisa · bilhete na mochila',title:'Leve um pouco de casa com você',text:name+', não precisa descobrir o mundo inteiro em um só dia. Cuide de '+partner+', converse com as pessoas e lembre-se: você sempre terá para onde voltar.'},
 {art:ART.lab,professor:true,speaker:'Professor Car’alho',title:'Um convite para descobrir Kanto',text:'Então você chegou! Estou no laboratório, ao lado da saída norte. Antes de partir, venha me contar como foi conhecer seu primeiro Pokémon.'}
 ]);return;}
 if(to==='route-1'){
 const first=!m.seen.routeArrival,beats=[];
 if(from==='pallet'&&!m.seen.palletDeparture)beats.push({art:ART.departure,location:'DEIXANDO PALLET',title:'O primeiro passo além de casa',text:'Você olha para trás uma última vez. Os telhados de Pallet ainda brilham ao sol. Seu parceiro se aproxima, pronto para seguir o mesmo caminho.'});
 if(first)beats.push({art:ART.route,location:'ROTA 1',title:'Entre o conhecido e o desconhecido',text:'O som da vila dá lugar ao farfalhar da grama. Pequenas pegadas cruzam a trilha. Cada clareira guarda encontros que ainda não fazem parte da sua história.'},{art:ART.route,professor:true,expression:1,speaker:'Professor Car’alho · lembrança',title:'Observe antes de avançar',text:'Não tenha pressa de vencer todas as batalhas. Observe os tipos, cuide da energia da equipe e registre o que encontrar. Quero ouvir suas descobertas quando voltar.'},{art:ART.route,speaker:'Sua jornada',title:'A estrada até Viridian',text:'Ao norte, a trilha continua em direção a Viridian City. Você ajeita a mochila, troca um olhar com seu parceiro e dá o próximo passo.'});
 if(beats.length)play('routeArrival',beats,()=>{m.seen.palletDeparture=true;save();});
 }}
function professor(npc,done){const p=player(),partner=p.team?.[0]?.name||'seu parceiro',name=String(p.name||'Treinador');
return play('professorResearch',[
 {art:ART.lab,professor:true,expression:1,speaker:'Professor Car’alho',title:'Um parceiro, muitas possibilidades',text:name+'! Venha, fique à vontade. Vejo que '+partner+' já escolheu caminhar com você. Um bom começo não se mede pela força do primeiro golpe, mas pela confiança que vocês constroem.'},
 {art:ART.lab,professor:true,speaker:'Professor Car’alho',title:'O que trouxe você até aqui?',text:'Alguns treinadores procuram desafios. Outros querem entender os Pokémon. O que você espera encontrar nessa jornada?',choices:[{label:'QUERO DESCOBRIR KANTO',primary:true,response:'Então repare nas pequenas coisas: uma passagem entre as árvores, alguém precisando de ajuda, um comportamento diferente na grama. Kanto recompensa quem tem curiosidade.'},{label:'QUERO CUIDAR DO MEU PARCEIRO',response:'Essa é uma ótima razão para começar. Dê tempo para '+partner+' descansar e aprenda suas vantagens e fraquezas. Uma equipe cresce melhor quando ninguém fica para trás.'}]},
 {art:ART.lab,professor:true,expression:2,speaker:'Professor Car’alho',title:'Uma pesquisa feita a dois',text:'Preciso de olhos atentos na Rota 1. Observe os Pokémon e os habitats das clareiras. Quando chegar a Viridian, procure os moradores: suas histórias também fazem parte desta pesquisa.'},
 {art:ART.lab,professor:true,expression:1,speaker:'Professor Car’alho',title:'Preparativos para a estrada',text:'Sua mochila já tem os suprimentos iniciais. Se precisar recuperar sua equipe, visite a Enfermeira Íris. No Mart, Davi pode ajudar com os preparativos. E volte aqui quando quiser conversar.'},
 {art:ART.lab,professor:true,speaker:'Professor Car’alho',title:'A sua jornada começa agora',text:'Posso contar com você? Ao aceitar a pesquisa, a passagem para a Rota 1 estará liberada. Caminhe para o norte de Pallet. Quero ver que histórias você e '+partner+' vão trazer.'}
 ],()=>{memory().seen.professorResearch=true;save();done?.();},true);}
D.addEventListener('keydown',e=>{if(!running)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();close(!running.quest);}else if(e.key==='Enter'||e.key===' '){e.preventDefault();running.root.querySelector('.ks49-actions button')?.click();}},true);
W.PsyKantoStoryV49={enter,professor,isOpen:()=>!!running,close,art:ART};
})(window,document);
