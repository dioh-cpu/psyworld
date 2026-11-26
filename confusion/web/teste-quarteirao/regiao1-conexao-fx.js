// Efeito da Conexão Onírica (domador → montaria → domador). Reutilizável por montaria: só muda a paleta e a partícula.
// Sequência: anel e energia convergindo (≈380 ms) → casulo de luz no auge, quando o sistema troca o sprite (`aoTrocar`) →
// onda no chão e partículas da forma nova. A troca acontece no ponto dos pés, sem mexer em posição, direção ou escala.
// Reduzir movimento: só um brilho curto e a troca imediata.
import { camada, particula, rajada, convergir, onda, luz, coluna, circulo, R } from './regiao1-vfx-motor.js';
import { pref, tocar } from './regiao1-sfx.js';

const ESP = (ms) => new Promise((r) => setTimeout(r, ms));
// Paleta e partícula por montaria (novas montarias entram aqui)
export const CONEXAO = {
  domador: { cor: '#fbbf24', cor2: '#fff7ed', forma: 'brilho' },
  noctarn: { cor: '#8b5cf6', cor2: '#ede9fe', forma: 'faisca' },
  espirito: { cor: '#4ade80', cor2: '#ecfccb', forma: 'folha' },
  padrao: { cor: '#f3a458', cor2: '#fff7ed', forma: 'estrela' },
};
let dom = null;
function palco() {
  if (!dom || !dom.isConnected) { dom = document.createElement('div'); dom.className = 'conexao-fx'; dom.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6'; document.body.append(dom); }
  return { arena: dom, campo: dom, k: pref.reduzir ? 0.6 : 1, dens: typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches ? 0.55 : 1 };
}
// ponto(): { x, y (pés na tela), h (altura do corpo em px) }. para: 'montaria' | 'domador'.
export async function tocarConexao({ ponto, para = 'montaria', montaria = 'noctarn', aoTrocar } = {}) {
  const ctx = palco(), M = camada(ctx), pal = para === 'domador' ? CONEXAO.domador : (CONEXAO[montaria] || CONEXAO.padrao), orig = para === 'domador' ? (CONEXAO[montaria] || CONEXAO.padrao) : CONEXAO.domador;
  let p = ponto(); const h = Math.max(40, p.h || 80);
  if (pref.reduzir) { luz(M, p.x, p.y - h * 0.45, { cor: pal.cor, raio: h * 0.7, chao: false, vida: 0.4, forca: 0.8 }); aoTrocar?.(); return; }
  tocar('conexao');
  // 1) preparação: anel no chão, energia da forma atual sobe e a da nova converge
  circulo(M, p.x, p.y, { cor: pal.cor, cor2: pal.cor2, raio: h * 0.55, vida: 1.15, lados: 6, giro: 3 });
  luz(M, p.x, p.y, { cor: pal.cor, raio: h * 0.8, vida: 1 });
  for (let i = 0; i < M.n(14); i++) particula(M, { x: p.x + R(-h * 0.3, h * 0.3), y: p.y - R(0, h * 0.2), vx: 0, vy: R(-260, -150), atrito: 0.6, forma: 'faisca', cor: orig.cor, tam: 4, compr: 30, vida: 0.5, atraso: R(0, 0.25) });
  convergir(M, p.x, p.y - h * 0.5, { cor: pal.cor, raio: h * 0.95, n: 26, vida: 0.38 });
  await ESP(380);
  // 2) auge: casulo de luz cobre o corpo; a troca de sprite acontece aqui
  p = ponto();
  coluna(M, p.x, p.y, { cor: pal.cor, larg: h * 0.36, alt: h * 1.7, vida: 0.75 });
  luz(M, p.x, p.y - h * 0.45, { cor: pal.cor2, raio: h * 0.75, chao: false, forca: 1, vida: 0.45, nucleo: '#ffffff' });
  await ESP(110);
  aoTrocar?.();
  // 3) chegada: onda no chão e partículas da forma nova
  onda(M, p.x, p.y, { cor: pal.cor, r1: h * 1.35, esp: 5, vida: 0.6 }); onda(M, p.x, p.y, { cor: pal.cor2, r1: h * 0.8, esp: 3, vida: 0.45, atraso: 0.06 });
  rajada(M, p.x, p.y - h * 0.4, { n: 22, forma: pal.forma, cor: pal.cor, cor2: pal.cor2, tam: pal.forma === 'folha' ? 7 : 5, v: 230, sobe: 60, vida: 0.85, atrito: 0.8 });
  await ESP(450);
}
