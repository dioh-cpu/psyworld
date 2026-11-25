// Habilidades e efeitos de batalha por turnos (dados + gerador de kits). Cada Onírico tem 3 habilidades; cada uma tem só tempo de
// recarga (em rodadas), sem custo. Quanto maior a recarga, maior o dano, a cura ou o buff. O motor (regiao1-estrategia-regras.js) só lê estes dados.

// Efeitos de status. dot: dano a cada turno; cc: perde o turno; debuff: removido por purificação.
export const EFEITOS = {
  sangramento: { nome: 'Sangramento', icone: '🩸', debuff: true, dot: true, cor: '#ef4444' },
  queimadura: { nome: 'Queimadura', icone: '🔥', debuff: true, dot: true, cor: '#fb923c' },
  veneno: { nome: 'Veneno', icone: '☠️', debuff: true, dot: true, cor: '#84cc16' },
  atordoamento: { nome: 'Atordoamento', icone: '💫', debuff: true, cc: true, cor: '#fde047' },
  congelamento: { nome: 'Congelamento', icone: '❄️', debuff: true, cc: true, cor: '#7dd3fc' },
  sono: { nome: 'Sono', icone: '💤', debuff: true, cc: true, quebraAoDano: true, cor: '#a5b4fc' },
  silencio: { nome: 'Silêncio', icone: '🔇', debuff: true, cor: '#94a3b8' },
  ataque_baixo: { nome: 'Ataque reduzido', icone: '⚔️⬇', debuff: true, cor: '#f87171' },
  defesa_baixa: { nome: 'Defesa reduzida', icone: '🛡️⬇', debuff: true, cor: '#fb7185' },
  ataque_alto: { nome: 'Ataque elevado', icone: '⚔️⬆', cor: '#facc15' },
  defesa_alta: { nome: 'Defesa elevada', icone: '🛡️⬆', cor: '#60a5fa' },
  regeneracao: { nome: 'Regeneração', icone: '💚', cor: '#4ade80' },
  escudo: { nome: 'Escudo', icone: '🔰', cor: '#38bdf8' },
  provocacao: { nome: 'Provocação', icone: '🎯', cor: '#f97316' },
};
export const DEBUFFS = Object.keys(EFEITOS).filter((k) => EFEITOS[k].debuff);

const slug = (n) => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const ef = (id, turnos = 3, chance = 1, extra = {}) => ({ id, turnos, chance, ...extra });

// ---- kits escritos à mão ----
// tipo: 'dano' | 'cura' | 'apoio'. alvo: 'um' | 'todos' | 'aliado' | 'aliados' | 'si'. distancia: projétil (senão, corpo a corpo).
export const KITS = {
  Noctarn: [
    { id: 'mordida_umbral', nome: 'Mordida Umbral', icone: '🦷', tipo: 'dano', alvo: 'um', mult: 1.3, cd: 1, elemento: 'trevas', efeitos: [ef('sangramento', 3, 0.85)] },
    { id: 'chama_violeta', nome: 'Chama Violeta', icone: '🔥', tipo: 'dano', alvo: 'um', mult: 2.1, cd: 3, distancia: true, elemento: 'trevas', efeitos: [ef('queimadura', 3, 0.75)] },
    { id: 'veu_noturno', nome: 'Véu Noturno', icone: '🌙', tipo: 'cura', alvo: 'si', mult: 0.34, cd: 5, elemento: 'trevas', limpa: true, escudo: 0.15, efeitos: [ef('regeneracao', 2)] },
  ],
};

// ---- gerador por arquétipo (papel) e elemento ----
const POR_ELEMENTO = {
  fogo: { dot: 'queimadura', cc: 'atordoamento', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  planta: { dot: 'veneno', cc: 'sono', debuff: 'defesa_baixa', buff: 'regeneracao' },
  agua: { dot: 'sangramento', cc: 'congelamento', debuff: 'ataque_baixo', buff: 'regeneracao' },
  terra: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  pedra: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  inseto: { dot: 'veneno', cc: 'sono', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  voador: { dot: 'sangramento', cc: 'silencio', debuff: 'defesa_baixa', buff: 'ataque_alto' },
  eletrico: { dot: 'queimadura', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'ataque_alto' },
  aco: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'defesa_alta' },
  trevas: { dot: 'sangramento', cc: 'sono', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  luz: { dot: 'queimadura', cc: 'silencio', debuff: 'ataque_baixo', buff: 'ataque_alto' },
  neutro: { dot: 'sangramento', cc: 'atordoamento', debuff: 'defesa_baixa', buff: 'ataque_alto' },
};
export function kitDe(especie, papel, elemento, nomes = []) {
  if (KITS[especie]) return KITS[especie];
  const E = POR_ELEMENTO[elemento] || POR_ELEMENTO.neutro, n = (i) => nomes[Math.min(i, nomes.length - 1)] || 'Golpe';
  const mk = (i, h) => ({ id: slug(n(i)), nome: n(i), elemento, ...h });
  if (papel === 'defesa') return [
    mk(0, { icone: '🛡️', tipo: 'dano', alvo: 'um', mult: 1.1, cd: 1, efeitos: [ef('provocacao', 2)] }),
    mk(1, { icone: '🔰', tipo: 'apoio', alvo: 'aliados', cd: 3, escudo: 0.12, efeitos: [ef('defesa_alta', 3)] }),
    mk(2, { icone: '💥', tipo: 'dano', alvo: 'todos', mult: 1.5, cd: 5, distancia: true, efeitos: [ef(E.cc, 1, 0.55)] }),
  ];
  if (papel === 'suporte') return [
    mk(0, { icone: '💚', tipo: 'cura', alvo: 'aliado', mult: 0.2, cd: 1, efeitos: [] }),
    mk(1, { icone: '🌿', tipo: 'cura', alvo: 'aliados', mult: 0.24, cd: 3, efeitos: [ef('regeneracao', 3)] }),
    mk(2, { icone: '✨', tipo: 'apoio', alvo: 'aliados', cd: 5, limpa: true, cura: 0.14, efeitos: [ef(E.buff === 'regeneracao' ? 'ataque_alto' : E.buff, 3)] }),
  ];
  return [
    mk(0, { icone: '⚔️', tipo: 'dano', alvo: 'um', mult: 1.2, cd: 1, efeitos: [ef(E.dot, 3, 0.7)] }),
    mk(1, { icone: '🌪️', tipo: 'dano', alvo: 'todos', mult: 1.05, cd: 3, distancia: true, efeitos: [ef(E.debuff, 2, 0.6)] }),
    mk(2, { icone: '💢', tipo: 'dano', alvo: 'um', mult: 2.9, cd: 5, distancia: true, efeitos: [ef(E.cc, 1, 0.6)] }),
  ];
}
