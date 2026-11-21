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
import { modoDoFoco } from './camera-batalha.js';
import { montarMundo } from './mundo-3d.js';
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
const ALTURA_ALVO = 1.4;      // a câmera mira um pouco acima dos pés
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
scene.background = new THREE.Color('#7f93ad');   // céu de crepúsculo, mais frio e com menos saturação
scene.fog = new THREE.Fog('#7f93ad', 60, 170);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 260);

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

// personagem provisório: cápsula roxa
const jogadorMalha = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 12), material('#a040ff'));
jogadorMalha.position.y = 0.85;
contorno(jogadorMalha);
const jogador = new THREE.Group();
jogador.add(jogadorMalha);
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
let batalha = null;   // { s, fase: 'escolha' | 'luta' | 'fim' | 'recuou', sel, foco, combate, roteiro, passo, tempo, ... }
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
const pctVida = (hp) => Math.max(0, Math.min(100, (100 * hp) / CB.COMBATE.hpMax));

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

function htmlEscolha(b) {
  const sorteio = b.s.sorteio;
  const m = sorteio.monstro;
  return `<div class="bat-tela escolha">
    <h2 class="bat-titulo">Membro da batalha</h2>
    <div class="bat-selvagem">${arteHtml(m, 'pequena')}
      <div><b>${esc(m.species)}</b>${badgeVariante(m)}<span>${RARIDADE_NOME[sorteio.raridade - 1]} · Nv ${m.level} · ${NOME_ELEMENTO[m.elemento]}</span></div>
    </div>
    <ul class="bat-membros">${time.map((t, i) => cartaoMembro(t, i, i === b.sel, 'membro')).join('')}</ul>
    <div class="bat-acoes">
      <button type="button" class="bat-btn primario" data-bat="confirmar">Confirmar<kbd>Enter</kbd></button>
      <button type="button" class="bat-btn" data-bat="habilidades">Habilidades<kbd>X</kbd></button>
      <button type="button" class="bat-btn" data-bat="voltar">Voltar<kbd>Esc</kbd></button>
    </div>
    <p class="bat-pocoes">Poções: ${pocoesTexto()}</p>
  </div>`;
}

function htmlTime() {
  return `<div class="bat-tela escolha">
    <h2 class="bat-titulo">Time</h2>
    <ul class="bat-membros">${time.map((t, i) => cartaoMembro(t, i, i === vista.sel, 'vista-membro')).join('')}</ul>
    <div class="bat-acoes">
      <button type="button" class="bat-btn primario" data-bat="vista-habilidades">Habilidades<kbd>Enter</kbd></button>
      <button type="button" class="bat-btn" data-bat="vista-fechar">Fechar<kbd>Esc</kbd></button>
    </div>
    <p class="bat-pocoes">Troque as habilidades dos slots 1 a 4 quando quiser. A batalha usa esses slots no disco de ações.</p>
  </div>`;
}

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

function htmlLuta(b) {
  const c = b.combate;
  const m = time[b.sel];
  const monstroI = b.s.sorteio.monstro;
  const ops = opcoesAtuais();
  const sel = ops[b.foco] ?? ops[0];
  const R = 104;
  const centro = 150;
  const itens = ops.map((o, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / ops.length;
    const x = centro + R * Math.cos(ang) - 30;
    const y = centro + R * Math.sin(ang) - 30;
    return `<button type="button" class="disco-item ${i === b.foco ? 'sel' : ''} ${o.ativa ? '' : 'off'}" style="left:${x}px;top:${y}px"
      data-bat="acao" data-i="${i}" ${o.ativa && !b.roteiro ? '' : 'disabled'} title="${esc(o.rotulo)}">${o.icone}</button>`;
  }).join('');
  const log = c.log.slice(-4).map((l) => `<li>${esc(l)}</li>`).join('');
  return `<div class="bat-tela luta ${b.roteiro ? 'ocupado' : ''}">
    <header class="bat-topo"><span>Batalha · ${esc(b.area.nome)} · ${NOME_ELEMENTO[b.area.elemento]}</span><span>Turno ${Math.min(c.turno, CB.COMBATE.turnosMax)} de ${CB.COMBATE.turnosMax}</span><span>${pocoesTexto()}</span></header>
    <section class="bat-cartao ini">
      <div class="cab"><b>${esc(c.ini.nome)}</b>${badgeVariante(monstroI)}<span>${NOME_ELEMENTO[c.ini.elemento]} · Nv ${monstroI.level}</span></div>
      <div class="barra"><i data-barra="ini"></i></div>
    </section>
    <section class="bat-cartao jog">
      <div class="cab"><b>${esc(c.jog.nome)}</b>${badgeVariante(m)}<span>${NOME_ELEMENTO[c.jog.elemento]} · Nv ${m.level}</span></div>
      <div class="barra"><i data-barra="jog"></i></div>
    </section>
    <ol class="bat-log">${log}</ol>
    <div class="disco">
      <button type="button" class="disco-centro" data-bat="acao" data-i="${b.foco}" ${b.roteiro ? 'disabled' : ''}>${sel.icone}</button>
      ${itens}
      <div class="disco-rotulo">${esc(sel.rotulo)}</div>
    </div>
    <p class="bat-dica">1 2 3 4 habilidade · Q atacar · X poção · ←→ escolher · Enter confirmar</p>
  </div>`;
}

