/* KANTO JOURNEY V1 — Gen I campaign atlas, route discovery and story quests. */
(function (W, D) {
  'use strict';
  if (W.__PSY_KANTO_JOURNEY_V1__) return;
  W.__PSY_KANTO_JOURNEY_V1__ = true;

  const GEN1 = [
    {id:'pallet',kind:'city',name:'Pallet Town',mark:'Laboratório do Professor Carvalho',npc:'Professor Carvalho',quest:'Receba a Pokédex e conheça seu primeiro parceiro.',species:[1,4,7],art:'/assets/story/kanto-pallet-town-v1.webp',badge:0,x:29,y:86,chapter:0},
    {id:'route-1',kind:'route',name:'Rota 1',mark:'Trilha entre Pallet e Viridian',npc:'Treinadora Lia',quest:'Registre três espécies selvagens da rota.',species:[16,19,21,52,84,108],art:'/assets/story/kanto-route-1-v1.webp',badge:0,x:43,y:69,chapter:0},
    {id:'viridian',kind:'city',name:'Viridian City',mark:'Ginásio fechado e Escola de Treinadores',npc:'Idoso da cidade',quest:'Descubra por que o Ginásio ainda não aceita desafios.',species:[16,19,21],badge:0,x:34,y:45,chapter:1},
    {id:'route-2',kind:'route',name:'Rota 2',mark:'Trilha da floresta e entrada da cidade',npc:'Treinador Caio',quest:'Ajude um treinador a encontrar o caminho pela mata.',species:[10,13,16,19],badge:0,x:48,y:32,chapter:1},
    {id:'viridian-forest',kind:'dungeon',name:'Floresta de Viridian',mark:'Bosque de insetos e clareiras antigas',npc:'Pesquisadora Nara',quest:'Encontre a trilha segura e registre três espécies do bosque.',species:[10,11,12,13,14,15,25],badge:0,x:65,y:18,chapter:1},
    {id:'pewter',kind:'city',name:'Pewter City',mark:'Museu de Ciências e Ginásio de Brock',npc:'Brock',quest:'Conquiste a Insígnia da Rocha.',species:[27,29,32,74,95],badge:0,x:49,y:18,chapter:2},
    {id:'route-3',kind:'route',name:'Rota 3',mark:'Passagem montanhosa para o Monte Lua',npc:'Escoteiro Davi',quest:'Atravesse a serra e encontre a entrada da caverna.',species:[21,23,27,39,41,56],badge:1,x:59,y:16,chapter:2},
    {id:'mt-moon',kind:'dungeon',name:'Monte Lua',mark:'Caverna dos fósseis e da Equipe Rocket',npc:'Super Nerd Miguel',quest:'Proteja os fósseis dos ladrões da Equipe Rocket.',species:[35,41,46,48,50,74,77],badge:1,x:70,y:14,chapter:2},
    {id:'route-4',kind:'route',name:'Rota 4',mark:'Saída leste do Monte Lua',npc:'Treinadora Joana',quest:'Chegue à cidade azul e procure o Centro Pokémon.',species:[19,21,23,27,39,41,56],badge:1,x:78,y:24,chapter:2},
    {id:'cerulean',kind:'city',name:'Cerulean City',mark:'Ponte Nugget e Ginásio de Misty',npc:'Misty',quest:'Vença o desafio da líder e atravesse a ponte ao norte.',species:[54,60,63,72,79,90,118,120],badge:1,x:88,y:37,chapter:3},
    {id:'route-24-25',kind:'route',name:'Rotas 24 e 25',mark:'Ponte Nugget e casa de Bill',npc:'Bill',quest:'Ajude Bill com sua máquina de pesquisa.',species:[16,19,21,25,43,69,98],badge:2,x:81,y:46,chapter:3},
    {id:'route-5-6',kind:'route',name:'Rotas 5 e 6',mark:'Passagem subterrânea entre Cerulean e Vermilion',npc:'Assistente de Carvalho',quest:'Entregue a encomenda do laboratório em Vermilion.',species:[16,19,21,29,32,43,52],badge:2,x:74,y:55,chapter:3},
    {id:'vermilion',kind:'city',name:'Vermilion City',mark:'Porto, S.S. Anne e Ginásio de Lt. Surge',npc:'Lt. Surge',quest:'Explore o S.S. Anne e conquiste a Insígnia do Trovão.',species:[19,21,25,52,72,98,120,129],badge:2,x:66,y:65,chapter:4},
    {id:'ss-anne',kind:'dungeon',name:'S.S. Anne',mark:'Navio de luxo ancorado no porto',npc:'Capitão do navio',quest:'Ajude o capitão e receba o Corte para abrir novas trilhas.',species:[19,21,52,72,98,120],badge:2,x:73,y:72,chapter:4},
    {id:'route-11',kind:'route',name:'Rota 11',mark:'Trilha costeira a leste de Vermilion',npc:'Treinador Artur',quest:'Encontre a passagem para a Caverna dos Diglett.',species:[16,19,21,23,27,29,32,56,66],badge:3,x:54,y:74,chapter:4},
    {id:'diglett-cave',kind:'dungeon',name:'Caverna dos Diglett',mark:'Túnel que liga Vermilion à Rota 2',npc:'Montanhista Raul',quest:'Abra a passagem bloqueada e retorne à Rota 2.',species:[27,50,74,95],badge:3,x:44,y:65,chapter:4},
    {id:'route-9-10',kind:'route',name:'Rotas 9 e 10',mark:'Caminho rochoso e usina abandonada',npc:'Engenheira Iris',quest:'Restabeleça a energia perto do Túnel Rochoso.',species:[19,21,25,27,41,74,81,100],badge:3,x:34,y:64,chapter:4},
    {id:'power-plant',kind:'dungeon',name:'Usina Elétrica',mark:'Instalação tomada por Pokémon elétricos',npc:'Técnica Paula',quest:'Investigue a queda de energia e encontre o Pokémon raro da usina.',species:[25,81,82,100,101,125],badge:3,x:27,y:54,chapter:4},
    {id:'rock-tunnel',kind:'dungeon',name:'Túnel Rochoso',mark:'Caverna escura até Lavender',npc:'Treinador Bruno',quest:'Encontre a saída e guie os treinadores perdidos.',species:[41,66,74,95,104],badge:3,x:24,y:57,chapter:4},
    {id:'lavender',kind:'city',name:'Lavender Town',mark:'Torre Pokémon e memorial dos Pokémon',npc:'Senhorita Fuji',quest:'Descubra quem está assombrando a torre.',species:[19,37,92,93,104],badge:3,x:20,y:47,chapter:5},
    {id:'pokemon-tower',kind:'dungeon',name:'Torre Pokémon',mark:'Memorial assombrado de Lavender',npc:'Senhorita Fuji',quest:'Encontre o Silph Scope e liberte os espíritos da torre.',species:[92,93,94,104,105],badge:3,x:17,y:53,chapter:5},
    {id:'route-8',kind:'route',name:'Rota 8',mark:'Passagem vigiada rumo a Saffron',npc:'Guarda da passagem',quest:'Encontre um caminho alternativo até Saffron.',species:[19,23,27,37,52,58,77,96],badge:3,x:11,y:45,chapter:5},
    {id:'celadon',kind:'city',name:'Celadon City',mark:'Loja de departamentos e esconderijo Rocket',npc:'Erika',quest:'Investigue o Cassino e vença a líder do Ginásio.',species:[1,43,44,69,70,102,133],badge:4,x:12,y:34,chapter:5},
    {id:'rocket-hideout',kind:'dungeon',name:'Esconderijo Rocket',mark:'Base secreta sob o Cassino de Celadon',npc:'Giovanni e Equipe Rocket',quest:'Encontre o esconderijo e recupere o Silph Scope.',species:[23,24,27,28,41,42,52,53,88,109],badge:4,x:12,y:40,chapter:5},
    {id:'route-7',kind:'route',name:'Rota 7',mark:'Atalho entre Celadon e Saffron',npc:'Treinadora Bia',quest:'Encontre a passagem subterrânea para Saffron.',species:[19,23,27,37,52,58,77,96],badge:4,x:21,y:30,chapter:5},
    {id:'saffron',kind:'city',name:'Saffron City',mark:'Silph Co. e Ginásio de Sabrina',npc:'Sabrina',quest:'Expulse a Equipe Rocket da Silph Co. e desafie Sabrina.',species:[63,64,65,66,67,96,97],badge:4,x:32,y:28,chapter:6},
    {id:'silph-co',kind:'dungeon',name:'Silph Co.',mark:'Torre tecnológica ocupada pela Equipe Rocket',npc:'Presidente da Silph Co.',quest:'Resgate os funcionários e impeça o plano de Giovanni.',species:[23,24,52,53,63,64,65],badge:4,x:37,y:34,chapter:6},
    {id:'route-12-15',kind:'route',name:'Rotas 12 a 15',mark:'Ciclovia costeira e trilhas de Fuchsia',npc:'Pescadora Marina',quest:'Percorra a costa e encontre o caminho da Zona do Safári.',species:[16,19,29,32,43,44,54,60,72,90,118,129],badge:5,x:45,y:39,chapter:6},
    {id:'fuchsia',kind:'city',name:'Fuchsia City',mark:'Zona do Safári e Ginásio de Koga',npc:'Koga',quest:'Explore a Zona do Safári e conquiste a Insígnia da Alma.',species:[29,32,46,48,49,83,111,123],badge:5,x:55,y:44,chapter:6},
    {id:'safari-zone',kind:'landmark',name:'Zona do Safári',mark:'Reserva natural com áreas raras e Pokémon ariscos',npc:'Diretor da Zona do Safári',quest:'Encontre os dentes de ouro e devolva-os ao diretor.',species:[29,32,46,47,48,102,111,113,115,123,127,128],badge:5,x:60,y:49,chapter:6},
    {id:'route-16-18',kind:'route',name:'Rotas 16 a 18',mark:'Ciclovia e refúgios de Pokémon',npc:'Ciclista Pedro',quest:'Atravesse a ciclovia e investigue os Snorlax adormecidos.',species:[16,17,19,20,21,22,84,85,128,143],badge:6,x:67,y:50,chapter:7},
    {id:'route-19-21',kind:'route',name:'Rotas 19 a 21',mark:'Costa sul e caminho marítimo para Cinnabar',npc:'Nadadora Lúcia',quest:'Cruze o mar e encontre a ilha vulcânica.',species:[7,54,60,72,86,90,98,116,118,120,129],badge:6,x:77,y:59,chapter:7},
    {id:'seafoam',kind:'dungeon',name:'Ilhas Seafoam',mark:'Cavernas de gelo entre Fuchsia e Cinnabar',npc:'Explorador Nilo',quest:'Atravesse as correntes subterrâneas e descubra a câmara glacial.',species:[41,42,54,55,79,80,86,87,90,91,124,144],badge:6,x:82,y:65,chapter:7},
    {id:'cinnabar',kind:'city',name:'Cinnabar Island',mark:'Mansão Pokémon e Ginásio de Blaine',npc:'Blaine',quest:'Investigue a mansão e vença o desafio vulcânico.',species:[4,5,37,38,58,59,77,78,126],badge:6,x:88,y:75,chapter:7},
    {id:'pokemon-mansion',kind:'dungeon',name:'Mansão Pokémon',mark:'Ruínas e registros sobre Mewtwo',npc:'Pesquisadora Aline',quest:'Recupere as páginas do diário e encontre a chave do Ginásio.',species:[4,5,37,38,58,59,77,78,88,89,109,110,132],badge:6,x:82,y:81,chapter:7},
    {id:'route-22-23',kind:'route',name:'Rotas 22 e 23',mark:'Caminho da Vitória e portões da Liga',npc:'Guarda da Liga',quest:'Apresente as oito insígnias e atravesse o Caminho da Vitória.',species:[21,23,27,32,56,57,66,67,74,95],badge:7,x:94,y:55,chapter:7},
    {id:'viridian-gym',kind:'city',name:'Viridian Gym',mark:'Último ginásio e desafio de Giovanni',npc:'Giovanni',quest:'Derrote Giovanni e conquiste a Insígnia da Terra.',species:[27,28,31,34,50,51,74,75,95,111,112],badge:7,x:94,y:46,chapter:8},
    {id:'indigo',kind:'landmark',name:'Planalto Índigo',mark:'Liga Pokémon e desafio da Elite Four',npc:'Lorelei, Bruno, Agatha e Lance',quest:'Conclua a jornada de Kanto e enfrente o Campeão.',species:[124,131,142,144,145,146,149,150,151],badge:8,x:83,y:42,chapter:8}
  ];

  const CURATED_HUNTS={
    pallet:[
      {id:'pallet-lab-garden',name:'Jardim do Laboratório',terrain:'Canteiros e árvores frutíferas',species:[16,19],level:'1–3'},
      {id:'pallet-harbor',name:'Margem do Porto',terrain:'Água rasa e pedras costeiras',species:[129,118],level:'1–4'}
    ],
    'route-1':[
      {id:'route1-lantern-clearing',name:'Clareira das Lanternas',terrain:'Grama alta junto à trilha',species:[16,19,21],level:'2–4',tiles:['20,8','21,8','22,8']},
      {id:'route1-streambank',name:'Margem do Riacho',terrain:'Grama alta perto da água',species:[19,52,84],level:'3–5',tiles:['28,14','29,14','30,14']},
      {id:'route1-cut-grove-hunt',name:'Bosque Atrás da Cerca',terrain:'Clareira secreta · requer Cut',species:[10,13,43],level:'4–6',technique:'cut',flag:'route1-cut-grove',tiles:['16,11','17,11','16,12','17,12']},
      {id:'route1-rock-clearing-hunt',name:'Recanto das Pedras',terrain:'Grama entre rochas · requer Rock Smash',species:[27,50,74],level:'5–7',technique:'rockSmash',flag:'route1-rock-clearing',tiles:['29,8','30,8','29,9','30,9']},
      {id:'route1-hidden-bank-hunt',name:'Outra Margem',terrain:'Riacho oculto · requer Surf',species:[60,72,118,129],level:'5–8',technique:'surf',flag:'route1-surf-crossing',tiles:['18,16','23,15','23,16','23,17']}
    ],
    viridian:[
      {id:'viridian-park',name:'Parque Central',terrain:'Jardim público',species:[16,19,43],level:'3–6'},
      {id:'viridian-west-woods',name:'Bosque Oeste',terrain:'Arbustos e árvores baixas',species:[21,29,32],level:'4–7'}
    ],
    'route-2':[
      {id:'route2-north-trail',name:'Trilha do Norte',terrain:'Grama alta entre árvores',species:[10,13,16],level:'4–7'},
      {id:'route2-forest-edge',name:'Borda da Floresta',terrain:'Clareira de transição',species:[19,25,43],level:'5–8'}
    ],
    'viridian-forest':[
      {id:'forest-entrance',name:'Entrada do Bosque',terrain:'Troncos e grama baixa',species:[10,13,14],level:'5–8'},
      {id:'forest-glow-clearing',name:'Clareira dos Vagalumes',terrain:'Folhagem densa e cogumelos',species:[11,12,15,25],level:'6–10'}
    ],
    pewter:[
      {id:'pewter-museum-yard',name:'Pátio do Museu',terrain:'Jardins de pedra',species:[27,74],level:'7–10'},
      {id:'pewter-north-slope',name:'Encosta Norte',terrain:'Pedras e arbustos da serra',species:[29,32,95],level:'8–12'}
    ],
    'mt-moon':[
      {id:'moon-entrance',name:'Galeria da Entrada',terrain:'Caverna iluminada por cristais',species:[35,41,46],level:'10–14'},
      {id:'moon-fossil-chamber',name:'Câmara dos Fósseis',terrain:'Salões profundos da caverna',species:[41,50,74,77],level:'12–16'}
    ],
    cerulean:[
      {id:'cerulean-canal',name:'Canal da Cidade',terrain:'Margem e pontes de água',species:[54,60,72,98],level:'12–16'},
      {id:'cerulean-flower-park',name:'Jardim das Fontes',terrain:'Gramado ao norte do ginásio',species:[16,19,43,69],level:'13–17'}
    ],
    vermilion:[
      {id:'vermilion-docks',name:'Doca do Porto',terrain:'Cais e poças costeiras',species:[72,98,120,129],level:'16–20'},
      {id:'vermilion-south-park',name:'Parque do Farol',terrain:'Gramado junto ao farol',species:[19,21,25,52],level:'15–19'}
    ],
    lavender:[
      {id:'lavender-memorial-garden',name:'Jardim Memorial',terrain:'Cemitério sob a névoa',species:[92,104],level:'20–24'},
      {id:'lavender-old-road',name:'Estrada Antiga',terrain:'Trilha sombria da torre',species:[19,37,93],level:'21–25'}
    ],
    celadon:[
      {id:'celadon-rooftop-garden',name:'Jardim Suspenso',terrain:'Jardins e telhados verdes',species:[1,43,69],level:'24–28'},
      {id:'celadon-casino-alley',name:'Beco do Cassino',terrain:'Ruelas atrás do centro comercial',species:[23,27,52,88],level:'25–29'}
    ],
    fuchsia:[
      {id:'safari-savanna',name:'Campo do Safári',terrain:'Planície de capim alto',species:[29,32,46,111],level:'30–36'},
      {id:'safari-wetlands',name:'Lagoa do Safári',terrain:'Brejo e margem de lago',species:[54,60,72,118,129],level:'32–38'}
    ],
    cinnabar:[
      {id:'cinnabar-volcanic-path',name:'Trilha Vulcânica',terrain:'Encosta quente da ilha',species:[4,37,58,77],level:'38–44'},
      {id:'cinnabar-mansion-ruins',name:'Ruínas da Mansão',terrain:'Salões abandonados',species:[88,109,132],level:'40–46'}
    ]
  };
  const GENERIC_HUNT_NAMES={route:['Clareira da Trilha','Borda do Bosque'],city:['Jardim da Cidade','Caminho Externo'],dungeon:['Galeria da Entrada','Câmara Profunda'],landmark:['Área Norte','Área Sul']};
  GEN1.forEach(place=>{
    if(CURATED_HUNTS[place.id]){place.hunts=CURATED_HUNTS[place.id];return}
    const labels=GENERIC_HUNT_NAMES[place.kind]||GENERIC_HUNT_NAMES.route,split=Math.max(1,Math.ceil(place.species.length/2));
    place.hunts=[
      {id:place.id+'-hunt-a',name:labels[0],terrain:place.mark,species:place.species.slice(0,split),level:'Progressão da área'},
      {id:place.id+'-hunt-b',name:labels[1],terrain:place.mark,species:place.species.slice(split).length?place.species.slice(split):place.species.slice(0,split),level:'Progressão da área'}
    ];
  });

  const FIELD_TECHNIQUES={
    cut:{name:'Cut',source:'ss-anne',badges:2,clue:'O capitão do S.S. Anne ensina a remover árvores pequenas que bloqueiam trilhas.'},
    surf:{name:'Surf',source:'safari-zone',badges:5,clue:'A Casa Secreta da Zona do Safári guarda a técnica para cruzar águas profundas.'},
    dig:{name:'Dig',source:'mt-moon',badges:1,clue:'Um explorador do Monte Lua ensina a abrir passagens em terra fofa.'},
    rockSmash:{name:'Rock Smash',source:'pewter',badges:1,clue:'O museu de Pewter guarda uma técnica para quebrar rochas rachadas.'},
    flash:{name:'Flash',source:'route-2',badges:0,seen:10,clue:'O assistente de Carvalho entrega a técnica após dez espécies registradas.'},
    fly:{name:'Fly',source:'route-16-18',badges:3,clue:'Uma casa escondida na Ciclovia ensina a viajar entre locais visitados.'},
    strength:{name:'Strength',source:'safari-zone',badges:4,clue:'O diretor do Safári recompensa quem devolve os dentes de ouro.'},
    waterfall:{name:'Waterfall',source:'indigo',badges:8,clue:'Técnica de exploração para regiões futuras, ensinada depois da Liga.'},
    dive:{name:'Dive',source:'indigo',badges:8,clue:'Técnica aquática reservada a regiões futuras.'},
    headbutt:{name:'Headbutt',source:'indigo',badges:8,clue:'Técnica de árvores para regiões futuras.'}
  };
  const MYSTERY_RULES={
    pallet:[{id:'pallet-lab-chart',name:'O quadro do laboratório',kind:'riddle',clue:'Carvalho deixou uma sequência no quadro: primeiro a folha, depois a lua, por fim a chama.',answer:'leaf-moon-flame',choices:[['Chama · Folha · Lua','flame-leaf-moon'],['Folha · Lua · Chama','leaf-moon-flame'],['Lua · Chama · Folha','moon-flame-leaf']],reward:250}],
    'route-1':[
      {id:'route1-lantern-sequence',name:'As três lanternas',kind:'riddle',clue:'Lia diz: “A mata desperta, a noite observa e a chama mostra o caminho.”',answer:'leaf-moon-flame',choices:[['Folha · Lua · Chama','leaf-moon-flame'],['Lua · Folha · Chama','moon-leaf-flame'],['Chama · Lua · Folha','flame-moon-leaf']],reward:500},
      {id:'route1-cut-grove',name:'O bosque atrás da cerca viva',kind:'field',technique:'cut',physical:'route1-cut-grove',clue:'Uma árvore jovem esconde uma clareira a oeste da trilha.',reward:700},
      {id:'route1-buried-cache',name:'O pacote enterrado',kind:'field',technique:'dig',clue:'A placa antiga tem terra recém-revirada aos pés.',reward:600,item:'Pokéball'},
      {id:'route1-boulder-cache',name:'A pedra rachada',kind:'field',technique:'rockSmash',physical:'route1-rock-clearing',clue:'Uma rocha rachada bloqueia um pequeno recanto ao leste.',reward:800,item:'Poção 50'},
      {id:'route1-stream-crossing',name:'O atalho do riacho',kind:'field',technique:'surf',physical:'route1-surf-crossing',clue:'As pedras do riacho formam uma passagem até uma margem escondida.',reward:900}
    ],
    'viridian-forest':[{id:'forest-lantern-code',name:'O código dos vaga-lumes',kind:'riddle',clue:'A pesquisadora Nara anotou o ritmo das luzes: duas curtas, uma longa, duas curtas.',answer:'short-short-long-short-short',choices:[['Curta · Curta · Longa · Curta · Curta','short-short-long-short-short'],['Longa · Curta · Longa · Curta','long-short-long-short'],['Curta · Longa · Longa · Curta','short-long-long-short']],reward:1200}],
    'mt-moon':[{id:'moon-fossil-puzzle',name:'O painel dos fósseis',kind:'riddle',clue:'No painel, o fóssil espiral aponta para a esquerda; o fóssil garra aponta para a direita.',answer:'spiral-left-claw-right',choices:[['Espiral à esquerda · Garra à direita','spiral-left-claw-right'],['Garra à esquerda · Espiral à direita','claw-left-spiral-right'],['Ambos à esquerda','both-left']],reward:1600}],
    'pokemon-tower':[{id:'tower-bell-puzzle',name:'O sino silencioso',kind:'riddle',clue:'A lápide diz: toque uma vez por cada sino apagado; são três sinos.',answer:'three',choices:[['Um toque','one'],['Dois toques','two'],['Três toques','three']],reward:2400}],
    'rocket-hideout':[{id:'rocket-floor-switches',name:'Os quatro interruptores',kind:'riddle',clue:'A nota roubada informa: o caminho seguro começa no canto superior esquerdo e segue em zigue-zague.',answer:'ul-ur-ll-lr',choices:[['Superior esquerdo · Superior direito · Inferior esquerdo · Inferior direito','ul-ur-ll-lr'],['Inferior esquerdo · Superior esquerdo · Inferior direito · Superior direito','ll-ul-lr-ur'],['Superior direito · Inferior direito · Superior esquerdo · Inferior esquerdo','ur-lr-ul-ll']],reward:3500}]
  };
  const FIELD_ROTATION=['dig','rockSmash','flash','cut','strength','surf','fly'];
  GEN1.forEach((place,index)=>{
    place.mysteries=MYSTERY_RULES[place.id]||[{id:place.id+'-hidden-cache',name:place.kind==='city'?'A passagem esquecida':place.kind==='dungeon'?'A câmara lacrada':place.kind==='landmark'?'O segredo do marco':'O caminho oculto',kind:'field',technique:FIELD_ROTATION[index%FIELD_ROTATION.length],clue:`${place.npc} deixou uma pista sobre um segredo escondido em ${place.mark.toLowerCase()}.`,reward:500+place.chapter*250}];
    if(CURATED_HUNTS[place.id]&&place.id!=='route-1'){
      const ids=place.species.slice(-Math.min(4,place.species.length)),tech=FIELD_ROTATION[index%FIELD_ROTATION.length];
      place.hunts.push({id:`${place.id}-hidden-habitat`,name:place.kind==='city'?`Recanto Secreto de ${place.name}`:place.kind==='dungeon'?'Câmara Lacrada':`Refúgio Escondido`,terrain:`Área avançada · requer ${FIELD_TECHNIQUES[tech].name}`,species:ids,level:'Faixa avançada',technique:tech});
    }
    // Each stop gets three distinct hunting habitats; later subareas are gated by field skills.
    if(!CURATED_HUNTS[place.id]){
      const placeName=place.name.replace(/^(Rota|Rotas)\s*/,'');
      const habitat=place.kind==='route'
        ? [{name:`Clareira ${placeName}`,terrain:'Grama alta e trilha aberta'},{name:`Margem ${placeName}`,terrain:'Arbustos próximos à água'},{name:`Desvio Secreto ${placeName}`,terrain:'Área escondida · técnica de campo'}]
        : place.kind==='city'
          ? [{name:`Jardins de ${placeName}`,terrain:'Canteiros e gramados tranquilos'},{name:`Arredores de ${placeName}`,terrain:'Borda verde junto às construções'},{name:`Passagem Oculta de ${placeName}`,terrain:'Recanto secreto · técnica de campo'}]
          : place.kind==='dungeon'
            ? [{name:`Galeria Externa`,terrain:'Entrada iluminada e caminhos seguros'},{name:`Câmara Profunda`,terrain:'Salões internos e habitats raros'},{name:`Câmara Lacrada`,terrain:'Área escondida · técnica de campo'}]
            : [{name:`Campo de ${placeName}`,terrain:'Habitat aberto da região'},{name:`Refúgio de ${placeName}`,terrain:'Área protegida com espécies incomuns'},{name:`Santuário Oculto`,terrain:'Área secreta · técnica de campo'}];
      const ids=place.species, a=Math.max(1,Math.ceil(ids.length/3)), b=Math.max(a+1,Math.ceil(ids.length*2/3));
      const groups=[ids.slice(0,a),ids.slice(a,b),ids.slice(b)];
      if(!groups[2].length)groups[2]=ids.slice(-Math.min(3,ids.length));
      const tech=FIELD_ROTATION[index%FIELD_ROTATION.length];
      place.hunts=habitat.map((area,i)=>({id:`${place.id}-habitat-${i+1}`,name:area.name,terrain:area.terrain,species:groups[i].length?groups[i]:ids.slice(0,Math.min(3,ids.length)),level:i===0?'Faixa inicial':i===1?'Faixa intermediária':'Faixa avançada',...(i===2?{technique:tech}:{})}));
    }
  });

  const SAVE_KEY = 'psy_kanto_journey_progress_v1';
  const getSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (_) { return {}; } };
  const putSave = s => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (_) {} };
  const player = () => { try { return typeof P !== 'undefined' ? P : (W.P || {}); } catch (_) { return W.P || {}; } };
  const ensureFieldState = () => { const p=player();p.fieldTechniques=Array.isArray(p.fieldTechniques)?p.fieldTechniques:[];p.kantoPuzzleFlags=Array.isArray(p.kantoPuzzleFlags)?p.kantoPuzzleFlags:[];return p; };
  const seen = () => new Set((player().seenPokemon || W.PsyWorldProgressV1?.snapshot?.().seenPokemon || []).map(Number));
  const grassTiles = () => { try { return typeof ROUTE1 !== 'undefined' ? ROUTE1.grass : null; } catch (_) { return null; } };
  function routeFound(route) { const s=getSave(); return new Set(s[route]||[]); }
  function cell(x,y,tile,solid){
    try{if(typeof map==='undefined'||typeof SOLID==='undefined'||!map[y]||x<0||x>=MAP_W)return;map[y][x]=tile;const key=x+','+y;if(solid)SOLID.add(key);else SOLID.delete(key)}catch(_){}
  }
  function prepareSecretMap(){
    try{
      const p=ensureFieldState(),flags=new Set(p.kantoPuzzleFlags);
      for(let y=9;y<=13;y++)for(let x=15;x<=19;x++)cell(x,y,8,true);
      cell(18,10,6,false);cell(17,10,6,false);cell(16,10,6,false);
      for(let y=11;y<=12;y++)for(let x=16;x<=17;x++){cell(x,y,5,false);grassTiles()?.add(x+','+y)}
      cell(19,10,flags.has('route1-cut-grove')?6:8,!flags.has('route1-cut-grove'));
      for(let y=6;y<=10;y++)for(let x=27;x<=30;x++)cell(x,y,8,true);
      cell(27,7,flags.has('route1-rock-clearing')?6:9,!flags.has('route1-rock-clearing'));
      for(let y=7;y<=9;y++)for(let x=28;x<=30;x++){
        const grass=(x>=29&&y>=8);
        cell(x,y,grass?5:6,false);if(grass)grassTiles()?.add(x+','+y);
      }
      for(let x=20;x<=22;x++)for(let y=15;y<=17;y++){
        const crossed=flags.has('route1-surf-crossing');
        cell(x,y,crossed?0:0,!crossed);
      }
      const crossed=flags.has('route1-surf-crossing');
      for(let y=15;y<=17;y++)cell(23,y,crossed?5:0,!crossed);
      if(crossed){
        cell(19,16,6,false);cell(18,16,5,false);grassTiles()?.add('18,16');for(let y=15;y<=17;y++){cell(23,y,5,false);grassTiles()?.add('23,'+y)}
      }
    }catch(_){}
  }
  prepareSecretMap();
  function hasTechnique(key){return ensureFieldState().fieldTechniques.includes(key)}
  function huntAvailable(hunt,place){
    if(!unlocked(place))return false;
    const p=ensureFieldState();
    if(hunt.flag&&!p.kantoPuzzleFlags.includes(hunt.flag))return false;
    if(hunt.technique&&!hasTechnique(hunt.technique))return false;
    return true;
  }
  function canTeach(key,place){
    const rule=FIELD_TECHNIQUES[key],p=player(),s=getSave();
    if(!rule||rule.source!==place.id||hasTechnique(key)||Number(p.gymsDefeated||0)<rule.badges)return false;
    if(!s.visited?.includes(place.id))return false;
    if(rule.seen&&seen().size<rule.seen)return false;
    return true;
  }
  function isAdventureTile(x,y){
    if(x>=15&&x<=19&&y>=9&&y<=13)return true;
    if(x>=27&&x<=30&&y>=6&&y<=10)return true;
    if(x>=19&&x<=23&&y>=15&&y<=17)return true;
    return false;
  }
  function unlocked(place) {
    if (place.id==='pallet'||place.id==='route-1') return true;
    const index=GEN1.indexOf(place), prev=GEN1[index-1];
    if (!prev) return true;
    const gate=Number(place.badge||prev.badge||0);
    const badges=Number(player().gymsDefeated||0);
    const prevOpen=prev.id==='route-1' ? discoveredCount(prev)>=3 : !!getSave().visited?.includes(prev.id);
    return prevOpen && badges>=gate;
  }
  function discoveredCount(place) {
    const s=routeFound(place.id);
    const pokedex=seen();
    return place.id==='route-1'
      ? [...s].filter(id=>place.species.includes(id)).length
      : place.species.reduce((n,id)=>n+(s.has(id)||pokedex.has(id)?1:0),0);
  }
  function markSeen(id) {
    const x=Math.floor(Number(player().tx ?? player().x)||0), y=Math.floor(Number(player().ty ?? player().y)||0);
    // Kanto's existing playable opening: the tall grass on the northern Route 1.
    if (!grassTiles()?.has(x+','+y)) return;
    const s=getSave(),found=new Set(s['route-1']||[]); found.add(Number(id)); s['route-1']=[...found];
    s.visited=[...new Set([...(s.visited||[]),'route-1'])]; putSave(s);
    if(found.size>=3&&!s.viridianNotified){s.viridianNotified=true;putSave(s);setTimeout(()=>W.notif?.('Missão da Rota 1 concluída. Viridian City aparece no Atlas de Kanto.',350),500)}
  }
  function claimTechnique(key,place){
    if(!canTeach(key,place))return false;
    const p=ensureFieldState();p.fieldTechniques.push(key);
    try{W.autoSave?.()}catch(_){}
    W.notif?.(`${FIELD_TECHNIQUES[key].name} aprendido. Segredos com essa habilidade já podem ser explorados.`,2600);
    return true;
  }
  function solveMystery(place,mystery,answer){
    const p=ensureFieldState();
    if(p.kantoPuzzleFlags.includes(mystery.id))return false;
    if(mystery.kind==='field'&&!hasTechnique(mystery.technique)){
      W.notif?.(`Você precisa de ${FIELD_TECHNIQUES[mystery.technique]?.name||mystery.technique} para abrir este caminho.`,2200);return false;
    }
    if(mystery.kind==='riddle'&&answer!==mystery.answer){W.notif?.('A sequência não funcionou. Releia a pista do personagem.',2000);return false;}
    p.kantoPuzzleFlags.push(mystery.id);
    if(mystery.physical){p.kantoPuzzleFlags.push(mystery.physical);prepareSecretMap()}
    const reward=Math.max(0,Number(mystery.reward)||0);p.gold=(Number(p.gold)||0)+reward;
    if(mystery.item){p.inventory=p.inventory||{};p.inventory[mystery.item]=(Number(p.inventory[mystery.item])||0)+1}
    try{W.autoSave?.();W.updateHUD?.()}catch(_){}
    W.notif?.(`Segredo descoberto: ${mystery.name}. Recompensa: ${reward.toLocaleString('pt-BR')} Gold${mystery.item?' e 1 '+mystery.item:''}.`,3000);
    update(place.id);return true;
  }
  function stateLabel(place) {
    const found=discoveredCount(place);
    if(place.id==='pallet')return 'INÍCIO DA JORNADA';
    if(place.id==='route-1')return `${found}/3 espécies registradas`;
    if(unlocked(place))return 'ABERTA NO ATLAS';
    return `BLOQUEADA · ${Math.max(0,Number(place.badge||0)-Number(player().gymsDefeated||0))} insígnias restantes`;
  }
  const escape = s => String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const CAMPAIGN_LINKS = [
    ['pallet','route-1'],['route-1','viridian'],['viridian','route-2'],['route-2','viridian-forest'],['viridian-forest','pewter'],
    ['pewter','route-3'],['route-3','mt-moon'],['mt-moon','route-4'],['route-4','cerulean'],
    ['cerulean','route-24-25'],['cerulean','route-5-6'],['route-5-6','saffron'],['route-5-6','vermilion'],
    ['vermilion','ss-anne'],['vermilion','route-11'],['route-11','diglett-cave'],['diglett-cave','route-2'],
    ['cerulean','route-9-10'],['route-9-10','power-plant'],['route-9-10','rock-tunnel'],['rock-tunnel','lavender'],
    ['lavender','pokemon-tower'],['lavender','route-8'],['route-8','saffron'],['saffron','route-7'],['route-7','celadon'],
    ['celadon','rocket-hideout'],['saffron','silph-co'],['celadon','route-16-18'],['route-16-18','fuchsia'],
    ['lavender','route-12-15'],['route-12-15','fuchsia'],['fuchsia','safari-zone'],['fuchsia','route-19-21'],
    ['route-19-21','seafoam'],['seafoam','cinnabar'],['cinnabar','pokemon-mansion'],['viridian','viridian-gym'],
    ['viridian','route-22-23'],['route-22-23','indigo']
  ];
  const LOCAL_ART = {
    viridian:'/assets/kanto/approved/viridian-approved.webp',
    pewter:'/assets/kanto/approved/pewter-approved.webp',
    cerulean:'/assets/kanto/approved/cerulean-approved.webp',
    'mt-moon':'/assets/kanto/approved/mt-moon-approved.webp'
  };
  let selectedAtlasPlace = null;
  let selectedAtlasTab = 'journey';
  const atlasView = {zoom:1,panX:0,panY:0,scene:null,bound:false,drag:null,renderDetail:null,suppressClick:false};
  function campaignGoalId() {
    const q=W.PsyKantoWorldV2?.progress?.()||{};
    if(!q.oak)return 'pallet';
    if(!q.viridian)return 'route-1';
    const visited=new Set(getSave().visited||[]);
    const frontier=GEN1.find(p=>p.id!=='pallet'&&p.id!=='route-1'&&!visited.has(p.id)&&unlocked(p));
    return frontier?.id||getSave().activePlace||'indigo';
  }
  function campaignCurrentPlaceId() {
    const world=W.PsyKantoWorldV2;
    const active=world?.isOpen?.()?world.getPosition?.()?.world:null;
    if(active&&GEN1.some(place=>place.id===active))return active;
    const playable=W.PsyKantoPlayableV1?.getPosition?.()?.world;
    if(playable&&GEN1.some(place=>place.id===playable))return playable;
    const saved=getSave().activePlace;
    return GEN1.some(place=>place.id===saved)?saved:'pallet';
  }
  function routeEdgesTo(goalId) {
    const start=campaignCurrentPlaceId();if(start===goalId)return new Set();
    const byId=new Map(GEN1.map(place=>[place.id,place]));
    const queue=[start],previous=new Map([[start,null]]),previousEdge=new Map();
    while(queue.length){
      const current=queue.shift();if(current===goalId)break;
      CAMPAIGN_LINKS.forEach((edge,index)=>{
        if(!unlocked(byId.get(edge[0]))||!unlocked(byId.get(edge[1])))return;
        const next=edge[0]===current?edge[1]:edge[1]===current?edge[0]:null;
        if(next&&!previous.has(next)){previous.set(next,current);previousEdge.set(next,index);queue.push(next);}
      });
    }
    if(!previous.has(goalId))return new Set();
    const result=new Set();for(let at=goalId;previous.get(at)!==null;at=previous.get(at))result.add(previousEdge.get(at));
    return result;
  }
  function modal() {
    let el=D.getElementById('psy-kanto-atlas');if(el)return el;
    el=D.createElement('div');el.id='psy-kanto-atlas';el.className='psy-kanto-atlas';
    el.innerHTML='<section class="psy-kanto-sheet" role="dialog" aria-modal="true" aria-label="Atlas da Jornada de Kanto"><header class="psy-kanto-header"><div class="psy-kanto-brand"><img src="/assets/ui/kanto-atlas-compass-v3.png" alt="" aria-hidden="true"><div><small>KANTO · ATLAS DA JORNADA</small><h2>Uma região, muitas histórias</h2><p>Descubra caminhos, acompanhe missões e escolha seu próximo destino.</p></div></div><button class="psy-kanto-close" aria-label="Fechar atlas">×</button></header><div class="psy-kanto-progress"></div><div class="psy-kanto-layout"><nav class="psy-kanto-map" aria-label="Mapa ilustrado das localidades de Kanto"></nav><article class="psy-kanto-detail" aria-live="polite"></article></div></section>';
    el.addEventListener('click',e=>{if(e.target===el)el.classList.remove('open')});
    el.querySelector('.psy-kanto-close').onclick=()=>el.classList.remove('open');
    D.body.appendChild(el);return el;
  }
  function fitAtlasScene(map) {
    const scene=map.querySelector('.psy-kanto-map-world');if(!scene)return;
    atlasView.scene=scene;
    const r=map.getBoundingClientRect();if(!r.width||!r.height)return;
    let w=r.width,h=w/1.5;if(h>r.height){h=r.height;w=h*1.5;}
    scene.style.width=w+'px';scene.style.height=h+'px';
    applyAtlasView(map);
  }
  function applyAtlasView(map) {
    const scene=map?.querySelector('.psy-kanto-map-world')||atlasView.scene;if(!scene)return;
    atlasView.scene=scene;
    scene.style.transform='translate(-50%,-50%) translate('+atlasView.panX+'px,'+atlasView.panY+'px) scale('+atlasView.zoom+')';
    if(map)map.dataset.labelMode=atlasView.zoom>=1.72?'all':atlasView.zoom>=1.18?'regional':'quiet';
  }
  function setAtlasZoom(map,value,event) {
    const old=atlasView.zoom,next=Math.max(.86,Math.min(2.35,value));if(next===old)return;
    if(event){const r=map.getBoundingClientRect(),cx=event.clientX-r.left-r.width/2,cy=event.clientY-r.top-r.height/2;atlasView.panX=cx-(cx-atlasView.panX)*next/old;atlasView.panY=cy-(cy-atlasView.panY)*next/old;}
    atlasView.zoom=next;applyAtlasView(map);
  }
  function nearestAtlasNode(map,x,y) {
    let best=null,bestDistance=Infinity;
    map.querySelectorAll('[data-place]').forEach(button=>{
      const icon=button.querySelector('.psy-kanto-sigil'),r=icon?.getBoundingClientRect();if(!r)return;
      const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom);if(dx>7||dy>7)return;
      const distance=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2));
      if(distance<bestDistance){bestDistance=distance;best=button;}
    });
    return best;
  }
  function bindAtlasMap(map) {
    if(map.dataset.atlasBound)return;map.dataset.atlasBound='true';
    map.addEventListener('click',e=>{
      const zoom=e.target.closest('[data-atlas-zoom]');
      if(zoom){setAtlasZoom(map,atlasView.zoom+Number(zoom.dataset.atlasZoom));return;}
      if(e.target.closest('[data-atlas-reset]')){atlasView.zoom=1;atlasView.panX=0;atlasView.panY=0;applyAtlasView(map);return;}
      if(atlasView.suppressClick){atlasView.suppressClick=false;return;}
      const button=(e.detail?nearestAtlasNode(map,e.clientX,e.clientY):null)||e.target.closest('[data-place]')||nearestAtlasNode(map,e.clientX,e.clientY);if(!button)return;
      const place=GEN1.find(p=>p.id===button.dataset.place);if(!place)return;
      selectedAtlasPlace=place.id;selectedAtlasTab='journey';
      map.querySelectorAll('.psy-kanto-node.selected').forEach(n=>n.classList.remove('selected'));button.classList.add('selected');
      atlasView.renderDetail?.(place);
    });
    map.addEventListener('wheel',e=>{e.preventDefault();setAtlasZoom(map,atlasView.zoom+(e.deltaY<0?.12:-.12),e);},{passive:false});
    map.addEventListener('pointerdown',e=>{
      atlasView.suppressClick=false;
      if(e.button!==undefined&&e.button!==0||e.target.closest('button')||e.target.closest('.psy-kanto-map-tools'))return;
      atlasView.drag={id:e.pointerId,x:e.clientX,y:e.clientY,panX:atlasView.panX,panY:atlasView.panY,moved:false};
      map.setPointerCapture?.(e.pointerId);
    });
    map.addEventListener('pointermove',e=>{
      const d=atlasView.drag;if(!d||d.id!==e.pointerId){
        if(e.pointerType==='mouse'){
          const hovered=nearestAtlasNode(map,e.clientX,e.clientY);
          map.querySelectorAll('[data-hovered="true"]').forEach(n=>{if(n!==hovered)delete n.dataset.hovered;});
          if(hovered)hovered.dataset.hovered='true';
          map.style.cursor=hovered?'pointer':'grab';
        }
        return;
      }
      const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>4)d.moved=true;
      if(d.moved){atlasView.panX=d.panX+dx;atlasView.panY=d.panY+dy;applyAtlasView(map);}
    });
    const end=e=>{if(atlasView.drag?.id===e.pointerId){atlasView.suppressClick=atlasView.drag.moved;atlasView.drag=null;try{map.releasePointerCapture?.(e.pointerId)}catch(_){}}};
    map.addEventListener('pointerup',end);map.addEventListener('pointercancel',end);map.addEventListener('lostpointercapture',end);
    map.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){e.preventDefault();setAtlasZoom(map,atlasView.zoom+.15)}else if(e.key==='-'){e.preventDefault();setAtlasZoom(map,atlasView.zoom-.15)}else if(e.key==='0'){e.preventDefault();atlasView.zoom=1;atlasView.panX=0;atlasView.panY=0;applyAtlasView(map)}});
    if('ResizeObserver'in W){new ResizeObserver(()=>fitAtlasScene(map)).observe(map);}
    W.addEventListener('resize',()=>fitAtlasScene(map),{passive:true});
  }
  function mapLines(goalId) {
    const byId=new Map(GEN1.map(p=>[p.id,p]));
    const route=routeEdgesTo(goalId);
    return CAMPAIGN_LINKS.map((edge,i)=>{
      const a=byId.get(edge[0]),b=byId.get(edge[1]);if(!a||!b)return '';
      const dx=b.x-a.x,dy=b.y-a.y,bend=(i%3-1)*.055;
      const mx=(a.x+b.x)/2-dy*bend,my=(a.y+b.y)/2+dx*bend;
      const open=unlocked(a)&&unlocked(b),goal=route.has(i)&&open;
      return '<path class="psy-kanto-link '+(open?'open':'locked')+(goal?' goal':'')+'" d="M'+a.x+' '+a.y+' Q'+mx.toFixed(2)+' '+my.toFixed(2)+' '+b.x+' '+b.y+'"/>';
    }).join('');
  }
  function mapNodes(activeId,goalId) {
    const sigil={city:'0%',route:'33.333%',dungeon:'66.667%',landmark:'100%'};
    return GEN1.map(p=>{
      const open=unlocked(p),selected=p.id===activeId,goal=p.id===goalId;
      const huntCount=(p.hunts||[]).length;
      return '<button type="button" class="psy-kanto-node '+p.kind+' '+(open?'open':'locked')+(selected?' selected':'')+(goal?' goal':'')+'" data-place="'+p.id+'" style="--x:'+p.x+'%;--y:'+p.y+'%;--sigil-position:'+(sigil[p.kind]||'33.333%')+'" aria-label="'+escape(p.name)+' · '+(open?'disponível':'bloqueado')+(goal?' · objetivo principal':'')+'" title="'+escape(p.name)+'"><span class="psy-kanto-sigil" aria-hidden="true"></span>'+(goal?'<span class="node-goal-tag">MISSÃO</span>':'')+'<span class="node-name">'+escape(p.name)+'</span>'+(huntCount?'<span class="node-hunts">'+huntCount+' áreas</span>':'')+'</button>';
    }).join('');
  }
  function cropArtwork(place) {
    const src=place.art||LOCAL_ART[place.id];
    if(src)return '<img class="psy-kanto-place-art" src="'+escape(src)+'" alt="Paisagem de '+escape(place.name)+'">';
    const x=Math.max(0,Math.min(100,25+place.x*.5)),y=Math.max(0,Math.min(100,25+place.y*.5));
    return '<div class="psy-kanto-place-art psy-kanto-place-crop" role="img" aria-label="Paisagem da região próxima a '+escape(place.name)+'" style="background-image:url(/assets/story/kanto-region-v1.webp);background-position:'+x+'% '+y+'%"></div>';
  }
  function update(selectedId) {
    const el=modal(),progress=el.querySelector('.psy-kanto-progress'),map=el.querySelector('.psy-kanto-map'),detail=el.querySelector('.psy-kanto-detail');
    const goalId=campaignGoalId();
    const activeId=selectedId||selectedAtlasPlace||getSave().activePlace||goalId;
    selectedAtlasPlace=activeId;
    const badges=Math.max(0,Number(player().gymsDefeated||0)),count=seen().size;
    progress.innerHTML='<span class="atlas-stat"><small>Pokédex</small><b>'+count+' espécies</b></span><span class="atlas-stat"><small>Insígnias</small><b>'+badges+'/8</b></span><span class="atlas-stat"><small>Técnicas</small><b>'+ensureFieldState().fieldTechniques.length+'</b></span><span class="atlas-stat atlas-frontier"><small>Próximo marco</small><b>'+escape(GEN1.find(p=>p.id===goalId)?.name||'Kanto')+'</b></span>';
    map.innerHTML='<div class="psy-kanto-map-top"><span class="map-region-mark">KANTO <i>·</i> PRIMEIRA GERAÇÃO</span><span class="map-hint">Arraste para explorar · rode a roda para aproximar</span></div><div class="psy-kanto-map-world"><img class="psy-kanto-region-image" src="/assets/story/kanto-region-v1.webp" alt="" draggable="false"><div class="psy-kanto-map-shade"></div><svg class="psy-kanto-route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+mapLines(goalId)+'</svg>'+mapNodes(activeId,goalId)+'</div><div class="psy-kanto-map-legend" aria-label="Legenda"><span><i class="legend-city"></i>Cidade</span><span><i class="legend-route"></i>Rota</span><span><i class="legend-special"></i>Local especial</span><span><i class="legend-locked"></i>Bloqueado</span></div><img class="psy-kanto-map-compass" src="/assets/ui/kanto-atlas-compass-v3.png" alt="" aria-hidden="true"><div class="psy-kanto-map-tools" role="group" aria-label="Controles do mapa"><button type="button" data-atlas-zoom="0.2" aria-label="Aumentar zoom" title="Aumentar zoom">+</button><button type="button" data-atlas-zoom="-0.2" aria-label="Diminuir zoom" title="Diminuir zoom">−</button><button type="button" data-atlas-reset aria-label="Centralizar mapa" title="Centralizar mapa">⌖</button></div>';
    map.dataset.goalId=goalId;bindAtlasMap(map);fitAtlasScene(map);
    const selected=GEN1.find(p=>p.id===activeId)||GEN1.find(p=>p.id==='route-1');
    renderDetail(selected);
    function renderDetail(place) {
      if(!place)return;
      detail.dataset.placeId=place.id;detail.dataset.goalId=goalId;detail.dataset.mainGoal=String(place.id===goalId);
      const open=unlocked(place),found=discoveredCount(place),tab=selectedAtlasTab;
      const sprites=place.species.slice(0,8).map(id=>{
        const known=seen().has(id),name=W.getPokeName?.(id)||'Pokémon #'+id;
        return '<div class="psy-kanto-species '+(known?'known':'')+'" title="'+escape(name)+'"><img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+id+'.png" alt="'+(known?escape(name):'Espécie ainda não registrada')+'"><span>'+(known?escape(name):'???')+'</span></div>';
      }).join('');
      const huntCards=(place.hunts||[]).map(hunt=>{
        const active=getSave().activeHunt===hunt.id;
        const mini=hunt.species.slice(0,4).map(id=>'<img loading="lazy" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'+id+'.png" alt="'+escape(W.getPokeName?.(id)||'Pokémon')+'">').join('');
        const available=huntAvailable(hunt,place),gate=place.id==='route-1'&&hunt.flag&&!ensureFieldState().kantoPuzzleFlags.includes(hunt.flag)?'SEGREDO FECHADO':hunt.technique&&!hasTechnique(hunt.technique)?'REQUER '+(FIELD_TECHNIQUES[hunt.technique]?.name||'TÉCNICA'):open?'SELECIONAR':'BLOQUEADO';
        return '<button type="button" class="psy-kanto-hunt-card '+(active?'selected':'')+'" data-hunt="'+escape(hunt.id)+'" '+(available?'':'disabled')+'><span class="psy-kanto-hunt-copy"><b>'+escape(hunt.name)+'</b><small>'+escape(hunt.terrain)+' · '+escape(hunt.level)+'</small></span><span class="psy-kanto-hunt-sprites">'+mini+'</span><span class="psy-kanto-hunt-action">'+(active?'SELECIONADO':escape(gate))+'</span></button>';
      }).join('');
      const teachers=Object.entries(FIELD_TECHNIQUES).filter(([,rule])=>rule.source===place.id).map(([key,rule])=>{
        const learned=hasTechnique(key),ready=canTeach(key,place),req=rule.seen?rule.badges+' insígnias e '+rule.seen+' espécies na Pokédex':rule.badges+' insígnias e capítulo selecionado';
        return '<div class="psy-kanto-teacher '+(learned?'learned':'')+'"><b>'+escape(rule.name)+'</b><span>'+escape(rule.clue)+'</span><button type="button" data-teach="'+key+'" '+(ready?'':'disabled')+'>'+(learned?'APRENDIDA':ready?'APRENDER':'REQUER '+escape(req))+'</button></div>';
      }).join('');
      const puzzleCards=(place.mysteries||[]).map(mystery=>{
        const solved=ensureFieldState().kantoPuzzleFlags.includes(mystery.id),hasRequired=mystery.kind!=='field'||hasTechnique(mystery.technique);
        const choices=mystery.kind==='riddle'?'<div class="psy-kanto-choices">'+mystery.choices.map(([label,value])=>'<button type="button" data-answer="'+escape(mystery.id)+'" data-value="'+escape(value)+'" '+(!open||solved?'disabled':'')+'>'+escape(label)+'</button>').join('')+'</div>':'<button type="button" class="psy-kanto-solve-field" data-solve="'+escape(mystery.id)+'" '+(!open||solved||!hasRequired?'disabled':'')+'>'+(solved?'SEGREDO REVELADO':hasRequired?'USAR '+escape(FIELD_TECHNIQUES[mystery.technique]?.name||'TÉCNICA'):'PRECISA DE '+escape(FIELD_TECHNIQUES[mystery.technique]?.name||'TÉCNICA'))+'</button>';
        return '<section class="psy-kanto-puzzle '+(solved?'solved':'')+'"><div class="psy-kanto-puzzle-title"><b>'+escape(mystery.name)+'</b><small>'+(solved?'RESOLVIDO':mystery.kind==='field'?'MISTÉRIO · '+escape(FIELD_TECHNIQUES[mystery.technique]?.name||'HABILIDADE'):'ENIGMA')+'</small></div><p>'+escape(mystery.clue)+'</p>'+choices+'</section>';
      }).join('');
      const kind=place.kind==='city'?'CIDADE':place.kind==='dungeon'?'CAVERNA E LOCAL ESPECIAL':place.kind==='landmark'?'MARCO DA JORNADA':'ROTA';
      const advance=open&&place.id!=='pallet'&&place.id!=='route-1'?'<button type="button" class="psy-kanto-advance">AVANÇAR A JORNADA</button>':'';
      detail.innerHTML='<div class="psy-kanto-detail-hero">'+cropArtwork(place)+'<div class="place-art-wash"></div><div class="place-heading"><span class="psy-kanto-detail-kicker">'+kind+'</span><h3>'+escape(place.name)+'</h3><p>'+escape(place.mark)+'</p></div></div><div class="psy-kanto-detail-status '+(open?'open':'closed')+'"><span class="status-dot"></span><span>'+escape(stateLabel(place))+'</span><b>'+(place.id===goalId?'MISSÃO':'KANTO')+'</b></div><div class="psy-kanto-detail-tabs" role="tablist" aria-label="Informações da localidade"><button type="button" data-atlas-tab="journey" role="tab" aria-selected="'+(tab==='journey')+'">Jornada</button><button type="button" data-atlas-tab="habitats" role="tab" aria-selected="'+(tab==='habitats')+'">Habitats · '+place.hunts.length+'</button><button type="button" data-atlas-tab="secrets" role="tab" aria-selected="'+(tab==='secrets')+'">Mistérios · '+place.mysteries.length+'</button><button type="button" data-atlas-tab="pokedex" role="tab" aria-selected="'+(tab==='pokedex')+'">Espécies · '+place.species.length+'</button></div><div class="psy-kanto-detail-body"><section data-atlas-pane="journey" role="tabpanel" '+(tab!=='journey'?'hidden':'')+'><div class="psy-kanto-quest-card"><span class="quest-card-icon">✦</span><div><small>MISSÃO PRINCIPAL</small><b>'+escape(place.quest)+'</b><p>Encontre '+escape(place.npc)+' para avançar sua jornada.</p></div></div>'+(teachers?'<h4>Técnicas de campo</h4><div class="psy-kanto-teachers">'+teachers+'</div>':'')+(open&&place.id===goalId?'<button type="button" class="psy-kanto-follow-goal">SEGUIR OBJETIVO · IR</button>':'')+advance+'</section><section data-atlas-pane="habitats" role="tabpanel" '+(tab!=='habitats'?'hidden':'')+'><div class="psy-kanto-section-intro"><b>Locais de caça</b><span>Escolha um habitat para acompanhar suas espécies.</span></div><div class="psy-kanto-hunt-list">'+huntCards+'</div></section><section data-atlas-pane="secrets" role="tabpanel" '+(tab!=='secrets'?'hidden':'')+'><div class="psy-kanto-section-intro"><b>Histórias e segredos</b><span>Personagens, enigmas e passagens desta localidade.</span></div><div class="psy-kanto-story"><b>Personagem</b><span>'+escape(place.npc)+'</span><b>História</b><span>'+escape(place.quest)+'</span></div><div class="psy-kanto-puzzles">'+puzzleCards+'</div></section><section data-atlas-pane="pokedex" role="tabpanel" '+(tab!=='pokedex'?'hidden':'')+'><div class="psy-kanto-section-intro"><b>Espécies desta região</b><span>'+found+'/'+place.species.length+' registradas na sua Pokédex.</span></div><div class="psy-kanto-species-list">'+sprites+'</div></section></div>';
      detail.querySelectorAll('[data-atlas-tab]').forEach(button=>button.onclick=()=>{
        selectedAtlasTab=button.dataset.atlasTab;
        detail.querySelectorAll('[data-atlas-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
        detail.querySelectorAll('[data-atlas-pane]').forEach(p=>{p.hidden=p.dataset.atlasPane!==selectedAtlasTab});
      });
      detail.querySelectorAll('[data-hunt]').forEach(button=>button.onclick=()=>{
        const save=getSave();save.activeHunt=button.dataset.hunt;putSave(save);
        const hunt=place.hunts.find(item=>item.id===button.dataset.hunt);
        if(hunt){const p=player();p.activeKantoHunt=hunt.id;try{W.autoSave?.()}catch(_){}}
        selectedAtlasTab='habitats';renderDetail(place);W.notif?.('Local de caça selecionado no Atlas.',1600);
      });
      detail.querySelectorAll('[data-teach]').forEach(button=>button.onclick=()=>{if(claimTechnique(button.dataset.teach,place)){selectedAtlasTab='journey';update(place.id);W.updateHUD?.()}});
      detail.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>{const puzzle=place.mysteries.find(x=>x.id===button.dataset.answer);if(puzzle)solveMystery(place,puzzle,button.dataset.value)});
      detail.querySelectorAll('[data-solve]').forEach(button=>button.onclick=()=>{const puzzle=place.mysteries.find(x=>x.id===button.dataset.solve);if(puzzle)solveMystery(place,puzzle)});
      detail.querySelector('.psy-kanto-follow-goal')?.addEventListener('click',()=>{
        el.classList.remove('open');
        const automation=W.PsyCampaignAutomation;
        if(automation?.startPrimaryRoute)automation.startPrimaryRoute();
        else W.PsyKantoWorldV2?.open?.(place.id);
      });
      const advanceButton=detail.querySelector('.psy-kanto-advance');
      if(advanceButton)advanceButton.onclick=()=>{const s=getSave();s.visited=[...new Set([...(s.visited||[]),place.id])];s.activePlace=place.id;putSave(s);selectedAtlasTab='journey';update(place.id);W.notif?.('Capítulo adicionado à sua jornada.',1800)};
    }
    atlasView.renderDetail=renderDetail;
  }
  W.openKantoJourneyV1=function(){const el=modal();el.classList.add('open');update();};
  W.PsyKantoJourneyV1={version:1,connections:CAMPAIGN_LINKS.map(edge=>edge.slice()),places:GEN1.map(p=>({...p,species:[...p.species],hunts:p.hunts.map(h=>({...h,species:[...h.species]}))})),refresh:update,recordEncounter:markSeen,isAdventureTile,hasTechnique,solveMystery};
  const oldTrigger=W.triggerWild;
  if(typeof oldTrigger==='function')W.triggerWild=function(pool){
    let result,oldGet=null,called=false;
    try{
      const p=player(),hunt=GEN1.flatMap(place=>place.hunts.map(h=>({place,h}))).find(entry=>entry.h.id===p.activeKantoHunt);
      const x=Math.floor(Number(p.tx??p.x)||0),y=Math.floor(Number(p.ty??p.y)||0);
      if(hunt?.place.id==='route-1'&&hunt.h.tiles?.includes(`${x},${y}`)&&huntAvailable(hunt.h,hunt.place)&&typeof W.getPokesForHunt==='function'){
        oldGet=W.getPokesForHunt;
        W.getPokesForHunt=function(region,type,tier){
          if(region==='kanto'&&type==='normal'&&Number(tier)===1)return hunt.h.species.map(id=>({id,name:W.getPokeName?.(id)||`Pokémon ${id}`,type:W.TYPE_BY_ID_ALL?.[id]||'Normal'}));
          return oldGet.apply(this,arguments);
        };
        called=true;result=oldTrigger.call(this,pool||'kanto_normal_t1');
      }else{called=true;result=oldTrigger.apply(this,arguments)}
    }catch(error){if(!called){called=true;result=oldTrigger.apply(this,arguments)}else console.warn('[KANTO JOURNEY] Hunt encounter pool restore:',error)}
    finally{if(oldGet)W.getPokesForHunt=oldGet}
    try{if(typeof battleData!=='undefined'&&battleData?.wild)markSeen(battleData.wild.id)}catch(_){}
    return result
  };
  W.addEventListener('storage',e=>{if(e.key===SAVE_KEY&&D.getElementById('psy-kanto-atlas')?.classList.contains('open'))update()});
})(window,document);
