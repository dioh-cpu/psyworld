// Catálogo completo de áreas interligadas, encontros, chefes e recompensas das Regiões 3–12.
// Regras 100% puras (sem DOM) para o dioh293 montar os mapas e ligar os chefes (specChefeReino).
import { REGIOES, CLASSE_DA_ESPECIE } from './regiao1-progressao.js';
import { LINHAGENS_REINOS, CHEFES_REINOS, specChefeReino } from './regiao1-kits-reinos.js';
import { FORMAS_LINHAGENS_REINOS } from '../formas-reinos.js';
import { ELEMENTO_DA_ESPECIE } from '../species.js';
import { adicionarEssencia, parEssenciaDoElemento } from './regiao1-regras-sonho.js';

const pad2 = (n) => String(n).padStart(2, '0');
const PASTA_REINOS = 'assets/confusion/interface/estrategia/reinos';

const TEMAS_REGIOES_3_12 = {
  3: {
    nome: 'Crista da Alvorada',
    biomas: ['Encosta dos Ninhos', 'Zigue-zague Rubro', 'Cume do Alvorecer'],
    areasNomes: ['Trilha do Galinheiro', 'Mirante das Penas', 'Desfiladeiro da Crista', 'Escarpa Dourada', 'Ninho do Rochedo', 'Salão do Basilisco'],
    recurso: 'Ovos → provisões e penas',
    npc: 'Orin, o Falcoeiro',
  },
  4: {
    nome: 'Manguezal do Sal',
    biomas: ['Palafitas da Maré', 'Salinas Brancas', 'Estuário Velho'],
    areasNomes: ['Passarela Salobra', 'Tanques de Salmoura', 'Raízes Alagadas', 'Banco de Maré', 'Porto das Conservas', 'Fosso do Salífero'],
    recurso: 'Sal → conservas',
    npc: 'Nara da Salina',
  },
  5: {
    nome: 'Serras do Linho',
    biomas: ['Campos de Linho', 'Pátios do Tear', 'Passo do Vendaval'],
    areasNomes: ['Faixa do Linhal', 'Moenda de Fibras', 'Pátio das Lançadeiras', 'Crivo do Vento', 'Corredor dos Fios', 'Torre do Vendaval'],
    recurso: 'Linho → tecido',
    npc: 'Tecelã Lira',
  },
  6: {
    nome: 'Degraus de Terracota',
    biomas: ['Ruas de Tijolo', 'Praças dos Fornos', 'Câmara do Barro'],
    areasNomes: ['Escadaria de Barro', 'Pátio dos Oleiros', 'Fornalha Rebaixada', 'Terreiro da Cerâmica', 'Galerias Cocidas', 'Forno Oco Real'],
    recurso: 'Barro → cerâmica',
    npc: 'Oleiro Thales',
  },
  7: {
    nome: 'Bacia da Ametista',
    biomas: ['Terraços Secos', 'Galerias de Cristal', 'Núcleo Prismático'],
    areasNomes: ['Veio Violeta', 'Terraço Lapidado', 'Arco dos Prismas', 'Salão das Drusas', 'Sonda Mineral', 'Coração de Ametista'],
    recurso: 'Ametista → prismas',
    npc: 'Lapidador Kael',
  },
  8: {
    nome: 'Jardins da Bruma',
    biomas: ['Canteiros Radiais', 'Estufas Abertas', 'Claustro do Névoa'],
    areasNomes: ['Canteiro Mentolado', 'Alameda dos Tônicos', 'Estufa Orvalhada', 'Bosque das Folhas', 'Fonte da Infusão', 'Nave do Abade'],
    recurso: 'Ervas → tônicos',
    npc: 'Irmã Sílvia',
  },
  9: {
    nome: 'Caldeira do Ferro',
    biomas: ['Bairros de Basalto', 'Anéis da Forja', 'Fosso da Escória'],
    areasNomes: ['Anel Exterior', 'Fundição do Basalto', 'Corredor dos Malhos', 'Canal de Magma', 'Bigorna Central', 'Trono da Escória'],
    recurso: 'Ferro → ligas',
    npc: 'Ferreiro Torin',
  },
  10: {
    nome: 'Geada Alta',
    biomas: ['Pátios Nevados', 'Casas Túnel', 'Mirante Boreal'],
    areasNomes: ['Pátio da Neve Viva', 'Túnel de Gelo', 'Fenda Boreal', 'Mar de Cristais', 'Cume Fraturado', 'Claustro da Aurora'],
    recurso: 'Gelo → conservantes',
    npc: 'Vigia Freya',
  },
  11: {
    nome: 'Deserto do Vitral',
    biomas: ['Ruas Estreitas', 'Oficinas de Sílica', 'Dunas de Vidro'],
    areasNomes: ['Beco da Sílica', 'Forno de Areia', 'Pátio dos Mosaicos', 'Duna Espelhada', 'Arco do Vitral', 'Santuário da Esfinge'],
    recurso: 'Sílica → vidro',
    npc: 'Sábio Zafir',
  },
  12: {
    nome: 'Atol do Farol',
    biomas: ['Falésias de Nácar', 'Enseadas Azuis', 'Promontório do Farol'],
    areasNomes: ['Cais das Pérolas', 'Recife Luminoso', 'Enseada dos Corais', 'Escadaria Marinha', 'Patamar do Feixe', 'Cúpula do Farol'],
    recurso: 'Pérola → adornos',
    npc: 'Faroleiro Cassio',
  },
};

