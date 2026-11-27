// Regiões 3–12 jogáveis no explorador 3D (molde de regiao2-altos-ambar.js)
// Expande cada região para 16 áreas interligadas (rotas alternativas e atalhos de volta),
// com 1 área segura com NPC por região, encontros das linhagens do reino e chefe principal.
import { CATALOGO_REGIOES_3_12 } from './regiao1-regioes-r3-r12-regras.js';
import { LINHAGENS_REINOS } from './regiao1-kits-reinos.js';
import { FORMAS_LINHAGENS_REINOS } from '../formas-reinos.js';
import { ARTE_DA_ESPECIE, ELEMENTO_DA_ESPECIE, CLASSE_DA_ESPECIE } from '../species.js';

const COR_EL = {
  fogo: '#f97316', agua: '#38bdf8', planta: '#4ade80', terra: '#d97706', luz: '#facc15',
  trevas: '#a855f7', neutro: '#cbd5e1', lutador: '#f87171', voador: '#60a5fa',
  veneno: '#c084fc', psiquico: '#f472b6', inseto: '#a3e635', pedra: '#d6b48c',
  fantasma: '#a78bfa', eletrico: '#fde047', gelo: '#67e8f9', dragao: '#818cf8',
  aco: '#94a3b8', fada: '#f9a8d4',
};

const SPRITES_NPC = [
  '../../../assets/confusion/interface/halloween/npcs/pescadora.webp',
  '../../../assets/confusion/interface/halloween/npcs/zeladora_c1.webp',
  '../../../assets/confusion/interface/halloween/npcs/jardineira_c1.webp',
  '../../../assets/confusion/interface/halloween/npcs/mensageiro_c1.webp',
  '../../../assets/confusion/interface/halloween/npcs/engenheira_c2.webp',
];

const BORDAS = {
  N: { borda: 'norte', rect: [445, 0, 579, 54], chegada: [512, 472], inv: 'S' },
  S: { borda: 'sul', rect: [445, 517, 579, 571], chegada: [512, 98], inv: 'N' },
  L: { borda: 'leste', rect: [968, 230, 1024, 355], chegada: [104, 292], inv: 'O' },
  O: { borda: 'oeste', rect: [0, 230, 56, 355], chegada: [920, 292], inv: 'L' },
};

function ligarPar(mapas, idA, dir, idB) {
  const a = mapas[idA], b = mapas[idB];
  if (!a || !b) return;
  const d = BORDAS[dir];
  const inv = BORDAS[d.inv];
  if (!a.saidas.some((s) => s.id === dir)) {
    a.saidas.push({ id: dir, rotulo: `${idB} · ${b.nome}`, borda: d.borda, rect: d.rect, destino: idB, chegada: d.chegada });
  }
  if (!b.saidas.some((s) => s.id === d.inv)) {
    b.saidas.push({ id: d.inv, rotulo: `${idA} · ${a.nome}`, borda: inv.borda, rect: inv.rect, destino: idA, chegada: inv.chegada });
  }
}

function nomeForma(linNome, forma) {
  const f = FORMAS_LINHAGENS_REINOS[linNome];
  if (!f) return linNome;
  return forma === 1 ? f.base : forma === 3 ? f.final : linNome;
}

const EXTRAS_SUFIXOS = [
  { suf: 'A03', rot: 'Trilha Alta', bioIdx: 0 },
  { suf: 'A04', rot: 'Mirante Leste', bioIdx: 1 },
  { suf: 'B03', rot: 'Desfiladeiro Norte', bioIdx: 1 },
  { suf: 'B04', rot: 'Passagem Elevada', bioIdx: 2 },
  { suf: 'C03', rot: 'Atalho da Encosta', bioIdx: 1 },
  { suf: 'C04', rot: 'Pátio dos Guardas', bioIdx: 2 },
  { suf: 'D01', rot: 'Estrada Oeste', bioIdx: 0 },
  { suf: 'D02', rot: 'Clareira Oculta', bioIdx: 1 },
];

export const AREAS_REGIOES_3_12 = {};
export const MONSTROS_SELVAGENS_R3_R12 = [];
export const BOSSES_REGIOES_3_12 = {};
export const NPCS_REGIOES_3_12 = [];

