const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.querySelector('#miniMap');
const miniCtx = miniMap.getContext('2d');
const bigMap = document.querySelector('#bigMap');
const bigCtx = bigMap.getContext('2d');

const WORLD = { width: 2800, height: 1800, split: 1400 };
const SAVE_KEY = 'psyworld_fronteira_iris_2d_v1';
const TAU = Math.PI * 2;

const assets = {
  creatures: loadImage('./assets/creatures-atlas.png'),
  environment: loadImage('./assets/environment-atlas.png'),
};
let loadedAssets = 0;
const loadingBar = document.querySelector('#loadingBar');
for (const image of Object.values(assets)) {
  image.addEventListener('load', () => {
    loadedAssets += 1;
    loadingBar.style.width = `${Math.round((loadedAssets / 2) * 100)}%`;
  });
  if (image.complete && image.naturalWidth) { loadedAssets += 1; loadingBar.style.width = `${Math.round((loadedAssets / 2) * 100)}%`; }
}

function loadImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const species = [
  { id: 'lumion', name: 'Lúmion', atlas: [0, 0], element: 'Íris', color: '#62e4df', maxHp: 130, level: 2, drop: 'fibra', capture: .58 },
  { id: 'mossclaw', name: 'Mossclaw', atlas: [1, 0], element: 'Musgo', color: '#8bcf86', maxHp: 155, level: 3, drop: 'fibra', capture: .48 },
  { id: 'embermite', name: 'Embermite', atlas: [2, 0], element: 'Brasa', color: '#ff9863', maxHp: 180, level: 4, drop: 'mineral', capture: .41 },
  { id: 'pearlkin', name: 'Pearlkin', atlas: [3, 0], element: 'Maré', color: '#bce9f2', maxHp: 145, level: 3, drop: 'cristal', capture: .5 },
  { id: 'gloomwing', name: 'Gloomwing', atlas: [0, 1], element: 'Noite', color: '#bd93ee', maxHp: 190, level: 5, drop: 'fibra', capture: .38 },
  { id: 'voltkit', name: 'Voltkit', atlas: [1, 1], element: 'Faísca', color: '#f7dc65', maxHp: 210, level: 6, drop: 'cristal', capture: .34 },
  { id: 'tideotter', name: 'Tideotter', atlas: [2, 1], element: 'Maré', color: '#65c9e5', maxHp: 235, level: 7, drop: 'água', capture: .3 },
  { id: 'cinderhorn', name: 'Cinderhorn', atlas: [3, 1], element: 'Brasa', color: '#f07f66', maxHp: 260, level: 8, drop: 'mineral', capture: .27 },
  { id: 'ironroot', name: 'Ironroot', atlas: [0, 2], element: 'Pedra', color: '#a6a9aa', maxHp: 310, level: 9, drop: 'mineral', capture: .21 },
  { id: 'cloudlet', name: 'Cloudlet', atlas: [1, 2], element: 'Vento', color: '#e3f5ff', maxHp: 170, level: 5, drop: 'fibra', capture: .36 },
  { id: 'mushloom', name: 'Mushloom', atlas: [2, 2], element: 'Fungo', color: '#e795d5', maxHp: 220, level: 7, drop: 'fibra', capture: .29 },
  { id: 'aurorhart', name: 'Aurorhart', atlas: [3, 2], element: 'Aurora', color: '#75e1b4', maxHp: 380, level: 12, drop: 'cristal', capture: .15 },
];

const capsuleData = [
  { id: 'capsule', name: 'Cápsula Íris', short: 'Íris', bonus: .04, cost: { fibra: 3, mineral: 1 }, unlock: 0 },
  { id: 'prism', name: 'Cápsula Prisma', short: 'Prisma', bonus: .16, cost: { cristal: 2, mineral: 2 }, unlock: 5 },
  { id: 'aurora', name: 'Selo Aurora', short: 'Aurora', bonus: .31, cost: { cristal: 5, fibra: 4 }, unlock: 15 },
];

const questCatalog = [
  ...[
    ['q01', 'Primeiros passos', 'Colete fibra perto do acampamento', 'collect', 'fibra', 5, 30],
    ['q02', 'Pedra sobre pedra', 'Reúna minério nas Campinas do Véu', 'collect', 'mineral', 4, 38],
    ['q03', 'Olhos atentos', 'Descubra a Clareira Aurora', 'explore', 'clareira', 1, 35],
    ['q04', 'Faísca de coragem', 'Derrote 2 monstrinhos', 'defeat', 'any', 2, 45],
    ['q05', 'A primeira companhia', 'Capture um monstrinho', 'capture', 'any', 1, 50],
    ['q06', 'Cozinha de campo', 'Fabrique uma refeição quente', 'craft', 'meal', 1, 42],
    ['q07', 'A cartógrafa', 'Converse com Nara', 'talk', 'nara', 1, 36],
    ['q08', 'Ponto de apoio', 'Converse com Bram', 'talk', 'bram', 1, 36],
    ['q09', 'Brasa controlada', 'Capture um Embermite', 'capture', 'embermite', 1, 65],
    ['q10', 'Luz no mato', 'Colete 3 ervas aurora', 'collect', 'aurora', 3, 58],
    ['q11', 'Trilha segura', 'Explore as Ruínas do Sol', 'explore', 'ruinas', 1, 55],
    ['q12', 'Dupla de campo', 'Tenha 2 monstrinhos na equipe', 'team', 'any', 2, 60],
    ['q13', 'Oficina improvisada', 'Fabrique uma Cápsula Prisma', 'craft', 'prism', 1, 70],
    ['q14', 'Vozes da mata', 'Converse com Yara', 'talk', 'yara', 1, 48],
    ['q15', 'Caça cuidadosa', 'Derrote um monstrinho nível 6+', 'defeatLevel', '6', 1, 75],
    ['q16', 'Rastro de cristal', 'Colete 4 cristais', 'collect', 'cristal', 4, 68],
    ['q17', 'Abrigo vivo', 'Acenda a fogueira do acampamento', 'interact', 'campfire', 1, 50],
    ['q18', 'A noite observa', 'Capture um Gloomwing', 'capture', 'gloomwing', 1, 80],
    ['q19', 'Passagem antiga', 'Ative o Portão Aurora', 'interact', 'gate', 1, 90],
    ['q20', 'Chamado da fronteira', 'Complete 15 missões', 'meta', 'any', 15, 120],
  ].map(([id, title, text, type, target, amount, reward]) => ({ id, region: 1, title, text, type, target, amount, reward })),
  ...[
    ['q21', 'Costa desconhecida', 'Descubra a Costa Aurora', 'explore', 'costa', 1, 80],
    ['q22', 'Maré baixa', 'Colete 5 gotas de água', 'collect', 'água', 5, 62],
    ['q23', 'Ninho de nuvens', 'Capture um Cloudlet', 'capture', 'cloudlet', 1, 82],
    ['q24', 'Pedra que canta', 'Colete 5 cristais azuis', 'collect', 'cristal', 5, 85],
    ['q25', 'Vento contrário', 'Derrote 3 criaturas da Costa', 'defeatRegion', '2', 3, 78],
    ['q26', 'O cozinheiro errante', 'Converse com Ivo', 'talk', 'ivo', 1, 72],
    ['q27', 'O portão das marés', 'Ative o farol antigo', 'interact', 'lighthouse', 1, 88],
    ['q28', 'Escamas e espuma', 'Capture um Tideotter', 'capture', 'tideotter', 1, 95],
    ['q29', 'Fio elétrico', 'Fabrique 2 Selos Aurora', 'craft', 'aurora', 2, 120],
    ['q30', 'A trilha de Bram', 'Converse com Bram na Costa', 'talk', 'bram2', 1, 80],
    ['q31', 'Ossos de pedra', 'Derrote um Ironroot', 'defeat', 'ironroot', 1, 100],
    ['q32', 'Mapa do horizonte', 'Explore as Falésias de Vidro', 'explore', 'falésias', 1, 95],
    ['q33', 'Fungo luminoso', 'Colete 4 cogumelos', 'collect', 'fungo', 4, 82],
    ['q34', 'Chifres ao luar', 'Capture um Aurorhart', 'capture', 'aurorhart', 1, 150],
    ['q35', 'Coração da costa', 'Derrote 5 criaturas da Costa', 'defeatRegion', '2', 5, 110],
    ['q36', 'Base avançada', 'Construa um abrigo costeiro', 'interact', 'shelter2', 1, 105],
    ['q37', 'Mestre de campo', 'Tenha 5 criaturas na equipe', 'team', 'any', 5, 125],
    ['q38', 'Prisma perfeito', 'Fabrique 3 Cápsulas Prisma', 'craft', 'prism', 3, 105],
    ['q39', 'Última luz', 'Converse com Cael', 'talk', 'cael', 1, 130],
    ['q40', 'Além do mapa', 'Complete 30 missões', 'meta', 'any', 30, 220],
  ].map(([id, title, text, type, target, amount, reward]) => ({ id, region: 2, title, text, type, target, amount, reward })),
];

