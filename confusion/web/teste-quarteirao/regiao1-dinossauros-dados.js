// Expansão Dinossauros — Catálogo puro (sem DOM) de 50 Oníricos distribuídos pelos 18 elementos,
// com 3 formas em português, classe, kit de 3 habilidades e descrição visual para geração de arte.

const ELEMENTOS_18 = [
  'fogo', 'agua', 'planta', 'terra', 'luz', 'trevas', 'lutador', 'voador', 'veneno',
  'psiquico', 'inseto', 'pedra', 'fantasma', 'eletrico', 'gelo', 'dragao', 'aco', 'fada',
];

const RAW_DINOSSAUROS = [
  // [id, nome, elemento, classe, tierBase, forma1, forma2, forma3, descArte]
  ['tiranox', 'Tiranox', 'fogo', 'guerreiro', 5, 'Tiraninho', 'Tiranor', 'Tiranox', 'Tiranossauro vulcânico com placas de magma brilhante na crista dorsal e mandíbula incandescente.'],
  ['tricerax', 'Tricerax', 'terra', 'tanque', 5, 'Tricerino', 'Triceronte', 'Tricerax', 'Tricerátops blindado com três chifres de basalto dourado e escudo craniano rúnico.'],
  ['veloxar', 'Veloxar', 'eletrico', 'assassino', 5, 'Veloxinho', 'Veloxer', 'Veloxar', 'Velociraptor ágil com penas de relâmpago azul-elétrico e garras em arco voltaico.'],
  ['pteronox', 'Pteronox', 'voador', 'mago', 5, 'Pterinho', 'Pterovento', 'Pteronox', 'Pteranodonte celeste de asas translúcidas em vendaval turquesa e crista aerodinâmica.'],
  ['brasassauro', 'Brasassauro', 'fogo', 'tanque', 3, 'Brasinhaur', 'Carvossauro', 'Brasassauro', 'Anquilossauro de carapaça de brasa viva e cauda em clava flamejante.'],
  ['pirolofo', 'Pirolofo', 'fogo', 'mago', 4, 'Fagulofo', 'Chamalofo', 'Pirolofo', 'Dilofossauro com gola de fogo solar que abre em leque incandescente.'],
  ['marissauro', 'Marissauro', 'agua', 'tanque', 4, 'Ondassauro', 'Coralossauro', 'Marissauro', 'Plesiossauro de escamas safira com barbatanas de coral luminescente.'],
  ['espinomar', 'Espinomar', 'agua', 'guerreiro', 4, 'Espininho', 'Espinonda', 'Espinomar', 'Espinossauro aquático com vela dorsal translúcida que corta torrentes.'],
  ['hidraptora', 'Hidraptora', 'agua', 'assassino', 3, 'Gotoraptor', 'Torraptora', 'Hidraptora', 'Raptor anfíbio esguio com nadadeiras cortantes e olhos ciano.'],
  ['frondodoco', 'Frondodoco', 'planta', 'suporte', 4, 'Brotodoco', 'Copadoco', 'Frondodoco', 'Diplodoco gentil com jardim suspenso de samambaias e flores luminosas no dorso.'],
  ['espinoraptor', 'Espinoraptor', 'planta', 'assassino', 3, 'Ciporaptor', 'Zarzoraptor', 'Espinoraptor', 'Deinônico camuflado em folhagem densa com garras de espinhos esmeralda.'],
  ['musgocerato', 'Musgocerato', 'planta', 'tanque', 3, 'Brocerato', 'Troncerato', 'Musgocerato', 'Estiracossauro coberto de musgo ancestral e chifres de madeira petrificada.'],
  ['terratitan', 'Terratitan', 'terra', 'tanque', 4, 'Barratitan', 'Fendatitan', 'Terratitan', 'Argentinossauro colossal com placas de argila rachada e raízes fósseis.'],
  ['escavodon', 'Escavodon', 'terra', 'guerreiro', 3, 'Turvadon', 'Sismadon', 'Escavodon', 'Iguanodonte escavador com garras-pá de arenito reforçado.'],
  ['solariodon', 'Solariodon', 'luz', 'suporte', 4, 'Raiosauro', 'Auroradon', 'Solariodon', 'Parassaurolofo com crista prismática que refrata feixes dourados de cura.'],
  ['alvoraptor', 'Alvoraptor', 'luz', 'assassino', 4, 'Clariptor', 'Fulgoraptor', 'Alvoraptor', 'Raptor emplumado branco-dourado com halo luminoso na cauda.'],
  ['heliossauro', 'Heliossauro', 'luz', 'mago', 3, 'Lumissauro', 'Radiossauro', 'Heliossauro', 'Estegossauro cujas placas dorsais funcionam como espelhos solares.'],
  ['umbrossauro', 'Umbrossauro', 'trevas', 'guerreiro', 4, 'Sombrinho', 'Negrissauro', 'Umbrossauro', 'Carnotauro de escamas obsidiana com chifres envoltos em névoa púrpura.'],
  ['noctiraptor', 'Noctiraptor', 'trevas', 'assassino', 4, 'Breviraptor', 'Ocasoraptor', 'Noctiraptor', 'Predador noturno de penas negras iridescentes e olhos carmesim.'],
  ['abissoploco', 'Abissoploco', 'trevas', 'mago', 3, 'Penumbrodon', 'Vortidon', 'Abissoploco', 'Therizinossauro sombrio com garras longas que rasgam fendas arcanas.'],
  ['pugnossauro', 'Pugnossauro', 'lutador', 'guerreiro', 4, 'Socossauro', 'Bravossauro', 'Pugnossauro', 'Paquicefalossauro musculoso com punhos ossificados e crânio de impacto.'],
  ['garraluta', 'Garraluta', 'lutador', 'assassino', 3, 'Punhoraptor', 'Golperaptor', 'Garraluta', 'Baryonyx lutador de postura ágil com faixas naturais nos antebraços.'],
  ['titamarcial', 'Titamarcial', 'lutador', 'tanque', 4, 'Guardadon', 'Muralhadon', 'Titamarcial', 'Anquilossauro bípede robusto com postura de guarda inabalável.'],
  ['ventodactilo', 'Ventodactilo', 'voador', 'assassino', 3, 'Brisadactilo', 'Rajadactilo', 'Ventodactilo', 'Quetzalcoatlus veloz com asas em leque de penas prateadas.'],
  ['ciclopteryx', 'Ciclopteryx', 'voador', 'mago', 4, 'Plumapteryx', 'Vendapteryx', 'Ciclopteryx', 'Archaeopteryx místico envolto em redemoinhos de plumas celestes.'],
  ['toxissauro', 'Toxissauro', 'veneno', 'mago', 4, 'Peçonhinho', 'Venossauro', 'Toxissauro', 'Dilofossauro bioluminescente roxo-lima com glândulas ácidas pulsantes.'],
  ['esporodon', 'Esporodon', 'veneno', 'suporte', 3, 'Fumadon', 'Miasmadon', 'Esporodon', 'Estegossauro de placas fúngicas que libera nuvens de esporos tóxicos.'],
  ['peconharaptor', 'Peçonharaptor', 'veneno', 'assassino', 3, 'Acedaptor', 'Viperaptor', 'Peçonharaptor', 'Troodonte esmeralda com presas gotejando veneno fluorescente.'],
  ['mentossauro', 'Mentossauro', 'psiquico', 'mago', 4, 'Visossauro', 'Oraculossauro', 'Mentossauro', 'Parassaurolofo com terceiro olho cristalino flutuando acima da crista.'],
  ['teleciraptor', 'Teleciraptor', 'psiquico', 'assassino', 4, 'Ondaraptor', 'Astroraptor', 'Teleciraptor', 'Raptor levitante cercado por lascas fósseis controladas por telecinese.'],
  ['sonhodon', 'Sonhodon', 'psiquico', 'suporte', 3, 'Brumadon', 'Oniridon', 'Sonhodon', 'Braquiossauro etéreo com constelações violetas desenhadas no pescoço.'],
  ['quitinossauro', 'Quitinossauro', 'inseto', 'tanque', 3, 'Cascarino', 'Carapossauro', 'Quitinossauro', 'Dinossauro simbiótico revestido por carapaça quitinosa iridescente.'],
  ['zumbiraptor', 'Zumbiraptor', 'inseto', 'assassino', 3, 'Vespaptor', 'Enxamaptor', 'Zumbiraptor', 'Raptor com asas membranosas de libélula pré-histórica e ferrões.'],
  ['melissauro', 'Melissauro', 'inseto', 'suporte', 3, 'Nectassauro', 'Favossauro', 'Melissauro', 'Ornitomimo dourado que carrega âmbar vivo regenerativo.'],
  ['granitodon', 'Granitodon', 'pedra', 'tanque', 4, 'Seixodon', 'Rochadon', 'Granitodon', 'Tricerátops de granito esculpido com cristais de quartzo nas placas.'],
  ['basaltorax', 'Basaltorax', 'pedra', 'guerreiro', 4, 'Pedrax', 'Lajedorax', 'Basaltorax', 'Alossauro com espinhos dorsais de basalto vulcânico afiado.'],
  ['fossilix', 'Fossilix', 'pedra', 'mago', 3, 'Calcarino', 'Petrilix', 'Fossilix', 'Esqueleto mineralizado animado por runas antigas de âmbar.'],
  ['espectrossauro', 'Espectrossauro', 'fantasma', 'mago', 4, 'Ossinho', 'Fantassauro', 'Espectrossauro', 'Fóssil espectral de espinossauro envolto em chamas azul-fantasma.'],
  ['almaraptor', 'Almaraptor', 'fantasma', 'assassino', 4, 'Ecoaptor', 'Vultoraptor', 'Almaraptor', 'Raptor translúcido que deixa rastros fantasmagóricos ao saltar.'],
  ['criptodon', 'Criptodon', 'fantasma', 'suporte', 3, 'Lamentodon', 'Veladon', 'Criptodon', 'Plesiossauro etéreo que flutua em névoa cemiterial prateada.'],
  ['trovossauro', 'Trovossauro', 'eletrico', 'guerreiro', 4, 'Faiscossauro', 'Voltossauro', 'Trovossauro', 'Carnotauro com chifres para-raios que crepitam eletricidade dourada.'],
  ['raioceratops', 'Raioceratops', 'eletrico', 'tanque', 3, 'Chispacerato', 'Tempocerato', 'Raioceratops', 'Protocerátops com colar ósseo condutor de descargas estáticas.'],
  ['criossauro', 'Criossauro', 'gelo', 'mago', 4, 'Gelinossauro', 'Nevossauro', 'Criossauro', 'Criolofossauro de crista de gelo eterno e hálito de nevasca.'],
  ['glaciraptor', 'Glaciraptor', 'gelo', 'assassino', 4, 'Frioraptor', 'Georaptor', 'Glaciraptor', 'Raptor ártico de plumagem branca e garras de cristal congelante.'],
  ['avalanchodon', 'Avalanchodon', 'gelo', 'tanque', 3, 'Granizodon', 'Geleiradon', 'Avalanchodon', 'Anquilossauro glaciar com geleira pontiaguda nas costas.'],
  ['dracotiran', 'Dracotiran', 'dragao', 'guerreiro', 5, 'Dracotinho', 'Dracorex', 'Dracotiran', 'Tiranossauro dracônico alado com escamas escarlate e aura ancestral.'],
  ['wyvernodon', 'Wyvernodon', 'dragao', 'mago', 4, 'Escamadon', 'Soprodon', 'Wyvernodon', 'Pterossauro dracônico de cauda longa e sopro de energia primordial.'],
  ['ferrossauro', 'Ferrossauro', 'aco', 'tanque', 4, 'Lataossauro', 'Blindassauro', 'Ferrossauro', 'Estegossauro de placas metálicas forjadas e cauda de aço temperado.'],
  ['laminaraptor', 'Laminaraptor', 'aco', 'assassino', 4, 'Gumeraptor', 'Cortaraptor', 'Laminaraptor', 'Raptor metálico prateado com garras-lâmina espelhadas.'],
  ['silfissauro', 'Silfissauro', 'fada', 'suporte', 4, 'Brilhossauro', 'Encantossauro', 'Silfissauro', 'Parassaurolofo feérico pastel com asas de pólen brilhante e aura curativa.'],
];

