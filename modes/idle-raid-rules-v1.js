/* PSYWORLD Psy Idle raid rules: clock slots, unlock tiers and reward scaling. */
(function(W){
  'use strict';
  const INTERVAL_MS=2*60*60*1000;
  const BOSSES=[
    {id:150,name:'Mewtwo',type:'Psychic',icon:'🔮'},
    {id:144,name:'Articuno',type:'Ice',icon:'❄️'},
    {id:145,name:'Zapdos',type:'Electric',icon:'⚡'},
    {id:146,name:'Moltres',type:'Fire',icon:'🔥'},
    {id:149,name:'Dragonite',type:'Dragon',icon:'🐉'},
    {id:130,name:'Gyarados',type:'Water',icon:'🌊'},
    {id:143,name:'Snorlax',type:'Normal',icon:'💤'},
    {id:151,name:'Mew',type:'Psychic',icon:'✨'}
  ];
  const STONES=['Fire Stone','Water Stone','Thunder Stone','Leaf Stone','Ice Stone','Dark Stone','Fairy Stone','Rock Stone'];
  function schedule(now=Date.now()){
    const stamp=Math.max(0,Number(now)||0),slot=Math.floor(stamp/INTERVAL_MS),startAt=slot*INTERVAL_MS,nextAt=startAt+INTERVAL_MS;
    return {slot,startAt,nextAt,remainingMs:Math.max(0,nextAt-stamp),boss:BOSSES[((slot%BOSSES.length)+BOSSES.length)%BOSSES.length]};
  }
  function tierForLevel(level){const lv=Math.floor(Number(level)||1);return lv<100?null:Math.floor((lv-100)/50)}
  function raidLevel(level){const tier=tierForLevel(level);return tier===null?null:100+tier*50}
  function rewards(level,mode='solo',partySize=1,slot=0){
    const tier=tierForLevel(level);if(tier===null)return null;
    const members=mode==='group'?Math.max(2,Math.min(6,Math.floor(Number(partySize)||2))):1;
    const scale=1+tier*.82,partyBonus=1+(members-1)*.12;
    return {
      gold:Math.floor(14000*scale*partyBonus),
      playerXp:Math.floor(18000*(1+tier*.72)*partyBonus),
      ultraBalls:0,
      revives:5+Math.floor(tier/2),
      raidCores:3+Math.floor(tier*.7),
      stone:STONES[((Math.floor(Number(slot)||0)+tier)%STONES.length+STONES.length)%STONES.length],
      stoneCount:1+(tier>=5?1:0),
      passXp:2500+Math.min(15000,tier*500),
      journeyPoints:50+Math.min(200,tier*8),
      members
    };
  }
  function duration(ms){let s=Math.max(0,Math.ceil(Number(ms)||0)/1000|0);const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;return h?`${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`:`${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`}
  W.PSY_IDLE_RAID_RULES_V1=Object.freeze({intervalMs:INTERVAL_MS,bosses:BOSSES,schedule,tierForLevel,raidLevel,rewards,duration});
})(window);
