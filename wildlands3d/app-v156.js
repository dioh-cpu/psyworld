import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { WILDLANDS_ASSETS } from './assets-v154.js';
import { REGIONS, QUESTS, ALL_CREATURES, CAPTURE_ITEMS, captureChance, isCaptureUnlocked } from './region-content-v1.js';

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const TAU = Math.PI * 2;
const WORLD = { minX: -150, maxX: 170, minZ: -82, maxZ: 82 };
const SAVE_KEY = 'psyworld_wildlands3d_vale_verde_v155';
const originForward = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
const tempC = new THREE.Vector3();
const tempD = new THREE.Vector3();
let creatureAtlasTexture = null;
let environmentAtlasTexture = null;
const creatureAtlasLoader = new THREE.TextureLoader();
creatureAtlasLoader.load('./assets/creatures/region1-creatures-atlas-v2.png', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  creatureAtlasTexture = texture;
  state.wild?.forEach((creature) => creature.applyCreatureArtwork?.());
});
const environmentAtlasLoader = new THREE.TextureLoader();
environmentAtlasLoader.load('./assets/environment/frontier-iris-environment-atlas-v2.png', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  environmentAtlasTexture = texture;
  if (scene) upgradeEnvironmentArtwork();
});

function atlasSprite(texture, column, row, width, height) {
  const map = texture.clone();
  map.needsUpdate = true;
  map.repeat.set(.25, .25);
  map.offset.set(column * .25, (3 - row) * .25);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, depthTest: true }));
  sprite.scale.set(width, height, 1);
  return sprite;
}

function upgradeEnvironmentArtwork() {
  if (!environmentAtlasTexture || !scene) return;
  scene.traverse((object) => {
    if ((!object.userData?.environmentType && !object.userData?.resourceKind) || object.userData.environmentArtwork) return;
    const type = object.userData.environmentType;
    let sprite;
    if (type === 'tree') {
      const variant = Number(object.userData.environmentVariant || 0) % 3;
      sprite = atlasSprite(environmentAtlasTexture, variant, 0, 3.8, 4.8);
      sprite.position.y = 2.35;
    } else if (type === 'rock') {
      const variant = Number(object.userData.environmentVariant || 0) % 2;
      sprite = atlasSprite(environmentAtlasTexture, variant, 1, 3.6, 2.7);
      sprite.position.y = 1.25;
    } else if (type === 'npc') {
      sprite = atlasSprite(environmentAtlasTexture, 1, 3, 1.8, 2.8);
      sprite.position.y = 1.4;
    } else if (type === 'house') {
      sprite = atlasSprite(environmentAtlasTexture, 2, 3, 4.8, 3.8);
      sprite.position.y = 1.85;
    } else if (type === 'watchtower') {
      sprite = atlasSprite(environmentAtlasTexture, 3, 3, 2.8, 4.5);
      sprite.position.y = 2.25;
    } else if (object.userData.resourceKind) {
      const resource = object.userData.resourceKind;
      const crops = { tree:[3,0], rock:[0,1], ore:[3,1], crystal:[2,1], berry:[0,2], aurora:[1,2], spore:[2,2], tide:[2,1], fiber:[1,2] };
      const crop = crops[resource] || [0,1];
      sprite = atlasSprite(environmentAtlasTexture, crop[0], crop[1], 1.55, 1.55);
      sprite.position.y = .82;
    }
    if (!sprite) return;
    object.traverse((child) => { if (child.isMesh) child.visible = false; });
    object.add(sprite);
    object.userData.environmentArtwork = sprite;
  });
}

const SPECIES = {
  lumion: {
    name: 'Lúmion', icon: '✦', rig: 'lumion', role: 'player', color: 0x42b9e7, accent: 0xa7f5ff, assetKey: 'lumion', assetHeight: 2.65,
    hp: 320, attack: 34, speed: 5.6, radius: .78, xp: 0
  },
  oriel: {
    name: 'Oriel', icon: '◈', rig: 'oriel', role: 'player', color: 0x6b66d9, accent: 0xffa8eb, assetKey: 'oriel', assetHeight: 2.7,
    hp: 230, attack: 24, speed: 5.0, radius: .70, xp: 0
  },
  embermite: {
    name: 'Embermite', icon: '🔥', rig: 'embermite', role: 'wild', color: 0xc84b24, accent: 0xffb02f, assetKey: 'embermite', assetHeight: 2.25,
    hp: 125, attack: 16, speed: 3.2, radius: .75, xp: 32
  },
  mossclaw: {
    name: 'Mossclaw', icon: '🌿', rig: 'mossclaw', role: 'wild', color: 0x3a754e, accent: 0x9ce45e, assetKey: 'mossclaw', assetHeight: 2.6,
    hp: 220, attack: 23, speed: 2.15, radius: 1.0, xp: 58
  },
  gloomfin: {
    name: 'Gloomfin', icon: '◉', rig: 'gloomfin', role: 'wild', color: 0x35217a, accent: 0xb87bff, assetKey: 'gloomfin', assetHeight: 2.35,
    hp: 145, attack: 18, speed: 2.8, radius: .72, xp: 42
  },
  glintling: {
    name: 'Glintling', icon: '✧', rig: 'glintling', role: 'wild', color: 0x482b91, accent: 0xff75e8, assetKey: 'glintling', assetHeight: 1.9,
    hp: 98, attack: 14, speed: 4.0, radius: .62, xp: 28
  },
  ironroot: {
    name: 'Ironroot', icon: '◆', rig: 'ironroot', role: 'boss', color: 0x17474b, accent: 0x72ffe0, assetKey: 'ironroot', assetHeight: 5.2,
    hp: 1450, attack: 38, speed: 1.45, radius: 1.65, xp: 420
  }
};

const RESOURCE_DATA = {
  tree: { icon: '🪵', label: 'madeira', amount: { wood: 5 }, color: 0x6b3c23 },
  rock: { icon: '🪨', label: 'pedra', amount: { stone: 4 }, color: 0x7b8b91 },
  fiber: { icon: '🌿', label: 'fibra', amount: { fiber: 4 }, color: 0x53c36a },
  ore: { icon: '⛓', label: 'minério', amount: { ore: 3 }, color: 0x9a6a58 },
  crystal: { icon: '◇', label: 'cristal', amount: { crystal: 2 }, color: 0x58e7ff },
  berry: { icon: '🍓', label: 'frutas', amount: { berry: 3 }, color: 0xd94d69 },
  aurora: { icon: '✧', label: 'folha aurora', amount: { aurora: 2 }, color: 0x78f5c7 },
  tide: { icon: '◈', label: 'pérola de maré', amount: { tide: 1 }, color: 0x7ceaff },
  spore: { icon: '✿', label: 'esporo musgoso', amount: { spore: 2 }, color: 0xc1ec78 }
};

const BUILD_DATA = {
  core: { name: 'Núcleo de Base', cost: { wood: 20, stone: 12 } },
  floor: { name: 'Piso', cost: { wood: 10, stone: 4 } },
  wall: { name: 'Parede', cost: { wood: 12, stone: 5 } },
  workbench: { name: 'Bancada', cost: { wood: 18, stone: 8, fiber: 5 } },
  chest: { name: 'Baú', cost: { wood: 16, stone: 4 } },
  campfire: { name: 'Fogueira', cost: { wood: 8, stone: 6 } }
};

const CRAFT_DATA = {
  capsule: { label: 'Cápsula Prismática', cost: { wood: 5, stone: 3, fiber: 2 }, give: { capsules: 1 } },
  food: { label: 'Refeição silvestre', cost: { berry: 3, fiber: 1 }, give: { food: 2 } },
  repair: { label: 'Kit de reparo', cost: { wood: 8, stone: 5, ore: 2 }, give: { repair: 1 } },
  tonic: { label: 'Tônico Aurora', cost: { aurora: 2, berry: 2, spore: 1 }, give: { food: 2 } },
  beacon: { label: 'Sinalizador de expedição', cost: { crystal: 3, ore: 2, aurora: 2 }, give: { beacon: 1 } }
};


const TEAM_LIMIT = 6;
const RESPAWN_DELAY = 3;
const DEFAULT_TEAM = ['lumion', 'oriel'];

function teamSpeciesId(entry) {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return null;
  return entry.speciesId || entry.species || entry.rig || entry.id || null;
}

function isTeamSpecies(speciesId) {
  const spec = SPECIES[speciesId];
  return Boolean(spec && spec.role !== 'boss');
}

function makeTeamSlot(speciesId, source) {
  const spec = SPECIES[speciesId] || SPECIES.lumion;
  const data = source && typeof source === 'object' ? source : {};
  return {
    speciesId,
    level: Math.max(1, Math.floor(Number(data.level) || 1)),
    xp: Math.max(0, Number(data.xp) || 0),
    hp: Math.max(1, Number(data.hp) || spec.hp)
  };
}

function normalizeTeamSlots(raw) {
  const slots = [];
  const used = new Set();
  const add = (entry, fallbackId) => {
    const speciesId = teamSpeciesId(entry) || fallbackId;
    if (!isTeamSpecies(speciesId) || used.has(speciesId) || slots.length >= TEAM_LIMIT) return;
    used.add(speciesId);
    slots.push(makeTeamSlot(speciesId, entry));
  };
  if (Array.isArray(raw)) raw.forEach((entry) => add(entry));
  DEFAULT_TEAM.forEach((speciesId) => add(null, speciesId));
  return slots.slice(0, TEAM_LIMIT);
}

const ITEM_WEIGHTS = {
  wood: .4, stone: .6, fiber: .2, ore: 1.1, crystal: .7, berry: .15,
  aurora: .12, tide: .3, spore: .14, beacon: 1.2, capsules: .35, food: .45, repair: .8
};

const ATTRIBUTE_DATA = {
  strength: { label: 'FORÇA', icon: '⚔', description: '+7% de dano por nível.' },
  vitality: { label: 'VITALIDADE', icon: '❤', description: '+36 HP máximo por nível.' },
  capacity: { label: 'CARGA', icon: '▣', description: '+25 kg de capacidade por nível.' },
  gathering: { label: 'COLETA', icon: '⛏', description: 'Coleta de recursos mais rápida.' },
  agility: { label: 'AGILIDADE', icon: '➤', description: 'Mais velocidade e esquiva.' },
  crafting: { label: 'OFÍCIO', icon: '⚒', description: 'Fabricação mais rápida.' }
};

const SKILL_DATA = {
  attack: { label: 'Disparo Prismático', icon: '✦', description: 'Aumenta dano e cadência do ataque básico.', max: 5 },
  pulse: { label: 'Pulso Íris', icon: '◎', description: 'Amplia o raio e o dano da habilidade 2.', max: 5 },
  void: { label: 'Vórtice Mental', icon: '◉', description: 'Aumenta o alcance e a pressão do vórtice.', max: 5 },
  prism: { label: 'Rajada Prismática', icon: '◇', description: 'Adiciona projéteis ao leque prismático.', max: 5 },
  survival: { label: 'Instinto Silvestre', icon: '✚', description: 'Reduz o consumo de fome e água.', max: 5 }
};

const DEFAULT_ATTRIBUTES = {
  strength: 0, vitality: 0, capacity: 0, gathering: 0, agility: 0, crafting: 0
};
const DEFAULT_SKILLS = { attack: 1, pulse: 1, void: 1, prism: 1, survival: 0 };

const NPC_DATA = [
  {
    id: 'nara', name: 'Nara', role: 'Cartógrafa', x: -8, z: 5, color: 0x2fc1c7, accent: 0xffdf8d,
    lines: [
      'A Fronteira Íris não é uma arena. Cada trilha leva a um pedaço diferente da história.',
      'Colete materiais, mantenha Lúmion alimentado e construa um Núcleo para marcar seu abrigo.',
      'Monstrinhos enfraquecidos aceitam uma Cápsula Prismática. Alguns podem trabalhar na sua base.'
    ]
  },
  {
    id: 'bram', name: 'Bram', role: 'Artesão', x: 8, z: 5, color: 0xc6783b, accent: 0xffcb71,
    lines: [
      'Uma base sem bancada é só um acampamento. Madeira e pedra fazem o primeiro abrigo.',
      'As ruínas do leste guardam minério. A costa ao norte tem cristais azuis.',
      'Quando construir uma bancada, volte até aqui. Tenho receitas que não aparecem em qualquer lugar.'
    ]
  },
  {
    id: 'vesper', name: 'Vesper', role: 'Observadora', x: -58, z: 26, color: 0x7d50c9, accent: 0xb9f2ff,
    lines: [
      'Ironroot protege o caminho antigo. Ele não ataca sem motivo, mas não esquece quem o desafia.',
      'O mapa é maior do que parece. Não siga sempre pelo centro; o mundo recompensa a exploração.',
      'Se uma criatura do seu time tiver talento, atribua uma tarefa na base. Sobrevivência também é organização.'
    ]
  },
  {
    id: 'yara', name: 'Yara', role: 'Bióloga de campo', x: -27, z: -6, color: 0x31966e, accent: 0xcaff9f,
    lines: [
      'Cada espécie reage ao clima, ao horário e ao jeito como você se aproxima. Observe antes de atacar.',
      'A Clareira Aurora é segura para começar. Folhas luminosas crescem perto dos cristais e fortalecem tônicos.',
      'Capture criaturas de funções diferentes: algumas lutam, outras carregam, voam, nadam ou trabalham na base.'
    ]
  },
  {
    id: 'ivo', name: 'Ivo', role: 'Cozinheiro errante', x: 21, z: -20, color: 0xd77a45, accent: 0xffd16b,
    lines: [
      'Fome e energia mudam o ritmo da expedição. Um prato simples pode salvar uma travessia.',
      'Esporos musgosos aparecem no Brejo dos Ecos. Misture-os com folhas aurora para criar um tônico.',
      'Quando a bancada estiver pronta, posso ensinar receitas de campo com efeitos melhores.'
    ]
  },
  {
    id: 'cael', name: 'Cael', role: 'Guardião da passagem', x: 79, z: -2, color: 0x267f9a, accent: 0x9eeeff,
    lines: [
      'A Costa Turquesa é a borda da primeira fronteira. Depois do sinalizador, a transição será deliberada e segura.',
      'Aqui dentro, o mundo é contínuo: caça, coleta, base e exploração acontecem sem trocar de cena.',
      'A passagem para a próxima região só abrirá quando o Núcleo, o levantamento e o desafio de Ironroot estiverem concluídos.'
    ]
  }
];

const REGION_DATA = {
  id: 'vale-verde',
  name: 'Vale Verde',
  subtitle: 'primeira região • fronteira de sobrevivência',
  description: 'Um vale vivo de trilhas, clareiras, brejos e costa. A região é uma única área contínua; as mudanças de região acontecem apenas pelos portais de transição.',
  transition: { label: 'Passagem para Costa Turquesa', x: 84, z: -2, locked: true },
  zones: [
    { id: 'vila-iris', name: 'Acampamento Íris', subtitle: 'base e ofícios', x: -8, z: 14, radius: 16, color: 0xf7c86b, species: [] },
    { id: 'clareira-aurora', name: 'Clareira Aurora', subtitle: 'caça • iniciante', x: -28, z: -10, radius: 18, color: 0x6cf0cb, species: ['glintling', 'embermite'], levels: 'Lv. 1–3' },
    { id: 'brejo-ecos', name: 'Brejo dos Ecos', subtitle: 'caça • recursos raros', x: 23, z: -20, radius: 17, color: 0x8fe58b, species: ['gloomfin', 'mossclaw'], levels: 'Lv. 2–5' },
    { id: 'bosque-bravio', name: 'Bosque Bravio', subtitle: 'caça • terreno denso', x: -48, z: 28, radius: 18, color: 0x9db7ff, species: ['mossclaw', 'embermite'], levels: 'Lv. 3–6' },
    { id: 'costa-turquesa', name: 'Costa Turquesa', subtitle: 'maré • travessia futura', x: 51, z: -37, radius: 20, color: 0x72e9ff, species: ['gloomfin'], levels: 'Lv. 4–7' },
    { id: 'ruinas-incandescentes', name: 'Ruínas Incandescentes', subtitle: 'minério • desafio', x: 62, z: 34, radius: 19, color: 0xffa164, species: ['embermite', 'ironroot'], levels: 'Lv. 5–8' }
  ]
};
const OPEN_FIELD_ZONE = { id: 'campinas-do-veu', name: 'Campinas do Véu', subtitle: 'exploração livre', color: 0xa7d77d, species: [], levels: 'Lv. 1–6' };
// Costa Aurora: segunda região contínua do mundo aberto.
REGION_DATA.zones.push(
  { id: 'costa-aurora-praia', name: 'Praia Aurora', subtitle: 'maré • caça costeira', x: 104, z: -42, radius: 22, color: 0x79ddff, species: ['gloomfin', 'glintling'], levels: 'Lv. 8–12' },
  { id: 'costa-aurora-recife', name: 'Recife Luminar', subtitle: 'cristais • água rasa', x: 130, z: -8, radius: 21, color: 0x66f2dd, species: ['gloomfin', 'mossclaw'], levels: 'Lv. 10–15' },
  { id: 'costa-aurora-penhasco', name: 'Penhasco dos Ventos', subtitle: 'vento • montaria aérea', x: 103, z: 35, radius: 23, color: 0xb5b9ff, species: ['embermite', 'ironroot'], levels: 'Lv. 13–18' },
  { id: 'costa-aurora-ruinas', name: 'Ruínas da Maré', subtitle: 'chefe • passagem norte', x: 143, z: 42, radius: 20, color: 0xffa7d8, species: ['gloomfin', 'ironroot'], levels: 'Lv. 16–22' }
);

const QUEST_DATA = [
  { id: 'mapa-vivo', title: 'Um mapa vivo', giver: 'nara', description: 'Converse com Nara e reconheça o Acampamento Íris.', goal: 'Fale com Nara', target: 1, reward: { xp: 35, item: { aurora: 2 } } },
  { id: 'materiais-base', title: 'A primeira fogueira', giver: 'bram', description: 'Reúna madeira, pedra e fibra para erguer o Núcleo e uma bancada.', goal: 'Materiais coletados', target: 3, reward: { xp: 75, item: { food: 2 } } },
  { id: 'primeira-captura', title: 'Laço de confiança', giver: 'yara', description: 'Enfraqueça um monstrinho da Clareira Aurora e capture-o.', goal: 'Monstrinho capturado', target: 1, reward: { xp: 90, item: { capsules: 2 } } },
  { id: 'sabores-do-vale', title: 'Sabores do vale', giver: 'ivo', description: 'Colete folha aurora e esporo musgoso para produzir um Tônico Aurora.', goal: 'Tônico fabricado', target: 1, reward: { xp: 110, item: { tide: 2 } } },
  { id: 'levantamento', title: 'Levantamento do Vale Verde', giver: 'vesper', description: 'Visite três zonas de caça e registre a fauna da região.', goal: 'Zonas descobertas', target: 3, reward: { xp: 160, item: { crystal: 3 } } },
  { id: 'passagem-iris', title: 'Sinal para além do vale', giver: 'cael', description: 'Construa o Núcleo, derrote Ironroot e prepare a passagem da próxima região.', goal: 'Desafio concluído', target: 1, reward: { xp: 420, item: { beacon: 1 } } }
];

