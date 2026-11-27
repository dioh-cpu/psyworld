// Missões paralelas por capítulo (36 ao todo) e Missões de Marco (conquistas com coleta única).
// Regras 100% puras (sem DOM).
import {
  CAPITULOS_CAMPANHA_MINI,
  campanhaMiniDe,
  estrelasDoCapitulo,
  adicionarEssencia,
  concederReliquiaCampanha,
  registrarGanchoMarcoCampanha,
} from './regiao1-campanha-mini-regras.js';
import { darPocao } from './regiao1-halloween-regras.js';
import { expDe } from './regiao1-exp-regras.js';
import { registrarGanchoMarcoEvolucao } from './regiao1-regras-sonho.js';

const PARALELAS_ESPECIFICAS = {
  1: [
    { titulo: 'Maré nas Redes', npc: 'Maren, a Pescadora', fala: 'As correntes trouxeram fragmentos da tempestade até as clareiras costeiras.', tituloPerfil: 'Vigia da Maré' },
    { titulo: 'Raízes do Vale', npc: 'Helena, a Zeladora', fala: 'As trilhas antigas da praça despertam quando você limpa os espíritos errantes.', tituloPerfil: 'Guardião da Praça' },
    { titulo: 'Último Apito', npc: 'Branca, a Maquinista', fala: 'A ferrovia do vale precisa de trilhos livres até o campanário.', tituloPerfil: 'Condutor do Vale' },
  ],
  2: [
    { titulo: 'O apicultor desaparecido', npc: 'Melissa, a Apicultora', fala: 'Um dos nossos apicultores sumiu perto dos terraços dourados. Siga os favos!', tituloPerfil: 'Amigo da Colmeia' },
    { titulo: 'Resina nas Cristas', npc: 'Melissa, a Apicultora', fala: 'As cristas estão pingando resina viva. Contenha os enxames antes da colheita.', tituloPerfil: 'Limpador de Resina' },
    { titulo: 'O sino de bronze', npc: 'Bram, o Sinaleiro', fala: 'O velho sino de bronze ecoa perto das ruínas reais; recupere o badalo.', tituloPerfil: 'Portador do Sino' },
  ],
};

const NPCS_POR_CAPITULO = {
  3: 'Orin, o Falcoeiro',
  4: 'Nara da Salina',
  5: 'Tecelã Lira',
  6: 'Oleiro Thales',
  7: 'Lapidador Kael',
  8: 'Irmã Sílvia',
  9: 'Ferreiro Torin',
  10: 'Vigia Freya',
  11: 'Sábio Zafir',
  12: 'Faroleiro Cassio',
};

const ENFEITES_POR_CAPITULO = [
  'Sino de Bronze do Vale',
  'Favo Dourado de Âmbar',
  'Pena da Alvorada',
  'Ânfora do Mangue',
  'Tear do Vento',
  'Vaso de Terracota',
  'Drusa de Ametista',
  'Incensário da Bruma',
  'Bigorna Miniatura',
  'Cristal da Aurora',
  'Ampulheta de Vitral',
  'Miniatura do Farol',
];

const TITULO_PARALELA = (capNome, ordem) => [`Batedor de ${capNome}`, `Sentinela de ${capNome}`, `Campeão de ${capNome}`][ordem - 1];

