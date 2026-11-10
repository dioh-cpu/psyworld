const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(require.resolve('../core/cloud-save-v23.js'),'utf8');
function boot(authResponse={ok:true,json:{user:{id:'disposable-test-user'}}}){
 const values=new Map(),calls=[],nodes=new Map();
 const localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const node=(id,value='')=>({id,value,textContent:'',style:{display:'',color:'',cssText:''},disabled:false,onclick:null,appendChild(){},set innerHTML(v){this.html=String(v)},get innerHTML(){return this.html||''}});
 for(const id of ['psy-online-email','psy-online-pass','psy-online-signup','psy-online-resend','psy-online-status'])nodes.set(id,node(id));
 nodes.get('psy-online-email').value='  Test.User+Psy@Example.test  ';
 nodes.get('psy-online-pass').value='not-a-real-password';
 const document={readyState:'loading',title:'PSYWORLD',body:node('body'),head:node('head'),getElementById:id=>nodes.get(id)||null,createElement:()=>node('created'),addEventListener(){},querySelector(){return null},querySelectorAll(){return[]}};
 const fetch=async(url,options={})=>{calls.push({url:String(url),options});if(String(url)==='/api/config')return{ok:true,json:async()=>({onlineConfigured:true,supabaseUrl:'https://auth-project.example.test',supabaseAnonKey:'public-test-key'})};return{ok:authResponse.ok,status:authResponse.status||200,json:async()=>authResponse.json}};
 const window={localStorage,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},addEventListener(){},dispatchEvent(){},P:null};
 const context={window,document,location:window.location,history:window.history,localStorage,fetch,CustomEvent:class{},console:{log(){},warn(){},error(){}},URLSearchParams,Date,Promise,JSON,Number,String,Boolean,Math,Buffer,setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},clearInterval(){},navigator:{onLine:true}};
 vm.runInNewContext(source,context,{filename:'core/cloud-save-v23.js'});
 return{window,nodes,calls,values};
}

(async()=>{
 const app=boot();
 await app.window.psyCloudV23.signup();
 const request=app.calls.find(x=>x.url.startsWith('https://auth-project.example.test/auth/v1/signup'));
 assert(request,'signup must call the configured Supabase project');
 const parsedUrl=new URL(request.url);
 assert.equal(parsedUrl.searchParams.get('redirect_to'),'https://psyworld-murex.vercel.app/','REST redirect_to is sent in the query string');
 const body=JSON.parse(request.options.body);
 assert.equal(body.email,'test.user+psy@example.test','email is only trimmed and case-normalized');
 assert.equal(body.password,'not-a-real-password');
 assert.equal(body.options,undefined,'SDK-only options are not sent in the REST JSON body');
 assert.match(app.nodes.get('psy-online-status').textContent,/não confirma envio nem entrega/i,'success response never claims mail delivery');
 assert.equal(app.nodes.get('psy-online-resend').style.display,'block','resend becomes available after a pending signup response');

 await app.window.psyCloudV23.resendSignupConfirmation();
 const resend=app.calls.find(x=>x.url.includes('/auth/v1/resend?'));
 assert(resend,'resend uses the Supabase Auth resend endpoint');
 assert.equal(new URL(resend.url).searchParams.get('redirect_to'),'https://psyworld-murex.vercel.app/');
 assert.deepEqual(JSON.parse(resend.options.body),{type:'signup',email:'test.user+psy@example.test'});
 const callsBeforeCooldown=app.calls.length;
 await app.window.psyCloudV23.resendSignupConfirmation();
 assert.equal(app.calls.length,callsBeforeCooldown,'client cooldown blocks a duplicate resend request');
 assert.match(app.nodes.get('psy-online-status').textContent,/Aguarde/i);

 const limited=boot({ok:false,status:429,json:{error_code:'over_email_send_rate_limit'}});
 await limited.window.psyCloudV23.signup();
 assert.match(limited.nodes.get('psy-online-status').textContent,/Muitas solicitações/i,'server rate-limit errors are shown without claiming success');
 console.log('PASS: signup REST redirect, normalized recipient, safe pending state, confirmation resend cooldown and server rate-limit handling');
})().catch(e=>{console.error(e);process.exitCode=1});
