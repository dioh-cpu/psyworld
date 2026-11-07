/* Capability handoff: skill purchases unlock only after live spot effects load. */
(function(W){
'use strict';
const H=W.PsyHobbies,M=W.PsyHobbyMastery,V=W.PsyHobbiesVFX,ids=['miner','lumber','gardener','fisher'];
const map=W.PsyKantoMapDataV2,earlyMineReachable=!!map?.walkable?.(map.route1,335,290)&&H?.nearby?.('route-1',{x:335,y:290},65)?.id==='o1';
const ready=!!H&&!!M&&!!V&&ids.every(id=>{
 const chances=M.chances?.(id),output=H.spotEffects?.rewardFor?.(id,'common');
 const effects=new Set(M.skillDefs?.(id)?.map(def=>def.effect)||[]);
 const activityEffects={miner:['hits','rare','quantity','respawn','epic','legend'],lumber:['hits','rare','quantity','epic','legend'],gardener:['quantity','rare','respawn','epic','legend'],fisher:['rare','tension','quantity','epic','legend']}[id];
 return !!H.definitions?.some(job=>job.id===id)&&activityEffects.every(effect=>effects.has(effect))&&!!chances&&!!output?.item;
})&&typeof H.interact==='function'&&typeof H.collect==='function'&&typeof H.visibleNodes==='function'&&
 typeof H.requiredHits==='function'&&typeof H.spotEffects?.respawnDelay==='function'&&typeof H.spotEffects?.rollReward==='function'&&
 V.capabilities?.oreStrike===true&&V.capabilities?.woodChopping===true&&
 typeof V.beginAction==='function'&&typeof V.sampleAction==='function'&&typeof V.onSpotHit==='function'&&
 ['drawField','startFishing','updateFishing','finishFishing'].every(name=>typeof V[name]==='function')&&earlyMineReachable;
W.PsyHobbyMasterySpotReady=ready;
W.PsyHobbySpotEffects={ready,version:1,activities:ready?ids.slice():[],earlyMineReachable,limitations:V?.capabilities||{}};
})(window);