export const MISSOES_PARALELAS_CATALOGO = CAPITULOS_CAMPANHA_MINI.flatMap((cap) => {
  const cNum = cap.capitulo;
  const esp = PARALELAS_ESPECIFICAS[cNum];
  const npcPadrao = NPCS_POR_CAPITULO[cNum] || `Emissário de ${cap.nome}`;
  const reqFases = [3, 6, 9];
  return [1, 2, 3].map((ordem) => {
    const reqNum = reqFases[ordem - 1];
    const meta = esp?.[ordem - 1] || {
      titulo: `Crônica ${cNum}.${ordem} · ${cap.nome}`,
      npc: npcPadrao,
      fala: `As trilhas de ${cap.nome} pedem apoio depois da fase ${cNum}-${reqNum}.`,
      tituloPerfil: TITULO_PARALELA(cap.nome, ordem),
    };
    const fBase = cap.fases[reqNum - 1];
    const etapas = [
      { id: 'npc', tipo: 'dialogo', npc: meta.npc, texto: meta.fala },
      { id: 'b1', tipo: 'batalha', titulo: `${meta.titulo} — Batedores`, inimigos: fBase.inimigos.slice(0, 2) },
      { id: 'b2', tipo: 'batalha', titulo: `${meta.titulo} — Guarda`, inimigos: fBase.inimigos },
    ];
    if (ordem === 3) {
      etapas.push({ id: 'b3', tipo: 'batalha', titulo: `${meta.titulo} — Confronto Final`, inimigos: cap.fases[8].inimigos });
    }
    return {
      id: `par_${cNum}_${ordem}`,
      capitulo: cNum,
      ordem,
      faseRequisitoId: `${cNum}-${reqNum}`,
      titulo: meta.titulo,
      npc: meta.npc,
      elemento: cap.elemento,
      etapas,
      recompensa: {
        diamantes: 30,
        reliquiaRaridade: 'rara',
        reliquiaElemento: cap.elemento,
        tituloPerfil: meta.tituloPerfil,
      },
      enfeiteCapitulo: {
        id: `enf_cap_${cNum}`,
        nome: ENFEITES_POR_CAPITULO[cNum - 1],
      },
    };
  });
});

export const PARALELAS_POR_ID = Object.fromEntries(MISSOES_PARALELAS_CATALOGO.map((m) => [m.id, m]));

const CALABOUCOS_NOMES = [
  { id: 'forja-rubra', label: 'Calabouço de Fogo (Forja Rubra)' },
  { id: 'gruta-mares', label: 'Calabouço de Água (Gruta das Marés)' },
  { id: 'bosque-cativo', label: 'Calabouço de Planta (Bosque Cativo)' },
  { id: 'mina-profunda', label: 'Calabouço de Rocha (Mina Profunda)' },
  { id: 'templo-alvorecer', label: 'Calabouço de Luz (Templo do Alvorecer)' },
  { id: 'cripta-velada', label: 'Calabouço de Trevas (Cripta Velada)' },
];