const DIR_OPOSTA = { N: 'S', S: 'N', L: 'O', O: 'L' };
const PORTAS = {
  N: { borda: 'norte', ponto: [512, 28], chegada: [512, 96], rect: [459, 4, 565, 52] },
  S: { borda: 'sul', ponto: [512, 543], chegada: [512, 475], rect: [459, 519, 565, 567] },
  O: { borda: 'oeste', ponto: [28, 292], chegada: [102, 292], rect: [1, 254, 55, 330] },
  L: { borda: 'leste', ponto: [996, 292], chegada: [922, 292], rect: [969, 254, 1023, 330] },
};

function ligarAreas(areas, origId, dir, destId, extra = {}) {
  const op = DIR_OPOSTA[dir];
  const pOrig = PORTAS[dir];
  const pDest = PORTAS[op];
  areas[origId].saidas.push({
    id: dir,
    rotulo: extra.rotulo || `${destId} · ${areas[destId].nome}`,
    borda: pOrig.borda,
    rect: [...pOrig.rect],
    destino: destId,
    chegada: [...pDest.chegada],
    ...(extra.tipo ? { tipo: extra.tipo } : {}),
  });
  areas[destId].saidas.push({
    id: op,
    rotulo: extra.rotuloVolta || `${origId} · ${areas[origId].nome}`,
    borda: pDest.borda,
    rect: [...pDest.rect],
    destino: origId,
    chegada: [...pOrig.chegada],
  });
}

function nomeFormaCatalogo(linhagemNome, forma) {
  const f = FORMAS_LINHAGENS_REINOS[linhagemNome];
  if (!f) return linhagemNome;
  return forma === 1 ? f.base : forma === 3 ? f.final : linhagemNome;
}

