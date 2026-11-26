/** Shared browser/server capture model. Multipliers are not percentages. */
export const TIER_FACTORS={E:1,D:.90,C:.78,B:.66,A:.52,S:.38,SS:.27,SSS:.20,UR:.14,'UR+':.10,'UR++':.07,SP:0};
export const ELEMENTS=['Normal','Fire','Water','Grass','Electric','Ice','Fighting','Poison','Ground','Flying','Psychic','Bug','Rock','Ghost','Dragon','Dark','Steel','Fairy'];
const aliases={agua:'water',fogo:'fire',planta:'grass',eletrico:'electric',gelo:'ice',lutador:'fighting',veneno:'poison',venenoso:'poison',terra:'ground',voador:'flying',psiquico:'psychic',inseto:'bug',pedra:'rock',fantasma:'ghost',dragao:'dragon',sombrio:'dark',noturno:'dark',aco:'steel',metal:'steel',fada:'fairy'};
const normalize=v=>{const n=String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();return aliases[n]||n;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(n))?Number(n):a));
export function eventTarget(w){return [{key:'luminox',id:37},{key:'noctilume',id:41},{key:'brumelo',id:32},{key:'corujack',id:16}].some(f=>f.key===w.halloweenForm&&f.id===Number(w.id));}
export function ballMultiplier(ball,w={}){
 if(ball==='Psyball')return w.shiny?15:10;
 if(ball==='Halloween Ball'||ball==='Event Ball')return eventTarget(w)?10:7;
 if(ball==='Pokéball'||ball==='Poké Ball')return 1;
 if(ball==='Great Ball')return 1.5;
 if(ball==='Premier Ball'||ball==='Super Ball')return 3;
 if(ball==='Ultra Ball')return 5;
 const type=ELEMENTS.find(t=>ball===t+' Ball');if(type){const types=(Array.isArray(w.types)?w.types:String(w.type||'').split(/[\/|,]/)).map(normalize);return types.includes(type.toLowerCase())?6:1;}
 return 0;
}
export function captureDetails(input){
 const w=input.wild||input,ball=input.ball,mult=ballMultiplier(ball,w),tier=String(input.tier||w.tier||'E'),tf=TIER_FACTORS[tier]??0;
 if(!mult||!tf||w.isBoss||w.psyduckDungeon)return {chance:0,cap:0,ballMultiplier:mult,tierFactor:tf};
 const hp=clamp(input.hpPct??1,0,1),level=clamp(w.level||w.lvl||1,1,10000),quality=1/Math.sqrt(clamp(w.rarity?.mult||input.rarityMult||1,1,100000)),stage=clamp(input.evolutionStage||w.evolutionStage||1,1,3);
 const evo=stage===1?1:stage===2?.82:.68,lf=Math.max(.6,1-Math.max(0,level-10)*.0045),form=w.shiny&&w.isMega?.20:w.isMega?.5:w.shiny?.35:1;
 const power=Math.log(70/30)/Math.log(2),base=30*Math.pow(mult/5,power),ballCap=ball==='Psyball'?70:ball==='Ultra Ball'?30:mult===6?35:Math.min(70,base),cap=ballCap*tf;
 const hpFactor=1-Math.max(0,hp-.25)*.55,bonus=1+clamp(input.captureBonus||0,0,200)/100+(input.vip?.2:0);
 const raw=base*tf*quality*evo*lf*form*hpFactor*bonus;
 return {chance:Math.max(.01,Math.min(cap,raw)),cap,ballMultiplier:mult,tierFactor:tf,hpPct:hp,hpFactor,baseChance:base,preBonus:base*tf*quality*evo*lf*form*hpFactor,captureBonus:clamp(input.captureBonus||0,0,200),vipBonus:input.vip?20:0,evolutionStage:stage,level,qualityFactor:quality,levelFactor:lf,formFactor:form};
}