export const CATALOGO_MARCOS = [
  // Campanha
  { id: 'marco_cm_1_5', categoria: 'Campanha', titulo: 'Conclua a fase 1-5 do Capítulo 1', chave: 'cm_1_5', meta: 1, premio: { diamantes: 30 } },
  { id: 'marco_cap_1', categoria: 'Campanha', titulo: 'Conclua o Capítulo 1', chave: 'capitulosConcluidos', meta: 1, premio: { diamantes: 100 } },
  { id: 'marco_cap_3', categoria: 'Campanha', titulo: 'Conclua o Capítulo 3', chave: 'capitulosConcluidos', meta: 3, premio: { diamantes: 200 } },
  { id: 'marco_cap_6', categoria: 'Campanha', titulo: 'Conclua o Capítulo 6', chave: 'capitulosConcluidos', meta: 6, premio: { diamantes: 300 } },
  { id: 'marco_cap_12', categoria: 'Campanha', titulo: 'Conclua o Capítulo 12', chave: 'capitulosConcluidos', meta: 12, premio: { diamantes: 500 } },
  { id: 'marco_est_30_1', categoria: 'Campanha', titulo: 'Tenha 30★ em 1 capítulo', chave: 'capitulos30Estrelas', meta: 1, premio: { ticketsPermanentes: 1 } },
  { id: 'marco_est_30_5', categoria: 'Campanha', titulo: 'Tenha 30★ em 5 capítulos', chave: 'capitulos30Estrelas', meta: 5, premio: { ticketsPermanentes: 3 } },
  { id: 'marco_est_30_12', categoria: 'Campanha', titulo: 'Tenha 30★ em 12 capítulos', chave: 'capitulos30Estrelas', meta: 12, premio: { ticketsPermanentes: 5 } },

  // Calabouços (10 / 50 / 200 vezes para cada um dos 6 + níveis 10 e 13)
  ...CALABOUCOS_NOMES.flatMap((c) => [10, 50, 200].map((meta, idx) => ({
    id: `marco_cal_${c.id}_${meta}`,
    categoria: 'Calabouços',
    titulo: `Conclua o ${c.label} ${meta} vezes`,
    chave: `calabouco:${c.id}`,
    meta,
    premio: {
      diamantes: [30, 60, 120][idx],
      poReforco: [10, 25, 50][idx],
      reliquia: { raridade: ['rara', 'epica', 'lendaria'][idx], calabouco: c.id },
    },
  }))),
  { id: 'marco_cal_nv10', categoria: 'Calabouços', titulo: 'Vença qualquer calabouço no nível 10', chave: 'calaboucoNivelMax', meta: 10, premio: { reliquia: { raridade: 'lendaria' } } },
  { id: 'marco_cal_nv13', categoria: 'Calabouços', titulo: 'Vença qualquer calabouço no nível 13', chave: 'calaboucoNivelMax', meta: 13, premio: { reliquia: { raridade: 'lendaria' }, diamantes: 50 } },

  // Torres
  { id: 'marco_torre_el_5', categoria: 'Torres', titulo: 'Conclua o andar 5 de uma Torre Elemental', chave: 'torreElementalMax', meta: 5, premio: { diamantes: 20, essencia: { par: 'ignea', tamanho: 'menor', qtd: 5 } } },
  { id: 'marco_torre_el_20', categoria: 'Torres', titulo: 'Conclua o andar 20 de uma Torre Elemental', chave: 'torreElementalMax', meta: 20, premio: { diamantes: 50, essencia: { par: 'mares', tamanho: 'media', qtd: 5 } } },
  { id: 'marco_torre_el_50', categoria: 'Torres', titulo: 'Conclua o andar 50 de uma Torre Elemental', chave: 'torreElementalMax', meta: 50, premio: { diamantes: 100, essencia: { par: 'solar', tamanho: 'maior', qtd: 5 } } },
  { id: 'marco_torre_unica_10', categoria: 'Torres', titulo: 'Conclua o andar 10 da Torre Única', chave: 'torreUnicaMax', meta: 10, premio: { fragmentoEscolha: 1 } },

  // Oníricos
  { id: 'marco_3_nv_20', categoria: 'Oníricos', titulo: 'Eleve 3 Oníricos ao nível 20', chave: 'oniricosNv20', meta: 3, premio: { pocao_xp_p: 2, diamantes: 40 } },
  { id: 'marco_3_nv_50', categoria: 'Oníricos', titulo: 'Eleve 3 Oníricos ao nível 50', chave: 'oniricosNv50', meta: 3, premio: { pocao_xp_m: 2, diamantes: 80 } },
  { id: 'marco_3_nv_100', categoria: 'Oníricos', titulo: 'Eleve 3 Oníricos ao nível 100', chave: 'oniricosNv100', meta: 3, premio: { pocao_xp_g: 2, diamantes: 150, ticketsSemanais: 1 } },
  { id: 'marco_evo_1', categoria: 'Oníricos', titulo: 'Evolua 1 Onírico', chave: 'evolucoes', meta: 1, premio: { diamantes: 25, essencia: { par: 'verde', tamanho: 'menor', qtd: 5 } } },
  { id: 'marco_evo_5', categoria: 'Oníricos', titulo: 'Evolua 5 Oníricos', chave: 'evolucoes', meta: 5, premio: { diamantes: 60, essencia: { par: 'mineral', tamanho: 'media', qtd: 5 } } },
  { id: 'marco_evo_20', categoria: 'Oníricos', titulo: 'Evolua 20 Oníricos', chave: 'evolucoes', meta: 20, premio: { diamantes: 120, essencia: { par: 'sombria', tamanho: 'maior', qtd: 3 } } },
  { id: 'marco_6_estrelas', categoria: 'Oníricos', titulo: 'Tenha um Onírico 6★', chave: 'estrelasMax', meta: 6, premio: { ticketsSemanais: 1 } },

  // Relíquias e Armas Únicas
  { id: 'marco_rel_conj_4', categoria: 'Relíquias', titulo: 'Equipe um conjunto completo de 4 peças', chave: 'conjunto4Pecas', meta: 1, premio: { diamantes: 50 } },
  { id: 'marco_rel_mais_15', categoria: 'Relíquias', titulo: 'Reforce uma relíquia até +15', chave: 'reforcoMax', meta: 15, premio: { poReforco: 20 } },
  { id: 'marco_arma_unica_1', categoria: 'Armas Únicas', titulo: 'Crie a primeira arma única', chave: 'armasUnicasCriadas', meta: 1, premio: { diamantes: 100 } },

  // Coleção e Social
  { id: 'marco_col_10', categoria: 'Coleção', titulo: 'Tenha 10 espécies na coleção', chave: 'especiesColecao', meta: 10, premio: { ticketsPermanentes: 1 } },
  { id: 'marco_col_30', categoria: 'Coleção', titulo: 'Tenha 30 espécies na coleção', chave: 'especiesColecao', meta: 30, premio: { ticketsPermanentes: 3 } },
  { id: 'marco_col_60', categoria: 'Coleção', titulo: 'Tenha 60 espécies na coleção', chave: 'especiesColecao', meta: 60, premio: { ticketsPermanentes: 5 } },
  { id: 'marco_social_guilda', categoria: 'Social', titulo: 'Entre numa guilda / aceite o primeiro contrato', chave: 'socialGuilda', meta: 1, premio: { ouro: 300, diamantes: 20 } },
  { id: 'marco_social_doacoes', categoria: 'Social', titulo: 'Contribua / doe 10 vezes na Guilda', chave: 'socialDoacoes', meta: 10, premio: { ouro: 600, diamantes: 40 } },
];

