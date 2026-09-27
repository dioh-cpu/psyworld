/* Authenticated, server-authoritative player market adapter. */
(function(W,D){
'use strict';
if(W.__PSY_MARKET_ONLINE_V1__)return;
W.__PSY_MARKET_ONLINE_V1__=true;
const SESSION_KEY='psyworld_online_session_v23';
const $=id=>D.getElementById(id);
const parse=s=>{try{return s?JSON.parse(s):null}catch(_){return null}};
const legacy={
  render:W.renderMarket5, open:W.openMarket5,
  listItem:W.psyMarketListItem, listPoke:W.psyMarketListPoke,
  listDiamonds:W.psyMarketListDiamonds, buy:W.psyMarketBuy,
  post:W.psyMarketPostListing
};
let listings=[],stateCache=null,renderSeq=0;
function session(){return parse(localStorage.getItem(SESSION_KEY))}
function hasSession(){return !!session()?.access_token}
function notify(message,ms){try{W.notif?.(message,ms||3200)}catch(_){console.log(message)}}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(value){return Number(value||0).toLocaleString('pt-BR')}
function currencyName(currency){return currency==='gold'?'Gold':'💎 Diamantes'}
async function getToken(){
  const authority=W.psyOnlineAuthorityV26;
  if(typeof authority?.token==='function'){
    try{return await authority.token()}catch(_){}
  }
  let saved=session();
  if(!saved?.access_token)throw new Error('Entre na sua conta online para usar o mercado entre jogadores.');
  if(Number(saved.expires_at||0)>Date.now()+60000)return saved.access_token;
  if(!saved.refresh_token)throw new Error('Sua sessão expirou. Entre novamente na conta online.');
  const configResponse=await fetch('/api/config',{cache:'no-store'});
  const config=await configResponse.json().catch(()=>({}));
  if(!configResponse.ok||!config.onlineConfigured||!config.supabaseUrl||!config.supabaseAnonKey)throw new Error('Servidor online indisponível.');
  const response=await fetch(config.supabaseUrl+'/auth/v1/token?grant_type=refresh_token',{
    method:'POST',
    headers:{apikey:config.supabaseAnonKey,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:saved.refresh_token})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw new Error(data.message||'Sua sessão expirou. Entre novamente.');
  saved={...saved,...data,user:data.user||saved.user,expires_at:Date.now()+Number(data.expires_in||3600)*1000};
  localStorage.setItem(SESSION_KEY,JSON.stringify(saved));
  return saved.access_token;
}
async function requestUrl(url,opt={},authToken){
  const t=authToken||await getToken(),options={...opt};
  options.headers={...(options.headers||{}),Authorization:'Bearer '+t,'Content-Type':'application/json'};
  const response=await fetch(url,options),data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||data.message||('HTTP '+response.status));
  return data;
}
function marketRequest(path,opt,token){return requestUrl('/api/market'+path,opt||{},token)}
function ensureUI(){
  let screen=$('screen-market5');
  if(screen)return screen;
  screen=D.createElement('div');screen.id='screen-market5';
  screen.style.cssText='display:none;position:fixed;inset:0;background:#000e;z-index:1000007;overflow:auto;padding:10px';
  screen.innerHTML='<div class="psy-modal-panel" style="max-width:1050px;margin:auto;padding:12px;position:relative"><button class="psy-close-x" onclick="document.getElementById(\\'screen-market5\\').style.display=\\'none\\'">×</button><h2 class="psy-title-glint">🌐 MARKET GLOBAL</h2><div class="psy-market-warn" id="market5-status"></div><div class="psy-tabbar5"><button onclick="renderMarket5(\\'browse\\')">COMPRAR</button><button onclick="renderMarket5(\\'sell\\')">ANUNCIAR</button></div><div id="market5-content"></div></div>';
  D.body.appendChild(screen);return screen;
}
function setStatus(text){const el=$('market5-status')||D.querySelector('#screen-market5 .psy-market-warn');if(el)el.textContent=text}
function localStatus(){setStatus('Modo local: anúncios aparecem apenas neste aparelho. Entre na conta online para negociar com outros jogadores.')}
function onlineStatus(){setStatus('Mercado entre jogadores: itens, diamantes e Pokémon são transferidos pelo servidor.')}
async function refreshState(token){
  const data=await requestUrl('/api/online-state',{cache:'no-store'},token);
  if(!data?.player)throw new Error('Ative o Cloud Save e sincronize seu save antes de negociar.');
  const P=W.P;if(!P)return data;
  P.gold=Number(data.player.gold||0);P.diamonds=Number(data.player.diamonds||0);P.psycoin=Number(data.player.psycoin||0);
  const inventory={};
  for(const item of (Array.isArray(data.inventory)?data.inventory:[])){
    const quantity=Math.max(0,Number(item.quantity||0));
    if(quantity>0)inventory[String(item.item_key)]=quantity;
  }
  P.inventory=inventory;stateCache=data;
  try{W.updateHUD?.()}catch(_){}
  try{W.autoSave?.()}catch(_){}
  return data;
}
function pokemonFingerprint(mon){
  const d=mon||{};
  return {
    id:Number(d.id||d.species_id||0),name:String(d.name||'').trim().toLowerCase(),
    level:Number(d.level||1),xp:Number(d.exp??d.xp??0),shiny:!!d.shiny,
    mega:String(d.megaForm||d.mega_form||'').toLowerCase(),tier:String(d.tier||'').toLowerCase(),
    resets:Number(d.resets||0)
  };
}
function samePokemon(a,b){
  const x=pokemonFingerprint(a),y=pokemonFingerprint(b);
  return x.id===y.id&&x.level===y.level&&x.shiny===y.shiny&&x.mega===y.mega&&
    (!x.name||!y.name||x.name===y.name)&&(!x.tier||!y.tier||x.tier===y.tier)&&x.xp===y.xp&&x.resets===y.resets;
}
async function serverPokemonUid(mon,token){
  const data=stateCache&&stateCache.pokemon?stateCache:await requestUrl('/api/online-state',{cache:'no-store'},token);
  const candidates=(data.pokemon||[]).filter(row=>!row.locked_reason&&samePokemon(mon,{
    id:row.species_id, name:row.data?.name, level:row.level, xp:row.xp, shiny:row.shiny,
    megaForm:row.mega_form, tier:row.tier, resets:row.resets
  }));
  if(candidates.length!==1)throw new Error(candidates.length?'Há Pokémon iguais no save; sincronize e escolha outro.':'Este Pokémon ainda não está sincronizado com o servidor.');
  return candidates[0].pokemon_uid;
}
function serverMon(listing){return listing?.pokemon&&typeof listing.pokemon==='object'?listing.pokemon:null}
function addPokemon(mon){
  if(!mon||!W.P)return;
  W.P.box=Array.isArray(W.P.box)?W.P.box:[];
  if(!W.P.box.some(existing=>samePokemon(existing,mon)))W.P.box.push({...mon});
}
function renderSell(){
  const c=$('market5-content');if(!c)return;
  const P=W.P||{},items=Object.entries(P.inventory||{}).filter(([name,quantity])=>Number(quantity)>0&&!/Poção/i.test(name));
  const itemOptions=items.map(([name,quantity])=>'<option value="'+escapeHtml(name)+'">'+escapeHtml(name)+' ('+money(quantity)+')</option>').join('');
  const pokemon=Array.isArray(P.box)?P.box:[];
  const pokemonOptions=pokemon.map((mon,index)=>'<option value="'+index+'">'+escapeHtml((mon.name||W.getPokeName?.(mon.id)||('Pokémon '+mon.id))+' Lv'+(mon.level||1)+' '+(mon.tier||''))+'</option>').join('');
  c.innerHTML='<div class="psy-system-card"><b>Anunciar item</b><div class="psy-desc">Taxa de 5% em Gold; Diamantes sem taxa. O servidor confere saldo e faz o escrow.</div><select id="market-sell-item">'+itemOptions+'</select><input id="market-sell-qty" type="number" min="1" value="1"><select id="market-sell-cur"><option value="gold">Gold</option><option value="diamonds">Diamantes</option></select><input id="market-sell-price" type="number" min="1" value="1000"><button onclick="psyMarketListItem()">ANUNCIAR ITEM</button></div>'+
  '<div class="psy-system-card" style="margin-top:8px"><b>Anunciar Pokémon</b><div class="psy-desc">O Pokémon é bloqueado no servidor até venda ou cancelamento.</div><select id="market-sell-poke">'+pokemonOptions+'</select><select id="market-sell-pcur"><option value="gold">Gold</option><option value="diamonds">Diamantes</option></select><input id="market-sell-pprice" type="number" min="1" value="100000"><button onclick="psyMarketListPoke()">ANUNCIAR POKÉMON</button></div>'+
  '<div class="psy-system-card" style="margin-top:8px"><b>Vender Diamantes por Gold</b><div class="psy-desc">Diamantes ficam em escrow até venda ou cancelamento.</div><input id="market-dia-qty" type="number" min="1" value="10"><input id="market-dia-price" type="number" min="1" value="100000"><button onclick="psyMarketListDiamonds()">ANUNCIAR DIAMANTES</button></div>';
}
function formatListing(x){
  const mon=serverMon(x);let title='',description='';
  if(x.kind==='item'){title=String(Number(x.quantity||1))+'x '+String(x.item_key||'Item');description='Item • '+String(x.seller_name||'Treinador')}
  else if(x.kind==='diamonds'){title=String(Number(x.quantity||0))+' Diamantes';description='Vendedor • '+String(x.seller_name||'Treinador')}
  else if(x.kind==='pokemon'){title=(mon?.name||W.getPokeName?.(mon?.id)||('Pokémon '+(mon?.id||'')))+' Lv'+Number(mon?.level||1);description=[mon?.shiny?'✨ Shiny':'',mon?.tier||'',mon?.rarity?.n||mon?.rarity||'', 'Vendedor • '+String(x.seller_name||'Treinador')].filter(Boolean).join(' • ')}
  else{title='Anúncio';description='Vendedor • '+String(x.seller_name||'Treinador')}
  const currency=x.currency==='gold'?'gold':'diamonds',actions=x.is_own?'<button onclick="psyMarketCancel('+x._index+')">CANCELAR ANÚNCIO</button>':'<button onclick="psyMarketBuy('+x._index+')">COMPRAR</button>';
  return '<div class="psy-market-card '+currency+'"><b>'+escapeHtml(title)+'</b><div class="psy-desc">'+escapeHtml(description)+'</div><div class="psy-market-price '+currency+'">'+money(x.price)+' '+currencyName(x.currency)+'</div><div class="psy-desc">Anúncio #'+escapeHtml(String(x.id).slice(0,8))+'</div>'+actions+'</div>';
}
async function renderOnline(){
  const c=$('market5-content');if(!c)return;
  const seq=++renderSeq;c.innerHTML='<div style="color:#94a3b8">Carregando anúncios do servidor...</div>';
  try{
    const response=await marketRequest('/list'),next=Array.isArray(response.list)?response.list:[];
    if(seq!==renderSeq)return;
    listings=next;onlineStatus();
    c.innerHTML='<div class="psy-market-grid">'+(listings.length?listings.map((item,index)=>formatListing({...item,_index:index})).join(''):'<div style="color:#777">Nenhum anúncio global ativo.</div>')+'</div>';
  }catch(error){if(seq===renderSeq)c.innerHTML='<div class="psy-market-warn">'+escapeHtml(error.message||'Mercado online indisponível.')+'</div>'}
}
function renderLocal(tab){
  localStatus();
  if(typeof legacy.render==='function')return legacy.render(tab);
  const c=$('market5-content');if(c)c.textContent='Mercado local indisponível.';
}
W.psyMarketFetch=async function(path,opt){
  if(!hasSession())return null;
  try{return await marketRequest(path,opt||{})}catch(error){console.warn('[Market]',error);return null}
};
W.psyMarketPostListing=async function(listing){
  if(!hasSession()&&typeof legacy.post==='function')return legacy.post(listing);
  return marketRequest('/list',{method:'POST',body:JSON.stringify(listing||{})});
};
W.renderMarket5=async function(tab){
  ensureUI();
  if(!hasSession())return renderLocal(tab||'browse');
  if(tab==='sell'){onlineStatus();return renderSell()}
  return renderOnline();
};
W.openMarket5=function(){
  ensureUI().style.display='block';
  W.renderMarket5('browse');
};
W.psyMarketListItem=async function(){
  if(!hasSession()&&typeof legacy.listItem==='function')return legacy.listItem();
  const item=$('market-sell-item')?.value,quantity=Math.floor(Number($('market-sell-qty')?.value)),currency=$('market-sell-cur')?.value||'gold',price=Math.floor(Number($('market-sell-price')?.value));
  if(!item||!Number.isSafeInteger(quantity)||quantity<1||!Number.isSafeInteger(price)||price<1)return notify('Informe item, quantidade e preço válidos.');
  try{
    const result=await marketRequest('/list',{method:'POST',body:JSON.stringify({kind:'item',item_key:item,quantity,currency,price})});
    await refreshState(await getToken()).catch(()=>{});
    notify('✅ Anúncio criado e item reservado no servidor.');
    W.renderMarket5('browse');
    return result;
  }catch(error){notify('❌ '+(error.message||'Falha ao anunciar.'),4200)}
};
W.psyMarketListPoke=async function(){
  if(!hasSession()&&typeof legacy.listPoke==='function')return legacy.listPoke();
  const index=Math.floor(Number($('market-sell-poke')?.value)),mon=W.P?.box?.[index],currency=$('market-sell-pcur')?.value||'gold',price=Math.floor(Number($('market-sell-pprice')?.value));
  if(!mon||!Number.isSafeInteger(price)||price<1)return notify('Escolha um Pokémon e informe um preço válido.');
  try{
    const t=await getToken(),state=await requestUrl('/api/online-state',{cache:'no-store'},t);
    if(!state?.player)throw new Error('Ative o Cloud Save e sincronize antes de negociar.');
    const pokemon_uid=await serverPokemonUid(mon,t);
    const result=await marketRequest('/list',{method:'POST',body:JSON.stringify({kind:'pokemon',pokemon_uid,currency,price})},t);
    W.P.box.splice(index,1);await refreshState(t).catch(()=>{});
    try{W.autoSave?.()}catch(_){}
    notify('✅ Pokémon reservado no servidor.');
    W.renderMarket5('browse');
    return result;
  }catch(error){notify('❌ '+(error.message||'Falha ao anunciar.'),4200)}
};
W.psyMarketListDiamonds=async function(){
  if(!hasSession()&&typeof legacy.listDiamonds==='function')return legacy.listDiamonds();
  const quantity=Math.floor(Number($('market-dia-qty')?.value)),price=Math.floor(Number($('market-dia-price')?.value));
  if(!Number.isSafeInteger(quantity)||quantity<1||!Number.isSafeInteger(price)||price<1)return notify('Informe quantidade e preço válidos.');
  try{
    const result=await marketRequest('/list',{method:'POST',body:JSON.stringify({kind:'diamonds',quantity,currency:'gold',price})});
    await refreshState(await getToken()).catch(()=>{});
    notify('✅ Diamantes reservados no servidor.');
    W.renderMarket5('browse');
    return result;
  }catch(error){notify('❌ '+(error.message||'Falha ao anunciar.'),4200)}
};
W.psyMarketCancel=async function(index){
  const listing=listings[index];if(!listing?.is_own)return;
  try{
    const token=await getToken();
    await marketRequest('/cancel',{method:'POST',body:JSON.stringify({listing_id:listing.id})},token);
    const state=await refreshState(token).catch(()=>null);
    if(listing.kind==='pokemon'&&listing.pokemon)addPokemon(listing.pokemon);
    try{W.autoSave?.()}catch(_){}
    notify('✅ Anúncio cancelado; escrow devolvido pelo servidor.');
    W.renderMarket5('browse');
    return state;
  }catch(error){notify('❌ '+(error.message||'Falha ao cancelar.'),4200)}
};
W.psyMarketBuy=async function(index){
  if(!hasSession()&&typeof legacy.buy==='function')return legacy.buy(index);
  const listing=listings[index];if(!listing)return;
  if(listing.is_own)return notify('Esse anúncio pertence à sua conta.');
  try{
    const token=await getToken();
    await marketRequest('/buy/'+encodeURIComponent(listing.id),{method:'POST',body:JSON.stringify({listing_id:listing.id})},token);
    await refreshState(token).catch(()=>{});
    if(listing.kind==='pokemon'&&listing.pokemon)addPokemon(listing.pokemon);
    try{W.autoSave?.()}catch(_){}
    notify('✅ Compra confirmada pelo servidor.');
    W.renderMarket5('browse');
  }catch(error){notify('❌ '+(error.message||'Falha na compra.'),4200)}
};
})(window,document);
