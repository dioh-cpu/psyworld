// Molduras e Ícones de Perfil do Domador (regras puras, sem DOM).
// Alinhado às 8 molduras do #156 (kit-v2/perfil/) e ao Passe Premium Dinossauros, eventos e conquistas.
import { infoPasse, passeDe } from './regiao1-passe-regras.js';

export const MOLDURAS_PERFIL_CATALOGO = [
  { id: 'farol', nome: 'Farol', arq: 'assets/confusion/interface/kit-v2/perfil/farol.png', fonte: 'padrao', req: 'Padrão do Domador' },
  { id: 'ignaraz', nome: 'Ignaraz', arq: 'assets/confusion/interface/kit-v2/perfil/ignaraz.png', fonte: 'conquista', req: 'Tenha Ignaraz na coleção' },
  { id: 'vaelirion', nome: 'Vaelirion', arq: 'assets/confusion/interface/kit-v2/perfil/vaelirion.png', fonte: 'conquista', req: 'Tenha Vaelirion na coleção' },
  { id: 'florivel', nome: 'Florivel', arq: 'assets/confusion/interface/kit-v2/perfil/florivel.png', fonte: 'conquista', req: 'Tenha Florivel na coleção' },
  { id: 'ambar-fossil', nome: 'Âmbar Fóssil', arq: 'assets/confusion/interface/kit-v2/perfil/ambar-fossil.png', fonte: 'passe-dinossauros', nivelPasse: 10, req: 'Passe Dinossauros Nv.10' },
  { id: 'ossada-antiga', nome: 'Ossada Antiga', arq: 'assets/confusion/interface/kit-v2/perfil/ossada-antiga.png', fonte: 'passe-dinossauros', nivelPasse: 30, req: 'Passe Dinossauros Nv.30' },
  { id: 'pegadas-no-barro', nome: 'Pegadas no Barro', arq: 'assets/confusion/interface/kit-v2/perfil/pegadas-no-barro.png', fonte: 'passe-dinossauros', nivelPasse: 60, req: 'Passe Dinossauros Nv.60' },
  { id: 'vulcao-adormecido', nome: 'Vulcão Adormecido', arq: 'assets/confusion/interface/kit-v2/perfil/vulcao-adormecido.png', fonte: 'passe-dinossauros', nivelPasse: 90, req: 'Passe Dinossauros Nv.90 (Premium) ou Nv.100' },
];

export const ICONES_PERFIL_CATALOGO = [
  { id: 'padrao', nome: 'Azazel', arq: 'assets/regiao1/azazel.webp', fonte: 'padrao', req: 'Padrão do Domador' },
  { id: 'icone-tiranox', nome: 'Tiranox Primevo', arq: 'assets/confusion/interface/kit-v2/perfil/vulcao-adormecido.png', fonte: 'passe-dinossauros', nivelPasse: 20, premium: true, req: 'Passe Premium Dinossauros Nv.20' },
  { id: 'icone-tricerax', nome: 'Tricerax Blindado', arq: 'assets/confusion/interface/kit-v2/perfil/ossada-antiga.png', fonte: 'passe-dinossauros', nivelPasse: 40, premium: true, req: 'Passe Premium Dinossauros Nv.40' },
  { id: 'icone-veloxar', nome: 'Veloxar Relâmpago', arq: 'assets/confusion/interface/kit-v2/perfil/pegadas-no-barro.png', fonte: 'passe-dinossauros', nivelPasse: 70, premium: true, req: 'Passe Premium Dinossauros Nv.70' },
  { id: 'icone-pteronox', nome: 'Pteronox Celeste', arq: 'assets/confusion/interface/kit-v2/perfil/ambar-fossil.png', fonte: 'passe-dinossauros', nivelPasse: 80, premium: true, req: 'Passe Premium Dinossauros Nv.80' },
  { id: 'icone-halloween', nome: 'Selo de Halloween', arq: 'assets/confusion/interface/banners-v2/halloween.webp', fonte: 'evento', req: 'Participe do evento de Halloween' },
  { id: 'icone-campeao-cap1', nome: 'Guardião do Vale', arq: 'assets/confusion/interface/kit-v2/perfil/farol.png', fonte: 'conquista', req: 'Conclua o Capítulo 1 da Campanha Mini' },
];

