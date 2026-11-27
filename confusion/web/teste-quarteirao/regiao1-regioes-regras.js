// Catálogo das 12 regiões e regras puras de progressão regional (Expansão 1).
// Sem DOM/Three.js para testes determinísticos.
// Usa REGIOES (faixas de nível), REINOS (Reinos 1–2) e LINHAGENS_REINOS (Reinos 3–12).

import { REGIOES, CLASSE_DA_ESPECIE } from './regiao1-progressao.js';
import { REINOS } from '../reinos.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';
import { ELEMENTO_DA_ESPECIE, LINHAS } from '../species.js';
import { CHEFES_R2, R2_PASTA_ARTES } from './regiao2-altos-ambar.js';
import { REGIOES_3_12_POR_ID } from './regiao1-regioes-r3-r12-regras.js';
import { adicionarEssencia } from './regiao1-regras-sonho.js';

let _geradorReliquiaRegiao = null;
export function registrarGeradorReliquiaRegiao(fn) {
  _geradorReliquiaRegiao = typeof fn === 'function' ? fn : null;
}

const INICIAIS_PROIBIDOS_SELVAGENS = new Set(LINHAS.flatMap((l) => [l.inicial, l.atual, l.evolucao]));
const RAIZ_REINOS = 'assets/confusion/interface/estrategia/reinos';

const DEFINICOES_BASE = [
  {
    numero: 1, nome: 'Vale de Outono', jogavel: true, mapaEntrada: 'C0',
    chefe: { id: 'BOSS_R1', nome: 'Espírito da Floresta & Rei Fungo', nivel: 12, elemento: 'planta', arte: 'assets/confusion/interface/personagens/espirito-boss-atual.webp', arena: 'assets/regiao1/BOSS_E.webp' },
    recompensa: { gold: 400, diamantes: 80, xp: 300 },
  },
  {
    numero: 2, nome: 'Altos do Âmbar', jogavel: true, mapaEntrada: 'R2_C0',
    chefe: { id: 'BOSS_R2', nome: 'Rainha da Colmeia Dourada', nivel: 45, elemento: 'aco', arte: `${RAIZ_REINOS}/02/chefe.webp`, arena: `${R2_PASTA_ARTES}R2_CHEFE-arena.webp` },
    recompensa: { gold: 900, diamantes: 150, xp: 800 },
  },
  {
    numero: 3, nome: 'Crista da Alvorada', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R3', nome: 'Basilisco da Crista Rubra', nivel: 70, elemento: 'fogo', arte: `${RAIZ_REINOS}/03/chefe.webp`, arena: `${RAIZ_REINOS}/03/arena-chefe.webp` },
    recompensa: { gold: 1400, diamantes: 200, xp: 1400 },
  },
  {
    numero: 4, nome: 'Manguezal do Sal', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R4', nome: 'Caranguejo Salífero', nivel: 95, elemento: 'agua', arte: `${RAIZ_REINOS}/04/chefe.png`, arena: `${RAIZ_REINOS}/04/arena-chefe.webp` },
    recompensa: { gold: 2000, diamantes: 260, xp: 2200 },
  },
  {
    numero: 5, nome: 'Serras do Linho', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R5', nome: 'Tecelão do Vendaval', nivel: 120, elemento: 'voador', arte: `${RAIZ_REINOS}/05/chefe.png`, arena: `${RAIZ_REINOS}/05/arena-chefe.webp` },
    recompensa: { gold: 2700, diamantes: 320, xp: 3200 },
  },
  {
    numero: 6, nome: 'Degraus de Terracota', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R6', nome: 'Colosso do Forno Oco', nivel: 150, elemento: 'terra', arte: `${RAIZ_REINOS}/06/chefe.png`, arena: `${RAIZ_REINOS}/06/arena-chefe.webp` },
    recompensa: { gold: 3500, diamantes: 400, xp: 4500 },
  },
  {
    numero: 7, nome: 'Bacia da Ametista', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R7', nome: 'Golem de Ametista', nivel: 180, elemento: 'pedra', arte: `${RAIZ_REINOS}/07/chefe.png`, arena: `${RAIZ_REINOS}/07/arena-chefe.webp` },
    recompensa: { gold: 4500, diamantes: 480, xp: 6000 },
  },
  {
    numero: 8, nome: 'Jardins da Bruma', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R8', nome: 'Abade da Névoa', nivel: 210, elemento: 'planta', arte: `${RAIZ_REINOS}/08/chefe.png`, arena: `${RAIZ_REINOS}/08/arena-chefe.webp` },
    recompensa: { gold: 5600, diamantes: 560, xp: 7800 },
  },
  {
    numero: 9, nome: 'Caldeira do Ferro', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R9', nome: 'Regente da Escória', nivel: 240, elemento: 'aco', arte: `${RAIZ_REINOS}/09/chefe.png`, arena: `${RAIZ_REINOS}/09/arena-chefe.webp` },
    recompensa: { gold: 6800, diamantes: 650, xp: 9800 },
  },
  {
    numero: 10, nome: 'Geada Alta', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R10', nome: 'Urso da Aurora Fraturada', nivel: 265, elemento: 'agua', arte: `${RAIZ_REINOS}/10/chefe.png`, arena: `${RAIZ_REINOS}/10/arena-chefe.webp` },
    recompensa: { gold: 8200, diamantes: 750, xp: 12000 },
  },
  {
    numero: 11, nome: 'Deserto do Vitral', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R11', nome: 'Esfinge de Vidro', nivel: 285, elemento: 'trevas', arte: `${RAIZ_REINOS}/11/chefe.png`, arena: `${RAIZ_REINOS}/11/arena-chefe.webp` },
    recompensa: { gold: 9800, diamantes: 880, xp: 15000 },
  },
  {
    numero: 12, nome: 'Atol do Farol', jogavel: true, mapaEntrada: null,
    chefe: { id: 'BOSS_R12', nome: 'Sentinela do Farol', nivel: 300, elemento: 'eletrico', arte: `${RAIZ_REINOS}/12/chefe.png`, arena: `${RAIZ_REINOS}/12/arena-chefe.webp` },
    recompensa: { gold: 12000, diamantes: 1200, xp: 20000 },
  },
];

