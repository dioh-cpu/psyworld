const assert=require('node:assert/strict');

process.env.SUPABASE_URL='https://idle-leaderboard-fixture.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-key';
const userId='f91995f1-f442-4af9-9704-3450044b1d68';
const calls=[];
const board={ok:true,timezone:'UTC',periods:{daily:{entries:[],me:null},weekly:{entries:[],me:null},monthly:{entries:[],me:null}}};
global.fetch=async(url,init={})=>{
  const href=String(url);
  if(href.endsWith('/auth/v1/user'))return new Response(JSON.stringify({id:userId,user_metadata:{trainer_name:'Fixture'}}),{status:200,headers:{'Content-Type':'application/json'}});
  if(href.endsWith('/rest/v1/rpc/idle_hunt_leaderboard')){
    const args=JSON.parse(init.body);calls.push(args);
    return new Response(JSON.stringify(args.act==='board'?board:{ok:true,claimed:true,gold_awarded:10000}),{status:200,headers:{'Content-Type':'application/json'}});
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
  const {default:handler}=await import('../api/idle-leaderboard.js');
  const oldError=console.error;console.error=()=>{};
  try{
    const headers={authorization:'Bearer fixture-token'};
    const gotBoard=await call(handler,{method:'POST',headers,body:{action:'board',score:999999,rank:1,gold_awarded:500000}});
    assert.equal(gotBoard.statusCode,200);
    assert.deepEqual(gotBoard.body,board);
    assert.deepEqual(calls[0],{u:userId,act:'board',p:{nickname:'Fixture'},req:null});
    console.log('PASS: authenticated board reads use server identity and discard client scores/rewards');

    const requestId='c52d5e02-83e5-4fc2-a48c-b8e4fb8461b2';
    const claim=await call(handler,{method:'POST',headers,body:{action:'claim',period:'weekly',request_id:requestId,rank:1,score:1e12,gold_awarded:1e12}});
    assert.equal(claim.statusCode,200);
    assert.equal(claim.body.gold_awarded,10000);
    assert.deepEqual(calls[1],{u:userId,act:'claim',p:{nickname:'Fixture',period:'weekly'},req:requestId});
    console.log('PASS: reward claims send only period/request ID; server calculates rank and payout');

    const badPeriod=await call(handler,{method:'POST',headers,body:{action:'claim',period:'all-time',request_id:requestId}});
    assert.equal(badPeriod.statusCode,400);
    const badId=await call(handler,{method:'POST',headers,body:{action:'claim',period:'daily',request_id:'bad'}});
    assert.equal(badId.statusCode,400);
    assert.equal(calls.length,2);
    console.log('PASS: invalid claim arguments do not reach the database');

    const unauth=await call(handler,{method:'POST',headers:{},body:{action:'board'}});
    assert.equal(unauth.statusCode,401);
    assert.equal(calls.length,2);
    console.log('PASS: leaderboard and prize RPC require Supabase authentication');
  }finally{console.error=oldError}
})().catch(error=>{console.error(error);process.exitCode=1});
