// Elenco por reino (dados puros). Cada linhagem conta UMA vez, não importa quantas formas tenha.
// origem: 'nativa' (nasce no reino), 'visitante' (vinda de outro reino), 'nova' (tipo extra do reino), 'existente' (já no catálogo).
// forma: nome da forma intermediária (a "atual"), usada em combate. arte: pasta com 01/02/03.png quando já está ilustrada.
// Nomes das linhagens novas são provisórios. Metal = elemento 'aco' do núcleo.
const RAIZ = 'assets/confusion/interface/estrategia/reinos';
const slug = (n) => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Formas 01/02/03 = base, intermediária, final. Visitantes usam a pasta do reino de origem ({ reino }). Ignavor usa as artes existentes.
export function formasDaLinhagem(l, reinoAtual = 2) {
  if (l.nome === 'Ignavor') return [`${RAIZ}/existentes/ignavor/01-brasinha.png`, 'assets/monsters/ignavor/sprite-front.png', `${RAIZ}/existentes/ignavor/03-ignaraz.png`];
  const r = String(l.reino ?? reinoAtual).padStart(2, '0');
  return [1, 2, 3].map((n) => `${RAIZ}/${r}/oniricos/${slug(l.nome)}/0${n}.png`);
}
const L = (nome, elemento, origem, extra = {}) => { const { reinoPasta, ...resto } = extra; const l = { nome, elemento, origem, ...resto }; const f = formasDaLinhagem(l, reinoPasta); return { ...l, formas: f, arte: f[1], ilustrada: true }; };
const ilustrada = () => ({});

export const REINOS = {
  1: {
    nome: 'Vale de Outono',
    tipos: ['inseto', 'planta', 'agua', 'terra', 'pedra'],
    // um tipo por linhagem (atribuição provisória, a confirmar)
    linhagens: [
      L('Fanalino', 'inseto', 'nativa', { reinoPasta: 1 }),
      L('Cervomusgo', 'planta', 'nativa', { reinoPasta: 1 }),
      L('Cobrabúfalo', 'agua', 'nativa', { reinoPasta: 1 }),
      L('Tatuveludo', 'terra', 'nativa', { reinoPasta: 1 }),
      L('Xistolim', 'pedra', 'nativa', { reinoPasta: 1 }),
    ],
  },
  2: {
    nome: 'Altos do Âmbar',
    tipos: ['inseto', 'planta', 'agua', 'terra', 'pedra', 'fogo', 'eletrico', 'voador', 'aco'],
    // Áreas do reino (rotas) e os tipos que aparecem em cada uma
    areas: {
      apiarios: { nome: 'Apiários', icone: '🐝', tipos: ['inseto', 'planta', 'terra'] },
      falesias: { nome: 'Falésias', icone: '🪽', tipos: ['voador', 'pedra', 'agua'] },
      cristas: { nome: 'Cristas de tempestade', icone: '⚡', tipos: ['eletrico', 'voador', 'agua'] },
      fornos: { nome: 'Fornos de cera', icone: '🔥', tipos: ['fogo', 'terra', 'planta'] },
      ruinas: { nome: 'Ruínas de bronze', icone: '🛡️', tipos: ['aco', 'pedra', 'eletrico'] },
    },
    linhagens: [
      // 5 nativas (ilustradas ou previstas no REINOS.md)
      L('Melifalcão', 'voador', 'nativa'),
      L('Lavândria', 'inseto', 'nativa'),
      L('Calquélon', 'pedra', 'nativa'),
      L('Vesprata', 'aco', 'nativa'),
      L('Colmeiro', 'inseto', 'nativa'),
      // 5 visitantes do Reino 1, uma de cada tipo
      L('Fanalino', 'inseto', 'visitante', { reino: 1 }),
      L('Cervomusgo', 'planta', 'visitante', { reino: 1 }),
      L('Cobrabúfalo', 'agua', 'visitante', { reino: 1 }),
      L('Tatuveludo', 'terra', 'visitante', { reino: 1 }),
      L('Xistolim', 'pedra', 'visitante', { reino: 1 }),
      // 10 de tipos novos: 3 fogo, 3 elétrico, 2 voador, 2 metal
      L('Ignavor', 'fogo', 'existente'),
      L('Cerifogo', 'fogo', 'nova'),
      L('Âmbarasa', 'fogo', 'nova'),
      L('Zunifaísca', 'eletrico', 'nova'),
      L('Trovoresta', 'eletrico', 'nova'),
      L('Voltabelha', 'eletrico', 'nova'),
      L('Falesário', 'voador', 'nova'),
      L('Ventassol', 'voador', 'nova'),
      L('Bronzelo', 'aco', 'nova'),
      L('Latonhorn', 'aco', 'nova'),
    ],
  },
};

export const linhagensDoReino = (n) => REINOS[n]?.linhagens ?? [];
export const contagemPorTipo = (n) => linhagensDoReino(n).reduce((m, l) => ((m[l.elemento] = (m[l.elemento] || 0) + 1), m), {});
// Quem pode aparecer numa área: linhagens cujo tipo a área aceita, sem repetir (cada linhagem uma vez)
export function elencoDaArea(n, areaId) {
  const a = REINOS[n]?.areas?.[areaId]; if (!a) return [];
  const vistos = new Set();
  return linhagensDoReino(n).filter((l) => a.tipos.includes(l.elemento) && !vistos.has(l.nome) && vistos.add(l.nome));
}
export const semArte = (n) => linhagensDoReino(n).filter((l) => !l.ilustrada).map((l) => l.nome);
