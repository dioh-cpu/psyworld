// Cena 3D da batalha: arena em círculo, os dois monstrinhos como desenhos de pé e a câmera do roteiro da luta.
// O desenho é o sprite da espécie. A cor de uma variação é um giro de matiz feito no sombreador, por isso dá para animar a troca.
import { POSICAO, vistaDaCamera } from './camera-batalha.js';

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// O giro de matiz segue a matriz de hue-rotate do CSS, para o azul de cá ser o mesmo que no painel.
const FRAG = `
uniform sampler2D map;
uniform float uHue;
uniform float uFlash;
uniform vec3 uCor;
uniform float uAlpha;
varying vec2 vUv;
vec3 girar(vec3 c, float a) {
  float co = cos(a);
  float si = sin(a);
  vec3 r0 = vec3(0.213 + co * 0.787 - si * 0.213, 0.715 - co * 0.715 - si * 0.715, 0.072 - co * 0.072 + si * 0.928);
  vec3 r1 = vec3(0.213 - co * 0.213 + si * 0.143, 0.715 + co * 0.285 + si * 0.140, 0.072 - co * 0.072 - si * 0.283);
  vec3 r2 = vec3(0.213 - co * 0.213 - si * 0.787, 0.715 - co * 0.715 + si * 0.715, 0.072 + co * 0.928 + si * 0.072);
  return vec3(dot(r0, c), dot(r1, c), dot(r2, c));
}
void main() {
  vec4 t = texture2D(map, vUv);
  vec3 c = girar(t.rgb, uHue);
  c = mix(c, uCor, uFlash);
  gl_FragColor = vec4(c, t.a * uAlpha);
  if (gl_FragColor.a < 0.01) discard;
}`;

const ALTURA = 2.4;        // altura dos monstrinhos na arena
const DAMPING_CAMERA = 3.2;

