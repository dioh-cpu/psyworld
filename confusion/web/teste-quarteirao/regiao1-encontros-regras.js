// Resolução de encontros no catálogo antes de renderizar (mapa, nome, espécie, elemento, sprite, kit e drop).
// Regras:
// - Nenhum dos 5 iniciais aparece como inimigo na Região 1 em nenhuma forma (nem como reforço de chefe).
// - Iniciais equipados pelo jogador permanecem aliados normalmente.
// - Campanha: base níveis 1–20, segunda 21–40, terceira 41+.
// - Região 1 prioriza base (poucas segundas perto de chefes, zero terceiras no mapa). Terceira forma dos iniciais só na Região 2 (41+).
import { ESPECIES, LINHAS, ELEMENTO_DA_ESPECIE, ARTE_DA_ESPECIE, HABILIDADES_DA_ESPECIE } from '../species.js';
import { REINOS } from '../reinos.js';
import { kitDe, PAPEL_PADRAO } from './regiao1-batalha-habilidades.js';

export const ESPECIES_INICIAIS_TODAS = new Set(LINHAS.flatMap((l) => [l.inicial, l.atual, l.evolucao]));
export const ehEspecieInicial = (especie) => ESPECIES_INICIAIS_TODAS.has(especie);

export const SUBSTITUTO_R1 = {
  noctarn: 'Fanalino',
  ignavor: 'Cobrabúfalo',
  vaelith: 'Tatuveludo',
  brotavel: 'Cervomusgo',
  solarin: 'Xistolim',
};

export const MAPAS_PRE_CHEFE_R1 = new Set(['E10', 'D11', 'PC9', 'CC9']);

const PAPEL_POR_TIPO = {
  inseto: 'ataque',
  fogo: 'ataque',
  eletrico: 'ataque',
  voador: 'ataque',
  aco: 'defesa',
  pedra: 'defesa',
  terra: 'defesa',
  planta: 'suporte',
  agua: 'suporte',
};

export function formaPorNivelCampanha(nivel = 1) {
  const nv = Math.max(1, Math.floor(Number(nivel) || 1));
  if (nv <= 20) return 1;
  if (nv <= 40) return 2;
  return 3;
}

function linhagemReinoDe(especie) {
  for (const r of Object.values(REINOS)) {
    const lin = r.linhagens?.find((l) => l.nome === especie);
    if (lin) return lin;
  }
  return null;
}

export function arteDaFormaNoCatalogo(especie, forma = 1) {
  const f = Math.max(1, Math.min(3, Math.floor(Number(forma) || 1)));
  const lin = LINHAS.find((l) => l.inicial === especie || l.atual === especie || l.evolucao === especie);
  if (lin) {
    const alvo = [lin.inicial, lin.atual, lin.evolucao][f - 1];
    return ARTE_DA_ESPECIE[alvo] || ARTE_DA_ESPECIE[especie] || null;
  }
  const rLin = linhagemReinoDe(especie);
  if (rLin?.formas?.[f - 1]) return rLin.formas[f - 1];
  return ARTE_DA_ESPECIE[especie] || null;
}

// Resolve encontro no catálogo ANTES de renderizar, garantindo coerência total entre mapa e arena.
export function resolverEncontroCatalogo(entrada, { regiao = 1, papelPadrao = null } = {}) {
  const base = typeof entrada === 'string' ? { especie: entrada, nivel: 1 } : { ...entrada };
  const nivel = Math.max(1, Math.floor(Number(base.nivel) || 1));
  let especie = base.especie;
  let substituido = null;
  let forma = formaPorNivelCampanha(nivel);

  const linInicial = LINHAS.find((l) => l.inicial === especie || l.atual === especie || l.evolucao === especie);
  if (linInicial) {
    if (regiao <= 1) {
      substituido = especie;
      especie = SUBSTITUTO_R1[linInicial.id];
      forma = base.formaCadastrada === 2 && MAPAS_PRE_CHEFE_R1.has(base.mapa) ? 2 : 1;
    } else {
      const formas = [linInicial.inicial, linInicial.atual, linInicial.evolucao];
      const pedida = base.formaCadastrada ?? base.forma ?? (formas.indexOf(especie) + 1);
      forma = Math.max(1, Math.min(3, pedida || formaPorNivelCampanha(nivel)));
      if (nivel <= 20) forma = 1;
      else if (nivel <= 40) forma = Math.min(2, forma);
      else forma = 3;
      especie = formas[forma - 1];
    }
  } else if (regiao <= 1) {
    if (base.formaCadastrada === 2 && MAPAS_PRE_CHEFE_R1.has(base.mapa)) forma = 2;
    else forma = Math.min(2, formaPorNivelCampanha(nivel));
  } else {
    const pedida = base.formaCadastrada ?? base.forma ?? formaPorNivelCampanha(nivel);
    forma = Math.max(1, Math.min(3, pedida));
    if (nivel <= 20) forma = Math.min(1, forma);
    else if (nivel <= 40) forma = Math.min(2, forma);
  }

  const fase = forma === 1 ? 'inicial' : forma === 2 ? 'atual' : 'evolucao';
  const elemento = ELEMENTO_DA_ESPECIE[especie] || 'neutro';
  const papel = papelPadrao || PAPEL_PADRAO[especie] || PAPEL_POR_TIPO[elemento] || 'ataque';
  const arteForma = arteDaFormaNoCatalogo(especie, forma);
  const sprite = arteForma ? `../../../${arteForma}` : (base.sprite || null);
  const nomesHabs = HABILIDADES_DA_ESPECIE[especie] || ESPECIES[especie]?.habilidades || [];
  const kit = kitDe(especie, papel, elemento, nomesHabs);

  return {
    ...base,
    especie,
    nome: especie,
    nivel,
    regiao,
    forma,
    fase,
    elemento,
    elementoDrop: elemento,
    papel,
    arteForma,
    sprite,
    kit,
    _resolvido: true,
    proporcaoSprite: arteForma?.includes('/reinos/') ? 16 / 9 : null,
    ...(substituido ? { substituido } : {}),
  };
}

export const REFORCOS_CHEFES_R1 = {
  BOSS_E: ['Cervomusgo', 'Fanalino'],
  BOSS_D: ['Tatuveludo', 'Cervomusgo'],
  BOSS_S: ['Cobrabúfalo', 'Fanalino'],
  BOSS_C: ['Xistolim', 'Tatuveludo'],
};

// Reforços de chefe na Região 1: nunca usa iniciais.
export function reforcosDoChefe(bossId, nivelChefe = 12) {
  const especies = REFORCOS_CHEFES_R1[bossId] || ['Cervomusgo', 'Fanalino'];
  const nv = Math.max(3, Math.floor(Number(nivelChefe) || 12) - 4);
  return especies.map((especie) => resolverEncontroCatalogo({ especie, nivel: nv }, { regiao: 1 }));
}

// Preserva intacta a equipe do jogador (incluindo Noctarn/iniciais salvos na formação como aliados).
export function equipeAliadaPreservada(idle) {
  return Array.isArray(idle?.equipe) ? idle.equipe.map((m) => ({ ...m })) : [];
}
