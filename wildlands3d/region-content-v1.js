// Conteúdo autoral do jogo 2.5D Fronteira Íris.
export const CAPTURE_ITEMS = [
  { id:'iris_capsule', name:'Cápsula Íris', power:1, unlockQuest:0, cost:{wood:5,stone:3,fiber:2} },
  { id:'reinforced_capsule', name:'Cápsula Reforçada', power:1.65, unlockQuest:6, cost:{wood:8,stone:5,ore:1} },
  { id:'aurora_capsule', name:'Cápsula Aurora', power:2.45, unlockQuest:15, cost:{wood:10,stone:8,crystal:3} }
];

const makeCreatures = (region, names, element) => names.map((name, i) => ({
  id:`${region}_${String(i+1).padStart(2,'0')}`, name, region, element,
  level:1 + Math.floor(i/5)*3, hp:90+i*18, attack:10+i*3,
  captureDifficulty:8+i*3, habitat:i%4, rare:i>=17
}));

export const REGIONS = {
  valeVerde: { id:'valeVerde', name:'Vale Verde', level:1, next:'costaAurora', creatures:makeCreatures('vale', ['Lúmion','Mossclaw','Embermite','Glintling','Bramblet','Pebblit','Sunkit','Nectowl','Rillip','Thornox','Cindervix','Mirebun','Zephyroo','Barkhorn','Ferrokit','Dewmoth','Vireel','Rootusk','Glimmerstag','Verdantor'],'nature') },
  costaAurora: { id:'costaAurora', name:'Costa Aurora', level:12, next:null, creatures:makeCreatures('costa', ['Gloomfin','Tidecub','Pearlisk','Aqualume','Coralyn','Brineback','Foamlet','Stormray','Shellbit','Mistralyn','Voltide','Seasprig','Moonjelly','Reefang','Whalewisp','Azurwing','Driftusk','Sirenox','Abyssalyn','Aurorfin'],'water') }
};

const questTitles = ['Primeiro abrigo','Sementes do vale','Rastros na relva','Pedra e madeira','O sino da aldeia','Caça cuidadosa','Oficina improvisada','Luz entre as folhas','A ponte quebrada','O mapa de Nara','Fornalha acesa','A toca escondida','Guardiões do bosque','O minério azul','Sinal de perigo','A cápsula Aurora','O desafio do alfa','Caminho para a costa','Última fogueira','Portão do horizonte'];
const coastTitles = ['Maré de chegada','Conchas brilhantes','Pescadores sumidos','Névoa da enseada','Cristal salgado','O farol antigo','Corrida na praia','A canção da água','Tempestade distante','Ruínas submersas','A ponte de coral','Caçada no mangue','O olho da maré','Vento do penhasco','O leviatã jovem','Coração de pérola','Ilha sem nome','A rainha da espuma','Tempestade final','Passagem para o norte'];
const makeQuests = (region, titles, start) => titles.map((title, i) => ({
  id:`${region}_quest_${String(i+1).padStart(2,'0')}`, region, order:i+1, title,
  level:start+i*2, objective:i%3===0?'hunt':i%3===1?'collect':'travel', amount:2+(i%5),
  reward:{gold:100+i*75, xp:50+i*35, unlockCapture:i===14}
}));

export const QUESTS = [...makeQuests('valeVerde',questTitles,1), ...makeQuests('costaAurora',coastTitles,12)];
export const ALL_CREATURES = [...REGIONS.valeVerde.creatures, ...REGIONS.costaAurora.creatures];

export function captureChance(creature, item, currentHp = creature.hp) {
  const hpFactor = 1 - Math.max(0, currentHp) / creature.hp;
  return Math.max(.02, Math.min(.95, (.15 + hpFactor*.65) * item.power - creature.captureDifficulty/1000));
}

export function isCaptureUnlocked(itemId, completedQuests) {
  const item = CAPTURE_ITEMS.find(entry => entry.id === itemId);
  return Boolean(item && completedQuests >= item.unlockQuest);
}
