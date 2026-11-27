// Integração pura (sem DOM/Three.js) dos Sistemas 01–10 no mapa e na campanha da Região 1.
// Fornece os elementos físicos do mapa (Vilas 01, NPCs 04, Refúgios 05, Masmorras 08, Rotas 10 e demais),
// o estado de serviços das vilas, a ligação das pistas do Sistema 09 aos NPCs e a disponibilidade das rotas comerciais.
import { servicosAtivos, dificuldadeMasmorra, NPCS as NPCS_MUNDO, faseDo } from '../mundo/sistemas-01.js';

export const VILAS_MAPA = [
  { id: 'sul', mapa: 'C0', nomePadrao: 'Vila do Sul' },
  { id: 'norte', mapa: 'C2', nomePadrao: 'Vila do Norte' },
  { id: 'porto', mapa: 'E1', nomePadrao: 'Porto Cinza' },
];

export const MASMORRAS_MAPA = [
  { id: 'catacumba', mapa: 'E4', nome: 'Catacumba Úmida', tesouro: { cristal: 2 }, inimigos: ['Cervomusgo', 'Fanalino'] },
  { id: 'mina', mapa: 'CC2', nome: 'Mina Abandonada', tesouro: { pedra: 4 }, inimigos: ['Xistolim', 'Calquélon'] },
  { id: 'templo', mapa: 'PC8', nome: 'Templo Caído', tesouro: { diamantes: 3 }, inimigos: ['Vesprata', 'Tatuveludo'] },
];

export const ROTAS_MAPA = [
  { id: 'c0', mapa: 'C0', vaga: 'caravana', nome: 'Caravana da Praia (C0)' },
  { id: 'c1', mapa: 'C1', vaga: 'mercado', nome: 'Mercado Regional (C1)' },
  { id: 'c2', mapa: 'C2', vaga: 'caravana', nome: 'Caravana do Norte (C2)' },
  { id: 'e1', mapa: 'E1', vaga: 'caravana', nome: 'Caravana do Porto (E1)' },
  { id: 'r2', mapa: 'R2_C0', vaga: 'mercado', nome: 'Mercado de Altos do Âmbar (R2)' },
];

export const CIDADES_ROTA_10 = [
  { mapa: 'C0', nome: 'Praia Inicial (Vila do Sul)', vilaId: 'sul' },
  { mapa: 'C1', nome: 'Cidade Central (Mercado)', vilaId: null },
  { mapa: 'C2', nome: 'Estação Norte (Vila do Norte)', vilaId: 'norte' },
  { mapa: 'E1', nome: 'Porto Cinza (Orla Oeste)', vilaId: 'porto' },
  { mapa: 'R2_C0', nome: 'Altos do Âmbar (Região 2)', vilaId: 'norte', regiao: 'r2' },
];

export const NPCS_PISTA_09 = [
  { etapa: 0, npcs: ['npc_pescadora'], dica: 'Maren viu pegadas seguindo da praia rumo ao rio.', arte: 'pista-1' },
  { etapa: 1, npcs: ['npc_zeladora_c1', 'npc_jardineira_c1'], dica: 'Na praça de C1 comentam sobre uma luz vista perto do canteiro.', arte: 'pista-2' },
  { etapa: 2, npcs: ['npc_mensageiro_c1', 'npc_maquinista', 'npc_r2_melissa'], dica: 'Há rumores de uma carta rasgada vista entre a estação e as caravanas de Altos do Âmbar.', arte: 'pista-3' },
];

const NPCS_MUNDO_MAPA = { ana: 'C1', teo: 'C0', lia: 'C2' };
const lim = (n, max = 3) => Math.max(0, Math.min(max, Math.floor(Number(n) || 0)));
const por = (n, f) => Array.from({ length: lim(n) }, (_, i) => f(i));

export function statusVilaMapa(mundo, vilaId) {
  const v = mundo?.['01']?.[vilaId];
  if (!v) return null;
  const abertos = servicosAtivos(mundo['01'], vilaId);
  const vaga = v.corrupcao >= 70 ? 'vila-corrompida' : v.prosperidade <= 10 ? 'vila-ruinas' : v.corrupcao > 50 ? 'vila-corrompida' : 'vila-saudavel';
  return { id: vilaId, nome: v.nome, prosperidade: v.prosperidade, corrupcao: v.corrupcao, servicosAbertos: abertos, vaga };
}

