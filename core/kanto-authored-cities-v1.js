/* PSYWORLD — original authored Kanto city layouts (GEN1).
 * Deterministic 32x20 top-down maps. Art shapes and palettes are original
 * procedural pixel art; this file contains no extracted game maps or assets.
 * City exits are intentionally null. Campaign chapter navigation owns routes.
 */
(function (W) {
  'use strict';
  if (W.PsyKantoAuthoredCitiesV1) return;

  const WIDTH=32, HEIGHT=20;
  const T=Object.freeze({lawn:0,path:1,grass:2,rock:3,water:4,tree:9,building:9});
  const building=(id,name,x,y,w,h,doorX,doorY,style='house')=>({id,name,footprint:{x,y,width:w,height:h},door:{x:doorX,y:doorY},style});
  const DATA={
    viridian:{name:'Viridian City',npc:{x:13,y:10,name:'Guia de Viridian'},object:{x:18,y:10,kind:'fountain'},palette:{roof:'#47774a',light:'#80ae66',dark:'#31573f',wall:'#d7d3a0',road:'#cfb77d',grass:'#68ab55',water:'#3c98ad',accent:'#e5d179'},buildings:[building('mart','Mercado de Viridian',3,2,6,4,5,6,'shop'),building('pokecenter','Centro Pokémon',23,2,6,4,25,6,'center'),building('trainer-home','Casa do Treinador',3,14,6,4,5,13),building('flower-home','Casa do Jardim',23,14,6,4,25,13)],feature:{kind:'fountain',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[21,16]]},
    pewter:{name:'Pewter City',npc:{x:14,y:10,name:'Guia do Museu'},object:{x:18,y:10,kind:'statue'},palette:{roof:'#77766c',light:'#b6aa88',dark:'#57584f',wall:'#d1c7a9',road:'#bcb39b',grass:'#6b9d59',water:'#528ea5',accent:'#c8b879'},buildings:[building('museum','Museu de Pewter',3,2,7,4,5,6,'museum'),building('mart','Mercado de Pewter',23,2,6,4,25,6,'shop'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('gym','Ginásio de Pewter',22,14,7,4,25,13,'gym')],feature:{kind:'statue',x:17,y:9,w:2,h:2},trees:[[2,3],[29,3],[2,16],[29,16],[10,15],[20,4]]},
    cerulean:{name:'Cerulean City',npc:{x:13,y:10,name:'Guia da Cascata'},object:{x:19,y:10,kind:'pond'},palette:{roof:'#477caa',light:'#86c1dc',dark:'#355a82',wall:'#dfd5ac',road:'#cdbb85',grass:'#63aa67',water:'#319ac4',accent:'#a1e2e7'},buildings:[building('mart','Mercado de Cerulean',3,2,6,4,5,6,'shop'),building('pokecenter','Centro Pokémon',23,2,6,4,25,6,'center'),building('bike-shop','Loja de Bicicletas',3,14,7,4,5,13,'shop'),building('gym','Ginásio de Cerulean',22,14,7,4,25,13,'gym')],feature:{kind:'pond',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[11,3],[20,16]]},
    vermilion:{name:'Vermilion City',npc:{x:13,y:10,name:'Marinheiro'},object:{x:19,y:10,kind:'anchor'},palette:{roof:'#a94e45',light:'#e48d63',dark:'#753a39',wall:'#e1c79c',road:'#c3a477',grass:'#659b5a',water:'#3289b0',accent:'#f1bd62'},buildings:[building('harbor-office','Capitania do Porto',3,2,7,4,5,6,'harbor'),building('mart','Mercado de Vermilion',23,2,6,4,25,6,'shop'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('gym','Ginásio de Vermilion',22,14,7,4,25,13,'gym')],feature:{kind:'harbor',x:17,y:9,w:2,h:2},trees:[[2,3],[29,3],[2,16],[29,16],[10,15],[21,4]]},
    lavender:{name:'Lavender Town',npc:{x:13,y:10,name:'Cuidador da Torre'},object:{x:18,y:10,kind:'memorial'},palette:{roof:'#70528a',light:'#aa83c4',dark:'#4b3c67',wall:'#d7c8aa',road:'#c2ae88',grass:'#718d62',water:'#528aa0',accent:'#ddc6ee'},buildings:[building('tower','Torre Memorial',3,2,7,4,5,6,'tower'),building('mart','Mercado de Lavender',23,2,6,4,25,6,'shop'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('shrine','Casa Memorial',22,14,7,4,25,13,'shrine')],feature:{kind:'memorial',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[21,16]]},
    celadon:{name:'Celadon City',npc:{x:13,y:10,name:'Guia Comercial'},object:{x:18,y:10,kind:'garden'},palette:{roof:'#477966',light:'#83b18b',dark:'#345b54',wall:'#e4d5ad',road:'#c5b081',grass:'#69ad63',water:'#4495aa',accent:'#ed8aaa'},buildings:[building('department-store','Loja de Departamento',3,2,8,4,5,6,'store'),building('pokecenter','Centro Pokémon',23,2,6,4,25,6,'center'),building('mart','Mercado das Flores',3,14,7,4,5,13,'shop'),building('gym','Ginásio de Celadon',22,14,7,4,25,13,'gym')],feature:{kind:'garden',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[21,16]]},
    saffron:{name:'Saffron City',npc:{x:13,y:10,name:'Guia de Saffron'},object:{x:18,y:10,kind:'monument'},palette:{roof:'#b64e54',light:'#e98b77',dark:'#78384b',wall:'#e4d2ae',road:'#c1a878',grass:'#68a55d',water:'#4a98b0',accent:'#f0d471'},buildings:[building('dojo','Dojo de Saffron',3,2,7,4,5,6,'dojo'),building('silph','Edifício Silph',21,2,8,4,25,6,'tower'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('gym','Ginásio de Saffron',22,14,7,4,25,13,'gym')],feature:{kind:'monument',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[20,16]]},
    fuchsia:{name:'Fuchsia City',npc:{x:13,y:10,name:'Guia do Parque Safari'},object:{x:18,y:10,kind:'garden'},palette:{roof:'#8d5879',light:'#d78daf',dark:'#604260',wall:'#e2d2b4',road:'#c5b28a',grass:'#65a95c',water:'#428fa9',accent:'#f4cf72'},buildings:[building('safari-lodge','Pavilhão Safari',3,2,7,4,5,6,'museum'),building('mart','Mercado de Fuchsia',23,2,6,4,25,6,'shop'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('gym','Ginásio de Fuchsia',22,14,7,4,25,13,'gym')],feature:{kind:'garden',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[21,16]]},
    cinnabar:{name:'Cinnabar Island',npc:{x:13,y:10,name:'Pesquisador da Ilha'},object:{x:18,y:10,kind:'volcano'},palette:{roof:'#9c5142',light:'#df8757',dark:'#633b3d',wall:'#e4d0a6',road:'#bda27a',grass:'#789258',water:'#388eaa',accent:'#f1bb5d'},buildings:[building('lab','Laboratório Pokémon',3,2,8,4,5,6,'lab'),building('mansion','Mansão de Cinnabar',21,2,8,4,25,6,'museum'),building('pokecenter','Centro Pokémon',3,14,6,4,5,13,'center'),building('gym','Ginásio de Cinnabar',22,14,7,4,25,13,'gym')],feature:{kind:'volcano',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[10,3],[21,16]]},
    'viridian-gym':{name:'Viridian Gym',npc:{x:14,y:10,name:'Guia do Ginásio'},object:{x:18,y:10,kind:'crest'},palette:{roof:'#547047',light:'#9ba45e',dark:'#3b4f3a',wall:'#d2c299',road:'#bda97d',grass:'#63964f',water:'#42849a',accent:'#e0c05f'},buildings:[building('viridian-gym','Ginásio de Viridian',10,2,12,5,15,7,'gym'),building('guard-house','Casa dos Guardiões',3,14,6,4,5,13,'shrine'),building('healing-room','Posto de Apoio',23,14,6,4,25,13,'center')],feature:{kind:'crest',x:17,y:9,w:2,h:2},trees:[[2,4],[29,4],[2,15],[29,15],[7,3],[24,3]]}
  };

  function cityGrid(config){
    const g=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>(x<2||x>=WIDTH-2||y===0||y===HEIGHT-1)?T.tree:T.lawn));
    const rect=(x,y,w,h,t)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(g[yy]?.[xx]!==undefined)g[yy][xx]=t};
    // A closed, connected street grid, kept several tiles inside the town edge.
    rect(3,9,26,3,T.path);rect(15,5,2,10,T.path);rect(4,6,24,2,T.path);rect(4,13,24,2,T.path);
    // A compact public square joins the four avenues without creating a route mouth.
    rect(12,8,8,5,T.path);
    // Small decorative green pockets are kept away from building doors and the plaza.
    [[10,3],[20,3],[10,15],[20,15]].forEach(([x,y])=>rect(x,y,2,2,T.grass));
    for(const b of config.buildings){const f=b.footprint;rect(f.x,f.y,f.width,f.height,T.building)}
    // Door tiles are the only cells reopened inside each structure's frontage.
    for(const b of config.buildings)g[b.door.y][b.door.x]=T.path;
    // Reserve a 2×2 civic feature; water features are solid, sculpture/garden
    // features are walkable and use a separately drawn prop.
    const f=config.feature;if(f.kind==='pond'||f.kind==='harbor')rect(f.x,f.y,f.w,f.h,T.water);
    return g;
  }

  function hash(x,y,n=0){let h=Math.imul((x+31)*374761393,(y+17)*668265263)^Math.imul(n+1,1442695041);h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0}
  function drawCity(ctx,{grid,offsetX,offsetY,TILE,place}){
    const cfg=DATA[place.id],p=cfg.palette;
    for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){
      const t=grid[y][x],sx=offsetX+x*TILE,sy=offsetY+y*TILE;
      if(t===T.path){ctx.fillStyle=(hash(x,y)%4===0)?p.road:'#d5bd88';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#f1dba4';ctx.fillRect(sx+2,sy+2,TILE-4,2);ctx.fillStyle='#ae9367';ctx.fillRect(sx+4,sy+TILE-4,TILE-8,1)}
      else if(t===T.water){ctx.fillStyle=(hash(x,y)%2)?p.water:'#317fa7';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#9ddfdf';ctx.fillRect(sx+3,sy+7,8,2);ctx.fillRect(sx+TILE-10,sy+TILE-8,7,2)}
      else if(t===T.tree){ctx.fillStyle='#347a43';ctx.fillRect(sx+2,sy+2,TILE-4,TILE-3);ctx.fillStyle='#4a994b';ctx.fillRect(sx+1,sy+3,TILE-2,TILE-5);ctx.fillStyle='#82bd55';ctx.fillRect(sx+4,sy+4,7,5);ctx.fillRect(sx+TILE-9,sy+TILE-11,6,5);ctx.fillStyle='#674b33';ctx.fillRect(sx+TILE/2-2,sy+TILE-7,4,6)}
      else if(t===T.grass){ctx.fillStyle=(hash(x,y)%3)?p.grass:'#70b35b';ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#3a8147';for(let i=0;i<4;i++){const gx=sx+4+(hash(x,y,i)%Math.max(1,TILE-8));ctx.fillRect(gx,sy+TILE-9,2,6)}ctx.fillStyle=p.accent;ctx.fillRect(sx+TILE*.35,sy+TILE*.48,3,3)}
      else if(t===T.rock){ctx.fillStyle='#8d8876';ctx.fillRect(sx+3,sy+6,TILE-6,TILE-9);ctx.fillStyle='#c4b89a';ctx.fillRect(sx+6,sy+5,TILE*.3,4)}
      else {ctx.fillStyle=(hash(x,y)%5)?p.grass:'#70b35b';ctx.fillRect(sx,sy,TILE,TILE);if(hash(x,y)%7===0){ctx.fillStyle='#9aca68';ctx.fillRect(sx+5,sy+6,2,2)}}
    }
    for(const b of cfg.buildings){const f=b.footprint,x=offsetX+f.x*TILE,y=offsetY+f.y*TILE,w=f.width*TILE,h=f.height*TILE,style=b.style;
      ctx.fillStyle='#16321f66';ctx.fillRect(x+TILE*.12,y+h-TILE*.12,w,h*.18);
      ctx.fillStyle=p.dark;ctx.fillRect(x+2,y+2,w-4,h-3);
      ctx.fillStyle=p.roof;ctx.fillRect(x+4,y+3,w-8,h-TILE*.58);
      ctx.fillStyle=p.light;ctx.fillRect(x+TILE*.18,y+TILE*.2,w-TILE*.36,3);
      ctx.fillStyle=p.dark;for(let yy=y+TILE*.48;yy<y+h-TILE*.62;yy+=TILE*.32)ctx.fillRect(x+4,yy,w-8,2);
      ctx.fillStyle=p.wall;ctx.fillRect(x+TILE*.18,y+h-TILE*.56,w-TILE*.36,TILE*.3);
      if(style==='tower'){ctx.fillStyle=p.light;ctx.fillRect(x+w*.42,y+TILE*.4,w*.16,h*.18);ctx.fillStyle=p.dark;ctx.fillRect(x+w*.48,y+TILE*.4,w*.04,h*.48)}
      else if(style==='gym'||style==='dojo'){ctx.fillStyle=p.accent;ctx.fillRect(x+w*.43,y+TILE*.35,w*.14,TILE*.14);ctx.fillRect(x+w*.28,y+TILE*.47,w*.44,2)}
      else if(style==='museum'||style==='store'||style==='lab'){ctx.fillStyle='#b9dce0';ctx.fillRect(x+TILE*.3,y+h-TILE*.5,TILE*.32,TILE*.22);ctx.fillRect(x+w-TILE*.62,y+h-TILE*.5,TILE*.32,TILE*.22)}
      else{ctx.fillStyle='#f4d981';ctx.fillRect(x+TILE*.25,y+h-TILE*.49,TILE*.3,TILE*.2);ctx.fillRect(x+w-TILE*.55,y+h-TILE*.49,TILE*.3,TILE*.2)}
      ctx.fillStyle='#704a32';ctx.fillRect(x+w*.43,y+h-TILE*.25,w*.14,TILE*.25);ctx.fillStyle='#e7bb68';ctx.fillRect(x+w*.54,y+h-TILE*.14,2,2);
      const d=b.door,dx=offsetX+d.x*TILE,dy=offsetY+d.y*TILE;ctx.fillStyle='#513a2d';ctx.fillRect(dx+TILE*.28,dy+TILE*.15,TILE*.44,TILE*.85);ctx.fillStyle='#d8ae66';ctx.fillRect(dx+TILE*.61,dy+TILE*.52,2,2);
      ctx.fillStyle='#172019';ctx.font=`bold ${Math.max(7,TILE*.18)}px system-ui`;ctx.textAlign='center';const label=b.name.length>19?b.name.slice(0,17)+'…':b.name;ctx.fillText(label,x+w/2,y-3);
    }
    const f=cfg.feature,x=offsetX+f.x*TILE,y=offsetY+f.y*TILE,w=f.w*TILE,h=f.h*TILE;
    if(f.kind==='fountain'||f.kind==='pond'){ctx.fillStyle='#827460';ctx.fillRect(x-2,y-2,w+4,h+4);ctx.fillStyle=p.water;ctx.fillRect(x+3,y+3,w-6,h-6);ctx.fillStyle='#b3eeee';ctx.fillRect(x+w*.3,y+h*.3,w*.28,2)}
    else if(f.kind==='harbor'){ctx.fillStyle='#60462f';ctx.fillRect(x,y+h*.26,w,h*.5);ctx.fillStyle='#d0a46b';for(let i=1;i<4;i++)ctx.fillRect(x+w*i/4,y+h*.32,2,h*.38)}
    else if(f.kind==='garden'){ctx.fillStyle='#347a43';ctx.fillRect(x,y,w,h);ctx.fillStyle=p.accent;ctx.fillRect(x+w*.28,y+h*.28,3,3);ctx.fillRect(x+w*.66,y+h*.64,3,3)}
    else{ctx.fillStyle='#65564b';ctx.fillRect(x+w*.38,y+h*.25,w*.24,h*.7);ctx.fillStyle=p.accent;ctx.fillRect(x+w*.2,y+h*.2,w*.6,h*.22);ctx.fillStyle='#fff0b4';ctx.fillRect(x+w*.45,y+h*.27,w*.1,h*.06)}
  }

  function build(place){
    const cfg=DATA[place?.id];if(!cfg)return null;
    const grid=cityGrid(cfg);
    return {grid,npc:{...cfg.npc},object:{...cfg.object},exit:null,width:WIDTH,height:HEIGHT,spawn:{x:16,y:12,facing:'up'},buildings:cfg.buildings.map(b=>({...b,footprint:{...b.footprint},door:{...b.door}})),feature:{...cfg.feature},authoredKind:'city',cityName:cfg.name,draw:drawCity};
  }
  W.PsyKantoAuthoredCitiesV1=Object.freeze({version:1,ids:()=>Object.keys(DATA),build});
})(window);
