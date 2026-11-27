// Regiões 3–12 jogáveis no explorador 3D (molde de regiao2-altos-ambar.js)
// Usa a topologia, encontros e chefes de regiao1-regioes-r3-r12-regras.js com piso livre e artes provisórias dos reinos.
import { CATALOGO_REGIOES_3_12 } from './regiao1-regioes-r3-r12-regras.js';
import { ARTE_DA_ESPECIE } from '../species.js';

const COR_EL = {
  fogo: '#f97316', agua: '#38bdf8', planta: '#4ade80', terra: '#d97706', luz: '#facc15',
  trevas: '#a855f7', neutro: '#cbd5e1', lutador: '#f87171', voador: '#60a5fa',
  veneno: '#c084fc', psiquico: '#f472b6', inseto: '#a3e635', pedra: '#d6b48c',
  fantasma: '#a78bfa', eletrico: '#fde047', gelo: '#67e8f9', dragao: '#818cf8',
  aco: '#94a3b8', fada: '#f9a8d4',
};

export const AREAS_REGIOES_3_12 = {};
export const MONSTROS_SELVAGENS_R3_R12 = [];
export const BOSSES_REGIOES_3_12 = {};

for (const reg of CATALOGO_REGIOES_3_12) {
  for (const [areaId, area] of Object.entries(reg.areas)) {
    AREAS_REGIOES_3_12[areaId] = {
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
