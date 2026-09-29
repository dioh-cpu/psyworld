const assert = require('node:assert/strict');

process.env.SUPABASE_URL='https://idle-farm-fixture.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-key';

const userId='f91995f1-f442-4af9-9704-3450044b1d68';
const calls=[];
let responseData={ok:true,kills_awarded:5,drops:{'Pokéball':2}};
global.fetch=async(url,init={})=>{
  const href=String(url);
  if(href.endsWith('/auth/v1/user')){
    return new Response(JSON.stringify({id:userId,user_metadata:{trainer_name:'Fixture'}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  if(href.endsWith('/rest/v1/rpc/idle_hunt_farm')){
    calls.push(JSON.parse(init.body));
    return new Response(JSON.stringify(responseData),{status:200,headers:{'Content-Type':'application/json'}});
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
  const {default:handler}=await import('../api/idle-hunt-farm.js');
  const oldError=console.error;console.error=()=>{};
  try{
    const claim=await call(handler,{method:'POST',headers:{authorization:'Bearer fixture-token'},body:{
      action:'claim',request_id:'c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2',map_key:'kanto-001',auto_farm:true,
      gold_awarded:999999,drops:{'Master Ball':500}
    }});
    assert.equal(claim.statusCode,200);
    assert.equal(claim.body.kills_awarded,5);
    assert.deepEqual(calls[0],{u:userId,act:'claim',p:{map_key:'kanto-001',auto_farm:true,nickname:'Fixture'},req:'c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2'});
    console.log('PASS: offline claim forwards only validated route and auto setting; rewards come from the server');

    const invalid=await call(handler,{method:'POST',headers:{authorization:'Bearer fixture-token'},body:{
      action:'claim',request_id:'c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2',map_key:'bad/map'
    }});
    assert.equal(invalid.statusCode,400);
    assert.equal(calls.length,1);
    console.log('PASS: invalid routes cannot reach the farm RPC');

    const unauth=await call(handler,{method:'POST',headers:{},body:{
      action:'claim',request_id:'c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2',map_key:'kanto-001'
    }});
    assert.equal(unauth.statusCode,401);
    assert.equal(calls.length,1);
    console.log('PASS: unauthenticated claims cannot reach the farm RPC');
  }finally{console.error=oldError}
})().catch(error=>{console.error(error);process.exitCode=1});
