// Elenco por reino (dados puros). Cada linhagem conta UMA vez, não importa quantas formas tenha.
// origem: 'nativa' (nasce no reino), 'visitante' (vinda de outro reino), 'nova' (tipo extra do reino), 'existente' (já no catálogo).
// forma: nome da forma intermediária (a "atual"), usada em combate. arte: pasta com 01/02/03.png quando já está ilustrada.
// Nomes das linhagens novas são provisórios. Metal = elemento 'aco' do núcleo.
const ARTE = '../assets/confusion/interface/estrategia/reinos';
const L = (nome, elemento, origem, extra = {}) => ({ nome, elemento, origem, ...extra });
const ilustrada = (reino, pasta) => ({ arte: `assets/confusion/interface/estrategia/reinos/${reino}/oniricos/${pasta}/02.png`, ilustrada: true });

export const REINOS = {
  1: {
    nome: 'Vale de Outono',
    tipos: ['inseto', 'planta', 'agua', 'terra', 'pedra'],
    // um tipo por linhagem (atribuição provisória, a confirmar)
    linhagens: [
      L('Fanalino', 'inseto', 'nativa', ilustrada('01', 'fanalino')),
      L('Cervomusgo', 'planta', 'nativa'),
      L('Cobrabúfalo', 'agua', 'nativa', ilustrada('01', 'cobrabufalo')),
      L('Tatuveludo', 'terra', 'nativa'),
      L('Xistolim', 'pedra', 'nativa', ilustrada('01', 'xistolim')),
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
      L('Melifalcão', 'voador', 'nativa', ilustrada('02', 'melifalcao')),
      L('Lavândria', 'planta', 'nativa', ilustrada('02', 'lavandria')),
      L('Calquélon', 'pedra', 'nativa', ilustrada('02', 'calquelon')),
      L('Vesprata', 'aco', 'nativa'),
      L('Colmeiro', 'inseto', 'nativa'),
      // 5 visitantes do Reino 1, uma de cada tipo
      L('Fanalino', 'inseto', 'visitante', { reino: 1, ...ilustrada('01', 'fanalino') }),
      L('Cervomusgo', 'planta', 'visitante', { reino: 1 }),
      L('Cobrabúfalo', 'agua', 'visitante', { reino: 1, ...ilustrada('01', 'cobrabufalo') }),
      L('Tatuveludo', 'terra', 'visitante', { reino: 1 }),
      L('Xistolim', 'pedra', 'visitante', { reino: 1, ...ilustrada('01', 'xistolim') }),
      // 10 de tipos novos: 3 fogo, 3 elétrico, 2 voador, 2 metal
      L('Ignavor', 'fogo', 'existente', { arte: 'assets/monsters/ignavor/sprite-front.png', ilustrada: true }),
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