for (const reg of CATALOGO_REGIOES_3_12) {
  const p = reg.prefixoMapa; // 'R3'..'R12'
  const mapasReg = {};
  for (const [areaId, area] of Object.entries(reg.areas)) {
    mapasReg[areaId] = {
      id: areaId,
      nome: area.nome,
      bioma: area.bioma,
      regiao: reg.id,
      segura: Boolean(area.segura),
      chefeArena: Boolean(area.chefeArena),
      pisoLivre: true,
      arte: `../../../${area.arte}`,
      walkmask: null,
      arenaBatalha: area.arenaBatalha,
      spawnPadrao: area.spawnPadrao || [512, 380],
      saidas: (area.saidas || []).map((s) => ({ ...s })),
    };
  }

  // Adiciona 8 áreas extras interligadas (total: 16 áreas por região com rotas alternativas e atalhos de volta)
  const [nvMin, nvMax] = reg.faixaNivel;
  const linhagens = LINHAGENS_REINOS.filter((l) => l.reino === reg.numero);
  const posVagas = [[260, 215], [740, 215], [310, 395], [710, 395]];

  EXTRAS_SUFIXOS.forEach((ex, idx) => {
    const aid = `${p}_${ex.suf}`;
    mapasReg[aid] = {
      id: aid,
      nome: `${ex.rot} (${reg.nome})`,
      bioma: reg.nome,
      regiao: reg.id,
      segura: false,
      chefeArena: false,
      pisoLivre: true,
      arte: `../../../${reg.arteCidadeProvisoria}`,
      walkmask: null,
      arenaBatalha: reg.arteArenaProvisoria,
      spawnPadrao: [512, 380],
      saidas: [],
    };
    const forma = idx < 3 ? 2 : 3;
    const nvBase = Math.min(nvMax - 1, Math.round(nvMin + ((nvMax - nvMin - 1) * (idx + 2)) / 10));
    for (let v = 0; v < 3; v++) {
      const lin = linhagens[(idx + v) % linhagens.length];
      if (!lin) continue;
      const especie = nomeForma(lin.nome, forma);
      const arteRel = ARTE_DA_ESPECIE[especie] || reg.chefe.arte;
      const elemento = ELEMENTO_DA_ESPECIE[especie] || lin.elemento;
      MONSTROS_SELVAGENS_R3_R12.push({
        id: `w_${aid.toLowerCase()}_${v + 1}`,
        mapa: aid,
        regiao: reg.id,
        especie,
        linhagem: lin.nome,
        elemento,
        classe: CLASSE_DA_ESPECIE[especie] || lin.classe,
        forma,
        nivel: Math.min(nvMax - 1, nvBase + v),
        pos: posVagas[v],
        cor: COR_EL[elemento] || '#38bdf8',
        arteForma: arteRel,
        sprite: `../../../${arteRel}`,
      });
    }
  });

  // Ligações extras formando malha com caminhos alternativos e retorno à área segura C0
  ligarPar(mapasReg, `${p}_A02`, 'L', `${p}_A03`);
  ligarPar(mapasReg, `${p}_A03`, 'N', `${p}_A04`);
  ligarPar(mapasReg, `${p}_A04`, 'O', `${p}_B02`);
  ligarPar(mapasReg, `${p}_B02`, 'N', `${p}_B03`);
  ligarPar(mapasReg, `${p}_B03`, 'L', `${p}_B04`);
  ligarPar(mapasReg, `${p}_B04`, 'S', `${p}_A04`);
  ligarPar(mapasReg, `${p}_C0`, 'O', `${p}_D01`);
  ligarPar(mapasReg, `${p}_D01`, 'S', `${p}_D02`);
  ligarPar(mapasReg, `${p}_D02`, 'L', `${p}_C03`);
  ligarPar(mapasReg, `${p}_C03`, 'L', `${p}_C04`);
  ligarPar(mapasReg, `${p}_C04`, 'N', `${p}_C02`);

  Object.assign(AREAS_REGIOES_3_12, mapasReg);

  for (const enc of reg.encontros) {
    const arteRel = ARTE_DA_ESPECIE[enc.especie] || reg.chefe.arte;
    MONSTROS_SELVAGENS_R3_R12.push({
      id: enc.id,
      mapa: enc.mapa,
      regiao: reg.id,
      especie: enc.especie,
      linhagem: enc.linhagem,
      elemento: enc.elemento,
      classe: enc.classe,
      forma: enc.forma,
      nivel: enc.nivel,
      pos: enc.pos,
      cor: COR_EL[enc.elemento] || '#38bdf8',
      arteForma: arteRel,
      sprite: `../../../${arteRel}`,
    });
  }

  // NPC da área segura (C0) com diálogos e missões curtas da região
  const falas = Array.isArray(reg.dialogos) && reg.dialogos.length
    ? reg.dialogos
    : [
        `Bem-vindo a ${reg.nome} (Nv. ${nvMin}–${nvMax})! Esta praça é uma área segura para descansar e organizar sua equipe.`,
        ...(reg.missoes || []).map((m) => `Missão · ${m.titulo}: ${m.resumo}`),
        `Quando estiver pronto, siga pelos caminhos alternativos até ${reg.mapaChefe} e enfrente ${reg.chefe.nome} (Nv. ${reg.chefe.nivel}).`,
      ];
  NPCS_REGIOES_3_12.push({
    id: `npc_${reg.id}_guia`,
    nome: reg.npc || `Guia de ${reg.nome}`,
    raca: 'humano',
    mapa: reg.mapaEntrada,
    pos: [512, 360],
    altura: 6.2,
    sprite: SPRITES_NPC[(reg.numero - 3) % SPRITES_NPC.length],
    cor: COR_EL[reg.chefe.elemento] || '#38bdf8',
    expressoes: falas.map((_, i) => (i === 0 ? 'sorriso' : 'serio')),
    dialogo: falas,
  });

  const ch = reg.chefe;
  BOSSES_REGIOES_3_12[ch.id] = {
    id: ch.id,
    regiaoId: reg.id,
    numeroRegiao: reg.numero,
    mapa: reg.mapaChefe,
    nome: ch.nome,
    nivel: ch.nivel,
    elemento: ch.elemento,
    pos: [512, 340],
    cor: COR_EL[ch.elemento] || '#f59e0b',
    sprite: `../../../${ch.arte}`,
    arena: ch.arena,
    reforcos: ch.reforcos,
    bonus: ch.bonus,
    recompensa: reg.recompensaPrimeiraVitoria,
    mapaRetorno: reg.mapaEntrada,
  };
}
