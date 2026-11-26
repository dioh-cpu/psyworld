/* Player-character compare-and-swap regression. Run: node tests/player-character-cas-v1.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('api/player.js','utf8');
const start=source.indexOf('async function upsertCharacter(');
const end=source.indexOf('\n}\n\nexport default',start)+2;
assert(start>=0&&end>start,'character CAS helper is present');
const sandbox={cleanNick:value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,14),characterSummary:row=>row,Date, String};
vm.runInNewContext(source.slice(start,end)+';globalThis.runCAS=upsertCharacter;',sandbox);

class Store{
 constructor(row=null,selectBarrier=null){this.row=row;this.selectBarrier=selectBarrier;this.selectCount=0;this.insertCount=0;this.filters=[]}
 from(){return new Query(this)}
}
class Query{
 constructor(store){this.store=store;this.op='select';this.filters={};this.payload=null}
 select(){return this}
 eq(key,value){this.filters[key]=String(value);return this}
 update(payload){this.op='update';this.payload=payload;return this}
 insert(payload){this.op='insert';this.payload=payload;return this}
 async maybeSingle(){
  const db=this.store,match=db.row&&Object.entries(this.filters).every(([key,value])=>String(db.row[key]??'')===value);
  if(this.op==='select'){
   if(db.selectBarrier){db.selectCount++;if(db.selectCount===2)db.selectBarrier.release();await db.selectBarrier.wait}
   return {data:match?{...db.row}:null,error:null};
  }
  if(this.op==='update'){
   if(!match)return {data:null,error:null};
   db.row={...db.row,...this.payload};
   return {data:{id:db.row.id,nickname:db.row.nickname,updated_at:db.row.updated_at,client_updated_at:db.row.client_updated_at},error:null};
  }
  if(this.op==='insert'){
   if(db.selectBarrier){db.insertCount++;if(db.insertCount===2)db.selectBarrier.release();await db.selectBarrier.wait}
   if(db.row)return {data:null,error:{code:'23505'}};
   db.row={...this.payload,id:'new-character',nickname_key:this.payload.nickname.toLowerCase()};
   return {data:{id:db.row.id,nickname:db.row.nickname,updated_at:db.row.updated_at,client_updated_at:db.row.client_updated_at},error:null};
  }
  throw new Error('unexpected query operation '+this.op);
 }
}
function barrier(){let release;return {wait:new Promise(resolve=>release=resolve),release:()=>release()}}

(async()=>{
 const original={id:'char-1',user_id:'owner-1',nickname:'Ash',nickname_key:'ash',save:{player:{}},updated_at:'2026-11-10T10:00:00.000Z',client_updated_at:'2026-11-10T09:59:00.000Z'};
 const gate=barrier(),db=new Store({...original},gate);
 const saveA={player:{inventory:{Potion:1}}},saveB={player:{inventory:{Potion:2}}};
 const [a,b]=await Promise.all([
  sandbox.runCAS(db,{id:'owner-1'},'Ash','char-1',saveA,'2026-11-10T10:01:00Z',original.updated_at),
  sandbox.runCAS(db,{id:'owner-1'},'Ash','char-1',saveB,'2026-11-10T10:02:00Z',original.updated_at)
 ]);
 assert.equal([a,b].filter(x=>x.character).length,1,'only one concurrent update wins');
 assert.equal([a,b].filter(x=>x.conflict==='cloud_save_conflict').length,1,'the losing device receives a conflict');
 assert(['1','2'].includes(String(db.row.save.player.inventory.Potion)),'the winning save is persisted without merging');

 const stale=await sandbox.runCAS(db,{id:'owner-1'},'Ash','char-1',{player:{}},'2026-11-10T10:03:00Z',original.updated_at);
 assert.equal(stale.conflict,'cloud_save_conflict','a stale revision cannot overwrite the winning save');
 const wrongOwner=await sandbox.runCAS(db,{id:'someone-else'},'Ash','char-1',{player:{}},'2026-11-10T10:04:00Z',db.row.updated_at);
 assert.equal(wrongOwner.conflict,'character_not_found','character ids are scoped to their authenticated owner');

 const insertGate=barrier(),fresh=new Store(null,insertGate);
 const [i1,i2]=await Promise.all([
  sandbox.runCAS(fresh,{id:'owner-2'},'Misty','',{player:{}},'2026-11-10T11:00:00Z',''),
  sandbox.runCAS(fresh,{id:'owner-2'},'Misty','',{player:{inventory:{Potion:1}}},'2026-11-10T11:01:00Z','')
 ]);
 assert.equal([i1,i2].filter(x=>x.character).length,1,'only one concurrent first save is inserted');
 assert.equal([i1,i2].filter(x=>x.conflict==='cloud_save_conflict').length,1,'the duplicate first insert receives a conflict');
 assert(source.includes(".eq('updated_at',expected)"),'updates use the expected server revision as an atomic condition');
 assert(source.includes("req.query?.character_id"),'GET can address the stable character id');
 console.log('PASS: owner-scoped stable IDs, atomic revision CAS, stale-write rejection, concurrent update and insert protection');
})().catch(error=>{console.error(error);process.exitCode=1});
