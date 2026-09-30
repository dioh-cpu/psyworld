const fs=require('node:fs');
const assert=require('node:assert/strict');

const read=path=>fs.readFileSync(require.resolve(path),'utf8');
const game=read('../modes/idle-realistic-v1.js');
const social=read('../modes/idle-social-v1.js');
const guestApi=read('../api/idle-chat.js');
const migration=read('../supabase/migrations/20260928225705_idle_guest_chat_sale_xp.sql');
const rewardMigration=read('../supabase/migrations/20260930193354_idle_hunt_reward_balance_v1.sql');
const moduleLoader=read('../core/module-loader.js');
const sellableSource=game.match(/const IDLE_SELLABLE_ITEMS=new Set\(\[([^\]]+)\]\);/);
const rareSource=game.match(/const IDLE_RARE_DROP_ITEMS=new Set\(\[([^\]]+)\]\);/);
const databaseSource=migration.match(/new\.name not in \(([\s\S]*?)\n    \) then/);
assert(sellableSource&&rareSource&&databaseSource,'client and database item rarity/sale rules must exist');
const quotedNames=source=>Array.from(source.matchAll(/'([^']+)'/g),match=>match[1]).sort();
assert.deepEqual(quotedNames(sellableSource[1]),quotedNames(databaseSource[1]),'client and database sale rules must match');
assert.deepEqual(quotedNames(sellableSource[1]).filter(name=>quotedNames(rareSource[1]).includes(name)),[],'rare drops must not be sellable');
for(const forbidden of ['Pokéball','Great Ball','Super Ball','Ultra Ball','Poção 50','Revive','Fire Stone','Water Pendant','Small Stone']){
  assert(!quotedNames(sellableSource[1]).includes(forbidden),`${forbidden} must not be sellable`);
}
assert.match(game,/function idleKillXp\(enemyLevel\)\{const level=Math\.max\(1,Number\(enemyLevel\)\|\|1\);return 20\+Math\.floor\(5\*Math\.sqrt\(Math\.max\(0,level-1\)\)\)\}/,'local kill XP scales with enemy level and keeps 20 XP at Lv.1');
assert.match(rewardMigration,/\(20 \+ floor\(5 \* sqrt\(greatest\(0, coalesce\(p_enemy_level, 1\) - 1\)\)\)\)::bigint/,'server rewards share the level curve with a 20 XP Lv.1 baseline');
assert.match(game,/data-suite="bag"[\s\S]*?psy-ir-bag-count/);
assert.match(game,/rarity\?\.n\|\|'Comum'/);
assert.match(game,/function openIdleBag\(\)/);
assert.match(game,/function installIdleVisualPolish\(\)/);
assert.match(game,/function idleBagCategory\([^)]*\)[^{]*\{[^}]*IDLE_COMMON_DROP_ITEMS\.has\(name\)[^}]*return'materials'/);
assert.match(game,/function damagePlayer\(dmg,type\)[^{]*\{[^}]*eff>=2\?\.85:\.55/);
assert.match(game,/XP Pokémon/);
assert.match(game,/Dano \$\{/);
assert.match(migration,/create policy psy_idle_chat_read_anon[\s\S]*?to anon using \(true\)/);
assert.match(migration,/grant execute on function public\.psy_idle_send_guest_chat\([^;]+ to service_role;/);
assert.match(migration,/realtime\.send\([\s\S]*?'psyworld-idle-chat:' \|\| new\.channel,[\s\S]*?false/);
assert.match(guestApi,/rpc\('psy_idle_send_guest_chat'/);
assert.match(social,/config:\{private:false\}/);
assert.doesNotMatch(social,/Entrar com GitHub|data-login-email|data-login-pass|renderLogin|wireLogin/);
assert.match(moduleLoader,/IDLE_AUTO_CATCH_FIX_20260930_V13/);
console.log('PASS: bag/HUD, level-scaled hunt XP, guest chat and server-enforced common-loot-only sales');
