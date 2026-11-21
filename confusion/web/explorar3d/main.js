// Protótipo de exploração 3D: terceira pessoa, colisão com prédios, placa, minimapa, registro de espólios,
// selvagens que rondam a ilha e batalha em 3D (regras de combate.js, câmera e roteiro em cena-batalha.js e camera-batalha.js).
// Tela de Time: troca de habilidades nos slots 1 a 4 a qualquer momento. Controle de toque: joystick e botões.
import * as THREE from 'three';
import { resolverMovimento, fracaoLivreCamera } from './colisao.js';
import { vetorJoystick } from './controles.js';
import { CAIXAS, CIDADES_MUNDO, REGIOES, INICIO, SINAL, LIMITE_MAPA, PONTOS_SELVAGENS, localDe } from './mundo.js';
import { linhasDoRegistro, EXEMPLO_ESPOLIO } from './registro.js';
import { criarCenaBatalha } from './cena-batalha.js';
import { criarMaterialCor, aplicarGiro, NATURAL } from './cor-sprite.js';
import { AREAS, areaDaRegiao } from './areas.js';
import { vistaDoAlvo } from './camera-batalha.js';
import * as BE from './batalha-equipe.js';
import { montarMundo, COR_HORIZONTE, ALTURA_JOGADOR } from './mundo-3d.js';
import * as C from '../core.js';
import * as CB from '../combate.js';
import * as E from '../species.js';
import * as V from '../variacoes.js';
import {
  timeInicial, sortearSelvagem, lutadorDo, opcoesDeAcao, aplicarResultado, recompensaDaBatalha, itensDoEspolio,
  RARIDADE_NOME, POCOES_INICIAIS, SLOTS, definirSlot, habilidadesDisponiveis, giroDoMonstro, nomeDaVariante,
  eventosDoTurno, roteiroDoTurno,
} from './batalha.js';

const RAIO = 0.5;             // raio do personagem no plano do chão
const VELOCIDADE = 4.5;       // unidades por segundo com o controle no máximo
const ALTURA_ALVO = ALTURA_JOGADOR * 0.8;   // a câmera mira um pouco abaixo do topo do personagem
const distanciaCamera = () => (window.innerWidth < 600 ? 13 : 11); // celular em retrato precisa de mais afastamento
const COR_MAR = '#2b5a86';
const COR_TRACO = '#e6ebf0';  // faixas claras do piso da praça
const RAIZ = document.body.dataset.raiz || '';   // caminho até a raiz do projeto, para as artes dos monstrinhos
const COR_ELEMENTO = Object.fromEntries(Object.entries(V.COR).map(([k, v]) => [k, v.hex]));
const NOME_ELEMENTO = C.NOME_ELEMENTO;
const RESPAWN_MS = 12000;
const ROTULO_EFICACIA = { super: 'Super efetivo!', pouco: 'Pouco efetivo', nulo: 'Sem efeito' };     // tempo até outro selvagem aparecer no lugar do que foi enfrentado

// ---- cena do mapa ----
const canvas = document.getElementById('cena');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(COR_HORIZONTE);   // o céu de verdade é a cúpula de mundo-3d.js
scene.fog = new THREE.Fog(COR_HORIZONTE, 60, 170);    // o chão e o mar esmaecem até o horizonte

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);   // enxerga a cúpula do céu

// sombreado em três tons, o que dá o efeito de desenho animado
const tons = new Uint8Array([95, 175, 255]);
const degraus = new THREE.DataTexture(tons, 3, 1, THREE.RedFormat);
degraus.minFilter = degraus.magFilter = THREE.NearestFilter;
degraus.needsUpdate = true;
const material = (cor, mapa = null) => new THREE.MeshToonMaterial({ color: cor, gradientMap: degraus, map: mapa });

scene.add(new THREE.AmbientLight('#7d8ea8', 0.9));
const sol = new THREE.DirectionalLight('#ffe2b0', 2.0);   // luz quente vindo do alto
sol.position.set(8, 14, 6);
scene.add(sol);

// contorno de desenho: uma cópia um pouco maior, pintada de escuro por trás
function contorno(mesh, escala = 1.05) {
  const m = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#0d1420', side: THREE.BackSide }));
  m.scale.setScalar(escala);
  mesh.add(m);
}

// mar em volta da ilha
const mar = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), material(COR_MAR));
mar.rotation.x = -Math.PI / 2;
mar.position.y = -0.3;
scene.add(mar);

// chão das regiões, areia, estradas, prédios, lago, árvores, pedras e objetos (ver mundo-3d.js)
montarMundo(scene, { material, contorno, raiz: RAIZ });

// piso da praça: anel claro e medalhão no centro
const anel = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.1, 64), material(COR_TRACO));
anel.rotation.x = -Math.PI / 2;
anel.position.y = 0.02;
scene.add(anel);
const medalhao = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), material(COR_TRACO));
medalhao.rotation.x = -Math.PI / 2;
medalhao.position.y = 0.02;
scene.add(medalhao);

// placa interativa na praça: poste e painel
const placa = new THREE.Group();
placa.position.set(SINAL.x, 0, SINAL.z);
const poste = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.6, 0.15), material('#7a5230'));
poste.position.y = 0.8;
const painel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.1), material('#e8d28a'));
painel.position.set(0, 1.5, 0);
contorno(poste);
contorno(painel);
placa.add(poste, painel);
scene.add(placa);

// personagem: Azazel no traje de vilão (trevas), com andar em vídeo e parado nas 4 direções (ver criarAzazel)
const azazel = criarAzazel();
const jogador = new THREE.Group();
jogador.add(azazel.malha);

