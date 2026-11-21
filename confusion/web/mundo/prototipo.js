// Protótipo de teste dos 50 sistemas: polígonos no lugar de arte, sem render de jogo.
// Usa os mesmos módulos do jogo (mundo/index.js) e o mesmo ciclo de dia e de ações do app.js.
import * as Mundo from './index.js';
import { faseDo, NPCS } from './sistemas-01.js';
import { clamp } from './util.js';
import { bridgeState } from '../core.js';

const canvas = document.getElementById('mapa');
const g = canvas.getContext('2d');
const el = (id) => document.getElementById(id);

let estado;
let jogo;
let notas;

// Monstro de teste (o jogo real passa os monstros do jogador).
const monstros = [{ id: 'm1', species: 'Noctarn', classe: 'comum', elemento: 'trevas', nivel: 10, tier: 1, sanidade: 60 }];

function novo() {
  estado = Mundo.criarMundo();
  jogo = {
    dia: 1, sanidade: 60, diamantes: 100, gold: 500,
    recursos: { madeira: 300, pedra: 300, cristal: 30, comida: 200, peca: 20, sementes: 20, raizes: 20 },
  };
  notas = [];
}

// Contexto do dia e das ações, como o app.js monta.
function contexto() {
  return {
    r: Math.random, dia: jogo.dia, sanidade: jogo.sanidade, recursos: jogo.recursos,
    diamantes: jogo.diamantes, gold: jogo.gold, monstros,
    ponteFechada: bridgeState(jogo.dia) === 'fechada',
  };
}

// Aplica notas e efeitos, como aplicarMundo do app.js.
function aplicar(res) {
  for (const n of res.notas || []) notas.unshift(`[dia ${jogo.dia}] ${n}`);
  notas = notas.slice(0, 60);
  const e = res.efeitos || {};
  if (e.sanidade) jogo.sanidade = clamp(jogo.sanidade + e.sanidade, 0, 100);
  if (e.diamantes) jogo.diamantes = Math.max(0, jogo.diamantes + e.diamantes);
  if (e.gold) jogo.gold = Math.max(0, jogo.gold + e.gold);
  for (const [k, v] of Object.entries(e.recursos || {})) jogo.recursos[k] = Math.max(0, (jogo.recursos[k] || 0) + v);
}

function avancar(dias) {
  for (let i = 0; i < dias; i++) {
    jogo.dia += 1;
    aplicar(Mundo.diaMundo(estado, contexto()));
  }
  renderizar();
}

function acao(sistema, acaoId, args) {
  aplicar(Mundo.acaoMundo(estado, sistema, acaoId, args, contexto()));
  renderizar();
}

// ---- Mapa ----
const POS = { norte: [0.28, 0.3], sul: [0.42, 0.72], porto: [0.76, 0.48] };
const FORMA = { norte: 6, sul: 5, porto: 4 };
const NPC_POS = { ana: [0.1, 0.1], teo: [-0.12, 0.1], lia: [0.1, -0.1] };
const NPC_ONDE = { ana: 'norte', teo: 'sul', lia: 'porto' };

