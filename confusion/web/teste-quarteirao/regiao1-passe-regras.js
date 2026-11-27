// Passe de Temporada da Região 1 (regras puras, sem DOM).
// Cada edição dura um mês de calendário, tem 100 níveis de 1.000 XP e entrega o ovo temático T5 no nível 100.
// O calendário libera uma cota cumulativa por dia; a cota não usada fica para recuperar depois e o XP que passa do teto é descartado.
// O XP normal, o farm do Idle e os recursos de cada modo seguem as próprias regras: aqui só se conta o XP de Passe.

export const PASSE_CFG = {
  niveis: 100,
  xpPorNivel: 1000,
  xpHoraAlvo: 900,        // referência de calibragem das fontes abaixo (jogo ativo)
  cotaDiaBase: 3600,      // mês de 30 dias: 3.600 XP/dia, nível 100 a partir do dia 28
  diasFolga: 2,           // a conclusão fica nos últimos dias da edição (dias do mês − 2)
  arredondarCota: 100,
  precoNivel: 150,        // diamantes por nível comprado (dentro do que o calendário já liberou)
  precoPremium: 5000,     // Passe Premium Dinossauros (trilha dupla Nv.1-100)
  primeiraEdicao: '2026-12', // meses anteriores usam o tema da primeira edição
  temas: [
    {
      id: 'dinossauros', nome: 'Dinossauros', ovoNome: 'Ovo de Dinossauro T5',
      especieT5: 'Tiranox',
      elencoT5: ['Tiranox', 'Tricerax', 'Veloxar', 'Pteronox'],
      montarias: ['Raptor Veloz', 'Tricerado de Carga', 'Asa-Ptero'],
      molduras: ['Âmbar Fóssil', 'Ossada Antiga', 'Pegadas no Barro', 'Vulcão Adormecido'],
      acessorios: ['Dente de Raptor', 'Colar de Âmbar', 'Chapéu de Explorador', 'Luvas de Escavação', 'Crista de Folhas', 'Óculos de Poeira', 'Bolsa de Fósseis', 'Pena Primeva', 'Bracelete de Garras', 'Elmo de Crânio'],
      casa: ['Ninho de Ovos', 'Esqueleto de Parede', 'Samambaia Gigante', 'Mesa de Escavação'],
    },
    { id: 'mares', nome: 'Marés Profundas', ovoNome: 'Ovo das Marés T5', especieT5: 'Vaelith', elencoT5: ['Vaelith'] },
    { id: 'astral', nome: 'Céu Astral', ovoNome: 'Ovo Astral T5', especieT5: 'Solarin', elencoT5: ['Solarin'] },
    { id: 'brasas', nome: 'Forja de Brasas', ovoNome: 'Ovo de Brasas T5', especieT5: 'Ignavor', elencoT5: ['Ignavor'] },
  ],
  // XP de Passe por atividade, calibrado para ~900 XP por hora de jogo ativo em cada modo
  fontes: {
    abate: 1,            // Idle: exatamente 1 XP de Passe por Onírico derrotado
    batalha: 30,         // Campanha na arena (~2 min)
    batalhaChefe: 75,
    derrota: 9,
    torre: 25,           // andar da Torre de Halloween (~100 s)
    calabouco: 20,       // sala de luta vencida no Calabouço (~80 s)
    calaboucoSala: 15,   // sala corrompida ou de tesouro superada no Calabouço
    calaboucoChefe: 60,
    crise: 25,           // ação efetiva na Crise da Vila
    estrategia: 45,      // fase da Estratégia/Reinos (~3 min)
    hv: 120,             // missão do Herói × Vilão (~8 min com diálogo)
    contrato: 100,       // contrato da Guilda entregue (fixo ou diário)
    coleta: 15,          // coleta da Fazenda
    fabricacao: 15,      // lote da Oficina
    xpPorAbateIdle: 1,   // 1 XP de Passe por abate no Idle (ativo e liquidado ao reabrir)
  },
};