const DEFAULT_QUESTS = Object.fromEntries(QUEST_DATA.map((quest) => [quest.id, { progress: 0, complete: false, claimed: false }]));

function loadSave() {
  const base = {
    x: 0, z: 12, day: 1, dayClock: .26, level: 1, xp: 0,
    hp: 320, hunger: 100, water: 100, energy: 100,
    inventory: { wood: 40, stone: 24, fiber: 20, ore: 0, crystal: 0, berry: 8, aurora: 0, tide: 0, spore: 0, beacon: 0, capsules: 5, food: 3, repair: 0 },
    structures: [], captured: [], team: normalizeTeamSlots(), activeTeamIndex: 0,
    attributePoints: 0, skillPoints: 0, zoneId: 'vila-iris', quests: Object.assign({}, DEFAULT_QUESTS),
    attributes: Object.assign({}, DEFAULT_ATTRIBUTES), skills: Object.assign({}, DEFAULT_SKILLS)
  };
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    base.inventory = Object.assign(base.inventory, stored.inventory || {});
    base.structures = Array.isArray(stored.structures) ? stored.structures : [];
    base.captured = Array.isArray(stored.captured) ? stored.captured : [];
    Object.assign(base, stored);
    base.inventory = Object.assign({
      wood: 40, stone: 24, fiber: 20, ore: 0, crystal: 0, berry: 8, aurora: 0, tide: 0, spore: 0, beacon: 0, capsules: 5, food: 3, repair: 0
    }, base.inventory || {});
    base.team = normalizeTeamSlots(stored.team);
    base.activeTeamIndex = Math.max(0, Math.min(TEAM_LIMIT - 1, Math.floor(Number(stored.activeTeamIndex) || 0)));
    base.legacyTeam = !Array.isArray(stored.team);
    base.attributes = Object.assign({}, DEFAULT_ATTRIBUTES, stored.attributes || {});
    base.skills = Object.assign({}, DEFAULT_SKILLS, stored.skills || {});
    base.attributePoints = Math.max(0, Number(base.attributePoints) || 0);
    base.skillPoints = Math.max(0, Number(base.skillPoints) || 0);
    base.quests = Object.fromEntries(QUEST_DATA.map((quest) => [quest.id, Object.assign({}, DEFAULT_QUESTS[quest.id], stored.quests?.[quest.id] || {})]));
    base.zoneId = REGION_DATA.zones.some((zone) => zone.id === stored.zoneId) ? stored.zoneId : 'vila-iris';
    base.discoveredZones = Array.isArray(stored.discoveredZones) ? stored.discoveredZones.filter((id) => REGION_DATA.zones.some((zone) => zone.id === id)) : [base.zoneId];
    base.hp = Math.max(1, Number(base.hp) || 320);
    base.dead = false;
  } catch (error) {
    console.warn('save unavailable', error);
  }
  return base;
}

const saved = loadSave();
let renderer;
let scene;
let camera;
let sun;
let ground;
let water;
let waterTexture;
let worldLabels;
let minimapContext;
let mapLargeContext;
let lastTime = performance.now();
let saveTimer = 0;
let survivalTimer = 0;
let resourceId = 0;
let structureId = 0;
let labelId = 0;
let gltfLoader = null;
let skeletonUtils = null;
const assetCache = new Map();
const assetState = {
  loaderReady: false,
  loaderError: '',
  environmentLoaded: 0,
  environmentTotal: 0,
  creatureLoaded: 0,
  creatureTotal: 0,
  fallback: true,
  lastMessage: ''
};
const performanceState = {
  quality: innerWidth < 900 ? 0 : 1,
  frameAccumulator: 0,
  frameCount: 0,
  lastCheck: 0,
  dpr: 1
};

const state = {
  day: Number(saved.day) || 1,
  dayClock: clamp(Number(saved.dayClock) || .26, 0, 1),
  level: Number(saved.level) || 1,
  xp: Number(saved.xp) || 0,
  hp: clamp(Number(saved.hp) || 320, 1, 320),
  hunger: clamp(Number(saved.hunger) || 100, 0, 100),
  water: clamp(Number(saved.water) || 100, 0, 100),
  energy: clamp(Number(saved.energy) || 100, 0, 100),
  attributePoints: Math.max(0, Number(saved.attributePoints) || 0),
  skillPoints: Math.max(0, Number(saved.skillPoints) || 0),
  attributes: Object.assign({}, DEFAULT_ATTRIBUTES, saved.attributes || {}),
  skills: Object.assign({}, DEFAULT_SKILLS, saved.skills || {}),
  team: normalizeTeamSlots(saved.team),
  activeTeamIndex: clamp(Math.floor(Number(saved.activeTeamIndex) || 0), 0, TEAM_LIMIT - 1),
  dead: false,
  respawnTimer: 0,
  respawnReady: false,
  respawnDeadline: 0,
  respawnTimeout: null,
  gathering: null,
  crafting: null,
  inventory: Object.assign({}, saved.inventory),
  player: null,
  wild: [],
  npcs: [],
  resources: [],
  structures: [],
  projectiles: [],
  effects: [],
  floating: [],
  labels: [],
  feed: [],
  paused: false,
  cooldowns: { attack: 0, pulse: 0, void: 0, prism: 0, dodge: 0 },
  input: { keys: new Set(), joyX: 0, joyY: 0, joyActive: false, pointerId: null },
  camera: { yaw: 0.55, pitch: .48, distance: 18.5, looking: false, pointerId: null, x: 0, y: 0 },
  dialogue: null,
  objective: saved.objective || 'Fale com Nara e construa um Núcleo de Base.',
  roster: Array.isArray(saved.captured) ? saved.captured : [],
  region: REGION_DATA,
  zoneId: saved.zoneId || 'vila-iris',
  zoneBanner: 0,
  quests: Object.fromEntries(QUEST_DATA.map((quest) => [quest.id, Object.assign({}, DEFAULT_QUESTS[quest.id], saved.quests?.[quest.id] || {})])),
  discoveredZones: new Set(Array.isArray(saved.discoveredZones) && saved.discoveredZones.length ? saved.discoveredZones : [saved.zoneId || 'vila-iris'])
};


function attributeLevel(key) {
  return Math.max(0, Math.floor(Number(state.attributes[key]) || 0));
}

function skillLevel(key) {
  return Math.max(0, Math.floor(Number(state.skills[key]) || 0));
}

function activeSpecies() {
  return state.player?.spec || SPECIES.lumion;
}

function playerMaxHpForSpec(spec) {
  const baseHp = Number(spec?.hp) || SPECIES.lumion.hp;
  return Math.max(1, Math.round(baseHp + attributeLevel('vitality') * 36));
}

function maxPlayerHp() {
  return playerMaxHpForSpec(activeSpecies());
}

function carryCapacity() {
  return 100 + attributeLevel('capacity') * 25;
}

function inventoryWeight() {
  return Object.entries(state.inventory).reduce((total, entry) => total + (Number(entry[1]) || 0) * (ITEM_WEIGHTS[entry[0]] || 0), 0);
}

function regionZoneAt(position) {
  if (!position) return REGION_DATA.zones[0];
  return REGION_DATA.zones.find((zone) => Math.hypot(position.x - zone.x, position.z - zone.z) <= zone.radius) || OPEN_FIELD_ZONE;
}

function transitionLocked() {
  return !state.structures.some((item) => item.type === 'core') || !state.quests['levantamento']?.complete || !state.quests['passagem-iris']?.complete;
}

function activeQuest() {
  return QUEST_DATA.find((quest) => !state.quests[quest.id]?.complete) || QUEST_DATA[QUEST_DATA.length - 1];
}

function grantQuest(quest) {
  if (!quest || state.quests[quest.id]?.claimed) return;
  const progress = state.quests[quest.id] || (state.quests[quest.id] = { progress: 0, complete: false, claimed: false });
  progress.complete = true;
  progress.progress = quest.target;
  progress.claimed = true;
  if (quest.reward?.xp) addXp(quest.reward.xp);
  Object.entries(quest.reward?.item || {}).forEach(([key, amount]) => { state.inventory[key] = (state.inventory[key] || 0) + amount; });
  feed('QUEST CONCLUÍDA • ' + quest.title + ' • +' + (quest.reward?.xp || 0) + ' XP');
  saveGame();
}

function advanceQuest(id, amount) {
  const quest = QUEST_DATA.find((entry) => entry.id === id);
  if (!quest || state.quests[id]?.complete) return;
  const progress = state.quests[id] || (state.quests[id] = { progress: 0, complete: false, claimed: false });
  progress.progress = Math.min(quest.target, progress.progress + (amount || 1));
  if (progress.progress >= quest.target) grantQuest(quest);
}

function updateRegionZone() {
  if (!state.player) return;
  const zone = regionZoneAt(state.player.group.position);
  if (zone.id === state.zoneId) return;
  const wasDiscovered = state.discoveredZones.has(zone.id);
  state.zoneId = zone.id;
  if (REGION_DATA.zones.some((entry) => entry.id === zone.id)) state.discoveredZones.add(zone.id);
  state.zoneBanner = 4.5;
  feed('ÁREA DESCOBERTA • ' + zone.name);
  if (!wasDiscovered && zone.id !== 'vila-iris') advanceQuest('levantamento', 1);
  saveGame();
}

function playerMoveSpeed() {
  return (Number(activeSpecies().speed) || SPECIES.lumion.speed) * (1 + attributeLevel('agility') * .045);
}

function gatherDuration() {
  return Math.max(.35, 1.5 / (1 + attributeLevel('gathering') * .14));
}

function craftDuration() {
  return Math.max(.45, 2.4 / (1 + attributeLevel('crafting') * .14));
}

function combatDamage(base, skillKey) {
  const skillBonus = skillKey ? 1 + Math.max(0, skillLevel(skillKey) - 1) * .08 : 1;
  return Math.round(base * (1 + attributeLevel('strength') * .07) * skillBonus);
}

function canAct() {
  return Boolean(state.player && state.player.group && state.player.group.visible && !state.player.dead && !state.dead && !state.paused);
}

function syncPlayerStats(heal) {
  if (!state.player) return;
  const oldMax = state.player.maxHp || playerMaxHpForSpec(state.player.spec);
  state.player.maxHp = maxPlayerHp();
  if (heal) state.player.hp = Math.min(state.player.maxHp, state.player.hp + (state.player.maxHp - oldMax) + 24);
  state.player.hp = clamp(state.player.hp, 1, state.player.maxHp);
  state.hp = state.player.hp;
  syncActiveTeamSlot();
}

function activeTeamSlot() {
  return state.team[state.activeTeamIndex] || null;
}

function syncActiveTeamSlot() {
  const slot = activeTeamSlot();
  if (!slot || !state.player) return;
  slot.hp = Math.max(1, Math.min(state.player.maxHp, Number(state.player.hp) || 1));
  slot.level = state.level;
}

function createTeamPlayer(index, x, z, rotation) {
  const slot = state.team[index] || state.team[0] || makeTeamSlot('lumion');
  const spec = SPECIES[slot.speciesId] || SPECIES.lumion;
  const creature = new Creature(spec, 'player', x, z);
  creature.teamSlotIndex = index;
  creature.maxHp = playerMaxHpForSpec(spec);
  const sourceHp = saved.legacyTeam && index === 0 ? saved.hp : slot.hp;
  creature.hp = clamp(Number(sourceHp) || creature.maxHp, 1, creature.maxHp);
  if (Number.isFinite(Number(rotation))) creature.group.rotation.y = Number(rotation);
  if (creature.label) creature.label.sub.textContent = 'HP ' + Math.ceil(creature.hp) + '/' + creature.maxHp;
  return creature;
}

function switchTeam(index) {
  if (!canAct()) return false;
  const nextIndex = Math.floor(Number(index));
  const nextSlot = state.team[nextIndex];
  if (!nextSlot || !isTeamSpecies(nextSlot.speciesId)) return false;
  if (nextIndex === state.activeTeamIndex) {
    updateInventoryModal();
    return true;
  }
  const position = state.player.group.position.clone();
  const rotation = state.player.group.rotation.y;
  syncActiveTeamSlot();
  clearTransientCombat();
  state.player.dispose();
  state.activeTeamIndex = nextIndex;
  state.player = createTeamPlayer(nextIndex, position.x, position.z, rotation);
  state.hp = state.player.hp;
  Object.keys(state.cooldowns).forEach((key) => { state.cooldowns[key] = 0; });
  feed('Você agora controla ' + state.player.spec.name + '.');
  updateUI();
  updateInventoryModal();
  saveGame();
  return true;
}

function addBoxCreatureToTeam(boxIndex) {
  if (!canAct()) return;
  const index = Math.floor(Number(boxIndex));
  const speciesId = teamSpeciesId(state.roster[index]);
  if (!isTeamSpecies(speciesId)) return;
  if (state.team.some((slot) => slot.speciesId === speciesId)) {
    feed((SPECIES[speciesId]?.name || speciesId) + ' já está no time.');
    return;
  }
  const replacementIndex = state.team.map((_, slotIndex) => slotIndex).reverse().find((slotIndex) => slotIndex !== state.activeTeamIndex);
  if (replacementIndex === undefined) {
    feed('Não há slot disponível para essa criatura.');
    return;
  }
  const replacement = state.team[replacementIndex];
  state.roster.splice(index, 1);
  state.roster.push(replacement.speciesId);
  state.team[replacementIndex] = makeTeamSlot(speciesId);
  feed((SPECIES[speciesId]?.name || speciesId) + ' entrou no time.');
  updateInventoryModal();
  saveGame();
}

function uiText(id, value) {
  const element = $('#' + id);
  if (element) element.textContent = value;
}

function uiBar(id, value) {
  const element = $('#' + id);
  if (element) element.style.width = (clamp(value, 0, 1) * 100) + '%';
}

function material(color, roughness, metalness, emissive, emissiveIntensity) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: roughness === undefined ? .78 : roughness,
    metalness: metalness === undefined ? .05 : metalness,
    emissive: emissive || 0x000000,
    emissiveIntensity: emissiveIntensity || 0
  });
}

function smoothSphere(radius, width, height) {
  const geometry = new THREE.SphereGeometry(radius, width || 20, height || 14);
  geometry.computeVertexNormals();
  return geometry;
}

function meshPart(parent, geometry, mat, x, y, z, sx, sy, sz, name) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x || 0, y || 0, z || 0);
  mesh.scale.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function makeTexture(baseColor, accentColor, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);
  let n = seed || 7;
  const rand = () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
  for (let i = 0; i < 320; i += 1) {
    const x = rand() * 256;
    const y = rand() * 256;
    const size = .4 + rand() * 2.5;
    ctx.globalAlpha = .10 + rand() * .20;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = .23;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1;
  for (let i = 0; i < 22; i += 1) {
    const x = rand() * 256;
    const y = rand() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4 + rand() * 6, y - 4 - rand() * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function getWebGLDiagnostics() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const attributes = { alpha: false, antialias: false, powerPreference: 'default' };
  let gl = null;
  let reason = '';
  try {
    gl = canvas.getContext('webgl2', attributes);
  } catch (error) {
    reason = error && error.message ? error.message : String(error);
  }
  if (!gl) {
    return { available: false, webgl2: false, vendor: 'Disabled', renderer: 'Disabled', reason };
  }
  let vendor = 'WebGL 2';
  let rendererName = 'WebGL 2';
  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    rendererName = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch (error) {
    reason = error && error.message ? error.message : String(error);
  }
  return { available: true, webgl2: true, vendor, renderer: rendererName, reason };
}

function createRendererCompat() {
  const canvas = $('#world-canvas');
  const attempts = [
    { antialias: false, powerPreference: 'high-performance' },
    { antialias: false, powerPreference: 'default' },
    { antialias: true, powerPreference: 'low-power' }
  ];
  let lastError = null;
  for (let index = 0; index < attempts.length; index += 1) {
    const options = attempts[index];
    try {
      return new THREE.WebGLRenderer({ canvas, ...options });
    } catch (error) {
      lastError = error;
      if (index === 0) {
        const diagnosis = getWebGLDiagnostics();
        if (!diagnosis.available) {
          error.webgl = diagnosis;
          throw error;
        }
      }
    }
  }
  const diagnosis = getWebGLDiagnostics();
  if (lastError) lastError.webgl = diagnosis;
  throw lastError || new Error('WEBGL_RENDERER_FAILED');
}

function applyQualityPreset(level) {
  if (!renderer || !sun) return;
  performanceState.quality = clamp(level, 0, 2);
  const presets = [
    { dpr: 1.0, shadow: 512, exposure: 1.04 },
    { dpr: Math.min(devicePixelRatio || 1, 1.35), shadow: 1024, exposure: 1.1 },
    { dpr: Math.min(devicePixelRatio || 1, 1.65), shadow: 1536, exposure: 1.14 }
  ];
  const preset = presets[performanceState.quality];
  performanceState.dpr = preset.dpr;
  renderer.setPixelRatio(preset.dpr);
  sun.shadow.mapSize.set(preset.shadow, preset.shadow);
  renderer.toneMappingExposure = preset.exposure;
}

function updatePerformance(dt) {
  performanceState.frameAccumulator += dt;
  performanceState.frameCount += 1;
  if (performanceState.frameAccumulator < 2) return;
  const average = performanceState.frameAccumulator / performanceState.frameCount;
  performanceState.frameAccumulator = 0;
  performanceState.frameCount = 0;
  if (average > .026 && performanceState.quality > 0) {
    applyQualityPreset(performanceState.quality - 1);
    feed('QUALIDADE ADAPTATIVA • modo fluido');
  } else if (average < .015 && performanceState.quality < 2) {
    applyQualityPreset(performanceState.quality + 1);
  }
}


function assetErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function setAssetStatus(message) {
  assetState.lastMessage = message;
  const element = $('#asset-status');
  if (element) element.textContent = message;
}

async function ensureAssetLoader() {
  if (gltfLoader) return true;
  try {
    const loaderModule = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js');
    const skeletonModule = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/SkeletonUtils.js');
    gltfLoader = new loaderModule.GLTFLoader();
    skeletonUtils = skeletonModule;
    assetState.loaderReady = true;
    return true;
  } catch (error) {
    assetState.loaderError = assetErrorMessage(error);
    setAssetStatus('ARTE 3D • cenário procedural');
    console.warn('Wildlands asset loader unavailable; keeping procedural fallback.', error);
    return false;
  }
}

function loadGltfAsset(asset) {
  if (!asset || !asset.modelUrl) return Promise.reject(new Error('ASSET_URL_MISSING'));
  const url = asset.modelUrl;
  if (!assetCache.has(url)) {
    const pending = (async () => {
      if (!(await ensureAssetLoader())) throw new Error(assetState.loaderError || 'GLTF_LOADER_UNAVAILABLE');
      return await new Promise((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
      });
    })();
    assetCache.set(url, pending);
  }
  return assetCache.get(url);
}

function cloneAssetRoot(gltf) {
  const root = skeletonUtils && skeletonUtils.clone ? skeletonUtils.clone(gltf.scene) : gltf.scene.clone(true);
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.frustumCulled = true;
  });
  return root;
}