export const MARCOS_POR_ID = Object.fromEntries(CATALOGO_MARCOS.map((m) => [m.id, m]));

export function missoesDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.missoes || typeof idle.missoes !== 'object') idle.missoes = {};
  const m = idle.missoes;
  m.paralelasAtivas ||= {};
  m.paralelasConcluidas ||= {};
  m.enfeitesRefugio ||= {};
  m.titulos ||= {};
  m.progresso ||= {};
  m.marcosColetados ||= {};
  return m;
}

function armasUnicasBasico(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  if (!idle.armasUnicas || typeof idle.armasUnicas !== 'object') idle.armasUnicas = {};
  const a = idle.armasUnicas;
  a.fragmentos ||= {};
  a.possuidas ||= {};
  a.equipadas ||= {};
  a.poUnico = Math.max(0, Math.floor(Number(a.poUnico) || 0));
  a.escolhasPendentes = Math.max(0, Math.floor(Number(a.escolhasPendentes) || 0));
  a.liberadasPorNivel100 ||= {};
  return a;
}

// ---- Missões paralelas ----
export function paralelaDesbloqueada(save, missaoId) {
  const def = PARALELAS_POR_ID[missaoId];
  if (!def) return false;
  return Boolean(campanhaMiniDe(save).fases[def.faseRequisitoId]?.vencida);
}

export function listarParalelasCapitulo(save, capitulo) {
  const m = missoesDe(save);
  return MISSOES_PARALELAS_CATALOGO.filter((p) => p.capitulo === capitulo).map((p) => {
    const concluida = Boolean(m.paralelasConcluidas[p.id]);
    const desbloqueada = paralelaDesbloqueada(save, p.id);
    const passo = Number(m.paralelasAtivas[p.id]) || 0;
    const ativa = !concluida && m.paralelasAtivas[p.id] !== undefined;
    const estado = concluida ? 'concluida' : ativa ? 'ativa' : desbloqueada ? 'disponivel' : 'bloqueada';
    return {
      ...p,
      estado,
      desbloqueada,
      concluida,
      etapaIdx: passo,
      etapaAtual: concluida ? null : (p.etapas[passo] || null),
      enfeiteDesbloqueado: Boolean(m.enfeitesRefugio[p.enfeiteCapitulo.id]),
    };
  });
}