export function investigacaoNpcInfo(mundo, npcId) {
  const caso = mundo?.['09']?.caso;
  if (!caso || caso.resolvido) return null;
  const etapa = Math.min(NPCS_PISTA_09.length - 1, Math.max(0, Number(caso.encontradas) || 0));
  const atual = NPCS_PISTA_09[etapa];
  const todosNpcs = new Set(NPCS_PISTA_09.flatMap((x) => x.npcs));
  if (!todosNpcs.has(npcId)) return null;
  return {
    etapa,
    encontradas: caso.encontradas || 0,
    total: NPCS_PISTA_09.length,
    correspondente: atual.npcs.includes(npcId),
    dica: atual.dica,
    arte: atual.arte,
  };
}

export function rotasDisponiveisDaCidade(mundo, cidadeAtual) {
  const tempestade = mundo?.['07']?.clima === 'tempestade';
  return CIDADES_ROTA_10
    .filter((c) => c.mapa !== cidadeAtual)
    .map((c) => {
      const vilaAberta = c.vilaId && mundo?.['01']?.[c.vilaId] ? servicosAtivos(mundo['01'], c.vilaId) : true;
      return {
        ...c,
        aberta: !tempestade && vilaAberta,
        motivo: tempestade ? 'Fechada pela tempestade' : (!vilaAberta ? 'Serviços da vila fechados' : 'Rota aberta'),
      };
    });
}