function fitAssetToHeight(root, height) {
  const target = Number(height) || 2.5;
  const initial = new THREE.Box3().setFromObject(root);
  const size = initial.getSize(new THREE.Vector3());
  if (size.y > .001) root.scale.multiplyScalar(target / size.y);
  const fitted = new THREE.Box3().setFromObject(root);
  root.position.x -= (fitted.min.x + fitted.max.x) / 2;
  root.position.z -= (fitted.min.z + fitted.max.z) / 2;
  root.position.y -= fitted.min.y;
}

function animationClipFor(clips, action) {
  const aliases = {
    idle: ['idle', 'stand', 'breath', 'flying_idle'],
    walk: ['walk', 'run', 'move', 'fast_flying', 'flying'],
    attack: ['attack', 'atk', 'bite', 'punch', 'headbutt', 'hitreact', 'hit'],
    cast: ['cast', 'skill', 'punch', 'headbutt', 'attack'],
    hit: ['hitreact', 'hit', 'hurt', 'damage'],
    death: ['death', 'die', 'faint']
  }[action] || ['idle'];
  const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const list = clips || [];
  const match = list.find((clip) => aliases.some((alias) => normalized(clip.name).includes(normalized(alias))));
  if (match) return match;
  const safeIdle = list.find((clip) => ['idle', 'stand', 'flying'].some((alias) => normalized(clip.name).includes(alias)));
  return safeIdle || (action === 'death' ? null : list[0]) || null;
}

async function mountCreatureAsset(creature, key) {
  const asset = WILDLANDS_ASSETS.creatures[key];
  if (!creature || !asset || creature.assetModel) return;
  try {
    const gltf = await loadGltfAsset(asset);
    if (!creature.group || !creature.group.parent) return;
    const root = cloneAssetRoot(gltf);
    fitAssetToHeight(root, asset.targetHeight || (creature.role === 'boss' ? 5.2 : 2.5));
    root.rotation.y = Math.PI;
    root.userData.wildlandsCreatureAsset = key;
    creature.group.add(root);
    creature.assetModel = root;
    creature.assetClips = gltf.animations || [];
    creature.assetMixer = creature.assetClips.length ? new THREE.AnimationMixer(root) : null;
    creature.assetAction = null;
    creature.assetActionName = '';
    creature.model.visible = false;
    creature.playExternalAnimation(creature.action === 'idle' ? (creature.moving ? 'walk' : 'idle') : creature.action);
    assetState.creatureLoaded += 1;
    setAssetStatus('ARTE 3D • criaturas ' + assetState.creatureLoaded + '/' + assetState.creatureTotal);
  } catch (error) {
    console.warn('Could not load creature asset ' + key + '.', error);
  }
}

async function mountEnvironmentAsset(key, placement) {
  const asset = WILDLANDS_ASSETS.environment[key];
  if (!asset || !scene) return;
  try {
    const gltf = await loadGltfAsset(asset);
    if (!scene) return;
    const root = cloneAssetRoot(gltf);
    fitAssetToHeight(root, placement[3] || asset.targetHeight || 3);
    root.position.x = placement[1];
    root.position.z = placement[2];
    root.rotation.y = placement[4] || 0;
    root.userData.wildlandsEnvironmentAsset = key;
    root.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = key === 'house' || key === 'inn' || key === 'sawmill' || key === 'market';
    });
    scene.add(root);
    assetState.environmentLoaded += 1;
  } catch (error) {
    console.warn('Could not load environment asset ' + key + '.', error);
  }
}

async function loadWorldAssetPack() {
  if (!scene) return;
  const placements = [
    ['birch', -38, -38, 7.2, .1], ['maple', -26, -28, 6.2, .8], ['pine', -5, -37, 7.4, .2],
    ['oak', 13, -28, 6.3, 2.4], ['maple', 30, -13, 6.2, 1.1], ['birch', -52, 8, 7.2, 2.7],
    ['pine', -39, 30, 7.4, .4], ['oak', -12, 42, 6.4, 1.8], ['birch', 13, 33, 7.0, .7],
    ['maple', 30, 27, 6.2, 2.1], ['pine', 47, 9, 7.2, .5], ['birch', 66, 19, 7.0, 1.4],
    ['oak', 79, 4, 6.4, 2.8], ['pine', -76, -24, 7.5, .1], ['maple', -69, 48, 6.4, 1.7],
    ['rock', -42, -12, 3.1, .2], ['rock', -2, -5, 2.6, 1.4], ['rock', 32, -45, 3.1, .8],
    ['rock', 72, -27, 2.7, 2.1], ['rock', 70, 39, 3.3, .3], ['rock', 2, 53, 2.8, 1.2],
    ['bush', -52, -16, 1.8, .2], ['bush', -27, 4, 1.6, 2.3], ['bush', 27, 2, 1.7, .9],
    ['bush', 58, -7, 1.8, 1.5], ['bush', 45, 35, 1.7, .3], ['flowers', -8, -9, 1.5, .6],
    ['flowers', 18, 34, 1.4, 1.2], ['flowers', 61, 12, 1.5, 2.7],
    ['house', -13, 15, 5.8, .2], ['house', -24, 18, 4.8, .2], ['inn', 15, 14, 6.2, .2],
    ['sawmill', 24, 26, 5.1, 1.0], ['well', -3, 17, 2.0, .3], ['bonfire', 2, 18, 1.8, .1],
    ['market', 8, 18, 2.8, .1], ['fence', -18, 11, 1.7, .1]
  ];
  const creatures = [state.player, ...state.wild].filter((creature) => creature && creature.spec && creature.spec.assetKey);
  assetState.environmentLoaded = 0;
  assetState.environmentTotal = placements.length;
  assetState.creatureLoaded = 0;
  assetState.creatureTotal = creatures.length;
  setAssetStatus('ARTE 3D • carregando assets');
  const jobs = [
    ...placements.map((placement) => mountEnvironmentAsset(placement[0], placement)),
    ...creatures.map((creature) => mountCreatureAsset(creature, creature.spec.assetKey))
  ];
  await Promise.allSettled(jobs);
  const minimumRemoteProps = Math.ceil(placements.length * .5);
  if (assetState.environmentLoaded >= minimumRemoteProps) {
    scene.traverse((object) => {
      if (object.userData && object.userData.proceduralLandscape && !object.userData.keepVisible) object.visible = false;
    });
    assetState.fallback = false;
    setAssetStatus('ARTE 3D • mundo integrado');
  } else if (kind === 'aurora') {
    for (let i = 0; i < 3; i += 1) {
      const leaf = meshPart(group, new THREE.ConeGeometry(.12, .85 + i * .12, 5), material(data.color, .32, .02, data.color, .8), (i - 1) * .24, .48, 0);
      leaf.rotation.z = (i - 1) * .35;
    }
    group.add(new THREE.PointLight(0x75f5c7, .75, 3.8));
  } else if (kind === 'spore') {
    meshPart(group, new THREE.CylinderGeometry(.09, .14, .7, 7), material(0x536a3d, .9), 0, .35, 0);
    meshPart(group, new THREE.SphereGeometry(.38, 12, 8), material(data.color, .42, .04, data.color, .7), 0, .78, 0);
    for (let i = 0; i < 4; i += 1) meshPart(group, new THREE.SphereGeometry(.055, 8, 6), material(0xeaffad, .3, 0, 0xd6ff79, 1.1), (i - 1.5) * .17, .86 + (i % 2) * .13, .18);
  } else if (kind === 'tide') {
    meshPart(group, new THREE.DodecahedronGeometry(.42, 1), material(data.color, .18, .35, 0x4adfff, 1.6), 0, .55, 0);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.66, .025, 6, 24), new THREE.MeshBasicMaterial({ color: data.color, transparent: true, opacity: .7 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .55;
    group.add(ring);
    group.add(new THREE.PointLight(0x57ddff, .85, 3.5));
  } else {
    assetState.fallback = true;
    setAssetStatus('ARTE 3D • fallback procedural');
  }
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07151d);
  scene.fog = new THREE.Fog(0x0a252c, 38, 150);
  camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, .1, 240);
  camera.position.set(0, 11.2, 18.5);

  renderer = createRendererCompat();
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const hemi = new THREE.HemisphereLight(0x9adbe5, 0x173324, 1.7);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffe4b0, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x6cb9ff, 1.1);
  rim.position.set(-35, 22, 45);
  scene.add(rim);
  applyQualityPreset(performanceState.quality);

  worldLabels = $('#world-labels');
  minimapContext = $('#minimap').getContext('2d');
  const largeMap = $('#map-large');
  mapLargeContext = largeMap ? largeMap.getContext('2d') : null;
  createTerrain();
  createLandmarks();
  createRegionVisuals();
  createResources();
  createNpcs();
  createCreatures();
  restoreStructures();
  // A arte 2.5D local deve ser aplicada depois que todos os objetos existem.
  // O antigo pacote GLB remoto era apenas fallback e deixava os meshes de teste visíveis.
  upgradeEnvironmentArtwork();
}

function createRegionVisuals() {
  REGION_DATA.zones.forEach((zone) => {
    const group = new THREE.Group();
    group.position.set(zone.x, .035, zone.z);
    group.userData.zoneId = zone.id;
    group.userData.proceduralLandscape = true;
    group.userData.keepVisible = true;
    const patch = new THREE.Mesh(
      new THREE.CircleGeometry(zone.radius, 64),
      new THREE.MeshBasicMaterial({ color: zone.color, transparent: true, opacity: .018, depthWrite: false })
    );
    patch.rotation.x = -Math.PI / 2;
    group.add(patch);
    scene.add(group);
    addLabel(zone.name, 'zone', group, zone.subtitle + (zone.levels ? ' • ' + zone.levels : ''));
  });

  const beacon = new THREE.Group();
  beacon.position.set(REGION_DATA.transition.x, 0, REGION_DATA.transition.z);
  const stone = material(0x78959c, .78, .08);
  const glow = material(0x71eaff, .24, .1, 0x39dfff, 1.7);
  meshPart(beacon, new THREE.CylinderGeometry(1.25, 1.65, .3, 8), stone, 0, .15, 0);
  meshPart(beacon, new THREE.CylinderGeometry(.16, .24, 3.6, 8), stone, 0, 1.95, 0);
  meshPart(beacon, new THREE.OctahedronGeometry(.62, 1), glow, 0, 3.8, 0);
  const beaconRing = meshPart(beacon, new THREE.TorusGeometry(1.45, .035, 8, 32), glow, 0, .4, 0);
  beaconRing.rotation.x = Math.PI / 2;
  beacon.add(new THREE.PointLight(0x57eaff, 2.2, 12));
  beacon.userData.proceduralLandscape = true;
  beacon.userData.keepVisible = true;
  scene.add(beacon);
  addLabel('Passagem Íris', 'transition', beacon, transitionLocked() ? 'COSTA TURQUESA • BLOQUEADA' : 'COSTA TURQUESA • ABERTA');
}

function createTerrain() {
  const grassTexture = makeTexture('#173d35', '#75be70', 45);
  grassTexture.repeat.set(12, 9);
  ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 128, 1, 1),
    new THREE.MeshStandardMaterial({ map: grassTexture, color: 0x87a889, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.06;
  ground.receiveShadow = true;
  scene.add(ground);

  const pathTexture = makeTexture('#6e4d31', '#a27b4d', 18);
  pathTexture.repeat.set(5, 2);
  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(95, 10),
    new THREE.MeshStandardMaterial({ map: pathTexture, color: 0x9a7850, roughness: 1 })
  );
  path.rotation.x = -Math.PI / 2;
  path.position.set(-12, .01, 14);
  path.receiveShadow = true;
  scene.add(path);

  const coast = new THREE.Mesh(
    new THREE.PlaneGeometry(48, 34),
    new THREE.MeshStandardMaterial({ color: 0x197a85, roughness: .38, metalness: .08, transparent: true, opacity: .9 })
  );
  coast.rotation.x = -Math.PI / 2;
  coast.position.set(52, .06, -37);
  coast.receiveShadow = true;
  scene.add(coast);
  water = coast;

  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 6),
    new THREE.MeshStandardMaterial({ color: 0xc29a61, roughness: 1 })
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(51, .03, -18);
  scene.add(beach);

  const ruins = new THREE.Mesh(
    new THREE.CylinderGeometry(28, 28, .12, 48),
    new THREE.MeshStandardMaterial({ color: 0x75422e, roughness: .92 })
  );
  ruins.position.set(58, .02, 36);
  ruins.scale.z = .72;
  ruins.receiveShadow = true;
  scene.add(ruins);

  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(18, .35, 5),
    new THREE.MeshStandardMaterial({ color: 0x9b6940, roughness: .8 })
  );
  bridge.position.set(48, .43, -18);
  bridge.castShadow = true;
  bridge.receiveShadow = true;
  scene.add(bridge);
  for (let i = -2; i <= 2; i += 1) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.1, .25), material(0x5a3826));
    post.position.set(48 + i * 4, .65, -20.1);
    post.castShadow = true;
    scene.add(post);
  }

  waterTexture = makeTexture('#1d7981', '#87e5dc', 9);
  waterTexture.repeat.set(2, 2);
  water.material.map = waterTexture;
  water.material.needsUpdate = true;
}

function createLandmarks() {
  const trees = [
    [-38, -38, 1.25], [-26, -28, .92], [-5, -37, 1.05], [13, -28, .95], [30, -13, 1.08],
    [-52, 8, 1.2], [-39, 30, .96], [-12, 42, 1.18], [13, 33, .88], [30, 27, 1.1],
    [47, 9, .94], [66, 19, 1.18], [79, 4, .9], [-76, -24, 1.15], [-69, 48, .98]
  ];
  trees.forEach((item) => addTree(item[0], item[1], item[2], false));
  addHouse(-13, 15, 1.08, 0x3f782f);
  addHouse(-24, 18, .78, 0x486f32);
  addHouse(15, 14, .9, 0x944b2a);
  addWatchtower(-58, 25);
  addRockFormation(-42, -12, 1.1);
  addRockFormation(-2, -5, .85);
  addRockFormation(32, -45, 1.05);
  addRockFormation(72, -27, .8);
  addRockFormation(70, 39, 1.2);
  addRockFormation(2, 53, .9);
  addFence(-18, 11, 16, 8);
}

function addTree(x, z, scale, harvestable) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale || 1);
  group.userData.proceduralLandscape = true;
  group.userData.environmentType = 'tree';
  group.userData.environmentVariant = Math.abs(Math.floor(x * 3 + z)) % 3;
  const trunk = meshPart(group, new THREE.CylinderGeometry(.27, .42, 2.4, 10), material(0x6a3c25, 1), 0, 1.2, 0, 1, 1, 1, 'trunk');
  trunk.castShadow = true;
  const root = meshPart(group, new THREE.ConeGeometry(.82, 1.6, 7), material(0x4f7c38, .94), 0, 2.15, 0, 1, 1, 1, 'crown');
  const crown2 = meshPart(group, smoothSphere(.84, 16, 12), material(0x376f42, .95), -.55, 2.5, .1, 1, .82, 1.05, 'crown2');
  const crown3 = meshPart(group, smoothSphere(.72, 16, 12), material(0x5f9b4d, .95), .55, 2.45, .12, 1, .85, 1, 'crown3');
  root.castShadow = crown2.castShadow = crown3.castShadow = true;
  scene.add(group);
  colliders.push({ x, z, radius: .85 * (scale || 1) });
  if (harvestable) addResource('tree', x + .9, z + .6, group);
  return group;
}

function addHouse(x, z, scale, roofColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale || 1);
  group.userData.proceduralLandscape = true;
  group.userData.environmentType = 'house';
  meshPart(group, new THREE.BoxGeometry(5.4, 2.7, 4.4), material(0x9d7651, .95), 0, 1.35, 0, 1, 1, 1, 'house');
  const roof = meshPart(group, new THREE.ConeGeometry(3.9, 2.5, 4), material(roofColor || 0x456c32, .84), 0, 3.85, 0, 1, 1, 1, 'roof');
  roof.rotation.y = Math.PI / 4;
  meshPart(group, new THREE.BoxGeometry(1.0, 1.6, .12), material(0x4b2e28, 1), 0, .82, 2.23, 1, 1, 1, 'door');
  const windowMat = material(0xffd77a, .35, .05, 0xffad33, 1.8);
  meshPart(group, new THREE.BoxGeometry(.8, .62, .08), windowMat, -1.55, 1.55, 2.25, 1, 1, 1, 'window');
  meshPart(group, new THREE.BoxGeometry(.8, .62, .08), windowMat, 1.55, 1.55, 2.25, 1, 1, 1, 'window');
  group.traverse((object) => { if (object.isMesh) object.castShadow = true; });
  scene.add(group);
  colliders.push({ x, z, radius: 3.1 * (scale || 1) });
}

function addWatchtower(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData.environmentType = 'watchtower';
  group.userData.proceduralLandscape = true;
  meshPart(group, new THREE.CylinderGeometry(.7, .95, 6.4, 8), material(0x5d4a38, .95), 0, 3.2, 0);
  meshPart(group, new THREE.ConeGeometry(2.2, 1.7, 6), material(0x3d5e83, .86), 0, 6.8, 0);
  const light = new THREE.PointLight(0xffc46e, 1.6, 9);
  light.position.y = 6;
  group.add(light);
  scene.add(group);
  colliders.push({ x, z, radius: 1.5 });
}

function addRockFormation(x, z, scale) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale || 1);
  group.userData.proceduralLandscape = true;
  group.userData.environmentType = 'rock';
  group.userData.environmentVariant = Math.abs(Math.floor(x + z)) % 2;
  meshPart(group, new THREE.DodecahedronGeometry(1.4, 1), material(0x65767a, .92, .06), 0, 1.1, 0);
  meshPart(group, new THREE.DodecahedronGeometry(.95, 1), material(0x84979a, .9, .04), 1.2, .7, -.2);
  meshPart(group, new THREE.DodecahedronGeometry(.8, 1), material(0x526567, .92, .04), -1.15, .55, .25);
  group.traverse((object) => { if (object.isMesh) object.castShadow = true; });
  scene.add(group);
  colliders.push({ x, z, radius: 1.8 * (scale || 1) });
}

function addFence(x, z, width, depth) {
  const mat = material(0x8b5a33, .95);
  for (let i = 0; i <= width; i += 2) {
    const postA = meshPart(scene, new THREE.BoxGeometry(.16, 1.25, .16), mat, x - width / 2 + i, .63, z - depth / 2);
    const postB = meshPart(scene, new THREE.BoxGeometry(.16, 1.25, .16), mat, x - width / 2 + i, .63, z + depth / 2);
    postA.castShadow = postB.castShadow = true;
  }
  const railA = meshPart(scene, new THREE.BoxGeometry(width, .14, .14), mat, x, .75, z - depth / 2);
  const railB = meshPart(scene, new THREE.BoxGeometry(width, .14, .14), mat, x, .75, z + depth / 2);
  railA.castShadow = railB.castShadow = true;
  colliders.push({ x, z: z - depth / 2, radius: width / 2 }, { x, z: z + depth / 2, radius: width / 2 });
}

