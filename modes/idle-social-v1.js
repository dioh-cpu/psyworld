/* PSY IDLE · Chat global e registros pessoais. Supabase Realtime usa somente chave publicável. */
(function(W,D){
  'use strict';
  const SESSION_KEY='psy_idle_session_v1';
  const OAUTH_PENDING_KEY='psyIdleSocialOAuthPendingV1';
  const CLOUD_SESSION_KEY='psyworld_online_session_v23';
  const CONFIG_KEY='psyIdleSocialPrefsV1';
  const LOG_KEY='psyIdleSocialLogsV1';
  const PROJECT_URL='https://otwgavwvjxuwtgncjbiq.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_oCx3u2zhMVHiK2gQ5b2OfA_9mq34j_r';
  const CHANNELS=[
    {id:'global',label:'Global',icon:'🌐',online:true},
    {id:'doubts',label:'Dúvidas',icon:'❔',online:true},
    {id:'captures',label:'Capturas',icon:'🎯'},
    {id:'trade',label:'Trade',icon:'🤝',online:true},
    {id:'loot',label:'Loot',icon:'🎁'},
    {id:'tasks',label:'Tasks',icon:'📜'}
  ];
  const MARKET_CATEGORIES=[['all','Tudo'],['pokemon','Pokémon'],['item','Itens'],['stone','Stones'],['egg','Eggs'],['profession','Profissão'],['psycoin','Psycoins']];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse=(s,f)=>{try{return s?JSON.parse(s):f}catch(_){return f}};
  const readSession=()=>parse(localStorage.getItem(SESSION_KEY),null);
  const readPrefs=()=>parse(localStorage.getItem(CONFIG_KEY),{});
  let supa=null,clientPromise=null,localSupabaseScriptPromise=null,activeChannel=null,channelSub=null,activeView='chat',activeTab='global',filter='all',search='',root=null,screen=null,refreshTaskTimer=0,realtimeRetryTimer=0,realtimeRetries=0,realtimeStatus='CLOSED',realtimeConnectPromise=null,realtimeConnectSlug='';
  let connectionGeneration=0;
  const historyCache=new Map(),historyRequests=new Map();
  const localLogs=()=>parse(localStorage.getItem(LOG_KEY),{});
  function saveLogs(x){try{localStorage.setItem(LOG_KEY,JSON.stringify(x))}catch(_){}}
  function logFor(channel){const a=localLogs();return Array.isArray(a[channel])?a[channel]:[]}
  function addLog(channel,entry){const a=localLogs(),list=Array.isArray(a[channel])?a[channel]:[];list.push({...entry,at:Date.now()});a[channel]=list.slice(-160);saveLogs(a);if(root&&activeView==='chat'&&activeTab===channel)renderMessages();if(channel==='tasks')updateTaskBadge(entry)}
  function showToast(msg){try{W.notif?.(msg,3600)}catch(_){}}
  async function getConfig(){
    try{const r=await fetch('/api/config',{cache:'no-store'});if(r.ok){const c=await r.json();if(c?.onlineConfigured&&c?.supabaseUrl&&c?.supabaseAnonKey)return{...c,url:c.supabaseUrl,key:c.supabaseAnonKey}}}catch(_){}
    return{url:PROJECT_URL,key:PUBLISHABLE_KEY,idleMarketEnabled:false,idleAuctionEnabled:false};
  }
  async function getSupabaseCreateClient(){
    try{return(await import('https://esm.sh/@supabase/supabase-js@2.57.0?bundle')).createClient}
    catch(remoteError){
      if(typeof W.supabase?.createClient==='function')return W.supabase.createClient;
      if(!localSupabaseScriptPromise)localSupabaseScriptPromise=new Promise((resolve,reject)=>{const script=D.createElement('script');script.src='/assets/vendor/supabase-js-2.117.2.js';script.async=true;script.onload=()=>resolve(W.supabase?.createClient);script.onerror=()=>reject(remoteError);D.head.appendChild(script)});
      try{const createClient=await localSupabaseScriptPromise;if(typeof createClient!=='function')throw remoteError;return createClient}
      catch(e){localSupabaseScriptPromise=null;throw e}
    }
  }
  async function getClient(){
    if(clientPromise)return clientPromise;
    if(supa)return supa;
    clientPromise=(async()=>{
      const {url,key}=await getConfig();
      if(!url||!key)throw new Error('configuração online indisponível');
      const createClient=await getSupabaseCreateClient();
      supa=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
      supa.auth.onAuthStateChange((event,session)=>{try{if(session){persistSession(session);if(session.access_token)Promise.resolve(supa.realtime.setAuth(session.access_token)).catch(()=>{})}else if(event==='SIGNED_OUT')localStorage.removeItem(SESSION_KEY)}catch(_){}if(['SIGNED_IN','SIGNED_OUT'].includes(event))W.dispatchEvent(new CustomEvent('idle-auth-changed'));if(root&&['SIGNED_IN','TOKEN_REFRESHED','SIGNED_OUT'].includes(event))setTimeout(()=>render(),0)});
      const session=readSession();
      if(session?.access_token){
        const r=await supa.auth.setSession({access_token:session.access_token,refresh_token:session.refresh_token||''});
        if(r.error)throw r.error;
        const live=r.data?.session;
        if(live)persistSession(live);
      }
      return supa;
    })().catch(e=>{clientPromise=null;supa=null;throw e});
    return clientPromise;
  }
  function currentUser(){return readSession()?.user||null}
  function signedIn(){return !!readSession()?.access_token}
  function persistSession(session){
    if(!session?.access_token)return;
    const old=readSession()||{};delete old.provider_token;delete old.provider_refresh_token;
    const expiry=Number(session.expires_at||0);
    const safe={access_token:session.access_token,refresh_token:session.refresh_token||'',token_type:session.token_type||'bearer',expires_in:Number(session.expires_in||3600),expires_at:expiry>0?(expiry<1e12?expiry*1000:expiry):Date.now()+Number(session.expires_in||3600)*1000,user:session.user||old.user};
    try{localStorage.setItem(SESSION_KEY,JSON.stringify({...old,...safe}))}catch(_){}
  }
  function oauthCallbackInfo(){
    const query=new URLSearchParams(W.location.search),hash=new URLSearchParams(W.location.hash.replace(/^#/,''));
    return{pending:query.has('code')||query.has('error')||hash.has('access_token')||hash.has('error')||hash.has('error_description'),error:query.get('error_description')||hash.get('error_description')||query.get('error')||hash.get('error')};
  }
  function clearOAuthCallback(){
    try{const url=new URL(W.location.href);['code','error','error_description','error_code','state'].forEach(k=>url.searchParams.delete(k));url.hash='';W.history.replaceState(W.history.state,D.title,url.pathname+url.search)}catch(_){}
  }
  async function finishOAuthCallback(){
    const callback=oauthCallbackInfo(),oauthPending=localStorage.getItem(OAUTH_PENDING_KEY)==='1';if(!callback.pending&&!oauthPending)return;
    const area=root?.querySelector('[data-login-area]'),status=area?.querySelector('[data-login-status]');
    if(callback.error){localStorage.removeItem(OAUTH_PENDING_KEY);clearOAuthCallback();if(status)status.textContent='Login com GitHub não concluído: '+callback.error;return}
    if(status)status.textContent='Confirmando sua conta do GitHub…';
    try{
      const c=await getClient(),hash=new URLSearchParams(W.location.hash.replace(/^#/,''));
      let data,accessToken=hash.get('access_token'),refreshToken=hash.get('refresh_token')||'';
      if(!accessToken&&oauthPending){const cloudSession=parse(localStorage.getItem(CLOUD_SESSION_KEY),null);accessToken=cloudSession?.access_token||'';refreshToken=cloudSession?.refresh_token||''}
      if(accessToken){
        const result=await c.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
        if(result.error)throw result.error;data=result.data;
      }else{
        const result=await c.auth.getSession();if(result.error)throw result.error;data=result.data;
      }
      if(!data.session?.access_token)throw new Error('O Supabase não confirmou a sessão.');
      persistSession(data.session);localStorage.removeItem(OAUTH_PENDING_KEY);clearOAuthCallback();if(area)area.hidden=true;render();
    }catch(e){localStorage.removeItem(OAUTH_PENDING_KEY);clearOAuthCallback();if(status)status.textContent='Falha ao entrar com GitHub: '+String(e.message||'tente novamente')}
  }
  function wantsChat(slug){return !!root&&!!readPrefs().open&&activeView==='chat'&&activeTab===slug&&signedIn()&&!!CHANNELS.find(c=>c.id===slug)?.online}
  function stopChannel(resetRetries=true){
    connectionGeneration++;
    if(realtimeRetryTimer){clearTimeout(realtimeRetryTimer);realtimeRetryTimer=0}
    if(activeChannel)historyCache.delete(activeChannel);
    const previous=channelSub;
    channelSub=null;activeChannel=null;realtimeStatus='CLOSED';
    realtimeConnectPromise=null;realtimeConnectSlug='';
    if(resetRetries)realtimeRetries=0;
    if(previous&&supa){try{Promise.resolve(supa.removeChannel(previous)).catch(()=>{})}catch(_){}}
  }
  async function connectRealtime(slug){
    if(!wantsChat(slug))return;
    if(activeChannel===slug&&channelSub&&['joining','SUBSCRIBED'].includes(realtimeStatus))return;
    if(realtimeRetryTimer)return;
    if(realtimeConnectPromise&&realtimeConnectSlug===slug)return realtimeConnectPromise;
    if(channelSub||realtimeConnectPromise)stopChannel(false);
    const generation=connectionGeneration;
    const current=()=>generation===connectionGeneration&&wantsChat(slug);
    const run=(async()=>{
      const c=await getClient();const liveResult=await c.auth.getSession();if(liveResult.error)throw liveResult.error;const session=liveResult.data?.session;
      if(!current())return;
      if(!session?.access_token)throw new Error('entre na sua conta online');
      await c.realtime.setAuth(session.access_token);
      if(!current())return;
      activeChannel=slug;realtimeStatus='joining';
      const channel=c.channel(`psyworld-idle-chat:${slug}`,{config:{private:true}});
      channelSub=channel;
      channel.on('broadcast',{event:'INSERT'},msg=>{const payload=msg?.payload||msg||{};const row=payload.new||payload.record||msg?.new||msg?.record||payload;if(row?.id&&row.channel===slug){cacheOnlineMessage(row);if(activeView==='chat'&&activeTab===slug)renderMessages()}})
        .subscribe(status=>{
          if(channelSub!==channel||!current())return;
          realtimeStatus=status;
          if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
            setStatus('Reconectando…',false);historyCache.delete(slug);
            const delay=Math.min(30000,1000*Math.pow(2,realtimeRetries++));
            channelSub=null;activeChannel=null;try{Promise.resolve(c.removeChannel(channel)).catch(()=>{})}catch(_){}
            if(realtimeRetryTimer)clearTimeout(realtimeRetryTimer);
            realtimeRetryTimer=setTimeout(()=>{realtimeRetryTimer=0;if(current())connectRealtime(slug).catch(e=>{if(current())setStatus('Offline • '+e.message,false)})},delay);
          }else if(status==='SUBSCRIBED'){realtimeRetries=0;setStatus('Online • ao vivo',true);loadOnlineMessages(slug,true).then(()=>{if(current())renderMessages()}).catch(e=>console.warn('[Psy Idle chat history]',e))}
        });
    })();
    realtimeConnectSlug=slug;realtimeConnectPromise=run;
    try{await run}finally{if(realtimeConnectPromise===run){realtimeConnectPromise=null;realtimeConnectSlug=''}}
  }
  function cacheOnlineMessage(row){const key='psyIdleChat:'+row.channel,cache=parse(localStorage.getItem(key),[]);if(!cache.some(m=>m.id===row.id)){cache.push(row);while(cache.length>80)cache.shift();try{localStorage.setItem(key,JSON.stringify(cache))}catch(_){}}historyCache.set(row.channel,cache)}
  async function loadOnlineMessages(slug,force=false){
    if(!force&&historyCache.has(slug))return historyCache.get(slug);
    if(historyRequests.has(slug))return historyRequests.get(slug);
    const request=(async()=>{
      const c=await getClient();const {data,error}=await c.from('psy_idle_chat_messages').select('id,channel,username,body,created_at').eq('channel',slug).order('created_at',{ascending:false}).limit(60);
      if(error)throw error;
      const cached=parse(localStorage.getItem('psyIdleChat:'+slug),[]),byId=new Map();
      for(const row of cached)if(row?.id)byId.set(row.id,row);
      for(const row of data||[])if(row?.id)byId.set(row.id,row);
      const rows=Array.from(byId.values()).sort((a,b)=>(Date.parse(a.created_at||'')||0)-(Date.parse(b.created_at||'')||0)).slice(-60);
      try{localStorage.setItem('psyIdleChat:'+slug,JSON.stringify(rows))}catch(_){}
      historyCache.set(slug,rows);return rows;
    })();
    historyRequests.set(slug,request);
    try{return await request}finally{if(historyRequests.get(slug)===request)historyRequests.delete(slug)}
  }
  async function sendOnlineMessage(slug,body){
    const c=await getClient();const {data,error}=await c.rpc('psy_idle_send_chat',{p_channel:slug,p_body:body});
    if(error)throw error;
    if(data?.id){cacheOnlineMessage(data);renderMessages()}
  }
  function setStatus(text,online){const el=root?.querySelector('[data-social-status]');if(el){el.textContent=text;el.dataset.online=online?'1':'0'}}
  function statusForLog(entry){if(entry.type==='capture')return entry.success?'CAPTUROU':'FALHOU';return''}
  function renderLogin(){
    return `<div class="pis-login"><div class="pis-login-art">✦</div><b>Entre para falar com os treinadores</b><small>Conta do Psy Idle. Seus logs locais continuam privados.</small><button type="button" data-login-github style="width:100%;border:1px solid #697386;border-radius:8px;background:#161b22;color:#fff;padding:9px;font-weight:900">Entrar com GitHub</button><label>E-mail<input data-login-email type="email" autocomplete="email" placeholder="seu@email.com"></label><label>Senha<input data-login-pass type="password" autocomplete="current-password" placeholder="Senha"></label><div><button data-login>Entrar</button><button data-signup>Criar conta</button></div><small data-login-status>O chat conecta ao servidor quando sua conta estiver pronta.</small></div>`;
  }
  function renderMessages(){
    if(!root)return;const pane=root.querySelector('[data-social-feed]');if(!pane)return;
    const cfg=CHANNELS.find(x=>x.id===activeTab);let rows=[];
    if(cfg?.online){rows=parse(localStorage.getItem('psyIdleChat:'+activeTab),[])}else rows=logFor(activeTab);
    pane.innerHTML=rows.slice(-60).map(m=>{
      const when=m.created_at?new Date(m.created_at):new Date(Number(m.at||Date.now()));
      if(m.type==='task')return `<article class="pis-task-event"><span>📜</span><div><b>${esc(m.quest||'Task')}</b><small>${esc(m.action||'Derrote')} ${esc(m.pokemon||'Pokémon')} · ${Number(m.current||0)}/${Number(m.goal||0)}</small><i>${Number(m.remaining||0)>0?'Faltam '+Number(m.remaining):'Concluída'}</i></div></article>`;
      if(m.type==='capture')return `<article class="pis-log-row"><span>🎯</span><div><b>${esc(m.name||'Pokémon')}</b><small>${esc(m.ball||'Pokébola')} · ${when.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></div><strong class="${m.success?'pis-success':'pis-fail'}">${statusForLog(m)}</strong></article>`;
      if(m.type==='loot')return `<article class="pis-log-row"><span>🎁</span><div><b>${esc(m.name||'Item')}</b><small>Drop da hunt · ${when.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></div><strong>×${Math.max(1,Number(m.qty||1))}</strong></article>`;
      return `<article class="pis-chat-msg"><div><b>${esc(m.username||'Treinador')}</b><time>${when.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time></div><p>${esc(m.body||m.text||'')}</p></article>`;
    }).join('')||`<div class="pis-empty">${cfg?.online?'Ainda não há mensagens neste canal.':'As atividades vão aparecer aqui enquanto você joga.'}</div>`;
    pane.scrollTop=pane.scrollHeight;
    const compose=root.querySelector('[data-social-compose]');if(compose)compose.hidden=!cfg?.online||!signedIn();
  }
  function updateTaskBadge(entry){
    const nav=root?.querySelector('[data-social-tab="tasks"]');if(nav){let badge=nav.querySelector('small');if(!badge){badge=D.createElement('small');nav.appendChild(badge)}badge.textContent=`${Number(entry.current||0)}/${Number(entry.goal||0)}`}
    if(!screen)return;const top=[...screen.querySelectorAll('button')].find(b=>/quests|missões|tasks/i.test(b.textContent||''));if(top){let badge=top.querySelector('.pis-quest-progress');if(!badge){badge=D.createElement('small');badge.className='pis-quest-progress';top.appendChild(badge)}badge.textContent=`${Number(entry.current||0)}/${Number(entry.goal||0)} ${entry.pokemon||''}`;top.title=`${entry.quest||'Task'} · ${badge.textContent}`}
  }
  function localInventoryNotice(){
    const cats=MARKET_CATEGORIES.map(([v,l])=>`<option value="${v}" ${filter===v?'selected':''}>${l}</option>`).join('');
    return `<div class="pis-market-head"><div><small>PSY IDLE · COMÉRCIO ENTRE JOGADORES</small><b>Market Global</b></div><span data-market-live data-online="0">◌ verificando conexão</span></div><div class="pis-market-filters"><select data-market-filter>${cats}</select><input data-market-search value="${esc(search)}" placeholder="Pesquisar Pokémon ou item…"></div><div class="pis-market-tools"><button data-market-refresh>Atualizar</button><button data-market-sell>Meus anúncios</button></div><div class="pis-market-feed" data-market-feed><div class="pis-empty">${signedIn()?'Carregando anúncios online…':'Entre na conta online para consultar o market.'}</div></div><div class="pis-market-foot">Taxa configurada: 5% do Gold calculado pelo valor do item e raridade · duração máxima: 48h.</div>`;
  }
  function setMarketStatus(label,online){const el=root?.querySelector('[data-market-live]');if(el){el.textContent=label;el.dataset.online=online?'1':'0'}}
  async function refreshMarket(){
    if(activeView==='chat'||!readPrefs().open)return;
    const view=activeView;
    const pane=root?.querySelector('[data-market-feed]');if(!pane)return;
    if(!signedIn()){setMarketStatus('○ conta desconectada',false);pane.innerHTML='<div class="pis-empty">Entre na conta online para consultar o market e os leilões.</div>';return}
    setMarketStatus('◌ verificando servidor',false);
    try{
      const config=await getConfig();
      if(view!==activeView||pane!==root?.querySelector('[data-market-feed]')||!readPrefs().open)return;
      const available=view==='auction'?config.idleAuctionEnabled===true:config.idleMarketEnabled===true;
      if(!available){
        const label=view==='auction'?'Leilão':'Market';
        setStatus('Conta conectada',true);
        setMarketStatus('Em desenvolvimento',false);
        root.querySelectorAll('.pis-market-filters,.pis-market-tools,.pis-market-foot').forEach(el=>{el.hidden=true;el.style.display='none'});
        pane.innerHTML=`<div class="pis-empty"><b>${label} do Psy Idle em desenvolvimento</b><small>As negociações entre jogadores ainda não estão disponíveis neste modo.</small><small>O chat Global, Dúvidas e Trade já está disponível. Volte à aba Chat para conversar.</small></div>`;
        return;
      }
      const c=await getClient();
      const table=view==='auction'?'psy_idle_auction_public':'psy_idle_market_public';
      const {data,error}=await c.from(table).select('*').eq('status','active').order('created_at',{ascending:false}).limit(100);
      if(view!==activeView||pane!==root?.querySelector('[data-market-feed]'))return;
      if(error)throw error;
      setMarketStatus('● online • anúncios atualizados',true);
      const q=search.trim().toLocaleLowerCase('pt-BR');
      const list=(data||[]).filter(x=>(filter==='all'||x.category===filter)&&(!q||`${x.name||''} ${x.seller_name||''}`.toLocaleLowerCase('pt-BR').includes(q)));
      pane.innerHTML=list.map(x=>`<article class="pis-listing"><div class="pis-listing-art">${x.sprite_url?`<img src="${esc(x.sprite_url)}" alt="">`:esc(x.icon||'✦')}</div><div class="pis-listing-info"><b>${esc(x.name||'Item')}</b><small>${esc(x.category||'item')} · ${esc(x.rarity||'')}</small><span>Vendedor: ${esc(x.seller_name||'Treinador')}</span><strong>${Number(x.price||x.current_bid||0).toLocaleString('pt-BR')} ${esc(x.currency||'Gold')}</strong></div><button data-market-offer="${esc(x.id)}" disabled>Indisponível</button></article>`).join('')||'<div class="pis-empty">Nenhum anúncio corresponde aos filtros.</div>';
    }catch(e){
      if(view!==activeView||pane!==root?.querySelector('[data-market-feed]'))return;
      setMarketStatus('○ servidor indisponível',false);
      pane.innerHTML='<div class="pis-empty"><b>Não foi possível carregar os anúncios.</b><small>Tente atualizar novamente. Sua conta e o chat continuam disponíveis.</small></div>';
      console.warn('[Psy Idle market]',e);
    }
  }
  function render(){
    if(!root)return;
    root.classList.toggle('is-minimized',!readPrefs().open);
    const minimized=root.querySelector('[data-social-minimized]');if(minimized)minimized.hidden=!!readPrefs().open;
    const panel=root.querySelector('.pis-window');if(panel)panel.hidden=!readPrefs().open;
    if(!readPrefs().open){stopChannel();return}
    root.querySelectorAll('[data-social-view]').forEach(b=>b.classList.toggle('active',b.dataset.socialView===activeView));
    root.querySelector('[data-social-chat-area]').hidden=activeView!=='chat';
    root.querySelector('[data-social-market-area]').hidden=activeView==='chat';
    root.querySelectorAll('[data-social-tab]').forEach(b=>b.classList.toggle('active',activeView==='chat'&&b.dataset.socialTab===activeTab));
    if(activeView!=='chat'){
      stopChannel();
      setStatus(signedIn()?'Conta conectada':'Conta desconectada',signedIn());
      const market=root.querySelector('[data-social-market-area]');
      if(market){market.innerHTML=localInventoryNotice();market.querySelector('[data-market-filter]')?.addEventListener('change',e=>{filter=e.target.value;refreshMarket()});market.querySelector('[data-market-search]')?.addEventListener('input',e=>{search=e.target.value;refreshMarket()});market.querySelector('[data-market-refresh]')?.addEventListener('click',refreshMarket);market.querySelector('[data-market-sell]')?.addEventListener('click',()=>showToast('As negociações do Psy Idle ainda estão em desenvolvimento.'));refreshMarket()}
      return;
    }
    renderMessages();
    const cfg=CHANNELS.find(x=>x.id===activeTab);
    const compose=root.querySelector('[data-social-compose]');if(compose)compose.hidden=!cfg?.online||!signedIn();
    if(!signedIn())setStatus('Conta desconectada',false);
    else if(cfg?.online){setStatus(realtimeRetryTimer?'Reconectando…':activeChannel===cfg.id&&realtimeStatus==='SUBSCRIBED'?'Online • ao vivo':'Conectando…',!!(activeChannel===cfg.id&&realtimeStatus==='SUBSCRIBED'));connectRealtime(cfg.id).catch(e=>{if(wantsChat(cfg.id))setStatus('Offline • '+e.message,false)});loadOnlineMessages(activeTab).then(()=>{if(wantsChat(cfg.id))renderMessages()}).catch(e=>{console.warn('[Psy Idle chat history]',e);if(wantsChat(cfg.id)&&realtimeStatus!=='SUBSCRIBED')setStatus('Histórico indisponível • conectando ao chat…',false)})}
    else setStatus('Registros deste aparelho',false);
  }
  function mount(s){
    screen=s;if(D.getElementById('psy-idle-social-dock'))return;installStyles();root=D.createElement('aside');root.id='psy-idle-social-dock';
    root.innerHTML=`<button type="button" data-social-minimized aria-label="Abrir chat" title="Abrir chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.7A3.7 3.7 0 0 1 7.7 2h8.6A3.7 3.7 0 0 1 20 5.7v7.1a3.7 3.7 0 0 1-3.7 3.7h-5.6l-5 4v-4.5A3.7 3.7 0 0 1 4 12.8z"/><path d="M8 7.7h8M8 11h5"/></svg><i></i></button><section class="pis-window"><header class="pis-head"><div><small>PSY IDLE · SOCIAL</small><b>Mensagens & comércio</b><span data-social-status data-online="0">Carregando</span></div><button type="button" data-social-minimize aria-label="Minimizar">−</button></header><nav class="pis-main-tabs"><button data-social-view="chat">Chat</button><button data-social-view="market">Market</button><button data-social-view="auction">Leilão</button></nav><div data-social-chat-area><nav class="pis-channels">${CHANNELS.map(c=>`<button type="button" data-social-tab="${c.id}" title="${c.label}">${c.icon}<span>${c.label}</span></button>`).join('')}</nav><div class="pis-feed" data-social-feed></div><form class="pis-compose" data-social-compose hidden><input maxlength="240" autocomplete="off" placeholder="Escreva uma mensagem…"><button type="submit" aria-label="Enviar">➤</button></form><div data-login-area hidden></div></div><section class="pis-market-area" data-social-market-area hidden></section></section>`;
    s.appendChild(root);
    root.querySelectorAll('[data-social-minimize],[data-social-minimized]').forEach(b=>b.addEventListener('click',()=>{const p=readPrefs();p.open=!p.open;try{localStorage.setItem(CONFIG_KEY,JSON.stringify(p))}catch(_){}render()}));
    root.querySelectorAll('[data-social-view]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.socialView!=='chat'&&W.PsyIdleCommerce){W.PsyIdleCommerce.open(b.dataset.socialView);return}activeView=b.dataset.socialView;stopChannel();render()}));
    root.querySelectorAll('[data-social-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.socialTab;stopChannel();render()}));
    const form=root.querySelector('[data-social-compose]');form?.addEventListener('submit',async e=>{e.preventDefault();const input=form.querySelector('input'),body=input?.value.trim();if(!body)return;if(body.length>240)return;const btn=form.querySelector('button');btn.disabled=true;try{await sendOnlineMessage(activeTab,body);input.value=''}catch(err){setStatus(String(err.message||'Mensagem não enviada'),false)}finally{btn.disabled=false;input?.focus()}});
    if(!signedIn()){const area=root.querySelector('[data-login-area]');if(area){area.hidden=false;area.innerHTML=renderLogin();wireLogin(area)}}
    const prefs=readPrefs();if(typeof prefs.open!=='boolean'){prefs.open=true;try{localStorage.setItem(CONFIG_KEY,JSON.stringify(prefs))}catch(_){}}
    render();
    if(oauthCallbackInfo().pending||localStorage.getItem(OAUTH_PENDING_KEY)==='1')setTimeout(finishOAuthCallback,0);
  }
  function wireLogin(area){
    const login=async signup=>{const status=area.querySelector('[data-login-status]'),email=area.querySelector('[data-login-email]')?.value.trim(),password=area.querySelector('[data-login-pass]')?.value||'';if(!email||password.length<6){if(status)status.textContent='Informe e-mail e senha (mín. 6 caracteres).';return}try{const c=await getClient();const r=signup?await c.auth.signUp({email,password}):await c.auth.signInWithPassword({email,password});if(r.error)throw r.error;if(r.data?.session){persistSession(r.data.session);area.hidden=true;render()}else if(status)status.textContent='Conta criada. Confirme o e-mail e depois entre.'}catch(e){if(status)status.textContent=String(e.message||'Falha ao autenticar')}};
    area.querySelector('[data-login]')?.addEventListener('click',()=>login(false));area.querySelector('[data-signup]')?.addEventListener('click',()=>login(true));
    area.querySelector('[data-login-github]')?.addEventListener('click',async()=>{const status=area.querySelector('[data-login-status]'),btn=area.querySelector('[data-login-github]');btn.disabled=true;if(status)status.textContent='Abrindo a autenticação do GitHub…';try{const c=await getClient();localStorage.setItem(OAUTH_PENDING_KEY,'1');const {error}=await c.auth.signInWithOAuth({provider:'github',options:{redirectTo:W.location.origin+W.location.pathname}});if(error)throw error}catch(e){localStorage.removeItem(OAUTH_PENDING_KEY);if(status)status.textContent=String(e.message||'Falha ao iniciar login com GitHub');btn.disabled=false}});
  }
  function installStyles(){if(D.getElementById('psy-idle-social-css'))return;const style=D.createElement('style');style.id='psy-idle-social-css';style.textContent=`
  #psy-idle-social-dock{position:absolute;left:12px;bottom:12px;z-index:1600;font:12px/1.35 system-ui,Segoe UI,sans-serif;color:#eefaff;pointer-events:none}
  #psy-idle-social-dock *{box-sizing:border-box}#psy-idle-social-dock button{font:inherit;color:inherit;cursor:pointer}
  #psy-idle-social-dock [data-social-minimized]{pointer-events:auto;width:50px;height:50px;border-radius:17px;border:1px solid #76e8f0;background:linear-gradient(145deg,#12394a,#242047);box-shadow:0 8px 24px #0009,0 0 20px #46d9ef44;display:grid;place-items:center;position:relative}
  #psy-idle-social-dock [data-social-minimized] svg{width:25px;height:25px;fill:none;stroke:#c5f7ff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}#psy-idle-social-dock [data-social-minimized] i{position:absolute;right:7px;top:6px;width:8px;height:8px;border-radius:50%;background:#6df2be;box-shadow:0 0 8px #6df2be}
  #psy-idle-social-dock .pis-window{pointer-events:auto;width:min(370px,calc(100vw - 22px));height:min(450px,66vh);min-height:310px;display:flex;flex-direction:column;overflow:hidden;border:1px solid #62dce7;border-radius:16px;background:linear-gradient(135deg,#0b1427f7,#101e37f5 62%,#211b3af5);box-shadow:0 18px 55px #000b,0 0 18px #44d5e72a;backdrop-filter:blur(10px)}
  #psy-idle-social-dock .pis-window[hidden]{display:none!important}#psy-idle-social-dock [data-social-minimized][hidden]{display:none!important}
  #psy-idle-social-dock .pis-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #314863;background:linear-gradient(105deg,#152b42,#1e1a3b)}
  #psy-idle-social-dock .pis-head div{display:grid;gap:1px}#psy-idle-social-dock .pis-head small{color:#74eaf0;font-size:8px;letter-spacing:1.3px;font-weight:900}#psy-idle-social-dock .pis-head b{font-size:14px;color:#ffe5b6}#psy-idle-social-dock .pis-head span{font-size:9px;color:#92afc3}#psy-idle-social-dock .pis-head span[data-online="1"]{color:#7df0c1}
  #psy-idle-social-dock .pis-head>button{width:30px;height:30px;border-radius:9px;border:1px solid #496782;background:#142b42;font-size:20px;color:#bdefff}
  #psy-idle-social-dock .pis-main-tabs{display:flex;gap:5px;padding:7px 9px 5px}#psy-idle-social-dock .pis-main-tabs button{flex:1;border:1px solid #344e6e;border-radius:9px;background:#121e34;padding:7px 4px;color:#a9c1d7;font-size:10px;font-weight:900}#psy-idle-social-dock .pis-main-tabs button.active{color:#092032;background:linear-gradient(110deg,#6be4e7,#a7efce);border-color:#aafff0}
  #psy-idle-social-dock [data-social-chat-area]{display:flex;flex-direction:column;flex:1;min-height:0}#psy-idle-social-dock [data-social-chat-area][hidden],#psy-idle-social-dock [data-social-market-area][hidden]{display:none}
  #psy-idle-social-dock .pis-channels{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:3px;padding:4px 8px 7px;border-bottom:1px solid #293e57}#psy-idle-social-dock .pis-channels button{position:relative;display:grid;justify-items:center;gap:2px;min-width:0;padding:5px 1px;border:1px solid transparent;border-radius:8px;background:transparent;color:#a9c3d7;font-size:13px}#psy-idle-social-dock .pis-channels span{font-size:7px;white-space:nowrap}#psy-idle-social-dock .pis-channels button.active{border-color:#54cee2;background:#174252;color:#eaffff}#psy-idle-social-dock .pis-channels small{position:absolute;right:-2px;top:-4px;max-width:46px;overflow:hidden;padding:1px 4px;border-radius:7px;background:#f0b858;color:#21162a;font-size:7px;font-weight:1000;white-space:nowrap}
  #psy-idle-social-dock .pis-feed{flex:1;min-height:0;overflow:auto;padding:8px;scrollbar-width:thin;scrollbar-color:#476a87 transparent}#psy-idle-social-dock .pis-chat-msg{padding:7px 8px;margin:0 0 7px;border:1px solid #283b59;border-radius:10px;background:#111c30cc}#psy-idle-social-dock .pis-chat-msg>div{display:flex;justify-content:space-between;color:#8ae5eb;font-size:9px}#psy-idle-social-dock .pis-chat-msg time{color:#748ca5}#psy-idle-social-dock .pis-chat-msg p{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;color:#e2edf9;font-size:11px}
  #psy-idle-social-dock .pis-log-row,.pis-task-event{display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:6px;border:1px solid #2b4460;border-radius:11px;background:linear-gradient(110deg,#122238,#122e38);font-size:10px}.pis-log-row>span,.pis-task-event>span{font-size:17px}.pis-log-row>div,.pis-task-event>div{flex:1;min-width:0;display:grid;gap:2px}.pis-log-row small,.pis-task-event small{color:#94adc4;font-size:8px}.pis-log-row strong{font-size:8px;color:#9cd4e4}.pis-log-row .pis-success{color:#77f3a7}.pis-log-row .pis-fail{color:#ff91a7}.pis-task-event i{font-size:8px;color:#ffd56d;font-style:normal}.pis-empty{padding:20px 12px;text-align:center;color:#a1b5ca;font-size:10px}.pis-empty b,.pis-empty small{display:block}.pis-empty small{margin-top:7px;color:#8ba1b8}
  #psy-idle-social-dock .pis-compose{display:flex;gap:6px;padding:8px;border-top:1px solid #273c59}#psy-idle-social-dock .pis-compose input,.pis-login input,.pis-market-filters input,.pis-market-filters select{min-width:0;width:100%;border:1px solid #344d6d;border-radius:9px;background:#091326;color:#effaff;padding:8px 9px;font:inherit;font-size:10px;outline:none}#psy-idle-social-dock .pis-compose input:focus,.pis-login input:focus{border-color:#6ae3e9;box-shadow:0 0 0 2px #52cddd22}#psy-idle-social-dock .pis-compose button{width:34px;border:1px solid #70e8e7;border-radius:9px;background:linear-gradient(120deg,#4cd6dc,#9cecc5);color:#0a2533;font-weight:1000}#psy-idle-social-dock .pis-compose button:disabled{opacity:.5}
  #psy-idle-social-dock .pis-login{display:grid;gap:6px;padding:9px;border-top:1px solid #273d5c}#psy-idle-social-dock .pis-login-art{color:#ffdc91;font-size:20px}#psy-idle-social-dock .pis-login>b{color:#f2e4c9;font-size:10px}#psy-idle-social-dock .pis-login>small{color:#8da8bf;font-size:8px}#psy-idle-social-dock .pis-login label{display:grid;gap:3px;color:#a4bdd1;font-size:8px}#psy-idle-social-dock .pis-login>div{display:flex;gap:6px}#psy-idle-social-dock .pis-login button,.pis-market-tools button{flex:1;border:1px solid #466784;border-radius:8px;background:#18324a;padding:7px;font-size:9px;font-weight:900}#psy-idle-social-dock .pis-login button:first-child{background:linear-gradient(110deg,#2e91a4,#4e9c87);color:#061d27;border-color:#7eeed2}
  #psy-idle-social-dock .pis-market-area{flex:1;min-height:0;overflow:auto;padding:8px}.pis-market-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 8px}.pis-market-head div{display:grid}.pis-market-head small{font-size:7px;letter-spacing:1px;color:#79e9ec}.pis-market-head b{font-size:14px;color:#ffe7b7}.pis-market-head span{font-size:8px;color:#7ef0bd}.pis-market-filters{display:grid;grid-template-columns:94px 1fr;gap:5px}.pis-market-filters select{font-size:9px}.pis-market-tools{display:flex;gap:5px;margin:7px 0}.pis-market-feed{display:grid;gap:5px}.pis-listing{display:grid;grid-template-columns:36px minmax(0,1fr) 72px;align-items:center;gap:7px;padding:7px;border:1px solid #2b435e;border-radius:10px;background:linear-gradient(110deg,#14223a,#172238)}.pis-listing-art{width:34px;height:34px;display:grid;place-items:center;color:#ffd782;font-size:17px}.pis-listing-art img{width:34px;height:34px;object-fit:contain;image-rendering:pixelated}.pis-listing-info{display:grid;gap:2px;min-width:0}.pis-listing-info b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e9f5ff;font-size:9px}.pis-listing-info small,.pis-listing-info span{font-size:7px;color:#8da7be}.pis-listing-info strong{font-size:9px;color:#7fe9ce}.pis-listing>button{border:1px solid #405a73;border-radius:8px;background:#101d30;color:#738ba2;padding:6px 3px;font-size:7px}.pis-market-foot{margin:8px 0 2px;color:#829ab1;font-size:7px;line-height:1.4}#psy-idle-realistic .psy-ir-suite-bar button{position:relative}
  #psy-idle-realistic .psy-ir-suite-bar .pis-quest-progress{position:absolute;z-index:3;top:-6px;right:-6px;display:block;max-width:118px;padding:2px 4px;border:1px solid #d6b958;border-radius:6px;background:#172a36;color:#ffe18a;font-size:7px;font-weight:900;line-height:1.1;white-space:nowrap;box-shadow:0 2px 7px #0008}
  @media(max-width:600px){#psy-idle-social-dock{left:6px;bottom:7px}#psy-idle-social-dock .pis-window{width:min(360px,calc(100vw - 12px));height:min(55vh,410px);min-height:290px;border-radius:14px}#psy-idle-social-dock .pis-channels span{font-size:6px}}
  `;D.head.appendChild(style)}
  function install(){const s=D.getElementById('psy-idle-realistic');if(s&&getComputedStyle(s).display!=='none'){mount(s);return}if(!D.body)return;const obs=new MutationObserver(()=>{const now=D.getElementById('psy-idle-realistic');if(now&&getComputedStyle(now).display!=='none'){mount(now);obs.disconnect()}});obs.observe(D.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});setTimeout(()=>obs.disconnect(),120000)}
  W.addEventListener('psy-idle-social-log',e=>{const d=e.detail||{};if(d.type==='capture')addLog('captures',d);if(d.type==='loot')addLog('loot',d);if(d.type==='task')addLog('tasks',d)});
  W.addEventListener('storage',e=>{if(e.key===SESSION_KEY&&root)render()});
  W.PsyIdleSocial={client:getClient,open(){if(!root){install();return}const p=readPrefs();p.open=true;try{localStorage.setItem(CONFIG_KEY,JSON.stringify(p))}catch(_){}render()},log:addLog};
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',install,{once:true});else install();
  setTimeout(install,500);
})(window,document);