// Azazel no traje de vilão (trevas, gótico). Andar: vídeos MP4 com fundo verde nas direções frente, esquerda e costas; a
// direita é o clipe da esquerda espelhado. Parado: uma folha com as 4 direções lado a lado. Cada um tem a sua escala para o
// personagem ter 1,7 de altura visível, com o pé no chão. A direção é a do movimento no mundo (não da câmera), então ele
// não gira quando a câmera gira.
function criarAzazel() {
  const ALTURA = ALTURA_JOGADOR;
  const base = `${RAIZ}assets/characters/`;

  // andar: vídeo de 320x540; a figura vai da linha 26 (topo) até a 533 (pé)
  const VIDEO = { largura: 320, altura: 540, topo: 26, pe: 533 };
  const kVideo = ALTURA / (VIDEO.pe - VIDEO.topo);
  const videos = {};
  const texturas = {};
  for (const nome of ['front', 'left', 'back']) {
    const v = document.createElement('video');
    v.src = `${base}walk-video-v1/gothic-boy-walk-${nome}.mp4`;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.style.display = 'none';
    document.body.appendChild(v);
    videos[nome] = v;
    texturas[nome] = new THREE.VideoTexture(v);
  }
  // o verde do fundo sai no shader: quanto mais verde que o resto, mais transparente; a franja verde é corrigida
  const materialAndar = new THREE.ShaderMaterial({
    uniforms: { map: { value: texturas.front } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        float verde = c.g - max(c.r, c.b);
        float alfa = 1.0 - smoothstep(0.18, 0.34, verde);
        if (alfa < 0.5) discard;
        gl_FragColor = vec4(c.r, min(c.g, max(c.r, c.b) + 0.04), c.b, 1.0);
      }`,
  });
  const larguraAndar = VIDEO.largura * kVideo;
  const andar = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialAndar);
  andar.scale.set(larguraAndar, VIDEO.altura * kVideo, 1);
  andar.position.y = (VIDEO.pe - VIDEO.altura / 2) * kVideo;   // o pé fica em y = 0

  // parado: folha 2048x512 com 4 células de 512 (frente, esquerda, direita, costas); topo na linha 21, pé na 501
  const PARADO = { celula: 512, topo: 21, pe: 501 };
  const kParado = ALTURA / (PARADO.pe - PARADO.topo);
  const texParado = new THREE.TextureLoader().load(`${base}idle-video-v1/gothic-boy-basic-4dir.webp`);
  texParado.colorSpace = THREE.SRGBColorSpace;
  texParado.repeat.set(1 / 4, 1);
  const parado = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texParado, alphaTest: 0.5 }));
  parado.scale.set(PARADO.celula * kParado, PARADO.celula * kParado, 1);
  parado.position.y = (PARADO.pe - PARADO.celula / 2) * kParado;

  const malha = new THREE.Group();
  malha.add(andar, parado);

  let ativo = null;   // nome do vídeo que está tocando
  function pausarVideos() {
    if (ativo) videos[ativo].pause();
    ativo = null;
  }
  // rot: direção do movimento no mundo (atan2(dx, dz)); yaw: ângulo da câmera. O personagem gira só no eixo vertical e
  // fica de frente para a câmera (de lado ele some). O quadro vem do movimento em relação à tela: 0 frente (vindo para a
  // câmera), 3 costas, 2 direita, 1 esquerda.
  let ultima = 0;   // último sentido do movimento: é o quadro que fica quando o personagem para
  function atualizar(andando, rot, yaw, agora) {
    const mx = Math.sin(rot);
    const mz = Math.cos(rot);
    const paraCamera = mx * Math.sin(yaw) + mz * Math.cos(yaw);     // a câmera fica em (sin yaw, cos yaw) do personagem
    const paraDireita = mx * Math.cos(yaw) - mz * Math.sin(yaw);    // a direita da tela é (cos yaw, -sin yaw)
    const linha = Math.abs(paraCamera) >= Math.abs(paraDireita)
      ? (paraCamera >= 0 ? 0 : 3)
      : (paraDireita >= 0 ? 2 : 1);
    if (andando) {
      ultima = linha;
      const fonte = ['front', 'left', 'left', 'back'][linha];
      if (ativo !== fonte) {
        pausarVideos();
        ativo = fonte;
        videos[fonte].play().catch(() => {});
      }
      materialAndar.uniforms.map.value = texturas[fonte];
      andar.scale.x = linha === 2 ? -larguraAndar : larguraAndar;   // direita = esquerda espelhada
      andar.visible = videos[fonte].readyState >= 2;
      parado.visible = !andar.visible;
    } else {
      pausarVideos();
      texParado.offset.set(ultima / 4, 0);   // parado: mantém o último quadro do movimento
      andar.visible = false;
      parado.visible = true;
    }
  }
  // o personagem gira só para ficar de frente para a câmera (plano inteiro), então não some de lado nem de cima
  function olharPara(cam) {
    malha.quaternion.copy(cam.quaternion);
  }
  return { malha, atualizar, olharPara };
}
scene.add(jogador);

// ---- estado ----
const estado = {
  pos: { x: INICIO.x, z: INICIO.z },
  rot: 0,          // direção para onde o personagem olha
  bob: 0,
  yaw: 0,          // ângulo da câmera em volta do personagem
  pitch: 0.5,      // inclinação da câmera
  cam: new THREE.Vector3(0, 4, 9),
  recentralizar: false,
  arrastando: null,
  mensagemAte: 0,
  joy: { x: 0, z: 0 },   // vetor do joystick virtual
  local: null,           // { regiao, cidade } onde o personagem está agora
};
const teclas = new Set();
const toque = window.matchMedia('(pointer: coarse)').matches;

// ---- time e poções: ficam só nesta sessão (o protótipo não salva nada) ----
const time = timeInicial();
const pocoesBatalha = { ...POCOES_INICIAIS };
const preferenciasBatalha = { auto: false, velocidade: 1 };   // modo auto e velocidade (1x, 2x ou 3x), lembrados entre as lutas
let batalha = null;   // { s, sorteios, e (equipe), area, fase: 'planejar' | 'alvo' | 'roteiro' | 'fim' | 'recuou', quem, menu, alvo, roteiro, ... }
let vista = null;     // tela de Time: { tipo: 'time' | 'habilidades', sel, slot, item, voltar }

// ---- texturas dos monstrinhos (carregam uma vez por espécie) ----
const carregador = new THREE.TextureLoader();
const texturas = new Map();
function texturaDe(arquivo) {
  if (!texturas.has(arquivo)) texturas.set(arquivo, carregador.load(RAIZ + arquivo));
  return texturas.get(arquivo);
}
const arteDe = (m) => E.ESPECIES[m.species]?.arte ?? null;
const arteDaEspecie = (especie) => E.ESPECIES[especie]?.arte ?? null;

// ---- monstrinhos do mapa: o próprio desenho, sempre olhando para a câmera ----
// Espécies com folha de quatro direções (frente, esquerda, direita, costas) trocam de direção conforme andam.
// As outras têm só o sprite de frente, usado nas quatro direções.
const FOLHAS_DIRECOES = {
  Noctarn: { arquivo: 'assets/monsters/noctarn/noctarn-idle-4dir.webp', ordem: ['frente', 'esquerda', 'direita', 'costas'] },
};
const ALTURA_MAPA = 1.7;
const cacheMapa = new Map();   // espécie -> { direcoes: { frente, esquerda, direita, costas }, aspecto }

// Corta a folha em uma textura por direção (cada célula tem a mesma largura).
function celulasDaFolha(config, imagem) {
  const largura = Math.round(imagem.width / config.ordem.length);
  const direcoes = {};
  config.ordem.forEach((nome, k) => {
    const c = document.createElement('canvas');
    c.width = largura;
    c.height = imagem.height;
    c.getContext('2d').drawImage(imagem, k * largura, 0, largura, imagem.height, 0, 0, largura, imagem.height);
    direcoes[nome] = new THREE.CanvasTexture(c);
  });
  return direcoes;
}

// Direções prontas de uma espécie, ou null enquanto a imagem não carregou.
function direcoesDoMapa(especie) {
  if (cacheMapa.has(especie)) return cacheMapa.get(especie);
  const cfg = FOLHAS_DIRECOES[especie];
  const base = texturaDe(cfg ? cfg.arquivo : arteDaEspecie(especie));
  const img = base.image;
  if (!img || !img.width) return null;
  const pronto = cfg
    ? { direcoes: celulasDaFolha(cfg, img), aspecto: img.width / cfg.ordem.length / img.height }
    : { direcoes: { frente: base, esquerda: base, direita: base, costas: base }, aspecto: img.width / img.height };
  cacheMapa.set(especie, pronto);
  return pronto;
}

// Costas geradas para as espécies sem folha de direções (frente e costas em arquivos separados).
const COSTAS_DAS_ESPECIES = {
  Brotavel: 'assets/monsters/brotavel/costas.webp',
  Ignavor: 'assets/monsters/ignavor/costas.webp',
  Solarin: 'assets/monsters/solarin/costas.webp',
  Vaelith: 'assets/monsters/vaelith/costas.webp',
};
// Textura de uma direção do monstrinho na batalha: a célula certa da folha de quatro direções (Noctarn). Espécie sem folha
// usa o sprite de frente nas duas direções, até a arte de costas ser gerada. A textura só vale quando a imagem carrega.
function texturaDeDirecao(m, direcao) {
  const cfg = FOLHAS_DIRECOES[m.species];
  const costa = direcao === 'costas' && !cfg ? COSTAS_DAS_ESPECIES[m.species] : null;
  const perfil = direcao === 'direita' && !cfg ? PERFIS_DIREITA[m.species] : null;
  const caminho = cfg ? cfg.arquivo : (perfil ?? costa ?? arteDe(m));
  const c = document.createElement('canvas');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.carregada = false;
  if (!caminho) return tex;
  const img = new Image();
  img.onload = () => {
    if (cfg) {
      const largura = Math.round(img.width / cfg.ordem.length);
      const k = Math.max(0, cfg.ordem.indexOf(direcao));
      c.width = largura;
      c.height = img.height;
      c.getContext('2d').drawImage(img, k * largura, 0, largura, img.height, 0, 0, largura, img.height);
    } else {
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
    }
    tex.userData.carregada = true;
    // o canvas mudou de tamanho depois do primeiro envio à GPU: libera a textura para o three.js enviá-la de novo, inteira
    tex.dispose();
    tex.needsUpdate = true;
  };
  img.src = RAIZ + caminho;
  return tex;
}

// Perfil virado para a direita, por espécie (arquivo em assets/monsters/<espécie>/). O aliado mostra o perfil para o inimigo; o
// inimigo mostra o mesmo perfil espelhado, virado para a esquerda. Espécies sem perfil mostram a frente.
const PERFIS_DIREITA = {
  // Ignavor: 'assets/monsters/ignavor/perfil-direita.webp',
};

// Para que lado olha a arte de frente de cada espécie. O aliado precisa olhar para a direita (o inimigo) e o inimigo para a
// esquerda; quando a arte olha para o lado errado, ela é espelhada.
const FRENTE_PARA = { Brotavel: 'direita', Ignavor: 'esquerda', Solarin: 'esquerda', Vaelith: 'esquerda' };

// Como cada monstro aparece na batalha. Noctarn tem a folha de quatro direções: o aliado usa 'direita' e o inimigo 'esquerda'.
// As outras espécies usam o perfil de PERFIS_DIREITA (o inimigo espelha). Sem perfil, usam a frente, espelhada se preciso.
function visaoDaBatalha(m, lado) {
  if (FOLHAS_DIRECOES[m.species]) return { textura: texturaDeDirecao(m, lado === 'aliado' ? 'direita' : 'esquerda'), espelho: false };
  if (PERFIS_DIREITA[m.species]) return { textura: texturaDeDirecao(m, 'direita'), espelho: lado === 'inimigo' };
  const olhaPara = FRENTE_PARA[m.species] ?? 'direita';
  const quer = lado === 'aliado' ? 'direita' : 'esquerda';
  return { textura: texturaDeDirecao(m, 'frente'), espelho: olhaPara !== quer };
}

// ---- selvagens que rondam a ilha: ao encostar, começa a batalha ----
const selvagens = PONTOS_SELVAGENS.map((p, i) => {
  const { material, uniforms } = criarMaterialCor(THREE);
  const malha = new THREE.Mesh(new THREE.PlaneGeometry(ALTURA_MAPA, ALTURA_MAPA), material);
  malha.visible = false;
  scene.add(malha);
  return {
    casa: { x: p[0], z: p[1] }, fase: i * 1.7, malha, uniforms, ativo: false, reaparece: 0, sorteio: null,
    especie: null, cor: '#c9d6e3', pronto: false, direcoes: null, celula: null,
  };
});
function novoSelvagem(s) {
  s.sorteio = sortearSelvagem(Math.random);
  const m = s.sorteio.monstro;
  s.especie = m.species;
  s.cor = COR_ELEMENTO[m.elemento] ?? '#c9d6e3';
  s.pronto = false;   // a textura e a proporção entram quando a imagem da espécie carregar
  s.celula = null;
  aplicarGiro(THREE, s.uniforms, giroDoMonstro(m) ?? NATURAL);
  s.ativo = true;
  s.malha.visible = false;
}
selvagens.forEach(novoSelvagem);

// Direção do desenho: o monstrinho anda em círculo, então a direção sai do movimento em relação à câmera.
function celulaDaDirecao(s, t, x, z) {
  const vx = -0.9 * 0.7 * Math.sin(t * 0.7 + s.fase);
  const vz = 0.9 * 0.5 * Math.cos(t * 0.5 + s.fase);
  const paraCamera = new THREE.Vector3(camera.position.x - x, 0, camera.position.z - z).normalize();
  const direitaCamera = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  direitaCamera.y = 0;
  direitaCamera.normalize();
  const emDirecaoCamera = vx * paraCamera.x + vz * paraCamera.z;
  const aoLado = vx * direitaCamera.x + vz * direitaCamera.z;
  if (Math.abs(emDirecaoCamera) >= Math.abs(aoLado)) return emDirecaoCamera >= 0 ? 'frente' : 'costas';
  return aoLado >= 0 ? 'direita' : 'esquerda';
}

function atualizarSelvagens(t, agora) {
  for (const s of selvagens) {
    if (!s.ativo && agora >= s.reaparece) novoSelvagem(s);
    if (!s.ativo) continue;
    const x = s.casa.x + Math.cos(t * 0.7 + s.fase) * 0.9;
    const z = s.casa.z + Math.sin(t * 0.5 + s.fase) * 0.9;
    if (!s.pronto) {
      const d = direcoesDoMapa(s.especie);
      if (d) {
        s.direcoes = d.direcoes;
        s.malha.geometry.dispose();
        s.malha.geometry = new THREE.PlaneGeometry(ALTURA_MAPA * d.aspecto, ALTURA_MAPA);
        s.pronto = true;
      }
    }
    s.malha.visible = s.pronto;
    if (s.pronto) {
      const cel = celulaDaDirecao(s, t, x, z);
      if (cel !== s.celula) {
        s.uniforms.map.value = s.direcoes[cel];
        s.celula = cel;
      }
    }
    s.malha.position.set(x, ALTURA_MAPA / 2 + Math.abs(Math.sin(t * 3 + s.fase)) * 0.05, z);
    s.malha.quaternion.copy(camera.quaternion);
    if (!batalha && Math.hypot(estado.pos.x - x, estado.pos.z - z) < 1.3) iniciarBatalha(s);
  }
}

// ---- cena da batalha em 3D: arena, os dois monstrinhos e a câmera ----
const cenaBat = criarCenaBatalha(THREE);
cenaBat.resize(window.innerWidth, window.innerHeight);

// ---- entrada pelo teclado ----
const prevenirSetas = (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
};
window.addEventListener('keydown', (e) => {
  if (vista) {
    if (!e.repeat) teclaVista(e);
    prevenirSetas(e);
    return;
  }
  if (batalha) {
    if (!e.repeat) teclaBatalha(e);
    prevenirSetas(e);
    return;
  }
  teclas.add(e.code);
  if (e.code === 'KeyC' || e.code === 'KeyR') estado.recentralizar = true;
  if (!e.repeat) {
    if (e.code === 'KeyE' && perto()) examinar();
    if (e.code === 'KeyH') alternarAtalhos();
    if (e.code === 'KeyP') alternarFoto();
    if (e.code === 'KeyT') abrirTime();
  }
  prevenirSetas(e);
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));

// ---- entrada pelo mouse e pelo dedo: arrastar na tela gira a câmera ----
canvas.addEventListener('pointerdown', (e) => { estado.arrastando = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!estado.arrastando) return;
  estado.yaw -= (e.clientX - estado.arrastando.x) * 0.006;
  estado.pitch = Math.max(0.15, Math.min(1.25, estado.pitch + (e.clientY - estado.arrastando.y) * 0.004));
  estado.arrastando = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', () => { estado.arrastando = null; });
canvas.addEventListener('pointercancel', () => { estado.arrastando = null; });

// ---- joystick virtual (canto inferior esquerdo) ----
const joy = document.getElementById('joy');
const knob = document.getElementById('joy-knob');
let joyDedo = null;
function joyAtualizar(e) {
  const r = joy.getBoundingClientRect();
  const v = vetorJoystick(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width / 2);
  estado.joy = v;
  knob.style.transform = `translate(${v.x * r.width / 2}px, ${-v.z * r.width / 2}px)`;
}
function joyFim(e) {
  if (e.pointerId !== joyDedo) return;
  joyDedo = null;
  estado.joy = { x: 0, z: 0 };
  knob.style.transform = '';
}
joy.addEventListener('pointerdown', (e) => { joyDedo = e.pointerId; joy.setPointerCapture(e.pointerId); joyAtualizar(e); });
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyDedo) joyAtualizar(e); });
joy.addEventListener('pointerup', joyFim);
joy.addEventListener('pointercancel', joyFim);

// ---- barra de ações (teclado e mouse) e botões de toque ----
const acaoAtalhos = document.getElementById('acao-atalhos');
const acaoExaminar = document.getElementById('acao-examinar');
const acaoCentro = document.getElementById('acao-centro');
const acaoTime = document.getElementById('acao-time');
const acaoFoto = document.getElementById('acao-foto');
const atalhos = document.getElementById('atalhos');
const fotoSair = document.getElementById('foto-sair');
const btnExaminar = document.getElementById('btn-examinar');
const btnCentro = document.getElementById('btn-centro');
acaoAtalhos.addEventListener('click', alternarAtalhos);
acaoExaminar.addEventListener('click', () => { if (perto()) examinar(); });
acaoCentro.addEventListener('click', () => { estado.recentralizar = true; });
acaoTime.addEventListener('click', abrirTime);
acaoFoto.addEventListener('click', alternarFoto);
fotoSair.addEventListener('click', alternarFoto);
btnExaminar.addEventListener('click', () => { if (perto()) examinar(); });
btnCentro.addEventListener('click', () => { estado.recentralizar = true; });

// lista de atalhos (H) e modo foto (P: esconde a interface e deixa só a cena)
function alternarAtalhos() { atalhos.hidden = !atalhos.hidden; }
function alternarFoto() { document.body.classList.toggle('foto'); }

const pressionada = (...codigos) => codigos.some((c) => teclas.has(c));
const diferencaAngulo = (de, para) => Math.atan2(Math.sin(para - de), Math.cos(para - de));

// ---- mensagens e placa ----
function mostrarMensagem(texto, ms = 3200) {
  const msg = document.getElementById('msg');
  msg.textContent = texto;
  msg.style.display = 'block';
  estado.mensagemAte = performance.now() + ms;
}
function perto() {
  return Math.hypot(estado.pos.x - SINAL.x, estado.pos.z - SINAL.z) < 2.2;
}
function examinar() {
  mostrarMensagem('Placa de madeira: Norte, Leste, Sul e Oeste (texto provisório).');
}

// ---- registro de espólios: painel logo abaixo do mapa ----
const registro = document.getElementById('registro');
let registroAte = 0;
function mostrarRegistro(itens, ms = 7000) {
  const linhas = linhasDoRegistro(itens);
  const titulo = document.createElement('h2');
  titulo.textContent = 'Registro';
  const corpo = document.createElement('div');
  if (!linhas.length) {
    const vazio = document.createElement('p');
    vazio.textContent = 'Nenhum espólio desta vez.';
    corpo.append(vazio);
  }
  for (const l of linhas) {
    const linha = document.createElement('div');
    linha.className = `linha ${l.cor}${l.selecionado ? ' selecionado' : ''}`;
    const icone = document.createElement('span');
    icone.className = 'icone';
    icone.textContent = l.icone;
    const nome = document.createElement('span');
    nome.textContent = l.nome;
    const valor = document.createElement('b');
    valor.textContent = l.valor;
    linha.append(icone, nome, valor);
    corpo.append(linha);
  }
  registro.replaceChildren(titulo, corpo);
  registro.hidden = false;
  registroAte = performance.now() + ms;
}
registro.addEventListener('click', () => { registro.hidden = true; });

// ---- localização na tela ----
const elLocal = document.getElementById('local');
let textoLocal = '';
function atualizarLocal() {
  const onde = localDe(estado.pos.x, estado.pos.z);
  estado.local = onde;
  const texto = !onde ? 'Mar'
    : onde.cidade ? `${onde.regiao} · ${onde.cidade}`
    : onde.regiao === 'Centro' ? 'Praça central' : onde.regiao;
  if (texto !== textoLocal) { textoLocal = texto; elLocal.textContent = texto; }
}

// ---- telas da batalha e do Time (HTML) ----
const batalhaEl = document.getElementById('batalha');
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pocoesTexto = () => `P ${pocoesBatalha.pequena} · M ${pocoesBatalha.media} · G ${pocoesBatalha.grande}`;

// arte do monstrinho nas telas de menu; a cor de uma variação é um giro de matiz no próprio desenho
const arteHtml = (m, classe = '') => {
  const arte = arteDe(m);
  const estilo = m.variante ? ` style="filter: ${V.filtroDaVariacao(m.species, m.variante)}"` : '';
  if (arte) return `<img class="sprite ${classe}" src="${RAIZ}${arte}" alt="${esc(m.species)}"${estilo}>`;
  return `<div class="orb ${classe}" style="--cor:${COR_ELEMENTO[m.elemento] ?? '#c9d6e3'}">${esc(m.species[0])}</div>`;
};
const badgeVariante = (m) => (nomeDaVariante(m) ? `<span class="onirico">${esc(nomeDaVariante(m))}</span>` : '');
const xpBarra = (m) => {
  const piso = C.xpDoNivel(m.level);
  const teto = C.xpDoNivel(m.level + 1);
  const p = Math.max(0, Math.min(100, Math.round((100 * ((m.xp || 0) - piso)) / (teto - piso))));
  return `<div class="barra xp"><i style="width:${p}%"></i></div>`;
};
const cartaoMembro = (t, i, sel, acao) => `<li><button type="button" class="membro ${sel ? 'sel' : ''}" data-bat="${acao}" data-i="${i}">
  ${arteHtml(t, 'mini')}
  <span class="nome">${esc(t.species)}</span>
  <span class="meta">Nv ${t.level} · ${NOME_ELEMENTO[t.elemento]}${nomeDaVariante(t) ? ` · ${esc(nomeDaVariante(t))}` : ''}</span>
  ${xpBarra(t)}
</button></li>`;

function htmlHabilidades() {
  const m = time[vista.sel];
  const pool = habilidadesDisponiveis(m);
  const slots = m.abilities.map((nome, i) => `<button type="button" class="slot ${vista.slot === i ? 'sel' : ''}" data-bat="slot" data-i="${i}">
    <span class="num">${i + 1}</span><span class="nome-hab">${esc(nome)}</span></button>`).join('');
  const lista = pool.map((nome, i) => {
    const k = m.abilities.indexOf(nome);
    return `<button type="button" class="hab ${i === vista.item ? 'foco' : ''} ${k >= 0 ? 'em' : ''}" data-bat="pool" data-i="${i}" data-nome="${esc(nome)}">
      <span class="num">${k >= 0 ? k + 1 : '–'}</span>${esc(nome)}</button>`;
  }).join('');
  return `<div class="bat-tela habilidades">
    <h2 class="bat-titulo">Habilidades · ${esc(m.species)}</h2>
    ${m.variante ? `<p class="bat-sub">${esc(nomeDaVariante(m))} · ${NOME_ELEMENTO[m.elemento]}</p>` : ''}
    <p class="bat-dica-topo">Escolha um slot e depois uma habilidade. Se a habilidade já está em outro slot, os dois trocam de lugar.</p>
    <div class="slots">${slots}</div>
    <div class="pool">${lista}</div>
    <div class="bat-acoes"><button type="button" class="bat-btn" data-bat="vista-voltar">Voltar<kbd>Esc</kbd></button></div>
  </div>`;
}

// ---- batalha em equipe: até 3 aliados (o time) contra 1 a 3 inimigos ----
const ACOES = ['atacar', 'habilidades', 'item'];
const TEXTO_ACAO = { atacar: 'Atacar', habilidades: 'Habilidades', item: 'Item' };
const ICONE_ACAO = { atacar: '⚔', habilidades: '★', item: '✚' };
const snapshotVida = (e) => ({ aliados: e.aliados.map((a) => a.hp), inimigos: e.inimigos.map((n) => n.hp) });
const multTexto = String(CB.COMBATE.habilidadeMult).replace('.', ',');

// O que cada aliado vai fazer neste turno (ou o que está esperando).
function textoPlano(b, i) {
  const p = b.e.planos[i];
  if (!p) return b.fase === 'planejar' && b.quem === i ? 'escolhendo…' : 'aguardando';
  if (p.tipo === 'pocao') return CB.POCOES[p.pocao].nome;
  const alvo = b.e.inimigos[p.alvo].nome;
  return p.tipo === 'habilidade' ? `${esc(p.nome)} → ${esc(alvo)}` : `Atacar → ${esc(alvo)}`;
}

// Lista do menu aberto: habilidades do aliado da vez, ou poções. ok diz se pode usar agora.
function itensDoMenu(b) {
  const a = b.e.aliados[b.quem];
  if (b.menu === 'habilidades') {
    return a.habilidades.map((h) => {
      const pronta = CB.habilidadePronta(a, h.nome, b.e.turno);
      return { tipo: 'habilidade', nome: h.nome, rotulo: h.nome, sub: pronta ? `dano x${multTexto}` : 'em recarga (espera 1 turno)', ok: pronta };
    });
  }
  return Object.keys(CB.POCOES).map((p) => {
    const livres = BE.pocoesLivres(b.e, p, b.quem);
    return { tipo: 'pocao', nome: p, rotulo: CB.POCOES[p].nome, sub: `${livres} na mochila`, ok: livres > 0 };
  });
}

function htmlBatalha(b) {
  const e = b.e;
  const aliados = e.aliados.map((a, i) => {
    const ativo = b.fase === 'planejar' && b.quem === i;
    return `<div class="bt-card aliado ${ativo ? 'ativo' : ''} ${a.hp <= 0 ? 'ko' : ''}">
      <div class="bt-cab"><b>${esc(a.nome)}</b><span>Nv ${time[i].level}</span></div>
      <div class="bt-barra"><i data-hp="aliado-${i}"></i></div>
      <div class="bt-num" data-num="aliado-${i}"></div>
      <div class="bt-plano">${textoPlano(b, i)}</div>
    </div>`;
  }).join('');
  const inimigos = e.inimigos.map((n, i) => {
    const alvo = b.fase === 'alvo' && b.alvo === i;
    const pode = b.fase === 'alvo' && n.hp > 0;
    return `<button type="button" class="bt-card inimigo ${alvo ? 'alvo' : ''} ${n.hp <= 0 ? 'ko' : ''}" data-bat="inimigo" data-i="${i}" ${pode ? '' : 'disabled'}>
      <div class="bt-cab"><b>${esc(n.nome)}</b><span>${NOME_ELEMENTO[n.elemento]} · Nv ${b.nivelInimigos[i]}</span></div>
      <div class="bt-barra"><i data-hp="inimigo-${i}"></i></div>
      <div class="bt-num" data-num="inimigo-${i}"></div>
    </button>`;
  }).join('');
  const disco = b.fase === 'planejar' && b.menu === 'acoes'
    ? `<div class="bt-disco">${ACOES.map((op, k) => {
      const ang = -Math.PI / 2 + (k * 2 * Math.PI) / ACOES.length;
      const x = 130 + 88 * Math.cos(ang) - 32;
      const y = 130 + 88 * Math.sin(ang) - 32;
      return `<button type="button" class="bt-op ${b.opcaoMenu === k ? 'foco' : ''}" style="--x:${x}px;--y:${y}px" data-bat="acao" data-nome="${op}">${ICONE_ACAO[op]}<span>${TEXTO_ACAO[op]}</span></button>`;
    }).join('')}</div>`
    : '';
  let painel = '';
  if (b.fase === 'planejar' && b.menu !== 'acoes') {
    const itens = itensDoMenu(b).map((it, k) => `<button type="button" class="bt-item ${k === b.opcaoMenu ? 'foco' : ''}" data-bat="${it.tipo}" data-nome="${esc(it.nome)}" ${it.ok ? '' : 'disabled'}>
        <b>${esc(it.rotulo)}</b><span>${esc(it.sub)}</span></button>`).join('');
    const titulo = b.menu === 'habilidades' ? `Habilidades · ${esc(e.aliados[b.quem].nome)}` : 'Itens';
    painel = `<div class="bt-lista"><h3>${titulo}</h3>${itens}<button type="button" class="bt-btn" data-bat="lista-voltar">Voltar<kbd>Esc</kbd></button></div>`;
  }
  const alvo = b.fase === 'alvo'
    ? `<div class="bt-alvo"><div class="bt-alvo-linha"><button type="button" class="bt-seta" data-bat="alvo-anterior" aria-label="Alvo anterior">◀</button><b>${esc(e.inimigos[b.alvo].nome)}</b><button type="button" class="bt-seta" data-bat="alvo-proximo" aria-label="Próximo alvo">▶</button></div><div class="bt-alvo-linha"><button type="button" class="bt-btn primario" data-bat="alvo-confirmar">Confirmar</button><button type="button" class="bt-btn" data-bat="alvo-voltar">Voltar</button></div></div>`
    : '';
  const mira = b.fase === 'alvo' ? '<div class="bt-mira"></div>' : '';
  // ordem de turno (quem age primeiro, pelo poder), na borda direita: só os vivos; quem está planejando fica destacado
  const ordem = BE.ordemDoTurno(e)
    .filter((u) => (u.lado === 'aliado' ? e.aliados[u.i].hp : e.inimigos[u.i].hp) > 0)
    .map((u) => {
      const nome = u.lado === 'aliado' ? e.aliados[u.i].nome : e.inimigos[u.i].nome;
      const vez = b.fase === 'planejar' && u.lado === 'aliado' && u.i === b.quem;
      return `<li class="${u.lado} ${vez ? 'ativo' : ''}" title="${esc(nome)}">${esc(nome.slice(0, 2))}</li>`;
    }).join('');
  const log = e.log.slice(-4).map((l) => `<li>${esc(l)}</li>`).join('');
  const dica = {
    planejar: b.menu === 'acoes' ? '←→ escolher · Enter confirmar · Q atacar · X habilidades · Esc fugir' : '↑↓ escolher · Enter usar · Esc voltar',
    alvo: '←→ trocar o alvo · Enter confirmar · Esc voltar',
    roteiro: 'Turno em andamento…',
  }[b.fase] ?? '';
  const vezDe = b.fase === 'planejar' ? `Vez de ${esc(e.aliados[b.quem].nome)}` : '';
  return `<div class="bat-tela bt ${b.fase}">
    <header class="bt-topo"><span>${esc(b.area.nome)}</span><span>Turno ${Math.min(e.turno, CB.COMBATE.turnosMax)} de ${CB.COMBATE.turnosMax}</span><span>${vezDe || pocoesTexto()}</span>
      <span class="bt-controles"><button type="button" class="bt-ctrl ${preferenciasBatalha.auto ? 'on' : ''}" data-bat="auto" title="Auto batalha (V)">AUTO ${preferenciasBatalha.auto ? 'ON' : 'OFF'}</button><button type="button" class="bt-ctrl" data-bat="velocidade" title="Velocidade (F)">${preferenciasBatalha.velocidade}x</button></span></header>
    <section class="bt-inimigos">${inimigos}</section>
    <section class="bt-aliados">${aliados}</section>
    <ol class="bt-ordem">${ordem}</ol>
    ${mira}${disco}${painel}${alvo}
    <ol class="bt-log">${log}</ol>
    <p class="bt-dica">${dica}</p>
  </div>`;
}

function htmlFim(b) {
  const vivos = b.e.aliados.filter((a) => a.hp > 0).length;
  const log = b.e.log.slice(-6).map((l) => `<li>${esc(l)}</li>`).join('');
  const xp = b.xp >= 0 ? `+${b.xp}` : `${b.xp}`;
  return `<div class="bat-fim ${b.resultado ? 'vitoria' : 'derrota'}">
    <h2>${b.resultado ? 'Vitória' : 'Derrota'}</h2>
    <p>${vivos} de ${b.e.aliados.length} aliados de pé · XP ${xp}${b.subiu ? ` · subiu de nível (até ${b.nivel})` : ''}</p>
    ${b.resultado && b.gold ? `<p>Gold +${b.gold}${b.pocao ? ` · Poção pequena +${b.pocao}` : ''}</p>` : ''}
    <ol class="bat-log grande">${log}</ol>
    <button type="button" class="bat-btn primario" data-bat="continuar">Continuar<kbd>Enter</kbd></button>
  </div>`;
}

// Barras e números: mostram a vida do roteiro (hpMostrado), que avança golpe a golpe.
function atualizarBarras() {
  const b = batalha;
  if (!b || !b.hpMostrado || b.fase === 'fim') return;
  const pinta = (ref, hp, max) => {
    const barra = batalhaEl.querySelector(`[data-hp="${ref}"]`);
    const num = batalhaEl.querySelector(`[data-num="${ref}"]`);
    const pct = Math.max(0, Math.min(100, (100 * hp) / max));
    if (barra) { barra.style.width = `${pct}%`; barra.parentElement.classList.toggle('baixa', pct <= 30); }
    if (num) num.textContent = `${Math.max(0, hp)}/${max}`;
  };
  b.e.aliados.forEach((a, i) => pinta(`aliado-${i}`, b.hpMostrado.aliados[i], a.hpMax));
  b.e.inimigos.forEach((n, i) => pinta(`inimigo-${i}`, b.hpMostrado.inimigos[i], n.hpMax));
}

// A mira fica sobre o alvo escolhido, acompanhando a câmera.
function atualizarMira() {
  const b = batalha;
  const el = batalhaEl.querySelector('.bt-mira');
  if (!b || !el || b.fase !== 'alvo') return;
  const p = cenaBat.projetar('inimigo', b.alvo);
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y}px`;
}

function renderBatalha() {
  const b = batalha;
  if (b.fase === 'fim') { batalhaEl.innerHTML = htmlFim(b); return; }
  batalhaEl.innerHTML = htmlBatalha(b);
  atualizarBarras();
  atualizarMira();
}

// Desenha a tela atual: Time ou Habilidades (a qualquer momento, pela tecla T), a batalha, ou nada.
function renderTudo() {
  document.body.classList.toggle('batalha', Boolean(vista || batalha));
  document.body.classList.toggle('vista', Boolean(vista));
  if (vista) {
    batalhaEl.innerHTML = vista.tipo === 'time' ? htmlTime() : htmlHabilidades();
    return;
  }
  if (batalha) renderBatalha();
  else batalhaEl.replaceChildren();
}

// ---- números que sobem de quem foi atingido (ref: { lado, i }) ----
function mostrarNumero(ref, texto, classe, deslocY = 0) {
  const p = cenaBat.projetar(ref.lado, ref.i);
  const el = document.createElement('div');
  el.className = `bat-pop ${classe}`;
  el.textContent = texto;
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y - deslocY}px`;
  batalhaEl.append(el);
  setTimeout(() => el.remove(), 950 / preferenciasBatalha.velocidade);
}

// ---- batalha: fluxo ----
const posicaoDoLutador = (ref) => cenaBat.posicaoDoLutador(ref.lado, ref.i);

// Arte de fundo da batalha por elemento (o do primeiro inimigo). Sem arte, a arena é a lisa de sempre.
const ARTE_BATALHA = new Set(['agua', 'aco', 'dragao', 'eletrico', 'fada', 'fantasma', 'fogo', 'gelo', 'inseto', 'lutador', 'luz', 'neutro', 'pedra', 'planta', 'psiquico', 'terra', 'trevas', 'veneno', 'voador']);
const arteDaBatalha = (elemento) => (ARTE_BATALHA.has(elemento) ? `${RAIZ}assets/mundo/batalha/${elemento}.webp` : null);

// Um selvagem do mapa é o primeiro inimigo; a batalha traz mais 0 a 2, sorteados na hora. O time (até 3) sempre luta.
function iniciarBatalha(s) {
  s.ativo = false;
  s.malha.visible = false;
  s.reaparece = Infinity;   // não volta enquanto a luta dura; encerrarBatalha marca a volta
  const quantidade = 1 + Math.floor(Math.random() * 3);
  const sorteios = [s.sorteio, ...Array.from({ length: quantidade - 1 }, () => sortearSelvagem(Math.random))];
  const e = BE.criarBatalhaEquipe({
    aliados: time.slice(0, 3).map((m) => lutadorDo(m)),
    inimigos: sorteios.map((x) => lutadorDo(x.monstro)),
    pocoes: pocoesBatalha,
  });
  const area = areaDaRegiao(localDe(estado.pos.x, estado.pos.z)?.regiao ?? null) ?? AREAS.Centro;
  batalha = {
    s, sorteios, e, area, fase: 'planejar', quem: 0, menu: 'acoes', opcaoMenu: 0, alvo: 0, acao: null,
    roteiro: null, passo: 0, tempo: 0, iniciado: false, pendenteFim: false, resultado: null,
    xp: 0, subiu: 0, nivel: 0, gold: 0, pocao: 0,
    nivelInimigos: sorteios.map((x) => x.monstro.level),
    hpMostrado: snapshotVida(e),
  };
  batalha.quem = BE.proximoAliadoSemPlano(e);
  teclas.clear();
  estado.joy = { x: 0, z: 0 };
  cenaBat.tema(area.arena);
  cenaBat.definirPalco(arteDaBatalha(sorteios[0].monstro.elemento));
  cenaBat.reiniciarCamera();
  cenaBat.disporInimigos(sorteios.length);
  time.slice(0, 3).forEach((m, i) => {
    const giro = giroDoMonstro(m);
    const v = visaoDaBatalha(m, 'aliado');
    cenaBat.definir('aliado', i, { textura: v.textura, espelho: v.espelho, giro, animar: Boolean(giro), dur: 1.2 });
  });
  sorteios.forEach((x, i) => {
    const m = x.monstro;
    const giro = giroDoMonstro(m);
    const v = visaoDaBatalha(m, 'inimigo');
    cenaBat.definir('inimigo', i, { textura: v.textura, espelho: v.espelho, giro, animar: Boolean(giro), dur: 1.6 });
  });
  cenaBat.mirar('panoramica');
  renderTudo();
}

// ---- planejamento: cada aliado vivo escolhe a ação, depois o alvo ----
function escolherAcao(op) {
  const b = batalha;
  if (!b || b.fase !== 'planejar') return;
  if (op === 'habilidades' || op === 'item') {
    b.menu = op === 'habilidades' ? 'habilidades' : 'item';
    b.opcaoMenu = 0;
    renderTudo();
    return;
  }
  b.acao = { tipo: 'atacar' };
  irParaAlvo();
}

function escolherItem(k) {
  const b = batalha;
  const it = itensDoMenu(b)[k];
  if (!it || !it.ok) return;
  if (it.tipo === 'pocao') { planejarAtual({ tipo: 'pocao', pocao: it.nome }); return; }
  b.acao = { tipo: 'habilidade', nome: it.nome };
  irParaAlvo();
}

function voltarAcoes() {
  batalha.menu = 'acoes';
  batalha.opcaoMenu = 0;
  renderTudo();
}

// Leva a câmera ao inimigo mais perto de quem age, e a mira fica nele.
function irParaAlvo() {
  const b = batalha;
  const origem = cenaBat.posicaoDoLutador('aliado', b.quem);
  const vivos = BE.inimigosVivos(b.e);
  b.alvo = vivos.reduce((melhor, i) => {
    const p = cenaBat.posicaoDoLutador('inimigo', i);
    const d = Math.hypot(p.x - origem.x, p.z - origem.z);
    return d < melhor.d ? { i, d } : melhor;
  }, { i: vivos[0], d: Infinity }).i;
  b.fase = 'alvo';
  mirarAlvo();
  renderTudo();
}

function mirarAlvo() {
  cenaBat.mirarVista(vistaDoAlvo(cenaBat.posicaoDoLutador('inimigo', batalha.alvo)));
}

function ciclarAlvo(dir) {
  const b = batalha;
  const vivos = BE.inimigosVivos(b.e);
  const k = vivos.indexOf(b.alvo);
  b.alvo = vivos[(k + dir + vivos.length) % vivos.length];
  mirarAlvo();
  renderTudo();
}

function confirmarAlvo() {
  const b = batalha;
  if (!b || b.fase !== 'alvo') return;
  planejarAtual(b.acao.tipo === 'habilidade'
    ? { tipo: 'habilidade', nome: b.acao.nome, alvo: b.alvo }
    : { tipo: 'atacar', alvo: b.alvo });
}

function voltarDoAlvo() {
  batalha.fase = 'planejar';
  batalha.acao = null;
  cenaBat.mirar('panoramica');
  renderTudo();
}

// Registra a ação do aliado da vez. Se ainda há aliado sem ação, passa para ele; senão o turno é resolvido.
function planejarAtual(acao) {
  const b = batalha;
  try {
    BE.planejar(b.e, b.quem, acao);
  } catch {
    renderTudo();
    return;
  }
  b.menu = 'acoes';
  b.opcaoMenu = 0;
  b.acao = null;
  cenaBat.mirar('panoramica');
  const prox = BE.proximoAliadoSemPlano(b.e);
  if (prox !== null) {
    b.quem = prox;
    b.fase = 'planejar';
    renderTudo();
    return;
  }
  resolverRodada();
}

function resolverRodada() {
  const b = batalha;
  BE.resolverTurno(b.e, Math.random);
  Object.assign(pocoesBatalha, b.e.pocoes);
  b.roteiro = BE.roteiroDaEquipe(b.e);
  b.passo = 0;
  b.tempo = 0;
  b.iniciado = false;
  b.fase = 'roteiro';
  b.menu = 'acoes';
  b.pendenteFim = b.e.fim;
  b.resultado = b.e.fim ? b.e.resultado : null;
  renderTudo();
}

// ---- roteiro do turno: a câmera vai a quem age, o golpe acontece, a vida cai e quem cai sai da arena ----
function executarPasso(p) {
  const b = batalha;
  if (p.tipo === 'foco') { cenaBat.mirarVista(vistaDoAlvo(posicaoDoLutador(p.ator))); return; }
  if (p.tipo === 'golpe') {
    cenaBat.golpe(p.ator.lado, p.ator.i, p.alvo.lado, p.alvo.i, { critico: p.critico, habilidade: Boolean(p.habilidade) });
    if (p.dano > 0 && p.absorvido) mostrarNumero(p.alvo, `+${p.dano}`, 'cura');   // vampirismo: o alvo cura
    else if (p.dano > 0) mostrarNumero(p.alvo, p.critico ? `-${p.dano}!` : `-${p.dano}`, p.critico ? 'critico' : 'dano');
    // a tipagem aparece logo acima do número: super efetivo, pouco efetivo ou sem efeito
    if (p.eficacia) setTimeout(() => mostrarNumero(p.alvo, ROTULO_EFICACIA[p.eficacia], `efi-${p.eficacia}`, 36), 280 / preferenciasBatalha.velocidade);
    b.hpMostrado = p.hp;
    p.hp.aliados.forEach((h, i) => { if (h <= 0) cenaBat.derrubar('aliado', i); });
    p.hp.inimigos.forEach((h, i) => { if (h <= 0) cenaBat.derrubar('inimigo', i); });
    atualizarBarras();
    return;
  }
  if (p.tipo === 'erro') { mostrarNumero(p.alvo, 'Errou', 'erro'); return; }
  if (p.tipo === 'cura') {
    cenaBat.cura(p.ator.lado, p.ator.i);
    mostrarNumero(p.ator, `+${p.dano}`, 'cura');
    b.hpMostrado = p.hp;
    atualizarBarras();
    return;
  }
  if (p.tipo === 'pausa') cenaBat.mirar('panoramica');
}

// Modo auto: o aliado da vez escolhe a ação e o alvo sozinho, depois de um instante (encurta na velocidade maior).
function tocarAuto(dt) {
  const b = batalha;
  if (!b || !preferenciasBatalha.auto || b.fase !== 'planejar') { if (b) b.tempoAuto = 0; return; }
  b.tempoAuto = (b.tempoAuto ?? 0) + dt;
  if (b.tempoAuto < 0.5) return;
  b.tempoAuto = 0;
  const acao = BE.escolherAutoAcao(b.e, b.quem);
  if (!acao) return;
  planejarAtual(acao);
}

function alternarAuto() {
  preferenciasBatalha.auto = !preferenciasBatalha.auto;
  if (batalha && batalha.fase === 'alvo' && preferenciasBatalha.auto) voltarDoAlvo();
  renderTudo();
}

function alternarVelocidade() {
  const ordem = [1, 2, 3];
  preferenciasBatalha.velocidade = ordem[(ordem.indexOf(preferenciasBatalha.velocidade) + 1) % ordem.length];
  renderTudo();
}

function tocarRoteiro(dt) {
  const b = batalha;
  if (!b || b.fase !== 'roteiro' || !b.roteiro) return;
  if (b.passo >= b.roteiro.length) { concluirRoteiro(); return; }
  const p = b.roteiro[b.passo];
  if (!b.iniciado) {
    b.iniciado = true;
    executarPasso(p);
  }
  b.tempo += dt;
  if (b.tempo >= p.dur) {
    b.passo += 1;
    b.tempo = 0;
    b.iniciado = false;
  }
}

function concluirRoteiro() {
  const b = batalha;
  b.roteiro = null;
  b.hpMostrado = snapshotVida(b.e);
  if (b.pendenteFim) { terminarLuta(); return; }
  b.quem = BE.proximoAliadoSemPlano(b.e);
  b.fase = 'planejar';
  b.menu = 'acoes';
  b.opcaoMenu = 0;
  cenaBat.mirar('panoramica');
  renderTudo();
}

// XP só para quem está de pé quando a equipe vence; todo o time perde XP na derrota (como antes).
// Ouro: a soma do que cada inimigo derrubado rende; uma poção pequena pode cair por luta.
function terminarLuta() {
  const b = batalha;
  const vitoria = b.e.resultado === 'vitoria';
  let xp = 0;
  let subiu = 0;
  let nivel = 0;
  b.e.aliados.forEach((a, i) => {
    if (vitoria && a.hp <= 0) return;
    const r = aplicarResultado(time[i], vitoria);
    xp += r.xp;
    subiu += r.subiu;
    nivel = Math.max(nivel, r.nivel);
  });
  let gold = 0;
  let pocao = 0;
  b.sorteios.forEach((x) => {
    const rec = recompensaDaBatalha({ vitoria, raridade: x.raridade, rnd: Math.random });
    gold += rec.gold;
    pocao += rec.pocao;
  });
  pocoesBatalha.pequena += pocao;
  Object.assign(b, { fase: 'fim', resultado: vitoria, xp, subiu, nivel, gold, pocao });
  renderTudo();
}

function fugir() {
  if (!batalha || batalha.fase !== 'planejar') return;
  batalha.fase = 'recuou';
  encerrarBatalha();
}

function encerrarBatalha() {
  const b = batalha;
  if (!b) return;
  b.s.reaparece = performance.now() + RESPAWN_MS;
  const fase = b.fase;
  batalha = null;
  vista = null;
  renderTudo();
  if (fase === 'fim') {
    const itens = itensDoEspolio({ vitoria: b.resultado, nomeMonstro: `${b.sorteios.length} inimigo(s)`, xp: b.xp, gold: b.gold, pocao: b.pocao });
    mostrarRegistro(itens, 9000);
  } else {
    mostrarMensagem('Você recuou. O selvagem se afastou.');
  }
}

// ---- tela de Time e de Habilidades (a qualquer momento, pela tecla T ou o botão de baixo) ----
function abrirTime() {
  if (batalha) return;
  vista = { tipo: 'time', sel: 0 };
  renderTudo();
}
function abrirHabilidades(voltar) {
  const sel = vista?.sel ?? 0;
  vista = { tipo: 'habilidades', sel, slot: 0, item: 0, voltar };
  renderTudo();
}
function voltarVista() {
  vista = vista.voltar === 'escolha' ? null : { tipo: 'time', sel: vista.sel };
  renderTudo();
}

function teclaVista(e) {
  const k = e.code;
  if (vista.tipo === 'time') {
    if (k === 'ArrowUp' || k === 'KeyW') { vista.sel = (vista.sel + time.length - 1) % time.length; renderTudo(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { vista.sel = (vista.sel + 1) % time.length; renderTudo(); }
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') abrirHabilidades('time');
    else if (k === 'Escape' || k === 'KeyT') { vista = null; renderTudo(); }
    return;
  }
  const m = time[vista.sel];
  const pool = habilidadesDisponiveis(m);
  if (k === 'ArrowLeft' || k === 'KeyA') { vista.slot = (vista.slot + SLOTS - 1) % SLOTS; renderTudo(); }
  else if (k === 'ArrowRight' || k === 'KeyD') { vista.slot = (vista.slot + 1) % SLOTS; renderTudo(); }
  else if (/^Digit[1-4]$/.test(k)) { vista.slot = Number(k.slice(-1)) - 1; renderTudo(); }
  else if (k === 'ArrowUp' || k === 'KeyW') { vista.item = (vista.item + pool.length - 1) % pool.length; renderTudo(); }
  else if (k === 'ArrowDown' || k === 'KeyS') { vista.item = (vista.item + 1) % pool.length; renderTudo(); }
  else if (k === 'Enter' || k === 'Space' || k === 'KeyE') { definirSlot(m, vista.slot, pool[vista.item]); renderTudo(); }
  else if (k === 'Escape' || k === 'Backspace') voltarVista();
}

function teclaBatalha(e) {
  const b = batalha;
  const k = e.code;
  if (k === 'KeyV') { alternarAuto(); return; }
  if (k === 'KeyF') { alternarVelocidade(); return; }
  if (b.fase === 'planejar' && b.menu === 'acoes') {
    const n = ACOES.length;
    if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'KeyA' || k === 'KeyW') { b.opcaoMenu = (b.opcaoMenu + n - 1) % n; renderTudo(); }
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'KeyD' || k === 'KeyS') { b.opcaoMenu = (b.opcaoMenu + 1) % n; renderTudo(); }
    else if (k === 'KeyQ') escolherAcao('atacar');
    else if (k === 'KeyX') escolherAcao('habilidades');
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') escolherAcao(ACOES[b.opcaoMenu]);
    else if (k === 'Escape' || k === 'Backspace') fugir();
  } else if (b.fase === 'planejar') {   // lista de habilidades ou itens
    const n = itensDoMenu(b).length;
    if (k === 'ArrowUp' || k === 'KeyW') { b.opcaoMenu = (b.opcaoMenu + n - 1) % n; renderTudo(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { b.opcaoMenu = (b.opcaoMenu + 1) % n; renderTudo(); }
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') escolherItem(b.opcaoMenu);
    else if (k === 'Escape' || k === 'Backspace') voltarAcoes();
  } else if (b.fase === 'alvo') {
    if (k === 'ArrowLeft' || k === 'KeyA') ciclarAlvo(-1);
    else if (k === 'ArrowRight' || k === 'KeyD') ciclarAlvo(1);
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') confirmarAlvo();
    else if (k === 'Escape' || k === 'Backspace') voltarDoAlvo();
  } else if (b.fase === 'fim') {
    if (['Enter', 'Space', 'Escape', 'KeyE'].includes(k)) encerrarBatalha();
  }
}

batalhaEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-bat]');
  if (!el) return;
  const acao = el.dataset.bat;
  if (vista) {
    if (acao === 'vista-membro') { vista.sel = Number(el.dataset.i); renderTudo(); }
    else if (acao === 'vista-habilidades') abrirHabilidades('time');
    else if (acao === 'vista-fechar') { vista = null; renderTudo(); }
    else if (acao === 'vista-voltar') voltarVista();
    else if (acao === 'slot') { vista.slot = Number(el.dataset.i); renderTudo(); }
    else if (acao === 'pool') {
      definirSlot(time[vista.sel], vista.slot, el.dataset.nome);
      vista.item = Number(el.dataset.i);
      renderTudo();
    }
    return;
  }
  if (!batalha) return;
  if (acao === 'acao') escolherAcao(el.dataset.nome);
  else if (acao === 'habilidade' || acao === 'pocao') {
    const k = itensDoMenu(batalha).findIndex((it) => it.nome === el.dataset.nome);
    escolherItem(k);
  } else if (acao === 'inimigo') {
    if (batalha.fase === 'alvo') { batalha.alvo = Number(el.dataset.i); mirarAlvo(); renderTudo(); }
  } else if (acao === 'alvo-anterior') ciclarAlvo(-1);
  else if (acao === 'alvo-proximo') ciclarAlvo(1);
  else if (acao === 'alvo-confirmar') confirmarAlvo();
  else if (acao === 'alvo-voltar') voltarDoAlvo();
  else if (acao === 'lista-voltar') voltarAcoes();
  else if (acao === 'fugir') fugir();
  else if (acao === 'continuar') encerrarBatalha();
  else if (acao === 'auto') alternarAuto();
  else if (acao === 'velocidade') alternarVelocidade();
});

// ---- atualização do mapa ----
function atualizar(dt, agora) {
  // câmera pelas teclas I J K L (equivale ao analógico direito)
  if (pressionada('KeyJ')) estado.yaw -= 2.2 * dt;
  if (pressionada('KeyL')) estado.yaw += 2.2 * dt;
  if (pressionada('KeyI')) estado.pitch = Math.min(1.25, estado.pitch + 1.2 * dt);
  if (pressionada('KeyK')) estado.pitch = Math.max(0.15, estado.pitch - 1.2 * dt);

  // centralizar: a câmera volta para trás do personagem
  if (estado.recentralizar) {
    const alvoYaw = estado.rot + Math.PI;
    estado.yaw += diferencaAngulo(estado.yaw, alvoYaw) * Math.min(1, dt * 6);
    if (Math.abs(diferencaAngulo(estado.yaw, alvoYaw)) < 0.01) estado.recentralizar = false;
  }

  // movimento relativo à câmera: teclado ou joystick (parado durante a batalha e as telas de time)
  let ix = estado.joy.x;
  let iz = estado.joy.z;
  if (pressionada('KeyW', 'ArrowUp')) iz += 1;
  if (pressionada('KeyS', 'ArrowDown')) iz -= 1;
  if (pressionada('KeyD', 'ArrowRight')) ix += 1;
  if (pressionada('KeyA', 'ArrowLeft')) ix -= 1;
  const forca = Math.min(1, Math.hypot(ix, iz));
  const frente = { x: -Math.sin(estado.yaw), z: -Math.cos(estado.yaw) };
  const direita = { x: Math.cos(estado.yaw), z: -Math.sin(estado.yaw) };
  let dx = frente.x * iz + direita.x * ix;
  let dz = frente.z * iz + direita.z * ix;
  const norma = Math.hypot(dx, dz);
  let andando = false;
  if (!batalha && !vista && norma > 0 && forca > 0) {
    dx = (dx / norma) * forca;
    dz = (dz / norma) * forca;
    const antes = { ...estado.pos };
    estado.pos = resolverMovimento(estado.pos, dx * VELOCIDADE * dt, dz * VELOCIDADE * dt, RAIO, CAIXAS);
    const andou = Math.hypot(estado.pos.x - antes.x, estado.pos.z - antes.z) > 1e-4;
    estado.rot += diferencaAngulo(estado.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    if (andou) estado.bob += dt * 12;
    andando = andou;
  }
  jogador.position.set(estado.pos.x, Math.abs(Math.sin(estado.bob)) * 0.08, estado.pos.z);
  azazel.atualizar(andando, estado.rot, estado.yaw, agora);

  // câmera: posição desejada, encurtada se houver parede no caminho, e suavizada
  const alvo = new THREE.Vector3(estado.pos.x, ALTURA_ALVO, estado.pos.z);
  const d = distanciaCamera();
  const horiz = d * Math.cos(estado.pitch);
  const vert = d * Math.sin(estado.pitch);
  const desejada = new THREE.Vector3(
    alvo.x + Math.sin(estado.yaw) * horiz,
    alvo.y + vert,
    alvo.z + Math.cos(estado.yaw) * horiz,
  );
  const f = fracaoLivreCamera(alvo, desejada, CAIXAS);
  const destino = alvo.clone().add(desejada.clone().sub(alvo).multiplyScalar(f));
  estado.cam.lerp(destino, Math.min(1, dt * 12));
  camera.position.copy(estado.cam);
  camera.lookAt(alvo.x, alvo.y + 0.2, alvo.z);

  // placa: aviso e botão Examinar aparecem quando o personagem chega perto
  const pertoAgora = perto();
  document.getElementById('prompt').style.display = pertoAgora && !batalha && !vista ? 'block' : 'none';
  acaoExaminar.disabled = !pertoAgora;
  btnExaminar.hidden = !pertoAgora;
  btnCentro.hidden = false;
  const msg = document.getElementById('msg');
  if (msg.style.display === 'block' && performance.now() > estado.mensagemAte) msg.style.display = 'none';
  if (!registro.hidden && performance.now() > registroAte) registro.hidden = true;

  atualizarSelvagens(agora / 1000, agora);
  atualizarLocal();
}

// ---- minimapa: mar, quatro regiões, cidades, selvagens, placa e personagem (o recorte redondo é do CSS) ----
const mini = document.getElementById('mini');
const g = mini.getContext('2d');
const escalaMini = mini.width / (LIMITE_MAPA * 2);
const mundoParaMini = (x, z) => [(x + LIMITE_MAPA) * escalaMini, (z + LIMITE_MAPA) * escalaMini];
function desenharMinimapa() {
  g.fillStyle = COR_MAR;
  g.fillRect(0, 0, mini.width, mini.height);
  for (const r of Object.values(REGIOES)) {
    const [x, y] = mundoParaMini(r.x0, r.z0);
    g.fillStyle = r.cor;
    g.fillRect(x, y, (r.x1 - r.x0) * escalaMini, (r.z1 - r.z0) * escalaMini);
  }
  const cidadeAtual = estado.local && estado.local.cidade;
  for (const c of CIDADES_MUNDO) {
    const [x, y] = mundoParaMini(c.x, c.z);
    const atual = c.nome === cidadeAtual;
    g.beginPath();
    g.arc(x, y, atual ? 9 : 6, 0, Math.PI * 2);
    g.fillStyle = atual ? '#ffd27a' : '#fff8e7';
    g.strokeStyle = '#17324f';
    g.lineWidth = 2;
    g.fill();
    g.stroke();
  }
  for (const s of selvagens) {
    if (!s.ativo) continue;
    const [x, y] = mundoParaMini(s.malha.position.x, s.malha.position.z);
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fillStyle = s.cor;
    g.strokeStyle = '#17324f';
    g.lineWidth = 2;
    g.fill();
    g.stroke();
  }
  const [sx, sy] = mundoParaMini(SINAL.x, SINAL.z);
  g.fillStyle = '#ffd27a';
  g.beginPath(); g.arc(sx, sy, 5, 0, Math.PI * 2); g.fill();
  const [px, py] = mundoParaMini(estado.pos.x, estado.pos.z);
  // seta do personagem na direção que ele olha: amarela, como o cursor do mapa de referência
  g.save();
  g.translate(px, py);
  g.rotate(Math.PI - estado.rot); // a seta de cima vira a direção (sen rot, cos rot) no mapa
  g.fillStyle = '#ffd27a';
  g.strokeStyle = '#17324f';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -14); g.lineTo(9, 9); g.lineTo(0, 4); g.lineTo(-9, 9); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

// ---- texto do prompt conforme o dispositivo: no toque, o prompt fala do botão ----
if (toque) {
  document.getElementById('prompt').textContent = 'Toque em Examinar';
}

// ---- laço principal ----
let ultimo = performance.now();
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  atualizar(dt, agora);
  azazel.olharPara(camera);
  if (batalha) {
    const dtBatalha = dt * preferenciasBatalha.velocidade;
    tocarRoteiro(dtBatalha);
    tocarAuto(dtBatalha);
    cenaBat.atualizar(dtBatalha, agora / 1000);
    atualizarMira();
    renderer.render(cenaBat.cena, cenaBat.camera);
  } else {
    renderer.render(scene, camera);
  }
  desenharMinimapa();
  requestAnimationFrame(quadro);
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  cenaBat.resize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

// para testes automáticos: posição do personagem, câmera, localização, teleporte, batalha e time
window.explorar3d = {
  cenaBatalha: () => cenaBat,   // depuração: a cena 3D da batalha
  jogador: () => ({ x: estado.pos.x, z: estado.pos.z, rot: estado.rot }),
  sprites: () => scene.children.filter((o) => o.isSprite).map((s) => ({ x: s.position.x, z: s.position.z, altura: s.scale.y })),
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: estado.yaw, pitch: estado.pitch }),
  local: () => estado.local,
  teleportar: (x, z) => { estado.pos = { x, z }; },
  registro: (itens, ms) => mostrarRegistro(itens, ms),
  preferenciasBatalha: () => ({ ...preferenciasBatalha }),
  setAuto: (on) => { preferenciasBatalha.auto = Boolean(on); renderTudo(); },
  setVelocidade: (v) => { preferenciasBatalha.velocidade = v; renderTudo(); },
  batalha: () => (batalha ? { fase: batalha.fase, turno: batalha.e.turno, quem: batalha.quem, alvo: batalha.alvo, inimigos: batalha.e.inimigos.length, aliados: batalha.e.aliados.filter((a) => a.hp > 0).length, resultado: batalha.resultado, roteiro: Boolean(batalha.roteiro) } : null),
  iniciarBatalha: (i) => iniciarBatalha(selvagens[i]),
  sortear: (i) => { novoSelvagem(selvagens[i]); return selvagens[i].sorteio.monstro.variante ?? null; },
  acaoBatalha: (i) => { if (batalha?.fase === 'planejar' && batalha.menu === 'acoes') escolherAcao(ACOES[i]); },
  escolherItem: (i) => { if (batalha?.fase === 'planejar' && batalha.menu !== 'acoes') escolherItem(i); },
  confirmarAlvo: () => { if (batalha?.fase === 'alvo') confirmarAlvo(); },
  mirarInimigo: (i) => { if (batalha?.fase === 'alvo') { batalha.alvo = i; mirarAlvo(); renderTudo(); } },
  vista: () => (vista ? vista.tipo : null),
  abrirTime,
  pocoes: () => ({ ...pocoesBatalha }),
  selvagens: () => selvagens.map((s) => ({ especie: s.especie, celula: s.celula, pronto: s.pronto, ativo: s.ativo })),
  slots: () => time.map((m) => ({ especie: m.species, slots: [...m.abilities], variante: m.variante })),
};

// os links com #espolio, #batalha e #time mostram o registro de exemplo, uma batalha e o time, para ver as telas sem andar
if (location.hash === '#espolio') setTimeout(() => mostrarRegistro(EXEMPLO_ESPOLIO, 60000), 900);
if (location.hash === '#batalha') setTimeout(() => iniciarBatalha(selvagens[0]), 900);
if (location.hash === '#time') setTimeout(abrirTime, 900);

estado.cam.copy(new THREE.Vector3(estado.pos.x, ALTURA_ALVO + 3, estado.pos.z + distanciaCamera()));
requestAnimationFrame(quadro);
