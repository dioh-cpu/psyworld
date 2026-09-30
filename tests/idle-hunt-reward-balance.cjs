const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const migrationsDir=path.resolve(__dirname,'../supabase/migrations');
const migrationName=fs.readdirSync(migrationsDir).find(name=>name.endsWith('_idle_hunt_reward_balance_v1.sql'));
assert.ok(migrationName,'reward-balance migration exists');
const sql=fs.readFileSync(path.join(migrationsDir,migrationName),'utf8');
const online=sql.match(/create or replace function public\.idle_hunt\([\s\S]*?\$\$;/i)?.[0];
const farm=sql.match(/create or replace function public\.idle_hunt_farm\([\s\S]*?\$function\$\s*;/i)?.[0];
assert.ok(online&&farm,'both online and AFK Hunt RPCs are updated');

assert.match(sql,/create or replace function public\.idle_hunt_reward_profile\(p_enemy_level integer\)/i);
assert.match(sql,/20 \+ floor\(5 \* sqrt\(greatest\(0, coalesce\(p_enemy_level, 1\) - 1\)\)\)/i);
assert.match(sql,/greatest\(1, floor\(\(greatest\(1, coalesce\(p_enemy_level, 1\)\) \* 2 \+ 8\) \* \.15\)::bigint\)/i);
assert.match(sql,/least\(2::numeric, 1::numeric \+ \.012 \* \(greatest\(1, least\(100, coalesce\(p_enemy_level, 1\)\)\) - 1\)\)/i);

for(const rpc of [online,farm])assert.match(rpc,/select \* into reward from public\.idle_hunt_reward_profile\(/i,'online and AFK rewards share the same level curve');
assert.match(online,/'trainer_xp_awarded',xp_reward,'pokemon_xp_awarded',xp_reward/,'online response exposes equal Trainer and Pokémon XP');
assert.match(farm,/xp_reward:=simulated_kills\*xp_per_kill;\s*pokemon_xp:=xp_reward;/,'AFK awards the same per-kill XP to Trainer and active Pokémon');
assert.match(farm,/'xp_awarded',pokemon_xp,'trainer_xp_awarded',xp_reward[\s\S]*?'pokemon_xp_awarded',pokemon_xp/,'AFK response keeps both XP totals equal');
assert.match(online,/'id',t\.species_id,'name',t\.species_name,'level',1,'exp',0/,'online-captured Pokémon always starts at level 1');
const leaderboardSql=fs.readFileSync(path.join(migrationsDir,'20260930191403_idle_hunt_leaderboard_v1.sql'),'utf8');
const leaderboardOnline=leaderboardSql.match(/create or replace function public\.idle_hunt\([\s\S]*?\$\$;/i)?.[0];
assert.match(leaderboardOnline,/'id',t\.species_id,'name',t\.species_name,'level',1,'exp',0/,'later leaderboard migration preserves level-1 captures');
assert.match(online,/gold_reward:=reward\.gold/);
assert.match(farm,/gold_reward:=simulated_kills\*gold_per_kill/);
assert.equal((online.match(/drop_multiplier/g)||[]).length>=4,true,'online Hunt drop odds scale with enemy level');
assert.equal((farm.match(/drop_multiplier/g)||[]).length>=12,true,'all AFK drop rolls scale with enemy level');

const xp=level=>20+Math.floor(5*Math.sqrt(Math.max(0,level-1)));
const gold=level=>Math.max(1,Math.floor((level*2+8)*.15));
const drop=level=>Math.min(2,1+.012*(Math.min(100,Math.max(1,level))-1));
assert.deepEqual([xp(1),xp(10),xp(100)],[20,35,69]);
assert.deepEqual([gold(1),gold(10),gold(100)],[1,4,31]);
assert.deepEqual([drop(1),Number(drop(10).toFixed(3)),drop(100)],[1,1.108,2]);
console.log('PASS: online and AFK Hunts share bounded level-based XP, Gold, and drop chance; Lv.1 values stay 20 XP / 1 Gold');
