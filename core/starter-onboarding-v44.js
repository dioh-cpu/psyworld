/* Starter onboarding: shared quality, supplies and gentle Route 1 entry. */
(function(W,D){
'use strict';
function label(){const m=typeof P!=='undefined'&&P.team?.[0],el=D.getElementById('player-name-tag');if(m&&el){const q=typeof m.rarity==='object'?m.rarity?.n:m.rarity;el.textContent=(m.shiny?'✨ ':'')+m.name+' — '+(q||'Nice')+' Lv'+m.level;}}
function kit(){if(typeof P==='undefined'||!P.team?.length)return;P.meta=P.meta||{};const m=P.team.find(p=>p.isStarter||Number(p.id)===Number(P.meta.kantoStarterChosen));if(!m)return;
 if(!P.meta.starterTrainingV45){if(Number(m.level||1)<5){m.level=5;m.exp=0;m.maxExp=Math.floor(100*Math.pow(1.3,4));if(typeof W.getMovesForLevel==='function')m.moves=W.getMovesForLevel(m.id,5);W.recalcPoke?.(m);m.hp=m.maxHp;m.currentHp=m.hp;m.fainted=false;delete m.status;if(m===P.team[0]){P.pokemon=m;P.hp=m.hp;P.maxHp=m.maxHp;}}P.meta.starterTrainingV45=true;W.autoSave?.();}
 if(P.meta.starterKitV44){W.updateHUD?.();return;}
 const q=typeof m.rarity==='object'?m.rarity?.n:m.rarity;
 if(!q||['Lixo','Quase Lixo'].includes(q)){m.rarity=W.rollStarterRarity();W.recalcPoke?.(m);}
 P.inventory=P.inventory||{};for(const [k,v] of Object.entries({'Pokéball':60,'Great Ball':15,'Poção 50':20,'Poção 100':15,'Revive':5}))P.inventory[k]=Number(P.inventory[k]||0)+v;
 P.gold=Number(P.gold||0)+25000;P.meta.starterKitV44=true;
 // One-time onboarding recovery also repairs affected new saves; never repeat on battle entry.
 m.hp=m.maxHp;m.currentHp=m.hp;m.fainted=false;delete m.status;if(m===P.team[0]){P.pokemon=m;P.hp=m.hp;P.maxHp=m.maxHp;}
 W.updateHUD?.();W.autoSave?.();W.notif?.('Kit de jornada recebido: 25.000 Gold, Balls, poções e Revives!',4500);
}
const confirm=W.confirmStarter;W.confirmStarter=function(){const out=confirm.apply(this,arguments);kit();return out;};
const begin=W.startBattle;W.startBattle=function(wild){
 if(wild?.halloweenArea==='route-1'){
  const lead=Number(P.team?.[0]?.level||1),level=Math.min(Number(wild.level||1),Math.max(1,Math.min(4,lead)));
  if(level!==wild.level||lead<5&&(wild.isMega||wild.shiny)){
   wild={...wild,level,lvl:level};if(lead<5){wild.isMega=false;wild.shiny=false;}
   wild.maxHp=W.calcBaseHpV14(level,wild.rarity?.mult||1,!!wild.shiny,!!wild.isMega,wild.id);wild.hp=wild.maxHp;
  }
 }
 const out=begin.call(this,wild);label();return out;
};
const hp=W.updateBattleHP;W.updateBattleHP=function(){const out=hp?.apply(this,arguments);label();return out;};
W.PsyStarterOnboarding={kit,label};
// Loaded/imported profiles get the same once-only supplies, never a repeating heal.
const load=W.autoLoad;if(load)W.autoLoad=function(){const out=load.apply(this,arguments);if(out)kit();return out;};
})(window,document);
