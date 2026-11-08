import * as THREE from '../vendor/three-0.164.1.module.min.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const qualityNames = ['low', 'medium', 'high'];

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
  const projected = { arrays: Object.create(null), items: Object.create(null), helperState: Object.create(null) };

  function qualityFor(s) {
    if (s?.perf?.low) return 'low';
    if (s?.perf?.mobile || s?.perf?.mid) return 'medium';
    return 'high';
  }

  function setQuality(next) {
    const capped = qualityNames[Math.min(qualityNames.indexOf(next), qualityNames.indexOf(qualityCeiling))];
    if (!renderer || capped === quality) return;
    quality = capped;
    const ratio = quality === 'low' ? .56 : quality === 'medium' ? .9 : Math.min(1.35, window.devicePixelRatio || 1);
    renderer.setPixelRatio(ratio);
    renderer.setSize(dimensions.width, dimensions.height, false);
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

    const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .97, metalness: 0, map: texture });
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
    const rockMat = new THREE.MeshStandardMaterial({ color: '#70816b', roughness: .92, flatShading: true });
    const rockMesh = makeInstanceGroup(scene, rockGeo, rockMat, props, (o, p) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 11 * p.scale, p.z);
      o.rotation.set(p.yaw * .18, p.yaw, p.yaw * .11);
      o.scale.set(p.scale * 1.2, p.scale * (.66 + (p.x % 13) / 40), p.scale);
    });

    const shrubGeo = new THREE.IcosahedronGeometry(16, 1);
    const shrubMat = new THREE.MeshStandardMaterial({ color: '#4d7a4e', roughness: .96, flatShading: true });
    const shrubMesh = makeInstanceGroup(scene, shrubGeo, shrubMat, shrubs, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 11 * p.scale, p.z);
      o.rotation.set(.12 + i % 3 * .08, p.yaw, .06);
      o.scale.set(1.55 * p.scale, .75 * p.scale, 1.2 * p.scale);
    });

    const trunkGeo = new THREE.CylinderGeometry(5, 9, 54, 6, 1);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#684d3b', roughness: .98, flatShading: true });
    const trunkMesh = makeInstanceGroup(scene, trunkGeo, trunkMat, trees, (o, p) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 27 * p.scale, p.z);
      o.rotation.set(0, p.yaw, .025);
      o.scale.set(p.scale, p.scale, p.scale);
    });
    const crownGeo = new THREE.ConeGeometry(38, 76, 7, 1);
    const crownMat = new THREE.MeshStandardMaterial({ color: '#386c4b', roughness: .92, flatShading: true });
    const crownMesh = makeInstanceGroup(scene, crownGeo, crownMat, trees, (o, p, i) => {
      o.position.set(p.x + (i % 3 - 1) * 10 * p.scale, terrainHeight(p.x, p.z) + 78 * p.scale, p.z - 3 * p.scale);
      o.rotation.set(.04, p.yaw + i * .1, .03);
      o.scale.set(p.scale, p.scale, p.scale);
    });
    const crownTopGeo = new THREE.ConeGeometry(27, 61, 7, 1);
    const crownTopMat = new THREE.MeshStandardMaterial({ color: '#54875a', roughness: .9, flatShading: true });
    const crownTopMesh = makeInstanceGroup(scene, crownTopGeo, crownTopMat, trees, (o, p, i) => {
      o.position.set(p.x - 4 * p.scale, terrainHeight(p.x, p.z) + 125 * p.scale, p.z + 2 * p.scale);
      o.rotation.set(.02, p.yaw + i * .19, -.02);
      o.scale.set(p.scale * .86, p.scale, p.scale * .86);
    });

    const crystalGeo = new THREE.OctahedronGeometry(18, 0);
    const crystalMat = new THREE.MeshStandardMaterial({ color: '#63c7b4', roughness: .42, metalness: .18, emissive: '#123a35', emissiveIntensity: .45, flatShading: true });
    const crystalMesh = makeInstanceGroup(scene, crystalGeo, crystalMat, crystals, (o, p, i) => {
      o.position.set(p.x, terrainHeight(p.x, p.z) + 17 * p.scale, p.z);
      o.rotation.set(.08, p.yaw + i * .18, .09);
      o.scale.set(.72 * p.scale, 1.45 * p.scale, .72 * p.scale);
    });

    const borderMat = new THREE.MeshStandardMaterial({ color: '#465747', roughness: 1, flatShading: true });
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

  function start(s) {
    if (!s?.c || !s.ctx) return false;
    run = s;
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
      }
      configureDimensions(s);
      renderer.setPixelRatio(qualityCeiling === 'low' ? .56 : qualityCeiling === 'medium' ? .9 : Math.min(1.35, window.devicePixelRatio || 1));
      renderer.setSize(dimensions.width, dimensions.height, false);
      setQuality(qualityCeiling);
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
    const p = new THREE.Vector3(px, terrainHeight(px, pz) + Number(y || 0), pz).project(camera);
    return { x: (p.x + 1) * dimensions.width * .5, y: (1 - p.y) * dimensions.height * .5, depth: p.z };
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
    const entities = [];
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
    view.bossHazards = projectArray((s.bossHazards || []).filter(h => !['bossMeteor', 'bossTrap'].includes(h.kind)), 'bossHazards', ['r', 'radius', 'width', 'length', 'len']);

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
    const renderStartedAt = performance.now();
    renderer.render(scene, camera);
    const rendererMs = performance.now() - renderStartedAt;
    avgRendererMs = avgRendererMs ? avgRendererMs * .88 + rendererMs * .12 : rendererMs;
    adaptQuality(s, now, dt);
    const projectionStartedAt = performance.now();
    const frameState = projectRenderState(s);
    if (s.perf) {
      s.perf.rendererMs = avgRendererMs;
      s.perf.projectionMs = performance.now() - projectionStartedAt;
      s.perf.cameraMs = cameraMs;
      s.perf.scenePrepMs = scenePrepMs;
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
      run = null;
    }
  };
}
