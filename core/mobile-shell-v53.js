/* Menus share one overlay layer; utility actions keep their original handlers. */
(function(W,D){
 'use strict';
 function install(){
 const menu=D.getElementById('menu'),content=D.getElementById('psy-content-modal'),grid=D.getElementById('city-game-content-buttons');if(!menu||!content||!grid)return;
 const header=D.createElement('header');header.className='psy-shell-header';header.innerHTML='<div><small>PSYWORLD</small><h2>Seu mundo</h2></div><button type="button" aria-label="Fechar menu">×</button>';
 const body=D.createElement('div');body.className='psy-shell-body';
 for(const el of [...menu.childNodes]){if(el.nodeType===1&&(el.matches('h2,.psy-main-close')||el.tagName==='BUTTON'&&el.textContent.trim().toUpperCase()==='FECHAR'))el.remove();else body.appendChild(el);}
 menu.append(header,body);menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','Menu PSYWORLD');header.querySelector('button').onclick=()=>{menu.style.display='none';D.getElementById('menuBtn')?.focus();};
 const decorate=()=>{for(const id of ['psy-follower-launch','psy-prof-launch','psy-hunt-launch','psy-audio-quick-toggle','psy-fullscreen-btn']){const el=D.getElementById(id);if(el&&!grid.contains(el)){el.classList.add('psy-shell-utility');grid.appendChild(el);}}};decorate();
 // Async audio and lazy modules may register an action later.
 new MutationObserver(decorate).observe(D.body,{childList:true});
 let lastMenu=false,lastContent=false;
 function sync(){const m=menu.style.display!==''&&menu.style.display!=='none',c=!content.hidden;if(m&&!lastMenu&&c){content.hidden=true;D.getElementById('btn-city-content-toggle')?.setAttribute('aria-expanded','false');}else if(c&&!lastContent&&m)menu.style.display='none';lastMenu=menu.style.display!==''&&menu.style.display!=='none';lastContent=!content.hidden;D.body.classList.toggle('psy-shell-open',lastMenu||lastContent);if(lastMenu||lastContent)W.PsyCityTouch?.stop();}
 new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['style']});new MutationObserver(sync).observe(content,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(()=>{for(const el of [...menu.children])if(el!==header&&el!==body)body.appendChild(el);}).observe(menu,{childList:true});
 D.addEventListener('keydown',e=>{if(e.key==='Escape'&&lastMenu){menu.style.display='none';e.preventDefault();}if(e.key!=='Tab'||!D.body.classList.contains('psy-shell-open'))return;const root=lastMenu?menu:content,items=[...root.querySelectorAll('button,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);if(!items.length)return;const first=items[0],last=items.at(-1);if(e.shiftKey&&D.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&D.activeElement===last){e.preventDefault();first.focus();}},true);
 sync();
 }
 if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(window,document);
