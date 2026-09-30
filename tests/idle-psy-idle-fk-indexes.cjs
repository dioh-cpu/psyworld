const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20260930193403_idle_psy_idle_fk_indexes_v1.sql','utf8');

for(const [index,table,column] of [
  ['idle_bid_history_listing_id_idx','idle_bid_history','listing_id'],
  ['idle_listings_buyer_id_idx','idle_listings','buyer_id'],
  ['psy_idle_chat_messages_user_id_idx','psy_idle_chat_messages','user_id']
]){
  const re=new RegExp(`create\\s+index\\s+if\\s+not\\s+exists\\s+${index}\\s+on\\s+public\\.${table}\\s*\\(\\s*${column}\\s*\\)\\s*;`,'i');
  assert.match(sql,re,`${table}.${column} has a leading-column index`);
}

console.log('PASS: all three Psy Idle foreign keys have idempotent leading-column indexes');