function makeResourceMesh(kind) {
  const data = RESOURCE_DATA[kind];
  const group = new THREE.Group();
  group.userData.resourceKind = kind;
  if (kind === 'tree') {
    meshPart(group, new THREE.CylinderGeometry(.18, .28, 1.5, 8), material(0x62351f), 0, .75, 0);
    meshPart(group, new THREE.ConeGeometry(.7, 1.25, 6), material(0x4b9c45), 0, 1.55, 0);
  } else if (kind === 'rock' || kind === 'ore') {
    meshPart(group, new THREE.DodecahedronGeometry(.72, 1), material(data.color, .75, .12, kind === 'ore' ? 0x44251c : 0), 0, .7, 0);
    if (kind === 'ore') {
      meshPart(group, new THREE.DodecahedronGeometry(.26, 1), material(0xff9a5a, .35, .2, 0xff5d26, 1.2), .18, 1.05, .12);
    }
  } else if (kind === 'fiber') {
    for (let i = 0; i < 5; i += 1) {
      const blade = meshPart(group, new THREE.ConeGeometry(.08, 1.2, 5), material(data.color, .86), (i - 2) * .17, .6, (i % 2) * .16);
      blade.rotation.z = (i - 2) * .16;
    }
  } else if (kind === 'crystal') {
    const crystal = meshPart(group, new THREE.OctahedronGeometry(.76, 1), material(data.color, .28, .08, 0x1bbad0, 1.2), 0, .82, 0);
    crystal.rotation.y = .3;
    const glow = new THREE.PointLight(0x50e8ff, 1.1, 4.5);
    glow.position.y = .9;
    group.add(glow);
  } else {
    meshPart(group, new THREE.CylinderGeometry(.15, .3, .7, 8), material(0x5b3a2c), 0, .35, 0);
    meshPart(group, new THREE.SphereGeometry(.43, 14, 10), material(data.color, .75), 0, .78, 0);
    meshPart(group, new THREE.SphereGeometry(.18, 12, 8), material(0xff9c5d, .5, 0, 0xff573c, .5), .35, .82, .05);
  }
  group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  return group;
}

function addResource(kind, x, z, existingGroup) {
  const data = RESOURCE_DATA[kind];
  const group = existingGroup || makeResourceMesh(kind);
  if (!existingGroup) {
    group.position.set(x, 0, z);
    scene.add(group);
  }
  const resource = {
    id: 'resource-' + resourceId++,
    kind, x, z, group, data, collected: false, respawn: 0
  };
  state.resources.push(resource);
  return resource;
}

function createResources() {
  [
    ['tree', -64, -45], ['tree', -47, -29], ['tree', -25, -46], ['tree', -4, -27],
    ['tree', -70, 2], ['tree', -48, 43], ['tree', -19, 50], ['tree', 4, 43],
    ['rock', -64, -9], ['rock', -39, -3], ['rock', -17, -18], ['rock', 2, -31],
    ['rock', -10, 28], ['rock', -47, 51], ['rock', 34, -50], ['rock', 74, -40],
    ['fiber', -82, -5], ['fiber', -60, 20], ['fiber', -20, 6], ['fiber', 21, -22],
    ['fiber', 61, -12], ['fiber', 48, 47], ['fiber', -2, 59],
    ['ore', 28, 4], ['ore', 45, 18], ['ore', 67, 29], ['ore', 83, 20],
    ['ore', 38, 53], ['ore', -1, -54],
    ['crystal', 7, 1], ['crystal', 31, -28], ['crystal', 58, -50], ['crystal', 79, -5],
    ['crystal', 65, 51], ['berry', -29, -8], ['berry', -75, 39], ['berry', 12, 37],
    ['berry', 54, 1], ['berry', -1, 21],
    ['aurora', -39, -10], ['aurora', -25, -16], ['aurora', -18, -3], ['aurora', -34, 2],
    ['spore', 14, -25], ['spore', 27, -30], ['spore', 35, -17], ['spore', 18, -8],
    ['tide', 39, -20], ['tide', 58, -22], ['tide', 69, -39]
  ].forEach((item) => addResource(item[0], item[1], item[2]));
}

function makeNpcModel(color, accent) {
  const group = new THREE.Group();
  const bodyMat = material(color, .78);
  const accentMat = material(accent, .48, .05, accent, .18);
  meshPart(group, new THREE.CylinderGeometry(.48, .62, 1.45, 12), bodyMat, 0, .82, 0);
  meshPart(group, smoothSphere(.48, 18, 12), material(0xf0bd98, .8), 0, 1.82, .08, 1, 1.05, 1);
  meshPart(group, new THREE.ConeGeometry(.63, .5, 8), accentMat, 0, 2.25, .03);
  meshPart(group, new THREE.BoxGeometry(.13, .2, .08), material(0x101921, .4), -.17, 1.86, .44);
  meshPart(group, new THREE.BoxGeometry(.13, .2, .08), material(0x101921, .4), .17, 1.86, .44);
  meshPart(group, new THREE.CylinderGeometry(.12, .14, .72, 8), bodyMat, -.62, .83, 0, 1, 1, 1);
  meshPart(group, new THREE.CylinderGeometry(.12, .14, .72, 8), bodyMat, .62, .83, 0, 1, 1, 1);
  group.traverse((object) => { if (object.isMesh) object.castShadow = true; });
  return group;
}

function createNpcs() {
  NPC_DATA.forEach((data) => {
    const group = makeNpcModel(data.color, data.accent);
    group.userData.environmentType = 'npc';
    group.position.set(data.x, 0, data.z);
    scene.add(group);
    const npc = Object.assign({}, data, { group, label: addLabel(data.name, 'npc', group, data.role) });
    state.npcs.push(npc);
    colliders.push({ x: data.x, z: data.z, radius: .9 });
  });
}

function addLabel(text, kind, object, subtext) {
  const label = document.createElement('div');
  label.className = 'world-label ' + kind;
  const main = document.createElement('div');
  main.textContent = text;
  label.appendChild(main);
  const sub = document.createElement('span');
  sub.textContent = subtext || '';
  label.appendChild(sub);
  label.dataset.labelId = String(labelId++);
  worldLabels.appendChild(label);
  const record = { element: label, object, main, sub, kind, visible: true };
  state.labels.push(record);
  return record;
}

function makeShadow(parent, radius) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius || .7, 24),
    new THREE.MeshBasicMaterial({ color: 0x02070a, transparent: true, opacity: .48, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .025;
  shadow.renderOrder = 2;
  parent.add(shadow);
  return shadow;
}


function clearTransientCombat() {
  state.projectiles.forEach((projectile) => { if (scene && projectile.group) scene.remove(projectile.group); });
  state.projectiles.length = 0;
  state.effects.forEach((effect) => { if (scene && effect.group) scene.remove(effect.group); });
  state.effects.length = 0;
}

function handlePlayerDeath() {
  if (state.dead || !state.player) return;
  state.dead = true;
  state.respawnTimer = RESPAWN_DELAY;
  state.respawnDeadline = performance.now() + RESPAWN_DELAY * 1000;
  state.respawnReady = false;
  if (state.respawnTimeout) clearTimeout(state.respawnTimeout);
  state.respawnTimeout = setTimeout(() => {
    if (!state.dead) return;
    state.respawnTimer = 0;
    state.respawnReady = true;
    state.respawnTimeout = null;
    updateDeathUI();
  }, RESPAWN_DELAY * 1000);
  state.input.keys.clear();
  state.input.joyActive = false;
  state.input.pointerId = null;
  state.input.joyX = 0;
  state.input.joyY = 0;
  if (state.gathering && state.gathering.resource) state.gathering.resource.gathering = false;
  state.gathering = null;
  state.crafting = null;
  clearTransientCombat();
  state.player.moving = false;
  state.player.group.visible = true;
  state.player.play('death');
  uiText('death-title', state.player.spec.name + ' caiu');
  openModal('death-modal');
  const button = $('#respawn-button');
  if (button) button.disabled = true;
  updateDeathUI();
  saveGame();
}

function updateDeathUI() {
  const button = $('#respawn-button');
  const countdown = $('#death-countdown');
  const name = state.player?.spec?.name || 'Criatura';
  if (button) {
    button.disabled = !state.respawnReady;
    button.textContent = state.respawnReady ? 'VOLTAR À BASE' : 'AGUARDE ' + Math.ceil(state.respawnTimer) + 's';
  }
  if (countdown) countdown.textContent = state.respawnReady ? name + ' pode retornar com 65% do HP.' : 'Retorno disponível em ' + Math.ceil(state.respawnTimer) + 's.';
}

function updateDeathState(dt) {
  const deadline = Number(state.respawnDeadline) || 0;
  const remaining = deadline > 0
    ? Math.max(0, (deadline - performance.now()) / 1000)
    : Math.max(0, state.respawnTimer - dt);
  state.respawnTimer = remaining;
  if (!state.respawnReady && remaining <= 0) {
    state.respawnReady = true;
    if (state.respawnTimeout) {
      clearTimeout(state.respawnTimeout);
      state.respawnTimeout = null;
    }
    updateDeathUI();
  } else if (!state.respawnReady) {
    updateDeathUI();
  }
  if (state.player) {
    state.player.moving = false;
    state.player.update(dt);
  }
}

function respawn() {
  if (!state.dead || !state.respawnReady || !state.player) return;
  state.dead = false;
  state.respawnTimer = 0;
  state.respawnDeadline = 0;
  state.respawnReady = false;
  if (state.respawnTimeout) {
    clearTimeout(state.respawnTimeout);
    state.respawnTimeout = null;
  }
  state.player.dead = false;
  state.player.captured = false;
  state.player.group.visible = true;
  state.player.model.visible = true;
  state.player.model.position.set(0, 0, 0);
  state.player.model.rotation.set(0, 0, 0);
  if (state.player.assetModel) {
    state.player.assetModel.visible = true;
    state.player.assetModel.position.set(0, 0, 0);
    state.player.assetModel.rotation.set(0, Math.PI, 0);
  }
  state.player.action = 'idle';
  state.player.actionTime = 0;
  state.player.actionDuration = 0;
  state.player.group.position.set(0, 0, 12);
  syncPlayerStats(false);
  state.player.hp = Math.max(1, Math.round(state.player.maxHp * .65));
  state.hp = state.player.hp;
  syncActiveTeamSlot();
  state.hunger = Math.max(35, state.hunger);
  state.water = Math.max(35, state.water);
  state.energy = 100;
  Object.keys(state.cooldowns).forEach((key) => { state.cooldowns[key] = 0; });
  closeModal('death-modal');
  feed(state.player.spec.name + ' voltou à base. Prepare-se para a próxima expedição.');
  updateUI();
  saveGame();
}

class Creature {
  constructor(spec, role, x, z) {
    this.spec = spec;
    this.role = role;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.rotation.y = Math.PI;
    this.model = new THREE.Group();
    this.group.add(this.model);
    this.assetModel = null;
    this.assetClips = [];
    this.assetMixer = null;
    this.assetAction = null;
    this.assetActionName = '';
    this.parts = {};
    this.legs = [];
    this.arms = [];
    this.action = 'idle';
    this.actionTime = 0;
    this.actionDuration = 0;
    this.animClock = Math.random() * 5;
    this.moving = false;
    this.dead = false;
    this.captured = false;
    this.maxHp = spec.hp;
    this.hp = spec.hp;
    this.attackCooldown = .4 + Math.random();
    this.roamTime = 0;
    this.anchor = new THREE.Vector3(x, 0, z);
    this.target = new THREE.Vector3(x, 0, z);
    this.label = null;
    this.shadow = null;
    this.visualSprite = null;
    this.buildRig();
    scene.add(this.group);
    this.shadow = makeShadow(this.group, spec.radius * .8);
    const labelKind = role === 'player' ? 'player' : role === 'boss' ? 'boss' : 'wild';
    this.label = addLabel(spec.name, labelKind, this.group, role === 'boss' ? 'CHEFE' : 'HP ' + this.hp + '/' + this.maxHp);
    this.applyCreatureArtwork();
  }

  applyCreatureArtwork() {
    if (!creatureAtlasTexture || this.role === 'player') return;
    const crop = {
      glintling: [0, 0],
      mossclaw: [1, 0],
      embermite: [0, 1],
      gloomfin: [1, 1],
      ironroot: [1, 0]
    }[this.spec.rig] || [0, 0];
    if (!this.visualSprite) {
      const map = creatureAtlasTexture.clone();
      map.needsUpdate = true;
      map.repeat.set(.5, .5);
      map.offset.set(crop[0] * .5, (1 - crop[1]) * .5);
      map.colorSpace = THREE.SRGBColorSpace;
      this.visualSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, depthTest: true }));
      this.visualSprite.position.set(0, 1.25, .12);
      this.visualSprite.scale.set(2.35, 1.72, 1);
      this.group.add(this.visualSprite);
      this.model.visible = false;
    }
  }

  buildRig() {
    if (this.spec.rig === 'lumion') this.buildFox(false);
    else if (this.spec.rig === 'oriel') this.buildFox(true);
    else if (this.spec.rig === 'embermite') this.buildBeetle();
    else if (this.spec.rig === 'mossclaw') this.buildMossclaw();
    else if (this.spec.rig === 'gloomfin' || this.spec.rig === 'glintling') this.buildGloomfin();
    else this.buildIronroot();
  }

  buildFox(variant) {
    const bodyMat = material(this.spec.color, .66, .05, this.spec.color, .08);
    const lightMat = material(variant ? 0xd9d6ff : 0xd2f7ff, .6, .02);
    const accentMat = material(this.spec.accent, .35, .04, this.spec.accent, .42);
    this.parts.body = meshPart(this.model, smoothSphere(.92, 24, 16), bodyMat, 0, 1.03, 0, .86, .72, 1.16, 'body');
    meshPart(this.model, smoothSphere(.58, 18, 12), lightMat, 0, 1.34, .61, .92, .86, .56, 'chest');
    this.parts.head = meshPart(this.model, smoothSphere(.64, 22, 16), bodyMat, 0, 1.82, .46, 1.03, .94, .95, 'head');
    meshPart(this.model, smoothSphere(.31, 16, 10), lightMat, 0, 1.68, .98, 1.08, .8, .76, 'muzzle');
    const earL = meshPart(this.model, new THREE.ConeGeometry(.27, .82, 5), accentMat, -.39, 2.47, .42, 1, 1, 1, 'earL');
    const earR = meshPart(this.model, new THREE.ConeGeometry(.27, .82, 5), accentMat, .39, 2.47, .42, 1, 1, 1, 'earR');
    earL.rotation.z = -.14;
    earR.rotation.z = .14;
    const eyeMat = material(0x07131c, .3, .05, 0x07131c, .2);
    meshPart(this.model, smoothSphere(.085, 12, 8), eyeMat, -.23, 1.92, 1.04, 1, 1.25, .65, 'eyeL');
    meshPart(this.model, smoothSphere(.085, 12, 8), eyeMat, .23, 1.92, 1.04, 1, 1.25, .65, 'eyeR');
    const legMat = material(variant ? 0x4d4b9a : 0x1e6588, .76);
    [[-.45, .48], [.45, .48], [-.45, -.44], [.45, -.44]].forEach((pos, index) => {
      const leg = new THREE.Group();
      leg.position.set(pos[0], .72, pos[1]);
      this.model.add(leg);
      meshPart(leg, smoothSphere(.27, 14, 10), legMat, 0, -.28, 0, .75, 1.2, .82, 'leg');
      meshPart(leg, smoothSphere(.28, 14, 10), lightMat, 0, -.58, .15, .9, .45, 1.15, 'paw');
      this.legs.push(leg);
    });
    let tailParent = this.model;
    for (let i = 0; i < (variant ? 3 : 4); i += 1) {
      const tail = new THREE.Group();
      tail.position.set(0, 1.04 + i * .2, -.84 - i * .35);
      tailParent.add(tail);
      meshPart(tail, smoothSphere(.45 - i * .065, 16, 11), accentMat, 0, .12, -.13, 1, 1.25, 1.12, 'tail');
      tailParent = tail;
    }
    this.parts.aura = new THREE.Mesh(
      new THREE.TorusGeometry(1.03, .035, 8, 36),
      new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: .55 })
    );
    this.parts.aura.rotation.x = Math.PI / 2;
    this.parts.aura.position.y = .08;
    this.model.add(this.parts.aura);
    const glow = new THREE.PointLight(this.spec.accent, .7, 4.2);
    glow.position.y = 1.25;
    this.model.add(glow);
  }

  buildBeetle() {
    const shellMat = material(this.spec.color, .48, .14, 0x54160d, .28);
    const shellLight = material(this.spec.accent, .32, .16, 0x9e2d13, .5);
    const dark = material(0x1a1c22, .72);
    this.parts.body = meshPart(this.model, smoothSphere(.9, 24, 16), shellMat, 0, .82, 0, 1.1, .55, 1.2, 'shell');
    meshPart(this.model, smoothSphere(.66, 20, 14), shellLight, -.38, .92, -.08, .62, .48, 1.12, 'wingL');
    meshPart(this.model, smoothSphere(.66, 20, 14), shellLight, .38, .92, -.08, .62, .48, 1.12, 'wingR');
    meshPart(this.model, smoothSphere(.45, 16, 12), shellMat, 0, 1.02, .82, 1, .9, .9, 'head');
    const hornL = meshPart(this.model, new THREE.ConeGeometry(.11, .68, 7), shellLight, -.24, 1.35, 1.05, 1, 1, 1, 'hornL');
    const hornR = meshPart(this.model, new THREE.ConeGeometry(.11, .68, 7), shellLight, .24, 1.35, 1.05, 1, 1, 1, 'hornR');
    hornL.rotation.x = -.45;
    hornR.rotation.x = -.45;
    meshPart(this.model, smoothSphere(.08, 10, 8), material(0xffd37b, .35, 0, 0xffa033, 1.5), -.17, 1.08, 1.2);
    meshPart(this.model, smoothSphere(.08, 10, 8), material(0xffd37b, .35, 0, 0xffa033, 1.5), .17, 1.08, 1.2);
    for (let i = 0; i < 3; i += 1) {
      [-1, 1].forEach((side) => {
        const leg = new THREE.Group();
        leg.position.set(side * .65, .78, .5 - i * .48);
        leg.rotation.z = side * .48;
        this.model.add(leg);
        meshPart(leg, new THREE.CylinderGeometry(.075, .09, 1.02, 8), dark, side * .32, -.04, 0, 1, 1, 1);
        meshPart(leg, new THREE.SphereGeometry(.12, 10, 8), shellLight, side * .62, -.48, .06, 1, 1, 1);
        this.legs.push(leg);
      });
    }
    const aura = new THREE.Mesh(new THREE.TorusGeometry(1.1, .025, 6, 30), new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: .36 }));
    aura.rotation.x = Math.PI / 2;
    aura.position.y = .04;
    this.model.add(aura);
    this.parts.aura = aura;
  }

  buildMossclaw() {
    const bodyMat = material(this.spec.color, .9, 0, 0x102719, .18);
    const mossMat = material(this.spec.accent, .75, 0, 0x4b8b2b, .3);
    const dark = material(0x17352c, .85);
    this.parts.body = meshPart(this.model, smoothSphere(1.14, 24, 16), bodyMat, 0, 1.12, 0, 1.12, .98, 1.02, 'body');
    meshPart(this.model, smoothSphere(.76, 20, 14), bodyMat, 0, 1.94, .42, 1.0, .92, .88, 'head');
    meshPart(this.model, smoothSphere(.46, 16, 10), mossMat, 0, 1.78, 1.03, 1.1, .76, .75, 'muzzle');
    const hornL = meshPart(this.model, new THREE.ConeGeometry(.2, .75, 6), mossMat, -.48, 2.58, .35, 1, 1, 1, 'hornL');
    const hornR = meshPart(this.model, new THREE.ConeGeometry(.2, .75, 6), mossMat, .48, 2.58, .35, 1, 1, 1, 'hornR');
    hornL.rotation.z = -.28;
    hornR.rotation.z = .28;
    meshPart(this.model, smoothSphere(.12, 12, 8), material(0xe6ff94, .36, 0, 0xb5f64e, 1.4), -.28, 2.06, 1.18);
    meshPart(this.model, smoothSphere(.12, 12, 8), material(0xe6ff94, .36, 0, 0xb5f64e, 1.4), .28, 2.06, 1.18);
    [[-.68, .56], [.68, .56], [-.68, -.5], [.68, -.5]].forEach((pos) => {
      const leg = new THREE.Group();
      leg.position.set(pos[0], .8, pos[1]);
      this.model.add(leg);
      meshPart(leg, smoothSphere(.34, 16, 10), dark, 0, -.38, 0, 1, 1.28, 1, 'leg');
      const claw = meshPart(leg, new THREE.ConeGeometry(.22, .54, 5), mossMat, 0, -.9, .12, 1, 1, 1, 'claw');
      claw.rotation.x = Math.PI;
      this.legs.push(leg);
    });
    const vines = new THREE.Mesh(new THREE.TorusGeometry(1.24, .07, 8, 36), new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: .45 }));
    vines.rotation.x = Math.PI / 2;
    vines.position.y = .25;
    this.model.add(vines);
    this.parts.aura = vines;
  }

  buildGloomfin() {
    const bodyMat = material(this.spec.color, .52, .12, 0x120c42, .7);
    const accentMat = material(this.spec.accent, .35, .08, this.spec.accent, .55);
    const dark = material(0x110b2c, .64);
    this.parts.body = meshPart(this.model, smoothSphere(.86, 24, 16), bodyMat, 0, 1.25, 0, 1.28, .58, 1.12, 'body');
    const finL = meshPart(this.model, new THREE.ConeGeometry(.54, 1.35, 5), accentMat, -.92, 1.32, .12, 1, 1, 1, 'finL');
    const finR = meshPart(this.model, new THREE.ConeGeometry(.54, 1.35, 5), accentMat, .92, 1.32, .12, 1, 1, 1, 'finR');
    finL.rotation.z = -Math.PI / 2;
    finR.rotation.z = Math.PI / 2;
    meshPart(this.model, new THREE.SphereGeometry(.37, 16, 10), accentMat, 0, 1.3, .93, 1, .8, .7, 'face');
    meshPart(this.model, smoothSphere(.085, 10, 8), material(0xf0dcff, .3, 0, 0xd794ff, 1.5), -.21, 1.4, 1.24);
    meshPart(this.model, smoothSphere(.085, 10, 8), material(0xf0dcff, .3, 0, 0xd794ff, 1.5), .21, 1.4, 1.24);
    const tail = new THREE.Group();
    tail.position.set(0, 1.18, -.96);
    this.model.add(tail);
    meshPart(tail, smoothSphere(.38, 16, 10), dark, 0, 0, -.22, 1.1, .7, 1.6);
    meshPart(tail, new THREE.ConeGeometry(.25, .9, 5), accentMat, 0, .02, -.9, 1, 1, 1);
    const aura = new THREE.Mesh(new THREE.TorusGeometry(1.18, .035, 8, 38), new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: .5 }));
    aura.rotation.x = Math.PI / 2;
    aura.position.y = .22;
    this.model.add(aura);
    this.parts.aura = aura;
    this.parts.finL = finL;
    this.parts.finR = finR;
  }

  buildIronroot() {
    const bodyMat = material(this.spec.color, .84, .16, 0x071f21, .48);
    const accentMat = material(this.spec.accent, .25, .2, this.spec.accent, 1.1);
    const rootMat = material(0x5b3d2b, .95);
    this.parts.body = meshPart(this.model, new THREE.DodecahedronGeometry(1.35, 1), bodyMat, 0, 1.68, 0, 1.16, 1.35, .9, 'core-body');
    meshPart(this.model, smoothSphere(.48, 18, 12), accentMat, 0, 1.72, 1.12, 1, 1, .7, 'core');
    meshPart(this.model, new THREE.CylinderGeometry(.45, .6, 1.1, 8), bodyMat, 0, 3.05, .05, 1, 1, 1, 'head');
    const crown = [-.65, 0, .65];
    crown.forEach((x, index) => {
      const spike = meshPart(this.model, new THREE.ConeGeometry(.22, 1.0, 5), accentMat, x, 3.9, .05, 1, 1, 1, 'crown-' + index);
      spike.rotation.z = x * .2;
    });
    [-1, 1].forEach((side) => {
      const shoulder = meshPart(this.model, smoothSphere(.54, 18, 12), bodyMat, side * 1.45, 2.32, 0, 1, 1, 1, 'shoulder');
      const arm = new THREE.Group();
      arm.position.set(side * 1.58, 1.95, .1);
      this.model.add(arm);
      meshPart(arm, new THREE.CylinderGeometry(.27, .34, 1.55, 10), bodyMat, 0, -.72, 0, 1, 1, 1, 'arm');
      meshPart(arm, new THREE.DodecahedronGeometry(.45, 1), rootMat, 0, -1.55, .1, 1, 1, 1, 'fist');
      arm.rotation.z = side * .12;
      this.arms.push(arm);
      shoulder.castShadow = true;
    });
    [-1, 1].forEach((side) => {
      const root = new THREE.Group();
      root.position.set(side * .7, .58, 0);
      this.model.add(root);
      meshPart(root, new THREE.CylinderGeometry(.28, .4, 1.5, 8), rootMat, 0, -.6, 0, 1, 1, 1, 'root');
      meshPart(root, new THREE.ConeGeometry(.35, .8, 6), rootMat, side * .18, -1.45, .1, 1, 1, 1, 'root-tip');
      this.legs.push(root);
    });
    const aura = new THREE.Mesh(new THREE.TorusGeometry(1.75, .045, 8, 42), new THREE.MeshBasicMaterial({ color: this.spec.accent, transparent: true, opacity: .62 }));
    aura.rotation.x = Math.PI / 2;
    aura.position.y = .18;
    this.model.add(aura);
    this.parts.aura = aura;
    const glow = new THREE.PointLight(this.spec.accent, 1.5, 8);
    glow.position.set(0, 2, 1);
    this.model.add(glow);
  }

  playExternalAnimation(action) {
    if (!this.assetMixer || !this.assetClips.length) return;
    const clip = animationClipFor(this.assetClips, action);
    if (!clip) return;
    if (this.assetActionName === action && this.assetAction && this.assetAction.isRunning()) return;
    if (this.assetAction) this.assetAction.fadeOut(.12);
    const nextAction = this.assetMixer.clipAction(clip);
    nextAction.reset().fadeIn(.12);
    const looping = action === 'idle' || action === 'walk';
    nextAction.setLoop(looping ? THREE.LoopRepeat : THREE.LoopOnce, looping ? Infinity : 1);
    nextAction.clampWhenFinished = !looping;
    nextAction.play();
    this.assetAction = nextAction;
    this.assetActionName = action;
  }

  play(action) {
    if (this.dead && action !== 'death') return;
    this.action = action;
    this.actionTime = 0;
    this.actionDuration = action === 'attack' ? .42 : action === 'cast' ? .7 : action === 'hit' ? .22 : action === 'dodge' ? .42 : action === 'death' ? .8 : 0;
    this.playExternalAnimation(action);
  }

  update(dt) {
    this.attackCooldown -= dt;
    if (this.assetMixer) this.assetMixer.update(dt);
    this.animClock += dt * (this.moving ? 8.5 : 3.2);
    if (this.actionDuration > 0) {
      this.actionTime += dt;
      if (this.actionTime >= this.actionDuration) {
        if (this.action === 'death') this.group.visible = false;
        else this.action = 'idle';
      }
    }
    const movingBob = this.moving ? Math.abs(Math.sin(this.animClock)) * .075 : Math.sin(this.animClock) * .035;
    const visualModel = this.assetModel || this.model;
    if (this.visualSprite) {
      this.visualSprite.visible = this.group.visible && !this.dead;
      this.visualSprite.position.y = 1.25 + movingBob;
      this.visualSprite.scale.set(2.35 * (this.moving ? 1.03 : 1), 1.72 * (this.moving ? 1.03 : 1), 1);
    }
    if (this.assetModel && (this.action === 'idle' || this.action === 'walk')) this.playExternalAnimation(this.moving ? 'walk' : 'idle');
    visualModel.position.y = movingBob;
    const stride = Math.sin(this.animClock) * (this.moving ? .48 : .06);
    this.legs.forEach((leg, index) => {
      if (this.spec.rig === 'embermite') leg.rotation.z = (index % 2 ? -1 : 1) * stride * .55;
      else leg.rotation.x = (index % 2 ? -1 : 1) * stride;
    });
    this.arms.forEach((arm, index) => {
      arm.rotation.x = this.action === 'attack' ? -1.0 + Math.sin(this.actionTime * 30) * .35 : Math.sin(this.animClock + index) * (this.moving ? .13 : .035);
    });
    if (this.parts.aura) {
      this.parts.aura.rotation.z += dt * (this.moving ? 1.4 : .45);
      this.parts.aura.scale.setScalar(1 + Math.sin(this.animClock * .7) * .035);
    }
    if (this.parts.finL) {
      this.parts.finL.rotation.y = Math.sin(this.animClock * .7) * .18;
      this.parts.finR.rotation.y = -Math.sin(this.animClock * .7) * .18;
    }
    if (this.action === 'attack') {
      visualModel.rotation.x = Math.sin(clamp(this.actionTime / Math.max(.01, this.actionDuration), 0, 1) * Math.PI) * -.12;
    } else {
      visualModel.rotation.x *= .86;
    }
    if (this.dead && this.group.visible) {
      const fall = clamp(this.actionTime / .8, 0, 1);
      visualModel.rotation.z = fall * (this.role === 'boss' ? -.25 : -.5);
      visualModel.position.y = -fall * .3;
    }
    if (this.label) {
      this.label.sub.textContent = this.role === 'boss' ? 'CHEFE • HP ' + Math.max(0, Math.ceil(this.hp)) : 'HP ' + Math.max(0, Math.ceil(this.hp)) + '/' + this.maxHp;
      this.label.visible = this.group.visible && !this.captured;
    }
  }

  move(dir, speed, dt) {
    if (this.dead || !this.group.visible) return;
    const len = dir.length();
    if (len < .001) {
      this.moving = false;
      return;
    }
    this.moving = true;
    tempA.copy(dir).normalize();
    this.group.position.addScaledVector(tempA, speed * dt);
    this.group.position.x = clamp(this.group.position.x, WORLD.minX, WORLD.maxX);
    this.group.position.z = clamp(this.group.position.z, WORLD.minZ, WORLD.maxZ);
    if (this !== state.player) resolveAgainstColliders(this.group.position, this.spec.radius * .45);
    this.group.rotation.y = Math.atan2(tempA.x, tempA.z);
  }

  takeDamage(amount, source) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.play('hit');
    floatingText(this.group.position.clone().add(new THREE.Vector3(0, 2.5, 0)), '-' + Math.round(amount), source === 'player' ? '#ffe17a' : '#ff83ad');
    if (this.hp <= 0) {
      this.dead = true;
      this.moving = false;
      this.play('death');
      if (this.role === 'player') handlePlayerDeath();
      else if (this.role === 'wild' || this.role === 'boss') onCreatureDefeated(this);
    }
  }

  dispose() {
    if (this.label) { this.label.visible = false; this.label.element.remove(); }
    scene.remove(this.group);
  }
}


