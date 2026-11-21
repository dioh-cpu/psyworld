// Cena 3D da batalha, em duas formas:
// - palco: a arte do elemento (16:9) é o chão. Os seis discos da arte recebem os lutadores: três aliados à esquerda e três
//   inimigos à direita. A visão panorâmica é calculada para a arte caber na tela, e o chão é medido com essa mesma câmera,
//   então cada lutador cai sobre o seu disco.
// - arena lisa (sem arte): o disco escuro com anéis, como antes.
// Nas duas formas, cada monstrinho é um sprite com o pé no chão, de frente para a câmera, sem sombra.
import { POSICOES_ALIADOS, posicaoDoInimigo, vistaDaCamera, VISTAS } from './camera-batalha.js';
import { criarMaterialCor, aplicarGiro as aplicarGiroCor } from './cor-sprite.js';

const ALTURA_PADRAO = 2.1;                  // altura dos monstrinhos na arena lisa
const SEPARACAO = 1.25;                     // distância mínima entre dois monstrinhos na arena lisa
const ARENA = { x: 4.6, z: 5.6 };           // o disco da arena lisa é mais comprido na profundidade
const LIMITE_LUTA = { x: 3.9, z: 4.9 };     // (arena lisa) até onde um monstrinho pode ir
const DAMPING_CAMERA = 3.2;
const MEIA_LARGURA_LUTA = 5.0;              // (arena lisa) metade da largura que a luta ocupa
const METADE_ALTURA_LUTA = 9.2;             // (arena lisa) metade da altura que a luta ocupa
const POSICAO_RESERVA = { x: 0, z: -2.4 };  // slot de inimigo sem uso (fica escondido)

// Palco: a arte tem 1344 x 756 px. Os seis discos, em px da arte: centro (x, y) e raios (rx, ry) até a borda de pedra.
const ARTE = { largura: 1344, altura: 756 };
const DISCOS_ARTE = {
  aliado: [                                 // lado esquerdo; o primeiro aliado fica na frente
    { x: 338, y: 516, rx: 91, ry: 64 },
    { x: 518, y: 394, rx: 86, ry: 58 },
    { x: 385, y: 283, rx: 77, ry: 47 },
  ],
  inimigo: [                                // lado direito; o primeiro inimigo fica no meio
    { x: 827, y: 394, rx: 86, ry: 58 },
    { x: 957, y: 283, rx: 77, ry: 47 },
    { x: 1001, y: 517, rx: 89, ry: 65 },
  ],
};
const DISCO_MUNDO = 2.0;       // diâmetro de um disco no mundo da luta (a câmera do palco é escalada para isso)
const FATOR_LUTADOR = 1.25;    // altura do monstrinho em relação ao diâmetro do disco
const RECUO_ABERTURA = 1.18;   // a abertura da luta fica um pouco mais longe da arena