function montarEncontrosDaRegiao(numero, faixa) {
  const [minNv, maxNv] = faixa;
  const formaPadrao = minNv <= 20 ? 1 : minNv <= 40 ? 2 : 3;
  if (numero === 1 || numero === 2) {
    const vistos = new Set();
    return (REINOS[numero]?.linhagens || [])
      .filter((l) => !INICIAIS_PROIBIDOS_SELVAGENS.has(l.nome) && !vistos.has(l.nome) && vistos.add(l.nome))
      .map((l) => ({
        especie: l.nome,
        elemento: l.elemento || ELEMENTO_DA_ESPECIE[l.nome] || 'neutro',
        classe: CLASSE_DA_ESPECIE[l.nome] || 'guerreiro',
        peso: l.origem === 'nativa' ? 3 : l.origem === 'nova' ? 2 : 1,
        nivelMin: minNv,
        nivelMax: Math.max(minNv, maxNv - 2),
        forma: formaPadrao,
      }))
      .flatMap((encontro) => numero === 2 ? [
        { ...encontro, nivelMax: 30 },
        { ...encontro, nivelMin: 21, forma: 2, peso: encontro.peso * 2 },
      ] : [encontro]);
  }
  return LINHAGENS_REINOS
    .filter((l) => l.reino === numero && !INICIAIS_PROIBIDOS_SELVAGENS.has(l.nome))
    .map((l) => ({
      especie: l.nome,
      elemento: l.elemento,
      classe: l.classe,
      peso: 2,
      nivelMin: minNv,
      nivelMax: Math.max(minNv, maxNv - 2),
      forma: formaPadrao,
    }));
}