function createCreatures() {
  const spawnList = [
    ['embermite', -16, -1, 'clareira-aurora'], ['glintling', -37, -10, 'clareira-aurora'], ['glintling', -22, -18, 'clareira-aurora'],
    ['mossclaw', 18, -7, 'brejo-ecos'], ['gloomfin', 29, -27, 'brejo-ecos'], ['gloomfin', 35, -15, 'brejo-ecos'],
    ['glintling', -37, 17, 'bosque-bravio'], ['embermite', -51, 33, 'bosque-bravio'], ['mossclaw', -42, 38, 'bosque-bravio'],
    ['embermite', 48, 4, 'costa-turquesa'], ['gloomfin', 73, -37, 'costa-turquesa'], ['gloomfin', 57, -44, 'costa-turquesa'],
    ['mossclaw', 65, 13, 'ruinas-incandescentes'], ['embermite', 38, 43, 'ruinas-incandescentes'], ['ironroot', 73, 43, 'ruinas-incandescentes'],
    ['gloomfin', 96, -43, 'costa-aurora-praia'], ['glintling', 112, -52, 'costa-aurora-praia'], ['mossclaw', 126, -39, 'costa-aurora-praia'],
    ['gloomfin', 139, -11, 'costa-aurora-recife'], ['embermite', 121, -3, 'costa-aurora-recife'], ['glintling', 145, 2, 'costa-aurora-recife'],
    ['embermite', 98, 35, 'costa-aurora-penhasco'], ['mossclaw', 116, 45, 'costa-aurora-penhasco'], ['gloomfin', 133, 31, 'costa-aurora-penhasco'],
    ['gloomfin', 137, 48, 'costa-aurora-ruinas'], ['embermite', 153, 36, 'costa-aurora-ruinas'], ['ironroot', 157, 54, 'costa-aurora-ruinas']
  ];
  state.player = createTeamPlayer(state.activeTeamIndex, Number(saved.x) || 0, Number(saved.z) || 12, Math.PI);
  state.hp = state.player.hp;
  spawnList.forEach((entry) => {
    const creature = new Creature(SPECIES[entry[0]], entry[0] === 'ironroot' ? 'boss' : 'wild', entry[1], entry[2]);
    creature.zoneId = entry[3] || 'vila-iris';
    if (creature.label && creature.role !== 'boss') creature.label.sub.textContent = 'Lv.' + (creature.zoneId === 'clareira-aurora' ? '1–3' : creature.zoneId === 'bosque-bravio' ? '3–6' : '2–7') + ' • HP ' + creature.hp + '/' + creature.maxHp;
    creature.anchor.copy(creature.group.position);
    state.wild.push(creature);
  });
}
function restoreStructures() {
  (saved.structures || []).forEach((entry) => {
    if (!BUILD_DATA[entry.type]) return;
    createStructure(entry.type, entry.x, entry.z, entry.rotation || 0, true);
  });
}

function createStructure(type, x, z, rotation, silent) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotation || 0;
  const wood = material(0x93603b, .86);
  const stone = material(0x71878a, .9);
  const gold = material(0xffcc62, .3, .1, 0xff8a32, .9);
  if (type === 'core') {
    meshPart(group, new THREE.CylinderGeometry(1.45, 1.65, .3, 8), stone, 0, .15, 0);
    meshPart(group, new THREE.OctahedronGeometry(.68, 1), gold, 0, 1.05, 0);
    const ring = meshPart(group, new THREE.TorusGeometry(1.1, .035, 8, 32), gold, 0, .42, 0);
    ring.rotation.x = Math.PI / 2;
    const light = new THREE.PointLight(0xffb75d, 1.25, 8);
    light.position.y = 1.1;
    group.add(light);
    colliders.push({ x, z, radius: 1.2 });
  } else if (type === 'floor') {
    meshPart(group, new THREE.BoxGeometry(3.8, .22, 3.8), wood, 0, .12, 0);
    const strip = meshPart(group, new THREE.BoxGeometry(3.45, .04, .12), stone, 0, .26, 0);
    strip.rotation.y = Math.PI / 2;
  } else if (type === 'wall') {
    meshPart(group, new THREE.BoxGeometry(3.8, 2.3, .35), wood, 0, 1.15, 0);
    meshPart(group, new THREE.BoxGeometry(3.95, .18, .5), stone, 0, 2.3, 0);
    colliders.push({ x, z, radius: 1.8 });
  } else if (type === 'workbench') {
    meshPart(group, new THREE.BoxGeometry(2.2, .3, 1.1), wood, 0, 1.18, 0);
    [-.82, .82].forEach((side) => meshPart(group, new THREE.BoxGeometry(.18, 1.1, .18), stone, side, .56, -.35));
    meshPart(group, new THREE.BoxGeometry(.22, .45, .65), gold, .2, 1.52, 0);
  } else if (type === 'chest') {
    meshPart(group, new THREE.BoxGeometry(1.5, .9, 1.05), wood, 0, .5, 0);
    meshPart(group, new THREE.BoxGeometry(1.55, .18, 1.1), gold, 0, .98, 0);
    meshPart(group, new THREE.BoxGeometry(.18, .3, .12), stone, 0, .83, .56);
  } else if (type === 'campfire') {
    meshPart(group, new THREE.CylinderGeometry(.78, .92, .22, 10), stone, 0, .11, 0);
    const flame = meshPart(group, new THREE.IcosahedronGeometry(.48, 1), gold, 0, .72, 0, .7, 1.35, .7);
    flame.name = 'flame';
    const light = new THREE.PointLight(0xff7a36, 2.1, 8);
    light.position.y = 1.1;
    group.add(light);
  }
  group.traverse((object) => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
  scene.add(group);
  const structure = { id: 'structure-' + structureId++, type, x, z, rotation: rotation || 0, group };
  state.structures.push(structure);
  if (!silent) {
    feed(BUILD_DATA[type].name + ' construído.');
    state.objective = state.structures.some((item) => item.type === 'core') ? 'Explore a fronteira e capture um monstrinho enfraquecido.' : 'Construa um Núcleo de Base.';
    saveGame();
  }
  return structure;
}

function resolveAgainstColliders(position, radius) {
  colliders.forEach((obstacle) => {
    const dx = position.x - obstacle.x;
    const dz = position.z - obstacle.z;
    const d = Math.hypot(dx, dz);
    const limit = (obstacle.radius || 1) + radius;
    if (d > .001 && d < limit) {
      position.x = obstacle.x + dx / d * limit;
      position.z = obstacle.z + dz / d * limit;
    }
  });
}

const colliders = [];

function moveInput() {
  const keys = state.input.keys;
  const horizontal = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  const forwardKey = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  const horizontalValue = state.input.joyActive ? state.input.joyX : horizontal;
  const forwardValue = state.input.joyActive ? -state.input.joyY : forwardKey;
  const forward = new THREE.Vector3(-Math.sin(state.camera.yaw), 0, -Math.cos(state.camera.yaw));
  const right = new THREE.Vector3(Math.cos(state.camera.yaw), 0, -Math.sin(state.camera.yaw));
  const result = new THREE.Vector3();
  result.addScaledVector(right, horizontalValue);
  result.addScaledVector(forward, forwardValue);
  if (result.lengthSq() > 1) result.normalize();
  return result;
}