export const MOLDURAS_PERFIL_POR_ID = Object.fromEntries(MOLDURAS_PERFIL_CATALOGO.map((m) => [m.id, m]));
export const ICONES_PERFIL_POR_ID = Object.fromEntries(ICONES_PERFIL_CATALOGO.map((i) => [i.id, i]));

export function perfilDomadorDe(save) {
  const idle = save?.idle || (save ? (save.idle = {}) : {});
  idle.jogador = idle.jogador || {};
  if (!idle.jogador.perfil || typeof idle.jogador.perfil !== 'object' || Array.isArray(idle.jogador.perfil)) {
    idle.jogador.perfil = {};
  }
  const pf = idle.jogador.perfil;
  if (!pf.moldura || typeof pf.moldura !== 'string') pf.moldura = 'farol';
  if (!pf.icone || typeof pf.icone !== 'string') pf.icone = 'padrao';
  if (!Array.isArray(pf.desbloqueadas)) pf.desbloqueadas = ['farol'];
  if (!pf.desbloqueadas.includes('farol')) pf.desbloqueadas.unshift('farol');
  if (!Array.isArray(pf.iconesDesbloqueados)) pf.iconesDesbloqueados = ['padrao'];
  if (!pf.iconesDesbloqueados.includes('padrao')) pf.iconesDesbloqueados.unshift('padrao');
  if (!pf.foto || typeof pf.foto !== 'object') pf.foto = { status: 'nenhuma', url: null, motivo: '' };
  return pf;
}

function temEspecie(save, especie) {
  const eq = save?.idle?.equipe || [];
  const bn = save?.idle?.banco || [];
  return eq.some((m) => m?.especie === especie) || bn.some((m) => m?.especie === especie) || Boolean(save?.idle?.codex?.[especie]);
}

export function molduraPerfilDesbloqueada(save, molduraId, agora = Date.now()) {
  const def = MOLDURAS_PERFIL_POR_ID[molduraId];
  if (!def) return false;
  const pf = perfilDomadorDe(save);
  if (pf.desbloqueadas.includes(def.id)) return true;
  if (save?.idle?.colecao?.molduras?.includes(def.id)) return true;
  if (def.fonte === 'padrao') return true;
  if (def.id === 'ignaraz') return temEspecie(save, 'Ignaraz');
  if (def.id === 'vaelirion') return temEspecie(save, 'Vaelirion');
  if (def.id === 'florivel') return temEspecie(save, 'Florivel');
  if (def.fonte === 'passe-dinossauros') {
    const info = infoPasse(save, agora);
    const p = passeDe(save, agora);
    if (def.id === 'vulcao-adormecido') return Boolean(info?.nivel >= 100 || (p?.premium && info?.nivel >= 90));
    return Boolean(info?.nivel >= (def.nivelPasse || 1));
  }
  return false;
}

export function iconePerfilDesbloqueado(save, iconeId, agora = Date.now()) {
  const def = ICONES_PERFIL_POR_ID[iconeId];
  if (!def) return false;
  const pf = perfilDomadorDe(save);
  if (pf.iconesDesbloqueados.includes(def.id)) return true;
  if (save?.idle?.colecao?.icones?.includes(def.id)) return true;
  if (def.fonte === 'padrao') return true;
  if (def.id === 'icone-campeao-cap1') return Boolean(save?.idle?.campanhaMini?.capitulosConcluidos?.[1]);
  if (def.id === 'icone-halloween') return Boolean(save?.idle?.hw && Object.keys(save.idle.hw.invocacoes || {}).length > 0 || (save?.idle?.hw?.totalInvocacoes || 0) > 0);
  if (def.fonte === 'passe-dinossauros') {
    const info = infoPasse(save, agora);
    const p = passeDe(save, agora);
    return Boolean((!def.premium || p?.premium) && info?.nivel >= (def.nivelPasse || 1));
  }
  return false;
}

