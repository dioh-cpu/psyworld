// Dados do modo Estratégia para C1 (Cidade, Região 1). As regras ficam em regiao1-estrategia-regras.js e valem para qualquer região:
// outra cidade = outro arquivo com este formato. Tudo que é número de balanceamento está aqui (custos, faixas, ganhos).
// `arte`: { sis, vaga } aponta para assets/confusion/interface/mundo/<sis>/<vaga>.webp; `estr:` aponta para
// assets/confusion/interface/estrategia/<nome>.webp. Sem o arquivo, aparece um polígono com o emoji.
export const ESTRATEGIA_C1 = {
  id: 'r1',
  titulo: 'Vale de Outono (Reino 1)',
  fundo: 'assets/confusion/interface/estrategia/cidade-expansao-30.webp',
  prosperidadeBase: 40,
  materiais: { madeira: { nome: 'Madeira', icone: '🪵' }, pedra: { nome: 'Pedra', icone: '🪨' } },
  inicial: { madeira: 0, pedra: 0 },
  // Gestão: vagas de obra simultâneas, teto de estoque por material, horas máximas que um prédio acumula e receitas da oficina.
  gestao: {
    vagasObra: 2, capacidade: { madeira: 150, pedra: 150 }, capProducaoHoras: 8, filaFabricacao: 3,
    receitas: [
      { id: 'tabua', nome: 'Tábua', icone: '🪚', insumos: { madeira: 2 }, saida: { tabua: 1 }, seg: 20 },
      { id: 'bloco', nome: 'Bloco de pedra', icone: '🧱', insumos: { pedra: 2 }, saida: { bloco: 1 }, seg: 25 },
      { id: 'kit', nome: 'Kit de reparo', icone: '🧰', insumos: { madeira: 3, pedra: 3 }, saida: { kit: 1 }, seg: 40 },
    ],
    itens: { tabua: { nome: 'Tábua', icone: '🪚' }, bloco: { nome: 'Bloco de pedra', icone: '🧱' }, kit: { nome: 'Kit de reparo', icone: '🧰' } },
  },
  vagasIniciais: 2, // A primeira vitória de cada fase libera vagas até o limite de quatro.

  // Papel de cada espécie no combate: ataque, defesa (atrai golpes) ou suporte (cura aliados)
  papeis: {
    Noctarn: 'ataque', Ignavor: 'ataque', Vaelith: 'suporte', Lumivela: 'suporte', Brotavel: 'defesa', Cristalino: 'defesa',
    Solarin: 'suporte', Sementil: 'defesa', Florivel: 'suporte', Solinho: 'ataque', Helíssio: 'ataque', Brasinha: 'ataque',
  },

  // Locais da cidade (em % do mapa). Cada local aceita uma categoria de estrutura.
  // 30 terrenos do Vale de Outono (mapa cidade-expansao-30). `nivelPrincipal`: nível da Prefeitura que libera o terreno (1, 5, 10, 15, 20, 25, 30).
  principalLote: 'p1',
  locais: [
    { id: 'a1', categoria: 'aldeias', pos: [39.4, 35.4], nivelPrincipal: 1 },
    { id: 'p1', categoria: 'principal', pos: [39.4, 49.3], nivelPrincipal: 1 },
    { id: 'e1', categoria: 'exercitos', pos: [39.4, 63.3], nivelPrincipal: 1 },
    { id: 'a2', categoria: 'aldeias', pos: [60.5, 35.4], nivelPrincipal: 1 },
    { id: 'r1', categoria: 'refugios', pos: [60.5, 49.3], nivelPrincipal: 1 },
    { id: 'h1', categoria: 'hospitais', pos: [60.5, 63.3], nivelPrincipal: 1 },
    { id: 'a3', categoria: 'aldeias', pos: [39.4, 21.5], nivelPrincipal: 5 },
    { id: 'r2', categoria: 'refugios', pos: [60.5, 21.5], nivelPrincipal: 5 },
    { id: 'e2', categoria: 'exercitos', pos: [39.4, 77.3], nivelPrincipal: 5 },
    { id: 'h2', categoria: 'hospitais', pos: [60.5, 77.3], nivelPrincipal: 5 },
    { id: 'a4', categoria: 'aldeias', pos: [29.4, 35.4], nivelPrincipal: 10 },
    { id: 'r3', categoria: 'refugios', pos: [70.6, 35.4], nivelPrincipal: 10 },
    { id: 'e3', categoria: 'exercitos', pos: [29.4, 63.3], nivelPrincipal: 10 },
    { id: 'h3', categoria: 'hospitais', pos: [70.6, 63.3], nivelPrincipal: 10 },
    { id: 'a5', categoria: 'aldeias', pos: [29.4, 21.5], nivelPrincipal: 15 },
    { id: 'r4', categoria: 'refugios', pos: [70.6, 21.5], nivelPrincipal: 15 },
    { id: 'e4', categoria: 'exercitos', pos: [29.4, 49.3], nivelPrincipal: 15 },
    { id: 'h4', categoria: 'hospitais', pos: [70.6, 49.3], nivelPrincipal: 15 },
    { id: 'a6', categoria: 'aldeias', pos: [29.4, 77.3], nivelPrincipal: 20 },
    { id: 'r5', categoria: 'refugios', pos: [70.6, 77.3], nivelPrincipal: 20 },
    { id: 'e5', categoria: 'exercitos', pos: [19.3, 49.3], nivelPrincipal: 20 },
    { id: 'h5', categoria: 'hospitais', pos: [80.7, 49.3], nivelPrincipal: 20 },
    { id: 'a7', categoria: 'aldeias', pos: [19.3, 35.4], nivelPrincipal: 25 },
    { id: 'r6', categoria: 'refugios', pos: [80.7, 35.4], nivelPrincipal: 25 },
    { id: 'e6', categoria: 'exercitos', pos: [19.3, 63.3], nivelPrincipal: 25 },
    { id: 'h6', categoria: 'hospitais', pos: [80.7, 63.3], nivelPrincipal: 25 },
    { id: 'a8', categoria: 'aldeias', pos: [19.3, 21.5], nivelPrincipal: 30 },
    { id: 'r7', categoria: 'refugios', pos: [80.7, 21.5], nivelPrincipal: 30 },
    { id: 'e7', categoria: 'exercitos', pos: [19.3, 77.3], nivelPrincipal: 30 },
    { id: 'h7', categoria: 'hospitais', pos: [80.7, 77.3], nivelPrincipal: 30 },
  ],

  categorias: {
    principal: { nome: 'Prefeitura', icone: '🏛️', descricao: 'A construção principal do reino. Cada nível libera mais terrenos no mapa (níveis 1, 5, 10, 15, 20, 25 e 30).' },
    aldeias: { nome: 'Aldeias', icone: '🏘️', descricao: 'Fundar, reconstruir e melhorar. As obras mudam a aparência da cidade e elevam a prosperidade.' },
    refugios: { nome: 'Refúgios', icone: '🛖', descricao: 'Abrigo e descanso. Protege contra a praga e dá vida extra às equipes nas expedições.' },
    exercitos: { nome: 'Exércitos', icone: '⚔️', descricao: 'Quartel e guarnição. Treina as equipes: mais ataque e defesa nas expedições.' },
    hospitais: { nome: 'Hospitais', icone: '🏥', descricao: 'Enfermaria. Trata os feridos entre as fases de uma expedição.' },
    expedicoes: { nome: 'Expedições', icone: '🧭', descricao: 'Escolha a rota de materiais e monte a equipe com seus Oníricos.' },
  },

  // Estruturas. custo = nível 1; cada nível seguinte custa +60%. prosperidade = ganho por nível. bonus = por nível.
  estruturas: [
    {
      id: 'prefeitura', categoria: 'principal', nome: 'Prefeitura', emoji: '🏛️', niveis: 30, custo: { madeira: 6, pedra: 2 }, crescimento: 0.12, prosperidade: Array(30).fill(1), duracaoBase: 20, duracaoCresc: 0.1,
      beneficio: 'Construção principal: libera novos terrenos nos níveis 5, 10, 15, 20, 25 e 30.',
      visual: { vazio: { estr: 'terreno', nome: 'Terreno da Prefeitura' }, niveis: Array.from({ length: 30 }, (_, i) => ({ estr: 'aldeia', escala: 1 + Math.min(0.5, i * 0.02) })) },
    },
    {
      id: 'casas', categoria: 'aldeias', nome: 'Casas', emoji: '🏘️', niveis: 3, custo: { madeira: 12, pedra: 3 }, prosperidade: [10, 8, 6], duracao: [30, 60, 120], producao: { tipo: 'madeira', porHora: 10 },
      beneficio: 'Reconstrói moradias: mais prosperidade e mais moradores voltando à cidade.',
      visual: { vazio: { arte: { sis: '01', vaga: 'vila-ruinas' }, nome: 'Casas em ruínas' }, niveis: [{ arte: { sis: '01', vaga: 'vila-saudavel' }, escala: 1 }, { arte: { sis: '01', vaga: 'vila-saudavel' }, escala: 1.12 }, { arte: { sis: '01', vaga: 'vila-saudavel' }, escala: 1.24 }] },
    },
    {
      id: 'abrigo', categoria: 'refugios', nome: 'Abrigo', emoji: '🛖', niveis: 2, custo: { madeira: 20, pedra: 14 }, prosperidade: [4, 3], duracao: [45, 90], producao: { tipo: 'madeira', porHora: 4 }, bonus: { hp: 0.05 }, protecaoPraga: true,
      beneficio: 'Protege a cidade da praga (sistema Refúgios) e dá +5% de vida às equipes por nível.',
      visual: { vazio: { estr: 'terreno', nome: 'Terreno livre' }, niveis: [{ arte: { sis: '05', vaga: 'refugio' }, escala: 1 }, { arte: { sis: '05', vaga: 'fortaleza' }, escala: 1 }] },
    },
    {
      id: 'quartel', categoria: 'exercitos', nome: 'Quartel', emoji: '⚔️', niveis: 3, custo: { madeira: 14, pedra: 24 }, prosperidade: [3, 3, 3], duracao: [40, 80, 160], producao: { tipo: 'pedra', porHora: 8 }, bonus: { atk: 0.04, def: 0.04 },
      beneficio: 'Treina a guarnição: +4% de ataque e defesa às equipes por nível.',
      visual: { vazio: { estr: 'terreno', nome: 'Terreno livre' }, niveis: [{ estr: 'quartel', escala: 1 }, { estr: 'quartel', escala: 1.12 }, { estr: 'quartel', escala: 1.24 }] },
    },
    {
      id: 'enfermaria', categoria: 'hospitais', nome: 'Enfermaria', emoji: '🏥', niveis: 3, custo: { madeira: 22, pedra: 18 }, prosperidade: [4, 3, 3], duracao: [40, 80, 160], producao: { tipo: 'pedra', porHora: 3 }, bonus: { cura: 0.12 },
      beneficio: 'Trata os feridos: recupera 12% da vida das equipes por nível entre as fases.',
      visual: { vazio: { estr: 'terreno', nome: 'Terreno livre' }, niveis: [{ estr: 'enfermaria', escala: 1 }, { estr: 'enfermaria', escala: 1.12 }, { estr: 'enfermaria', escala: 1.24 }] },
    },
  ],

  // Rotas: 3 fases cada, com dificuldade crescente. Faixas previsíveis. A primeira vitória em cada fase paga uma vez e `libera`:
  // um Onírico novo passa a aparecer como INIMIGO e abre mais uma vaga na equipe. Oníricos do jogador vêm do gacha e dos ovos.
  rotas: [
    {
      id: 'floresta', nome: 'Trilha da Floresta', icone: '🌲', material: 'madeira', descricao: 'Madeira para as casas. Inimigos de planta, no começo fracos.',
      fases: [
        { nome: 'Clareira', inimigos: [2, 2], nivel: [1, 1], especies: ['Brotavel', 'Sementil', 'Brotavel', 'Noctarn'], material: { tipo: 'madeira', faixa: [10, 14] }, secundario: { tipo: 'pedra', faixa: [2, 4] }, libera: { inimigo: 'Ignavor' } },
        { nome: 'Bosque denso', inimigos: [2, 3], nivel: [2, 3], especies: ['Brotavel', 'Sementil', 'Ignavor', 'Noctarn'], material: { tipo: 'madeira', faixa: [14, 19] }, secundario: { tipo: 'pedra', faixa: [3, 5] }, libera: { inimigo: 'Florivel' } },
        { nome: 'Coração da mata', inimigos: [4, 5], nivel: [3, 5], especies: ['Brotavel', 'Florivel', 'Ignavor', 'Noctarn', 'Noctarn'], material: { tipo: 'madeira', faixa: [20, 28] }, secundario: { tipo: 'pedra', faixa: [4, 6] }, libera: { inimigo: 'Vaelith' } },
      ],
    },
    {
      id: 'pedreira', nome: 'Pedreira da Caverna', icone: '⛏️', material: 'pedra', descricao: 'Pedra para quartel e enfermaria. Inimigos mais resistentes.',
      fases: [
        { nome: 'Entrada da mina', inimigos: [2, 2], nivel: [2, 3], especies: ['Cristalino', 'Ignavor', 'Noctarn'], material: { tipo: 'pedra', faixa: [10, 14] }, secundario: { tipo: 'madeira', faixa: [2, 4] }, libera: { inimigo: 'Cristalino' } },
        { nome: 'Galeria funda', inimigos: [3, 5], nivel: [4, 6], especies: ['Cristalino', 'Ignavor', 'Noctarn', 'Solarin'], material: { tipo: 'pedra', faixa: [14, 20] }, secundario: { tipo: 'madeira', faixa: [3, 5] }, libera: { inimigo: 'Solarin' } },
        { nome: 'Veio de cristal', inimigos: [4, 6], nivel: [4, 6], especies: ['Cristalino', 'Ignavor', 'Noctarn', 'Solarin', 'Lumivela'], material: { tipo: 'pedra', faixa: [22, 30] }, secundario: { tipo: 'madeira', faixa: [4, 6] }, libera: { inimigo: 'Lumivela' } },
      ],
    },
  ],
};