export function criarCenaBatalha(THREE) {
  const cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(vistaDaCamera('abertura').fov, 1, 0.1, 100);
  const raio = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const posAtual = new THREE.Vector3();
  const olharAtual = new THREE.Vector3();
  let fovAtual = vistaDaCamera('abertura').fov;
  let modo = 'abertura';
  let vistaLivre = null;
  let tremor = 0;
  let tempo = 0;
  let larguraTela = 1;
  let alturaTela = 1;
  let alturaAtual = ALTURA_PADRAO;   // altura dos monstrinhos na forma atual (arena lisa ou palco)
  let arteUrl = null;                // arte do palco; null na arena lisa
  let palco = null;                  // palco da tela atual: { m, pose, poseAbertura, cam, discos, limite }
  const carregador = new THREE.TextureLoader();
  const texturas = new Map();

  // fundo do palco: a arte desfocada e escurecida, cobrindo a tela (aparece nas faixas de cima e de baixo)
  const fundoArte = document.createElement('canvas');
  const texFundoArte = new THREE.CanvasTexture(fundoArte);
  texFundoArte.colorSpace = THREE.SRGBColorSpace;
  let imgArte = null;   // imagem da arte do palco, já carregada
  function desenharFundoArte() {
    if (!imgArte) return;
    const W = Math.max(2, Math.round(larguraTela / 2));
    const H = Math.max(2, Math.round(alturaTela / 2));
    fundoArte.width = W;
    fundoArte.height = H;
    const g = fundoArte.getContext('2d');
    const s = Math.max(W / imgArte.width, H / imgArte.height) * 1.08;   // cobre a tela, com folga para o desfoque
    const w = imgArte.width * s;
    const h = imgArte.height * s;
    g.filter = 'blur(10px)';
    g.drawImage(imgArte, (W - w) / 2, (H - h) / 2, w, h);
    g.filter = 'none';
    g.fillStyle = 'rgba(5, 11, 28, 0.4)';
    g.fillRect(0, 0, W, H);
    texFundoArte.needsUpdate = true;
  }

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

  // arena lisa: disco escuro com anéis claros (as cores vêm do tema da área)
  const discoMat = new THREE.MeshBasicMaterial({ color: '#1c3f73' });
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1, 72), discoMat);
  disco.scale.set(ARENA.x, ARENA.z, 1);
  disco.rotation.x = -Math.PI / 2;
  cena.add(disco);
  const anelMat = new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.85 });
  const anel = new THREE.Mesh(new THREE.RingGeometry(0.94, 0.96, 96), anelMat);
  anel.scale.set(ARENA.x, ARENA.z, 1);
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.01;
  cena.add(anel);
  const anelInternoMat = new THREE.MeshBasicMaterial({ color: '#7fdcff', transparent: true, opacity: 0.35 });
  const anelInterno = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.515, 96), anelInternoMat);
  anelInterno.scale.set(ARENA.x, ARENA.z, 1);
  anelInterno.rotation.x = -Math.PI / 2;
  anelInterno.position.y = 0.012;
  cena.add(anelInterno);

  // palco: a arte mapeada sobre o chão (ver geometriaDoChao)
  const chaoMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
  const chao = new THREE.Mesh(new THREE.BufferGeometry(), chaoMat);
  chao.position.y = -0.02;
  chao.visible = false;
  cena.add(chao);

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

  // o sprite tem a origem no pé (a imagem sobe a partir do chão), então o pé fica no disco ou na arena
  function geometriaDoLutador(largura) {
    const g = new THREE.PlaneGeometry(largura, alturaAtual);
    g.translate(0, alturaAtual / 2, 0);
    return g;
  }
  function refazerGeometria(l) {
    l.malha.geometry.dispose();
    l.malha.geometry = geometriaDoLutador(alturaAtual * l.aspecto);
  }

  function criarLutador(lado, base) {
    const { material, uniforms } = criarMaterialCor(THREE);
    const malha = new THREE.Mesh(geometriaDoLutador(alturaAtual), material);
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
  // até 3 aliados e até 3 inimigos; cada um tem o seu slot (ver camera-batalha.js e o palco)
  const slots = {
    aliado: POSICOES_ALIADOS.map((p) => criarLutador('aliado', p)),
    inimigo: [0, 1, 2].map(() => criarLutador('inimigo', POSICAO_RESERVA)),
  };
  // arruma os inimigos conforme quantos são: no palco, cada um vai para o seu disco
  function disporInimigos(quantidade) {
    slots.inimigo.forEach((l, i) => {
      const p = palco ? palco.discos.inimigo[i] : posicaoDoInimigo(quantidade, i);
      l.base = { x: p.x, z: p.z };
      l.ativo = i < quantidade;
      if (!l.ativo) l.malha.visible = false;
    });
  }
  const lutadorDo = (lado, i) => slots[lado][i];

  // onde o lutador está no repouso (o disco no palco, o slot na arena lisa)
  function posicaoDoLutador(lado, i) {
    const l = lutadorDo(lado, i);
    return { x: l.base.x, z: l.base.z };
  }

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
    const p = projetarPonto(def.malha.position.x, alturaAtual * 0.6, def.malha.position.z);
    faiscas(def.malha.position.x, alturaAtual * 0.6, def.malha.position.z, critico ? '#ffb347' : '#ffd27a');
    return p;
  }

  function cura(lado, i) {
    const l = lutadorDo(lado, i);
    l.curaT = 0.7;
    faiscas(l.malha.position.x, alturaAtual * 0.5, l.malha.position.z, '#9dffb0');
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

  // Vista pelo nome. No palco, a panorâmica e a abertura são as da arte: já enquadram os seis discos, então não recuam.
  function visaoDe(nome) {
    if (palco && nome === 'panoramica') return { ...palco.pose, fixa: true };
    if (palco && nome === 'abertura') return { ...palco.poseAbertura, fixa: true };
    return vistaDaCamera(nome);
  }

  function reiniciarCamera() {
    const v = visaoDe('abertura');
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
    return projetarPonto(l.malha.position.x, alturaAtual * 0.85, l.malha.position.z);
  }

  // ---- palco ----

  // Mapa da arte para a tela: a largura dos discos (com a borda) ocupa 90% da tela, e a altura do conteúdo (do topo
  // do lutador mais alto até a borda de baixo dos discos) ocupa 76%. Vale o que couber.
  function mapaDoPalco(largura, altura) {
    const todos = [...DISCOS_ARTE.aliado, ...DISCOS_ARTE.inimigo];
    const x0 = Math.min(...todos.map((d) => d.x - d.rx));
    const x1 = Math.max(...todos.map((d) => d.x + d.rx));
    const y0 = Math.min(...todos.map((d) => d.y - FATOR_LUTADOR * 2 * d.rx));
    const y1 = Math.max(...todos.map((d) => d.y + d.ry));
    const k = Math.min((0.9 * largura) / (x1 - x0), (0.76 * altura) / (y1 - y0));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    return {
      paraTela: (ax, ay) => ({ x: largura / 2 + (ax - cx) * k, y: altura / 2 + (ay - cy) * k }),
      deTela: (sx, sy) => ({ x: cx + (sx - largura / 2) / k, y: cy + (sy - altura / 2) / k }),
    };
  }

  // Câmera de uma pose, com a mesma projeção da câmera da cena: serve para medir onde cada pixel cai no chão.
  function cameraDaPose(pose, largura, altura) {
    const c = new THREE.PerspectiveCamera(pose.fov, largura / altura, 0.1, 400);
    c.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    c.lookAt(pose.olha[0], pose.olha[1], pose.olha[2]);
    c.updateMatrixWorld(true);
    c.updateProjectionMatrix();
    return c;
  }

  // Ponto do chão (y = 0) atingido pelo raio que passa pelo pixel (sx, sy) da tela; null se o raio não toca o chão.
  function chaoEm(c, largura, altura, sx, sy) {
    ndc.set((sx / largura) * 2 - 1, 1 - (sy / altura) * 2);
    raio.setFromCamera(ndc, c);
    const o = raio.ray.origin;
    const d = raio.ray.direction;
    if (Math.abs(d.y) < 1e-9) return null;
    const t = -o.y / d.y;
    if (t <= 0) return null;
    return { x: o.x + d.x * t, z: o.z + d.z * t };
  }

  // Pose do palco: a direção da visão panorâmica, com a distância que faz o disco do meio medir DISCO_MUNDO.
  // Escalar a câmera e o mundo juntos não muda a imagem: a escala só define o tamanho das coisas no mundo.
  function calcularPalco(largura, altura) {
    const m = mapaDoPalco(largura, altura);
    const { pos, olha, fov } = VISTAS.panoramica;
    const v = [pos[0] - olha[0], pos[1] - olha[1], pos[2] - olha[2]];
    const n = Math.hypot(v[0], v[1], v[2]);
    const dir = v.map((x) => x / n);
    const D0 = 12;
    const c0 = cameraDaPose({ pos: dir.map((x) => x * D0), olha: [0, 0, 0], fov }, largura, altura);
    const meio = DISCOS_ARTE.aliado[1];
    const esq = m.paraTela(meio.x - meio.rx, meio.y);
    const dir2 = m.paraTela(meio.x + meio.rx, meio.y);
    const a = chaoEm(c0, largura, altura, esq.x, esq.y);
    const b = chaoEm(c0, largura, altura, dir2.x, dir2.y);
    const escala = DISCO_MUNDO / Math.hypot(b.x - a.x, b.z - a.z);
    const pose = { pos: dir.map((x) => x * D0 * escala), olha: [0, 0, 0], fov };
    const poseAbertura = {
      pos: dir.map((x) => x * D0 * escala * RECUO_ABERTURA),
      olha: [0, 0, 0],
      fov: VISTAS.abertura.fov,
    };
    const cam = cameraDaPose(pose, largura, altura);
    const noChao = (p) => {
      const s = m.paraTela(p.x, p.y);
      return chaoEm(cam, largura, altura, s.x, s.y);
    };
    const discos = { aliado: DISCOS_ARTE.aliado.map(noChao), inimigo: DISCOS_ARTE.inimigo.map(noChao) };
    const todos = [...discos.aliado, ...discos.inimigo];
    const limite = {
      xmin: Math.min(...todos.map((p) => p.x)) - 1.2,
      xmax: Math.max(...todos.map((p) => p.x)) + 1.2,
      zmin: Math.min(...todos.map((p) => p.z)) - 1.2,
      zmax: Math.max(...todos.map((p) => p.z)) + 1.2,
    };
    return { m, pose, poseAbertura, cam, discos, limite };
  }

  // Malha do chão: uma grade sobre a parte da arte que aparece na tela. Cada vértice é o ponto do chão que a câmera do
  // palco vê naquele pixel e recebe a coordenada da arte nesse pixel. Vista dessa câmera, a arte fica igual à imagem.
  function geometriaDoChao(m, c, largura, altura) {
    const tl = m.paraTela(0, 0);
    const br = m.paraTela(ARTE.largura, ARTE.altura);
    const x0 = Math.max(0, tl.x);
    const x1 = Math.min(largura, br.x);
    const y0 = Math.max(0, tl.y);
    const y1 = Math.min(altura, br.y);
    const NX = 28;
    const NY = 16;
    const pos = [];
    const uv = [];
    const idx = [];
    for (let j = 0; j <= NY; j++) {
      for (let i = 0; i <= NX; i++) {
        const sx = x0 + ((x1 - x0) * i) / NX;
        const sy = y0 + ((y1 - y0) * j) / NY;
        const g = chaoEm(c, largura, altura, sx, sy) ?? { x: 0, z: 0 };
        const a = m.deTela(sx, sy);
        pos.push(g.x, 0, g.z);
        uv.push(a.x / ARTE.largura, 1 - a.y / ARTE.altura);   // a textura tem a origem embaixo
      }
    }
    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const p = j * (NX + 1) + i;
        const q = p + 1;
        const r = p + (NX + 1);
        const s = r + 1;
        idx.push(p, r, q, q, r, s);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  // Monta o palco para a tela atual: chão, discos e limites. Os lutadores ficam sobre os discos.
  function montarPalco() {
    palco = calcularPalco(larguraTela, alturaTela);
    alturaAtual = FATOR_LUTADOR * DISCO_MUNDO;
    chao.geometry.dispose();
    chao.geometry = geometriaDoChao(palco.m, palco.cam, larguraTela, alturaTela);
    slots.aliado.forEach((l, i) => { l.base = { x: palco.discos.aliado[i].x, z: palco.discos.aliado[i].z }; });
    slots.inimigo.forEach((l, i) => { l.base = { x: palco.discos.inimigo[i].x, z: palco.discos.inimigo[i].z }; });
    for (const l of [...slots.aliado, ...slots.inimigo]) refazerGeometria(l);
    desenharFundoArte();
  }

  // Liga o palco de uma arte (url), ou volta para a arena lisa (null). Chamar antes de disporInimigos.
  function definirPalco(url) {
    arteUrl = url;
    const comArte = Boolean(url);
    disco.visible = !comArte;
    anel.visible = !comArte;
    anelInterno.visible = !comArte;
    chao.visible = comArte;
    if (!comArte) {
      palco = null;
      alturaAtual = ALTURA_PADRAO;
      chaoMat.map = null;
      chaoMat.needsUpdate = true;
      imgArte = null;
      cena.background = fundo;
      slots.aliado.forEach((l, i) => { l.base = { x: POSICOES_ALIADOS[i].x, z: POSICOES_ALIADOS[i].z }; });
      for (const l of [...slots.aliado, ...slots.inimigo]) refazerGeometria(l);
      return;
    }
    let tex = texturas.get(url);
    if (!tex) {
      tex = carregador.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      texturas.set(url, tex);
    }
    chaoMat.map = tex;
    chaoMat.needsUpdate = true;
    cena.background = fundo;   // enquanto a imagem da arte não carrega, o fundo é o degradê
    const im = new Image();
    im.onload = () => {
      if (arteUrl !== url) return;   // outra batalha trocou a arte enquanto esta carregava
      imgArte = im;
      cena.background = texFundoArte;
      desenharFundoArte();
    };
    im.src = url;
    montarPalco();
  }

  // Colisão entre os monstrinhos: quem se desloca (avanço ou empurrão) para na distância mínima do outro e não sai da arena.
  // Quem está parado é a parede: o deslocamento nunca o atravessa.
  function resolverColisoes(todos) {
    const vivos = todos.filter((l) => l.malha.visible);
    const separacao = palco ? alturaAtual * 0.4 : SEPARACAO;
    for (const l of vivos) l.p = { x: l.base.x + l.off.x, z: l.base.z + l.off.z };
    for (const l of vivos) {
      const movendo = l.off.x !== 0 || l.off.z !== 0;
      if (movendo) {
        for (const outro of vivos) {
          if (outro === l) continue;
          const dx = l.p.x - outro.p.x;
          const dz = l.p.z - outro.p.z;
          const d = Math.hypot(dx, dz);
          if (d >= separacao) continue;
          const n = d < 1e-6 ? 1 : d;
          const ux = d < 1e-6 ? 0 : dx / n;
          const uz = d < 1e-6 ? 1 : dz / n;
          l.p.x = outro.p.x + ux * separacao;
          l.p.z = outro.p.z + uz * separacao;
        }
      }
      if (palco) {
        l.p.x = Math.min(palco.limite.xmax, Math.max(palco.limite.xmin, l.p.x));
        l.p.z = Math.min(palco.limite.zmax, Math.max(palco.limite.zmin, l.p.z));
      } else {
        const k = Math.hypot(l.p.x / LIMITE_LUTA.x, l.p.z / LIMITE_LUTA.z);
        if (k > 1) {
          l.p.x /= k;
          l.p.z /= k;
        }
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
        refazerGeometria(l);
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
    const v = vistaLivre ?? visaoDe(modo);
    const k = 1 - Math.exp(-dt * DAMPING_CAMERA);
    // na arena lisa, a câmera recua o que for preciso para os dois lados caberem (celular em retrato); o palco já enquadra
    const ox = v.pos[0] - v.olha[0];
    const oy = v.pos[1] - v.olha[1];
    const oz = v.pos[2] - v.olha[2];
    const distancia = Math.hypot(ox, oy, oz);
    const tangente = Math.tan((v.fov * Math.PI) / 360);
    const necessariaLargura = MEIA_LARGURA_LUTA / (tangente * camera.aspect);
    const necessariaAltura = METADE_ALTURA_LUTA / tangente;
    const fator = v.fixa ? 1 : Math.max(1, necessariaLargura / distancia, necessariaAltura / distancia);
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
    if (arteUrl) montarPalco();   // o palco se refaz para a nova tela (o celular girou, por exemplo)
  }

  return {
    cena, camera, tema, definirPalco, definir, golpe, cura, mirar, mirarVista, derrubar, disporInimigos, posicaoDoLutador,
    reiniciarCamera, tremerCamera, projetar, atualizar, resize,
  };
}
