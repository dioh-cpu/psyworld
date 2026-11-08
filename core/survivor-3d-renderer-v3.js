import * as THREE from '../vendor/three-0.164.1.module.min.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const qualityNames = ['low', 'medium', 'high'];
const COMBAT_AREA_FX = new Set(['burst', 'impact', 'deathBurst', 'psyNova', 'psyRainBurst', 'freezeRing', 'stunRing', 'thunderSeal', 'waterCast', 'windCast', 'meteorWarning', 'voidOpen', 'heartBurst', 'shieldGrant', 'sanctuary', 'mirrorPulse']);
const FORM_ATTACK_COLORS = { normal: '#38d9ff', shiny: '#22d3ee', mega: '#67e8f9', mega_shiny: '#7c3aed', squizo: '#ec4899' };

const BIOMES = [
  { ground: '#d1e0ad', sky: '#102822', fog: '#183b31', leaf: '#5e945e', moss: '#75855b', crystal: '#5fc9b2', light: '#ffe1a6' },
  { ground: '#9cc8d1', sky: '#0c2634', fog: '#17404c', leaf: '#4d9a9a', moss: '#a2c7c6', crystal: '#80e3f2', light: '#b9ecff' },
  { ground: '#c8a7bd', sky: '#28192b', fog: '#45243b', leaf: '#8e627c', moss: '#bb8f90', crystal: '#e08ad0', light: '#ffd5c6' },
  { ground: '#b0a3d6', sky: '#211b40', fog: '#34276a', leaf: '#7162af', moss: '#aea0ce', crystal: '#c4a2ff', light: '#e5d1ff' },
  { ground: '#a99b7e', sky: '#211e1b', fog: '#433528', leaf: '#82734b', moss: '#9c8059', crystal: '#ff9b66', light: '#ffd28d' }
];

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function terrainHeight(x, z) {
  return Math.sin(x * .0062) * Math.cos(z * .0077) * 4.2 + Math.sin((x + z) * .015) * 2.1 + Math.cos((x - z) * .011) * 1.4;
}

function softShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(5,12,14,.48)');
  gradient.addColorStop(.45, 'rgba(5,12,14,.22)');
  gradient.addColorStop(1, 'rgba(5,12,14,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSurvivorScene() {
  let renderer = null;
  let scene = null;
  let camera = null;
  let ground = null;
  let canvas = null;
  let run = null;
  let dimensions = { width: 1000, height: 560, worldW: 3600, worldH: 2200 };
  let quality = 'medium';
  let qualityCeiling = 'high';
  let lastFrameAt = 0;
  let avgFrameMs = 16.7;
  let avgRendererMs = 0;
  let slowFrames = 0;
  let fastFrames = 0;
  let slowRendererFrames = 0;
  let lastStatsAt = 0;
  let cameraX = 1800;
  let cameraZ = 1100;
  let activeBiome = -1;
  let environment = null;
  let texture = null;
  let shadowTexture = null;
  let entityShadows = null;
  let ambientBits = null;
  let ambientData = null;
  let combatMeshes = null;
  let combatPrewarmed = false;
  const projected = { arrays: Object.create(null), items: Object.create(null), helperState: Object.create(null) };
  const projectionVector = new THREE.Vector3();
  const shadowEntities = [];
  const combatScratch = { normal: [], tornado: [], hearts: [], enemy: [], trails: [], areas: [], beams: [], arcs: [], shards: [], sectors: [], columns: [] };

  function qualityFor(s) {
    if (s?.perf?.low) return 'low';
    if (s?.perf?.mobile || s?.perf?.mid) return 'medium';
    return 'high';
  }

  function setQuality(next) {
    const capped = qualityNames[Math.min(qualityNames.indexOf(next), qualityNames.indexOf(qualityCeiling))];
    if (!renderer || capped === quality) return;
    quality = capped;
    const ratio = quality === 'low' ? .44 : quality === 'medium' ? .9 : Math.min(1.35, window.devicePixelRatio || 1);
    renderer.setPixelRatio(ratio);
    renderer.setSize(dimensions.width, dimensions.height, false);
    renderer.toneMapping = quality === 'low' ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = quality === 'low' ? 1 : 1.12;
    renderer.shadowMap.enabled = quality === 'high';
    const density = quality === 'low' ? .42 : quality === 'medium' ? .76 : 1;
    for (const mesh of environment?.groups || []) {
      const fullCount = Number(mesh.userData?.psyFullCount || mesh.count);
      mesh.count = Math.max(1, Math.floor(fullCount * density));
    }
    if (ambientBits) ambientBits.geometry.setDrawRange(0, quality === 'low' ? 0 : quality === 'medium' ? 46 : 74);
    if (environment?.keyLight) environment.keyLight.castShadow = quality === 'high';
    if (environment?.meshes) for (const mesh of environment.meshes) {
      mesh.castShadow = quality === 'high';
      mesh.receiveShadow = quality === 'high';
    }
    if (run?.perf) run.perf.renderQuality = quality;
  }

  function configureDimensions(s) {
    const width = Math.max(480, Number(s.viewW || 1000));
    const height = Math.max(250, Number(s.viewH || 560));
    const changed = width !== dimensions.width || height !== dimensions.height;
    dimensions.width = width;
    dimensions.height = height;
    dimensions.worldW = Math.max(800, Number(s.worldW || s.w || 3600));
    dimensions.worldH = Math.max(600, Number(s.worldH || s.h || 2200));
    if (camera && changed) {
      camera.aspect = dimensions.width / dimensions.height;
      camera.updateProjectionMatrix();
    }
    if (renderer && changed) {
      renderer.setSize(dimensions.width, dimensions.height, false);
      if (canvas) {
        canvas.width = Math.round(dimensions.width * renderer.getPixelRatio());
        canvas.height = Math.round(dimensions.height * renderer.getPixelRatio());
      }
    }
  }

  function makeInstanceGroup(sceneRef, geometry, material, placements, makeTransform, receiveShadow = true) {
    if (!placements.length) return null;
    const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
    mesh.userData.psyFullCount = placements.length;
    const dummy = new THREE.Object3D();
    placements.forEach((p, i) => {
      makeTransform(dummy, p, i);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = false;
    mesh.receiveShadow = receiveShadow;
    mesh.frustumCulled = true;
    sceneRef.add(mesh);
    return mesh;
  }

  function buildEnvironment(s, seed = 9021) {
    if (environment) {
      for (const obj of environment.objects) {
        scene.remove(obj);
        if (obj.geometry && !obj.isInstancedMesh) obj.geometry.dispose();
        if (obj.material && !Array.isArray(obj.material)) obj.material.dispose();
      }
      environment = null;
    }
    const worldW = dimensions.worldW, worldH = dimensions.worldH;
    const random = rng(seed);
    const props = [];
    const trees = [];
    const shrubs = [];
    const crystals = [];
    const shadowSpots = [];
    const margin = 68;
    const centerX = worldW / 2, centerZ = worldH / 2;

    for (let i = 0; i < 104; i++) {
      const x = margin + random() * (worldW - margin * 2);
      const z = margin + random() * (worldH - margin * 2);
      if (Math.hypot(x - centerX, z - centerZ) < 185) continue;
      const scale = .54 + random() * .72;
      const type = random();
      if (type < .48) shrubs.push({ x, z, scale, yaw: random() * Math.PI * 2 });
      else if (type < .82) props.push({ x, z, scale, yaw: random() * Math.PI * 2 });
      else crystals.push({ x, z, scale, yaw: random() * Math.PI * 2 });
      shadowSpots.push({ x, z, scale: 24 + random() * 36, depth: 10 + random() * 15 });
    }
    // Tall silhouettes frame the map edges; low rocks and ferns stay in the walkable space.
    for (let i = 0; i < 58; i++) {
      const side = i % 4, t = random();
      const x = side < 2 ? t * worldW : (side === 2 ? 28 : worldW - 28);
      const z = side < 2 ? (side === 0 ? 28 : worldH - 28) : t * worldH;
      trees.push({ x, z, scale: .72 + random() * .62, yaw: random() * Math.PI * 2 });
      shadowSpots.push({ x, z, scale: 62 + random() * 28, depth: 30 + random() * 14 });
    }

    const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: texture });
    const terrainSegments = qualityCeiling === 'low' ? [24, 18] : qualityCeiling === 'medium' ? [40, 28] : [56, 40];
    const terrainGeometry = new THREE.PlaneGeometry(worldW, worldH, terrainSegments[0], terrainSegments[1]);
    const terrainPositions = terrainGeometry.attributes.position;
    for (let i = 0; i < terrainPositions.count; i++) {
      const x = terrainPositions.getX(i) + centerX;
      const z = centerZ - terrainPositions.getY(i);
      terrainPositions.setZ(i, terrainHeight(x, z));
    }
    terrainPositions.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
    ground = new THREE.Mesh(terrainGeometry, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(centerX, -.02, centerZ);
    ground.receiveShadow = true;
    scene.add(ground);

    const rockGeo = new THREE.DodecahedronGeometry(24, 0);
    const rockMat = new THREE.MeshLambertMaterial({ color: '#70816b', flatShading: true });
    const rockMesh = makeInstanceGroup(scene, rockGeo, rockMat, props, (o, p) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 11 * p.scale, p.z);
      o.rotation.set(p.yaw * .18, p.yaw, p.yaw * .11);
      o.scale.set(p.scale * 1.2, p.scale * (.66 + (p.x % 13) / 40), p.scale);
    });

    const shrubGeo = new THREE.IcosahedronGeometry(16, 1);
    const shrubMat = new THREE.MeshLambertMaterial({ color: '#4d7a4e', flatShading: true });
    const shrubMesh = makeInstanceGroup(scene, shrubGeo, shrubMat, shrubs, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 11 * p.scale, p.z);
      o.rotation.set(.12 + i % 3 * .08, p.yaw, .06);
      o.scale.set(1.55 * p.scale, .75 * p.scale, 1.2 * p.scale);
    });

    const trunkGeo = new THREE.CylinderGeometry(5, 9, 54, 6, 1);
    const trunkMat = new THREE.MeshLambertMaterial({ color: '#684d3b', flatShading: true });
    const trunkMesh = makeInstanceGroup(scene, trunkGeo, trunkMat, trees, (o, p) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 27 * p.scale, p.z);
      o.rotation.set(0, p.yaw, .025);
      o.scale.set(p.scale, p.scale, p.scale);
    });
    const crownGeo = new THREE.ConeGeometry(38, 76, 7, 1);
    const crownMat = new THREE.MeshLambertMaterial({ color: '#386c4b', flatShading: true });
    const crownMesh = makeInstanceGroup(scene, crownGeo, crownMat, trees, (o, p, i) => {
      o.position.set(p.x + (i % 3 - 1) * 10 * p.scale, terrainHeight(p.x, p.z) + 78 * p.scale, p.z - 3 * p.scale);
      o.rotation.set(.04, p.yaw + i * .1, .03);
      o.scale.set(p.scale, p.scale, p.scale);
    });
    const crownTopGeo = new THREE.ConeGeometry(27, 61, 7, 1);
    const crownTopMat = new THREE.MeshLambertMaterial({ color: '#54875a', flatShading: true });
    const crownTopMesh = makeInstanceGroup(scene, crownTopGeo, crownTopMat, trees, (o, p, i) => {
      o.position.set(p.x - 4 * p.scale, terrainHeight(p.x, p.z) + 125 * p.scale, p.z + 2 * p.scale);
      o.rotation.set(.02, p.yaw + i * .19, -.02);
      o.scale.set(p.scale * .86, p.scale, p.scale * .86);
    });

    const crystalGeo = new THREE.OctahedronGeometry(18, 0);
    const crystalMat = new THREE.MeshLambertMaterial({ color: '#63c7b4', emissive: '#123a35', emissiveIntensity: .45, flatShading: true });
    const crystalMesh = makeInstanceGroup(scene, crystalGeo, crystalMat, crystals, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 17 * p.scale, p.z);
      o.rotation.set(.08, p.yaw + i * .18, .09);
      o.scale.set(.72 * p.scale, 1.45 * p.scale, .72 * p.scale);
    });

    const borderMat = new THREE.MeshLambertMaterial({ color: '#465747', flatShading: true });
    const wallH = 118;
    const border = [
      new THREE.Mesh(new THREE.BoxGeometry(worldW + 110, wallH, 84), borderMat),
      new THREE.Mesh(new THREE.BoxGeometry(worldW + 110, wallH, 84), borderMat),
      new THREE.Mesh(new THREE.BoxGeometry(84, wallH, worldH), borderMat),
      new THREE.Mesh(new THREE.BoxGeometry(84, wallH, worldH), borderMat)
    ];
    border[0].position.set(centerX, wallH / 2 - 5, -32);
    border[1].position.set(centerX, wallH / 2 - 5, worldH + 32);
    border[2].position.set(-32, wallH / 2 - 5, centerZ);
    border[3].position.set(worldW + 32, wallH / 2 - 5, centerZ);
    border.forEach(m => { m.receiveShadow = true; scene.add(m); });

    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .56, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const shadowGeo = new THREE.CircleGeometry(1, 14);
    const decorShadows = new THREE.InstancedMesh(shadowGeo, shadowMat, shadowSpots.length);
    decorShadows.userData.psyFullCount = shadowSpots.length;
    const dummy = new THREE.Object3D();
    shadowSpots.forEach((p, i) => {
      dummy.position.set(p.x, terrainHeight(p.x, p.z) + .018, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(p.scale, p.depth, 1);
      dummy.updateMatrix();
      decorShadows.setMatrixAt(i, dummy.matrix);
    });
    decorShadows.instanceMatrix.needsUpdate = true;
    decorShadows.renderOrder = 1;
    scene.add(decorShadows);

    const keyLight = new THREE.DirectionalLight('#ffe9c5', 2.1);
    keyLight.position.set(centerX - 650, 1050, centerZ + 800);
    keyLight.castShadow = false;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 2600;
    keyLight.shadow.camera.left = -1450;
    keyLight.shadow.camera.right = 1450;
    keyLight.shadow.camera.top = 1200;
    keyLight.shadow.camera.bottom = -1200;
    keyLight.shadow.bias = -.00016;
    keyLight.shadow.normalBias = .035;
    scene.add(keyLight);
    scene.add(new THREE.HemisphereLight('#d7f2df', '#24342a', 1.18));

    const bitGeo = new THREE.BufferGeometry();
    const bitCount = 74;
    const bitPositions = new Float32Array(bitCount * 3);
    const bitPhases = new Float32Array(bitCount);
    for (let i = 0; i < bitCount; i++) {
      bitPositions[i * 3] = 80 + random() * (worldW - 160);
      bitPositions[i * 3 + 1] = 24 + random() * 92;
      bitPositions[i * 3 + 2] = 80 + random() * (worldH - 160);
      bitPhases[i] = random() * Math.PI * 2;
    }
    bitGeo.setAttribute('position', new THREE.BufferAttribute(bitPositions, 3));
    const bitMat = new THREE.PointsMaterial({ color: '#cbf3c0', size: quality === 'low' ? 2 : 3.2, transparent: true, opacity: .48, sizeAttenuation: true, depthWrite: false });
    ambientBits = new THREE.Points(bitGeo, bitMat);
    ambientBits.geometry.setDrawRange(0, qualityCeiling === 'low' ? 0 : qualityCeiling === 'medium' ? 46 : bitCount);
    ambientBits.frustumCulled = false;
    scene.add(ambientBits);
    ambientData = { positions: bitPositions, phases: bitPhases, count: bitCount };

    environment = {
      objects: [ground, rockMesh, shrubMesh, trunkMesh, crownMesh, crownTopMesh, crystalMesh, ...border, decorShadows, keyLight, ambientBits].filter(Boolean),
      meshes: [ground, rockMesh, shrubMesh, trunkMesh, crownMesh, crownTopMesh, crystalMesh, ...border].filter(Boolean),
      groups: [rockMesh, shrubMesh, trunkMesh, crownMesh, crownTopMesh, crystalMesh, decorShadows].filter(Boolean),
      keyLight, mats: [groundMat, rockMat, shrubMat, trunkMat, crownMat, crownTopMat, crystalMat, borderMat]
    };
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(worldW / 430, worldH / 430);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.needsUpdate = true;
    }
    setBiome(s.phase || 1, true);
  }

  function setBiome(phase, force = false) {
    if (!scene || !environment) return;
    const biomeIndex = (Math.floor((Math.max(1, Number(phase || 1)) - 1) / 20) % BIOMES.length);
    if (!force && biomeIndex === activeBiome) return;
    activeBiome = biomeIndex;
    const biome = BIOMES[biomeIndex];
    scene.background = new THREE.Color(biome.sky);
    scene.fog = new THREE.Fog(biome.fog, 1250, 3600);
    ground.material.color.set(biome.ground);
    environment.keyLight.color.set(biome.light);
    environment.mats[1].color.set(biome.moss);
    environment.mats[2].color.set(biome.leaf);
    environment.mats[4].color.set(biome.leaf).multiplyScalar(.77);
    environment.mats[5].color.set(biome.leaf);
    environment.mats[6].color.set(biome.crystal);
    if (ambientBits) ambientBits.material.color.set(biome.crystal);
  }

  function makeEntityShadowMesh() {
    const geometry = new THREE.CircleGeometry(1, 16);
    const material = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity: .66, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    entityShadows = new THREE.InstancedMesh(geometry, material, 144);
    entityShadows.count = 0;
    entityShadows.renderOrder = 2;
    scene.add(entityShadows);
  }

  function makeCombatMesh(geometry, material, capacity) {
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceColor?.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    scene.add(mesh);
    return mesh;
  }

  function makeCombatVisuals() {
    const bright = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.35, roughness: .25, metalness: .08, toneMapped: false });
    const trail = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .72, depthWrite: false, toneMapped: false });
    const disk = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const rim = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .84, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 });
    const beam = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .28, depthWrite: false, toneMapped: false });
    const sector = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .23, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const column = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .48, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const projectileGeo = new THREE.SphereGeometry(1, 10, 8);
    const tornadoGeo = new THREE.ConeGeometry(1, 2.4, 7, 1);
    const heartGeo = new THREE.OctahedronGeometry(1, 0);
    const trailGeo = new THREE.BoxGeometry(1, 1, 1);
    const diskGeo = new THREE.CircleGeometry(1, 24);
    const rimGeo = new THREE.TorusGeometry(.92, .055, 5, 28);
    const beamGeo = new THREE.BoxGeometry(1, 1, 1);
    const arcGeo = new THREE.TorusGeometry(.92, .045, 5, 24, Math.PI * 1.55);
    const shardGeo = new THREE.OctahedronGeometry(1, 0);
    const sectorGeo = new THREE.CircleGeometry(1, 24, -.55, 1.1);
    const columnGeo = new THREE.ConeGeometry(.48, 1, 8, 1);
    combatMeshes = {
      projectiles: makeCombatMesh(projectileGeo, bright, 260),
      tornadoes: makeCombatMesh(tornadoGeo, bright, 48),
      hearts: makeCombatMesh(heartGeo, bright, 72),
      enemyProjectiles: makeCombatMesh(projectileGeo, bright, 200),
      trails: makeCombatMesh(trailGeo, trail, 420),
      areaDisks: makeCombatMesh(diskGeo, disk, 168),
      areaRims: makeCombatMesh(rimGeo, rim, 168),
      beams: makeCombatMesh(beamGeo, beam, 128),
      arcs: makeCombatMesh(arcGeo, bright, 128),
      shards: makeCombatMesh(shardGeo, bright, 160),
      sectors: makeCombatMesh(sectorGeo, sector, 24),
      columns: makeCombatMesh(columnGeo, column, 36)
    };
  }

  function prewarmCombatVisuals() {
    if (!renderer || !combatMeshes || combatPrewarmed) return;
    const meshes = Object.values(combatMeshes);
    for (const mesh of meshes) {
      const matrix = mesh.userData.psyCombatDummy || (mesh.userData.psyCombatDummy = new THREE.Object3D());
      const color = mesh.userData.psyCombatColor || (mesh.userData.psyCombatColor = new THREE.Color('#ffffff'));
      matrix.position.set(0, 0, 0);
      matrix.scale.setScalar(1);
      matrix.updateMatrix();
      mesh.setMatrixAt(0, matrix.matrix);
      mesh.setColorAt(0, color.set('#ffffff'));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.count = 1;
      mesh.visible = true;
    }
    renderer.compile(scene, camera);
    for (const mesh of meshes) {
      mesh.count = 0;
      mesh.visible = false;
    }
    combatPrewarmed = true;
  }

  function fillCombatMesh(mesh, rows, transform) {
    if (!mesh) return 0;
    const count = Math.min(rows.length, mesh.instanceMatrix.count);
    const dummy = mesh.userData.psyCombatDummy || (mesh.userData.psyCombatDummy = new THREE.Object3D());
    const color = mesh.userData.psyCombatColor || (mesh.userData.psyCombatColor = new THREE.Color());
    for (let i = 0; i < count; i++) {
      const row = rows[i];
      transform(dummy, row, i);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(row.color || '#ffffff'));
    }
    mesh.count = count;
    mesh.visible = count > 0;
    if (count) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    return count;
  }

  function updateCombatVisuals(s, now) {
    if (!combatMeshes) return null;
    const { normal, tornado, hearts, enemy, trails, areas, beams, arcs, shards, sectors, columns } = combatScratch;
    normal.length = tornado.length = hearts.length = enemy.length = trails.length = areas.length = beams.length = arcs.length = shards.length = sectors.length = columns.length = 0;
    const addTrail = (b, color) => {
      if (trails.length >= combatMeshes.trails.instanceMatrix.count) return;
      const speed = Math.max(.01, Math.hypot(Number(b.vx || 0), Number(b.vy || 0)));
      trails.push({ x: b.x, z: b.y, a: Math.atan2(Number(b.vy || 0), Number(b.vx || 0)), r: Number(b.radius || 5), speed, color });
    };
    for (const b of s.bullets || []) {
      if (!b || b.dead) continue;
      const row = { x: Number(b.x || 0), z: Number(b.y || 0), r: Math.max(3, Number(b.radius || 5)), color: b.color || '#67e8f9', kind: b.kind || 'psy', vx: Number(b.vx || 0), vy: Number(b.vy || 0) };
      if (row.kind === 'tornado') tornado.push(row);
      else if (row.kind === 'heart') hearts.push(row);
      else normal.push(row);
      addTrail(row, row.color);
    }
    for (const b of s.enemyBullets || []) {
      if (!b || b.dead) continue;
      const row = { x: Number(b.x || 0), z: Number(b.y || 0), r: Math.max(3, Number(b.radius || 5)), color: b.color || '#fb7185', vx: Number(b.vx || 0), vy: Number(b.vy || 0) };
      enemy.push(row);
      addTrail(row, row.color);
    }
    const atGround = (o, row, height) => {
      o.position.set(row.x, terrainHeight(row.x, row.z) + height, row.z);
      o.rotation.set(0, -Math.atan2(row.vy || 0, row.vx || 0), 0);
    };
    fillCombatMesh(combatMeshes.projectiles, normal, (o, b, i) => {
      const pulse = 1 + .10 * Math.sin(now * .018 + i * 1.7);
      atGround(o, b, 26);
      o.scale.setScalar(b.r * pulse);
    });
    fillCombatMesh(combatMeshes.tornadoes, tornado, (o, b, i) => {
      atGround(o, b, 19);
      o.rotation.set(.14 * Math.sin(now * .008 + i), now * .0028 + i * .35, 0);
      o.scale.set(b.r * .95, b.r * 1.7, b.r * .95);
    });
    fillCombatMesh(combatMeshes.hearts, hearts, (o, b, i) => {
      atGround(o, b, 22);
      o.rotation.set(now * .0013, now * .0019 + i, Math.PI / 4);
      o.scale.setScalar(b.r * (1 + .08 * Math.sin(now * .015 + i)));
    });
    fillCombatMesh(combatMeshes.enemyProjectiles, enemy, (o, b) => {
      atGround(o, b, 18);
      o.scale.setScalar(b.r * .92);
    });
    fillCombatMesh(combatMeshes.trails, trails, (o, b) => {
      o.position.set(b.x, terrainHeight(b.x, b.z) + 25, b.z);
      o.rotation.set(0, -b.a, 0);
      o.scale.set(30 + Math.min(16, b.speed * 1.5), 1.5, Math.max(1.8, b.r * .5));
    });

    const addArea = (x, z, radius, color, alpha = .18) => {
      if (!(radius > 2) || areas.length >= combatMeshes.areaDisks.instanceMatrix.count) return;
      areas.push({ x, z, r: radius, color, alpha });
    };
    const addBeam = (x, z, length, width, a, color) => {
      if (!(length > 2) || beams.length >= combatMeshes.beams.instanceMatrix.count) return;
      beams.push({ x, z, length, width: Math.max(6, width), a: Number(a || 0), color });
    };
    const density = quality === 'low' ? .52 : quality === 'medium' ? .76 : 1;
    const addArc = (x, z, radius, color, angle = 0, scale = 1) => {
      if (!(radius > 5) || arcs.length >= Math.max(20, Math.floor(combatMeshes.arcs.instanceMatrix.count * density))) return;
      arcs.push({ x, z, r: radius, color, a: angle, scale });
    };
    const addShard = (x, z, size, color, angle = 0, lift = 22) => {
      if (shards.length >= Math.max(32, Math.floor(combatMeshes.shards.instanceMatrix.count * density))) return;
      shards.push({ x, z, r: clamp(Number(size || 5), 3, 24), color, a: angle, lift });
    };
    const addSector = (x, z, radius, angle, color, scale = 1) => {
      if (!(radius > 8) || sectors.length >= Math.max(8, Math.floor(combatMeshes.sectors.instanceMatrix.count * density))) return;
      sectors.push({ x, z, r: radius, a: angle, color, scale });
    };
    const addColumn = (x, z, height, radius, color, angle = 0) => {
      if (!(height > 6) || columns.length >= Math.max(12, Math.floor(combatMeshes.columns.instanceMatrix.count * density))) return;
      columns.push({ x, z, h: height, r: radius, color, a: angle });
    };
    for (const f of s.fields || []) {
      if (!f || f.dead) continue;
      if (f.kind === 'waterjet' && !(f.startDelay > 0)) addBeam(Number(f.x || 0), Number(f.y || 0), Number(f.length || 0), Number(f.width || 16) * 1.5, Number(f.a || 0), f.color || '#60a5fa');
      else if (f.kind === 'meteor') addArea(Number(f.x || 0), Number(f.y || 0), Math.min(Number(f.radius || 60), f.giant ? 180 : 95), f.color || '#fb923c', f.startDelay > 0 ? .13 : .26);
      else if (f.kind === 'blackhole' || f.kind === 'tornadozone') addArea(Number(f.x || 0), Number(f.y || 0), Number(f.radius || 80), f.color || (f.kind === 'blackhole' ? '#a855f7' : '#a78bfa'), .14);
    }
    for (const h of s.bossHazards || []) {
      if (!h || h.dead) continue;
      if (h.kind === 'bossMeteor' || h.kind === 'bossTrap') addArea(Number(h.x || 0), Number(h.y || 0), Number(h.r || 52), '#ef4444', h.delay > 0 ? .16 : .24);
      else if (h.kind === 'bossVolley' || h.kind === 'bossCharge') addBeam(Number(h.x || 0), Number(h.y || 0), Number(h.len || 500), Number(h.width || 28) * 1.35, Number(h.a || 0), '#ef4444');
    }
    const effects = s.effects || [];
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      if (!fx) continue;
      const life = clamp(Number(fx.life || 0) / Math.max(1, Number(fx.maxLife || fx.life || 1)), 0, 1);
      const radius = Math.max(4, Number(fx.r || 12), Number(fx.type === 'deathBurst' ? fx.max : 0) * (1 - life));
      const x = Number(fx.x || 0), z = Number(fx.y || 0), color = fx.color || '#67e8f9';
      if (COMBAT_AREA_FX.has(fx.type)) {
        addArea(x, z, Math.max(radius, Number(fx.max || 0) * (1 - life)), color, .12 + .1 * life);
      }
      if (fx.type === 'psyNova') {
        addArc(x, z, Math.max(12, radius * .66), fx.color2 || color, now * .0018, 1 + (1 - life) * .22);
        addArc(x, z, Math.max(12, radius), color, -now * .0012, 1 + (1 - life) * .12);
      } else if (fx.type === 'vortex' || fx.type === 'voidOpen' || fx.type === 'blackhole') {
        const maxR = Math.max(radius, Number(fx.r || fx.max || 64));
        addArc(x, z, maxR * .38, fx.color2 || color, now * .004, .9);
        addArc(x, z, maxR * .68, color, -now * .003, 1.04);
        addArc(x, z, maxR, fx.color2 || color, now * .0018, 1.08);
        if (fx.type !== 'vortex') addArea(x, z, maxR * .72, '#170b2b', .2);
      } else if (fx.type === 'psyRainCloud') {
        addArc(x, z, Math.max(18, radius * .92), color, now * .0014, .72);
        addArc(x, z, Math.max(18, radius * .72), fx.color2 || color, -now * .0018, .82);
      } else if (fx.type === 'psyRainBurst' || fx.type === 'freezeRing' || fx.type === 'stunRing' || fx.type === 'thunderSeal' || fx.type === 'heartBurst' || fx.type === 'shieldGrant' || fx.type === 'mirrorPulse' || fx.type === 'sanctuary') {
        const pulse = 1 + (1 - life) * .25;
        addArc(x, z, Math.max(12, radius * .76), color, now * .0025, pulse);
        addArc(x, z, Math.max(12, radius), fx.color2 || color, -now * .0017, .94 + (1 - life) * .15);
      } else if (fx.type === 'meteorWarning' || fx.type === 'meteorStrike') {
        const h = fx.giant ? 250 : 180;
        addColumn(x, z, h * (fx.type === 'meteorWarning' ? .38 : .72 + .28 * (1 - life)), fx.giant ? 20 : 13, color, -.24);
        addArc(x, z, Math.max(radius, Number(fx.radius || 0) * .46), '#fff1d6', now * .001, 1.02);
      } else if (fx.type === 'lightning') {
        const x2 = Number(fx.x2 ?? x), z2 = Number(fx.y2 ?? z), dx = x2 - x, dz = z2 - z;
        const length = Math.hypot(dx, dz);
        if (length > 2) addBeam(x, z, length, Math.max(5, Number(fx.thick || 4) * 1.25), Math.atan2(dz, dx), color);
        addColumn(x2, z2, 120 * (.68 + .32 * (1 - life)), Math.max(7, Number(fx.thick || 4) * 1.8), color);
        addShard(x2, z2, Math.max(5, Number(fx.thick || 4) * 1.5), '#fffbea', now * .01, 34);
      } else if (fx.type === 'iceCone' || fx.type === 'cone') {
        addSector(x, z, Number(fx.range || radius), Number(fx.a || 0), color, fx.maxed ? 1.05 : .96);
        addArc(x, z, Number(fx.range || radius), '#dff8ff', Number(fx.a || 0), 1.02);
      } else if (fx.type === 'psyRainDrop') {
        const tx = Number(fx.targetX ?? x), tz = Number(fx.targetY ?? z + 175);
        const fall = 1 - life;
        addColumn(tx, tz, 62 + 118 * life, 7 + 4 * life, color, .08);
        addShard(tx, tz, 8 + fall * 5, color, now * .012, 26 + 124 * life);
      } else if (fx.type === 'psyblade') {
        const x2 = Number(fx.x2 ?? x), z2 = Number(fx.y2 ?? z), dx = x2 - x, dz = z2 - z;
        const length = Math.hypot(dx, dz);
        if (length > 2) addBeam(x, z, length, Math.max(7, Number(fx.w || 12)), Math.atan2(dz, dx), color);
        addColumn(x2, z2, 82 * life, Math.max(5, Number(fx.w || 12) * .42), fx.color || '#ffffff');
      } else if (fx.type === 'iceShard' || fx.type === 'particle' || fx.type === 'bubble' || fx.type === 'petal') {
        const angle = Number(fx.a || 0) + now * (fx.type === 'iceShard' ? .002 : .004);
        addShard(x, z, Number(fx.size || (fx.type === 'bubble' ? 5 : 4)), fx.type === 'iceShard' ? '#dff8ff' : color, angle, fx.type === 'particle' || fx.type === 'bubble' ? 18 + Number(fx.size || 4) : 24);
        if (fx.type === 'bubble') addArc(x, z, Math.max(6, Number(fx.size || 4) * 1.7), '#e0f2fe', angle, .84);
      }
    }
    const form = String(s.psyForm || 'normal');
    if (Number(s.orbit || 0) > 0) {
      const count = Math.min(8, 1 + Number(s.orbit || 0) + (s.orbitMax ? 2 : 0));
      const orbitRadius = 58 + Number(s.orbit || 0) * 7 + (s.orbitMax ? 18 : 0);
      const formColor = FORM_ATTACK_COLORS[form] || '#38d9ff';
      for (let i = 0; i < count; i++) {
        const a = Number(s.elapsed || 0) / 520 + i * Math.PI * 2 / count;
        addShard(Number(s.x || 0) + Math.cos(a) * orbitRadius, Number(s.y || 0) + Math.sin(a) * orbitRadius, 11 + (s.orbitMax ? 3 : 0), formColor, a + now * .002, 26);
        if (i < 4) addArc(Number(s.x || 0), Number(s.y || 0), orbitRadius, formColor, a, .85);
      }
    }
    const changedAt = Number(s.psyFormChangedAt || -99999), transformAge = Number(s.elapsed || 0) - changedAt;
    if (transformAge >= 0 && transformAge < 1250) {
      const formColor = FORM_ATTACK_COLORS[form] || '#38d9ff';
      const radius = 44 + transformAge * .42;
      addArc(Number(s.x || 0), Number(s.y || 0), radius, formColor, now * .003, 1 + (1 - transformAge / 1250) * .22);
      addArc(Number(s.x || 0), Number(s.y || 0), radius * .72, '#ffffff', -now * .004, .9);
      for (let i = 0; i < 6; i++) {
        const a = now * .003 + i * Math.PI / 3;
        addShard(Number(s.x || 0) + Math.cos(a) * radius, Number(s.y || 0) + Math.sin(a) * radius, 7, formColor, a, 28 + Math.sin(a) * 10);
      }
    }
    const areaCount = fillCombatMesh(combatMeshes.areaDisks, areas, (o, a) => {
      o.position.set(a.x, terrainHeight(a.x, a.z) + .16, a.z);
      o.rotation.set(-Math.PI / 2, 0, 0);
      o.scale.set(a.r, a.r, 1);
    });
    fillCombatMesh(combatMeshes.areaRims, areas, (o, a, i) => {
      o.position.set(a.x, terrainHeight(a.x, a.z) + .2 + i * .0001, a.z);
      o.rotation.set(Math.PI / 2, 0, 0);
      const pulse = 1 + .025 * Math.sin(now * .006 + i);
      o.scale.set(a.r * pulse, a.r * pulse, 1);
    });
    fillCombatMesh(combatMeshes.beams, beams, (o, b) => {
      o.position.set(b.x + Math.cos(b.a) * b.length * .5, terrainHeight(b.x, b.z) + .24, b.z + Math.sin(b.a) * b.length * .5);
      o.rotation.set(0, -b.a, 0);
      o.scale.set(b.length, 1.2, b.width);
    });
    fillCombatMesh(combatMeshes.arcs, arcs, (o, a, i) => {
      o.position.set(a.x, terrainHeight(a.x, a.z) + .34 + i * .0005, a.z);
      o.rotation.set(Math.PI / 2, a.a + now * .001, 0);
      const pulse = 1 + .025 * Math.sin(now * .007 + i);
      o.scale.set(a.r * a.scale * pulse, a.r * a.scale * pulse, 1);
    });
    fillCombatMesh(combatMeshes.shards, shards, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + p.lift + 3 * Math.sin(now * .009 + i), p.z);
      o.rotation.set(now * .0015 + i * .3, p.a + now * .001, now * .0011);
      o.scale.set(p.r, p.r * 1.65, p.r);
    });
    fillCombatMesh(combatMeshes.sectors, sectors, (o, p) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + .26, p.z);
      o.rotation.set(-Math.PI / 2, -p.a, 0);
      o.scale.set(p.r * p.scale, p.r * p.scale, 1);
    });
    fillCombatMesh(combatMeshes.columns, columns, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + p.h * .5, p.z);
      o.rotation.set(0, p.a + i * .03, 0);
      o.scale.set(p.r, p.h, p.r);
    });
    return { projectiles: normal.length + tornado.length + hearts.length, enemyProjectiles: enemy.length, areas: areaCount, beams: beams.length, arcs: arcs.length, shards: shards.length, sectors: sectors.length, columns: columns.length };
  }

  function start(s) {
    if (!s?.c || !s.ctx) return false;
    run = s;
    slowRendererFrames = 0;
    configureDimensions(s);
    qualityCeiling = qualityFor(s);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'psy-surv-world-v3';
      canvas.setAttribute('aria-hidden', 'true');
      const parent = s.c.parentElement;
      if (parent && getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      parent?.insertBefore(canvas, s.c);
    }
    if (canvas.parentElement !== s.c.parentElement) s.c.parentElement?.insertBefore(canvas, s.c);
    canvas.style.cssText = `position:absolute;inset:auto 0 0 0;top:54px;width:100%;height:calc(100% - 54px);display:block;pointer-events:none;z-index:0`;
    s.c.style.zIndex = '1';
    s.c.style.background = 'transparent';
    try {
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: qualityCeiling !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: false });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor('#10241e', 1);
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(44, dimensions.width / dimensions.height, 5, 5500);
        camera.up.set(0, 1, 0);
        shadowTexture = softShadowTexture();
        texture = new THREE.TextureLoader().load(new URL('../assets/survivor/psywood-ground-v3.svg', import.meta.url).href, t => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;
          t.needsUpdate = true;
        }, undefined, () => { if (run) run.perf.terrainTextureFallback = true; });
        buildEnvironment(s, 9021 + Number(s.phase || 1));
        makeEntityShadowMesh();
        makeCombatVisuals();
      }
      configureDimensions(s);
      renderer.setPixelRatio(qualityCeiling === 'low' ? .56 : qualityCeiling === 'medium' ? .9 : Math.min(1.35, window.devicePixelRatio || 1));
      renderer.setSize(dimensions.width, dimensions.height, false);
      setQuality(qualityCeiling);
      prewarmCombatVisuals();
      cameraX = clamp(Number(s.x || dimensions.worldW / 2), 250, dimensions.worldW - 250);
      cameraZ = clamp(Number(s.y || dimensions.worldH / 2) - 145, 240, dimensions.worldH - 560);
      lastFrameAt = performance.now();
      s._psySurv3DActive = true;
      s.perf.renderQuality = quality;
      return true;
    } catch (error) {
      s._psySurv3DActive = false;
      console.warn('[Survivor 3D] renderer unavailable; keeping the stable 2D renderer.', error);
      if (canvas) canvas.style.display = 'none';
      return false;
    }
  }

  function projectPoint(x, z, y = 0) {
    const px = Number(x || 0), pz = Number(z || 0);
    projectionVector.set(px, terrainHeight(px, pz) + Number(y || 0), pz).project(camera);
    return { x: (projectionVector.x + 1) * dimensions.width * .5, y: (1 - projectionVector.y) * dimensions.height * .5, depth: projectionVector.z };
  }

  function localScale(x, z) {
    const a = projectPoint(x, z, 0);
    const b = projectPoint(Number(x) + 1, z, 0);
    return clamp(Math.hypot(b.x - a.x, b.y - a.y), .44, 2.15);
  }

  function projectAngle(x, z, angle) {
    const a = projectPoint(x, z, 0);
    const b = projectPoint(Number(x) + Math.cos(angle), Number(z) + Math.sin(angle), 0);
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function projectedItem(source, target, scaleKeys = []) {
    Object.assign(target, source);
    if (!Number.isFinite(Number(source?.x)) || !Number.isFinite(Number(source?.y))) return target;
    const wx = Number(source.x), wz = Number(source.y);
    const p = projectPoint(wx, wz, 0);
    const scale = localScale(wx, wz);
    target.x = p.x;
    target.y = p.y;
    target._perspectiveScale = scale;
    target._psyHitRemaining = clamp((Number(source._psyHitUntil || 0) - Number(run?.elapsed || 0)) / 130, 0, 1);
    if (target._psyHitRemaining > 0) {
      const dx = Number(source._psyHitDirX || 0), dz = Number(source._psyHitDirY || 0);
      const away = projectPoint(wx + dx, wz + dz, 0);
      target._psyHitScreenDX = away.x - p.x;
      target._psyHitScreenDY = away.y - p.y;
    } else target._psyHitScreenDX = target._psyHitScreenDY = 0;
    for (const key of scaleKeys) if (Number.isFinite(Number(source[key]))) target[key] = Number(source[key]) * scale;
    if (Number.isFinite(Number(source.a))) target.a = projectAngle(wx, wz, Number(source.a));
    if (Number.isFinite(Number(source.vx)) && Number.isFinite(Number(source.vy))) {
      const v = projectPoint(wx + Number(source.vx), wz + Number(source.vy), 0);
      target.vx = v.x - p.x;
      target.vy = v.y - p.y;
    }
    if (Number.isFinite(Number(source.x2)) && Number.isFinite(Number(source.y2))) {
      const end = projectPoint(source.x2, source.y2, 0);
      target.x2 = end.x;
      target.y2 = end.y;
    }
    return target;
  }

  function projectArray(source, name, scaleKeys) {
    const src = Array.isArray(source) ? source : [];
    const list = projected.arrays[name] || (projected.arrays[name] = []);
    const pool = projected.items[name] || (projected.items[name] = []);
    list.length = src.length;
    for (let i = 0; i < src.length; i++) {
      const item = pool[i] || (pool[i] = {});
      list[i] = projectedItem(src[i], item, scaleKeys);
    }
    pool.length = src.length;
    return list;
  }

  function drawEntityShadows(s) {
    if (!entityShadows) return;
    const entities = shadowEntities;
    entities.length = 0;
    for (const e of s.enemies || []) if (!e.dead) entities.push(e);
    for (const key of s.helperIds || []) {
      const list = s.helperState?.[key];
      if (Array.isArray(list)) for (const h of list) if (h && h.hp > 0) entities.push(h);
      else if (list && list.hp > 0) entities.push(list);
    }
    entities.push({ x: s.x, y: s.y, size: s.psyForm?.startsWith('mega') ? 88 : 72 });
    const dummy = new THREE.Object3D();
    const count = Math.min(entities.length, entityShadows.instanceMatrix.count);
    for (let i = 0; i < count; i++) {
      const e = entities[i], size = Math.max(20, Number(e.size || 45));
      dummy.position.set(Number(e.x || 0), terrainHeight(Number(e.x || 0), Number(e.y || 0)) + .028 + i * .00001, Number(e.y || 0));
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(size * .62, size * .3, 1);
      dummy.updateMatrix();
      entityShadows.setMatrixAt(i, dummy.matrix);
    }
    entityShadows.count = count;
    entityShadows.instanceMatrix.needsUpdate = true;
  }

  function updateAmbient(now) {
    if (!ambientBits || !ambientData || quality === 'low') {
      if (ambientBits) ambientBits.visible = false;
      return;
    }
    ambientBits.visible = true;
    const pos = ambientData.positions;
    for (let i = 0; i < ambientData.count; i++) {
      const index = i * 3 + 1;
      pos[index] = terrainHeight(pos[i * 3], pos[i * 3 + 2]) + 42 + 28 * Math.sin(now * .00048 + ambientData.phases[i]);
    }
    ambientBits.geometry.attributes.position.needsUpdate = true;
  }

  function updateCamera(s, now, dt) {
    const biome = BIOMES[(Math.floor((Math.max(1, Number(s.phase || 1)) - 1) / 20) % BIOMES.length)];
    setBiome(s.phase || 1);
    const lookX = clamp(Number(s.x || dimensions.worldW / 2), 230, dimensions.worldW - 230);
    const lookZ = clamp(Number(s.y || dimensions.worldH / 2) - 145, 235, dimensions.worldH - 540);
    const follow = 1 - Math.exp(-Math.max(0, dt) / 185);
    cameraX = mix(cameraX, lookX, follow);
    cameraZ = mix(cameraZ, lookZ, follow);

    const cue = s.cameraCue;
    let shake = 0, zoom = 0;
    if (cue && Number(cue.duration) > 0) {
      const elapsed = Math.max(0, now - Number(cue.at || now));
      const progress = clamp(elapsed / Number(cue.duration), 0, 1);
      const envelope = Math.sin(Math.PI * progress) * (1 - progress * .45);
      shake = Math.max(0, Number(cue.shake || 0)) * envelope;
      zoom = Math.max(0, Number(cue.zoom || 0)) * envelope;
    }
    const t = now * .001;
    const sx = shake * (Math.sin(t * 51) * .72 + Math.sin(t * 83 + .7) * .28);
    const sz = shake * (Math.cos(t * 47 + .4) * .66 + Math.sin(t * 76) * .34);
    const height = 695 * (1 - zoom * .055);
    const back = 625 * (1 - zoom * .055);
    const targetY = 0;
    camera.position.set(cameraX + sx, height, cameraZ + back + sz);
    camera.lookAt(cameraX + sx * .28, targetY, cameraZ + sz * .28);
    const fov = 44 - zoom * 2.25;
    if (Math.abs(camera.fov - fov) > .015) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld(true);
    if (biome && scene?.fog) scene.fog.color.set(biome.fog);
  }

  function adaptQuality(s, now, dt) {
    if (!s || s.paused) return;
    avgFrameMs = avgFrameMs * .94 + Math.min(55, Math.max(8, dt || 16.7)) * .06;
    if (avgFrameMs > 25) { slowFrames++; fastFrames = 0; }
    else if (avgFrameMs < 18) { fastFrames++; slowFrames = Math.max(0, slowFrames - 1); }
    else { slowFrames = Math.max(0, slowFrames - 1); fastFrames = 0; }
    if (slowFrames > 18 && qualityNames.indexOf(quality) > 0) {
      setQuality(qualityNames[qualityNames.indexOf(quality) - 1]);
      slowFrames = 0;
    } else if (fastFrames > 420 && quality !== qualityCeiling) {
      setQuality(qualityNames[Math.min(qualityNames.indexOf(quality) + 1, qualityNames.indexOf(qualityCeiling))]);
      fastFrames = 0;
    }
    if (now - lastStatsAt > 900) {
      lastStatsAt = now;
      if (s.perf) {
        s.perf.renderQuality = quality;
        s.perf.rendererCalls = renderer.info.render.calls;
        s.perf.rendererTriangles = renderer.info.render.triangles;
        s.perf.rendererTextures = renderer.info.memory.textures;
      }
    }
  }

  function projectRenderState(s) {
    const view = projected.view || (projected.view = {});
    Object.assign(view, s);
    const playerPoint = projectPoint(s.x, s.y, 0);
    view.x = playerPoint.x;
    view.y = playerPoint.y;
    view._perspectiveScale = localScale(s.x, s.y);
    view.viewW = view.w = view.worldW = dimensions.width;
    view.viewH = view.h = view.worldH = dimensions.height;
    view.camX = view.camY = view.shake = 0;
    view._psySurvPerspective = true;
    view._vignette = null;
    view.enemies = projectArray(s.enemies, 'enemies', ['size', 'r', 'radius']);
    view.enemies.sort((a, b) => a.y - b.y);
    view.pickups = projectArray(s.pickups, 'pickups', ['size', 'r', 'radius']);
    view.fields = projectArray(s.fields, 'fields', ['r', 'radius', 'max', 'width', 'length', 'len']);
    view.effects = projectArray(s.effects, 'effects', ['r', 'radius', 'max', 'size', 'width', 'length']);
    view.bullets = projectArray(s.bullets, 'bullets', ['r', 'radius', 'size', 'width', 'length']);
    view.enemyBullets = projectArray(s.enemyBullets, 'enemyBullets', ['r', 'radius', 'size', 'width', 'length']);
    view.texts = projectArray(s.texts, 'texts', []);
    view.bossHazards = projectArray((s.bossHazards || []).filter(h => !['bossMeteor', 'bossTrap', 'bossVolley', 'bossCharge'].includes(h.kind)), 'bossHazards', ['r', 'radius', 'width', 'length', 'len']);

    const hs = projected.helperState;
    for (const key of Object.keys(hs)) delete hs[key];
    for (const [key, value] of Object.entries(s.helperState || {})) {
      if (Array.isArray(value)) {
        const pool = projected.items[`helper:${key}`] || (projected.items[`helper:${key}`] = []);
        hs[key] = value.map((h, i) => {
          pool[i] = projectedItem(h || {}, pool[i] || {}, ['size', 'r', 'radius']);
          return pool[i];
        });
        pool.length = value.length;
      }
      else if (value && typeof value === 'object') {
        const dest = projected.items[`helper:${key}`] || (projected.items[`helper:${key}`] = [{}]);
        dest[0] = projectedItem(value, dest[0] || {}, ['size', 'r', 'radius']);
        hs[key] = dest[0];
      } else hs[key] = value;
    }
    view.helperState = hs;
    if (s.helperState && typeof s.helperState === 'object') {
      for (const value of Object.values(view.helperState)) {
        if (Array.isArray(value)) value.sort((a, b) => a.y - b.y);
      }
    }
    if (s.psyduck) view.psyduck = projectedItem(s.psyduck, projected.player || (projected.player = {}), ['size']);
    return view;
  }

  function render(s) {
    if (!renderer || !scene || !camera || !s?._psySurv3DActive) return null;
    const now = performance.now();
    const frameStartedAt = now;
    const dt = lastFrameAt ? Math.min(60, now - lastFrameAt) : 16.7;
    lastFrameAt = now;
    const form = String(s.psyForm || 'normal');
    if (run?._psySurvLastForm && run._psySurvLastForm !== form) window.psySurvCameraEvent?.(s, 'transform');
    run._psySurvLastForm = form;
    configureDimensions(s);
    const cameraStartedAt = performance.now();
    updateCamera(s, now, dt);
    const cameraMs = performance.now() - cameraStartedAt;
    const prepStartedAt = performance.now();
    drawEntityShadows(s);
    updateAmbient(now);
    const scenePrepMs = performance.now() - prepStartedAt;
    const combatStats = updateCombatVisuals(s, now);
    const renderStartedAt = performance.now();
    renderer.render(scene, camera);
    const rendererMs = performance.now() - renderStartedAt;
    avgRendererMs = avgRendererMs ? avgRendererMs * .88 + rendererMs * .12 : rendererMs;
    slowRendererFrames = avgRendererMs > 42 ? slowRendererFrames + 1 : Math.max(0, slowRendererFrames - 2);
    adaptQuality(s, now, dt);
    if (quality === 'low' && slowRendererFrames >= 24) {
      s._psySurv3DActive = false;
      s.perf.renderFallback = '2d-slow-webgl';
      if (canvas) canvas.style.display = 'none';
      if (!s._psySurv3DFallbackNotified) {
        s._psySurv3DFallbackNotified = true;
        window.toast?.('A arena 3D não está mantendo a fluidez neste navegador. Ativei o renderizador estável.', 3600);
      }
      return null;
    }
    const projectionStartedAt = performance.now();
    const frameState = projectRenderState(s);
    if (s.perf) {
      s.perf.rendererMs = avgRendererMs;
      s.perf.projectionMs = performance.now() - projectionStartedAt;
      s.perf.cameraMs = cameraMs;
      s.perf.scenePrepMs = scenePrepMs;
      if (combatStats) s.perf.combatVisuals = combatStats;
      s.perf.prepareMs = performance.now() - frameStartedAt;
    }
    return frameState;
  }

  return {
    get active() { return !!renderer && !!canvas; },
    start,
    prepare: render,
    projectPoint,
    stop() {
      if (canvas) canvas.style.display = 'none';
      if (run) run._psySurv3DActive = false;
      slowRendererFrames = 0;
      run = null;
    }
  };
}