const state = {
  region: 1,
  day: 1,
  time: 8 * 60,
  player: { x: 440, y: 870, hp: 100, maxHp: 100, hunger: 100, water: 100, energy: 100, level: 1, xp: 0, attribute: 0, technique: 0, dirX: 1, dirY: 0, dodge: 0 },
  inventory: { fibra: 10, mineral: 4, cristal: 0, água: 4, aurora: 0, fungo: 0, meal: 1, capsule: 5, prism: 0, auroraSeal: 0 },
  team: [], selectedCapsule: 'capsule',
  counters: { collected: {}, captured: {}, defeated: {}, crafted: {}, talked: {}, explored: {}, interacted: {}, defeatedRegion: {} },
  completed: [],
  discoveredAreas: ['camp'],
  creatures: [],
};

function makeCreature(index, region, x, y, speciesIndex, temperament = 'calm') {
  const data = species[speciesIndex % species.length];
  return { id: `${region}-${index}-${data.id}`, species: data.id, region, x, y, hp: data.maxHp, maxHp: data.maxHp, level: data.level + (region === 2 ? 2 : 0), state: 'idle', temperament, phase: Math.random() * TAU, hitFlash: 0, captured: false, respawn: 0 };
}

state.creatures = [
  makeCreature(1, 1, 770, 780, 1), makeCreature(2, 1, 930, 570, 2, 'territorial'), makeCreature(3, 1, 1080, 1010, 3),
  makeCreature(4, 1, 1220, 520, 4, 'shy'), makeCreature(5, 1, 585, 1140, 5, 'alert'), makeCreature(6, 1, 1120, 1320, 9),
  makeCreature(7, 1, 680, 430, 0), makeCreature(8, 1, 1260, 1120, 10), makeCreature(9, 1, 805, 1290, 6),
  makeCreature(10, 1, 360, 580, 7, 'territorial'), makeCreature(11, 1, 1180, 760, 8), makeCreature(12, 1, 1030, 380, 11, 'shy'),
  makeCreature(13, 2, 1650, 820, 3), makeCreature(14, 2, 1900, 570, 5, 'alert'), makeCreature(15, 2, 2080, 1040, 6),
  makeCreature(16, 2, 2310, 640, 7, 'territorial'), makeCreature(17, 2, 2490, 1160, 8), makeCreature(18, 2, 2720, 850, 9),
  makeCreature(19, 2, 1530, 420, 10), makeCreature(20, 2, 1840, 1250, 11, 'shy'), makeCreature(21, 2, 2210, 360, 0),
  makeCreature(22, 2, 2440, 430, 2), makeCreature(23, 2, 2680, 1280, 4), makeCreature(24, 2, 2010, 760, 1),
];

const npcs = [
  { id: 'nara', name: 'Nara', role: 'cartógrafa', x: 470, y: 760, region: 1, lines: ['A fronteira muda quando alguém presta atenção.', 'Marque as clareiras no seu diário e o caminho aparece.'] },
  { id: 'bram', name: 'Bram', role: 'artesão', x: 610, y: 835, region: 1, lines: ['Mineral e fibra. Duas coisas simples que viram uma boa cápsula.', 'Se encontrar cristal azul, guarde. A Costa Aurora cobra caro por ele.'] },
  { id: 'yara', name: 'Yara', role: 'bióloga de campo', x: 1010, y: 620, region: 1, lines: ['Não confunda criatura assustada com criatura fraca.', 'Aproxime-se devagar, enfraqueça e ofereça uma cápsula justa.'] },
  { id: 'ivo', name: 'Ivo', role: 'cozinheiro errante', x: 1760, y: 940, region: 2, lines: ['A Costa tem água por todo lado, mas nenhuma gota chega sozinha à panela.', 'Um monstrinho bem alimentado trabalha e luta melhor.'] },
  { id: 'bram2', name: 'Bram', role: 'artesão avançado', x: 2180, y: 1190, region: 2, lines: ['A maré deixa cristais expostos por poucos minutos.', 'Faça sua coleta antes que a luz mude.'] },
  { id: 'cael', name: 'Cael', role: 'guardião do farol', x: 2530, y: 590, region: 2, lines: ['O farol não aponta para um lugar. Aponta para uma escolha.', 'Há mais fronteira depois do que o mapa admite.'] },
];