function htmlFim(b) {
  const c = b.combate;
  const m = time[b.sel];
  const log = c.log.slice(-6).map((l) => `<li>${esc(l)}</li>`).join('');
  const xp = b.xp >= 0 ? `+${b.xp}` : `${b.xp}`;
  return `<div class="bat-fim ${b.resultado ? 'vitoria' : 'derrota'}">
    <h2>${b.resultado ? 'Vitória' : 'Derrota'}</h2>
    <p>${esc(m.species)} · XP ${xp}${b.subiu ? ` · subiu para o nível ${b.nivel}` : ''}</p>
    ${b.resultado && b.gold ? `<p>Gold +${b.gold}${b.pocao ? ' · Poção pequena +1' : ''}</p>` : ''}
    <ol class="bat-log grande">${log}</ol>
    <button type="button" class="bat-btn primario" data-bat="continuar">Continuar<kbd>Enter</kbd></button>
  </div>`;
}

// Barras de vida da luta: mostram a vida do roteiro (hpMostrado), que avança golpe a golpe.
function atualizarBarras() {
  const b = batalha;
  if (!b || !b.hpMostrado || b.fase !== 'luta') return;
  const pj = pctVida(b.hpMostrado.j);
  const pi = pctVida(b.hpMostrado.i);
  const eJ = batalhaEl.querySelector('[data-barra="jog"]');
  const eI = batalhaEl.querySelector('[data-barra="ini"]');
  if (eJ) { eJ.style.width = `${pj}%`; eJ.parentElement.classList.toggle('baixa', pj <= 30); }
  if (eI) { eI.style.width = `${pi}%`; eI.parentElement.classList.toggle('baixa', pi <= 30); }
}

function renderBatalha() {
  const b = batalha;
  if (b.fase === 'escolha') batalhaEl.innerHTML = htmlEscolha(b);
  else if (b.fase === 'luta') {
    batalhaEl.innerHTML = htmlLuta(b);
    atualizarBarras();
  } else batalhaEl.innerHTML = htmlFim(b);
}

// Desenha a tela atual: Time ou Habilidades (fora da luta ou a partir da escolha), a batalha, ou nada.
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

// ---- números que sobem do monstrinho atingido ----
function mostrarNumero(lado, texto, classe, deslocY = 0) {
  const p = cenaBat.projetar(lado);
  const el = document.createElement('div');
  el.className = `bat-pop ${classe}`;
  el.textContent = texto;
  el.style.left = `${p.x}px`;
  el.style.top = `${p.y - deslocY}px`;
  batalhaEl.append(el);
  setTimeout(() => el.remove(), 950);
}

// ---- batalha: fluxo ----
function iniciarBatalha(s) {
  s.ativo = false;
  s.malha.visible = false;
  s.reaparece = Infinity;   // não volta enquanto a luta dura; encerrarBatalha marca a volta
  batalha = {
    s, area: areaDaRegiao(localDe(estado.pos.x, estado.pos.z)?.regiao ?? null) ?? AREAS.Centro, fase: 'escolha', sel: 0, foco: 0, combate: null, resultado: false, xp: 0, subiu: 0, nivel: 0, gold: 0, pocao: 0,
    roteiro: null, passo: 0, tempo: 0, iniciado: false, pendenteFim: false, hpMostrado: null,
  };
  teclas.clear();
  estado.joy = { x: 0, z: 0 };
  // o selvagem aparece na arena; se for uma variação, a cor muda na frente de quem olha
  const m = s.sorteio.monstro;
  const giro = giroDoMonstro(m);
  cenaBat.tema(batalha.area.arena);
  cenaBat.reiniciarCamera();
  cenaBat.definir('inimigo', { textura: texturaDe(arteDe(m)), giro, animar: Boolean(giro), dur: 1.6 });
  cenaBat.mirar('panoramica');
  renderTudo();
}

