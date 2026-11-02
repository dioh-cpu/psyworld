const assert=require('node:assert/strict');
const fs=require('node:fs');
const sql=fs.readFileSync('supabase/migrations/20260930193359_idle_hunt_leaderboard_v1.sql','utf8');
const section=(signature)=>{
  const start=sql.indexOf(`create or replace function public.${signature}`);
  assert.notEqual(start,-1,`missing ${signature}`);
  const end=sql.indexOf('$$;',start);
  assert.notEqual(end,-1,`unterminated ${signature}`);
  return sql.slice(start,end+3);
};

assert.match(sql,/create table public\.idle_hunt_leaderboard_daily_stats/);
assert.match(sql,/create table public\.idle_hunt_leaderboard_claims/);
assert.match(sql,/unique \(user_id, period_key, period_start\)/);
assert.match(sql,/enable row level security/);
assert.match(sql,/revoke all on function public\.idle_hunt_leaderboard\(uuid,text,jsonb,uuid\) from public, anon, authenticated/);
assert.match(sql,/grant execute on function public\.idle_hunt_leaderboard\(uuid,text,jsonb,uuid\) to service_role/);
assert.match(sql,/'is_me',user_id=p_user_id/,'top entries can identify the signed-in player without exposing account UUIDs');
assert.match(sql,/'claimable',coalesce/,'board reports whether last-period prize is available to claim');
assert.match(sql,/'generated_at',clock_timestamp\(\)/);

const rpc=section('idle_hunt_leaderboard(');
assert.match(rpc,/idle_hunt_leaderboard_claims\.period_key=period_key/,'claim period must compare against the local requested period');
assert.match(rpc,/idle_hunt_leaderboard_claims\.period_start=period_start/,'claim date must compare against the local completed period');
assert.match(rpc,/pg_advisory_xact_lock/);
assert.match(rpc,/idle_accounts set gold=gold\+gold_awarded/);
assert.match(rpc,/idle_ledger\(user_id,currency,amount,reason\)/);

const hunt=section('idle_hunt(');
assert.match(hunt,/select \* into reward from public\.idle_hunt_reward_profile\(/);
assert.match(hunt,/'trainer_xp_awarded',xp_reward,'pokemon_xp_awarded',xp_reward/);
assert.match(hunt,/insert into public\.idle_hunt_leaderboard_daily_stats\(user_id,stat_date,kills,captures,xp_earned,gold_earned\)/);
assert.match(hunt,/idle_hunt_leaderboard_daily_stats\.xp_earned\+excluded\.xp_earned/);
assert.match(hunt,/insert into public\.idle_hunt_leaderboard_daily_stats\(user_id,stat_date,captures\)/);
assert.match(hunt,/'id',t\.species_id,'name',t\.species_name,'level',1,'exp',0/,'server captures are always level 1');

const farm=sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.idle_hunt_farm'));
assert.match(farm,/select \* into reward from public\.idle_hunt_reward_profile\(/);
assert.match(farm,/trainer_xp_awarded',xp_reward[\s\S]*?'pokemon_xp_awarded',pokemon_xp/);
assert.match(farm,/attacker_level:=greatest\(1,profile\.trainer_level\)/,'AFK attacker level must be derived from server progression');
assert.match(farm,/attacker_atk:=20\+7\*attacker_level/,'AFK attacker power must ignore locally stored attack');
assert.match(farm,/insert into public\.idle_hunt_leaderboard_daily_stats\(user_id,stat_date,kills,xp_earned,gold_earned\)/);
assert.match(farm,/idle_hunt_leaderboard_daily_stats\.xp_earned\+excluded\.xp_earned/);

console.log('PASS: leaderboard schema, service-role boundary, idempotent claims and verified Hunt/AFK aggregation');
