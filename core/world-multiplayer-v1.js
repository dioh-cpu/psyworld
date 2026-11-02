/* Authenticated, cosmetic realtime presence for the classic PSYWORLD World map. */
(function(W,D){
'use strict';
const SESSION_KEY='psyworld_online_session_v23';
const REGIONS=new Set(['kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea']);
const TOPIC_PREFIX='psyworld-world-room:';
let supa=null,authListener=null,channel=null,room=null,session=null,userId='',region='',connectTask=null,generation=0;
let wanted=false,retryAt=0,reconcileTask=null,presence=new Map(),positions=new Map(),lastSent=null,lastSentAt=0,pulseTimer=0,heartbeatTimer=0,retryTimer=0,statusEl=null;

function parse(value,fallback){try{return value?JSON.parse(value):fallback}catch(_){return fallback}}
function savedSession(){return parse(localStorage.getItem(SESSION_KEY),null)}
function snapshot(){try{return typeof W.__psyWorldMPStateV1==='function'?W.__psyWorldMPStateV1()||{}:{}}catch(_){return{}}}
function cleanText(value,max){return String(value||'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,max)}
function nickFrom(state){const meta=state&&state.profile;return cleanText(state.nickname||meta?.nickname||session?.user?.user_metadata?.trainer_name||session?.user?.user_metadata?.name||'Treinador',24)||'Treinador'}
function ensureStatus(){
  if(statusEl?.isConnected)return statusEl;
  const screen=D.getElementById('screen-world');if(!screen)return null;
  statusEl=D.getElementById('psy-world-multiplayer-status');
  if(!statusEl){statusEl=D.createElement('div');statusEl.id='psy-world-multiplayer-status';statusEl.style.cssText='position:absolute;top:112px;left:10px;z-index:12;padding:6px 10px;border:1px solid #334155;border-radius:9px;background:rgba(2,6,23,.88);color:#cbd5e1;font:700 11px Arial,sans-serif;pointer-events:none';screen.appendChild(statusEl)}
  return statusEl;
}
function setStatus(text,color){
  const el=ensureStatus();if(!el)return;
  el.textContent=text;el.style.borderColor=color||'#334155';el.style.color=color||'#cbd5e1';
}
async function getClient(){
  if(!supa){
    const response=await fetch('/api/config',{cache:'no-store'});
    const config=await response.json().catch(()=>({}));
    if(!response.ok||!config.onlineConfigured||!config.supabaseUrl||!config.supabaseAnonKey)throw new Error('Conexão online indisponível.');
    const module=await import('https://esm.sh/@supabase/supabase-js@2.57.0?bundle');
    supa=module.createClient(config.supabaseUrl,config.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
    authListener=supa.auth.onAuthStateChange((event,next)=>{
      try{
        if(next?.access_token){
          const previous=savedSession()||{};
          localStorage.setItem(SESSION_KEY,JSON.stringify({...previous,...next,user:next.user||previous.user,expires_at:Date.now()+Number(next.expires_in||3600)*1000}));
          session=next;userId=String(next.user?.id||userId);
          if(next.access_token)Promise.resolve(supa.realtime.setAuth(next.access_token)).catch(()=>{});
        }else if(event==='SIGNED_OUT'){
          localStorage.removeItem(SESSION_KEY);session=null;userId='';
        }
      }catch(_){}
    });
  }
  const saved=savedSession();
  if(!saved?.access_token)throw new Error('Entre na sua conta online para aparecer no World.');
  const currentResult=await supa.auth.getSession();
  let current=currentResult.data?.session||null;
  const savedId=String(saved.user?.id||'');
  if(!current?.access_token||(savedId&&current.user?.id&&savedId!==current.user.id)){
    const restored=await supa.auth.setSession({access_token:saved.access_token,refresh_token:saved.refresh_token||''});
    if(restored.error)throw restored.error;
    current=restored.data?.session||null;
  }
  if(!current?.access_token)throw new Error('Sua sessão online expirou. Entre novamente.');
  session=current;userId=String(current.user?.id||savedId||'');
  if(!userId)throw new Error('Não consegui confirmar sua conta online.');
  try{localStorage.setItem(SESSION_KEY,JSON.stringify({...saved,...current,user:current.user||saved.user,expires_at:Date.now()+Number(current.expires_in||3600)*1000}))}catch(_){}
  await supa.realtime.setAuth(current.access_token);
  return current;
}
async function api(action,payload,auth,keepalive){
  const response=await fetch('/api/world-room?action='+encodeURIComponent(action),{
    method:'POST',
    headers:{'Authorization':'Bearer '+auth.access_token,'Content-Type':'application/json'},
    body:JSON.stringify({...payload,action:action}),
    keepalive:!!keepalive
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Falha na conexão da sala.');
  return data;
}
function localProfile(state){
  const active=state.activePokemon||{};
  return{
    nickname:nickFrom(state),
    pokemon:cleanText(active.name||active.species||'',20),
    level:Math.max(1,Math.min(999,Number(active.level||1)))
  };
}
function roomStatus(){
  const total=presence.size+(channel?1:0);
  setStatus('● '+(channel?'Online':'Conectando')+' · '+total+' treinador'+(total===1?'':'es'),channel?'#34d399':'#fbbf24');
}
function rebuildPresence(){
  if(!channel)return;
  const next=new Map();
  const state=channel.presenceState()||{};
  for(const [key,values] of Object.entries(state)){
    if(key===userId)continue;
    const meta=Array.isArray(values)&&values.length?values[values.length-1]:{};
    next.set(String(key),{nickname:cleanText(meta?.nickname||'Treinador',24)||'Treinador',pokemon:cleanText(meta?.pokemon||'',20),level:Math.max(1,Number(meta?.level||1))});
  }
  presence=next;
  for(const id of positions.keys())if(!presence.has(id))positions.delete(id);
  roomStatus();
}
function angleDistance(a,b){let d=(a||0)-(b||0);while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return Math.abs(d)}
function positionPayload(){
  const state=snapshot();
  return{
    uid:userId,
    x:Number(state.x),
    y:Number(state.y),
    angle:Number(state.angle)||0,
    pokemon:cleanText(state.activePokemon?.name||'',20),
    level:Math.max(1,Math.min(999,Number(state.activePokemon?.level||1))),
    sent_at:Date.now()
  };
}
function sendPosition(force){
  if(!channel||!userId||!room)return;
  const payload=positionPayload(),now=Date.now();
  if(!Number.isFinite(payload.x)||!Number.isFinite(payload.y))return;
  const moved=!lastSent||Math.hypot(payload.x-lastSent.x,payload.y-lastSent.y)>.055||angleDistance(payload.angle,lastSent.angle)>.055;
  if(!force&&!moved&&now-lastSentAt<1800)return;
  if(!force&&now-lastSentAt<180)return;
  lastSent={x:payload.x,y:payload.y,angle:payload.angle};lastSentAt=now;
  try{channel.send({type:'broadcast',event:'world_position',payload:payload}).catch(()=>{})}catch(_){}
}
function acceptPosition(payload){
  if(!payload||typeof payload!=='object')return;
  const id=String(payload.uid||'');
  if(!id||id===userId||!presence.has(id))return;
  const now=Date.now(),previous=positions.get(id);
  if(previous&&now-previous.receivedAt<75)return;
  const x=Number(payload.x),y=Number(payload.y),angle=Number(payload.angle);
  if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(angle))return;
  if(x<0||y<0||x>80||y>80)return;
  positions.set(id,{x:x,y:y,angle:angle,nickname:presence.get(id)?.nickname||'Treinador',pokemon:cleanText(payload.pokemon||presence.get(id)?.pokemon||'',20),level:Math.max(1,Math.min(999,Number(payload.level||presence.get(id)?.level||1))),receivedAt:now});
}
function failChannel(failed){
  if(channel!==failed)return;
  channel=null;room=null;presence.clear();positions.clear();
  clearInterval(pulseTimer);clearInterval(heartbeatTimer);pulseTimer=0;heartbeatTimer=0;
  setStatus('● Reconectando ao World…','#fbbf24');retryAt=Date.now()+3500;
  try{const removed=supa?.removeChannel(failed);removed?.catch?.(()=>{})}catch(_){}
}
function startTimers(){
  if(!pulseTimer)pulseTimer=setInterval(()=>sendPosition(false),180);
  if(!heartbeatTimer)heartbeatTimer=setInterval(async()=>{
    if(!room||!session?.access_token||!supa)return;
    try{
      const live=(await supa.auth.getSession()).data?.session;
      if(!live?.access_token)return;
      session=live;
      await supa.realtime.setAuth(live.access_token);
      await api('heartbeat',{room_id:room.room_id},live,false);
    }catch(_){setStatus('● Reconectando…','#fbbf24')}
  },20000);
}
async function connectRoom(nextRegion){
  if(connectTask||!wanted)return;
  const attempt=++generation;
  region=nextRegion;
  const task=(async()=>{
    let entered=null,createdChannel=null;
    try{
      setStatus('● Conectando ao World…','#fbbf24');
      const auth=await getClient();
      if(attempt!==generation||!wanted)return;
      const state=snapshot(),profile=localProfile(state);
      entered=await api('enter',{region:nextRegion,nickname:profile.nickname},auth,false);
      if(attempt!==generation||!wanted){api('leave',{room_id:entered.room_id},auth,true).catch(()=>{});return}
      room=entered;
      const topic=String(entered.topic||TOPIC_PREFIX+entered.room_id);
      createdChannel=supa.channel(topic,{config:{private:true,presence:{key:userId},broadcast:{self:false}}});
      channel=createdChannel;
      createdChannel.on('presence',{event:'sync'},()=>{rebuildPresence();sendPosition(true)});
      createdChannel.on('presence',{event:'join'},()=>{rebuildPresence();sendPosition(true)});
      createdChannel.on('presence',{event:'leave'},()=>rebuildPresence());
      createdChannel.on('broadcast',{event:'world_position'},message=>acceptPosition(message?.payload));
      const subscribed=await new Promise(resolve=>{
        let settled=false;
        const timeout=setTimeout(()=>{if(!settled){settled=true;resolve(false)}},12000);
        createdChannel.subscribe(status=>{
          if(status==='SUBSCRIBED'&&!settled){settled=true;clearTimeout(timeout);resolve(true)}
          if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
            failChannel(createdChannel);
            if(!settled){settled=true;clearTimeout(timeout);resolve(false)}
            retryAt=Date.now()+3500;
          }
        });
      });
      if(!subscribed)throw new Error('Não foi possível entrar na sala em tempo real.');
      if(attempt!==generation||!wanted){try{await supa.removeChannel(createdChannel)}catch(_){};api('leave',{room_id:entered.room_id},auth,true).catch(()=>{});return}
      const tracked=await createdChannel.track({nickname:profile.nickname,pokemon:profile.pokemon,level:profile.level});
      if(tracked&&tracked!=='ok'&&tracked.status!=='ok')throw new Error('A presença do jogador não foi confirmada.');
      rebuildPresence();roomStatus();startTimers();sendPosition(true);
    }catch(error){
      if(createdChannel){try{await supa?.removeChannel(createdChannel)}catch(_){}}
      if(room?.room_id===entered?.room_id)room=null;
      if(channel===createdChannel)channel=null;
      presence.clear();positions.clear();
      if(entered&&session?.access_token)api('leave',{room_id:entered.room_id},session,true).catch(()=>{});
      if(attempt===generation){setStatus('● '+String(error?.message||'World offline'),'#fb7185');retryAt=Date.now()+5000}
    }
  })();
  connectTask=task;
  try{await task}finally{if(connectTask===task)connectTask=null}
}
async function stopRoom(sendLeave){
  wanted=false;generation++;
  clearInterval(pulseTimer);clearInterval(heartbeatTimer);pulseTimer=0;heartbeatTimer=0;
  clearTimeout(retryTimer);retryTimer=0;
  const oldChannel=channel,oldRoom=room,oldSession=session;
  channel=null;room=null;presence.clear();positions.clear();lastSent=null;lastSentAt=0;region='';
  if(oldChannel&&supa){try{await supa.removeChannel(oldChannel)}catch(_){}}
  if(sendLeave&&oldRoom?.room_id&&oldSession?.access_token)api('leave',{room_id:oldRoom.room_id},oldSession,true).catch(()=>{});
}
function worldVisible(){
  const el=D.getElementById('screen-world');
  return !!(el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden');
}
async function reconcile(){
  const state=snapshot(),nextRegion=String(state.region||'kanto').toLowerCase();
  const shouldJoin=worldVisible()&&!!state.inWorld&&REGIONS.has(nextRegion);
  if(!shouldJoin){
    if(channel||room||wanted){await stopRoom(true);setStatus('● Fora da sala','#94a3b8')}
    return;
  }
  ensureStatus();
  if(region&&region!==nextRegion){
    await stopRoom(true);
    retryAt=0;
  }
  if(!channel&&!room&&!connectTask&&Date.now()>=retryAt){wanted=true;connectRoom(nextRegion)}
}
function scheduleReconcile(){
  if(reconcileTask)return;
  reconcileTask=reconcile().catch(error=>{setStatus('● '+String(error?.message||'World offline'),'#fb7185');retryAt=Date.now()+5000}).finally(()=>{reconcileTask=null});
}
function drawPeers(options){
  if(!channel||!presence.size||!options?.ctx)return;
  const ctx=options.ctx,w=Number(options.w),h=Number(options.h),halfH=Number(options.halfH),player=options.player,z=options.zBuffer,fov=Number(options.fov);
  if(!player||!w||!h||!z||!fov)return;
  const list=[];
  for(const [id,p] of presence){
    const pos=positions.get(id);if(!pos||Date.now()-pos.receivedAt>30000)continue;
    const dx=pos.x-player.x,dy=pos.y-player.y,dist=Math.hypot(dx,dy);
    let angle=Math.atan2(dy,dx)-player.angle;
    while(angle<-Math.PI)angle+=Math.PI*2;while(angle>Math.PI)angle-=Math.PI*2;
    if(dist<.35||dist>36||Math.abs(angle)>fov*.64)continue;
    list.push({id:id,profile:p,pos:pos,dist:dist,angle:angle});
  }
  list.sort((a,b)=>b.dist-a.dist);
  for(const peer of list){
    const sx=(.5+peer.angle/fov)*w;
    const lineH=h/Math.max(.4,peer.dist),height=Math.max(16,Math.min(92,lineH*.25)),width=height*.42;
    const feetY=Math.min(h-5,halfH+Math.max(12,Math.min(h*.34,lineH*.47)));
    const left=Math.max(0,Math.floor(sx-width*.48)),right=Math.min(w-1,Math.ceil(sx+width*.48));
    let wall=Infinity;for(let x=left;x<=right;x++)if(z[x]<wall)wall=z[x];
    if(peer.dist>wall+.8)continue;
    const hash=peer.id.split('').reduce((n,c)=>(n*33+c.charCodeAt(0))>>>0,5381);
    const shirt='hsl('+String(hash%360)+' 72% 56%)';
    const head=Math.max(4,width*.25),bodyH=height*.43;
    ctx.save();
    ctx.globalAlpha=Math.max(.42,Math.min(.95,1-peer.dist/50));
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(sx,feetY+2,width*.42,Math.max(2,height*.035),0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e6b98a';ctx.beginPath();ctx.arc(sx,feetY-height*.75,head,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=shirt;ctx.fillRect(sx-width*.22,feetY-bodyH-height*.25,width*.44,bodyH);
    ctx.fillStyle='#26344a';ctx.fillRect(sx-width*.18,feetY-height*.25,width*.13,height*.24);ctx.fillRect(sx+width*.05,feetY-height*.25,width*.13,height*.24);
    const name=peer.profile.nickname||peer.pos.nickname||'Treinador';
    ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.9)';ctx.fillStyle='#fff';
    ctx.strokeText(name,sx,feetY-height-7);ctx.fillText(name,sx,feetY-height-7);
    if(peer.pos.pokemon){ctx.font='10px Arial';ctx.strokeText(peer.pos.pokemon,sx,feetY-height+5);ctx.fillText(peer.pos.pokemon,sx,feetY-height+5)}
    ctx.restore();
  }
}
W.PSYWorldMultiplayerV1={drawPeers:drawPeers};
console.log('[PSYWORLD] World multiplayer client ready');
setInterval(scheduleReconcile,500);
W.addEventListener('pagehide',()=>{if(room&&session?.access_token)api('leave',{room_id:room.room_id},session,true).catch(()=>{})});
})(window,document);