const EFEITO_POR_ELEMENTO = {
  fogo: 'queimadura', agua: 'ataque_baixo', planta: 'regeneracao', terra: 'defesa_alta',
  luz: 'escudo', trevas: 'sangramento', lutador: 'ataque_alto', voador: 'veloz',
  veneno: 'veneno', psiquico: 'silencio', inseto: 'veneno', pedra: 'defesa_alta',
  fantasma: 'fraqueza', eletrico: 'atordoamento', gelo: 'congelamento', dragao: 'ataque_alto',
  aco: 'defesa_alta', fada: 'regeneracao',
};

function montarKitDinossauro(id, nome, elemento, classe) {
  const ef = EFEITO_POR_ELEMENTO[elemento] || 'sangramento';
  const s1 = { id: `${id}_s1`, nome: `Investida de ${nome}`, tipo: 'dano', alvo: 'um', mult: 1.05, cd: 1, elemento, efeitos: [{ id: ef, turnos: 2, chance: 0.45 }] };
  const s2 = classe === 'suporte'
    ? { id: `${id}_s2`, nome: `Rugido Protetor`, tipo: 'cura', alvo: 'aliados', mult: 0.18, cd: 3, elemento, efeitos: [{ id: 'regeneracao', turnos: 2, chance: 1 }] }
    : classe === 'tanque'
      ? { id: `${id}_s2`, nome: `Carapaça Primeva`, tipo: 'apoio', alvo: 'si', cd: 3, elemento, escudo: 0.22, efeitos: [{ id: 'provocacao', turnos: 2, chance: 1 }] }
      : { id: `${id}_s2`, nome: `Fúria Primeva`, tipo: 'dano', alvo: classe === 'mago' ? 'todos' : 'um', mult: classe === 'mago' ? 1.15 : 1.55, cd: 3, elemento, efeitos: [{ id: ef, turnos: 2, chance: 0.7 }] };
  const s3 = classe === 'suporte'
    ? { id: `${id}_s3`, nome: `Despertar Jurássico`, tipo: 'apoio', alvo: 'aliados', cd: 5, elemento, cura: 0.24, efeitos: [{ id: 'ataque_alto', turnos: 2, chance: 1 }, { id: 'escudo', turnos: 2, pct: 0.16 }] }
    : { id: `${id}_s3`, nome: `Extinção de ${nome}`, tipo: 'dano', alvo: classe === 'assassino' ? 'um' : 'todos', mult: classe === 'assassino' ? 2.15 : 1.55, cd: 5, elemento, efeitos: [{ id: ef, turnos: 3, chance: 0.85 }] };
  return [s1, s2, s3];
}

export const CATALOGO_DINOSSAUROS = RAW_DINOSSAUROS.map(([id, nome, elemento, classe, tierBase, f1, f2, f3, descArte]) => ({
  id,
  nome,
  expansao: 'dinossauros',
  elemento,
  classe,
  tierBase,
  formas: [f1, f2, f3],
  kit: montarKitDinossauro(id, nome, elemento, classe),
  descricaoArte: descArte,
}));

export const DINOSSAUROS_POR_ID = Object.fromEntries(CATALOGO_DINOSSAUROS.map((d) => [d.id, d]));
export const DINOSSAUROS_ELEMENTOS_COBERTOS = [...new Set(CATALOGO_DINOSSAUROS.map((d) => d.elemento))];
export const DINOSSAUROS_T5_TEMPORADA = CATALOGO_DINOSSAUROS.filter((d) => d.tierBase === 5).map((d) => d.nome);
export { ELEMENTOS_18 as ELEMENTOS_EXPANSAO_DINOSSAUROS };