function confirmarMembro() {
  const b = batalha;
  if (!b || b.fase !== 'escolha') return;
  const m = time[b.sel];
  b.combate = CB.criarCombate(lutadorDo(m), lutadorDo(b.s.sorteio.monstro), pocoesBatalha);
  b.fase = 'luta';
  b.foco = 0;
  b.hpMostrado = { j: b.combate.jog.hp, i: b.combate.ini.hp };
  const giro = giroDoMonstro(m);
  cenaBat.definir('jogador', { textura: texturaDe(arteDe(m)), giro, animar: Boolean(giro), dur: 1.2 });
  cenaBat.mirar('panoramica');
  renderTudo();
}

const opcoesAtuais = () => opcoesDeAcao(batalha.combate, time[batalha.sel]);

// A ação do jogador vira um roteiro de golpes; a câmera e as barras seguem o roteiro, não o clique.
function usarAcao(op) {
  const b = batalha;
  if (!b || b.fase !== 'luta' || b.roteiro || !op || !op.ativa) return;
  const logAntes = b.combate.log.length;
  try {
    CB.agir(b.combate, op.acao, Math.random);
  } catch {
    renderTudo();
    return;
  }
  Object.assign(pocoesBatalha, b.combate.pocoes);
  const eventos = eventosDoTurno(b.combate.log.slice(logAntes));
  const resultado = b.combate.fim ? b.combate.resultado : null;
  b.roteiro = roteiroDoTurno({ eventos, hpInicio: b.hpMostrado, resultado });
  b.passo = 0;
  b.tempo = 0;
  b.iniciado = false;
  b.pendenteFim = Boolean(resultado);
  renderTudo();
}

function executarPasso(p) {
  const b = batalha;
  if (p.tipo === 'foco') { cenaBat.mirar(modoDoFoco(p.lado)); return; }
  if (p.tipo === 'golpe') {
    cenaBat.golpe(p.lado, p.alvo, { critico: p.critico, habilidade: p.habilidade });
    if (p.dano > 0 && p.absorvido) mostrarNumero(p.alvo, `+${p.dano}`, 'cura');   // vampirismo: o alvo cura
    else if (p.dano > 0) mostrarNumero(p.alvo, p.critico ? `-${p.dano}!` : `-${p.dano}`, p.critico ? 'critico' : 'dano');
    // a tipagem aparece logo acima do número: super efetivo, pouco efetivo ou sem efeito
    if (p.eficacia) setTimeout(() => mostrarNumero(p.alvo, ROTULO_EFICACIA[p.eficacia], `efi-${p.eficacia}`, 36), 280);
    b.hpMostrado = p.hp;
    atualizarBarras();
    return;
  }
  if (p.tipo === 'erro') { mostrarNumero(p.alvo, 'Errou', 'erro'); return; }
  if (p.tipo === 'cura') {
    cenaBat.cura(p.lado);
    mostrarNumero(p.lado, `+${p.dano}`, 'cura');
    b.hpMostrado = p.hp;
    atualizarBarras();
    return;
  }
  if (p.tipo === 'pausa') { cenaBat.mirar('panoramica'); return; }
  if (p.tipo === 'fim') cenaBat.mirar(p.resultado === 'vitoria' ? 'vitoria' : 'derrota');
}

function tocarRoteiro(dt) {
  const b = batalha;
  if (!b || !b.roteiro) return;
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
  b.hpMostrado = { j: b.combate.jog.hp, i: b.combate.ini.hp };
  if (b.pendenteFim) terminarLuta();
  renderTudo();
}