function poligono(cx, cy, raio, lados, rot = -Math.PI / 2) {
  g.beginPath();
  for (let i = 0; i < lados; i++) {
    const a = rot + (i * 2 * Math.PI) / lados;
    const x = cx + Math.cos(a) * raio;
    const y = cy + Math.sin(a) * raio;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

function desenhar() {
  const W = canvas.width;
  const H = canvas.height;
  g.clearRect(0, 0, W, H);

  // Mar e terra (polígonos de fundo).
  g.fillStyle = '#1b2a3a';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#25402f';
  g.beginPath();
  [[0.08, 0.06], [0.92, 0.06], [0.96, 0.5], [0.62, 0.95], [0.18, 0.9], [0.04, 0.5]]
    .forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)));
  g.closePath();
  g.fill();

  // Ponte entre o sul e o porto: tracejada e vermelha quando fechada.
  const fechada = bridgeState(jogo.dia) === 'fechada';
  const [sx, sy] = [POS.sul[0] * W, POS.sul[1] * H];
  const [px, py] = [POS.porto[0] * W, POS.porto[1] * H];
  g.setLineDash(fechada ? [10, 8] : []);
  g.strokeStyle = fechada ? '#ff6b6b' : '#e8d28a';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(px, py);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#e8ecf3';
  g.font = '12px system-ui, sans-serif';
  g.fillText(fechada ? 'ponte fechada' : 'ponte aberta', (sx + px) / 2 - 36, (sy + py) / 2 + 22);

  // Cidades: polígono colorido pela prosperidade, escurecido pela corrupção.
  for (const id of Object.keys(POS)) {
    const c = estado['01'][id];
    const [x, y] = [POS[id][0] * W, POS[id][1] * H];
    const raio = 52;
    poligono(x, y, raio, FORMA[id]);
    g.fillStyle = `hsl(${c.prosperidade * 1.2}, 60%, 45%)`;
    g.fill();
    g.strokeStyle = '#e8ecf3';
    g.lineWidth = 2;
    g.stroke();
    poligono(x, y, raio, FORMA[id]);
    g.fillStyle = `rgba(40, 0, 60, ${(c.corrupcao / 100) * 0.7})`;
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = 'bold 13px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText(c.nome, x, y + raio + 18);
    g.font = '12px system-ui, sans-serif';
    g.fillText(`prosperidade ${c.prosperidade} · corrupção ${c.corrupcao}`, x, y + raio + 34);
  }

  // NPCs: triângulo verde se disponível na fase atual, cinza se não.
  const fase = faseDo(jogo.dia);
  for (const n of NPCS) {
    const base = POS[NPC_ONDE[n.id]];
    const [dx, dy] = NPC_POS[n.id];
    const x = base[0] * W + dx * W;
    const y = base[1] * H + dy * H;
    const disponivel = n.disponivel.includes(fase);
    const tamanho = 9 + (estado['04'][n.id].confianca / 100) * 6;
    g.beginPath();
    g.moveTo(x, y - tamanho);
    g.lineTo(x - tamanho, y + tamanho * 0.8);
    g.lineTo(x + tamanho, y + tamanho * 0.8);
    g.closePath();
    g.fillStyle = disponivel ? '#6bdc8a' : '#6b7280';
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = '11px system-ui, sans-serif';
    g.fillText(`${n.nome.split(',')[0]} ${estado['04'][n.id].confianca}`, x, y + tamanho + 14);
  }

  // Facções e cabeçalho.
  const f = estado['03'];
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = '13px system-ui, sans-serif';
  g.fillText(`Dia ${jogo.dia} · ${fase}`, 14, 22);
  g.fillText(`Guardiões ${f.guardioes} · Culto ${f.culto} · Guilda ${f.guilda}`, 14, H - 14);
  g.fillText(`Guerra: ${estado['25'].guerra ? `sim (cerco ${estado['25'].cerco} dia(s))` : 'não'}`, 14, H - 32);
}

// ---- Painel ----
function renderizarPainel() {
  const R = jogo.recursos;
  el('status').innerHTML = `Dia <b>${jogo.dia}</b> · ${faseDo(jogo.dia)} · sanidade ${jogo.sanidade} · ${jogo.diamantes} diamantes · ${jogo.gold} gold<br>`
    + `madeira ${R.madeira || 0} · pedra ${R.pedra || 0} · cristal ${R.cristal || 0} · comida ${R.comida || 0}`;
  el('todos').innerHTML = Mundo.resumoMundo(estado).map((t) => `<li>${t}</li>`).join('');
  el('notas').innerHTML = notas.length ? notas.map((n) => `<li>${n}</li>`).join('') : '<li>Nenhuma nota ainda.</li>';

  const sistema = Mundo.SISTEMAS.find((s) => s.id === el('sistema').value);
  el('resumo').textContent = sistema ? `${sistema.nome}: ${sistema.resumo(estado[sistema.id])}` : '';
  const botoes = el('acoes');
  botoes.innerHTML = '';
  const acoes = Object.entries(sistema?.acoes || {});
  if (!acoes.length) {
    botoes.textContent = 'Sistema sem ações do jogador (efeito passivo).';
    return;
  }
  for (const [acaoId, acaoDef] of acoes) {
    const opcoes = Mundo.OPCOES_ACAO[`${sistema.id}.${acaoId}`];
    const lista = opcoes ? opcoes(estado) : [];
    if (lista.length) {
      for (const op of lista) {
        const b = document.createElement('button');
        b.textContent = `${acaoDef.rotulo} · ${op.rotulo}`;
        b.onclick = () => acao(sistema.id, acaoId, op.args);
        botoes.append(b);
      }
    } else {
      const b = document.createElement('button');
      b.textContent = acaoDef.rotulo;
      b.onclick = () => acao(sistema.id, acaoId, {});
      botoes.append(b);
    }
  }
}

function renderizar() {
  desenhar();
  renderizarPainel();
}

// ---- Inicialização ----
const seletor = el('sistema');
for (const s of Mundo.SISTEMAS) {
  const o = document.createElement('option');
  o.value = s.id;
  o.textContent = `${s.id} ${s.nome}`;
  seletor.append(o);
}
seletor.value = '01';
seletor.onchange = renderizar;
el('avancar1').onclick = () => avancar(1);
el('avancar7').onclick = () => avancar(7);
el('reiniciar').onclick = () => { novo(); renderizar(); };

novo();
renderizar();