export const CATALOGO_REGIOES_3_12 = Array.from({ length: 10 }, (_, idx) => {
  const numero = idx + 3;
  const id = `r${numero}`;
  const prefixoMapa = `R${numero}`;
  const tema = TEMAS_REGIOES_3_12[numero];
  const faixaNivel = [...REGIOES[numero - 1]];
  const [nvMin, nvMax] = faixaNivel;
  const pasta = `${PASTA_REINOS}/${pad2(numero)}`;
  const cidadeArte = `${pasta}/cidade-conceito.webp`;
  const arenaChefeArte = `${pasta}/arena-chefe.webp`;
  const chefeArte = numero === 3 ? `${pasta}/chefe.webp` : `${pasta}/chefe.png`;

  const chefeReino = CHEFES_REINOS.find((c) => c.reino === numero);
  const spec = specChefeReino(numero, nvMax);
  const linhagens = LINHAGENS_REINOS.filter((l) => l.reino === numero);
  const parEss = parEssenciaDoElemento(chefeReino?.elemento || linhagens[0]?.elemento || 'neutro');

  const idsAreas = ['C0', 'A01', 'A02', 'B01', 'B02', 'C01', 'C02', 'CHEFE'].map((suf) => `${prefixoMapa}_${suf}`);
  const [c0, a01, a02, b01, b02, c01, c02, bossMapa] = idsAreas;

  const areas = {
    [c0]: {
      id: c0,
      nome: `${tema.nome} · Praça`,
      bioma: tema.biomas[0],
      regiao: id,
      segura: true,
      spawnPadrao: [512, 405],
      arte: cidadeArte,
      arenaBatalha: cidadeArte,
      saidas: [
        {
          id: 'O',
          rotulo: `Portal · Região ${numero - 1}`,
          borda: PORTAS.O.borda,
          tipo: 'portal',
          rect: [...PORTAS.O.rect],
          destino: numero === 3 ? 'R2_C0' : `R${numero - 1}_C0`,
          chegada: [512, 360],
        },
      ],
    },
  };

  const areasCaca = [a01, a02, b01, b02, c01, c02];
  areasCaca.forEach((aid, i) => {
    areas[aid] = {
      id: aid,
      nome: tema.areasNomes[i],
      bioma: tema.biomas[Math.min(2, Math.floor(i / 2))],
      regiao: id,
      segura: false,
      spawnPadrao: [512, 380],
      arte: cidadeArte,
      arenaBatalha: arenaChefeArte,
      saidas: [],
    };
  });

  areas[bossMapa] = {
    id: bossMapa,
    nome: `${tema.areasNomes[5]} · ${chefeReino.nome}`,
    bioma: tema.biomas[2],
    regiao: id,
    chefeArena: true,
    spawnPadrao: [512, 460],
    arte: arenaChefeArte,
    arenaBatalha: arenaChefeArte,
    saidas: [],
  };

  // Topologia em árvore conectando Praça → Rotas Leste/Norte/Sul → Chefe
  ligarAreas(areas, c0, 'L', a01);
  ligarAreas(areas, a01, 'L', a02);
  ligarAreas(areas, c0, 'N', b01);
  ligarAreas(areas, b01, 'N', b02);
  ligarAreas(areas, c0, 'S', c01);
  ligarAreas(areas, c01, 'N', c02); // ramo final até chefe (mas evitando sobreescrever 'S' de c0)
  // ajusta ligação c01 -> c02 via 'L' para não colidir com 'N' (volta a c0)
  areas[c01].saidas = areas[c01].saidas.filter((s) => s.destino !== c02);
  areas[c02].saidas = areas[c02].saidas.filter((s) => s.destino !== c01);
  ligarAreas(areas, c01, 'L', c02);
  ligarAreas(areas, c02, 'L', bossMapa);

  const encontrosPorArea = {};
  const encontros = [];
  const posicoesVaga = [[280, 210], [720, 210], [320, 385], [700, 385]];

  areasCaca.forEach((aid, aIdx) => {
    const listaArea = [];
    const fracInicio = aIdx / areasCaca.length;
    const fracFim = (aIdx + 1) / areasCaca.length;
    const nivelAreaMin = Math.max(nvMin, Math.round(nvMin + (nvMax - nvMin - 1) * fracInicio));
    const nivelAreaMax = Math.max(nivelAreaMin, Math.min(nvMax - 1, Math.round(nvMin + (nvMax - nvMin - 1) * fracFim)));
    const forma = aIdx < 2 ? 2 : 3;

    for (let vaga = 0; vaga < posicoesVaga.length; vaga++) {
      const lin = linhagens[(aIdx * 2 + vaga) % linhagens.length];
      const especie = nomeFormaCatalogo(lin.nome, forma);
      const nivel = Math.min(nvMax - 1, Math.round(nivelAreaMin + ((nivelAreaMax - nivelAreaMin) * vaga) / 3));
      const enc = {
        id: `w_${aid.toLowerCase()}_${vaga + 1}`,
        mapa: aid,
        regiao: id,
        linhagem: lin.nome,
        especie,
        elemento: ELEMENTO_DA_ESPECIE[especie] || lin.elemento,
        classe: CLASSE_DA_ESPECIE[especie] || lin.classe,
        forma,
        peso: vaga === 0 ? 3 : 2,
        nivel,
        nivelMin: nivelAreaMin,
        nivelMax: nivelAreaMax,
        pos: posicoesVaga[vaga],
      };
      listaArea.push(enc);
      encontros.push(enc);
    }
    encontrosPorArea[aid] = listaArea;
  });

  const gold = Math.round(900 + (numero - 2) * 550 + (numero - 2) * (numero - 3) * 110);
  const diamantes = Math.round(150 + (numero - 2) * 55 + Math.max(0, numero - 6) * 20);
  const xp = Math.round(800 + (numero - 2) * 650 + (numero - 2) * (numero - 3) * 140);
  const ticketsPermanentes = numero <= 8 ? 2 : 3;
  const raridadeReliquia = numero <= 5 ? 'rara' : numero <= 9 ? 'epica' : 'lendaria';

  return {
    id,
    numero,
    reinoId: numero,
    nome: tema.nome,
    recursoEstrategia: tema.recurso,
    npc: tema.npc,
    faixaNivel,
    prefixoMapa,
    mapaEntrada: c0,
    mapaChefe: bossMapa,
    arteCidadeProvisoria: cidadeArte,
    arteArenaProvisoria: arenaChefeArte,
    desbloqueio: {
      tipo: 'chefe_anterior',
      regiaoAnterior: `r${numero - 1}`,
      chefeId: `BOSS_R${numero - 1}`,
      texto: `Derrote ${CHEFES_REINOS.find((c) => c.reino === numero - 1)?.nome || `Chefe R${numero - 1}`} na Região ${numero - 1}.`,
    },
    chefe: {
      id: `BOSS_R${numero}`,
      nome: chefeReino.nome,
      nivel: nvMax,
      elemento: chefeReino.elemento,
      arte: chefeArte,
      arena: arenaChefeArte,
      furia: chefeReino.furia,
      bonus: { ...chefeReino.bonus },
      spec,
      reforcos: [
        [nomeFormaCatalogo(linhagens[0].nome, 3), Math.max(nvMin, nvMax - 2), linhagens[0].elemento, { forma: 3 }],
        [nomeFormaCatalogo(linhagens[1].nome, 3), Math.max(nvMin, nvMax - 2), linhagens[1].elemento, { forma: 3 }],
      ],
    },
    recompensaPrimeiraVitoria: {
      gold,
      diamantes,
      xp,
      ticketsPermanentes,
      essencias: {
        par: parEss,
        menor: numero <= 5 ? 8 : 0,
        media: numero <= 8 ? 5 : 8,
        maior: numero >= 6 ? Math.min(8, numero - 4) : 0,
      },
      reliquia: {
        elemento: chefeReino.elemento,
        raridade: raridadeReliquia,
      },
    },
    areas,
    ordemAreas: idsAreas,
    encontrosPorArea,
    encontros,
    npcAreaSegura: {
      id: `npc_${id}`,
      nome: tema.npc,
      mapa: c0,
      recurso: tema.recurso,
      saudacao: `Bem-vindo a ${tema.nome}! Aqui a cadeia de ${tema.recurso} mantém o reino de pé.`,
      dialogos: [
        `As trilhas de ${tema.biomas[1]} e ${tema.biomas[2]} estão agitadas pelas espécies locais (${linhagens.map((l) => l.nome).join(', ')}).`,
        `Se quiser evoluir sua equipe nesta região, colete ${parEss} nas Torres Elementais ou derrote os guardiões das áreas finais.`,
        `Quando estiver pronto, avance até ${bossMapa} e enfrente ${chefeReino.nome} (${chefeReino.elemento}).`,
      ],
      dicaChefe: `${chefeReino.nome} fica ainda mais perigoso abaixo de ${Math.round((chefeReino.furia || 0.5) * 100)}% de vida: leve um suporte ou controle de fúria.`,
      despedida: `As portas de ${c0} ficam abertas sempre que precisar se recompor.`,
    },
    missoes: [
      {
        id: `m_${id}_chegada`,
        regiao: id,
        ordem: 1,
        titulo: `Reconhecimento em ${tema.nome}`,
        texto: `Converse com ${tema.npc} na área segura (${c0}) para liberar o roteiro da região.`,
        resumo: `Converse com ${tema.npc} em ${c0}.`,
        npc: tema.npc,
        tipo: 'dialogo',
        meta: 1,
        recompensa: { gold: Math.round(gold * 0.25), diamantes: 30 + numero * 3, xp: Math.round(xp * 0.2) },
      },
      {
        id: `m_${id}_patrulha`,
        regiao: id,
        ordem: 2,
        titulo: `Patrulha em ${tema.biomas[0]}`,
        texto: `Enfrente e derrote 5 Oníricos selvagens pelas rotas de ${tema.nome}.`,
        resumo: `Derrote 5 Oníricos selvagens em ${tema.nome}.`,
        npc: tema.npc,
        tipo: 'abates',
        meta: 5,
        recompensa: {
          gold: Math.round(gold * 0.35),
          diamantes: 35 + numero * 4,
          xp: Math.round(xp * 0.3),
          essencias: { par: parEss, menor: numero <= 5 ? 4 : 0, media: numero <= 8 ? 3 : 4, maior: numero >= 7 ? 2 : 0 },
        },
      },
      {
        id: `m_${id}_rotas`,
        regiao: id,
        ordem: 3,
        titulo: `Mapeamento de ${tema.biomas[1]}`,
        texto: `Explore 4 áreas diferentes entre ${a01} e ${c02}.`,
        resumo: `Visite 4 áreas em ${tema.nome}.`,
        npc: tema.npc,
        tipo: 'explorar',
        meta: 4,
        recompensa: { gold: Math.round(gold * 0.35), diamantes: 40 + numero * 4, xp: Math.round(xp * 0.3) },
      },
      {
        id: `m_${id}_chefe`,
        regiao: id,
        ordem: 4,
        titulo: `Soberano de ${tema.nome}`,
        texto: `Entre em ${bossMapa} e derrote ${chefeReino.nome} pela primeira vez.`,
        resumo: `Derrote ${chefeReino.nome} em ${bossMapa}.`,
        npc: tema.npc,
        tipo: 'chefe',
        meta: 1,
        recompensa: {
          gold: Math.round(gold * 0.6),
          diamantes: 60 + numero * 10,
          xp: Math.round(xp * 0.5),
          ticketsPermanentes: 1,
        },
      },
    ],
  };
});

