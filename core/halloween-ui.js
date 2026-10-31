/* Original vector icon set for the Halloween UI; no emoji glyphs in navigation. */
(function(W,D){
'use strict';
if(W.__PSY_HALLOWEEN_UI_V1__)return;
W.__PSY_HALLOWEEN_UI_V1__=true;
const ICON={
lantern:'<path d="M8 4h8M9 4l-1 3h8l-1-3M6 9h12l-1 11H7L6 9Z"/><path d="M9 7V5m6 2V5M9 12l3 2 3-2M12 14v3"/>',
book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 6v15m4-14h8m-8 4h8"/>',
city:'<path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M9 12h2v2H9zm4 0h2v2h-2zm-4 4h2v4H9zm4 0h2v4h-2z"/>',
moon:'<path d="M19.5 15.5A8 8 0 0 1 8.5 4.5 8.5 8.5 0 1 0 19.5 15.5Z"/><path d="m17 4 .6 1.4L19 6l-1.4.6L17 8l-.6-1.4L15 6l1.4-.6L17 4Z"/>',
bag:'<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3m-6 5h6"/>',
team:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1H3Zm12-9a3 3 0 1 0-1-5.8m2 8.1a5 5 0 0 1 5 5v1h-3"/>',
cards:'<rect x="5" y="4" width="12" height="16" rx="2" transform="rotate(-8 5 4)"/><path d="M9 7h5m-6 4h7m-6 4h4"/><path d="M9 3h9a2 2 0 0 1 2 2v12"/>',
scroll:'<path d="M7 4h12v16H7a3 3 0 1 1 0-6h12"/><path d="M10 8h5m-5 4h5m-5 4h4M7 4a3 3 0 0 0 0 6"/>',
egg:'<path d="M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11Z"/><path d="M9 15c.3 2 1.4 3 3 3"/>',
star:'<path d="m12 3 2.7 5.6 6.2.9-4.5 4.4 1.1 6.2-5.5-2.9-5.5 2.9 1.1-6.2-4.5-4.4 6.2-.9L12 3Z"/>',
castle:'<path d="M4 20V8l3 2V6l5 3 5-3v4l3-2v12H4Z"/><path d="M9 20v-5a3 3 0 0 1 6 0v5M7 13h2m6 0h2"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m18 6 3-3"/>',
medal:'<circle cx="12" cy="9" r="5"/><path d="m8.5 13-1 8 4.5-2 4.5 2-1-8M10 9l1.3 1.2L14 7.5"/>',
potion:'<path d="M9 3h6m-5 0v5l-5 8a4 4 0 0 0 3.4 6h7.2a4 4 0 0 0 3.4-6l-5-8V3"/><path d="M8 15h8"/>',
shop:'<path d="M4 10h16v11H4V10Zm-1 0 2-6h14l2 6"/><path d="M9 21v-6h6v6M4 10a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/>',
music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
default:'<path d="M12 3c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9Z"/><path d="M8 13c2-1 6-1 8 0M9 9h.01M15 9h.01M10 17h4"/>'
};
const BY_ID={
menuBtn:'lantern','btn-psyworld-wiki':'book','btn-city-content-toggle':'city',
'btn-idle-realistic-float':'moon','btn-bag-float':'bag','btn-team-float':'team',
'btn-card-float':'cards','btn-quests-float':'scroll','btn-eggcenter-float':'egg',
'btn-afk-float':'moon','btn-vip-float':'star','btn-dungeon-float':'castle',
'btn-hunts-float':'target','btn-pokedex-float':'book','btn-gyms-float':'medal',
'psy-audio-quick-toggle':'music','psy-audio-open':'music'
};
function choose(button){
 const byId=BY_ID[button.id];if(byId)return byId;
 const t=(button.innerText||button.textContent||'').toLocaleLowerCase('pt-BR');
 if(/wiki|guia/.test(t))return'book';
 if(/conteúdo do jogo|cidade|mapa/.test(t))return'city';
 if(/psy idle|modo afk/.test(t))return'moon';
 if(/bolsa|bag|mochila/.test(t))return'bag';
 if(/time|equipe|box|jogador/.test(t))return'team';
 if(/card|álbum/.test(t))return'cards';
 if(/quest|missão|jornada/.test(t))return'scroll';
 if(/egg|ovo/.test(t))return'egg';
 if(/vip|premium/.test(t))return'star';
 if(/dungeon|masmorra/.test(t))return'castle';
 if(/hunt|caça/.test(t))return'target';
 if(/pokedex|pokédex|dex/.test(t))return'book';
 if(/gym|ginásio/.test(t))return'medal';
 if(/curar|heal|poção/.test(t))return'potion';
 if(/loja|shop|market|leilão/.test(t))return'shop';
 if(/áudio|música/.test(t))return'music';
 if(/idioma|language/.test(t))return'book';
 if(/carregar save|load save/.test(t))return'scroll';
 if(/arquivo|file/.test(t))return'book';
 if(/conta online|cloud save|online account/.test(t))return'city';
 if(/começar|iniciar|start/.test(t))return'star';
 return null;
}
function decorate(button){
 if(!(button instanceof HTMLElement)||button.dataset.psyHalloweenIcon)return;
 const icon=choose(button);if(!icon)return;
 button.dataset.psyHalloweenIcon='1';
 const walker=D.createTreeWalker(button,NodeFilter.SHOW_TEXT);
 let node;
 while((node=walker.nextNode())){
  const value=node.nodeValue||'';
  if(value.trim()){
   node.nodeValue=value.replace(/^(\s*)(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D\u25B6\u2B06]+\s*)+/u,'$1');
   break;
  }
 }
 const span=D.createElement('span');span.className='psy-halloween-button-icon';span.setAttribute('aria-hidden','true');
 span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+ICON[icon]+'</svg>';
 button.insertBefore(span,button.firstChild);
}

function polishTutorialAndStarter(){
 const tutorial=D.getElementById('psy-tutorial-body');
 if(tutorial){
  const walker=D.createTreeWalker(tutorial,NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())){
   const text=n.nodeValue||'';
   if(!text.trim())continue;
   if(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D]+$/u.test(text)){
    if(n.parentElement&&n.parentElement.childNodes.length===1)n.parentElement.remove();
    else n.nodeValue='';
   }else{
    const clean=text.replace(/^([\s]*)(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D]+\s*)+/u,'$1');
    if(clean!==text)n.nodeValue=clean;
   }
  }
  if(!tutorial.querySelector('.psy-halloween-tutorial-mark')){
   const mark=D.createElement('div');mark.className='psy-halloween-tutorial-mark';mark.setAttribute('aria-hidden','true');
   mark.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+ICON.lantern+'</svg>';
   tutorial.insertBefore(mark,tutorial.firstChild);
  }
 }
 D.querySelectorAll('#starter-list .gen-label').forEach(label=>{
  const original=label.textContent||'';
  const clean=original.replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D]+\s*/u,'');
  if(clean!==original)label.textContent=clean;
 });
}
function scan(root){
 if(!root)return;
 if(root.matches?.('button'))decorate(root);
 root.querySelectorAll?.('button').forEach(decorate);
}
function start(){
 scan(D);polishTutorialAndStarter();
 const mo=new MutationObserver(records=>{
  for(const record of records){
   if(record.type==='characterData'){
    const button=record.target.parentElement?.closest?.('button');
    if(button&&!button.dataset.psyHalloweenIcon)decorate(button);
   }else{
    for(const node of record.addedNodes)if(node.nodeType===1)scan(node);
   }
  }
  polishTutorialAndStarter();
 });
 mo.observe(D.body,{childList:true,characterData:true,subtree:true});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window,document);