export function desbloquearMolduraPerfil(save, molduraId) {
  if (!MOLDURAS_PERFIL_POR_ID[molduraId]) return { ok: false, motivo: 'Moldura desconhecida.' };
  const pf = perfilDomadorDe(save);
  const jaTinha = pf.desbloqueadas.includes(molduraId);
  if (!jaTinha) pf.desbloqueadas.push(molduraId);
  return { ok: true, jaTinha, id: molduraId };
}

export function desbloquearIconePerfil(save, iconeId) {
  if (!ICONES_PERFIL_POR_ID[iconeId]) return { ok: false, motivo: 'Ícone desconhecido.' };
  const pf = perfilDomadorDe(save);
  const jaTinha = pf.iconesDesbloqueados.includes(iconeId);
  if (!jaTinha) pf.iconesDesbloqueados.push(iconeId);
  return { ok: true, jaTinha, id: iconeId };
}

export function sincronizarDesbloqueiosPerfil(save, agora = Date.now()) {
  const pf = perfilDomadorDe(save);
  for (const m of MOLDURAS_PERFIL_CATALOGO) {
    if (molduraPerfilDesbloqueada(save, m.id, agora) && !pf.desbloqueadas.includes(m.id)) {
      pf.desbloqueadas.push(m.id);
    }
  }
  for (const ic of ICONES_PERFIL_CATALOGO) {
    if (iconePerfilDesbloqueado(save, ic.id, agora) && !pf.iconesDesbloqueados.includes(ic.id)) {
      pf.iconesDesbloqueados.push(ic.id);
    }
  }
  return pf;
}

export function equiparMolduraPerfil(save, molduraId, agora = Date.now()) {
  const def = MOLDURAS_PERFIL_POR_ID[molduraId];
  if (!def) return { ok: false, motivo: 'Moldura não encontrada.' };
  if (!molduraPerfilDesbloqueada(save, molduraId, agora)) return { ok: false, bloqueada: true, motivo: `Bloqueada: ${def.req}` };
  const pf = perfilDomadorDe(save);
  if (!pf.desbloqueadas.includes(molduraId)) pf.desbloqueadas.push(molduraId);
  pf.moldura = molduraId;
  return { ok: true, moldura: def };
}

export function equiparIconePerfil(save, iconeId, agora = Date.now()) {
  const def = ICONES_PERFIL_POR_ID[iconeId];
  if (!def) return { ok: false, motivo: 'Ícone não encontrado.' };
  if (!iconePerfilDesbloqueado(save, iconeId, agora)) return { ok: false, bloqueado: true, motivo: `Bloqueado: ${def.req}` };
  const pf = perfilDomadorDe(save);
  if (!pf.iconesDesbloqueados.includes(iconeId)) pf.iconesDesbloqueados.push(iconeId);
  pf.icone = iconeId;
  return { ok: true, icone: def };
}

export function listarMoldurasPerfil(save, agora = Date.now()) {
  const pf = perfilDomadorDe(save);
  return MOLDURAS_PERFIL_CATALOGO.map((m) => ({
    ...m,
    desbloqueada: molduraPerfilDesbloqueada(save, m.id, agora),
    equipada: pf.moldura === m.id,
  }));
}

export function listarIconesPerfil(save, agora = Date.now()) {
  const pf = perfilDomadorDe(save);
  return ICONES_PERFIL_CATALOGO.map((ic) => ({
    ...ic,
    desbloqueado: iconePerfilDesbloqueado(save, ic.id, agora),
    equipado: pf.icone === ic.id,
  }));
}