export const CATALOGO_REGIOES = DEFINICOES_BASE.map((def, idx) => {
  const id = `r${def.numero}`;
  const faixaNivel = [...REGIOES[idx]];
  const ext = REGIOES_3_12_POR_ID[id];
  const anterior = idx > 0 ? DEFINICOES_BASE[idx - 1] : null;
  const desbloqueio = idx === 0
    ? { tipo: 'inicial', regiaoAnterior: null, chefeId: null, texto: 'Disponível desde o início.' }
    : idx === 1
      ? { tipo: 'chefes_r1', regiaoAnterior: 'r1', chefeId: 'BOSS_R1', chefes: ['BOSS_E', 'BOSS_D'], texto: 'Derrote Espírito da Floresta e Rei Fungo na Região 1.' }
      : { tipo: 'chefe_anterior', regiaoAnterior: `r${anterior.numero}`, chefeId: anterior.chefe.id, texto: `Derrote ${anterior.chefe.nome} na Região ${anterior.numero}.` };
  return {
    id,
    numero: def.numero,
    reinoId: def.numero,
    nome: def.nome,
    faixaNivel,
    jogavel: def.jogavel,
    mapaEntrada: ext?.mapaEntrada || def.mapaEntrada,
    ...(ext ? {
      mapaChefe: ext.mapaChefe,
      areas: ext.areas,
      ordemAreas: ext.ordemAreas,
      encontrosPorArea: ext.encontrosPorArea,
      chefeSpec: ext.chefe.spec,
      recursoEstrategia: ext.recursoEstrategia,
      npc: ext.npc,
      missoes: ext.missoes,
    } : {}),
    desbloqueio,
    chefe: ext ? { ...def.chefe, ...ext.chefe, arte: def.chefe.arte, arena: def.chefe.arena } : { ...def.chefe },
    ...(ext?.npcAreaSegura ? { npcAreaSegura: ext.npcAreaSegura } : {}),
    recompensaPrimeiraVitoria: ext ? { ...ext.recompensaPrimeiraVitoria, ...def.recompensa } : { ...def.recompensa },
    encontros: montarEncontrosDaRegiao(def.numero, faixaNivel),
  };
});

export const REGIOES_POR_ID = Object.fromEntries(CATALOGO_REGIOES.map((r) => [r.id, r]));

export const MISSOES_REGIAO2 = [
  {
    id: 'm_r2_chegada',
    titulo: 'Chegada aos Altos do Âmbar',
    resumo: 'Fale com Melissa, a Apicultora, na praça de Altos do Âmbar (R2_C0).',
    recompensa: { gold: 250, diamantes: 35, xp: 180 },
  },
  {
    id: 'm_r2_apiarios',
    titulo: 'Zumbido nos Apiários',
    resumo: 'Vença 3 encontros selvagens nos Altos do Âmbar.',
    metaAbates: 3,
    recompensa: { gold: 400, diamantes: 50, xp: 320 },
  },
  {
    id: 'm_r2_rainha',
    titulo: 'Coroa de Âmbar',
    resumo: 'Derrote a Rainha da Colmeia Dourada no Santuário da Colmeia (R2_CHEFE).',
    recompensa: { gold: 600, diamantes: 100, xp: 500 },
  },
];

export function criarEstadoRegioesInicial() {
  return {
    atual: 'r1',
    chefesDerrotados: {},
    primeiraVitoria: {},
    missoes: {},
    progressoMissoes: {},
    pistas: {},
    abatesR2: 0,
  };
}

export function garantirEstadoRegioes(save) {
  if (!save || typeof save !== 'object') return criarEstadoRegioesInicial();
  if (!save.regioes || typeof save.regioes !== 'object') {
    save.regioes = criarEstadoRegioesInicial();
  }
  const r = save.regioes;
  if (typeof r.atual !== 'string' || !REGIOES_POR_ID[r.atual]) r.atual = 'r1';
  if (!r.chefesDerrotados || typeof r.chefesDerrotados !== 'object') r.chefesDerrotados = {};
  if (!r.primeiraVitoria || typeof r.primeiraVitoria !== 'object') r.primeiraVitoria = {};
  if (!r.missoes || typeof r.missoes !== 'object') r.missoes = {};
  if (!r.progressoMissoes || typeof r.progressoMissoes !== 'object') r.progressoMissoes = {};
  if (!r.pistas || typeof r.pistas !== 'object') r.pistas = {};
  if (!Number.isFinite(Number(r.abatesR2)) || Number(r.abatesR2) < 0) r.abatesR2 = 0;
  return r;
}

export function regiaoDoMapa(mapaId) {
  if (typeof mapaId === 'string') {
    const m = /^R([2-9]|1[0-2])_/.exec(mapaId);
    if (m) return `r${m[1]}`;
  }
  return 'r1';
}