function updatePlayer(dt) {
  if (!canAct()) return;
  const direction = moveInput();
  const running = state.input.keys.has('ShiftLeft') || state.input.keys.has('ShiftRight');
  const baseSpeed = playerMoveSpeed();
  const speed = running && state.energy > 2 ? baseSpeed * 1.39 : baseSpeed;
  if (direction.lengthSq() > 0) {
    state.player.move(direction, speed, dt);
    resolveAgainstColliders(state.player.group.position, .46);
    state.energy = clamp(state.energy - (running ? 2.2 : .45) * dt, 0, 100);
  } else {
    state.player.moving = false;
    state.energy = clamp(state.energy + 2.2 * dt, 0, 100);
  }
  state.hp = state.player.hp;
}

function updateWild(wild, dt) {
  if (wild.dead || !wild.group.visible) return;
  wild.roamTime -= dt;
  wild.attackCooldown -= dt;
  const playerDistance = distance2D(wild.group.position, state.player.group.position);
  if (playerDistance < (wild.role === 'boss' ? 15 : 10.5)) {
    const dir = tempA.subVectors(state.player.group.position, wild.group.position);
    if (playerDistance > (wild.spec.radius + 1.35)) {
      wild.move(dir, wild.spec.speed, dt);
    } else if (wild.attackCooldown <= 0) {
      wild.group.rotation.y = Math.atan2(dir.x, dir.z);
      wild.play('attack');
      spawnProjectile(wild, '#ff557d', 13, wild.spec.attack, dir);
      wild.attackCooldown = wild.role === 'boss' ? 1.35 : 1.75 + Math.random() * .8;
    } else {
      wild.moving = false;
    }
    return;
  }
  if (wild.roamTime <= 0 || distance2D(wild.group.position, wild.target) < 1.1) {
    wild.roamTime = 2.5 + Math.random() * 4;
    wild.target.set(
      clamp(wild.anchor.x + (Math.random() - .5) * 16, WORLD.minX + 4, WORLD.maxX - 4),
      0,
      clamp(wild.anchor.z + (Math.random() - .5) * 16, WORLD.minZ + 4, WORLD.maxZ - 4)
    );
  }
  const roamDir = tempA.subVectors(wild.target, wild.group.position);
  if (roamDir.length() > .9) wild.move(roamDir, wild.spec.speed * .48, dt);
  else wild.moving = false;
}

function nearestWild(maxDistance) {
  let best = null;
  let bestDistance = maxDistance || Infinity;
  state.wild.forEach((wild) => {
    if (wild.dead || wild.captured || !wild.group.visible) return;
    const d = distance2D(wild.group.position, state.player.group.position);
    if (d < bestDistance) {
      best = wild;
      bestDistance = d;
    }
  });
  return best;
}

function spawnProjectile(owner, color, speed, damage, direction, options) {
  const isPlayer = owner === state.player;
  const start = owner.group.position.clone().add(new THREE.Vector3(0, owner.role === 'boss' ? 2 : 1.25, 0));
  const dir = direction.clone();
  dir.y = 0;
  if (dir.lengthSq() < .01) dir.set(0, 0, 1).applyQuaternion(owner.group.quaternion);
  dir.normalize();
  const group = new THREE.Group();
  const boltMat = material(new THREE.Color(color), .28, .22, new THREE.Color(color), .65);
  const shaft = meshPart(group, new THREE.CylinderGeometry(.075, .14, 1.28, 8), boltMat, 0, 0, .38);
  shaft.rotation.x = Math.PI / 2;
  const tip = meshPart(group, new THREE.ConeGeometry(.18, .5, 6), boltMat, 0, 0, 1.18);
  tip.rotation.x = Math.PI / 2;
  const tail = meshPart(group, new THREE.ConeGeometry(.1, .45, 6), boltMat, 0, 0, -.36);
  tail.rotation.x = -Math.PI / 2;
  const trail = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -.75), new THREE.Vector3(0, 0, .05)]),
    new THREE.LineBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: .46 })
  );
  group.add(trail);
  group.position.copy(start);
  group.quaternion.setFromUnitVectors(originForward, dir);
  scene.add(group);
  state.projectiles.push({
    group, owner, dir, speed, damage, life: options && options.life ? options.life : 1.5,
    radius: options && options.radius ? options.radius : .55, playerOwned: isPlayer, color
  });
}

function updateProjectiles(dt) {
  if (state.dead) return;
  for (let i = state.projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = state.projectiles[i];
    projectile.life -= dt;
    projectile.group.position.addScaledVector(projectile.dir, projectile.speed * dt);
    let hit = projectile.life <= 0;
    if (!hit && projectile.playerOwned) {
      for (let j = 0; j < state.wild.length; j += 1) {
        const target = state.wild[j];
        if (target.dead || target.captured || !target.group.visible) continue;
        if (distance2D(projectile.group.position, target.group.position) < target.spec.radius + projectile.radius) {
          target.takeDamage(projectile.damage, 'player');
          burstEffect(projectile.group.position, projectile.color);
          hit = true;
          break;
        }
      }
    } else if (!hit && !projectile.playerOwned && distance2D(projectile.group.position, state.player.group.position) < 1.1) {
      state.player.takeDamage(projectile.damage, 'enemy');
      state.hp = state.player.hp;
      burstEffect(projectile.group.position, projectile.color);
      hit = true;
    }
    if (hit) {
      scene.remove(projectile.group);
      state.projectiles.splice(i, 1);
    }
  }
}


function basicAttack() {
  if (!canAct() || state.cooldowns.attack > 0) return;
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(state.player.group.quaternion);
  state.player.play('attack');
  const shotColor = '#' + new THREE.Color(state.player.spec.accent || 0x6ceeff).getHexString();
  spawnProjectile(state.player, shotColor, 19 * (1 + attributeLevel('agility') * .018), combatDamage((Number(state.player.spec.attack) || 35) + state.level * 2, 'attack'), direction, { radius: .62, life: 1.1 });
  state.cooldowns.attack = Math.max(.18, .28 - attributeLevel('agility') * .008);
}

function pulseAttack() {
  if (!canAct() || state.cooldowns.pulse > 0) return;
  state.player.play('cast');
  const center = state.player.group.position.clone();
  const radius = 4.8 * (1 + Math.max(0, skillLevel('pulse') - 1) * .08);
  addRingEffect(center, radius, '#76eaff', 1.0);
  state.wild.forEach((wild) => {
    if (!wild.dead && distance2D(center, wild.group.position) < radius + .4) wild.takeDamage(combatDamage(48 + state.level * 3, 'pulse'), 'player');
  });
  state.cooldowns.pulse = 3.2;
}

function voidAttack() {
  if (!canAct() || state.cooldowns.void > 0) return;
  state.player.play('cast');
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(state.player.group.quaternion);
  const center = state.player.group.position.clone().addScaledVector(direction, 5 + Math.max(0, skillLevel('void') - 1) * .55);
  addVoidEffect(center);
  state.cooldowns.void = 6;
}

function prismAttack() {
  if (!canAct() || state.cooldowns.prism > 0) return;
  state.player.play('cast');
  const base = new THREE.Vector3(0, 0, 1).applyQuaternion(state.player.group.quaternion);
  const count = 4 + skillLevel('prism');
  Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * .17).forEach((angle) => {
    const direction = base.clone().applyAxisAngle(UP, angle);
    spawnProjectile(state.player, '#b9a0ff', 16, combatDamage(28 + state.level * 2, 'prism'), direction, { radius: .48, life: 1.25 });
  });
  state.cooldowns.prism = 4.4;
}

function dodge() {
  if (!canAct() || state.cooldowns.dodge > 0) return;
  const direction = moveInput();
  if (direction.lengthSq() < .01) direction.set(0, 0, 1).applyQuaternion(state.player.group.quaternion);
  state.player.play('dodge');
  state.player.group.position.addScaledVector(direction.normalize(), 3.2 * (1 + attributeLevel('agility') * .05));
  state.player.group.position.x = clamp(state.player.group.position.x, WORLD.minX, WORLD.maxX);
  state.player.group.position.z = clamp(state.player.group.position.z, WORLD.minZ, WORLD.maxZ);
  state.cooldowns.dodge = Math.max(.72, 1.25 - attributeLevel('agility') * .055);
}
function addRingEffect(center, radius, color, life) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.4, .56, 48),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: .92, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(center.x, .09, center.z);
  scene.add(ring);
  state.effects.push({
    group: ring, life, maxLife: life,
    update: (effect, dt) => {
      effect.life -= dt;
      const progress = 1 - effect.life / effect.maxLife;
      effect.group.scale.setScalar(.6 + progress * (radius / .5));
      effect.group.material.opacity = (1 - progress) * .8;
    }
  });
}

function addVoidEffect(center) {
  const group = new THREE.Group();
  group.position.set(center.x, 1.1, center.z);
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(.65, 24, 16),
    new THREE.MeshStandardMaterial({ color: 0x080511, roughness: .28, metalness: .55, emissive: 0x4014a3, emissiveIntensity: 1.8 })
  );
  group.add(core);
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.0 + i * .28, .035, 8, 32),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x5dceff : 0xd36dff, transparent: true, opacity: .72, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = i * .6;
    group.add(ring);
  }
  const light = new THREE.PointLight(0x713dff, 2.2, 8);
  group.add(light);
  scene.add(group);
  state.effects.push({
    group, life: 2.2, maxLife: 2.2, tick: 0, nextHit: .22,
    update: (effect, dt) => {
      effect.life -= dt;
      effect.tick += dt;
      effect.group.rotation.y += dt * 2.4;
      effect.group.scale.setScalar(1 + Math.sin(effect.tick * 8) * .08);
      if (effect.tick >= effect.nextHit) {
        state.wild.forEach((wild) => {
          if (!wild.dead && distance2D(effect.group.position, wild.group.position) < 7.2) wild.takeDamage(24, 'player');
        });
        effect.nextHit += .34;
      }
    }
  });
}

function burstEffect(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);
  for (let i = 0; i < 8; i += 1) {
    const shard = meshPart(group, new THREE.OctahedronGeometry(.08, 0), material(new THREE.Color(color), .3, 0, new THREE.Color(color), 1.2), 0, 0, 0);
    shard.userData.velocity = new THREE.Vector3((Math.random() - .5) * 3, .5 + Math.random() * 2.5, (Math.random() - .5) * 3);
  }
  scene.add(group);
  state.effects.push({
    group, life: .42, maxLife: .42,
    update: (effect, dt) => {
      effect.life -= dt;
      effect.group.children.forEach((child) => {
        if (child.userData.velocity) {
          child.position.addScaledVector(child.userData.velocity, dt);
          child.userData.velocity.y -= 3.5 * dt;
        }
        child.scale.setScalar(clamp(effect.life / effect.maxLife, 0, 1));
      });
    }
  });
}

function updateEffects(dt) {
  for (let i = state.effects.length - 1; i >= 0; i -= 1) {
    const effect = state.effects[i];
    effect.update(effect, dt);
    if (effect.life <= 0) {
      scene.remove(effect.group);
      state.effects.splice(i, 1);
    }
  }
}

function onCreatureDefeated(creature) {
  if (creature.role === 'boss') {
    feed('Ironroot caiu. A ruína antiga está aberta.');
    state.objective = 'Volte até Nara para descobrir o próximo caminho.';
    advanceQuest('passagem-iris', 1);
  } else {
    addXp(creature.spec.xp);
    feed(creature.spec.name + ' derrotado. +' + creature.spec.xp + ' XP.');
    if (state.objective.indexOf('capture') >= 0) state.objective = 'Fale com Bram e prepare sua primeira construção.';
  }
}


function addXp(amount) {
  state.xp += amount;
  let required = 100 + state.level * 45;
  while (state.xp >= required) {
    state.xp -= required;
    state.level += 1;
    state.attributePoints += 1;
    state.skillPoints += 1;
    syncPlayerStats(true);
    floatingText(state.player.group.position.clone().add(new THREE.Vector3(0, 3, 0)), 'NÍVEL ' + state.level, '#ffe27c');
    feed('Nível ' + state.level + ': +1 ponto de atributo e +1 ponto de técnica.');
  }
}
function nearestResource(maxDistance) {
  let best = null;
  let bestDistance = maxDistance || Infinity;
  state.resources.forEach((resource) => {
    if (resource.collected || resource.gathering || !resource.group.visible) return;
    const d = distance2D(resource.group.position, state.player.group.position);
    if (d < bestDistance) {
      best = resource;
      bestDistance = d;
    }
  });
  return best;
}

function nearestNpc(maxDistance) {
  let best = null;
  let bestDistance = maxDistance || Infinity;
  state.npcs.forEach((npc) => {
    const d = distance2D(npc.group.position, state.player.group.position);
    if (d < bestDistance) {
      best = npc;
      bestDistance = d;
    }
  });
  return best;
}

function updateInteractHint() {
  const npc = nearestNpc(3.5);
  const resource = nearestResource(3.0);
  if (npc && (!resource || distance2D(npc.group.position, state.player.group.position) < distance2D(resource.group.position, state.player.group.position))) {
    $('#interact-label').textContent = 'FALAR: ' + npc.name.toUpperCase();
  } else if (resource) {
    $('#interact-label').textContent = 'COLETAR: ' + resource.data.label.toUpperCase();
  } else {
    $('#interact-label').textContent = 'E • INTERAGIR';
  }
}

function interact() {
  if (!canAct()) return;
  const npc = nearestNpc(3.5);
  const resource = nearestResource(3.0);
  if (npc && (!resource || distance2D(npc.group.position, state.player.group.position) < distance2D(resource.group.position, state.player.group.position))) {
    openDialogue(npc);
    return;
  }
  if (resource) {
    collectResource(resource);
    return;
  }
  feed('Nada interativo por perto.');
}


function collectResource(resource) {
  if (!canAct() || !resource || resource.collected || resource.gathering) return;
  const amountWeight = Object.entries(resource.data.amount).reduce((total, entry) => total + entry[1] * (ITEM_WEIGHTS[entry[0]] || 0), 0);
  if (inventoryWeight() + amountWeight > carryCapacity()) {
    feed('Mochila cheia. Aumente CARGA ou fabrique/guarde itens.');
    return;
  }
  const duration = gatherDuration();
  resource.gathering = true;
  state.gathering = { resource, remaining: duration };
  state.player.play('attack');
  feed('Coletando ' + resource.data.label + '… ' + duration.toFixed(1) + 's');
}
function completeGathering(task) {
  const resource = task.resource;
  resource.gathering = false;
  resource.collected = true;
  resource.group.visible = false;
  resource.respawn = 35;
  Object.keys(resource.data.amount).forEach((key) => {
    state.inventory[key] = (state.inventory[key] || 0) + resource.data.amount[key];
  });
  const amount = Object.values(resource.data.amount)[0];
  feed(resource.data.icon + ' +' + amount + ' ' + resource.data.label + '.');
  if (resource.kind === 'aurora' || resource.kind === 'spore') feed('Ingrediente raro registrado no caderno de Ivo.');
  if (resource.kind === 'tree' || resource.kind === 'rock' || resource.kind === 'fiber') advanceQuest('materiais-base', 1);
  if (state.inventory.wood >= 20 && state.inventory.stone >= 12 && !state.structures.some((item) => item.type === 'core')) {
    state.objective = 'Abra CONSTRUIR e coloque o Núcleo no terreno.';
  }
  state.gathering = null;
  saveGame();
}

function updateResources(dt) {
  if (state.gathering) {
    const task = state.gathering;
    if (!task.resource || task.resource.collected || distance2D(task.resource.group.position, state.player.group.position) > 3.8) {
      if (task.resource) task.resource.gathering = false;
      state.gathering = null;
      feed('Coleta cancelada: fique perto do recurso.');
    } else {
      task.remaining -= dt;
      if (task.remaining <= 0) completeGathering(task);
    }
  }
  state.resources.forEach((resource) => {
    if (resource.collected) {
      resource.respawn -= dt;
      if (resource.respawn <= 0) {
        resource.collected = false;
        resource.group.visible = true;
      }
    } else {
      resource.group.rotation.y += dt * .18;
      if (resource.kind === 'crystal') resource.group.position.y = .08 + Math.sin(performance.now() * .002 + resource.id.length) * .04;
    }
  });
}
function openDialogue(npc) {
  if (state.dialogue && state.dialogue.npc === npc) {
    state.dialogue.index += 1;
  } else {
    state.dialogue = { npc, index: 0 };
  }
  if (state.dialogue.index >= npc.lines.length) {
    closeModal('dialogue');
    state.dialogue = null;
    if (npc.id === 'nara') {
      state.objective = state.structures.some((item) => item.type === 'core') ? 'Explore a fronteira e capture um monstrinho enfraquecido.' : 'Colete materiais e construa um Núcleo de Base.';
    }
    return;
  }
  $('#dialogue-name').textContent = npc.name + ' • ' + npc.role;
  $('#dialogue-text').textContent = npc.lines[state.dialogue.index];
  openModal('dialogue');
  if (npc.id === 'nara') state.objective = 'Colete madeira e pedra para o Núcleo de Base.';
  if (npc.id === 'nara') advanceQuest('mapa-vivo', 1);
  if (npc.id === 'bram' && state.structures.some((item) => item.type === 'core')) advanceQuest('materiais-base', 1);
  if (npc.id === 'yara') state.objective = 'Vá até a Clareira Aurora e capture um monstrinho enfraquecido.';
  if (npc.id === 'ivo') state.objective = 'Colete folhas aurora e esporos no vale para fabricar um Tônico Aurora.';
  if (npc.id === 'vesper') state.objective = 'Descubra três áreas de caça do Vale Verde.';
  if (npc.id === 'cael') state.objective = 'Prepare o Sinal para além do vale: Núcleo + Ironroot.';
}

function eat() {
  if (!canAct()) return;
  if (state.inventory.food <= 0) {
    feed('Você não tem refeições.');
    return;
  }
  state.inventory.food -= 1;
  state.hunger = clamp(state.hunger + 28, 0, 100);
  state.water = clamp(state.water + 8, 0, 100);
  state.energy = clamp(state.energy + 18, 0, 100);
  feed('Refeição consumida. Fome e energia recuperadas.');
  saveGame();
}

function showBuild() {
  if (!canAct()) return;
  openModal('build-modal');
}

function placeBuild(type) {
  if (!canAct()) return;
  const data = BUILD_DATA[type];
  if (!data) return;
  const missing = Object.keys(data.cost).find((key) => (state.inventory[key] || 0) < data.cost[key]);
  if (missing) {
    feed('Faltam materiais para ' + data.name + '.');
    return;
  }
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(state.player.group.quaternion);
  const position = state.player.group.position.clone().addScaledVector(forward, 3.4);
  position.x = Math.round(position.x / 2) * 2;
  position.z = Math.round(position.z / 2) * 2;
  const blocked = colliders.some((obstacle) => Math.hypot(position.x - obstacle.x, position.z - obstacle.z) < (obstacle.radius || 1) + 1.2);
  if (blocked) {
    feed('Não há espaço suficiente para construir aqui.');
    return;
  }
  Object.keys(data.cost).forEach((key) => { state.inventory[key] -= data.cost[key]; });
  createStructure(type, position.x, position.z, state.player.group.rotation.y, false);
  if (type === 'core') advanceQuest('materiais-base', 1);
  closeModal('build-modal');
}

