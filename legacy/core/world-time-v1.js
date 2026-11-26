/* PSYWORLD world clock: real Brasília civil time, shared by campaign renderers. */
(function(W){
'use strict';
if(W.PsyWorldTimeV1)return;
const ZONE='America/Sao_Paulo';
const format=new Intl.DateTimeFormat('en-GB',{timeZone:ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const ECOLOGY={
 'route-1':{day:[16,21,84],night:[19,52]},
 'route-2':{day:[10,13,16],night:[13,19]},
 'viridian-forest':{day:[10,13,14],night:[11,12,15,25]},
 'mt-moon':{day:[46,50,74],night:[35,41,77]},
 lavender:{day:[19,37,104],night:[92,93,104]},
 'pokemon-tower':{day:[104],night:[92,93,94,105]}
};
let cacheMinute=-1,cache=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function getState(timestamp=Date.now()){
 const at=Number.isFinite(timestamp)?timestamp:Date.now(),minuteKey=Math.floor(at/60000);
 if(cache&&cacheMinute===minuteKey)return cache;
 const parts=format.formatToParts(new Date(at)),part=k=>Number(parts.find(x=>x.type===k)?.value||0);
 const hour=part('hour')%24,minute=part('minute'),minutes=hour*60+minute;
 let phase='day',darkness=0,warmth=0;
 if(minutes<300||minutes>=1200){phase='night';darkness=.36;}
 else if(minutes<420){phase='dawn';const t=(minutes-300)/120;darkness=.36*(1-ease(t));warmth=.17*Math.sin(Math.PI*clamp(t,0,1));}
 else if(minutes<1020){phase='day';}
 else{phase='dusk';const t=(minutes-1020)/180;darkness=.36*ease(t);warmth=.19*Math.sin(Math.PI*clamp(t,0,1));}
 cacheMinute=minuteKey;cache={phase,hour,minute,minutes,clockText:String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0'),darkness,warmth,isNight:minutes<360||minutes>=1080,timezone:ZONE};
 return cache;
}
function updateBadge(element,timestamp=Date.now()){
 if(!element)return null;
 const s=getState(timestamp),icon=s.phase==='night'?'☾':s.phase==='dawn'?'☼':s.phase==='dusk'?'◒':'☀';
 const label='Horário de Brasília: '+s.clockText+' · '+({night:'noite',dawn:'amanhecer',day:'dia',dusk:'anoitecer'}[s.phase]);
 if(element.dataset.clockValue!==s.clockText+'|'+s.phase){element.textContent=icon+' '+s.clockText;element.dataset.clockValue=s.clockText+'|'+s.phase;element.title=label;element.setAttribute('aria-label',label);element.dataset.period=s.phase;}
 return s;
}
function drawAmbient(ctx,width,height,timestamp=Date.now()){
 if(!ctx||!Number.isFinite(width)||!Number.isFinite(height))return null;
 const s=getState(timestamp);if(s.darkness<=0&&s.warmth<=0)return s;
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.globalAlpha=s.darkness;
 ctx.fillStyle=s.phase==='dusk'?'#674563':'#233866';ctx.fillRect(0,0,width,height);
 if(s.warmth>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha=s.warmth*.27;ctx.fillStyle='#d77443';ctx.fillRect(0,0,width,height);}
 ctx.restore();return s;
}
function weightSpecies(ids,scene,timestamp=Date.now()){
 if(!Array.isArray(ids)||ids.length<2)return Array.isArray(ids)?ids.slice():[];
 const profile=ECOLOGY[scene];if(!profile)return ids.slice();
 const favored=getState(timestamp).isNight?profile.night:profile.day,boost=new Set(favored||[]),pool=[];
 for(const value of ids){const id=Number(value);pool.push(value);if(boost.has(id))pool.push(value);}
 return pool;
}
function weightEncounterRecords(records,scene,timestamp=Date.now()){
 if(!Array.isArray(records)||records.length<2)return Array.isArray(records)?records.slice():[];
 const idOf=value=>Number(typeof value==='object'?value?.id:value),pool=weightSpecies(records.map(idOf),scene,timestamp);
 return pool.map(id=>records.find(record=>idOf(record)===Number(id))).filter(Boolean);
}
W.PsyWorldTimeV1={timezone:ZONE,getState,updateBadge,drawAmbient,weightSpecies,weightEncounterRecords,ecology:ECOLOGY};
})(window);