export function chefeRegiao1Derrotado(save) {
  return Boolean(
    save?.tremLiberado ||
    (save?.bossesDerrotados?.BOSS_E && save?.bossesDerrotados?.BOSS_D) ||
    save?.regioes?.chefesDerrotados?.r1
  );
}

export function regiaoDesbloqueada(save, regiaoId) {
  const reg = REGIOES_POR_ID[regiaoId];
  if (!reg) return false;
  if (reg.numero === 1) return true;
  if (reg.numero === 2) return chefeRegiao1Derrotado(save);
  const ant = reg.desbloqueio.regiaoAnterior;
  return Boolean(save?.regioes?.chefesDerrotados?.[ant]);
}

export function progressoDesbloqueioRegiao(save, regiaoId) {
  const reg = REGIOES_POR_ID[regiaoId];
  if (!reg) return { desbloqueada: false, feitos: 0, total: 1, texto: 'Região desconhecida.' };
  const desbloqueada = regiaoDesbloqueada(save, regiaoId);
  if (reg.numero === 1) return { desbloqueada: true, feitos: 1, total: 1, texto: 'Liberada' };
  if (reg.numero === 2) {
    const e = Boolean(save?.bossesDerrotados?.BOSS_E);
    const d = Boolean(save?.bossesDerrotados?.BOSS_D);
    const feitos = desbloqueada ? 2 : (e ? 1 : 0) + (d ? 1 : 0);
    return { desbloqueada, feitos, total: 2, texto: desbloqueada ? 'Liberada (chefes da R1 derrotados)' : `${feitos}/2 chefes da Região 1 (${reg.desbloqueio.texto})` };
  }
  return {
    desbloqueada,
    feitos: desbloqueada ? 1 : 0,
    total: 1,
    texto: desbloqueada ? `Liberada (${reg.jogavel ? 'jogável' : 'em breve'})` : reg.desbloqueio.texto,
  };
}

export function listarRegioes(save) {
  const st = save?.regioes || {};
  const atual = (typeof st.atual === 'string' && REGIOES_POR_ID[st.atual]) ? st.atual : regiaoDoMapa(save?.mapaAtual);
  return CATALOGO_REGIOES.map((reg) => {
    const progresso = progressoDesbloqueioRegiao(save, reg.id);
    const chefeDerrotado = reg.numero === 1 ? chefeRegiao1Derrotado(save) : Boolean(st.chefesDerrotados?.[reg.id]);
    return {
      ...reg,
      atual: atual === reg.id,
      desbloqueada: progresso.desbloqueada,
      progresso,
      chefeDerrotado,
      primeiraVitoriaPaga: Boolean(st.primeiraVitoria?.[reg.id]),
    };
  });
}

export function sortearEncontroRegiao(regiaoId, rng = Math.random) {
  const reg = REGIOES_POR_ID[regiaoId];
  if (!reg || !reg.encontros.length) return null;
  const totalPeso = reg.encontros.reduce((s, e) => s + (e.peso || 1), 0);
  let alvo = Math.max(0, Math.min(0.999999, rng())) * totalPeso;
  let escolhido = reg.encontros[0];
  for (const e of reg.encontros) {
    alvo -= (e.peso || 1);
    if (alvo <= 0) { escolhido = e; break; }
  }
  const span = Math.max(0, escolhido.nivelMax - escolhido.nivelMin);
  const nivel = escolhido.nivelMin + Math.floor(Math.max(0, Math.min(0.999999, rng())) * (span + 1));
  return {
    regiaoId: reg.id,
    especie: escolhido.especie,
    elemento: escolhido.elemento,
    classe: escolhido.classe,
    forma: escolhido.forma,
    nivel,
  };
}