export const REGIOES_3_12_POR_ID = Object.fromEntries(CATALOGO_REGIOES_3_12.map((r) => [r.id, r]));

export function obterCatalogoRegiao(regiaoId) {
  return REGIOES_3_12_POR_ID[regiaoId] || null;
}

export function encontrosDaAreaRegiao(regiaoId, areaId) {
  return REGIOES_3_12_POR_ID[regiaoId]?.encontrosPorArea?.[areaId] || [];
}

export function sortearEncontroAreaRegiao(regiaoId, areaId, rng = Math.random) {
  const lista = encontrosDaAreaRegiao(regiaoId, areaId);
  if (!lista.length) return null;
  const totalPeso = lista.reduce((s, e) => s + (e.peso || 1), 0);
  let alvo = Math.max(0, Math.min(0.999999, rng())) * totalPeso;
  for (const e of lista) {
    alvo -= (e.peso || 1);
    if (alvo <= 0) return { ...e };
  }
  return { ...lista[0] };
}

export function encontroChefeRegiao(regiaoId) {
  const reg = REGIOES_3_12_POR_ID[regiaoId];
  if (!reg) return null;
  return {
    mapa: reg.mapaChefe,
    mapaRetorno: reg.ordemAreas[reg.ordemAreas.length - 2],
    chefe: reg.chefe,
    inimigos: [reg.chefe.spec, ...reg.chefe.reforcos],
  };
}

