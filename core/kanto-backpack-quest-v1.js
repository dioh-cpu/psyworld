/* Route 2 quest progression; rewards are claimed once at Caio, never on arrival. */
(function(W){'use strict';
 function state(place){
  if(!place.backpackV4)place.backpackV4={stage:place.storyDone?'completed':place.storyItemFound?'recovered':place.talked?'investigating':'notStarted',encounters:0,serial:0,rewarded:!!place.storyDone};
  return place.backpackV4;
 }
 function talk(place){const q=state(place);if(q.stage==='notStarted')q.stage='investigating';place.talked=true;return q;}
 function begin(place,eligible,id,roll=Math.random()){
  const q=state(place);if(q.stage!=='investigating'||!eligible.includes(Number(id)))return null;
  q.encounters++;if(q.encounters<4&&roll>=.3)return null;
  q.stage='carrierFound';q.serial++;q.pending={token:'route2-backpack-'+q.serial,id:Number(id)};return {...q.pending};
 }
 function finish(place,pending,won){const q=state(place);if(!pending||!q.pending||pending.token!==q.pending.token||pending.id!==q.pending.id)return false;
  delete q.pending;if(won===true){q.stage='recovered';place.storyItemFound=true;return true;}q.stage='investigating';return false;
 }
 function resume(place){const q=state(place);if(q.stage==='carrierFound'){q.stage='investigating';delete q.pending;}return q;}
 function deliver(place,inventory){const q=state(place);if(q.stage!=='recovered'||q.rewarded)return false;
  q.stage='delivered';q.rewarded=true;inventory['Pokéball']=Number(inventory['Pokéball']||0)+3;
  place.storyItemFound=false;place.storyDone=true;q.stage='completed';return true;
 }
 W.PsyKantoBackpackQuestV1={state,talk,begin,finish,resume,deliver};
})(window);