function showCraft() {
  if (!canAct()) return;
  openModal('craft-modal');
}


function craft(type) {
  if (!canAct()) return;
  if (state.crafting) {
    feed('A bancada já está fabricando um item.');
    return;
  }
  const data = CRAFT_DATA[type];
  if (!data) return;
  const missing = Object.keys(data.cost).find((key) => (state.inventory[key] || 0) < data.cost[key]);
  if (missing) {
    feed('Faltam materiais para fabricar ' + data.label + '.');
    return;
  }
  Object.keys(data.cost).forEach((key) => { state.inventory[key] -= data.cost[key]; });
  state.crafting = { type, data, remaining: craftDuration() };
  feed('Fabricando ' + data.label + '… ' + state.crafting.remaining.toFixed(1) + 's');
  saveGame();
}
function capture() {
  if (!canAct()) return;
  const target = nearestWild(5.2);
  if (!target) {
    feed('Aproxime-se de um monstrinho para capturá-lo.');
    return;
  }
  if (target.role === 'boss') {
    feed('Ironroot é forte demais para uma cápsula comum.');
    return;
  }
  if (target.hp > target.maxHp * .52) {
    feed('Enfraqueça ' + target.spec.name + ' antes de lançar a cápsula.');
    return;
  }
  if ((state.inventory.capsules || 0) <= 0) {
    feed('Você não tem Cápsulas Prismáticas.');
    return;
  }
  state.inventory.capsules -= 1;
  const start = state.player.group.position.clone().add(new THREE.Vector3(0, 1.2, 0));
  const end = target.group.position.clone().add(new THREE.Vector3(0, .65, 0));
  const capsule = new THREE.Mesh(
    new THREE.SphereGeometry(.28, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xeafcff, roughness: .2, metalness: .35, emissive: 0x248baf, emissiveIntensity: 1.1 })
  );
  capsule.position.copy(start);
  scene.add(capsule);
  let time = 0;
  const captureEffect = {
    group: capsule, life: .95, maxLife: .95,
    update: (effect, dt) => {
      time += dt;
      effect.life -= dt;
      capsule.position.lerpVectors(start, end, clamp(time / .55, 0, 1));
      capsule.position.y += Math.sin(clamp(time / .55, 0, 1) * Math.PI) * 1.7;
      capsule.rotation.y += dt * 8;
      if (time >= .55 && !effect.resolved) {
        effect.resolved = true;
        const chance = .24 + (1 - target.hp / target.maxHp) * .68;
        if (Math.random() < chance) {
          target.captured = true;
          target.dead = true;
          target.group.visible = false;
          state.roster.push(target.spec.rig);
          feed(target.spec.name + ' capturado! Foi enviado para a Caixa de Criaturas.');
          state.objective = 'Volte até Nara para registrar sua nova criatura.';
          advanceQuest('primeira-captura', 1);
        } else {
          feed(target.spec.name + ' escapou da cápsula.');
          target.takeDamage(8, 'player');
        }
      }
    }
  };
  state.effects.push(captureEffect);
  saveGame();
}

const MODAL_IDS = ['menu-modal', 'map-modal', 'dialogue', 'build-modal', 'craft-modal', 'inventory-modal', 'progression-modal', 'pause-modal', 'death-modal'];

function syncModalLayer() {
  const root = $('#game-root');
  if (root) root.classList.toggle('modal-open', Boolean(document.querySelector('.modal:not(.hidden)')));
}

function openModal(id) {
  MODAL_IDS.forEach((modalId) => {
    if (modalId === id) return;
    const element = $('#' + modalId);
    if (element) element.classList.add('hidden');
  });
  if (id !== 'dialogue') state.dialogue = null;
  const element = $('#' + id);
  if (element) element.classList.remove('hidden');
  syncModalLayer();
}

function closeModal(id) {
  const element = $('#' + id);
  if (element) element.classList.add('hidden');
  if (id === 'dialogue') state.dialogue = null;
  if (id === 'pause-modal' && state.paused) {
    state.paused = false;
    $('#pause-button').textContent = 'Ⅱ';
  }
  syncModalLayer();
}

function togglePause() {
  if (state.dead) return;
  if (state.paused) {
    state.paused = false;
    closeModal('pause-modal');
    $('#pause-button').textContent = 'Ⅱ';
    return;
  }
  closeModals();
  state.paused = true;
  openModal('pause-modal');
  $('#pause-button').textContent = '▶';
}

function closeModals() {
  MODAL_IDS.forEach((id) => {
    const element = $('#' + id);
    if (element) element.classList.add('hidden');
  });
  state.dialogue = null;
  if (state.paused) {
    state.paused = false;
    $('#pause-button').textContent = 'Ⅱ';
  }
  syncModalLayer();
}

function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}


function handleAction(action) {
  if (action === 'respawn') {
    respawn();
    return;
  }
  if (state.dead || !state.player) return;
  if (typeof action === 'string' && action.startsWith('team-')) {
    switchTeam(Number(action.slice(5)));
    return;
  }
  if (action === 'attack') basicAttack();
  if (action === 'pulse') pulseAttack();
  if (action === 'void') voidAttack();
  if (action === 'prism') prismAttack();
  if (action === 'dodge') dodge();
  if (action === 'interact') interact();
  if (action === 'eat') eat();
  if (action === 'capture') capture();
  if (action === 'build') showBuild();
  if (action === 'craft') showCraft();
  if (action === 'team') showInventory(true);
  if (action === 'menu') showMenu();
  if (action === 'map') showMap();
  if (action === 'pause') togglePause();
  if (action === 'inventory') showInventory(false);
  if (action === 'progression' || action === 'attributes' || action === 'skills') showProgression();
}

function updateOrientationLock() {
  const portrait = typeof matchMedia === 'function' && matchMedia('(orientation: portrait)').matches;
  const lock = $('#orientation-lock');
  const root = $('#game-root');
  if (lock) lock.setAttribute('aria-hidden', portrait ? 'false' : 'true');
  if (root) root.classList.toggle('portrait-blocked', portrait);
}

async function requestLandscape() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (error) {
    console.info('Tela cheia não autorizada pelo navegador.', error);
  }
  try {
    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (error) {
    console.info('Rotação automática não disponível neste navegador.', error);
  }
  updateOrientationLock();
}

function bindInput() {
  const orientationButton = $('#orientation-fullscreen');
  if (orientationButton) {
    orientationButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      requestLandscape();
    }, { passive: false });
  }
  updateOrientationLock();
  const movementCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
  window.addEventListener('keydown', (event) => {
    if (movementCodes.indexOf(event.code) >= 0) {
      state.input.keys.add(event.code);
      event.preventDefault();
    }
    if (event.repeat) return;
    const actions = {
      Numpad1: 'attack', Digit1: 'attack', KeyJ: 'attack', Digit2: 'pulse', Digit3: 'void', Digit4: 'prism',
      Space: 'dodge', KeyE: 'interact', KeyF: 'eat', KeyC: 'capture', KeyB: 'build', KeyK: 'craft', KeyR: 'team',
      Tab: 'menu', KeyI: 'inventory', KeyM: 'map', KeyP: 'progression', KeyT: 'progression',
      F1: 'team-0', F2: 'team-1', F3: 'team-2', F4: 'team-3', F5: 'team-4', F6: 'team-5',
      Enter: 'respawn', Escape: 'close'
    };
    if (actions[event.code]) {
      if (actions[event.code] === 'close') {
        if (state.dead) return;
        const hasModal = Boolean(document.querySelector('.modal:not(.hidden)'));
        if (state.paused) togglePause();
        else if (hasModal) closeModals();
        else showMenu();
      } else handleAction(actions[event.code]);
      event.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('keyup', (event) => state.input.keys.delete(event.code));

  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleAction(button.getAttribute('data-action'));
    }, { passive: false });
  });
  document.querySelectorAll('[data-build]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      placeBuild(button.getAttribute('data-build'));
    }, { passive: false });
  });
  document.querySelectorAll('[data-craft]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      craft(button.getAttribute('data-craft'));
    }, { passive: false });
  });
  document.querySelectorAll('[data-menu-action]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const action = button.getAttribute('data-menu-action');
      closeModals();
      handleAction(action);
    }, { passive: false });
  });
  const inventoryModal = $('#inventory-modal');
  if (inventoryModal) {
    inventoryModal.addEventListener('pointerdown', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const teamButton = target?.closest('[data-team-slot]');
      const boxButton = target?.closest('[data-box-creature]');
      if (teamButton) {
        event.preventDefault();
        switchTeam(teamButton.getAttribute('data-team-slot'));
        return;
      }
      if (boxButton) {
        event.preventDefault();
        addBoxCreatureToTeam(boxButton.getAttribute('data-box-creature'));
      }
    }, { passive: false });
  }
  const attributeOptions = $('#attribute-options');
  if (attributeOptions) {
    attributeOptions.addEventListener('pointerdown', (event) => {
      const button = event.target.closest('[data-attribute]');
      if (!button) return;
      event.preventDefault();
      spendAttribute(button.getAttribute('data-attribute'));
    }, { passive: false });
  }
  const skillOptions = $('#skill-options');
  if (skillOptions) {
    skillOptions.addEventListener('pointerdown', (event) => {
      const button = event.target.closest('[data-skill]');
      if (!button) return;
      event.preventDefault();
      upgradeSkill(button.getAttribute('data-skill'));
    }, { passive: false });
  }

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      closeModal(button.getAttribute('data-close'));
    }, { passive: false });
  });
  $('#dialogue-next').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (state.dialogue) openDialogue(state.dialogue.npc);
  }, { passive: false });
  $('#pause-button').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    togglePause();
  }, { passive: false });
  $('#resume-button').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (state.paused) togglePause();
  }, { passive: false });
  $('#reset-save-button').addEventListener('pointerdown', (event) => {
    event.preventDefault();
    resetSave();
  }, { passive: false });

  const joystick = $('#joystick');
  const knob = $('#joystick-knob');
  const updateJoy = (event) => {
    const rect = joystick.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const radius = rect.width * .34;
    const length = Math.hypot(dx, dy);
    const multiplier = length > radius ? radius / length : 1;
    const px = dx * multiplier;
    const py = dy * multiplier;
    state.input.joyX = clamp(px / radius, -1, 1);
    state.input.joyY = clamp(py / radius, -1, 1);
    knob.style.transform = 'translate(' + px + 'px,' + py + 'px)';
  };
  const resetJoy = () => {
    state.input.joyActive = false;
    state.input.pointerId = null;
    state.input.joyX = 0;
    state.input.joyY = 0;
    knob.style.transform = 'translate(0,0)';
  };
  joystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    state.input.joyActive = true;
    state.input.pointerId = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    updateJoy(event);
  }, { passive: false });
  joystick.addEventListener('pointermove', (event) => {
    if (state.input.joyActive && state.input.pointerId === event.pointerId) updateJoy(event);
  }, { passive: false });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => joystick.addEventListener(eventName, resetJoy));

  const lookZone = $('#camera-touch-zone');
  const startLook = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    state.camera.looking = true;
    state.camera.pointerId = event.pointerId;
    state.camera.x = event.clientX;
    state.camera.y = event.clientY;
    lookZone.setPointerCapture(event.pointerId);
  };
  const moveLook = (event) => {
    if (!state.camera.looking || state.camera.pointerId !== event.pointerId) return;
    event.preventDefault();
    state.camera.yaw -= (event.clientX - state.camera.x) * .008;
    state.camera.pitch = clamp(state.camera.pitch + (event.clientY - state.camera.y) * .006, .22, .92);
    state.camera.x = event.clientX;
    state.camera.y = event.clientY;
  };
  const endLook = () => {
    state.camera.looking = false;
    state.camera.pointerId = null;
  };
  lookZone.addEventListener('pointerdown', startLook, { passive: false });
  lookZone.addEventListener('pointermove', moveLook, { passive: false });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => lookZone.addEventListener(eventName, endLook));
  window.addEventListener('wheel', (event) => {
    state.camera.distance = clamp(state.camera.distance + (event.deltaY > 0 ? .7 : -.7), 8, 22);
  }, { passive: true });
  $('#world-canvas').addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button === 0 && event.clientX > innerWidth * .38) basicAttack();
  });
}

function updateCamera(dt) {
  const target = state.player.group.position.clone().add(new THREE.Vector3(0, 1.05, 0));
  const horizontal = Math.cos(state.camera.pitch) * state.camera.distance;
  const offset = new THREE.Vector3(
    Math.sin(state.camera.yaw) * horizontal,
    Math.sin(state.camera.pitch) * state.camera.distance + 2.0,
    Math.cos(state.camera.yaw) * horizontal
  );
  const desired = target.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.pow(.0001, dt));
  camera.lookAt(target);
  sun.position.set(state.player.group.position.x - 25, 35, state.player.group.position.z + 18);
}

function updateDayNight(dt) {
  state.dayClock += dt / 180;
  if (state.dayClock >= 1) {
    state.dayClock -= 1;
    state.day += 1;
    feed('Amanheceu o dia ' + state.day + '.');
  }
  const hour = (state.dayClock * 24 + 6) % 24;
  const daylight = clamp(Math.sin((hour - 5) / 14 * Math.PI), .08, 1);
  sun.intensity = .7 + daylight * 2.8;
  sun.color.setHSL(.10 + (1 - daylight) * .05, .55, .72);
  const sky = new THREE.Color().setHSL(.56, .42, .055 + daylight * .09);
  scene.background.lerp(sky, .035);
  scene.fog.color.lerp(new THREE.Color(0x0a252c).lerp(new THREE.Color(0x07131b), 1 - daylight), .035);
  $('#day-clock').textContent = 'DIA ' + state.day + ' • ' + (hour < 9 ? 'MANHÃ' : hour < 17 ? 'DIA' : hour < 20 ? 'ENTARDECER' : 'NOITE');
  if (waterTexture) waterTexture.offset.x = (waterTexture.offset.x + dt * .007) % 1;
}


function updateSurvival(dt) {
  survivalTimer += dt;
  if (survivalTimer < 5 || !canAct()) return;
  survivalTimer = 0;
  const survivalFactor = 1 - skillLevel('survival') * .06;
  state.hunger = clamp(state.hunger - .55 * survivalFactor, 0, 100);
  state.water = clamp(state.water - .82 * survivalFactor, 0, 100);
  if (state.hunger < 12 || state.water < 12) {
    state.player.takeDamage(4, 'survival');
    state.hp = state.player.hp;
    feed(state.hunger < 12 ? 'A fome está crítica.' : 'A água está crítica.');
  }
}
function updateCrafting(dt) {
  if (!state.crafting) return;
  state.crafting.remaining -= dt;
  if (state.crafting.remaining > 0) return;
  const task = state.crafting;
  Object.keys(task.data.give).forEach((key) => { state.inventory[key] = (state.inventory[key] || 0) + task.data.give[key]; });
  state.crafting = null;
  feed(task.data.label + ' pronto.');
  if (task.type === 'tonic') advanceQuest('sabores-do-vale', 1);
  saveGame();
}

function updateCooldowns(dt) {
  Object.keys(state.cooldowns).forEach((key) => { state.cooldowns[key] = Math.max(0, state.cooldowns[key] - dt); });
}
function updateLabels() {
  state.labels.forEach((record) => {
    if (!record.object || !record.element) return;
    if (record.kind === 'zone') {
      record.visible = record.object.userData.zoneId === state.zoneId;
    } else if (record.kind === 'wild') {
      const distance = state.player ? distance2D(record.object.position, state.player.group.position) : 999;
      record.visible = record.object.userData.boss || distance < 13;
    }
    if (!record.visible || !record.object.visible) {
      record.element.style.display = 'none';
      return;
    }
    tempD.copy(record.object.position);
    tempD.y += record.kind === 'boss' ? 4.9 : record.kind === 'npc' ? 3.0 : 2.9;
    tempD.project(camera);
    if (tempD.z > 1 || tempD.z < -1) {
      record.element.style.display = 'none';
      return;
    }
    record.element.style.display = 'block';
    record.element.style.left = ((tempD.x * .5 + .5) * innerWidth) + 'px';
    record.element.style.top = ((-tempD.y * .5 + .5) * innerHeight) + 'px';
  });
  for (let i = state.floating.length - 1; i >= 0; i -= 1) {
    const item = state.floating[i];
    item.life -= .016;
    item.world.y += .025;
    tempD.copy(item.world).project(camera);
    item.element.style.left = ((tempD.x * .5 + .5) * innerWidth) + 'px';
    item.element.style.top = ((-tempD.y * .5 + .5) * innerHeight) + 'px';
    item.element.style.opacity = clamp(item.life / item.maxLife, 0, 1);
    if (item.life <= 0) {
      item.element.remove();
      state.floating.splice(i, 1);
    }
  }
}

function floatingText(position, text, color) {
  const element = document.createElement('div');
  element.textContent = text;
  element.style.position = 'absolute';
  element.style.transform = 'translate(-50%,-50%)';
  element.style.color = color || '#fff';
  element.style.fontWeight = '950';
  element.style.fontSize = '18px';
  element.style.textShadow = '0 2px 5px #000,0 0 10px ' + (color || '#fff');
  element.style.pointerEvents = 'none';
  element.style.zIndex = '12';
  worldLabels.appendChild(element);
  state.floating.push({ element, world: position, life: 1.1, maxLife: 1.1 });
}

function feed(message) {
  state.feed.unshift(String(message));
  state.feed = state.feed.slice(0, 5);
  const container = $('#feed');
  container.innerHTML = '';
  state.feed.forEach((entry) => {
    const line = document.createElement('div');
    line.textContent = entry;
    container.appendChild(line);
  });
}