function garantirRegioesSave(save) {
  if (!save || typeof save !== 'object') return null;
  save.regioes = save.regioes && typeof save.regioes === 'object' ? save.regioes : {};
  save.regioes.missoes ||= {};
  save.regioes.progressoMissoes ||= {};
  save.regioes.chefesDerrotados ||= {};
  return save.regioes;
}

export function npcDaRegiao(regiaoId) {
  return REGIOES_3_12_POR_ID[regiaoId]?.npcAreaSegura || null;
}

export function dialogoNpcRegiao(save, regiaoId) {
  const reg = REGIOES_3_12_POR_ID[regiaoId];
  if (!reg) return null;
  const npc = reg.npcAreaSegura;
  const st = garantirRegioesSave(save);
  const chefeDerrotado = Boolean(st?.chefesDerrotados?.[regiaoId]);
  const missoes = listarMissoesRegiao(save, regiaoId);
  const concluidas = missoes.filter((m) => m.concluida).length;
  return {
    ...npc,
    regiaoId,
    chefeDerrotado,
    missoesConcluidas: concluidas,
    missoesTotal: missoes.length,
    falaAtual: chefeDerrotado
      ? `${npc.nome}: Você já venceu ${reg.chefe.nome}! ${npc.despedida}`
      : `${npc.nome}: ${npc.saudacao} ${npc.dicaChefe}`,
  };
}

