const assert = require('node:assert/strict');

process.env.SUPABASE_URL='https://idle-hunt-fixture.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-key';

const userId='f91995f1-f442-4af9-9704-3450044b1d68';
const requestId='c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2';
const ticketId='4698e054-7f71-4407-bf56-cead3278965a';
const rpcCalls=[];
let rpcResponse={ok:true};
global.fetch=async(url,init={})=>{
  const href=String(url);
  if(href.endsWith('/auth/v1/user')){
    return new Response(JSON.stringify({id:userId,user_metadata:{trainer_name:'Fixture'}}),{
      status:200,headers:{'Content-Type':'application/json'}
    });
  }
  if(href.endsWith('/rest/v1/rpc/idle_hunt')){
    rpcCalls.push(JSON.parse(init.body));
    return new Response(JSON.stringify(rpcResponse),{
      status:rpcResponse.status||200,headers:{'Content-Type':'application/json'}
    });
  }
  throw new Error(`Unexpected fixture fetch: ${href}`);
};

const makeRes=()=>({statusCode:200,headers:{},body:null,
  status(code){this.statusCode=code;return this},
  setHeader(name,value){this.headers[name]=value},
  json(body){this.body=body;return this}
});
const call=async(handler,req)=>{const res=makeRes();await handler(req,res);return res};

(async()=>{
  const {default:handler}=await import('../api/idle-hunt.js');
  const oldError=console.error;console.error=()=>{};
  try{
    const victory=await call(handler,{method:'POST',headers:{authorization:'Bearer fixture-token'},body:{
      action:'victory',request_id:requestId,ticket_id:ticketId,
      gold_awarded:999999,xp_awarded:999999,drop:'Master Ball',species_id:999
    }});
    assert.equal(victory.statusCode,200);
    assert.deepEqual(rpcCalls[0],{u:userId,act:'victory',p:{ticket_id:ticketId},req:requestId});
    console.log('PASS: victory API forwards only the owned ticket, never claimed rewards');

    const start=await call(handler,{method:'POST',headers:{authorization:'Bearer fixture-token'},body:{
      action:'start',request_id:'5c996a31-16c2-4ed1-b05d-2c9fcfce58be',map_key:'kanto-001',nickname:'Fixture',
      species_id:999,level:10000,tier:'UR++',rarity:'OBLIVION',gold:999999
    }});
    assert.equal(start.statusCode,200);
    assert.deepEqual(rpcCalls[1].p,{map_key:'kanto-001',nickname:'Fixture'});
    console.log('PASS: start API forwards route identity only');

    rpcResponse={code:'P0001',message:'map_locked_server',status:400};
    const locked=await call(handler,{method:'POST',headers:{authorization:'Bearer fixture-token'},body:{
      action:'start',request_id:'0fb680d6-f236-45a4-a8c4-4ace21e514a4',map_key:'kanto-002'
    }});
    assert.equal(locked.statusCode,409);
    assert.deepEqual(locked.body,{error:'map_locked_server'});
    console.log('PASS: server rules return a conflict response to the client');

    const unauth=await call(handler,{method:'POST',headers:{},body:{action:'victory',request_id:requestId,ticket_id:ticketId}});
    assert.equal(unauth.statusCode,401);
    assert.equal(rpcCalls.length,3);
    console.log('PASS: unauthenticated calls cannot reach the service RPC');
  }finally{console.error=oldError}
})().catch(error=>{console.error(error);process.exitCode=1});