export function elementosDoMundo(m, meta = null) {
  const L = [];
  const add = (sis, chave, vaga, mapa, rotulo, dados = null) => L.push({ sis, chave: `${sis}-${chave}`, vaga, mapa, rotulo, dados });
  const dia = meta?.dia || 1;
  const fase = faseDo(dia);
  const tempestade = m?.['07']?.clima === 'tempestade';

  // 01 — Vilas vivas com serviços que abrem e fecham (Região 1 e posto de Altos do Âmbar na Região 2)
  for (const cfg of VILAS_MAPA) {
    const st = statusVilaMapa(m, cfg.id);
    if (!st) continue;
    const status = st.servicosAbertos ? 'Serviços abertos' : 'Serviços fechados';
    add('01', cfg.id, st.vaga, cfg.mapa, `${st.nome || cfg.nomePadrao} · ${status}`, { tipo: 'vila', vilaId: cfg.id, aberto: st.servicosAbertos });
  }
  const stR2 = statusVilaMapa(m, 'norte');
  if (stR2) {
    const status = stR2.servicosAbertos ? 'Serviços abertos' : 'Serviços fechados';
    add('01', 'r2_posto', stR2.vaga, 'R2_C0', `Posto de Altos do Âmbar · ${status}`, { tipo: 'vila', vilaId: 'norte', aberto: stR2.servicosAbertos });
  }

  // 04 — NPCs com memória e rotina
  if (m?.['04']) {
    for (const n of NPCS_MUNDO) {
      const mapa = NPCS_MUNDO_MAPA[n.id];
      if (!mapa) continue;
      const disp = n.disponivel.includes(fase);
      add('04', n.id, n.id, mapa, `${n.nome} (${disp ? `disponível · ${fase}` : `volta ${n.disponivel.join('/')}`})`, { tipo: 'npc_mundo', npcId: n.id, disponivel: disp, fase });
    }
  }

  // 05 — Refúgios e fortalezas (Região 1 + posto avançado em Altos do Âmbar R2_C0)
  const refs = m?.['05']?.refugios || [];
  if (refs.length === 0) {
    add('05', 'terreno', 'protecao', 'C1', 'Terreno do Refúgio · erguer abrigo', { tipo: 'terreno_refugio' });
    add('05', 'r2_terreno', 'protecao', 'R2_C0', 'Abrigo de Altos do Âmbar · erguer refúgio', { tipo: 'terreno_refugio' });
  } else {
    refs.slice(0, 3).forEach((r, i) => {
      const vaga = i >= 2 ? 'fortaleza' : 'refugio';
      const mapa = ['C1', 'C0', 'C2'][i];
      add('05', `r${i}`, vaga, mapa, `${r.nome || `Refúgio ${i + 1}`} · ${r.abrigados || 0} abrigado(s)`, { tipo: 'refugio', indice: i, vaga });
    });
    add('05', 'r2_posto', 'refugio', 'R2_C0', 'Refúgio de Altos do Âmbar · descanso e cuidado', { tipo: 'refugio', indice: 0, vaga: 'refugio' });
  }

  // 08 — Masmorras dinâmicas com entrada no mapa (Região 1 + Galeria de Cera na Região 2)
  for (const cfg of MASMORRAS_MAPA) {
    const v = m?.['08']?.[cfg.id];
    if (!v) continue;
    const dif = dificuldadeMasmorra(m['08'], cfg.id);
    add('08', cfg.id, cfg.id, cfg.mapa, `${cfg.nome} · risco ${dif} (${Math.round(v.infestacao)})`, { tipo: 'masmorra', masmorraId: cfg.id, dificuldade: dif });
  }
  if (m?.['08']?.templo) {
    const difR2 = dificuldadeMasmorra(m['08'], 'templo');
    add('08', 'r2_colmeia', 'templo', 'R2_CRI', `Fenda de Cera (Masmorra) · risco ${difR2}`, { tipo: 'masmorra', masmorraId: 'templo', dificuldade: difR2 });
  }

  // 10 — Economia regional e rotas entre as cidades (Região 1 ↔ Região 2)
  if (m?.['10']) {
    for (const r of ROTAS_MAPA) {
      const rot = tempestade ? `${r.nome} · ⛈️ rotas fechadas` : `${r.nome} · madeira ${m['10'].precos?.madeira ?? 10}g`;
      add('10', r.id, r.vaga, r.mapa, rot, { tipo: 'rota', cidade: r.mapa, vaga: r.vaga, fechada: tempestade });
    }
  }

  if (m?.['13']?.entradas?.rio_subterraneo) add('13', 'rio', 'entrada', 'E6', 'Entrada subterrânea (rio)');
  if (m?.['13']?.entradas?.templo_fundo) add('13', 'templo', 'entrada', 'CC4', 'Entrada subterrânea (templo)');
  if (m?.['15']?.ativa) add('15', 'praga', 'praga', 'C1', `Praga · nível ${Math.round(m['15'].nivel || 0)}`);
  if (m?.['17']) {
    add('17', 'norte', 'guardiao-norte', 'C2', `Guardião do Norte · ${Math.round(m['17']?.forca?.norte ?? 0)}`);
    add('17', 'sul', 'guardiao-sul', 'C3', `Guardião do Sul · ${Math.round(m['17']?.forca?.sul ?? 0)}`);
  }
  if (m?.['18']?.barco) add('18', 'barco', 'barco', 'C0', 'Seu barco');
  if (m?.['18']?.mare === 'baixa') add('18', 'ilha', 'ilha', 'E1', 'Ilha (maré baixa)');
  if (m?.['19']?.estado === 'restaurada') add('19', 'rel', 'reliquia-restaurada', 'C1', 'Relíquia restaurada');
  else if (m?.['19']?.estado === 'corrompida') add('19', 'rel', 'reliquia-corrompida', 'C1', 'Relíquia corrompida');
  else if (m?.['19']) add('19', 'rel', 'reliquia-oculta', 'CC1', `Relíquia oculta · fragmentos ${m['19']?.fragmentos ?? 0}/3`);
  if (m?.['23']?.portal) add('23', 'portal', `portal-${m['23'].portal}`, 'D1', `Portal da ${m['23'].portal}`);
  if (m?.['25']?.guerra) add('25', 'guerra', 'estandarte', 'C1', 'Guerra entre facções');
  (m?.['29']?.arvores || []).slice(0, 3).forEach((a, i) => add('29', `a${i}`, (a.stage || 0) >= 2 ? 'arvore-crescida' : 'muda', 'C0', 'Árvore da memória'));
  por(m?.['29']?.monumentos, (i) => add('29', `m${i}`, 'monumento', 'C0', 'Monumento'));
  if (m?.['30'] && (m['30'].diasAte ?? 9) <= 1) add('30', 'gigante', 'gigante-norte', 'C2', `Criatura gigante (${m['30'].regiao})`);
  por(m?.['35']?.guardioes, (i) => add('35', `g${i}`, 'automato', 'C1', 'Autômato guardião'));
  (m?.['36']?.tipos || []).slice(0, 3).forEach((t) => add('36', t, t, 'C0', `Montaria ${t}`));
  if (m?.['46']?.observatorio) add('46', 'obs', 'observatorio', 'C2', 'Observatório');
  por(m?.['47']?.santuarios, (i) => add('47', `s${i}`, 'santuario', 'C1', 'Santuário de memória'));
  por(m?.['48']?.canais, (i) => add('48', `c${i}`, 'canal', 'C0', 'Canal de irrigação'));
  por(m?.['48']?.pontes, (i) => add('48', `p${i}`, 'ponte', 'C0', 'Ponte reforçada'));
  return L;
}