export function iniciarParalela(save, missaoId) {
  const def = PARALELAS_POR_ID[missaoId];
  if (!def) return { ok: false, motivo: 'Missão paralela não encontrada.' };
  if (!paralelaDesbloqueada(save, missaoId)) return { ok: false, motivo: `Conclua a fase ${def.faseRequisitoId} antes.` };
  const m = missoesDe(save);
  if (m.paralelasConcluidas[missaoId]) return { ok: false, jaConcluida: true, motivo: 'Missão já concluída.' };
  if (m.paralelasAtivas[missaoId] == null) m.paralelasAtivas[missaoId] = 0;
  const idx = m.paralelasAtivas[missaoId];
  return { ok: true, missao: def, etapaIdx: idx, etapaAtual: def.etapas[idx] || null };
}

export function avancarEtapaParalela(save, missaoId, resultadoBatalha = null) {
  const def = PARALELAS_POR_ID[missaoId];
  if (!def) return { ok: false, motivo: 'Missão paralela não encontrada.' };
  const m = missoesDe(save);
  if (m.paralelasConcluidas[missaoId]) return { ok: false, jaConcluida: true, motivo: 'Missão já paga.' };
  if (!paralelaDesbloqueada(save, missaoId)) return { ok: false, motivo: `Conclua a fase ${def.faseRequisitoId} antes.` };
  if (m.paralelasAtivas[missaoId] == null) m.paralelasAtivas[missaoId] = 0;

  const idx = m.paralelasAtivas[missaoId];
  const etapa = def.etapas[idx];
  if (!etapa) return { ok: false, motivo: 'Etapa inválida.' };
  if (etapa.tipo === 'batalha') {
    const venceu = Boolean(resultadoBatalha?.venceu || resultadoBatalha?.fim === 'vitoria');
    if (!venceu) return { ok: false, motivo: 'Vença a batalha para avançar.' };
  }

  const prox = idx + 1;
  if (prox < def.etapas.length) {
    m.paralelasAtivas[missaoId] = prox;
    return { ok: true, concluida: false, etapaIdx: prox, etapaAtual: def.etapas[prox] };
  }

  // Última etapa concluída: paga prêmio único + título + checa enfeite do capítulo
  delete m.paralelasAtivas[missaoId];
  m.paralelasConcluidas[missaoId] = true;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.diamantes += def.recompensa.diamantes;
  const relRes = concederReliquiaCampanha(save, {
    elemento: def.recompensa.reliquiaElemento,
    raridade: def.recompensa.reliquiaRaridade,
    fonte: `par:${def.id}`,
  });
  m.titulos[def.recompensa.tituloPerfil] = true;

  const paralelasCap = MISSOES_PARALELAS_CATALOGO.filter((x) => x.capitulo === def.capitulo);
  let enfeiteLiberado = null;
  if (paralelasCap.every((x) => m.paralelasConcluidas[x.id]) && !m.enfeitesRefugio[def.enfeiteCapitulo.id]) {
    m.enfeitesRefugio[def.enfeiteCapitulo.id] = true;
    enfeiteLiberado = def.enfeiteCapitulo;
  }

  return {
    ok: true,
    concluida: true,
    premios: {
      diamantes: def.recompensa.diamantes,
      reliquia: relRes.reliquia || null,
      tituloPerfil: def.recompensa.tituloPerfil,
      enfeiteLiberado,
    },
  };
}