function updateInventoryModal() {
  const grid = $('#inventory-grid');
  const teamGrid = $('#team-grid');
  const boxGrid = $('#box-grid');
  const activeSpec = activeSpecies();
  uiText('inventory-kicker', 'INVENTÁRIO DE ' + activeSpec.name.toUpperCase());
  uiText('team-count', state.team.length + ' / ' + TEAM_LIMIT);
  const boxEntries = state.roster.map((entry, index) => ({ entry, index, speciesId: teamSpeciesId(entry) })).filter((item) => isTeamSpecies(item.speciesId));
  uiText('box-count', boxEntries.length);
  if (teamGrid) {
    teamGrid.innerHTML = state.team.map((slot, index) => {
      const spec = SPECIES[slot.speciesId] || SPECIES.lumion;
      const activeSlot = index === state.activeTeamIndex;
      const maxHp = playerMaxHpForSpec(spec);
      const hp = activeSlot && state.player ? state.player.hp : clamp(Number(slot.hp) || spec.hp, 1, maxHp);
      const ratio = clamp(hp / maxHp, 0, 1);
      const accent = '#' + new THREE.Color(spec.accent || spec.color).getHexString();
      return '<button type="button" class="team-slot' + (activeSlot ? ' active' : '') + '" data-team-slot="' + index + '" style="--team-accent:' + accent + '"' + (state.dead ? ' disabled' : '') + '>' +
        '<span class="team-slot-index">F' + (index + 1) + '</span>' +
        '<span class="team-slot-icon">' + (spec.icon || '✦') + '</span>' +
        '<span class="team-slot-copy"><strong>' + spec.name + '</strong><small>' + (activeSlot ? 'ATIVO AGORA' : 'CLIQUE PARA CONTROLAR') + '</small><i><em style="width:' + (ratio * 100) + '%"></em></i><b>HP ' + Math.ceil(hp) + ' / ' + maxHp + '</b></span>' +
        '</button>';
    }).join('');
  }
  if (boxGrid) {
    boxGrid.innerHTML = boxEntries.length ? boxEntries.map((item) => {
      const spec = SPECIES[item.speciesId];
      const accent = '#' + new THREE.Color(spec.accent || spec.color).getHexString();
      return '<button type="button" class="box-creature" data-box-creature="' + item.index + '" style="--team-accent:' + accent + '">' +
        '<span class="box-creature-icon">' + (spec.icon || '✦') + '</span><strong>' + spec.name + '</strong><small>CLIQUE PARA ENTRAR NO TIME</small></button>';
    }).join('') : '';
  }
  const empty = $('#box-empty');
  if (empty) empty.textContent = boxEntries.length ? 'Clique em uma captura para trocar com o último slot não ativo.' : 'Nenhuma captura extra. Enfraqueça um monstrinho e use CAPTURAR.';
  const entries = [
    ['wood', '🪵', 'Madeira'], ['stone', '🪨', 'Pedra'], ['fiber', '🌿', 'Fibra'],
    ['ore', '⛓', 'Minério'], ['crystal', '◇', 'Cristal'], ['berry', '🍓', 'Frutas'],
    ['capsules', '◉', 'Cápsulas'], ['food', '🍲', 'Refeições'], ['repair', '⚒', 'Reparos']
  ];
  if (grid) grid.innerHTML = entries.map((entry) => '<div class="inventory-slot"><strong>' + entry[1] + '</strong><span>' + entry[2] + '</span><b>' + Math.floor(state.inventory[entry[0]] || 0) + '</b></div>').join('');
  uiText('inventory-weight-modal', inventoryWeight().toFixed(1) + ' / ' + carryCapacity() + ' kg');
}

function updateProgressionUI() {
  const currentName = activeSpecies().name;
  uiText('progression-kicker', 'PROGRESSÃO DE ' + currentName.toUpperCase());
  uiText('progression-description', 'Cada nível concede 1 ponto de atributo e 1 ponto de técnica. Escolha como ' + currentName + ' vai sobreviver.');
  const attributes = $('#attribute-options');
  const skills = $('#skill-options');
  uiText('attribute-points-modal', state.attributePoints + ' pontos de atributo');
  uiText('skill-points-modal', state.skillPoints + ' pontos de técnica');
  if (attributes) {
    attributes.innerHTML = Object.entries(ATTRIBUTE_DATA).map(([key, data]) => {
      const level = attributeLevel(key);
      return '<button type="button" data-attribute="' + key + '"><strong>' + data.icon + ' ' + data.label + '</strong><b>Lv.' + level + '</b><small>' + data.description + '</small><em>＋1</em></button>';
    }).join('');
  }
  if (skills) {
    skills.innerHTML = Object.entries(SKILL_DATA).map(([key, data]) => {
      const level = skillLevel(key);
      const maxed = level >= data.max;
      return '<button type="button" data-skill="' + key + '"><strong>' + data.icon + ' ' + data.label + '</strong><b>Lv.' + level + '/' + data.max + '</b><small>' + data.description + '</small><em>' + (maxed ? 'MÁXIMO' : '＋1 nível') + '</em></button>';
    }).join('');
  }
}

function spendAttribute(key) {
  if (!canAct() || !ATTRIBUTE_DATA[key] || state.attributePoints <= 0) return;
  state.attributePoints -= 1;
  state.attributes[key] = attributeLevel(key) + 1;
  syncPlayerStats(key === 'vitality');
  feed(ATTRIBUTE_DATA[key].label + ' aumentada para Lv.' + state.attributes[key] + '.');
  updateProgressionUI();
  updateUI();
  saveGame();
}

function upgradeSkill(key) {
  if (!canAct() || !SKILL_DATA[key] || state.skillPoints <= 0) return;
  const current = skillLevel(key);
  if (current >= SKILL_DATA[key].max) {
    feed(SKILL_DATA[key].label + ' já está no máximo.');
    return;
  }
  state.skillPoints -= 1;
  state.skills[key] = current + 1;
  feed(SKILL_DATA[key].label + ' agora está no Lv.' + state.skills[key] + '.');
  updateProgressionUI();
  updateUI();
  saveGame();
}

function showMenu() {
  if (!canAct()) return;
  updateInventoryModal();
  updateProgressionUI();
  openModal('menu-modal');
}

function showMap() {
  if (!canAct()) return;
  drawMinimap();
  openModal('map-modal');
}

function showInventory(focusTeam) {
  if (!state.player) return;
  const modal = $('#inventory-modal');
  if (!modal) return;
  if (!modal.classList.contains('hidden') && !focusTeam) {
    closeModal('inventory-modal');
    return;
  }
  updateInventoryModal();
  openModal('inventory-modal');
  if (focusTeam) setTimeout(() => $('#team-panel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
}

function showProgression() {
  if (!canAct()) return;
  updateProgressionUI();
  openModal('progression-modal');
}

function updateUI() {
  if (!state.player) return;
  const hp = clamp(state.player.hp / state.player.maxHp, 0, 1);
  const xpRequired = 100 + state.level * 45;
  uiText('status-name', state.player.spec.name);
  uiText('status-form', (state.activeTeamIndex === 0 ? 'FORMA BASE' : 'FORMA DE EQUIPE') + ' • ATIVO');
  uiText('inventory-kicker', 'INVENTÁRIO DE ' + state.player.spec.name.toUpperCase());
  uiText('level-text', 'Lv.' + state.level);
  uiText('hp-text', Math.ceil(state.player.hp) + ' / ' + Math.ceil(state.player.maxHp));
  uiText('hunger-text', Math.ceil(state.hunger) + '%');
  uiText('water-text', Math.ceil(state.water) + '%');
  uiText('energy-text', Math.ceil(state.energy) + '%');
  uiText('xp-text', 'XP ' + Math.floor(state.xp) + ' / ' + xpRequired);
  uiText('attribute-points-text', state.attributePoints);
  uiText('skill-points-text', state.skillPoints);
  uiText('inventory-weight', inventoryWeight().toFixed(1) + ' / ' + carryCapacity() + ' kg');
  uiText('crafting-status', state.gathering ? 'COLETANDO: ' + state.gathering.remaining.toFixed(1) + 's' : state.crafting ? 'FABRICANDO: ' + state.crafting.remaining.toFixed(1) + 's' : '');
  uiBar('hp-bar', hp);
  uiBar('hunger-bar', state.hunger / 100);
  uiBar('water-bar', state.water / 100);
  uiBar('energy-bar', state.energy / 100);
  uiBar('xp-bar', state.xp / xpRequired);
  uiText('objective-text', state.objective);
  Object.keys(state.inventory).forEach((key) => uiText('inv-' + key, Math.floor(state.inventory[key] || 0)));
  const zone = regionZoneAt(state.player.group.position);
  uiText('biome-name', zone.name);
  uiText('region-name', REGION_DATA.name.toUpperCase());
  const quest = activeQuest();
  const questState = state.quests[quest.id] || { progress: 0 };
  uiText('quest-title', quest.title);
  uiText('quest-goal', quest.goal + ' • ' + questState.progress + '/' + quest.target);
  uiText('quest-description', quest.description);
  uiText('zone-subtitle', zone.subtitle + (zone.levels ? ' • ' + zone.levels : ''));
  uiText('zone-banner-name', zone.name);
  uiText('zone-banner-subtitle', zone.subtitle + (zone.levels ? ' • ' + zone.levels : ''));
  const zoneBanner = $('#zone-banner');
  if (zoneBanner) zoneBanner.classList.toggle('visible', state.zoneBanner > 0);
  const transitionLabel = state.labels.find((label) => label.kind === 'transition');
  if (transitionLabel) transitionLabel.sub.textContent = transitionLocked() ? 'COSTA TURQUESA • BLOQUEADA' : 'COSTA TURQUESA • ABERTA';
  if (state.zoneBanner > 0) state.zoneBanner = Math.max(0, state.zoneBanner - .016);
  if (state.dead) uiText('interact-label', state.player.spec.name.toUpperCase() + ' CAÍDO');
  else updateInteractHint();
  const skillButtons = document.querySelectorAll('#skills button');
  if (skillButtons[0]) {
    skillButtons[0].style.opacity = state.cooldowns.pulse > 0 ? '.5' : '1';
    skillButtons[0].querySelector('span').textContent = 'PULSO · Lv.' + skillLevel('pulse');
  }
  if (skillButtons[1]) {
    skillButtons[1].style.opacity = state.cooldowns.void > 0 ? '.5' : '1';
    skillButtons[1].querySelector('span').textContent = 'VÓRTICE · Lv.' + skillLevel('void');
  }
  if (skillButtons[2]) {
    skillButtons[2].style.opacity = state.cooldowns.prism > 0 ? '.5' : '1';
    skillButtons[2].querySelector('span').textContent = 'PRISMA · Lv.' + skillLevel('prism');
  }
  const root = $('#game-root');
  if (root) root.classList.toggle('player-dead', state.dead);
  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    button.disabled = state.dead && action !== 'respawn';
    button.classList.toggle('disabled-action', button.disabled);
  });
  if (!$('#inventory-modal')?.classList.contains('hidden')) updateInventoryModal();
  if (!$('#progression-modal')?.classList.contains('hidden')) updateProgressionUI();
}
function drawMapCanvas(ctx, canvas) {
  if (!ctx || !canvas || !state.player) return;
  const width = canvas.width;
  const height = canvas.height;
  const sx = width / (WORLD.maxX - WORLD.minX);
  const sz = height / (WORLD.maxZ - WORLD.minZ);
  const mapX = (x) => (x - WORLD.minX) * sx;
  const mapZ = (z) => (z - WORLD.minZ) * sz;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#08252b';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#176c78';
  ctx.fillRect(mapX(28), mapZ(-54), 60 * sx, 34 * sz);
  ctx.fillStyle = '#70452f';
  ctx.fillRect(mapX(34), mapZ(8), 46 * sx, 49 * sz);
  ctx.strokeStyle = 'rgba(146,238,216,.23)';
  ctx.lineWidth = Math.max(2, width / 74);
  ctx.beginPath();
  ctx.moveTo(mapX(-88), mapZ(14));
  ctx.lineTo(mapX(24), mapZ(14));
  ctx.stroke();
  REGION_DATA.zones.forEach((zone) => {
    ctx.strokeStyle = '#' + new THREE.Color(zone.color).getHexString();
    ctx.globalAlpha = .28;
    ctx.lineWidth = Math.max(1, width / 420);
    ctx.beginPath();
    ctx.arc(mapX(zone.x), mapZ(zone.z), zone.radius * sx, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
  state.resources.forEach((resource) => {
    if (resource.collected) return;
    ctx.fillStyle = resource.kind === 'crystal' ? '#7cf3ff' : resource.kind === 'ore' ? '#ff9a6e' : '#8fd88a';
    const size = Math.max(3, width / 145);
    ctx.fillRect(mapX(resource.group.position.x) - size / 2, mapZ(resource.group.position.z) - size / 2, size, size);
  });
  state.npcs.forEach((npc) => {
    ctx.fillStyle = '#ffe18b';
    const size = Math.max(5, width / 105);
    ctx.fillRect(mapX(npc.x) - size / 2, mapZ(npc.z) - size / 2, size, size);
  });
  state.structures.forEach((structure) => {
    ctx.fillStyle = '#c0a4ff';
    const size = Math.max(5, width / 105);
    ctx.fillRect(mapX(structure.x) - size / 2, mapZ(structure.z) - size / 2, size, size);
  });
  state.wild.forEach((wild) => {
    if (wild.dead || wild.captured || !wild.group.visible) return;
    ctx.fillStyle = wild.role === 'boss' ? '#77ffcf' : '#ff749b';
    ctx.beginPath();
    ctx.arc(mapX(wild.group.position.x), mapZ(wild.group.position.z), wild.role === 'boss' ? Math.max(6, width / 60) : Math.max(3, width / 102), 0, TAU);
    ctx.fill();
  });
  ctx.fillStyle = '#e9ffff';
  ctx.beginPath();
  ctx.arc(mapX(state.player.group.position.x), mapZ(state.player.group.position.z), Math.max(6, width / 58), 0, TAU);
  ctx.fill();
}

function drawMinimap() {
  drawMapCanvas(minimapContext, $('#minimap'));
  drawMapCanvas(mapLargeContext, $('#map-large'));
}


function saveGame() {
  syncActiveTeamSlot();
  const data = {
    x: state.player ? state.player.group.position.x : 0,
    z: state.player ? state.player.group.position.z : 12,
    day: state.day, dayClock: state.dayClock, level: state.level, xp: state.xp,
    objective: state.objective,
    hp: state.player ? Math.max(1, state.player.hp) : 320,
    hunger: state.hunger, water: state.water, energy: state.energy,
    attributePoints: state.attributePoints,
    skillPoints: state.skillPoints,
    attributes: state.attributes,
    skills: state.skills,
    team: state.team,
    activeTeamIndex: state.activeTeamIndex,
    inventory: state.inventory,
    zoneId: state.zoneId,
    quests: state.quests,
    discoveredZones: Array.from(state.discoveredZones),
    structures: state.structures.map((structure) => ({ type: structure.type, x: structure.x, z: structure.z, rotation: structure.rotation })),
    captured: state.roster
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (error) { console.warn('save failed', error); }
}

function update(dt) {
  if (state.dead) {
    updateCooldowns(dt);
    updateDeathState(dt);
    return;
  }
  if (state.dead) return;
  if (state.paused) return;
  updateCooldowns(dt);
  updatePlayer(dt);
  updateRegionZone();
  state.wild.forEach((wild) => updateWild(wild, dt));
  state.player.update(dt);
  state.wild.forEach((wild) => wild.update(dt));
  updateProjectiles(dt);
  updateEffects(dt);
  updateResources(dt);
  updateCrafting(dt);
  updateSurvival(dt);
  updateDayNight(dt);
  updateCamera(dt);
  updateUI();
  drawMinimap();
  saveTimer += dt;
  if (saveTimer > 10) {
    saveTimer = 0;
    saveGame();
  }
}
function resize() {
  if (!renderer || !camera) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
}

function frame(time) {
  const dt = Math.min(.05, Math.max(.001, (time - lastTime) / 1000));
  lastTime = time;
  update(dt);
  updatePerformance(dt);
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function start() {
  try {
    createScene();
  } catch (error) {
    bindInput();
    const loading = $('#loading');
    if (loading) loading.classList.add('done');
    const diagnosis = error && error.webgl ? error.webgl : getWebGLDiagnostics();
    const fallback = document.createElement('div');
    fallback.className = 'runtime-fallback';
    const title = document.createElement('strong');
    const message = document.createElement('span');
    const detail = document.createElement('small');
    if (!diagnosis.available) {
      title.textContent = 'WebGL 2 está bloqueado neste ambiente.';
      message.textContent = 'A Fronteira Íris 3D precisa de WebGL 2 ativo. Abra a página diretamente no Chrome ou Edge, fora de uma prévia incorporada, e recarregue.';
      detail.textContent = 'Diagnóstico: o navegador não criou um contexto gráfico.';
    } else {
      title.textContent = 'A cena 3D encontrou um erro ao iniciar.';
      message.textContent = 'O WebGL está disponível, mas outro componente falhou. O erro foi separado do diagnóstico gráfico para podermos corrigi-lo corretamente.';
      detail.textContent = 'Diagnóstico: WebGL 2 detectado. Erro: ' + ((error && error.message) ? error.message : String(error));
    }
    fallback.append(title, message, detail);
    $('#game-root').appendChild(fallback);
    console.error('Wildlands 3D initialization failed.', { error, diagnosis });
    return;
  }
  bindInput();
  feed('Fronteira aberta. Explore, colete, capture e construa seu abrigo.');
  feed('Ataque básico: botão ATACAR, J, 1 ou NUM1.');
  updateUI();
  drawMinimap();
  addEventListener('resize', () => { resize(); updateOrientationLock(); });
  addEventListener('orientationchange', updateOrientationLock);
  addEventListener('beforeunload', saveGame);
  setTimeout(() => $('#loading').classList.add('done'), 480);
  requestAnimationFrame(frame);
}

window.PSY_WILDLANDS_3D_V156 = {
  version: 'WILDLANDS_3D_V156',
  content: { regions: REGIONS, quests: QUESTS, creatures: ALL_CREATURES, captureItems: CAPTURE_ITEMS, captureChance, isCaptureUnlocked },
  state,
  actions: {
    basicAttack, pulseAttack, voidAttack, prismAttack, capture, dodge,
    respawn, showInventory, showProgression, spendAttribute, upgradeSkill,
    showBuild, showCraft
  },
  snapshot: () => ({
    version: 'WILDLANDS_3D_V156',
    rendererReady: Boolean(renderer),
    playerReady: Boolean(state.player),
    dead: state.dead,
    respawnReady: state.respawnReady,
    respawnTimer: state.respawnTimer,
    joystick: { x: state.input.joyX, y: state.input.joyY, active: state.input.joyActive },
    cameraDistance: state.camera.distance,
    projectiles: state.projectiles.length,
    wildCreatures: state.wild.filter((creature) => !creature.dead).length,
    npcs: state.npcs.length,
    structures: state.structures.length,
    region: REGION_DATA.id,
    zone: state.zoneId,
    quests: Object.values(state.quests).filter((quest) => quest.complete).length,
    quality: performanceState.quality,
    assets: {
      loaderReady: assetState.loaderReady,
      environmentLoaded: assetState.environmentLoaded,
      environmentTotal: assetState.environmentTotal,
      creatureLoaded: assetState.creatureLoaded,
      creatureTotal: assetState.creatureTotal,
      fallback: assetState.fallback,
      error: assetState.loaderError
    },
    inventory: { ...state.inventory },
    inventoryWeight: inventoryWeight(),
    carryCapacity: carryCapacity(),
    level: state.level,
    xp: state.xp,
    hp: state.hp,
    maxHp: state.player ? state.player.maxHp : 0,
    attributePoints: state.attributePoints,
    skillPoints: state.skillPoints,
    attributes: { ...state.attributes },
    skills: { ...state.skills },
    gathering: state.gathering ? { type: state.gathering.resource.kind, remaining: state.gathering.remaining } : null,
    crafting: state.crafting ? { type: state.crafting.type, label: state.crafting.data.label, remaining: state.crafting.remaining } : null,
    objective: state.objective
  })
};

start();
