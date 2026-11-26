import { criarArena } from './regiao1-batalha-tela.js';
import { criarBatalha, criarUnidade } from './regiao1-estrategia-regras.js';
import { BOSSES_REGIAO1 } from './regiao1-estado.js';

const CHAVE_LAYOUT = 'confusion-waves:arena-4x4:v1';
const FUNDO = 'assets/confusion/interface/estrategia/madeira-01.webp';
const host = document.getElementById('arena');
const aviso = document.getElementById('selecao');
const dialogo = document.getElementById('salvo');
const codigo = document.getElementById('codigo');
const retorno = document.getElementById('retorno');
const chefe = BOSSES_REGIAO1.BOSS_E;
const arena = criarArena(host, {
  artes: { [chefe.nome]: 'assets/confusion/interface/personagens/espirito-boss-atual.webp' },
});

const criarEquipe = (equipe, lado, elementos = {}) => equipe.map((especie, i) => criarUnidade({
  id: lado + i, especie, lado, nivel: 24, papeis: {}, elemento: elementos[especie],
}));
const aliados = criarEquipe(['Noctarn', 'Ignavor', 'Vaelith', 'Brotavel'], 'a');
const inimigos = criarEquipe(['Noctarn', chefe.nome, 'Xistolim', 'Tatuveludo'], 'i', { [chefe.nome]: chefe.elemento });
arena.atualizar(criarBatalha(aliados, inimigos), { arena: FUNDO });
const rodape = host.querySelector('.tb-base');
rodape.inert = true;

const unidades = new Map([...aliados, ...inimigos].map(u => {
  const no = arena.campo.querySelector(`[data-un="${u.id}"]`);
  const ordem = Number(u.id.slice(1)) + 1;
  const rotulo = `${u.lado === 'a' ? 'Aliado' : 'Inimigo'} ${ordem} · ${u.especie}`;
  no.setAttribute('aria-label', rotulo);
  no.setAttribute('aria-pressed', 'false');
  return [u.id, { no, rotulo, colunaPadrao: no.style.left }];
}));

let arraste = null;
let selecionada = null;

function selecionar(unidade) {
  selecionada?.no.classList.remove('selecionada');
  selecionada?.no.setAttribute('aria-pressed', 'false');
  selecionada = unidade;
  unidade.no.classList.add('selecionada');
  unidade.no.setAttribute('aria-pressed', 'true');
  aviso.textContent = unidade.rotulo;
}

function aplicarPosicao(no, x, y) {
  no.style.left = `${x}%`;
  no.style.top = `${y}%`;
  no.style.zIndex = Math.round(y);
}

function mover(no, x, y) {
  const { clientWidth: largura, clientHeight: altura } = arena.campo;
  const margemX = no.offsetWidth / 2 + 2;
  const base = rodape.offsetTop - 3;
  const topo = Math.min(base, no.offsetHeight + 3);
  const px = Math.max(margemX, Math.min(largura - margemX, x));
  const py = Math.max(topo, Math.min(base, y));
  aplicarPosicao(no, 100 * px / largura, 100 * py / altura);
}

arena.campo.addEventListener('pointerdown', evento => {
  const no = evento.target.closest('[data-un]');
  if (!no || arraste || !evento.isPrimary || evento.button !== 0) return;
  evento.preventDefault();
  const quadro = arena.campo.getBoundingClientRect();
  selecionar(unidades.get(no.dataset.un));
  no.setPointerCapture(evento.pointerId);
  no.classList.add('arrastando');
  arraste = {
    no, id: evento.pointerId,
    dx: evento.clientX - quadro.left - no.offsetLeft,
    dy: evento.clientY - quadro.top - no.offsetTop,
  };
});

arena.campo.addEventListener('pointermove', evento => {
  if (evento.pointerId !== arraste?.id) return;
  const quadro = arena.campo.getBoundingClientRect();
  mover(arraste.no, evento.clientX - quadro.left - arraste.dx, evento.clientY - quadro.top - arraste.dy);
});

function encerrarArraste(evento) {
  if (evento.pointerId !== arraste?.id) return;
  arraste.no.classList.remove('arrastando');
  arraste = null;
}
for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  arena.campo.addEventListener(evento, encerrarArraste);
}

const setas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
arena.campo.addEventListener('keydown', evento => {
  const no = evento.target.closest('[data-un]');
  const direcao = setas[evento.key];
  if (!no || !direcao) return;
  evento.preventDefault();
  selecionar(unidades.get(no.dataset.un));
  const passo = evento.shiftKey ? 12 : 4;
  mover(no, no.offsetLeft + passo * direcao[0], no.offsetTop + passo * direcao[1]);
});

function lerPosicoes(equipe) {
  const { clientWidth: largura, clientHeight: altura } = arena.campo;
  return equipe.map(({ id }) => {
    const { no } = unidades.get(id);
    return [Number((100 * no.offsetLeft / largura).toFixed(1)), Number((100 * no.offsetTop / altura).toFixed(1))];
  });
}

function obterSalvo() {
  try { return JSON.parse(localStorage.getItem(CHAVE_LAYOUT)); } catch { return null; }
}
function coordenadasValidas(posicoes) {
  return Array.isArray(posicoes) && posicoes.length === 4 && posicoes.every(par =>
    Array.isArray(par) && par.length === 2 && par.every(n => Number.isFinite(n) && n >= 0 && n <= 100));
}

const anterior = obterSalvo();
if (anterior?.versao === 1 && coordenadasValidas(anterior.aliados) && coordenadasValidas(anterior.inimigos)) {
  for (const [equipe, posicoes] of [[aliados, anterior.aliados], [inimigos, anterior.inimigos]]) {
    equipe.forEach(({ id }, i) => aplicarPosicao(unidades.get(id).no, ...posicoes[i]));
  }
}

document.getElementById('restaurar').addEventListener('click', () => {
  for (const { no, colunaPadrao } of unidades.values()) {
    no.style.left = colunaPadrao;
    no.style.removeProperty('top');
    no.style.removeProperty('z-index');
    no.classList.remove('selecionada');
    no.setAttribute('aria-pressed', 'false');
  }
  selecionada = null;
  aviso.textContent = 'Formação padrão restaurada';
});

document.getElementById('salvar').addEventListener('click', () => {
  const layout = {
    versao: 1,
    tela: [arena.campo.clientWidth, arena.campo.clientHeight],
    aliados: lerPosicoes(aliados),
    inimigos: lerPosicoes(inimigos),
  };
  codigo.value = JSON.stringify(layout);
  try {
    localStorage.setItem(CHAVE_LAYOUT, codigo.value);
    retorno.textContent = '';
  } catch {
    retorno.textContent = 'Copie o código para guardar uma cópia.';
  }
  dialogo.showModal();
});

document.getElementById('copiar').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codigo.value);
    retorno.textContent = 'Código copiado';
  } catch {
    codigo.focus();
    codigo.select();
    retorno.textContent = 'Código selecionado. Toque em Copiar no menu do celular.';
  }
});