export function listarMissoesRegiao(save, regiaoId) {
  const reg = REGIOES_3_12_POR_ID[regiaoId];
  if (!reg) return [];
  const st = save?.regioes || {};
  return reg.missoes.map((m) => {
    const concluida = st.missoes?.[m.id] === 'concluida';
    const rawProg = Number(st.progressoMissoes?.[m.id]) || 0;
    const progresso = concluida ? m.meta : Math.min(m.meta, rawProg);
    return {
      ...m,
      progresso,
      concluida,
      pronta: !concluida && progresso >= m.meta,
    };
  });
}

export function registrarProgressoMissaoRegiao(save, regiaoId, tipo, qtd = 1) {
  const reg = REGIOES_3_12_POR_ID[regiaoId];
  if (!reg) return { ok: false, motivo: 'Região inválida.' };
  const st = garantirRegioesSave(save);
  const inc = Math.max(1, Math.floor(Number(qtd) || 1));
  const atualizadas = [];
  for (const m of reg.missoes) {
    if (m.tipo !== tipo || st.missoes[m.id] === 'concluida') continue;
    const novo = Math.min(m.meta, (Number(st.progressoMissoes[m.id]) || 0) + inc);
    st.progressoMissoes[m.id] = novo;
    atualizadas.push({ id: m.id, progresso: novo, meta: m.meta, pronta: novo >= m.meta });
  }
  return { ok: true, atualizadas };
}

export function concluirMissaoRegiao(save, regiaoId, missaoId) {
  const reg = REGIOES_3_12_POR_ID[regiaoId];
  const m = reg?.missoes?.find((x) => x.id === missaoId);
  if (!m) return { ok: false, motivo: 'Missão da região não encontrada.' };
  const st = garantirRegioesSave(save);
  if (st.missoes[m.id] === 'concluida') {
    return { ok: false, jaConcluida: true, motivo: 'Missão já resgatada.' };
  }
  const prog = Number(st.progressoMissoes[m.id]) || 0;
  if (prog < m.meta) {
    return { ok: false, motivo: `Objetivo pendente (${prog}/${m.meta}).` };
  }

  st.missoes[m.id] = 'concluida';
  const rec = m.recompensa;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  save.recompensas.gold = (Number(save.recompensas.gold) || 0) + (rec.gold || 0);
  save.recompensas.diamantes = (Number(save.recompensas.diamantes) || 0) + (rec.diamantes || 0);
  save.recompensas.xp = (Number(save.recompensas.xp) || 0) + (rec.xp || 0);
  if (save.idle?.jogador) save.idle.jogador.xp = (Number(save.idle.jogador.xp) || 0) + (rec.xp || 0);
  if (rec.ticketsPermanentes > 0 && save.idle) {
    save.idle.exp = save.idle.exp || { nivel: 1, xp: 0, tickets: 0 };
    save.idle.exp.tickets = (Number(save.idle.exp.tickets) || 0) + rec.ticketsPermanentes;
  }
  if (rec.essencias?.par) {
    for (const tam of ['menor', 'media', 'maior']) {
      if (rec.essencias[tam] > 0) adicionarEssencia(save, rec.essencias.par, tam, rec.essencias[tam]);
    }
  }
  return { ok: true, missao: m, recompensa: rec };
}
