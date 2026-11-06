/* PSYWORLD Kanto V9: six independent illustrated interiors.
 * All images and NPC bodies are committed to the PREVIEW branch only.
 * No generic walls, giant painted room titles or display placeholders.
 */
(function(W){
'use strict';
const path='assets/kanto/interiors/',npc='assets/kanto/npcs/';
const portrait={
  oak:'assets/story/professor-oak.png',
  nurse:npc+'nurse-v9.svg',
  vendor:npc+'vendor-v9.svg',
  mother:npc+'mother-v9.svg',
  fisher:npc+'fisher-v9.svg',
  child:npc+'child-v9.svg',
  assistant:'assets/halloween/npc-researcher.webp'
};
function actor(id,name,at,kind,emote='sereno'){
  const art=portrait[id]||npc+kind+'-v9.svg';
  return {id,name,at,sprite:art,portrait:art,emote};
}
const common=(id,npcs,blocks,intro,who)=>{
  return {id,art:path+id+'-v9.svg',w:800,h:470,
    spawn:[400,397],exit:[400,435],npcs,blocks,intro,who};
};
const rooms={
 center:common('center',[actor('nurse','Enfermeira Íris',[400,274],'nurse','acolhedora'),
   actor('visitor','Treinador visitante',[540,355],'child','alegre')],
   [[245,180,555,260],[35,170,213,310],[588,170,766,310],
    [70,338,233,416],[577,338,733,416]],
   'A luz acolhedora do Centro Pokémon ilumina a recepção. A enfermeira Íris cuida dos treinadores que iniciam sua jornada.',
   'nurse'),
 market:common('market',[actor('vendor','Davi, o lojista',[401,272],'vendor','animado')],
   [[246,174,555,256],[38,171,214,305],[586,171,764,305],
    [32,304,210,430],[590,304,768,430]],
   'O aroma de madeira encerada e o brilho das prateleiras anunciam a loja de Pallet. Davi organiza os itens para novos treinadores.',
   'vendor'),
 lab:common('lab',[actor('oak','Professor Car’alho',[400,290],'oak','sereno'),
   actor('assistant','Pesquisador Elias',[548,333],'child','curioso')],
   [[285,184,515,266],[37,165,213,300],[588,165,766,300],
    [41,322,225,412],[575,322,758,410]],
   'Pesquisas, mapas e instrumentos cercam o laboratório. O Professor Car’alho aguarda o início da sua jornada por Kanto.',
   'oak'),
 home:common('home',[actor('mother','Elisa, sua mãe',[314,300],'mother','carinhosa')],
   [[75,198,257,293],[515,173,673,339],[309,35,489,160],
    [72,336,234,412]],
   'Sua casa tem o aconchego de sempre. Elisa preparou tudo para que você parta com segurança.',
   'mother'),
 'house-east':common('house-east',[actor('child','Luna, a moradora',[552,332],'child','animada')],
   [[35,164,200,305],[600,164,766,302],[288,243,513,323],
    [78,335,242,409]],
   'Uma casa cheia de flores e recordações. Luna conhece os melhores cantinhos escondidos de Pallet.',
   'child'),
 'house-west':common('house-west',[actor('fisher','Seu Abel, pescador',[341,283],'fisher','tranquilo')],
   [[30,168,213,296],[594,168,767,297],[67,298,236,410],
    [548,277,706,427]],
   'O ar tem cheiro de mar. Abel guarda lembranças de viagens pelo litoral de Kanto.',
   'fisher')
};
const palletNpcArt={
 gate:npc+'guard-v9.svg',
 neighbor:'assets/halloween/npc-mina.svg',
 lia:'assets/story/rival.png'
};
for(const [id,sprite] of Object.entries(palletNpcArt)){
 const target=W.PsyKantoMapDataV2?.pallet?.npcs?.find(n=>n.id===id);
 if(!target)continue;
 target.sprite=sprite;target.portrait=sprite;
 if(id==='lia')target.name='Rival';
 if(id==='neighbor')target.name='Mina';
}
W.PsyKantoInteriorsV9={
 rooms,get:id=>rooms[id]||null,
 blocks:(id)=>rooms[id]?.blocks||[],
};
})(window);