const props = [];
const addProp = (type, x, y, region, resource = null, amount = 1) => props.push({ type, x, y, region, resource, amount, collected: false, phase: Math.random() * TAU });
[
  ['tree', 240, 280], ['tree', 420, 350], ['tree', 620, 260], ['pine', 820, 260], ['tree', 1040, 300], ['flowerTree', 1260, 310], ['tree', 1280, 1450],
  ['rock', 300, 1110, 'mineral', 2], ['rock', 720, 1120, 'mineral', 1], ['stone', 900, 450, 'mineral', 2], ['crystal', 1120, 1160, 'cristal', 1], ['ore', 1190, 320, 'mineral', 2],
  ['berry', 355, 920, 'fibra', 2], ['berry', 880, 970, 'fibra', 2], ['aurora', 1160, 640, 'aurora', 1], ['mushroom', 740, 500, 'fungo', 1],
  ['tree', 1510, 260], ['pine', 1740, 300], ['flowerTree', 1960, 250], ['tree', 2210, 280], ['pine', 2490, 300], ['tree', 2730, 300],
  ['rock', 1540, 1190, 'mineral', 2], ['stone', 1820, 480, 'mineral', 2], ['crystal', 1940, 1160, 'cristal', 2], ['ore', 2240, 520, 'mineral', 3], ['rock', 2600, 1020, 'mineral', 2],
  ['berry', 1610, 670, 'água', 2], ['berry', 2050, 880, 'água', 2], ['aurora', 2330, 1200, 'aurora', 2], ['mushroom', 2700, 620, 'fungo', 2],
].forEach((item) => {
  const [type, x, y, resource, amount] = item;
  addProp(type, x, y, x >= WORLD.split ? 2 : 1, resource || null, amount || 1);
});
addProp('cabin', 500, 810, 1); addProp('campfire', 540, 940, 1, 'campfire', 1); addProp('sign', 690, 720, 1);
addProp('gate', 1375, 860, 1, 'gate', 1); addProp('cabin', 1840, 970, 2); addProp('lighthouse', 2520, 530, 2, 'lighthouse', 1); addProp('sign', 1480, 730, 2);
addProp('ruins', 1080, 1480, 1, 'ruinas', 1); addProp('shelter', 2320, 1340, 2, 'shelter2', 1); addProp('cliffs', 2470, 1450, 2, 'falésias', 1);

const areas = [
  { id: 'camp', name: 'Acampamento Íris', region: 1, x: 430, y: 820, radius: 210 },
  { id: 'campinas', name: 'Campinas do Véu', region: 1, x: 800, y: 700, radius: 360 },
  { id: 'clareira', name: 'Clareira Aurora', region: 1, x: 1160, y: 520, radius: 210 },
  { id: 'ruinas', name: 'Ruínas do Sol', region: 1, x: 1080, y: 1480, radius: 180 },
  { id: 'costa', name: 'Costa Aurora', region: 2, x: 1750, y: 840, radius: 400 },
  { id: 'falésias', name: 'Falésias de Vidro', region: 2, x: 2490, y: 1340, radius: 360 },
];

const input = { up: false, down: false, left: false, right: false, attack: false, capture: false, interact: false, dodge: false, sprint: false };
const touch = { x: 0, y: 0, active: false };
const camera = { x: 0, y: 0 };
const effects = [];
let lastTime = performance.now();
let attackCooldown = 0;
let captureCooldown = 0;
let interactCooldown = 0;
let bannerTimer = 0;
let currentArea = '';

loadSave();
bindUI();
resize();
requestAnimationFrame(loop);

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

function bindUI() {
  const keyMap = { w: 'up', ArrowUp: 'up', s: 'down', ArrowDown: 'down', a: 'left', ArrowLeft: 'left', d: 'right', ArrowRight: 'right', Shift: 'sprint' };
  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (keyMap[key]) { input[keyMap[key]] = true; event.preventDefault(); }
    if (key === 'j' || key === '1') input.attack = true;
    if (key === 'c') input.capture = true;
    if (key === 'e') input.interact = true;
    if (key === ' ') { input.dodge = true; event.preventDefault(); }
    if (key === '2') selectCapsule('prism');
    if (key === '3') selectCapsule('aurora');
    if (key === 'b') openModal('craftModal');
    if (key === 'm') openModal('mapModal');
    if (key === 'Escape') closeAllModals();
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (keyMap[key]) input[keyMap[key]] = false;
    if (key === 'j' || key === '1') input.attack = false;
    if (key === 'c') input.capture = false;
    if (key === 'e') input.interact = false;
    if (key === ' ') input.dodge = false;
  });
  document.querySelectorAll('[data-action]').forEach((button) => {
    const action = button.dataset.action;
    button.addEventListener('pointerdown', () => { input[action] = true; });
    button.addEventListener('pointerup', () => { input[action] = false; });
    button.addEventListener('pointerleave', () => { input[action] = false; });
  });
  const joystick = document.querySelector('#joystick');
  const stick = document.querySelector('#stick');
  const resetStick = () => { touch.x = 0; touch.y = 0; touch.active = false; stick.style.transform = 'translate(0, 0)'; };
  joystick.addEventListener('pointerdown', (event) => { joystick.setPointerCapture(event.pointerId); touch.active = true; moveStick(event); });
  joystick.addEventListener('pointermove', (event) => { if (touch.active) moveStick(event); });
  joystick.addEventListener('pointerup', resetStick); joystick.addEventListener('pointercancel', resetStick); joystick.addEventListener('pointerleave', (event) => { if (event.buttons === 0) resetStick(); });
  function moveStick(event) {
    const rect = joystick.getBoundingClientRect(); const radius = rect.width * .31;
    let dx = event.clientX - (rect.left + rect.width / 2); let dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy); if (length > radius) { dx = dx / length * radius; dy = dy / length * radius; }
    touch.x = dx / radius; touch.y = dy / radius; stick.style.transform = `translate(${dx}px, ${dy}px)`;
  }
  document.querySelector('#craftButton').addEventListener('click', () => { renderCraft(); openModal('craftModal'); });
  document.querySelector('#questButton').addEventListener('click', () => { renderQuestBook(); openModal('dialogModal'); });
  document.querySelector('#mapButton').addEventListener('click', () => { drawBigMap(); openModal('mapModal'); });
  document.querySelector('#menuButton').addEventListener('click', () => openModal('menuModal'));
  document.querySelector('#saveButton').addEventListener('click', () => { saveGame(); toast('Progresso salvo neste dispositivo.', 'gold'); });
  document.querySelector('#resetButton').addEventListener('click', () => { if (confirm('Começar uma nova expedição? O progresso local será apagado.')) { localStorage.removeItem(SAVE_KEY); location.reload(); } });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('.modal').forEach((modal) => modal.addEventListener('pointerdown', (event) => { if (event.target === modal) modal.classList.add('hidden'); }));
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, .05); lastTime = now;
  update(dt); render(); requestAnimationFrame(loop);
}

function update(dt) {
  if (loadedAssets >= 2) document.querySelector('#loadingScreen').classList.add('ready');
  const p = state.player;
  attackCooldown = Math.max(0, attackCooldown - dt); captureCooldown = Math.max(0, captureCooldown - dt); interactCooldown = Math.max(0, interactCooldown - dt); p.dodge = Math.max(0, p.dodge - dt);
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0) + touch.x;
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0) + touch.y;
  const length = Math.hypot(dx, dy);
  if (length > .08) {
    dx /= length; dy /= length; p.dirX = dx; p.dirY = dy;
    const speed = (input.sprint || touch.active && Math.hypot(touch.x, touch.y) > .86) ? 280 : 185;
    p.x = clamp(p.x + dx * speed * dt, 60, WORLD.width - 60); p.y = clamp(p.y + dy * speed * dt, 110, WORLD.height - 70);
    p.energy = clamp(p.energy - (speed > 200 ? 8 : 3) * dt, 0, 100);
  } else p.energy = clamp(p.energy + 13 * dt, 0, 100);
  p.hunger = clamp(p.hunger - dt * .12, 0, 100); p.water = clamp(p.water - dt * .17, 0, 100);
  if (p.hunger <= 0 || p.water <= 0) p.hp = clamp(p.hp - dt * 1.5, 1, p.maxHp);
  if (input.attack && attackCooldown <= 0) { attack(); input.attack = false; }
  if (input.capture && captureCooldown <= 0) { capture(); input.capture = false; }
  if (input.interact && interactCooldown <= 0) { interact(); input.interact = false; }
  if (input.dodge && p.energy >= 20 && p.dodge <= 0) { p.x = clamp(p.x + p.dirX * 105, 60, WORLD.width - 60); p.y = clamp(p.y + p.dirY * 105, 110, WORLD.height - 70); p.energy -= 20; p.dodge = .45; input.dodge = false; effects.push({ x: p.x, y: p.y, life: .4, max: .4, color: '#c7fff2' }); }
  updateCreatures(dt); updateEffects(dt); updateArea(); updateCamera(); updateHud(); updateClock(); checkQuests();
}

