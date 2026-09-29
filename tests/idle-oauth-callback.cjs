const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../idle-oauth-callback.html'),'utf8');
assert.doesNotMatch(source,/psy_idle_session_v1|access_token|refresh_token/,'the obsolete Idle OAuth callback cannot create or store a second session');
assert.match(source,/conta principal já conectada ao PSYWORLD/i);
assert.match(source,/chat continua disponível sem login/i);
function run({hash='',mainSession}={}){
 const values=new Map([['psyIdleSocialOAuthPendingV1','1']]);if(mainSession)values.set('psyworld_online_session_v23',JSON.stringify(mainSession));
 const localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const status={};const document={title:'callback',getElementById:()=>status};const location={hash,pathname:'/idle-oauth-callback.html',search:'',destination:null,replace(url){this.destination=url}};let cleanUrl='';
 const history={replaceState(_state,_title,url){cleanUrl=url}};
 vm.runInNewContext(source.slice(source.indexOf('<script>')+8,source.indexOf('</script>')),{location,history,document,localStorage,setTimeout(fn){fn();return 1}});
 return{values,location,cleanUrl};
}
const main={access_token:'main-token',refresh_token:'main-refresh',user:{id:'main-user'}};
const result=run({hash:'#access_token=stale-idle-token&refresh_token=stale-refresh',mainSession:main});
assert.equal(result.values.get('psyworld_online_session_v23'),JSON.stringify(main),'the main account remains untouched');
assert.equal(result.values.has('psy_idle_session_v1'),false);assert.equal(result.values.has('psyIdleSocialOAuthPendingV1'),false);
assert.equal(result.location.destination,'/');assert.equal(result.cleanUrl,'/idle-oauth-callback.html');
console.log('PASS: obsolete Idle callback discards separate OAuth state and returns to PSYWORLD');