// ---- Missões de Marco (conquistas) ----
export function sincronizarMarcosDoSave(save) {
  const m = missoesDe(save);
  const p = m.progresso;
  const cm = campanhaMiniDe(save);
  if (cm.fases['1-5']?.vencida) p.cm_1_5 = Math.max(p.cm_1_5 || 0, 1);

  const concl = Object.keys(cm.capitulosConcluidos || {}).filter((k) => cm.capitulosConcluidos[k]).length;
  p.capitulosConcluidos = Math.max(p.capitulosConcluidos || 0, concl);

  let caps30 = 0;
  for (let c = 1; c <= 12; c++) if (estrelasDoCapitulo(save, c) >= 30) caps30 += 1;
  p.capitulos30Estrelas = Math.max(p.capitulos30Estrelas || 0, caps30);

  const eq = Array.isArray(save?.idle?.equipe) ? save.idle.equipe : [];
  let n20 = 0, n50 = 0, n100 = 0, maxEst = 0;
  for (const u of eq) {
    const nv = Number(u?.nivel) || 1;
    if (nv >= 20) n20 += 1;
    if (nv >= 50) n50 += 1;
    if (nv >= 100) {
      n100 += 1;
      if (u?.especie) armasUnicasBasico(save).liberadasPorNivel100[u.especie] = true;
    }
    maxEst = Math.max(maxEst, Number(u?.estrelas) || 1);
  }
  p.oniricosNv20 = Math.max(p.oniricosNv20 || 0, n20);
  p.oniricosNv50 = Math.max(p.oniricosNv50 || 0, n50);
  p.oniricosNv100 = Math.max(p.oniricosNv100 || 0, n100);
  p.estrelasMax = Math.max(p.estrelasMax || 0, maxEst);

  const especiesCodex = Object.keys(save?.idle?.codex?.especies || {}).length;
  const especiesEquipe = new Set(eq.map((u) => u?.especie).filter(Boolean)).size;
  p.especiesColecao = Math.max(p.especiesColecao || 0, especiesCodex, especiesEquipe);
  return p;
}

export function registrarMarco(save, tipo, dados = {}) {
  const m = missoesDe(save);
  const p = m.progresso;
  const qtd = Math.max(1, Math.floor(Number(dados.qtd) || 1));

  switch (tipo) {
    case 'campanha_fase': {
      if (dados.faseId === '1-5') p.cm_1_5 = 1;
      break;
    }
    case 'calabouco': {
      const calId = dados.calabouco || dados.id;
      if (calId) p[`calabouco:${calId}`] = (p[`calabouco:${calId}`] || 0) + qtd;
      const nv = Math.floor(Number(dados.nivel) || 1);
      p.calaboucoNivelMax = Math.max(p.calaboucoNivelMax || 0, nv);
      break;
    }
    case 'torre_elemental': {
      const andar = Math.floor(Number(dados.andar) || 0);
      p.torreElementalMax = Math.max(p.torreElementalMax || 0, andar);
      break;
    }
    case 'torre_unica': {
      const andar = Math.floor(Number(dados.andar) || 0);
      p.torreUnicaMax = Math.max(p.torreUnicaMax || 0, andar);
      break;
    }
    case 'nivel_onirico': {
      const nv = Math.floor(Number(dados.nivel) || 1);
      if (nv >= 100 && dados.especie) armasUnicasBasico(save).liberadasPorNivel100[dados.especie] = true;
      break;
    }
    case 'evolucao': {
      p.evolucoes = (p.evolucoes || 0) + qtd;
      break;
    }
    case 'estrelas': {
      p.estrelasMax = Math.max(p.estrelasMax || 0, Math.floor(Number(dados.estrelas) || 1));
      break;
    }
    case 'reliquia_conjunto4': {
      p.conjunto4Pecas = Math.max(p.conjunto4Pecas || 0, 1);
      break;
    }
    case 'reliquia_reforco': {
      p.reforcoMax = Math.max(p.reforcoMax || 0, Math.floor(Number(dados.nivel || dados.reforco) || 0));
      break;
    }
    case 'arma_unica': {
      p.armasUnicasCriadas = (p.armasUnicasCriadas || 0) + qtd;
      break;
    }
    case 'colecao': {
      if (dados.especies != null) p.especiesColecao = Math.max(p.especiesColecao || 0, Math.floor(Number(dados.especies) || 0));
      break;
    }
    case 'social_guilda': {
      p.socialGuilda = Math.max(p.socialGuilda || 0, 1);
      break;
    }
    case 'social_doacao': {
      p.socialDoacoes = (p.socialDoacoes || 0) + qtd;
      break;
    }
    default:
      break;
  }

  return sincronizarMarcosDoSave(save);
}