function updateCreatures(dt) {
  const p = state.player;
  state.creatures.forEach((creature) => {
    if (creature.captured) { creature.respawn -= dt; return; }
    creature.hitFlash = Math.max(0, creature.hitFlash - dt);
    creature.phase += dt * (creature.temperament === 'alert' ? 1.9 : 1.2);
    const distance = Math.hypot(p.x - creature.x, p.y - creature.y);
    const wander = creature.temperament === 'shy' && distance < 200 ? -1 : 1;
    if (creature.state === 'enraged' && distance < 260) { const vx = (p.x - creature.x) / Math.max(distance, 1); const vy = (p.y - creature.y) / Math.max(distance, 1); creature.x += vx * dt * 45; creature.y += vy * dt * 45; }
    else if (Math.random() < dt * .55) { const angle = creature.phase + creature.id.length; creature.x += Math.cos(angle) * dt * 14 * wander; creature.y += Math.sin(angle) * dt * 14 * wander; }
    creature.x = clamp(creature.x, creature.region === 1 ? 100 : WORLD.split + 70, creature.region === 1 ? WORLD.split - 80 : WORLD.width - 70);
    creature.y = clamp(creature.y, 150, WORLD.height - 100);
    if (creature.state === 'enraged' && distance < 55 && Math.random() < dt * .35) { p.hp = clamp(p.hp - 7, 1, p.maxHp); toast(`${speciesById(creature.species).name} revidou!`, 'danger'); }
  });
}
function updateEffects(dt) { for (let i = effects.length - 1; i >= 0; i -= 1) { effects[i].life -= dt; if (effects[i].life <= 0) effects.splice(i, 1); } }
function updateArea() {
  const p = state.player; const area = areas.find((entry) => entry.region === state.region && Math.hypot(entry.x - p.x, entry.y - p.y) <= entry.radius);
  if (area && area.id !== currentArea) { currentArea = area.id; if (!state.discoveredAreas.includes(area.id)) { state.discoveredAreas.push(area.id); toast(`Área descoberta: ${area.name}`, 'gold'); } showAreaBanner(area.name); }
  const nextRegion = p.x >= WORLD.split ? 2 : 1;
  if (nextRegion !== state.region) {
    if (state.completed.length >= 15 || state.region === 2) { state.region = nextRegion; toast(nextRegion === 2 ? 'A passagem abriu: Costa Aurora.' : 'Você voltou ao Vale Verde.', 'gold'); }
    else { p.x = WORLD.split - 35; }
  }
}
function updateCamera() { camera.x += (clamp(state.player.x - window.innerWidth / 2, 0, WORLD.width - window.innerWidth) - camera.x) * .12; camera.y += (clamp(state.player.y - window.innerHeight / 2, 0, WORLD.height - window.innerHeight) - camera.y) * .12; }
function updateClock() { state.time += .02; if (state.time >= 1440) { state.time -= 1440; state.day += 1; } const hours = Math.floor(state.time / 60).toString().padStart(2, '0'); const mins = Math.floor(state.time % 60).toString().padStart(2, '0'); document.querySelector('#clockBadge').textContent = `DIA ${state.day} · ${hours}:${mins}`; }

