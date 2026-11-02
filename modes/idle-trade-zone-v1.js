/* PSY IDLE · Shared social plaza for the main PSYWORLD account. */
(function(W,D){
'use strict';
const PRESENCE_CHANNEL='idle-trade-zone';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host=null,client=null,channel=null,userId='',nickname='Treinador',x=50,y=54,selectedId='',renderedSelectedId='',players=new Map(),friendRequests=[],tradeInvites=[],pollTimer=0,trackTimer=0,socialBusy=false,dmBusy=false,keyHandler=null,onCityReturn=null,onHunt=null;

function style(){
 if(D.getElementById('psy-ir-trade-zone-css'))return;
 const node=D.createElement('style');node.id='psy-ir-trade-zone-css';
 node.textContent='#psy-idle-realistic .psy-ir-trade-card{box-sizing:border-box;width:min(1180px,calc(100vw - 32px));height:min(760px,calc(100dvh - 34px));max-height:none;overflow:hidden;padding:clamp(14px,2vw,24px);display:flex;flex-direction:column;text-align:left}'+
 '#psy-idle-realistic .psy-ir-trade-card header h2{font-size:clamp(24px,4vw,36px)}#psy-idle-realistic .psy-ir-trade-card [data-trade-status]{margin:4px 0 12px;min-height:20px}#psy-idle-realistic .psy-ir-trade-card .zone-note{margin:4px 0 10px}'+
 '#psy-idle-realistic .psy-ir-trade-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(245px,310px);gap:12px;flex:1;min-height:0}'+
 '#psy-idle-realistic .psy-ir-trade-map{position:relative;min-height:300px;overflow:hidden;border:1px solid #5bbcae;border-radius:18px;background:radial-gradient(ellipse at 50% 50%,#8bba79 0%,#689864 66%,#436d60 100%);box-shadow:inset 0 0 45px #0c352955;cursor:crosshair}'+
 '#psy-idle-realistic .psy-ir-trade-map:before{content:"";position:absolute;inset:0;opacity:.34;background:repeating-linear-gradient(0deg,transparent 0 42px,#d4e9bd 43px 45px,transparent 46px 82px),repeating-linear-gradient(90deg,transparent 0 42px,#d4e9bd 43px 45px,transparent 46px 82px);pointer-events:none}'+
 '#psy-idle-realistic .psy-ir-trade-map:after{content:"";position:absolute;left:46%;top:0;bottom:0;width:9%;background:#c6b886;opacity:.75;pointer-events:none}'+
 '#psy-idle-realistic .psy-ir-trade-decor{position:absolute;inset:0;pointer-events:none;z-index:1}#psy-idle-realistic .psy-ir-trade-decor span{position:absolute;filter:drop-shadow(0 4px 3px #18351c66);font-size:clamp(19px,3vw,30px)}'+
 '#psy-idle-realistic .psy-ir-trade-decor span:nth-child(1){left:7%;top:9%}#psy-idle-realistic .psy-ir-trade-decor span:nth-child(2){right:7%;top:13%}#psy-idle-realistic .psy-ir-trade-decor span:nth-child(3){left:8%;bottom:10%}#psy-idle-realistic .psy-ir-trade-decor span:nth-child(4){right:8%;bottom:9%}'+
 '#psy-idle-realistic .psy-ir-trade-player-layer{position:absolute;inset:0;z-index:2}#psy-idle-realistic .psy-ir-trade-avatar{position:absolute;left:calc(var(--x)*1%);top:calc(var(--y)*1%);transform:translate(-50%,-50%);min-width:70px;max-width:116px;display:grid;justify-items:center;gap:2px;padding:3px 6px;border:1px solid #d5f6ef;border-radius:13px;background:#10243be8;color:#f6ffff;box-shadow:0 5px 12px #0b1b2980;cursor:pointer;font:700 11px system-ui;touch-action:manipulation}'+
 '#psy-idle-realistic .psy-ir-trade-avatar span{font-size:24px;line-height:1}#psy-idle-realistic .psy-ir-trade-avatar b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#psy-idle-realistic .psy-ir-trade-avatar[data-self="1"]{border-color:#ffe38c;box-shadow:0 0 0 2px #ffe38c55,0 5px 12px #0b1b2980}#psy-idle-realistic .psy-ir-trade-avatar[data-selected="1"]{outline:3px solid #fb8adf}'+
 '#psy-idle-realistic .psy-ir-trade-sidebar{display:flex;flex-direction:column;gap:9px;min-height:0;overflow:auto;padding-right:3px}#psy-idle-realistic .psy-ir-trade-panel{padding:11px;border:1px solid #345579;border-radius:13px;background:#0a1729d9}#psy-idle-realistic .psy-ir-trade-panel h3{margin:0 0 7px;color:#ffe39a;font-size:14px}#psy-idle-realistic .psy-ir-trade-panel p{margin:4px 0;color:#aac0d3;font-size:11px;line-height:1.45}'+
 '#psy-idle-realistic .psy-ir-trade-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:8px}#psy-idle-realistic .psy-ir-trade-actions button,#psy-idle-realistic .psy-ir-trade-entry button{min-height:34px;padding:6px 8px;font-size:10px}#psy-idle-realistic .psy-ir-trade-entry{display:grid;gap:5px;padding:7px 0;border-top:1px solid #263d57}#psy-idle-realistic .psy-ir-trade-entry:first-of-type{border-top:0}#psy-idle-realistic .psy-ir-trade-entry>div{display:flex;gap:5px}'+
 '#psy-idle-realistic .psy-ir-trade-dm-feed{display:grid;gap:5px;max-height:112px;overflow:auto;margin-top:8px;padding-right:3px}#psy-idle-realistic .psy-ir-trade-dm-feed p{padding:6px;border-radius:8px;background:#13253b;color:#d8eaf5}#psy-idle-realistic .psy-ir-trade-dm-feed p[data-mine="1"]{background:#14363e}#psy-idle-realistic .psy-ir-trade-dm-feed small{display:block;color:#8cb5c6;font-size:8px}'+
 '#psy-idle-realistic .psy-ir-trade-message{display:grid;grid-template-columns:1fr auto;gap:5px;margin-top:8px}#psy-idle-realistic .psy-ir-trade-message[hidden]{display:none}#psy-idle-realistic .psy-ir-trade-message input{min-width:0;width:100%;padding:8px;border:1px solid #496b85;border-radius:8px;background:#081426;color:#fff;font:11px system-ui}'+
 '#psy-idle-realistic .psy-ir-trade-controls{display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,38px);gap:4px;justify-content:center;margin-top:7px}#psy-idle-realistic .psy-ir-trade-controls button{min-height:36px;padding:3px}#psy-idle-realistic .psy-ir-trade-controls [data-trade-move="up"]{grid-column:2}#psy-idle-realistic .psy-ir-trade-controls [data-trade-move="left"]{grid-column:1;grid-row:2}#psy-idle-realistic .psy-ir-trade-controls [data-trade-move="down"]{grid-column:2;grid-row:2}#psy-idle-realistic .psy-ir-trade-controls [data-trade-move="right"]{grid-column:3;grid-row:2}'+
 '#psy-idle-realistic .psy-ir-trade-card footer{gap:8px;margin-top:10px}#psy-idle-realistic .psy-ir-trade-card footer button{min-height:40px;font-size:12px}'+
 '@media(max-width:760px){#psy-idle-realistic .psy-ir-trade-card{width:calc(100vw - 12px);height:calc(100dvh - 12px);max-height:none;padding:11px;border-radius:15px}#psy-idle-realistic .psy-ir-trade-layout{grid-template-columns:1fr;grid-template-rows:minmax(230px,1fr) minmax(145px,.8fr);gap:8px}#psy-idle-realistic .psy-ir-trade-map{min-height:230px}#psy-idle-realistic .psy-ir-trade-sidebar{display:grid;grid-template-columns:1fr 1fr;align-content:start}#psy-idle-realistic .psy-ir-trade-controls{grid-column:1/-1}#psy-idle-realistic .psy-ir-trade-card footer{flex-direction:row}#psy-idle-realistic .psy-ir-trade-card footer button{min-width:0;font-size:10px}}'+
 '@media(max-width:420px){#psy-idle-realistic .psy-ir-trade-sidebar{grid-template-columns:1fr}#psy-idle-realistic .psy-ir-trade-card header h2{font-size:22px}}';
 D.head.appendChild(node);
}
function spawn(id){
 let h=2166136261;for(const c of String(id||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 const n=h>>>0;return{x:12+n%76,y:18+(n>>>8)%63};
}
function status(message,error=false){
 const el=host?.querySelector('[data-trade-status]');if(el){el.textContent=message;el.dataset.error=error?'1':'0'}
}
function cleanup(){
 if(pollTimer){clearInterval(pollTimer);pollTimer=0}
 if(trackTimer){clearTimeout(trackTimer);trackTimer=0}
 if(keyHandler){D.removeEventListener('keydown',keyHandler);keyHandler=null}
 const oldChannel=channel,oldClient=client;channel=null;client=null;userId='';selectedId='';renderedSelectedId='';players.clear();friendRequests=[];tradeInvites=[];socialBusy=false;dmBusy=false;
 if(oldChannel&&oldClient)try{Promise.resolve(oldClient.removeChannel(oldChannel)).catch(()=>{})}catch(_){}
}
function scheduleTrack(immediate=false){
 if(trackTimer){clearTimeout(trackTimer);trackTimer=0}
 const active=channel;trackTimer=setTimeout(async()=>{
  trackTimer=0;if(!active||active!==channel||!userId)return;
  try{await active.track({user_id:userId,nickname,area:'trade-zone',x,y,at:Date.now()})}catch(_){}
 },immediate?0:180);
}
function move(dx,dy){
 if(!userId||!channel)return;
 x=Math.max(5,Math.min(95,x+dx));y=Math.max(9,Math.min(87,y+dy));
 renderPlayers();scheduleTrack();
}
function renderSelection(){
 const panel=host?.querySelector('[data-trade-selected]');if(!panel)return;
 const peer=players.get(selectedId);
 if(!peer||String(peer.user_id)===String(userId)){if(renderedSelectedId==='')return;renderedSelectedId='';panel.innerHTML='<h3>Treinador</h3><p>Clique em outro jogador na praça para ver as opções de interação.</p>';return}
 if(renderedSelectedId===String(peer.user_id))return;renderedSelectedId=String(peer.user_id);
 panel.innerHTML='<h3>🧑‍🤝‍🧑 '+esc(peer.nickname||'Treinador')+'</h3><p>Jogador online na Trade Zone.</p><div class="psy-ir-trade-actions"><button data-trade-action="friend">Pedir amizade</button><button data-trade-action="trade">Solicitar troca</button><button data-trade-action="message">Mensagem privada</button><button data-trade-action="block">Bloquear</button></div><div class="psy-ir-trade-dm-feed" data-trade-dm-feed><p>Carregando conversa…</p></div><form class="psy-ir-trade-message" data-trade-message hidden><input name="body" maxlength="500" placeholder="Escreva uma mensagem" aria-label="Mensagem privada"><button>Enviar</button></form>';
}
function renderSocial(){
 const req=host?.querySelector('[data-trade-friend-requests]'),inv=host?.querySelector('[data-trade-invites]');
 if(req)req.innerHTML=friendRequests.length?friendRequests.map(q=>'<div class="psy-ir-trade-entry"><b>'+esc(q.nickname||'Treinador')+'</b><div><button data-trade-inbox-action="friend-accept" data-peer="'+esc(q.user_id)+'">Aceitar</button><button data-trade-inbox-action="friend-decline" data-peer="'+esc(q.user_id)+'">Recusar</button></div></div>').join(''):'<p>Sem pedidos pendentes.</p>';
 if(inv)inv.innerHTML=tradeInvites.length?tradeInvites.map(q=>{
  const t=q.trade,incoming=t.status==='invited'&&String(t.player_b)===String(userId),open=t.status==='open',label=open?'Sala de troca aberta':incoming?'Convite recebido':'Aguardando resposta';
  const actions=incoming?'<button data-trade-inbox-action="trade-accept" data-trade-id="'+esc(t.id)+'">Aceitar troca</button><button data-trade-inbox-action="trade-cancel" data-trade-id="'+esc(t.id)+'">Recusar</button>':open?'<button data-trade-inbox-action="trade-cancel" data-trade-id="'+esc(t.id)+'">Cancelar</button>':'';
  return '<div class="psy-ir-trade-entry"><b>'+esc(q.thread.nickname||'Treinador')+'</b><small>'+label+'</small><div>'+actions+'</div></div>';
 }).join(''):'<p>Sem pedidos de troca.</p>';
}
async function api(action,payload){const fn=W.PsyIdleSocial?.social;if(typeof fn!=='function')throw new Error('A área social do Idle não está disponível.');return fn(action,payload||{})}
async function loadDirectMessages(){
 const peerId=selectedId,panel=host?.querySelector('[data-trade-dm-feed]');if(!peerId||!panel||dmBusy)return;dmBusy=true;
 try{const result=await api('dm_list',{peer_id:peerId});if(peerId!==selectedId||!panel.isConnected)return;const messages=Array.isArray(result?.messages)?result.messages:[];panel.innerHTML=messages.length?messages.map(m=>'<p data-mine="'+(String(m.sender_id)===String(userId)?'1':'0')+'">'+esc(m.body||'')+'<small>'+(String(m.sender_id)===String(userId)?'Você':'Treinador')+' · '+esc(m.created_at?new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'agora')+'</small></p>').join(''):'<p>Sem mensagens privadas. Envie a primeira.</p>';panel.scrollTop=panel.scrollHeight}
 catch(e){if(peerId===selectedId)panel.textContent=String(e.message||'Não foi possível carregar a conversa.')}finally{dmBusy=false}
}
async function refreshSocial(){
 if(socialBusy||!userId||!host||host.style.display==='none')return;socialBusy=true;
 try{
  const result=await Promise.all([api('friend_requests',{}),api('inbox',{})]);
  friendRequests=Array.isArray(result[0]?.requests)?result[0].requests:[];
  const threads=(Array.isArray(result[1]?.threads)?result[1].threads:[]).filter(t=>t.metadata?.kind==='trade_invite'&&t.metadata?.trade_id).slice(0,12);
  tradeInvites=(await Promise.all(threads.map(async thread=>{try{const state=await api('trade_state',{trade_id:thread.metadata.trade_id});return{thread,trade:state?.trade||null}}catch(_){return null}}))).filter(q=>q?.trade&&['invited','open'].includes(q.trade.status));
  renderSocial();if(selectedId)loadDirectMessages();
 }catch(e){status(String(e.message||'Falha ao atualizar pedidos.'),true)}
 finally{socialBusy=false}
}
function renderPlayers(){
 if(!host||host.style.display==='none'||!channel)return;
 const state=channel.presenceState?.()||{},all=new Map();
 for(const rows of Object.values(state))for(const row of rows||[])if(row?.user_id)all.set(String(row.user_id),row);
 if(userId)all.set(String(userId),{...(all.get(String(userId))||{}),user_id:userId,nickname,x,y});
 players=all;
 if(selectedId&&!all.has(String(selectedId)))selectedId='';
 const count=host.querySelector('[data-trade-count]'),layer=host.querySelector('[data-trade-player-layer]');
 if(count)count.textContent=all.size+' treinador(es) na praça';
 if(layer)layer.innerHTML=[...all.values()].map(p=>{
  const id=String(p.user_id),point=spawn(id),px=Math.max(4,Math.min(96,Number.isFinite(Number(p.x))?Number(p.x):point.x)),py=Math.max(7,Math.min(91,Number.isFinite(Number(p.y))?Number(p.y):point.y)),self=id===String(userId);
  return '<button class="psy-ir-trade-avatar" type="button" data-trade-player="'+esc(id)+'" data-self="'+(self?'1':'0')+'" data-selected="'+(id===selectedId?'1':'0')+'" style="--x:'+px+';--y:'+py+'" aria-label="'+esc(p.nickname||'Treinador')+(self?' (você)':'')+'"><span>'+(self?'🧑🏻‍🎤':'🧑‍🚀')+'</span><b>'+esc(p.nickname||'Treinador')+(self?' · Você':'')+'</b></button>';
 }).join('');
 const list=host.querySelector('[data-trade-players]');if(list)list.innerHTML=[...all.values()].map(p=>'<article><span>🧑‍🚀</span><b>'+esc(p.nickname||'Treinador')+'</b><small>'+(String(p.user_id)===String(userId)?'Você':'Na praça')+'</small></article>').join('');
 renderSelection();
}
async function connect(){
 if(!host||host.style.display==='none')return;
 try{
  const c=await W.PsyIdleSocial?.client?.();if(!c)throw new Error('AUTH_REQUIRED');
  const r=await c.auth.getSession();if(r.error)throw r.error;
  const session=r.data?.session;if(!session?.user)throw new Error('AUTH_REQUIRED');
  if(!host||host.style.display==='none')return;
  client=c;userId=String(session.user.id);nickname=String(W.PsyIdleSocial?.trainerName?.()||session.user.user_metadata?.trainer_name||'Treinador').slice(0,24)||'Treinador';
  const point=spawn(userId);x=point.x;y=point.y;
  await c.realtime.setAuth(session.access_token);
  const presence=c.channel(PRESENCE_CHANNEL,{config:{private:true,presence:{key:userId}}});channel=presence;
  presence.on('presence',{event:'sync'},renderPlayers).subscribe(async state=>{
   if(presence!==channel)return;
   if(state==='SUBSCRIBED'){
    await presence.track({user_id:userId,nickname,area:'trade-zone',x,y,at:Date.now()});
    if(presence!==channel)return;
    status('Você está na praça. Clique no chão para andar ou use WASD / setas.');
    renderPlayers();refreshSocial();pollTimer=setInterval(refreshSocial,5000);
   }else if(state==='CHANNEL_ERROR'||state==='TIMED_OUT')status('Conexão com a praça indisponível. Sua conta PSYWORLD continua ativa.',true);
  });
  keyHandler=event=>{
   if(!host||host.style.display==='none'||!channel)return;
   if(event.target?.matches?.('input,textarea,select,[contenteditable="true"]'))return;
   const m={ArrowUp:[0,-5],w:[0,-5],W:[0,-5],ArrowDown:[0,5],s:[0,5],S:[0,5],ArrowLeft:[-5,0],a:[-5,0],A:[-5,0],ArrowRight:[5,0],d:[5,0],D:[5,0]},v=m[event.key];
   if(v){event.preventDefault();move(v[0],v[1])}
  };
  D.addEventListener('keydown',keyHandler);
 }catch(e){status('Entre na conta principal do PSYWORLD pelo menu principal para aparecer na Trade Zone. O chat continua disponível sem login.',true)}
}
async function playerAction(action){
 const peer=players.get(selectedId);if(!peer||String(peer.user_id)===String(userId))return;
 if(action==='message'){const form=host.querySelector('[data-trade-message]');if(form){form.hidden=false;form.querySelector('input')?.focus()}loadDirectMessages();return}
 if(action==='block'&&W.confirm&&!W.confirm('Bloquear '+(peer.nickname||'este jogador')+'?'))return;
 try{
  const result=action==='friend'?await api('friend_request',{peer_id:peer.user_id}):action==='trade'?await api('trade_create',{peer_id:peer.user_id}):action==='block'?await api('block',{peer_id:peer.user_id}):null;
  if(!result)return;
  const message=action==='friend'?(result.status==='accepted'?'Vocês agora são amigos.':'Pedido de amizade enviado.'):action==='trade'?'Pedido de troca enviado.':'Jogador bloqueado.';
  status(message);W.notif?.(message,2800);await refreshSocial();
 }catch(e){status(String(e.message||'Não foi possível concluir a ação.'),true)}
}
async function inboxAction(button){
 try{
  const action=button.dataset.tradeInboxAction;
  if(action==='friend-accept')await api('friend_accept',{peer_id:button.dataset.peer});
  else if(action==='friend-decline')await api('friend_remove',{peer_id:button.dataset.peer});
  else if(action==='trade-accept')await api('trade_accept',{trade_id:button.dataset.tradeId});
  else if(action==='trade-cancel')await api('trade_cancel',{trade_id:button.dataset.tradeId});
  status(action==='trade-accept'?'A sala de troca foi aberta.':'Solicitação atualizada.');await refreshSocial();
 }catch(e){status(String(e.message||'Não foi possível atualizar a solicitação.'),true)}
}
function onClick(event){
 const closeButton=event.target.closest('[data-trade-close],[data-trade-city]'),hunt=event.target.closest('[data-trade-hunt]');
 if(closeButton){close(true);return}if(hunt){close();if(typeof onHunt==='function')onHunt();else D.getElementById('psy-ir-maps')?.click();return}
 const moveButton=event.target.closest('[data-trade-move]');
 if(moveButton){const m={up:[0,-5],down:[0,5],left:[-5,0],right:[5,0]}[moveButton.dataset.tradeMove];if(m)move(m[0],m[1]);return}
 const action=event.target.closest('[data-trade-action]');if(action){playerAction(action.dataset.tradeAction);return}
 const inbox=event.target.closest('[data-trade-inbox-action]');if(inbox){inboxAction(inbox);return}
 const avatar=event.target.closest('[data-trade-player]');if(avatar){selectedId=avatar.dataset.tradePlayer;renderPlayers();loadDirectMessages();return}
 const map=event.target.closest('[data-trade-map]');if(map&&userId){const rect=map.getBoundingClientRect();if(rect.width&&rect.height){x=Math.max(5,Math.min(95,(event.clientX-rect.left)/rect.width*100));y=Math.max(9,Math.min(87,(event.clientY-rect.top)/rect.height*100));renderPlayers();scheduleTrack()}}
}
async function onSubmit(event){
 if(!event.target.matches('[data-trade-message]'))return;
 event.preventDefault();const peer=players.get(selectedId),input=event.target.elements.body,body=String(input?.value||'').trim();if(!peer||!body)return;
 try{await api('dm_send',{peer_id:peer.user_id,body});input.value='';status('Mensagem privada enviada.');W.notif?.('Mensagem enviada para '+(peer.nickname||'o treinador')+'.',2300);await loadDirectMessages()}
 catch(e){status(String(e.message||'Mensagem não enviada.'),true)}
}
function close(showCity=false){
 const current=host;cleanup();if(current){current.style.display='none';current.onclick=null;current.onsubmit=null}
 if(showCity&&typeof onCityReturn==='function')onCityReturn();
}
function open(options={}){
 host=D.getElementById('psy-ir-trade-room');if(!host)return;
 onCityReturn=options.onCity||null;onHunt=options.onHunt||null;
 cleanup();style();
 host.innerHTML='<div class="psy-ir-trade-card"><header><div><small>TELEPORTE · CIDADE INICIAL</small><h2>🌀 Trade Zone</h2><p data-trade-count>Conectando...</p></div><button data-trade-close aria-label="Voltar para a cidade">✕</button></header>'+
 '<p class="zone-note">Praça social compartilhada: encontre jogadores, ande pela área e envie pedidos de amizade, mensagens privadas e troca.</p><div data-trade-status aria-live="polite">Conectando à conta PSYWORLD…</div><div class="psy-ir-trade-layout">'+
 '<div><div class="psy-ir-trade-map" data-trade-map aria-label="Praça multiplayer; clique para mover seu treinador"><div class="psy-ir-trade-decor" aria-hidden="true"><span>🌳</span><span>⛲</span><span>🌲</span><span>🪴</span></div><div class="psy-ir-trade-player-layer" data-trade-player-layer></div></div>'+
 '<div class="psy-ir-trade-controls" aria-label="Mover treinador"><button data-trade-move="up" aria-label="Mover para cima">▲</button><button data-trade-move="left" aria-label="Mover para a esquerda">◀</button><button data-trade-move="down" aria-label="Mover para baixo">▼</button><button data-trade-move="right" aria-label="Mover para a direita">▶</button></div></div>'+
 '<aside class="psy-ir-trade-sidebar"><section class="psy-ir-trade-panel" data-trade-selected><h3>Treinador</h3><p>Clique em outro jogador na praça para ver as opções de interação.</p></section>'+
 '<section class="psy-ir-trade-panel"><h3>Pedidos de amizade</h3><div data-trade-friend-requests><p>Carregando…</p></div></section><section class="psy-ir-trade-panel"><h3>Pedidos de troca</h3><div data-trade-invites><p>Carregando…</p></div></section></aside></div>'+
 '<footer><button data-trade-city>Voltar à cidade inicial</button><button data-trade-hunt>Ir para uma hunt individual</button></footer></div>';
 host.style.display='flex';host.onclick=onClick;host.onsubmit=onSubmit;connect();
}
function reconnectForSharedAccount(){if(host&&host.style.display!=='none'){cleanup();status('Conectando à conta online…');return connect()}}
W.addEventListener('storage',event=>{if(event.key==='psyworld_online_session_v23')reconnectForSharedAccount()});
W.addEventListener('psyworld-online-session-changed',reconnectForSharedAccount);
W.PsyIdleTradeZone={open,close};
})(window,document);
