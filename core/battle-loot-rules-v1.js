(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PsyBattleLootRulesV1=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const BY_TYPE=Object.freeze({
    Normal:Object.freeze({common:'Rubber Ball',uncommon:'Giant Piece Of Fur',stone:'Heart Stone'}),
    Fire:Object.freeze({common:'Essence Of Fire',uncommon:'Fire Tail',stone:'Fire Stone'}),
    Water:Object.freeze({common:'Water Gem',uncommon:'Water Pendant',stone:'Water Stone'}),
    Grass:Object.freeze({common:'Seed',uncommon:'Leaves',stone:'Leaf Stone'}),
    Electric:Object.freeze({common:'Screw',uncommon:'Electric Rat Tail',stone:'Thunder Stone'}),
    Ice:Object.freeze({common:'Snowball',uncommon:'Ice Orb',stone:'Ice Stone'}),
    Fighting:Object.freeze({common:'Band Aid',uncommon:'Belt Of Champion',stone:'Punch Stone'}),
    Poison:Object.freeze({common:'Bottle Of Poison',uncommon:'Bug Venom',stone:'Venom Stone'}),
    Ground:Object.freeze({common:'Earth Ball',uncommon:'Sandbag',stone:'Earth Stone'}),
    Flying:Object.freeze({common:'Straw',uncommon:'Feather',stone:'Flying Stone'}),
    Psychic:Object.freeze({common:'Enchanted Gem',uncommon:'Psychic Spoon',stone:'Enigma Stone'}),
    Bug:Object.freeze({common:'Bug Gosme',uncommon:'Bug Antenna',stone:'Cocoon Stone'}),
    Rock:Object.freeze({common:'Small Stone',uncommon:'Strange Rock',stone:'Rock Stone'}),
    Ghost:Object.freeze({common:'Ghost Essence',uncommon:'Bat Wing',stone:'Darkness Stone'}),
    Dragon:Object.freeze({common:'Dragon Scale',uncommon:'Dragon Tooth',stone:'Crystal Stone'}),
    Dark:Object.freeze({common:'Dark Gem',uncommon:'Dark Ear',stone:'Darkness Stone'}),
    Steel:Object.freeze({common:'Piece Of Steel',uncommon:'Metal Hull',stone:'Metal Stone'}),
    Fairy:Object.freeze({common:'Rubber Ball',uncommon:'Cute Ball',stone:'Heart Stone'})
  });
  const ALIASES=Object.freeze({normal:'Normal',comum:'Normal',fire:'Fire',fogo:'Fire',water:'Water',agua:'Water',grass:'Grass',planta:'Grass',natureza:'Grass',electric:'Electric',eletrico:'Electric',ice:'Ice',gelo:'Ice',fighting:'Fighting',lutador:'Fighting',poison:'Poison',veneno:'Poison',ground:'Ground',terra:'Ground',flying:'Flying',voador:'Flying',psychic:'Psychic',psiquico:'Psychic',bug:'Bug',inseto:'Bug',rock:'Rock',pedra:'Rock',ghost:'Ghost',fantasma:'Ghost',dragon:'Dragon',dragao:'Dragon',dark:'Dark',sombrio:'Dark',noturno:'Dark',steel:'Steel',aco:'Steel',metal:'Steel',fairy:'Fairy',fada:'Fairy'});
  const norm=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  function types(value){
    if(Array.isArray(value))return [...new Set(value.flatMap(types))];
    if(value&&typeof value==='object')return types(value.types||value.type||value.element||value.name);
    return [...new Set(norm(value).split(/[\/|,;+:\s]+/).filter(Boolean).map(part=>ALIASES[part]).filter(Boolean))];
  }
  function primaryType(value){
    const list=types(value);
    return list.find(type=>type!=='Normal')||list[0]||'Normal';
  }
  function forType(value){const type=primaryType(value);return Object.freeze({type,...(BY_TYPE[type]||BY_TYPE.Normal)});}
  function forEnemy(enemy){
    const value=enemy&&typeof enemy==='object'?(enemy.types||enemy.type||enemy.element||enemy.primaryType||enemy.elements):enemy;
    return forType(value);
  }
  function dropValue(value){const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(300,n)):0;}
  function rates(value){const drop=dropValue(value);return Object.freeze({drop,uncommon:.30+.20*drop/300,stone:.01+.09*drop/300});}
  function commonQuantity(value,random=Math.random){
    const steps=dropValue(value)/300*9,whole=Math.floor(steps),fraction=steps-whole;
    return Math.min(10,1+whole+(random()<fraction?1:0));
  }
  return Object.freeze({version:1,byType:BY_TYPE,types,primaryType,forType,forEnemy,dropValue,rates,commonQuantity});
});