function render() {
  const width = window.innerWidth; const height = window.innerHeight; ctx.clearRect(0, 0, width, height);
  ctx.save(); ctx.translate(-camera.x, -camera.y); drawWorld(width, height); ctx.restore(); drawMiniMap();
}
function drawWorld(width, height) {
  const visibleLeft = camera.x - 20; const visibleRight = camera.x + width + 20;
  drawRegionGround(0, WORLD.split, 1, visibleLeft, visibleRight); drawRegionGround(WORLD.split, WORLD.width, 2, visibleLeft, visibleRight);
  ctx.save(); ctx.globalAlpha = .32; ctx.strokeStyle = '#7be4c6'; ctx.lineWidth = 2; ctx.setLineDash([6, 13]); ctx.beginPath(); ctx.moveTo(WORLD.split, 0); ctx.lineTo(WORLD.split, WORLD.height); ctx.stroke(); ctx.restore();
  const renderables = [
    ...props.filter((prop) => !prop.collected && prop.region === state.region),
    ...npcs.filter((npc) => npc.region === state.region),
    ...state.creatures.filter((creature) => !creature.captured && creature.region === state.region),
    { type: 'player', x: state.player.x, y: state.player.y, region: state.region },
  ].sort((a, b) => a.y - b.y);
  renderables.forEach((object) => { if (object.type === 'player') drawPlayer(object); else if (object.role) drawNpc(object); else if (object.species) drawCreature(object); else drawProp(object); });
  drawEffects(); if (state.region === 1 && state.completed.length < 15) drawGateHint();
}
function drawRegionGround(left, right, region, visibleLeft, visibleRight) {
  if (right < visibleLeft || left > visibleRight) return;
  const gradient = ctx.createLinearGradient(left, 0, right, WORLD.height);
  if (region === 1) { gradient.addColorStop(0, '#153d35'); gradient.addColorStop(.48, '#1c5546'); gradient.addColorStop(1, '#102f36'); }
  else { gradient.addColorStop(0, '#203f4f'); gradient.addColorStop(.48, '#18576a'); gradient.addColorStop(1, '#142f52'); }
  ctx.fillStyle = gradient; ctx.fillRect(left, 0, right - left, WORLD.height);
  ctx.save(); ctx.beginPath(); ctx.rect(left, 0, right - left, WORLD.height); ctx.clip();
  const seed = region * 811;
  for (let i = 0; i < 115; i += 1) { const x = left + ((i * 173 + seed * 7) % (right - left)); const y = 120 + ((i * 97 + seed * 3) % 1530); ctx.fillStyle = region === 1 ? (i % 3 === 0 ? 'rgba(122,218,127,.13)' : 'rgba(32,128,112,.16)') : (i % 3 === 0 ? 'rgba(105,206,224,.14)' : 'rgba(47,128,166,.17)'); ctx.beginPath(); ctx.ellipse(x, y, 20 + (i % 7) * 4, 7 + (i % 4) * 2, i, 0, TAU); ctx.fill(); }
  ctx.restore();
  drawPath(region === 1 ? '#6d5b42' : '#5a6276', region === 1 ? '#9b774c' : '#6f9bb0', left + 180, 880, right - 160, 930, 54);
  if (region === 2) drawWaterline(left + 80, 220, right - 120, 270);
  ctx.fillStyle = region === 1 ? 'rgba(216,201,137,.24)' : 'rgba(153,231,246,.25)'; ctx.font = '900 18px Inter, sans-serif'; ctx.fillText(region === 1 ? 'VALE VERDE' : 'COSTA AURORA', left + 80, 155);
  areas.filter((area) => area.region === region).forEach((area) => { ctx.save(); ctx.globalAlpha = .6; ctx.strokeStyle = region === 1 ? 'rgba(245,211,119,.22)' : 'rgba(133,220,243,.22)'; ctx.setLineDash([4, 12]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(area.x, area.y, area.radius, 0, TAU); ctx.stroke(); ctx.restore(); });
}
function drawPath(color, edge, x1, y1, x2, y2, width) { ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + 180, y1 - 80, x2 - 180, y2 + 80, x2, y2); ctx.stroke(); ctx.strokeStyle = edge; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
function drawWaterline(x1, y1, x2, y2) { ctx.save(); ctx.strokeStyle = 'rgba(126,226,239,.22)'; ctx.lineWidth = 82; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo(x1 + 220, y1 + 45, x2 - 200, y2 - 40, x2, y2); ctx.stroke(); ctx.strokeStyle = 'rgba(193,248,248,.35)'; ctx.lineWidth = 2; ctx.setLineDash([8, 13]); ctx.stroke(); ctx.restore(); }

function drawProp(prop) {
  const cell = envCell(prop.type); if (!cell || !assets.environment.complete) return;
  const sizes = { tree: 118, pine: 108, flowerTree: 122, log: 98, rock: 88, stone: 90, crystal: 88, ore: 88, berry: 72, aurora: 80, mushroom: 72, campfire: 82, sign: 70, cabin: 175, gate: 180, lighthouse: 160, ruins: 190, shelter: 160, cliffs: 190 };
  const size = sizes[prop.type] || 80; const bob = prop.type === 'aurora' || prop.type === 'campfire' ? Math.sin(performance.now() / 400 + prop.phase) * 3 : 0;
  drawAtlas(assets.environment, 4, 4, cell[0], cell[1], prop.x, prop.y + bob, size, size, false, prop.type === 'aurora' ? .92 : 1);
  if (prop.resource && !['campfire', 'gate', 'ruinas', 'lighthouse', 'shelter2'].includes(prop.resource)) { ctx.save(); ctx.fillStyle = '#e9fbf5'; ctx.globalAlpha = .7; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`+${prop.amount}`, prop.x, prop.y - size * .35); ctx.restore(); }
}
function drawNpc(npc) { drawAtlas(assets.environment, 4, 4, 1, 3, npc.x, npc.y, 76, 76, false, 1); label(npc.x, npc.y - 54, npc.name, npc.role, '#f1c45e'); }
function drawCreature(creature) { const data = speciesById(creature.species); const bob = Math.sin(creature.phase) * 3; const size = creature.level >= 9 ? 108 : 92; ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = '#061b1e'; ctx.beginPath(); ctx.ellipse(creature.x, creature.y + 30, size * .31, size * .11, 0, 0, TAU); ctx.fill(); ctx.restore(); drawAtlas(assets.creatures, 4, 3, data.atlas[0], data.atlas[1], creature.x, creature.y - bob, size, size, creature.hitFlash > 0, 1); label(creature.x, creature.y - size * .55, data.name, `Lv. ${creature.level} · ${data.element}`, data.color); if (creature.hp < creature.maxHp) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(creature.x - 32, creature.y + 39, 64, 5); ctx.fillStyle = '#ff8090'; ctx.fillRect(creature.x - 32, creature.y + 39, 64 * Math.max(0, creature.hp / creature.maxHp), 5); } }
function drawPlayer() { const p = state.player; const bob = Math.sin(performance.now() / 180) * 2; ctx.save(); ctx.globalAlpha = .34; ctx.fillStyle = '#031417'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 32, 31, 10, 0, 0, TAU); ctx.fill(); ctx.restore(); drawAtlas(assets.creatures, 4, 3, 0, 0, p.x, p.y - bob, 108, 108, false, 1); label(p.x, p.y - 70, 'Lúmion', `HP ${Math.ceil(p.hp)}/${p.maxHp}`, '#64e7d5'); if (state.team.length) { ctx.save(); ctx.strokeStyle = 'rgba(100,231,213,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y + 2, 43, 0, TAU); ctx.stroke(); ctx.restore(); } }
function drawEffects() { effects.forEach((effect) => { const progress = 1 - effect.life / effect.max; ctx.save(); ctx.globalAlpha = Math.max(0, effect.life / effect.max); ctx.strokeStyle = effect.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(effect.x, effect.y, 20 + progress * 65, 0, TAU); ctx.stroke(); ctx.restore(); }); }
function drawGateHint() { const gate = props.find((prop) => prop.type === 'gate'); if (!gate) return; const distance = Math.hypot(state.player.x - gate.x, state.player.y - gate.y); if (distance < 230) { ctx.save(); ctx.fillStyle = '#f1c45e'; ctx.font = '900 12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`PORTÃO · ${Math.max(0, 15 - state.completed.length)} missões restantes`, gate.x, gate.y - 115); ctx.restore(); } }
function drawAtlas(image, cols, rows, col, row, x, y, width, height, flash = false, alpha = 1) { if (!image.complete || !image.naturalWidth) return; const sw = image.naturalWidth / cols; const sh = image.naturalHeight / rows; ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha; if (flash) ctx.filter = 'brightness(2) saturate(.4)'; ctx.drawImage(image, col * sw, row * sh, sw, sh, -width / 2, -height / 2, width, height); ctx.restore(); }
function label(x, y, title, subtitle, color) { ctx.save(); ctx.textAlign = 'center'; ctx.font = '900 12px Inter, sans-serif'; const titleWidth = ctx.measureText(title).width; ctx.font = '700 9px Inter, sans-serif'; const subtitleWidth = ctx.measureText(subtitle).width; const width = Math.max(titleWidth, subtitleWidth) + 18; ctx.fillStyle = 'rgba(5,22,27,.86)'; roundedRect(ctx, x - width / 2, y - 22, width, 34, 9); ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = color; ctx.font = '900 12px Inter, sans-serif'; ctx.fillText(title, x, y - 8); ctx.fillStyle = '#c4e8df'; ctx.font = '700 9px Inter, sans-serif'; ctx.fillText(subtitle, x, y + 7); ctx.restore(); }
function roundedRect(context, x, y, width, height, radius) { context.beginPath(); context.roundRect(x, y, width, height, radius); }
function envCell(type) { const cells = { tree: [0, 0], pine: [1, 0], flowerTree: [2, 0], log: [3, 0], rock: [0, 1], stone: [1, 1], crystal: [2, 1], ore: [3, 1], berry: [0, 2], aurora: [1, 2], mushroom: [2, 2], campfire: [3, 2], sign: [0, 3], cabin: [2, 3], gate: [3, 3], lighthouse: [3, 3], ruins: [1, 3], shelter: [2, 3], cliffs: [1, 3] }; return cells[type]; }
function speciesById(id) { return species.find((entry) => entry.id === id) || species[0]; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function nearestCreature(maxDistance = 180) { let best = null; let bestDistance = maxDistance; state.creatures.forEach((creature) => { if (creature.captured || creature.region !== state.region) return; const distance = Math.hypot(creature.x - state.player.x, creature.y - state.player.y); if (distance < bestDistance) { best = creature; bestDistance = distance; } }); return best; }
function nearestNpc(maxDistance = 120) { return npcs.filter((npc) => npc.region === state.region).map((npc) => ({ npc, distance: Math.hypot(npc.x - state.player.x, npc.y - state.player.y) })).sort((a, b) => a.distance - b.distance).find((entry) => entry.distance <= maxDistance); }
function nearestProp(maxDistance = 120) { return props.filter((prop) => !prop.collected && prop.region === state.region).map((prop) => ({ prop, distance: Math.hypot(prop.x - state.player.x, prop.y - state.player.y) })).sort((a, b) => a.distance - b.distance).find((entry) => entry.distance <= maxDistance); }

function attack() { const target = nearestCreature(165); if (!target) { toast('Nenhum alvo ao alcance.', 'danger'); return; } const data = speciesById(target.species); const damage = 22 + state.player.level * 4; target.hp = clamp(target.hp - damage, 0, target.maxHp); target.hitFlash = .16; target.state = 'enraged'; attackCooldown = .36; effects.push({ x: target.x, y: target.y, life: .22, max: .22, color: '#ffd36b' }); if (target.hp <= 0) { target.captured = true; target.respawn = 42; increment('defeated', target.species); increment('defeatedRegion', String(target.region)); state.inventory[data.drop] = (state.inventory[data.drop] || 0) + 1; gainXp(18 + data.level * 2); toast(`${data.name} derrotado. +1 ${data.drop}.`, 'gold'); } else toast(`${data.name} recebeu ${damage} de dano.`); }
function capture() { const target = nearestCreature(190); if (!target) { toast('Aproxime-se de um monstrinho.', 'danger'); return; } const capsule = capsuleData.find((entry) => entry.id === state.selectedCapsule); const inventoryKey = capsule.id === 'aurora' ? 'auroraSeal' : capsule.id; if (!isUnlocked(capsule) || (state.inventory[inventoryKey] || 0) <= 0) { toast('Você não possui esse item de captura.', 'danger'); return; } state.inventory[inventoryKey] -= 1; const data = speciesById(target.species); const hpFactor = 1 - target.hp / target.maxHp; const chance = clamp(.12 + hpFactor * .66 + capsule.bonus + (state.player.level - target.level) * .01, .04, .94); captureCooldown = .7; effects.push({ x: target.x, y: target.y, life: .55, max: .55, color: capsule.id === 'aurora' ? '#ffe381' : '#77e9df' }); if (Math.random() < chance) { target.captured = true; target.respawn = 90; state.team.push(target.species); increment('captured', target.species); gainXp(30 + data.level * 4); toast(`${data.name} entrou para sua equipe!`, 'gold'); } else { target.state = 'enraged'; target.hp = clamp(target.hp - 8, 1, target.maxHp); toast(`A captura falhou (${Math.round(chance * 100)}%). Enfraqueça mais.`, 'danger'); } }

function interact() {
  const npcTarget = nearestNpc();
  if (npcTarget) { const npc = npcTarget.npc; increment('talked', npc.id); const line = npc.lines[Math.floor(state.time) % npc.lines.length]; openDialog(npc.name, npc.role, line, `Conversa registrada no diário · +${npc.id === 'nara' ? 6 : 4} XP`); gainXp(4); interactCooldown = .5; return; }
  const target = nearestProp(145); if (!target) { toast('Nada interativo por perto.'); return; }
  const prop = target.prop;
  if (prop.type === 'gate') { if (state.completed.length < 15) toast(`O Portão Aurora exige 15 missões. Faltam ${15 - state.completed.length}.`, 'danger'); else { state.player.x = WORLD.split + 45; state.region = 2; toast('Costa Aurora desbloqueada!', 'gold'); } interactCooldown = .8; return; }
  if (prop.resource === 'campfire') { increment('interacted', 'campfire'); if (state.inventory.meal < 1) state.inventory.meal += 1; toast('A fogueira preparou uma refeição.'); interactCooldown = .6; return; }
  if (prop.resource === 'gate') return;
  if (prop.resource === 'ruinas' || prop.resource === 'lighthouse' || prop.resource === 'shelter2' || prop.resource === 'falésias') { increment('interacted', prop.resource); increment('explored', prop.resource); toast(prop.resource === 'lighthouse' ? 'Farol antigo ativado.' : 'Local registrado no mapa.', 'gold'); interactCooldown = .7; return; }
  if (prop.resource) { state.inventory[prop.resource] = (state.inventory[prop.resource] || 0) + prop.amount; increment('collected', prop.resource, prop.amount); prop.collected = true; toast(`+${prop.amount} ${prop.resource}`, 'gold'); interactCooldown = .35; return; }
  toast('Você examinou o local.'); interactCooldown = .5;
}
function eat() { if (state.inventory.meal <= 0) { toast('Sem refeição. Visite uma fogueira.', 'danger'); return; } state.inventory.meal -= 1; state.player.hunger = clamp(state.player.hunger + 35, 0, 100); state.player.water = clamp(state.player.water + 15, 0, 100); toast('Refeição consumida.'); }
function craft(itemId) { const recipes = { capsule: { name: 'Cápsula Íris', cost: { fibra: 3, mineral: 1 }, output: 'capsule' }, prism: { name: 'Cápsula Prisma', cost: { cristal: 2, mineral: 2 }, output: 'prism' }, aurora: { name: 'Selo Aurora', cost: { cristal: 5, fibra: 4 }, output: 'auroraSeal' }, meal: { name: 'Refeição quente', cost: { fibra: 2, água: 1 }, output: 'meal' } }; const recipe = recipes[itemId]; if (!recipe || !canPay(recipe.cost)) { toast('Faltam materiais para esta receita.', 'danger'); return; } Object.entries(recipe.cost).forEach(([key, amount]) => { state.inventory[key] -= amount; }); state.inventory[recipe.output] = (state.inventory[recipe.output] || 0) + 1; increment('crafted', itemId); gainXp(8); toast(`${recipe.name} fabricada.`, 'gold'); renderCraft(); }
function canPay(cost) { return Object.entries(cost).every(([key, amount]) => (state.inventory[key] || 0) >= amount); }
function selectCapsule(id) { const capsule = capsuleData.find((entry) => entry.id === id); if (!capsule || !isUnlocked(capsule)) { toast(`Desbloqueie este item com ${capsule?.unlock || 0} missões.`, 'danger'); return; } state.selectedCapsule = id; updateHud(); }
function isUnlocked(capsule) { return state.completed.length >= capsule.unlock; }
function increment(group, key, amount = 1) { const bucket = state.counters[group] || (state.counters[group] = {}); bucket[key] = (bucket[key] || 0) + amount; }
function gainXp(amount) { state.player.xp += amount; const required = xpRequired(); if (state.player.xp >= required) { state.player.xp -= required; state.player.level += 1; state.player.attribute += 1; state.player.technique += 1; state.player.maxHp += 12; state.player.hp = state.player.maxHp; toast(`Nível ${state.player.level}! Atributo e técnica +1.`, 'gold'); } }
function xpRequired() { return 100 + state.player.level * 20; }

function questProgress(quest) { const c = state.counters; let value = 0; if (quest.type === 'collect') value = c.collected[quest.target] || 0; if (quest.type === 'capture') value = quest.target === 'any' ? Object.values(c.captured).reduce((sum, n) => sum + n, 0) : c.captured[quest.target] || 0; if (quest.type === 'defeat') value = quest.target === 'any' ? Object.values(c.defeated).reduce((sum, n) => sum + n, 0) : c.defeated[quest.target] || 0; if (quest.type === 'defeatLevel') value = Object.keys(c.defeated).reduce((sum, id) => sum + (speciesById(id).level >= Number(quest.target) ? c.defeated[id] : 0), 0); if (quest.type === 'defeatRegion') value = c.defeatedRegion[quest.target] || 0; if (quest.type === 'talk') value = c.talked[quest.target] || 0; if (quest.type === 'team') value = state.team.length; if (quest.type === 'craft') value = c.crafted[quest.target] || 0; if (quest.type === 'explore') value = c.explored[quest.target] || (state.discoveredAreas.includes(quest.target) ? 1 : 0); if (quest.type === 'interact') value = c.interacted[quest.target] || 0; if (quest.type === 'meta') value = state.completed.length; return Math.min(quest.amount, value); }
function checkQuests() { questCatalog.forEach((quest) => { if (state.completed.includes(quest.id)) return; if (questProgress(quest) >= quest.amount) { state.completed.push(quest.id); state.inventory.água += Math.ceil(quest.reward / 40); gainXp(quest.reward); toast(`Missão concluída: ${quest.title}`, 'gold'); } }); }

function updateHud() {
  const p = state.player; const setBar = (id, value) => { const element = document.querySelector(id); if (element) element.style.width = `${clamp(value, 0, 100)}%`; };
  document.querySelector('#levelLabel').textContent = `Lv. ${p.level}`; document.querySelector('#hpLabel').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`; document.querySelector('#hungerLabel').textContent = `${Math.ceil(p.hunger)}%`; document.querySelector('#waterLabel').textContent = `${Math.ceil(p.water)}%`; document.querySelector('#energyLabel').textContent = `${Math.ceil(p.energy)}%`; setBar('#hpBar', p.hp / p.maxHp * 100); setBar('#hungerBar', p.hunger); setBar('#waterBar', p.water); setBar('#energyBar', p.energy); setBar('#xpBar', p.xp / xpRequired() * 100); document.querySelector('#xpLabel').textContent = `${Math.floor(p.xp)} / ${xpRequired()}`; document.querySelector('#attributePoints').textContent = p.attribute; document.querySelector('#techPoints').textContent = p.technique; document.querySelector('#regionBadge').textContent = state.region === 1 ? 'VALE VERDE' : 'COSTA AURORA';
  const target = nearestCreature(280); const targetData = target && speciesById(target.species); document.querySelector('#targetName').textContent = targetData?.name || 'Nenhum alvo'; document.querySelector('#targetLevel').textContent = target ? `Lv. ${target.level}` : '—'; document.querySelector('#targetHpBar').style.width = target ? `${target.hp / target.maxHp * 100}%` : '0'; document.querySelector('#targetHint').textContent = target ? `${targetData.element} · ${Math.round(Math.hypot(target.x - p.x, target.y - p.y))}m · ${target.hp}/${target.maxHp} HP` : 'Explore e aproxime-se de um monstrinho.';
  const area = areas.find((entry) => entry.id === currentArea); document.querySelector('#areaLabel').textContent = area?.name || (state.region === 1 ? 'Vale Verde' : 'Costa Aurora'); renderActiveQuests(); renderInventory(); renderCapsules();
}
function renderActiveQuests() { const container = document.querySelector('#activeQuestList'); const current = questCatalog.filter((quest) => quest.region <= state.region && !state.completed.includes(quest.id)).slice(0, 3); container.innerHTML = current.length ? current.map((quest) => `<div class="quest-item"><strong>${quest.title}</strong><small><span>${quest.text}</span><b>${questProgress(quest)}/${quest.amount}</b></small></div>`).join('') : '<div class="quest-item complete"><strong>Diário limpo</strong><small><span>Explore a próxima fronteira.</span><b>✓</b></small></div>'; }
function renderInventory() { const labels = { fibra: 'Fibra', mineral: 'Minério', cristal: 'Cristal', água: 'Água', aurora: 'Erva', fungo: 'Fungo', meal: 'Refeição', capsule: 'Íris', prism: 'Prisma', auroraSeal: 'Aurora' }; document.querySelector('#inventoryList').innerHTML = Object.entries(labels).map(([key, labelText]) => `<span class="inventory-chip">${labelText}<b>${state.inventory[key] || 0}</b></span>`).join(''); }
function renderCapsules() { document.querySelector('#capsuleButtons').innerHTML = capsuleData.map((capsule) => { const key = capsule.id === 'aurora' ? 'auroraSeal' : capsule.id; const unlocked = isUnlocked(capsule); return `<button class="capsule-button ${state.selectedCapsule === capsule.id ? 'selected' : ''} ${unlocked ? '' : 'locked'}" data-capsule="${capsule.id}" type="button"><i class="capsule-icon"></i><span><strong>${capsule.name}</strong><small>${unlocked ? `bônus +${Math.round(capsule.bonus * 100)}%` : `libera em ${capsule.unlock} missões`}</small></span><em>${state.inventory[key] || 0}</em></button>`; }).join(''); document.querySelectorAll('[data-capsule]').forEach((button) => button.addEventListener('click', () => selectCapsule(button.dataset.capsule))); document.querySelector('#capsuleHint').textContent = `${capsuleData.find((entry) => entry.id === state.selectedCapsule)?.short || 'Íris'} · 2/3 selecionar`; }
function renderCraft() { const recipes = [{ id: 'capsule', name: 'Cápsula Íris', detail: '3 fibra + 1 minério', cost: { fibra: 3, mineral: 1 } }, { id: 'prism', name: 'Cápsula Prisma', detail: '2 cristal + 2 minério', cost: { cristal: 2, mineral: 2 } }, { id: 'aurora', name: 'Selo Aurora', detail: '5 cristal + 4 fibra · libera em 15 missões', cost: { cristal: 5, fibra: 4 } }, { id: 'meal', name: 'Refeição quente', detail: '2 fibra + 1 água', cost: { fibra: 2, água: 1 } }]; document.querySelector('#craftList').innerHTML = recipes.map((recipe) => { const locked = recipe.id === 'aurora' && !isUnlocked(capsuleData[2]); return `<div class="craft-row"><div><strong>${recipe.name}</strong><small>${recipe.detail}</small></div><button type="button" data-craft="${recipe.id}" ${locked || !canPay(recipe.cost) ? 'disabled' : ''}>FABRICAR</button></div>`; }).join(''); document.querySelectorAll('[data-craft]').forEach((button) => button.addEventListener('click', () => craft(button.dataset.craft))); }
function renderQuestBook() { const completed = new Set(state.completed); const list = questCatalog.filter((quest) => quest.region <= state.region).map((quest) => `<div class="quest-item ${completed.has(quest.id) ? 'complete' : ''}"><strong>${completed.has(quest.id) ? '✓ ' : ''}${quest.title}</strong><small><span>${quest.text}</span><b>${completed.has(quest.id) ? 'concluída' : `${questProgress(quest)}/${quest.amount}`}</b></small></div>`).join(''); document.querySelector('#dialogContent').innerHTML = `<div class="dialog-title">Diário de expedição</div><h2>${state.completed.length} de ${questCatalog.length} missões registradas</h2><p>As missões são acompanhadas automaticamente enquanto você explora, captura e constrói sua equipe.</p><div class="quest-list">${list}</div>`; }
function showAreaBanner(name) { const banner = document.querySelector('#areaBanner'); document.querySelector('#areaBannerName').textContent = name; banner.classList.add('show'); clearTimeout(bannerTimer); bannerTimer = setTimeout(() => banner.classList.remove('show'), 2800); }
function toast(message, tone = '') { const stack = document.querySelector('#toastStack'); const element = document.createElement('div'); element.className = `toast ${tone}`; element.textContent = message; stack.appendChild(element); setTimeout(() => element.remove(), 3300); }
function openDialog(name, role, text, reward) { document.querySelector('#dialogContent').innerHTML = `<div class="dialog-title">${role}</div><h2>${name}</h2><p>“${text}”</p><div class="dialog-reward">${reward}</div>`; openModal('dialogModal'); }
function openModal(id) { document.querySelector(`#${id}`).classList.remove('hidden'); }
function closeModal(id) { document.querySelector(`#${id}`).classList.add('hidden'); }
function closeAllModals() { document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden')); }

function drawMiniMap() { const w = miniMap.width; const h = miniMap.height; miniCtx.clearRect(0, 0, w, h); miniCtx.fillStyle = '#0c302f'; miniCtx.fillRect(0, 0, w, h); miniCtx.fillStyle = '#184b42'; miniCtx.fillRect(0, 0, w / 2, h); miniCtx.fillStyle = '#17455b'; miniCtx.fillRect(w / 2, 0, w / 2, h); miniCtx.strokeStyle = 'rgba(176,246,224,.25)'; miniCtx.lineWidth = 2; miniCtx.setLineDash([5, 7]); miniCtx.beginPath(); miniCtx.moveTo(w / 2, 0); miniCtx.lineTo(w / 2, h); miniCtx.stroke(); miniCtx.setLineDash([]); areas.forEach((area) => { miniCtx.fillStyle = area.region === 1 ? '#e7c75e' : '#71d6e3'; miniCtx.globalAlpha = state.discoveredAreas.includes(area.id) ? .8 : .22; miniCtx.beginPath(); miniCtx.arc(area.x / WORLD.width * w, area.y / WORLD.height * h, 4, 0, TAU); miniCtx.fill(); }); miniCtx.globalAlpha = 1; state.creatures.filter((creature) => !creature.captured).forEach((creature) => { miniCtx.fillStyle = '#ed91c4'; miniCtx.beginPath(); miniCtx.arc(creature.x / WORLD.width * w, creature.y / WORLD.height * h, 2.4, 0, TAU); miniCtx.fill(); }); miniCtx.fillStyle = '#f8f4d1'; miniCtx.beginPath(); miniCtx.arc(state.player.x / WORLD.width * w, state.player.y / WORLD.height * h, 4, 0, TAU); miniCtx.fill(); }
function drawBigMap() { const w = bigMap.width; const h = bigMap.height; bigCtx.clearRect(0, 0, w, h); bigCtx.fillStyle = '#0c302f'; bigCtx.fillRect(0, 0, w, h); bigCtx.fillStyle = '#1c5546'; bigCtx.fillRect(0, 0, w / 2, h); bigCtx.fillStyle = '#18576a'; bigCtx.fillRect(w / 2, 0, w / 2, h); bigCtx.fillStyle = 'rgba(227,201,110,.12)'; bigCtx.fillRect(0, 0, w / 2, h); bigCtx.fillStyle = 'rgba(109,231,245,.12)'; bigCtx.fillRect(w / 2, 0, w / 2, h); bigCtx.strokeStyle = 'rgba(206,249,229,.24)'; bigCtx.lineWidth = 3; bigCtx.setLineDash([8, 12]); bigCtx.beginPath(); bigCtx.moveTo(w / 2, 0); bigCtx.lineTo(w / 2, h); bigCtx.stroke(); bigCtx.setLineDash([]); bigCtx.font = '900 20px Inter, sans-serif'; bigCtx.fillStyle = '#c8f9e7'; bigCtx.fillText('VALE VERDE', 25, 38); bigCtx.fillText('COSTA AURORA', w / 2 + 25, 38); areas.forEach((area) => { const x = area.x / WORLD.width * w; const y = area.y / WORLD.height * h; bigCtx.fillStyle = state.discoveredAreas.includes(area.id) ? '#f1c45e' : 'rgba(241,196,94,.3)'; bigCtx.beginPath(); bigCtx.arc(x, y, 8, 0, TAU); bigCtx.fill(); bigCtx.font = '600 13px Inter, sans-serif'; bigCtx.fillText(area.name, x + 14, y + 5); }); bigCtx.fillStyle = '#fff8dc'; bigCtx.beginPath(); bigCtx.arc(state.player.x / WORLD.width * w, state.player.y / WORLD.height * h, 9, 0, TAU); bigCtx.fill(); document.querySelector('#mapLegend').innerHTML = '<span>áreas descobertas</span><span>monstrinhos</span><span>você</span>'; }

function saveGame() { const payload = { ...state, creatures: state.creatures.map(({ id, species, region, x, y, hp, maxHp, state: creatureState, temperament, phase, captured, respawn }) => ({ id, species, region, x, y, hp, maxHp, creatureState, temperament, phase, captured, respawn })) }; localStorage.setItem(SAVE_KEY, JSON.stringify(payload)); }
function loadSave() { try { const saved = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!saved) return; if (saved.player) Object.assign(state.player, saved.player); if (saved.inventory) Object.assign(state.inventory, saved.inventory); if (Array.isArray(saved.team)) state.team = saved.team; if (Array.isArray(saved.completed)) state.completed = saved.completed; if (Array.isArray(saved.discoveredAreas)) state.discoveredAreas = saved.discoveredAreas; if (saved.counters) state.counters = saved.counters; if (saved.region) state.region = saved.region; if (saved.day) state.day = saved.day; if (saved.time) state.time = saved.time; if (Array.isArray(saved.creatures)) saved.creatures.forEach((savedCreature) => { const current = state.creatures.find((creature) => creature.id === savedCreature.id); if (current) Object.assign(current, savedCreature, { state: savedCreature.creatureState || savedCreature.state || 'idle' }); }); } catch (error) { console.warn('Save inválido ignorado', error); } }
setInterval(saveGame, 5000);
setInterval(() => { if (state.inventory.meal > 0 && (state.player.hunger < 25 || state.player.water < 20)) eat(); }, 8000);
