// Cena 3D da batalha: arena em círculo, os monstrinhos em pé no chão e a câmera isométrica do roteiro da luta.
// Cada monstrinho é um sprite com o pé na arena. Ele fica de frente para a câmera (não fica fino de cima nem de lado),
// sem sombra. Os aliados mostram as costas e os inimigos a frente. Os lutadores não se atravessam: quem avança ou apanha
// para na distância mínima do outro e não sai do disco.
import { POSICOES_ALIADOS, posicaoDoInimigo, vistaDaCamera } from './camera-batalha.js';
import { criarMaterialCor, aplicarGiro as aplicarGiroCor } from './cor-sprite.js';

const ALTURA = 2.1;              // altura dos monstrinhos na arena (do pé à cabeça)
const SEPARACAO = 1.25;          // distância mínima entre dois monstrinhos
const RAIO_ARENA = 3.5;          // até onde um monstrinho pode ir (o disco tem 4,2)
const DAMPING_CAMERA = 3.2;
const MEIA_LARGURA_LUTA = 3.2;   // metade da largura que o time e os inimigos ocupam na tela (em unidades da arena)
const POSICAO_RESERVA = { x: 0, z: -2.4 };   // slot de inimigo sem uso (fica escondido)

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

  // o sprite tem a origem no pé (a imagem sobe a partir do chão), então o pé fica na arena
  function geometriaDoLutador(largura) {
    const g = new THREE.PlaneGeometry(largura, ALTURA);
    g.translate(0, ALTURA / 2, 0);
    return g;
  }

  function criarLutador(lado, base) {
    const { material, uniforms } = criarMaterialCor(THREE);
    const malha = new THREE.Mesh(geometriaDoLutador(ALTURA), material);
    malha.visible = false;
    cena.add(malha);
    return {
      lado, uniforms, malha,
      base: { x: base.x, z: base.z },   // onde fica no repouso
      off: { x: 0, z: 0 },              // deslocamento do golpe (avanço ou empurrão), somado à base
      p: { x: base.x, z: base.z },      // posição usada na colisão deste quadro
      pronto: false, aspecto: 1,
      lunge: 0, lungeTotal: 1, lungeAmp: 0.7, lungeDir: { x: 0, z: 0 },
      golpeT: 0, curaT: 0, knock: 0, knockDir: { x: 0, z: 0 },
      anim: null,
      ativo: false, derrubado: false,
    };
  }
  // até 3 aliados e até 3 inimigos; cada um tem o seu slot na arena (ver camera-batalha.js)
  const slots = {
    aliado: POSICOES_ALIADOS.map((p) => criarLutador('aliado', p)),
    inimigo: [0, 1, 2].map(() => criarLutador('inimigo', POSICAO_RESERVA)),
  };
  // arruma os inimigos conforme quantos são; os aliados ficam sempre nos três slots
  function disporInimigos(quantidade) {
    slots.inimigo.forEach((l, i) => {
      const p = posicaoDoInimigo(quantidade, i);
      l.base = { x: p.x, z: p.z };
      l.ativo = i < quantidade;
      if (!l.ativo) l.malha.visible = false;
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
    l.lunge = 0;
    l.golpeT = 0;
    l.curaT = 0;
    l.off = { x: 0, z: 0 };
    if (giro && animar) {
      l.anim = { de: NATURAL, ate: giro, t: 0, dur };
      aplicarGiro(l, NATURAL);
    } else {
      l.anim = null;
      aplicarGiro(l, giro ?? NATURAL);
    }
  }

  // vetor unitário de `a` até `b` (no chão)
  function direcaoEntre(a, b) {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const d = Math.hypot(dx, dz);
    return d < 1e-6 ? { x: 0, z: 1 } : { x: dx / d, z: dz / d };
  }

  // Quem age avança até o alvo e volta. Quem leva o golpe treme, pisca e é empurrado para trás.
  function golpe(ladoAtq, iAtq, ladoDef, iDef, { critico = false, habilidade = false } = {}) {
    const atq = lutadorDo(ladoAtq, iAtq);
    const def = lutadorDo(ladoDef, iDef);
    const dir = direcaoEntre(atq.base, def.base);
    atq.lungeDir = dir;
    atq.lungeTotal = habilidade ? 0.6 : 0.38;
    atq.lungeAmp = habilidade ? 1.1 : 0.7;
    atq.lunge = atq.lungeTotal;
    def.golpeT = 0.32;
    def.knock = critico ? 0.22 : 0.12;
    def.knockDir = { x: -dir.x, z: -dir.z };
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

  // Colisão entre os monstrinhos: quem se desloca (avanço ou empurrão) para na distância mínima do outro e não sai do disco.
  // Quem está parado é a parede: o deslocamento nunca o atravessa.
  function resolverColisoes(todos) {
    const vivos = todos.filter((l) => l.malha.visible);
    for (const l of vivos) l.p = { x: l.base.x + l.off.x, z: l.base.z + l.off.z };
    for (const l of vivos) {
      const movendo = l.off.x !== 0 || l.off.z !== 0;
      if (movendo) {
        for (const outro of vivos) {
          if (outro === l) continue;
          const dx = l.p.x - outro.p.x;
          const dz = l.p.z - outro.p.z;
          const d = Math.hypot(dx, dz);
          if (d >= SEPARACAO) continue;
          const n = d < 1e-6 ? 1 : d;
          const ux = d < 1e-6 ? 0 : dx / n;
          const uz = d < 1e-6 ? 1 : dz / n;
          l.p.x = outro.p.x + ux * SEPARACAO;
          l.p.z = outro.p.z + uz * SEPARACAO;
        }
      }
      const r = Math.hypot(l.p.x, l.p.z);
      if (r > RAIO_ARENA) {
        l.p.x *= RAIO_ARENA / r;
        l.p.z *= RAIO_ARENA / r;
      }
      l.malha.position.set(l.p.x, 0, l.p.z);
    }
  }

  function atualizar(dt, t) {
    tempo = t;
    const todos = [...slots.aliado, ...slots.inimigo];
    for (const l of todos) {
      if (!l.ativo && !l.malha.visible) continue;
      // o sprite fica com a proporção da imagem assim que ela carregar (folhas de direção só depois de cortadas)
      const mapa = l.uniforms.map.value;
      const img = mapa?.image;
      if (img && !l.pronto && (img.width || img.naturalWidth) && mapa.userData?.carregada !== false) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        l.aspecto = w / h;
        l.malha.geometry.dispose();
        l.malha.geometry = geometriaDoLutador(ALTURA * l.aspecto);
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
      // avanço no golpe e empurrão no que apanha (deslocamento a partir da base, em x e z)
      let ox = 0;
      let oz = 0;
      if (l.lunge > 0) {
        l.lunge = Math.max(0, l.lunge - dt);
        const p = 1 - l.lunge / l.lungeTotal;
        const f = Math.sin(p * Math.PI) * l.lungeAmp;
        ox += f * l.lungeDir.x;
        oz += f * l.lungeDir.z;
      }
      if (l.golpeT > 0) {
        l.golpeT = Math.max(0, l.golpeT - dt);
        const f = l.knock * (l.golpeT / 0.32);
        ox += f * l.knockDir.x;
        oz += f * l.knockDir.z;
        l.uniforms.uFlash.value = (l.golpeT / 0.32) * 0.85;
        l.uniforms.uCor.value.set('#ffffff');
      } else if (l.curaT > 0) {
        l.curaT = Math.max(0, l.curaT - dt);
        l.uniforms.uFlash.value = (l.curaT / 0.7) * 0.6;
        l.uniforms.uCor.value.set('#9dffb0');
      } else {
        l.uniforms.uFlash.value = 0;
      }
      l.off = { x: ox, z: oz };
    }
    resolverColisoes(todos);
    atualizarFaiscas(dt);

    // câmera: vai até a vista pedida, com tremor no impacto
    const v = vistaLivre ?? vistaDaCamera(modo);
    const k = 1 - Math.exp(-dt * DAMPING_CAMERA);
    // a câmera recua o que for preciso para os dois lados caberem na largura (celular em retrato)
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
    // o sprite fica de frente para a câmera (inteiro, sem achatar), com o pé no chão
    for (const l of todos) l.malha.quaternion.copy(camera.quaternion);
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
