// Cena 3D da batalha: arena em círculo, os dois monstrinhos como desenhos de pé e a câmera do roteiro da luta.
// O desenho é o sprite da espécie. A cor de uma variação é um giro de matiz feito no sombreador, por isso dá para animar a troca.
import { POSICOES_ALIADOS, posicaoDoInimigo, vistaDaCamera } from './camera-batalha.js';
import { criarMaterialCor, aplicarGiro as aplicarGiroCor } from './cor-sprite.js';

const ALTURA = 2.4;        // altura dos monstrinhos na arena
const POSICAO_PADRAO_INIMIGO = { x: 2.5, z: -0.7 };
const DAMPING_CAMERA = 3.2;
const MEIA_LARGURA_LUTA = 6.2; // espaço que o time e os inimigos precisam ocupar na tela (até 3 contra 3, em unidades da arena)

export function criarCenaBatalha(THREE) {
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(vistaDaCamera('abertura').fov, 1, 0.1, 100);
  const posAtual = new THREE.Vector3();
  const olharAtual = new THREE.Vector3();
  let fovAtual = vistaDaCamera('abertura').fov;
  let modo = 'abertura';
  let vistaLivre = null;
  let tremor = 0;
  let tempo = 0;
  let larguraTela = 1;
  let alturaTela = 1;

  // fundo em degradê, do mesmo tom de crepúsculo do mapa
  const gc = document.createElement('canvas');
  gc.width = 4;
  gc.height = 256;
  const gg = gc.getContext('2d');
  const fundo = new THREE.CanvasTexture(gc);
  cena.background = fundo;
  // degradê do topo ao pé da arena; o meio é a mistura dos dois
  function pintarFundo(topo, base) {
    const grad = gg.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, topo);
    grad.addColorStop(0.6, new THREE.Color(topo).lerp(new THREE.Color(base), 0.6).getStyle());
    grad.addColorStop(1, base);
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 4, 256);
    fundo.needsUpdate = true;
  }
  pintarFundo('#2a5597', '#050b1c');

  // arena: disco escuro com anéis claros (as cores vêm do tema da área)
  const discoMat = new THREE.MeshBasicMaterial({ color: '#1c3f73' });
  const disco = new THREE.Mesh(new THREE.CircleGeometry(4.2, 72), discoMat);
  disco.rotation.x = -Math.PI / 2;
  cena.add(disco);
  const anelMat = new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.85 });
  const anel = new THREE.Mesh(new THREE.RingGeometry(4.0, 4.12, 96), anelMat);
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.01;
  cena.add(anel);
  const anelInternoMat = new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.35 });
  const anelInterno = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.16, 96), anelInternoMat);
  anelInterno.rotation.x = -Math.PI / 2;
  anelInterno.position.y = 0.012;
  cena.add(anelInterno);

  // tema da área: cores do fundo, do disco e dos anéis. Cada região da ilha tem a sua.
  function tema(arena) {
    pintarFundo(arena.fundoTopo, arena.fundoBase);
    discoMat.color.set(arena.disco);
    anelMat.color.set(arena.anel);
    anelInternoMat.color.set(arena.anel);
  }

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

  function criarLutador(lado, base) {
    const { material, uniforms } = criarMaterialCor(THREE);
    const malha = new THREE.Mesh(new THREE.PlaneGeometry(ALTURA, ALTURA), material);
    malha.visible = false;
    cena.add(malha);
    return {
      lado, uniforms, malha, sombra: criarSombra(),
      base: { x: base.x, z: base.z },
      flip: lado === 'inimigo',
      pronto: false, aspecto: 1,
      fase: Math.random() * 6.28,
      lunge: 0, lungeTotal: 1, lungeAmp: 0.7, lungeDir: 0,
      golpeT: 0, curaT: 0, knock: 0,
      anim: null,
    };
  }
  // até 3 aliados e até 3 inimigos; cada um tem o seu slot na arena (ver camera-batalha.js)
  const slots = {
    aliado: POSICOES_ALIADOS.map((p) => criarLutador('aliado', p)),
    inimigo: [0, 1, 2].map(() => criarLutador('inimigo', POSICAO_PADRAO_INIMIGO)),
  };
  // arruma os inimigos conforme quantos são; os aliados ficam sempre nos três slots
  function disporInimigos(quantidade) {
    slots.inimigo.forEach((l, i) => {
      const p = posicaoDoInimigo(quantidade, i);
      l.base = { x: p.x, z: p.z };
      l.ativo = i < quantidade;
      if (!l.ativo) { l.malha.visible = false; l.sombra.visible = false; }
    });
  }
  const lutadorDo = (lado, i) => slots[lado][i];

  const NATURAL = { matiz: 0, sat: 1, bri: 1 };
  const aplicarGiro = (l, g) => aplicarGiroCor(THREE, l.uniforms, g);

  // Mostra um monstrinho. `giro` é a cor da variação (null é o natural). Com `animar`, a cor vai do natural até a variação.
  function definir(lado, i, { textura, giro = null, animar = false, dur = 1.4 }) {
    const l = lutadorDo(lado, i);
    l.ativo = true;
    l.derrubado = false;
    l.uniforms.map.value = textura;
    l.pronto = false;
    l.malha.visible = true;
    l.sombra.visible = true;
    l.malha.scale.x = l.flip ? -1 : 1;
    if (giro && animar) {
      l.anim = { de: NATURAL, ate: giro, t: 0, dur };
      aplicarGiro(l, NATURAL);
    } else {
      l.anim = null;
      aplicarGiro(l, giro ?? NATURAL);
    }
  }

  // Quem age avança até o alvo e volta. Quem leva o golpe treme, pisca e é empurrado para trás.
  function golpe(ladoAtq, iAtq, ladoDef, iDef, { critico = false, habilidade = false } = {}) {
    const atq = lutadorDo(ladoAtq, iAtq);
    const def = lutadorDo(ladoDef, iDef);
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

  function cura(lado, i) {
    const l = lutadorDo(lado, i);
    l.curaT = 0.7;
    faiscas(l.malha.position.x, ALTURA * 0.5, l.malha.position.z, '#9dffb0');
  }

  // Vista da câmera. A passagem é suavizada no atualizar, então trocar de vista não corta.
  function mirar(nome) {
    modo = nome;
    vistaLivre = null;
  }
  // Vista livre (ex.: presa num alvo): recebe { pos, olha, fov }.
  function mirarVista(v) {
    vistaLivre = v;
  }
  // Tira um lutador caído da arena.
  function derrubar(lado, i) {
    const l = lutadorDo(lado, i);
    l.derrubado = true;
    l.anim = null;
    l.malha.visible = false;
    l.sombra.visible = false;
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
  function projetar(lado, i) {
    const l = lutadorDo(lado, i);
    return projetarPonto(l.malha.position.x, ALTURA * 0.85, l.malha.position.z);
  }

  function atualizar(dt, t) {
    tempo = t;
    for (const l of [...slots.aliado, ...slots.inimigo]) {
      if (!l.ativo && !l.malha.visible) continue;
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
      // transformação de cor (variação): do natural até a cor da variação, com as três partes do giro juntas
      if (l.anim) {
        l.anim.t = Math.min(l.anim.dur, l.anim.t + dt);
        const k = l.anim.t / l.anim.dur;
        const suave = k * k * (3 - 2 * k);
        const mistura = (a, b) => a + (b - a) * suave;
        aplicarGiro(l, {
          matiz: mistura(l.anim.de.matiz, l.anim.ate.matiz),
          sat: mistura(l.anim.de.sat, l.anim.ate.sat),
          bri: mistura(l.anim.de.bri, l.anim.ate.bri),
          colorir: k >= 0.5 && Boolean(l.anim.ate.colorir),
        });
        if (l.anim.t >= l.anim.dur) l.anim = null;
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
    const v = vistaLivre ?? vistaDaCamera(modo);
    const k = 1 - Math.exp(-dt * DAMPING_CAMERA);
    // em tela estreita (celular em retrato) a câmera recua, para os dois lutadores caberem
    // a câmera recua o que for preciso para os dois lutadores caberem na largura (celular em retrato)
    const ox = v.pos[0] - v.olha[0];
    const oy = v.pos[1] - v.olha[1];
    const oz = v.pos[2] - v.olha[2];
    const distancia = Math.hypot(ox, oy, oz);
    const necessaria = MEIA_LARGURA_LUTA / (Math.tan((v.fov * Math.PI) / 360) * camera.aspect);
    const fator = Math.max(1, necessaria / distancia);
    posAtual.lerp(new THREE.Vector3(v.olha[0] + ox * fator, v.olha[1] + oy * fator, v.olha[2] + oz * fator), k);
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
    cena, camera, tema, definir, golpe, cura, mirar, mirarVista, derrubar, disporInimigos, reiniciarCamera, tremerCamera, projetar, atualizar, resize,
  };
}