function creditarRecompensaUnica(save, rec, regId = 'regiao') {
  if (!rec) return;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.gold = (Number(save.recompensas.gold) || 0) + (rec.gold || 0);
  save.recompensas.diamantes = (Number(save.recompensas.diamantes) || 0) + (rec.diamantes || 0);
  save.recompensas.xp = (Number(save.recompensas.xp) || 0) + (rec.xp || 0);
  if (save.idle?.jogador) {
    save.idle.jogador.xp = (Number(save.idle.jogador.xp) || 0) + (rec.xp || 0);
  }
  if (rec.ticketsPermanentes > 0 && save.idle) {
    save.idle.exp = save.idle.exp || { nivel: 1, xp: 0, tickets: 0 };
    save.idle.exp.tickets = (Number(save.idle.exp.tickets) || 0) + rec.ticketsPermanentes;
  }
  if (rec.essencias?.par) {
    for (const tam of ['menor', 'media', 'maior']) {
      if (rec.essencias[tam] > 0) adicionarEssencia(save, rec.essencias.par, tam, rec.essencias[tam]);
    }
  }
  if (rec.reliquia && _geradorReliquiaRegiao) {
    _geradorReliquiaRegiao(save, {
      elemento: rec.reliquia.elemento,
      raridade: rec.reliquia.raridade,
      fonte: `regiao:${regId}`,
    });
  }
}

// Registra derrota do chefe da região; paga a recompensa de primeira vitória estritamente 1 vez.
export function registrarVitoriaChefeRegiao(save, regiaoId) {
  const reg = REGIOES_POR_ID[regiaoId];
  if (!reg) return { ok: false, primeiraVez: false, recompensaPaga: null, proximaDesbloqueada: null };
  const st = garantirEstadoRegioes(save);
  st.chefesDerrotados[reg.id] = true;
  let primeiraVez = false;
  let recompensaPaga = null;
  if (!st.primeiraVitoria[reg.id]) {
    st.primeiraVitoria[reg.id] = true;
    primeiraVez = true;
    recompensaPaga = { ...reg.recompensaPrimeiraVitoria };
    creditarRecompensaUnica(save, recompensaPaga, reg.id);
  }
  const proxId = reg.numero < 12 ? `r${reg.numero + 1}` : null;
  const proximaDesbloqueada = proxId && regiaoDesbloqueada(save, proxId) ? proxId : null;
  if (reg.id === 'r2') concluirMissaoRegiao2(save, 'm_r2_rainha');
  return { ok: true, primeiraVez, recompensaPaga, proximaDesbloqueada };
}

export function chefeDosAltosDerrotado(save, id) {
  const chefe = CHEFES_R2[id];
  return Boolean(chefe && save?.regioes?.chefesDerrotados?.[chefe.final ? 'r2' : id]);
}

export function registrarVitoriaChefeDosAltos(save, id) {
  const chefe = CHEFES_R2[id];
  if (!chefe) return { ok: false, primeiraVez: false };
  if (chefe.final) return registrarVitoriaChefeRegiao(save, 'r2');
  const derrotados = garantirEstadoRegioes(save).chefesDerrotados;
  const primeiraVez = !derrotados[id];
  derrotados[id] = true;
  return { ok: true, primeiraVez };
}

export function concluirMissaoRegiao2(save, missaoId) {
  const m = MISSOES_REGIAO2.find((x) => x.id === missaoId);
  if (!m) return { ok: false, concluidaAgora: false, recompensa: null };
  const st = garantirEstadoRegioes(save);
  if (st.missoes[m.id] === 'concluida') {
    return { ok: true, concluidaAgora: false, recompensa: null };
  }
  st.missoes[m.id] = 'concluida';
  const recompensa = { ...m.recompensa };
  creditarRecompensaUnica(save, recompensa);
  return { ok: true, concluidaAgora: true, missao: m, recompensa };
}

export function registrarAbateRegiao2(save) {
  const st = garantirEstadoRegioes(save);
  st.abatesR2 = (Number(st.abatesR2) || 0) + 1;
  const meta = MISSOES_REGIAO2.find((x) => x.id === 'm_r2_apiarios')?.metaAbates || 3;
  if (st.abatesR2 >= meta) {
    return { abates: st.abatesR2, meta, ...concluirMissaoRegiao2(save, 'm_r2_apiarios') };
  }
  return { abates: st.abatesR2, meta, ok: true, concluidaAgora: false, recompensa: null };
}

export function progressoMissoesRegiao2(save) {
  const st = save?.regioes || {};
  return MISSOES_REGIAO2.map((m) => ({
    ...m,
    concluida: st.missoes?.[m.id] === 'concluida',
    abates: m.metaAbates ? Math.min(m.metaAbates, Number(st.abatesR2) || 0) : null,
  }));
}