export function listarMarcos(save) {
  const m = missoesDe(save);
  const p = sincronizarMarcosDoSave(save);
  return CATALOGO_MARCOS.map((def) => {
    const atual = Math.min(def.meta, Number(p[def.chave]) || 0);
    const coletado = Boolean(m.marcosColetados[def.id]);
    const pronto = !coletado && (Number(p[def.chave]) || 0) >= def.meta;
    return { ...def, atual, coletado, pronto };
  });
}

export function listarMarcosPorCategoria(save) {
  const grupos = {};
  for (const item of listarMarcos(save)) {
    (grupos[item.categoria] ||= []).push(item);
  }
  return grupos;
}

export function temPremioMissaoPendente(save) {
  return listarMarcos(save).some((x) => x.pronto);
}

export function coletarMarco(save, marcoId, rng = Math.random) {
  const def = MARCOS_POR_ID[marcoId];
  if (!def) return { ok: false, motivo: 'Marco não encontrado.' };
  const m = missoesDe(save);
  if (m.marcosColetados[marcoId]) return { ok: false, jaColetado: true, motivo: 'Prêmio já coletado.' };
  const p = sincronizarMarcosDoSave(save);
  const atual = Number(p[def.chave]) || 0;
  if (atual < def.meta) return { ok: false, motivo: `Progresso insuficiente (${atual}/${def.meta}).` };

  m.marcosColetados[marcoId] = true;
  const pr = def.premio;
  const entregue = {};
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };

  if (pr.ouro) { save.recompensas.gold += pr.ouro; entregue.ouro = pr.ouro; }
  if (pr.diamantes) { save.recompensas.diamantes += pr.diamantes; entregue.diamantes = pr.diamantes; }
  if (pr.ticketsPermanentes) { const e = expDe(save); e.tickets = (e.tickets || 0) + pr.ticketsPermanentes; entregue.ticketsPermanentes = pr.ticketsPermanentes; }
  if (pr.ticketsSemanais) { const e = expDe(save); e.ticketsSemanais = (e.ticketsSemanais || 0) + pr.ticketsSemanais; entregue.ticketsSemanais = pr.ticketsSemanais; }
  for (const poc of ['pocao_xp_p', 'pocao_xp_m', 'pocao_xp_g']) {
    if (pr[poc]) { darPocao(save, poc, pr[poc]); entregue[poc] = pr[poc]; }
  }
  if (pr.essencia) {
    adicionarEssencia(save, pr.essencia.par, pr.essencia.tamanho, pr.essencia.qtd);
    entregue.essencia = { ...pr.essencia };
  }
  if (pr.poReforco) {
    const rel = save.idle.reliquias || (save.idle.reliquias = { bolsa: [], equipadas: {}, predefinicoes: {}, capacidade: 200, poReforco: 0, seq: 0 });
    rel.poReforco = (rel.poReforco || 0) + pr.poReforco;
    entregue.poReforco = pr.poReforco;
  }
  if (pr.reliquia) {
    const res = concederReliquiaCampanha(save, { elemento: pr.reliquia.elemento || 'fogo', raridade: pr.reliquia.raridade || 'lendaria', fonte: `marco:${marcoId}`, rng });
    entregue.reliquia = res.reliquia || null;
  }
  if (pr.fragmentoEscolha) {
    armasUnicasBasico(save).escolhasPendentes += pr.fragmentoEscolha;
    entregue.fragmentoEscolha = pr.fragmentoEscolha;
  }
  return { ok: true, marco: def, premio: entregue };
}

// Registra os ganchos automáticos na Campanha Mini e na Evolução sem criar dependência circular.
registrarGanchoMarcoCampanha(registrarMarco);
registrarGanchoMarcoEvolucao(registrarMarco);