// Recompensas exclusivas e úteis do Login de 7 dias (painel próprio sobre o Passe; cada dia paga uma vez por ciclo)
export const LOGIN_7D_CATALOGO = [
  { dia: 1, tipo: 'diamantes', qtd: 100, icone: '💎', texto: '100 💎' },
  { dia: 2, tipo: 'tickets', qtd: 2, icone: '🎫', texto: '2 Tickets de Invocação' },
  { dia: 3, tipo: 'fragmentos', qtd: 10, icone: '🔮', texto: '10 Fragmentos de Sonho (todos os elementos)' },
  { dia: 4, tipo: 'pocao', id: 'pocao_xp_m', qtd: 2, icone: '🧪', texto: '2 Poções Médias de XP' },
  { dia: 5, tipo: 'diamantes', qtd: 250, icone: '💎', texto: '250 💎' },
  { dia: 6, tipo: 'tickets', qtd: 3, icone: '🎫', texto: '3 Tickets de Invocação' },
  { dia: 7, tipo: 'ovo', tier: 4, especie: 'Vaelith', icone: '🥚', texto: 'Ovo Abençoado T4 (Vaelith)' },
];

const pad = (n) => String(n).padStart(2, '0');
const comoData = (agora) => (agora instanceof Date ? agora : new Date(agora));
export const chaveMes = (agora = Date.now()) => { const d = comoData(agora); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const diasNoMes = (agora = Date.now()) => { const d = comoData(agora); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
export const diaDoMes = (agora = Date.now()) => comoData(agora).getDate();
export const totalXp = (cfg = PASSE_CFG) => cfg.niveis * cfg.xpPorNivel;

// Cota diária do mês: 30 dias → 3.600; 31 → 3.500; 28 → 3.900. Sempre conclui no dia (dias − folga).
export function cotaDia(dias, cfg = PASSE_CFG) {
  const r = cfg.arredondarCota;
  return Math.ceil(totalXp(cfg) / Math.max(1, dias - cfg.diasFolga) / r) * r;
}

function mesesEntre(a, b) { const [ya, ma] = a.split('-').map(Number); const [yb, mb] = b.split('-').map(Number); return (yb - ya) * 12 + (mb - ma); }

export function edicaoDe(agora = Date.now(), cfg = PASSE_CFG) {
  const id = chaveMes(agora), dias = diasNoMes(agora);
  const tema = cfg.temas[Math.max(0, mesesEntre(cfg.primeiraEdicao, id)) % cfg.temas.length];
  const d = comoData(agora);
  return { id, tema, dias, dia: diaDoMes(agora), cotaDia: cotaDia(dias, cfg), ano: d.getFullYear(), mes: d.getMonth() };
}

export const cotaLiberada = (ed, cfg = PASSE_CFG) => Math.min(totalXp(cfg), ed.cotaDia * ed.dia);
export const nivelPasse = (xp, cfg = PASSE_CFG) => Math.min(cfg.niveis, Math.floor(Math.max(0, xp) / cfg.xpPorNivel));
// Dia do mês em que o calendário libera o XP necessário para o nível n
export const diaQueLibera = (n, ed, cfg = PASSE_CFG) => Math.ceil((n * cfg.xpPorNivel) / ed.cotaDia);

const idleDe = (alvo) => (alvo && alvo.idle) || (alvo && !('recompensas' in alvo) ? alvo : null);

// Garante o passe da edição atual dentro de save.idle. Mês novo zera XP e resgates; os T5 pagos ficam guardados.
export function passeDe(alvo, agora = Date.now(), cfg = PASSE_CFG) {
  const idle = idleDe(alvo); if (!idle) return null;
  const ed = edicaoDe(agora, cfg);
  const p = idle.passe && typeof idle.passe === 'object' ? idle.passe : {};
  const t5Pagos = p.t5Pagos && typeof p.t5Pagos === 'object' ? p.t5Pagos : {};
  const t5PremiumPagos = p.t5PremiumPagos && typeof p.t5PremiumPagos === 'object' ? p.t5PremiumPagos : {};
  if (p.v !== 2 || p.edicao !== ed.id) {
    idle.passe = { v: 2, edicao: ed.id, xp: 0, resgatado: 0, resgatadoPremium: 0, premium: false, premiumPagoEm: null, comprados: 0, descartado: 0, t5Pagos, t5PremiumPagos };
  } else {
    p.xp = Math.max(0, Number(p.xp) || 0); p.resgatado = Math.max(0, Number(p.resgatado) || 0);
    p.resgatadoPremium = Math.max(0, Number(p.resgatadoPremium) || 0);
    p.premium = Boolean(p.premium);
    p.premiumPagoEm = p.premiumPagoEm ? Number(p.premiumPagoEm) : null;
    p.comprados = Number(p.comprados) || 0; p.descartado = Number(p.descartado) || 0;
    p.t5Pagos = t5Pagos; p.t5PremiumPagos = t5PremiumPagos;
  }
  return idle.passe;
}

// Soma XP de Passe respeitando a cota liberada pelo calendário. Devolve { ganho, descartado }.
export function ganharXpPasse(alvo, fonte, quanto = null, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(alvo, agora, cfg); if (!p) return { ganho: 0, descartado: 0 };
  const bruto = Math.max(0, Math.round(quanto ?? cfg.fontes[fonte] ?? 0));
  const espaco = Math.max(0, cotaLiberada(edicaoDe(agora, cfg), cfg) - p.xp);
  const ganho = Math.min(bruto, espaco);
  p.xp += ganho; p.descartado += bruto - ganho;
  return { ganho, descartado: bruto - ganho };
}

// Idle: exatamente 1 XP de Passe por Onírico derrotado (inclusive nos abates liquidados ao reabrir o jogo)
export const xpPasseOffline = (abates, cfg = PASSE_CFG) => Math.max(0, Math.floor(Number(abates) || 0)) * (cfg.fontes.xpPorAbateIdle ?? 1);

// Prêmio de cada nível (todos os 100 níveis têm prêmio). O nível 100 é o ovo temático T5.
export function premioNivel(n, tema = PASSE_CFG.temas[0]) {
  const nome = (lista, i, tipo) => (lista && lista[i % lista.length]) || `${tipo} ${tema.nome} ${i + 1}`;
  if (n === 100) {
    const elenco = tema.elencoT5?.length ? [...tema.elencoT5] : [tema.especieT5];
    return { tipo: 'ovoT5', tier: 5, especie: elenco[0], elenco, texto: tema.ovoNome || `Ovo temático T5 (${tema.nome})` };
  }
  if (n % 25 === 0) { const i = n / 25 - 1; const v = nome(tema.montarias, i, 'Montaria'); return { tipo: 'montaria', id: `${tema.id}-montaria-${i + 1}`, nome: v, texto: `Montaria: ${v}` }; }
  if (n % 10 === 0) { const tier = Math.ceil(n / 25); return { tipo: 'ovo', tier, texto: `Ovo T${tier}` }; }
  if (n % 20 === 5) { const i = (n - 5) / 20; const v = nome(tema.molduras, i, 'Moldura'); return { tipo: 'moldura', id: `${tema.id}-moldura-${i + 1}`, nome: v, texto: `Moldura: ${v}` }; }
  if (n % 20 === 15) { const i = (n - 15) / 20; const v = nome(tema.casa, i, 'Item da Casa'); return { tipo: 'casa', id: `${tema.id}-casa-${i + 1}`, nome: v, texto: `Casa: ${v}` }; }
  if (n % 10 === 7) { const i = (n - 7) / 10; const v = nome(tema.acessorios, i, 'Acessório'); return { tipo: 'acessorio', id: `${tema.id}-acessorio-${i + 1}`, nome: v, texto: `Acessório: ${v}` }; }
  if (n % 2 === 0) { const q = 1 + Math.floor(n / 30); return { tipo: 'tickets', qtd: q, texto: `${q} Ticket${q > 1 ? 's' : ''}` }; }
  const q = 20 + 5 * Math.floor(n / 20); return { tipo: 'diamantes', qtd: q, texto: `${q} 💎` };
}

const MOLDURAS_PREMIUM_DINO = { 10: ['ambar-fossil', 'Âmbar Fóssil'], 30: ['ossada-antiga', 'Ossada Antiga'], 60: ['pegadas-no-barro', 'Pegadas no Barro'], 90: ['vulcao-adormecido', 'Vulcão Adormecido'] };
const ICONES_PREMIUM_DINO = { 20: ['icone-tiranox', 'Ícone Tiranox'], 40: ['icone-tricerax', 'Ícone Tricerax'], 70: ['icone-veloxar', 'Ícone Veloxar'], 80: ['icone-pteronox', 'Ícone Pteronox'] };
const PARES_EVO_PREMIUM = ['ignea', 'mares', 'verde', 'mineral', 'solar', 'sombria', 'glacial', 'draconica', 'arcana'];
const ELENCO_T5_BANNER_PERMANENTE = ['Ignaraz', 'Vaelirion', 'Florivel'];

// Trilha Premium (5.000💎): dobro de diamantes da grátis, molduras/ícones exclusivos, materiais de evolução,
// 20 tickets de evento, 20 de invocação mensal, 20 de banner quinzenal e 2 ovos T5 (Nv.50 Permanente + Nv.100 Dinossauro).
export function premioNivelPremium(n, tema = PASSE_CFG.temas[0]) {
  if (n === 50) {
    return { tipo: 'ovoT5Permanente', tier: 5, especie: ELENCO_T5_BANNER_PERMANENTE[0], elenco: [...ELENCO_T5_BANNER_PERMANENTE], texto: 'Ovo T5 do Banner Permanente' };
  }
  if (n === 100) {
    const elenco = tema.elencoT5?.length ? [...tema.elencoT5] : [tema.especieT5];
    return { tipo: 'ovoT5Temporada', tier: 5, especie: elenco[0], elenco, texto: tema.ovoNome || `Ovo T5 (${tema.nome})` };
  }
  if (MOLDURAS_PREMIUM_DINO[n]) {
    const [id, nome] = MOLDURAS_PREMIUM_DINO[n];
    return { tipo: 'molduraPerfil', id, nome, texto: `Moldura: ${nome}` };
  }
  if (ICONES_PREMIUM_DINO[n]) {
    const [id, nome] = ICONES_PREMIUM_DINO[n];
    return { tipo: 'iconePerfil', id, nome, texto: `Ícone: ${nome}` };
  }
  if (n % 10 === 2) return { tipo: 'ticketsEvento', qtd: 2, texto: '2 Tickets de Evento' };
  if (n % 10 === 4) return { tipo: 'ticketsMensais', qtd: 2, texto: '2 Tickets Mensais' };
  if (n % 10 === 6) return { tipo: 'ticketsQuinzenais', qtd: 2, texto: '2 Tickets Quinzenais' };
  const gratis = premioNivel(n, tema);
  if (gratis.tipo === 'diamantes') {
    const q = gratis.qtd * 2;
    return { tipo: 'diamantes', qtd: q, texto: `${q} 💎` };
  }
  const par = PARES_EVO_PREMIUM[n % PARES_EVO_PREMIUM.length];
  if (n % 10 === 8) return { tipo: 'essencia', par, tamanho: n >= 70 ? 'maior' : n >= 35 ? 'media' : 'menor', qtd: n >= 70 ? 2 : n >= 35 ? 4 : 8, texto: `Essências (${par})` };
  return { tipo: 'fragmentosSonho', elemento: n % 2 === 0 ? 'fogo' : 'terra', qtd: 5, texto: '5 Fragmentos de Sonho' };
}

// Abre um ovo temático T5 usando a temporada/tema persistidos no próprio ovo (funciona mesmo após o fim da edição).
export function abrirOvoPasse(ovo, rng = Math.random, cfg = PASSE_CFG) {
  const tema = cfg.temas.find((t) => t.id === ovo?.tema) || cfg.temas[0];
  const elenco = (Array.isArray(ovo?.elenco) && ovo.elenco.length ? ovo.elenco : tema.elencoT5) || [ovo?.especie || tema.especieT5];
  const idx = Math.min(elenco.length - 1, Math.floor(rng() * elenco.length));
  return {
    especie: elenco[idx],
    nivel: 1,
    xp: 0,
    tier: 5,
    raridade: 5,
    estrelas: 1,
    forma: ovo?.forma || 'abencoada',
    temporada: ovo?.temporada || null,
    tema: ovo?.tema || tema.id,
  };
}

const ESPECIES_OVO = ['Ignavor', 'Vaelith', 'Brotavel', 'Solarin'];
function entregar(save, idle, pr, n, ed, agora) {
  const moch = idle.mochila || (idle.mochila = {}); moch.ovos = moch.ovos || [];
  const col = idle.colecao || (idle.colecao = {});
  const add = (k, id) => { col[k] = col[k] || []; if (!col[k].includes(id)) col[k].push(id); };
  switch (pr.tipo) {
    case 'diamantes': save.recompensas.diamantes = (save.recompensas.diamantes || 0) + pr.qtd; break;
    case 'tickets': { const e = idle.exp || (idle.exp = {}); e.tickets = (e.tickets || 0) + pr.qtd; break; }
    case 'ticketsEvento': { const e = idle.exp || (idle.exp = {}); e.ticketsEvento = (e.ticketsEvento || 0) + pr.qtd; break; }
    case 'ticketsMensais': { const e = idle.exp || (idle.exp = {}); e.ticketsMensais = (e.ticketsMensais || 0) + pr.qtd; break; }
    case 'ticketsQuinzenais': { const e = idle.exp || (idle.exp = {}); e.ticketsQuinzenais = (e.ticketsQuinzenais || 0) + pr.qtd; break; }
    case 'essencia': {
      idle.essencias = idle.essencias || {};
      const cur = idle.essencias[pr.par] || (idle.essencias[pr.par] = { menor: 0, media: 0, maior: 0 });
      cur[pr.tamanho] = (cur[pr.tamanho] || 0) + pr.qtd;
      break;
    }
    case 'fragmentosSonho': {
      moch.fragmentosSonho = moch.fragmentosSonho || {};
      moch.fragmentosSonho[pr.elemento] = (moch.fragmentosSonho[pr.elemento] || 0) + pr.qtd;
      break;
    }
    case 'molduraPerfil': {
      add('molduras', pr.id);
      idle.jogador = idle.jogador || {};
      idle.jogador.perfil = idle.jogador.perfil || { moldura: 'farol', icone: 'padrao', desbloqueadas: ['farol'], iconesDesbloqueados: ['padrao'] };
      if (!Array.isArray(idle.jogador.perfil.desbloqueadas)) idle.jogador.perfil.desbloqueadas = ['farol'];
      if (!idle.jogador.perfil.desbloqueadas.includes(pr.id)) idle.jogador.perfil.desbloqueadas.push(pr.id);
      break;
    }
    case 'iconePerfil': {
      add('icones', pr.id);
      idle.jogador = idle.jogador || {};
      idle.jogador.perfil = idle.jogador.perfil || { moldura: 'farol', icone: 'padrao', desbloqueadas: ['farol'], iconesDesbloqueados: ['padrao'] };
      if (!Array.isArray(idle.jogador.perfil.iconesDesbloqueados)) idle.jogador.perfil.iconesDesbloqueados = ['padrao'];
      if (!idle.jogador.perfil.iconesDesbloqueados.includes(pr.id)) idle.jogador.perfil.iconesDesbloqueados.push(pr.id);
      break;
    }
    case 'ovo': moch.ovos.push({ especie: ESPECIES_OVO[(n / 10 - 1) % ESPECIES_OVO.length], forma: 'natural', tier: pr.tier, origem: `passe-${ed.id}`, obtidoEm: agora }); break;
    case 'montaria': add('montarias', pr.id); break;
    case 'moldura': add('molduras', pr.id); break;
    case 'casa': add('casa', pr.id); break;
    case 'acessorio': add('acessorios', pr.id); break;
    default: break;
  }
}

// Resgata todos os níveis alcançados e ainda não pagos. O T5 é pago uma única vez por edição (marcado em t5Pagos).
export function resgatarPasse(save, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(save, agora, cfg); const idle = save.idle; const ed = edicaoDe(agora, cfg);
  const nv = nivelPasse(p.xp, cfg); const pagos = [];
  for (let n = p.resgatado + 1; n <= nv; n++) {
    const pr = premioNivel(n, ed.tema);
    if (pr.tipo === 'ovoT5') {
      if (!p.t5Pagos[ed.id]) {
        p.t5Pagos[ed.id] = true;
        idle.mochila = idle.mochila || {}; idle.mochila.ovos = idle.mochila.ovos || [];
        idle.mochila.ovos.push({
          tipo: 'ovoT5',
          nome: pr.texto,
          especie: pr.especie,
          elenco: pr.elenco,
          forma: 'abencoada',
          tier: 5,
          temporada: ed.id,
          tema: ed.tema.id,
          origem: `passe-${ed.id}`,
          obtidoEm: agora,
        });
        pagos.push(pr);
      }
    } else { entregar(save, idle, pr, n, ed, agora); pagos.push(pr); }
  }
  p.resgatado = Math.max(p.resgatado, nv);
  const pagosPremium = [];
  if (p.premium) {
    for (let n = p.resgatadoPremium + 1; n <= nv; n++) {
      const pr = premioNivelPremium(n, ed.tema);
      if (pr.tipo === 'ovoT5Permanente' || pr.tipo === 'ovoT5Temporada') {
        const chave = `${ed.id}:${pr.tipo}`;
        if (!p.t5PremiumPagos[chave]) {
          p.t5PremiumPagos[chave] = true;
          idle.mochila = idle.mochila || {}; idle.mochila.ovos = idle.mochila.ovos || [];
          idle.mochila.ovos.push({
            tipo: 'ovoT5',
            subtipo: pr.tipo,
            nome: pr.texto,
            especie: pr.especie,
            elenco: pr.elenco,
            forma: 'abencoada',
            tier: 5,
            temporada: ed.id,
            tema: pr.tipo === 'ovoT5Permanente' ? 'permanente' : ed.tema.id,
            origem: `passe-premium-${ed.id}`,
            obtidoEm: agora,
          });
          pagosPremium.push(pr);
        }
      } else {
        entregar(save, idle, pr, n, ed, agora);
        pagosPremium.push(pr);
      }
    }
    p.resgatadoPremium = Math.max(p.resgatadoPremium, nv);
  }
  return { nivel: nv, pagos, pagosPremium };
}

export function comprarPassePremium(save, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(save, agora, cfg);
  if (!p) return { ok: false, motivo: 'Save inválido.' };
  if (p.premium) return { ok: false, jaAtivo: true, motivo: 'Passe Premium já está ativo nesta edição.' };
  const custo = cfg.precoPremium || 5000;
  save.recompensas = save.recompensas || { gold: 0, diamantes: 0, xp: 0 };
  if ((save.recompensas.diamantes || 0) < custo) {
    return { ok: false, motivo: `Precisa de ${custo} 💎 para ativar o Passe Premium.` };
  }
  save.recompensas.diamantes -= custo;
  p.premium = true;
  p.premiumPagoEm = agora;
  return { ok: true, edicao: p.edicao, custo, premium: true };
}

// Compra 1 nível por 150 💎, só se o calendário já liberou o XP desse nível (mesmo teto sazonal).
export function comprarNivelPasse(save, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(save, agora, cfg); const ed = edicaoDe(agora, cfg);
  const nv = nivelPasse(p.xp, cfg); const alvo = nv + 1;
  if (nv >= cfg.niveis) return { ok: false, motivo: 'Passe concluído.' };
  if (alvo * cfg.xpPorNivel > cotaLiberada(ed, cfg)) return { ok: false, motivo: `O nível ${alvo} abre no dia ${diaQueLibera(alvo, ed, cfg)}.` };
  if ((save.recompensas.diamantes || 0) < cfg.precoNivel) return { ok: false, motivo: `Precisa de ${cfg.precoNivel} 💎.` };
  save.recompensas.diamantes -= cfg.precoNivel;
  p.xp = alvo * cfg.xpPorNivel; p.comprados += 1;
  return { ok: true, nivel: alvo, custo: cfg.precoNivel };
}

// Resumo para a interface: nível, XP, cota liberada, recuperável e o que vem a seguir.
export function infoPasse(alvo, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(alvo, agora, cfg); const ed = edicaoDe(agora, cfg);
  const liberada = cotaLiberada(ed, cfg); const nv = nivelPasse(p.xp, cfg);
  const prox = Math.min(cfg.niveis, nv + 1);
  const diaProx = diaQueLibera(prox, ed, cfg);
  const faixaFim = Math.min(cfg.niveis, Math.ceil((nivelPasse(liberada, cfg) + 1) / 25) * 25);
  const dataDe = (dia) => new Date(ed.ano, ed.mes, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return {
    edicao: ed.id, tema: ed.tema.nome, dias: ed.dias, dia: ed.dia, cotaDia: ed.cotaDia,
    nivel: nv, xp: p.xp, xpNoNivel: p.xp - nv * cfg.xpPorNivel, xpPorNivel: cfg.xpPorNivel, niveis: cfg.niveis,
    liberada, nivelLiberado: nivelPasse(liberada, cfg), recuperavel: Math.max(0, liberada - p.xp), noTeto: p.xp >= liberada,
    resgatado: p.resgatado, aResgatar: Math.max(0, nv - p.resgatado), t5Pago: !!p.t5Pagos[ed.id],
    premium: Boolean(p.premium), precoPremium: cfg.precoPremium || 5000,
    resgatadoPremium: p.resgatadoPremium || 0, aResgatarPremium: p.premium ? Math.max(0, nv - (p.resgatadoPremium || 0)) : 0,
    proximo: nv >= cfg.niveis ? null : {
      nivel: prox, premio: premioNivel(prox, ed.tema), preco: cfg.precoNivel,
      liberado: prox * cfg.xpPorNivel <= liberada, dia: diaProx, data: dataDe(Math.min(ed.dias, diaProx)),
    },
    proximaFaixa: liberada >= totalXp(cfg) ? null : { ate: faixaFim, dia: diaQueLibera(faixaFim, ed, cfg), data: dataDe(Math.min(ed.dias, diaQueLibera(faixaFim, ed, cfg))) },
  };
}

// Trilha navegável dos 100 níveis do Passe com estado de cada degrau (coletado | pronto | liberado | bloqueado)
export function trilhaPasse(alvo, agora = Date.now(), cfg = PASSE_CFG) {
  const p = passeDe(alvo, agora, cfg); const ed = edicaoDe(agora, cfg);
  const liberada = cotaLiberada(ed, cfg); const nv = nivelPasse(p.xp, cfg);
  const itens = [];
  for (let n = 1; n <= cfg.niveis; n++) {
    const premio = premioNivel(n, ed.tema);
    const premioPremium = premioNivelPremium(n, ed.tema);
    const coletado = n <= p.resgatado || (n === 100 && !!p.t5Pagos[ed.id]);
    const alcancado = n <= nv;
    const liberadoCalendario = n * cfg.xpPorNivel <= liberada;
    const estado = coletado ? 'coletado' : alcancado ? 'pronto' : liberadoCalendario ? 'liberado' : 'bloqueado';
    const coletadoPremium = Boolean(p.premium) && n <= (p.resgatadoPremium || 0);
    const estadoPremium = !p.premium ? 'bloqueado-premium' : coletadoPremium ? 'coletado' : alcancado ? 'pronto' : liberadoCalendario ? 'liberado' : 'bloqueado';
    itens.push({ nivel: n, premio, premioPremium, estado, estadoPremium, diaAbertura: diaQueLibera(n, ed, cfg) });
  }
  return itens;
}

// ---- Login de 7 Dias (painel próprio sobre o Passe, com recompensas exclusivas e pagamento único por dia) ----
const diaBr = (agoraMs) => Math.floor((Number(agoraMs) - 3 * 3600000) / 86400000);

export function infoLogin7Dias(alvo, agoraMs = Date.now(), catalogo = LOGIN_7D_CATALOGO) {
  const idle = idleDe(alvo) || {};
  const login = idle.login && typeof idle.login === 'object' ? idle.login : { streak: 0, lastDay: -1 };
  const hoje = diaBr(agoraMs);
  const jaColetouHoje = login.lastDay === hoje;
  const streakBase = jaColetouHoje
    ? Math.max(1, Number(login.streak) || 1)
    : (login.lastDay === hoje - 1 ? ((Number(login.streak) || 0) % catalogo.length) + 1 : 1);
  const diaDisponivel = jaColetouHoje ? null : streakBase;
  const coletados = jaColetouHoje ? streakBase : streakBase - 1;
  const proximoDia = jaColetouHoje ? (streakBase % catalogo.length) + 1 : streakBase;
  const dias = catalogo.map((r) => {
    const estado = r.dia <= coletados ? 'coletado' : r.dia === diaDisponivel ? 'disponivel' : 'proximo';
    return { ...r, estado };
  });
  return {
    hoje,
    jaColetouHoje,
    diaDisponivel,
    coletados,
    proximoDia,
    proximoPremio: catalogo.find((r) => r.dia === proximoDia) || catalogo[0],
    dias,
  };
}

