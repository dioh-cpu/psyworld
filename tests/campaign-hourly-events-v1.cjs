const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
async function main(){
const {applyCampaignPercent}=await import('../lib/campaign-event-rules-v1.js');

const read=file=>fs.readFileSync(path.join(process.cwd(),file),'utf8');
const migration=read('supabase/migrations/20261107143842_campaign_hourly_lottery_world_events_v1.sql');
const api=read('api/game.js');
const authority=read('core/online-authority-v26.js');
const runtime=read('core/legacy-runtime.js');

assert.match(migration,/campaign_hourly_lottery_presence\s*\([\s\S]*?user_id uuid primary key/i);
assert.match(migration,/campaign_hourly_lottery_draws\s*\([\s\S]*?slot_start timestamptz primary key/i,'one draw is stored per hour slot');
assert.match(migration,/campaign_world_event_slots\s*\([\s\S]*?slot_start timestamptz primary key/i,'the random event is pinned to a two-hour slot');
for(const table of ['campaign_hourly_lottery_presence','campaign_hourly_lottery_draws','campaign_world_event_slots']){
  assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(migration,new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`));
}
assert.match(migration,/grant execute on function public\.psy_campaign_hourly_heartbeat\(uuid\) to service_role/);
assert.match(migration,/revoke execute on function public\.psy_campaign_hourly_heartbeat\(uuid\) from public, anon, authenticated/);
assert.match(migration,/pg_advisory_xact_lock\(hashtextextended\('psyworld-campaign-lottery:'/,'concurrent heartbeats serialize a slot draw');
assert.match(migration,/where last_seen_at >= now_at - interval '90 seconds'/,'only recently-online players can enter');
assert.match(migration,/order by random\(\) limit 1/,'the server selects one participant uniformly');
assert.match(migration,/campaign-lottery-g:'/,'the wallet credit is keyed to the hour slot');
assert.match(migration,/apply_wallet_delta_v24\([\s\S]*?winner_id,'gold',25000,'campaign_lottery'/,'the 25,000 Gold prize is credited by the server');
assert.match(migration,/array\['golden_hour','training_surge','gathering_rush','shiny_trail'\]/);
assert.match(migration,/America\/Sao_Paulo/,'hourly events use Brasília civil time');
assert.match(migration,/shiny_bonus_pct/,'the shiny event exposes its bonus to encounter creation');

assert.ok(api.indexOf('await requireUser(req)')<api.indexOf("if(action==='campaign-lottery-heartbeat')"),'lottery identity is sourced from the validated session');
assert.match(api,/supabase\.rpc\('psy_campaign_hourly_heartbeat',\{p_user:user\.id\}\)/);
assert.match(api,/applyCampaignPercent\(b\.gold_buff,event\.gold_bonus_pct,300\)/);
assert.match(api,/applyCampaignPercent\(b\.xp_buff,event\.xp_bonus_pct,300\)/);
assert.match(api,/applyCampaignPercent\(b\.drop_buff,event\.drop_bonus_pct,120\)/);
assert.match(api,/if\(campaignError\)console\.warn/,'missing optional event migration cannot suppress ordinary battle rewards');

assert.match(authority,/campaign-lottery-heartbeat/,'logged-in clients register presence with the server');
assert.match(authority,/lastCampaignHeartbeat>=30000/,'presence refresh is bounded to one call per 30 seconds');
assert.match(authority,/campaignEvent:\(\)=>lastCampaignStatus\?\.event/);
assert.match(authority,/Participação automática no sorteio/);
assert.match(authority,/Sorteio .* recebeu/);
assert.match(authority,/psy-campaign-event-banner-v1/,'the event remains visible during map play, outside the menu');
assert.match(authority,/innerWidth\|\|0\)<=520/,'mobile event ribbon moves below the trainer HUD');
assert.match(runtime,/campaignEvent\?\.\(\)\?\.shiny_bonus_pct/,'the server event reaches route encounter rolls');
assert.equal((runtime.match(/campaignShinyPct=Number\(/g)||[]).length,2,'route hunts and map encounters both receive the active Shiny event');
assert.match(runtime,/campaignVictory\?psyCampaignRewardBonusV1\('xp'\):0/,'campaign XP bonus is applied to eligible wins only');
assert.equal((runtime.match(/psyBattleXpReward\(t\.lvl,0,true\)/g)||[]).length,2,'both active world-reward implementations apply the event to Pokémon XP');
assert.match(runtime,/gainTrainerXp\(psyBattleTrainerXpReward\(t\.lvl,true\)\)/,'world wins apply the event to Trainer XP');
assert.match(runtime,/let finalXp = psyBattleXpReward\(lvl,0,true\)/,'ordinary campaign battles apply the event to Pokémon XP');

assert.equal(applyCampaignPercent(0,0,300),0,'no event preserves the existing reward buff');
assert.equal(applyCampaignPercent(0,20,300),20,'a Gold event adds its configured bonus');
assert.equal(applyCampaignPercent(25,25,300),56.25,'event bonuses multiply against the player buff');
assert.equal(applyCampaignPercent(300,50,300),300,'event stacking respects the existing cap');
assert.equal(applyCampaignPercent(-10,20,120),20,'negative client values do not reduce event rewards');
assert.equal(applyCampaignPercent(Number.NaN,Number.NaN,300),0,'invalid values fail closed');

console.log('PASS: server-only hourly draw, unique winner/prize, two-hour Brasília events, battle bonuses and route Shiny integration');
}
main().catch(error=>{console.error(error);process.exitCode=1});
