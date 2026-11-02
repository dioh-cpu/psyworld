const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../modes/idle-social-v1.js'),'utf8');
const main={access_token:'psyworld-main-token',refresh_token:'psyworld-main-refresh',user:{id:'main-user',user_metadata:{trainer_name:'Ash'}}};
const oldIdle={access_token:'stale-idle-token',refresh_token:'stale-idle-refresh',user:{id:'different-idle-user'}};
const data=new Map([['psyworld_online_session_v23',JSON.stringify(main)],['psy_idle_session_v1',JSON.stringify(oldIdle)]]);
const localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
let listener=null,createOptions=null,setCalls=[],rpcCalls=[],realtimeTokens=[],activeSessionUser=main.user;
const windowListeners={};
const auth={
 onAuthStateChange(fn){listener=fn;return{data:{subscription:{unsubscribe(){}}}}},
 getSession:async()=>({data:{session:auth.session||null},error:null}),
 setSession:async tokens=>{setCalls.push(tokens);auth.session={...tokens,user:activeSessionUser,token_type:'bearer',expires_in:3600};listener?.('SIGNED_IN',auth.session);return{data:{session:auth.session},error:null}},
 signOut:async()=>{auth.session=null;listener?.('SIGNED_OUT',null);return{error:null}},
 updateUser:async()=>({data:{user:main.user},error:null})
};
const client={auth,realtime:{setAuth:async token=>{realtimeTokens.push(token)}},rpc:async(name,args)=>{rpcCalls.push({name,args});return{data:{ok:true,status:'pending'},error:null}}};
const window={P:{name:'Ash'},supabase:{createClient:(url,key,options)=>{createOptions={url,key,options};return client}},addEventListener:(name,fn)=>windowListeners[name]=fn,dispatchEvent(){},location:{href:'https://example.invalid/',search:'',hash:'',pathname:'/'}};
const context={window,document:{readyState:'loading',addEventListener(){},head:{appendChild(){}}},localStorage,console,URL,URLSearchParams,Date,Map,Promise,Math,CustomEvent:class{constructor(type){this.type=type}},setTimeout(){return 1},clearTimeout(){},fetch:async()=>({ok:true,json:async()=>({onlineConfigured:true,supabaseUrl:'https://supabase.invalid',supabaseAnonKey:'public'})})};
const expose='window.__test={getClient,social,readSession};';
vm.runInNewContext(source.replace('})(window,document);',expose+'})(window,document);'),context);
(async()=>{
 const api=window.__test;
 assert.equal(api.readSession().access_token,main.access_token,'the PSYWORLD session is the sole active Idle identity');
 const c=await api.getClient();
 assert.equal(c,client);assert.equal(setCalls.length,1);assert.equal(setCalls[0].access_token,main.access_token,'never authenticate as the stale Idle-only account');
 assert.equal(setCalls[0].refresh_token,main.refresh_token);assert.equal(auth.session.user.id,'main-user');
 assert.equal(createOptions.options.auth.persistSession,false,'the Idle client does not create a second persisted session');
 assert(realtimeTokens.includes(main.access_token),'private realtime uses the PSYWORLD access token');
 await api.social('friend_request',{peer_id:'peer-user'});
 assert.equal(JSON.stringify(rpcCalls),JSON.stringify([{name:'idle_social',args:{p_action:'friend_request',p:{peer_id:'peer-user'}}}]));
 assert.equal(JSON.parse(data.get('psyworld_online_session_v23')).user.id,'main-user');
 assert.equal(data.get('psy_idle_session_v1'),JSON.stringify(oldIdle),'legacy Idle session is ignored and never replaces the main account');
 const cloudEmail={access_token:'cloud-email-token',refresh_token:'cloud-email-refresh',user:{id:'cloud-email-user',email:'player@example.test'}};
 activeSessionUser=cloudEmail.user;data.set('psyworld_online_session_v23',JSON.stringify(cloudEmail));
 await windowListeners['psyworld-online-session-changed']();
 assert.equal(auth.session.user.id,'cloud-email-user','the Cloud Save email account becomes the live Idle/Market identity');
 assert.equal(setCalls.at(-1).access_token,'cloud-email-token');
 console.log('PASS: Trade Zone identity and social RPC use the existing PSYWORLD session');
})().catch(error=>{console.error(error);process.exitCode=1});