export function criarCenaBatalha(THREE) {
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(vistaDaCamera('abertura').fov, 1, 0.1, 100);
  const posAtual = new THREE.Vector3();
  const olharAtual = new THREE.Vector3();
  let fovAtual = vistaDaCamera('abertura').fov;
  let modo = 'abertura';
  let tremor = 0;
  let tempo = 0;
  let larguraTela = 1;
  let alturaTela = 1;

  // fundo em degradê, do mesmo tom de crepúsculo do mapa
  const gc = document.createElement('canvas');
  gc.width = 4;
  gc.height = 256;
  const gg = gc.getContext('2d');
  const grad = gg.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#2a5597');
  grad.addColorStop(0.6, '#0f2550');
  grad.addColorStop(1, '#050b1c');
  gg.fillStyle = grad;
  gg.fillRect(0, 0, 4, 256);
  cena.background = new THREE.CanvasTexture(gc);

  // arena: disco escuro com anéis claros
  const disco = new THREE.Mesh(new THREE.CircleGeometry(4.2, 72), new THREE.MeshBasicMaterial({ color: '#1c3f73' }));
  disco.rotation.x = -Math.PI / 2;
  cena.add(disco);
  const anel = new THREE.Mesh(new THREE.RingGeometry(4.0, 4.12, 96),
    new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.85 }));
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.01;
  cena.add(anel);
  const anelInterno = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.16, 96),
    new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.35 }));
  anelInterno.rotation.x = -Math.PI / 2;
  anelInterno.position.y = 0.012;
  cena.add(anelInterno);

  // faíscas de impacto: um lote fixo de pontos reaproveitado
  const N = 48;
  const posFaisca = new Float32Array(N * 3);
  const velFaisca = new Float32Array(N * 3);
  const vidaFaisca = new Float32Array(N);
  const geoFaisca = new THREE.BufferGeometry();
  geoFaisca.setAttribute('position', new THREE.BufferAttribute(posFaisca, 3));
  const matFaisca = new THREE.PointsMaterial({ color: '#ffd27a', size: 0.16, transparent: true, depthWrite: false });
  cena.add(new THREE.Points(geoFaisca, matFaisca));
  let proximaFaisca = 0;
  function faiscas(x, y, z, cor) {
    matFaisca.color.set(cor);
    for (let k = 0; k < 14; k++) {
      const i = proximaFaisca;
      proximaFaisca = (proximaFaisca + 1) % N;
      posFaisca[i * 3] = x;
      posFaisca[i * 3 + 1] = y;
      posFaisca[i * 3 + 2] = z;
      velFaisca[i * 3] = (Math.random() - 0.5) * 3.2;
      velFaisca[i * 3 + 1] = 1.2 + Math.random() * 2.2;
      velFaisca[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      vidaFaisca[i] = 0.45 + Math.random() * 0.3;
    }
  }
  function atualizarFaiscas(dt) {
    for (let i = 0; i < N; i++) {
      if (vidaFaisca[i] > 0) {
        vidaFaisca[i] -= dt;
        posFaisca[i * 3] += velFaisca[i * 3] * dt;
        posFaisca[i * 3 + 1] += velFaisca[i * 3 + 1] * dt;
        posFaisca[i * 3 + 2] += velFaisca[i * 3 + 2] * dt;
        velFaisca[i * 3 + 1] -= 5 * dt;
        if (vidaFaisca[i] <= 0) posFaisca[i * 3 + 1] = -100;
      }
    }
    geoFaisca.attributes.position.needsUpdate = true;
  }

  // sombra de cada monstrinho no chão
  const criarSombra = () => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32),
      new THREE.MeshBasicMaterial({ color: '#000814', transparent: true, opacity: 0.45, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.scale.set(1.3, 0.55, 1);
    m.visible = false;
    cena.add(m);
    return m;
  };

  function criarLutador(lado) {
    const uniforms = {
      map: { value: null },
      uHue: { value: 0 },
      uFlash: { value: 0 },
      uCor: { value: new THREE.Color('#ffffff') },
      uAlpha: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const malha = new THREE.Mesh(new THREE.PlaneGeometry(ALTURA, ALTURA), material);
    malha.visible = false;
    cena.add(malha);
    return {
      lado, uniforms, malha, sombra: criarSombra(),
      base: { x: POSICAO[lado].x, z: POSICAO[lado].z },
      flip: lado === 'inimigo',
      pronto: false, aspecto: 1,
      fase: Math.random() * 6.28,
      lunge: 0, lungeTotal: 1, lungeAmp: 0.7, lungeDir: 0,
      golpeT: 0, curaT: 0, knock: 0,
      hueDe: 0, hueAte: 0, hueT: 0, hueDur: 0,
    };
  }
  const lutadores = { jogador: criarLutador('jogador'), inimigo: criarLutador('inimigo') };

  // Mostra um monstrinho. Se `animarDe` for dado, a cor vai de `animarDe` até `matiz` (graus) em `dur` segundos.
  function definir(lado, { textura, matiz = 0, animarDe = null, dur = 1.4 }) {
    const l = lutadores[lado];
    l.uniforms.map.value = textura;
    l.pronto = false;
    l.malha.visible = true;
    l.sombra.visible = true;
    l.malha.scale.x = l.flip ? -1 : 1;
    if (animarDe !== null) {
      Object.assign(l, { hueDe: animarDe, hueAte: matiz, hueT: 0, hueDur: dur });
    } else {
      l.hueDur = 0;
      l.uniforms.uHue.value = (matiz * Math.PI) / 180;
    }
  }

  // Quem age avança até o alvo e volta. Quem leva o golpe treme, pisca e é empurrado para trás.
  function golpe(lado, alvo, { critico = false, habilidade = false } = {}) {
    const atq = lutadores[lado];
    const def = lutadores[alvo];
    atq.lungeDir = Math.sign(def.base.x - atq.base.x);
    atq.lungeTotal = habilidade ? 0.6 : 0.38;
    atq.lungeAmp = habilidade ? 1.1 : 0.7;
    atq.lunge = atq.lungeTotal;
    def.golpeT = 0.32;
    def.knock = critico ? 0.22 : 0.12;
    def.knockDir = -atq.lungeDir;
    tremor = Math.max(tremor, critico ? 0.16 : 0.07);
    const p = projetarPonto(def.malha.position.x, ALTURA * 0.6, def.malha.position.z);
    faiscas(def.malha.position.x, ALTURA * 0.6, def.malha.position.z, critico ? '#ffb347' : '#ffd27a');
    return p;
  }

  function cura(lado) {
    const l = lutadores[lado];
    l.curaT = 0.7;
    faiscas(l.malha.position.x, ALTURA * 0.5, l.malha.position.z, '#9dffb0');
  }

  // Vista da câmera. A passagem é suavizada no atualizar, então trocar de vista não corta.
  function mirar(nome) {
    modo = nome;
  }

  function reiniciarCamera() {
    const v = vistaDaCamera('abertura');
    posAtual.set(...v.pos);
    olharAtual.set(...v.olha);
    fovAtual = v.fov;
    camera.fov = fovAtual;
    camera.updateProjectionMatrix();
    modo = 'abertura';
  }

  function tremerCamera(valor) {
    tremor = Math.max(tremor, valor);
  }

  // Posição de um ponto da arena na tela, em pixels (para escrever o número do dano).
  function projetarPonto(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(camera);
    return { x: ((v.x + 1) / 2) * larguraTela, y: ((1 - v.y) / 2) * alturaTela };
  }
  function projetar(lado) {
    const l = lutadores[lado];
    return projetarPonto(l.malha.position.x, ALTURA * 0.85, l.malha.position.z);
  }

  function atualizar(dt, t) {
    tempo = t;
    for (const l of Object.values(lutadores)) {
      // o sprite fica com a proporção da imagem assim que ela carregar
      const img = l.uniforms.map.value?.image;
      if (img && !l.pronto && (img.width || img.naturalWidth)) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        l.aspecto = w / h;
        l.malha.geometry.dispose();
        l.malha.geometry = new THREE.PlaneGeometry(ALTURA * l.aspecto, ALTURA);
        l.pronto = true;
      }
      // transformação de cor (variação): o giro de matiz vai de um valor a outro
      if (l.hueDur > 0) {
        l.hueT = Math.min(l.hueDur, l.hueT + dt);
        const k = l.hueT / l.hueDur;
        const suave = k * k * (3 - 2 * k);
        l.uniforms.uHue.value = ((l.hueDe + (l.hueAte - l.hueDe) * suave) * Math.PI) / 180;
        if (l.hueT >= l.hueDur) l.hueDur = 0;
      }
      // pulo de respiração, um avanço no golpe e um empurrão no que apanha
      let dx = 0;
      if (l.lunge > 0) {
        l.lunge = Math.max(0, l.lunge - dt);
        const p = 1 - l.lunge / l.lungeTotal;
        dx += Math.sin(p * Math.PI) * l.lungeAmp * l.lungeDir;
      }
      if (l.golpeT > 0) {
        l.golpeT = Math.max(0, l.golpeT - dt);
        dx += -(l.knockDir || 0) * l.knock * (l.golpeT / 0.32);
        l.uniforms.uFlash.value = (l.golpeT / 0.32) * 0.85;
        l.uniforms.uCor.value.set('#ffffff');
      } else if (l.curaT > 0) {
        l.curaT = Math.max(0, l.curaT - dt);
        l.uniforms.uFlash.value = (l.curaT / 0.7) * 0.6;
        l.uniforms.uCor.value.set('#9dffb0');
      } else {
        l.uniforms.uFlash.value = 0;
      }
      const bob = Math.sin(tempo * 2 + l.fase) * 0.025;
      l.malha.position.set(l.base.x + dx, ALTURA / 2 + bob, l.base.z);
      l.sombra.position.set(l.base.x + dx, 0.02, l.base.z);
    }
    atualizarFaiscas(dt);

    // câmera: vai até a vista pedida, com tremor no impacto
    const v = vistaDaCamera(modo);
    const k = 1 - Math.exp(-dt * DAMPING_CAMERA);
    // em tela estreita (celular em retrato) a câmera recua, para os dois lutadores caberem
    const recuo = camera.aspect < 1 ? (1 / camera.aspect - 1) * 9 : 0;
    posAtual.lerp(new THREE.Vector3(v.pos[0], v.pos[1], v.pos[2] + recuo), k);
    olharAtual.lerp(new THREE.Vector3(...v.olha), k);
    fovAtual += (v.fov - fovAtual) * k;
    tremor = Math.max(0, tremor - dt * 0.9);
    const sx = Math.sin(tempo * 61) * tremor;
    const sy = Math.cos(tempo * 47) * tremor * 0.7;
    camera.position.set(posAtual.x + sx, posAtual.y + sy, posAtual.z);
    camera.lookAt(olharAtual);
    if (Math.abs(camera.fov - fovAtual) > 1e-3) {
      camera.fov = fovAtual;
      camera.updateProjectionMatrix();
    }
  }

  function resize(largura, altura) {
    larguraTela = largura;
    alturaTela = altura;
    camera.aspect = largura / altura;
    camera.updateProjectionMatrix();
  }

  return {
    cena, camera, definir, golpe, cura, mirar, reiniciarCamera, tremerCamera, projetar, atualizar, resize,
  };
}
