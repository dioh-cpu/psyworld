const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync(require.resolve('../idle-oauth-callback.html'),'utf8');
assert.doesNotMatch(source,/<script\s+src=["'][^"']*core\//i);
assert.match(source,/psy_idle_session_v1/);
assert.doesNotMatch(source,/psyworld_online_session_v23/);

function run({hash,pending=true,cloudSession}={}){
  const values=new Map();
  if(pending)values.set('psyIdleSocialOAuthPendingV1','1');
  if(cloudSession)values.set('psyworld_online_session_v23',JSON.stringify(cloudSession));
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const status={textContent:'',children:[],appendChild(child){this.children.push(child)}};
  const document={title:'Idle callback',getElementById:()=>status,createElement:()=>({href:'',textContent:''})};
  const location={hash:hash||'',pathname:'/idle-oauth-callback.html',search:'',destination:null,replace(url){this.destination=url}};
  const history={replaceState(){}};
  vm.runInNewContext(source.slice(source.indexOf('<script>')+8,source.indexOf('</script>')),{location,history,document,localStorage:storage,URLSearchParams,Date});
  return{values,status,location};
}

const ok=run({hash:'#access_token=idle-token&refresh_token=idle-refresh&expires_in=3600&expires_at=1900000000&provider_token=provider-secret',cloudSession:{access_token:'cloud-token'}});
const idleSession=JSON.parse(ok.values.get('psy_idle_session_v1'));
assert.equal(idleSession.access_token,'idle-token');
assert.equal(idleSession.refresh_token,'idle-refresh');
assert.equal(idleSession.expires_at,1900000000000);
assert.equal(Object.hasOwn(idleSession,'provider_token'),false);
assert.equal(ok.values.has('psyworld_online_session_v23'),true);
assert.equal(ok.values.has('psyIdleSocialOAuthPendingV1'),false);
assert.equal(ok.location.destination,'/');
console.log('PASS: Idle callback saves only the Idle OAuth session and returns to the game');

const unsolicited=run({hash:'#access_token=must-not-be-stored',pending:false,cloudSession:{access_token:'cloud-token'}});
assert.equal(unsolicited.values.has('psy_idle_session_v1'),false);
assert.equal(unsolicited.location.destination,null);
assert.match(unsolicited.status.textContent,/não foi iniciada pelo Psy Idle/i);
console.log('PASS: callback rejects login responses not started by Psy Idle');

const failed=run({hash:'#error=access_denied&error_description=cancelled'});
assert.equal(failed.values.has('psy_idle_session_v1'),false);
assert.equal(failed.values.has('psyIdleSocialOAuthPendingV1'),false);
assert.match(failed.status.textContent,/não foi possível concluir/i);
console.log('PASS: cancelled OAuth does not leave a pending Idle session');