function terminarLuta() {
  const b = batalha;
  const vitoria = b.combate.resultado === 'vitoria';
  const r = aplicarResultado(time[b.sel], vitoria);
  const rec = recompensaDaBatalha({ vitoria, raridade: b.s.sorteio.raridade, rnd: Math.random });
  pocoesBatalha.pequena += rec.pocao;
  Object.assign(b, { fase: 'fim', resultado: vitoria, xp: r.xp, subiu: r.subiu, nivel: r.nivel, gold: rec.gold, pocao: rec.pocao });
}

function fugir() {
  if (!batalha || batalha.fase !== 'escolha') return;
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
    const itens = itensDoEspolio({ vitoria: b.resultado, nomeMonstro: time[b.sel].species, xp: b.xp, gold: b.gold, pocao: b.pocao });
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
  const sel = voltar === 'escolha' && batalha ? batalha.sel : (vista?.sel ?? 0);
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
  if (b.fase === 'escolha') {
    if (k === 'ArrowUp' || k === 'KeyW') { b.sel = (b.sel + time.length - 1) % time.length; renderTudo(); }
    else if (k === 'ArrowDown' || k === 'KeyS') { b.sel = (b.sel + 1) % time.length; renderTudo(); }
    else if (k === 'KeyX') abrirHabilidades('escolha');
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') confirmarMembro();
    else if (k === 'Escape' || k === 'Backspace') fugir();
  } else if (b.fase === 'luta') {
    if (b.roteiro) return;
    const ops = opcoesAtuais();
    const n = ops.length;
    if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'KeyA' || k === 'KeyW') { b.foco = (b.foco + n - 1) % n; renderTudo(); }
    else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'KeyD' || k === 'KeyS') { b.foco = (b.foco + 1) % n; renderTudo(); }
    else if (/^(Digit|Numpad)[1-4]$/.test(k)) usarAcao(ops.find((o) => o.slot === Number(k.slice(-1)) - 1));
    else if (k === 'KeyQ') usarAcao(ops[0]);
    else if (k === 'KeyX') usarAcao(ops.at(-1));
    else if (k === 'Enter' || k === 'Space' || k === 'KeyE') usarAcao(ops[b.foco]);
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
  if (acao === 'membro') { batalha.sel = Number(el.dataset.i); renderTudo(); }
  else if (acao === 'confirmar') confirmarMembro();
  else if (acao === 'voltar') fugir();
  else if (acao === 'habilidades') abrirHabilidades('escolha');
  else if (acao === 'acao') usarAcao(opcoesAtuais()[Number(el.dataset.i)]);
  else if (acao === 'continuar') encerrarBatalha();
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
  if (!batalha && !vista && norma > 0 && forca > 0) {
    dx = (dx / norma) * forca;
    dz = (dz / norma) * forca;
    const antes = { ...estado.pos };
    estado.pos = resolverMovimento(estado.pos, dx * VELOCIDADE * dt, dz * VELOCIDADE * dt, RAIO, CAIXAS);
    const andou = Math.hypot(estado.pos.x - antes.x, estado.pos.z - antes.z) > 1e-4;
    estado.rot += diferencaAngulo(estado.rot, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    if (andou) estado.bob += dt * 12;
  }
  jogador.position.set(estado.pos.x, Math.abs(Math.sin(estado.bob)) * 0.08, estado.pos.z);
  jogador.rotation.y = estado.rot;

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
  if (batalha) {
    tocarRoteiro(dt);
    cenaBat.atualizar(dt, agora / 1000);
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
  jogador: () => ({ x: estado.pos.x, z: estado.pos.z, rot: estado.rot }),
  sprites: () => scene.children.filter((o) => o.isSprite).map((s) => ({ x: s.position.x, z: s.position.z, altura: s.scale.y })),
  camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: estado.yaw, pitch: estado.pitch }),
  local: () => estado.local,
  teleportar: (x, z) => { estado.pos = { x, z }; },
  registro: (itens, ms) => mostrarRegistro(itens, ms),
  batalha: () => (batalha ? { fase: batalha.fase, turno: batalha.combate?.turno ?? 0, resultado: batalha.resultado, roteiro: Boolean(batalha.roteiro) } : null),
  iniciarBatalha: (i) => iniciarBatalha(selvagens[i]),
  sortear: (i) => { novoSelvagem(selvagens[i]); return selvagens[i].sorteio.monstro.variante ?? null; },
  acaoBatalha: (i) => { if (batalha?.fase === 'luta') usarAcao(opcoesAtuais()[i]); },
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
