/* PSYWORLD — authored Kanto landmark and dungeon layouts (32 × 20). */
(function (W) {
  'use strict';
  if (W.__PSY_KANTO_AUTHORED_DUNGEONS_V1__) return;
  W.__PSY_KANTO_AUTHORED_DUNGEONS_V1__ = true;

  const WID=32, HGT=20, FLOOR=0, PATH=1, WALL=9, GRASS=5, ROCK=3, WATER=4, PROP=6;
  const C={
    forest:{floor:'#57934a',floor2:'#4d8646',path:'#d5be85',path2:'#c8ad70',dark:'#285c39',mid:'#39814a',light:'#5ba54c',accent:'#b7cf69',water:'#348aac'},
    moon:{floor:'#4a4d54',floor2:'#41434a',path:'#9a927f',path2:'#847c70',dark:'#272b35',mid:'#5b6065',light:'#9ca1a0',accent:'#87d9de',water:'#296b88'},
    ship:{floor:'#936a43',floor2:'#805c3c',path:'#d7b77e',path2:'#c7a36a',dark:'#523d30',mid:'#a77a4a',light:'#d4ab6d',accent:'#7ad1d0',water:'#286b91'},
    earth:{floor:'#75634b',floor2:'#6b5943',path:'#c2a779',path2:'#ae9066',dark:'#483d36',mid:'#8a7358',light:'#b49a77',accent:'#d9c28f',water:'#416a80'},
    electric:{floor:'#454958',floor2:'#383d4b',path:'#858b91',path2:'#707983',dark:'#292f3e',mid:'#535a68',light:'#a0a8aa',accent:'#f2d64e',water:'#367c91'},
    tunnel:{floor:'#4a4644',floor2:'#39393c',path:'#a99d89',path2:'#928675',dark:'#27272b',mid:'#615d59',light:'#aaa192',accent:'#b4d9d9',water:'#316f86'},
    tower:{floor:'#696975',floor2:'#5b5b68',path:'#c7c0bc',path2:'#aca6a6',dark:'#393947',mid:'#777586',light:'#d0c6bc',accent:'#9bb2d0',water:'#435c72'},
    rocket:{floor:'#46515a',floor2:'#3b4651',path:'#89939a',path2:'#747f87',dark:'#283642',mid:'#53626b',light:'#a5adb0',accent:'#dc514a',water:'#286b87'},
    office:{floor:'#6d8290',floor2:'#607581',path:'#c4cbd0',path2:'#aebbc2',dark:'#394a5a',mid:'#718997',light:'#d7e0e2',accent:'#42bad1',water:'#377f9e'},
    safari:{floor:'#64a14f',floor2:'#579349',path:'#d7c184',path2:'#c6af70',dark:'#347647',mid:'#55964b',light:'#7db752',accent:'#e3c65e',water:'#3a93a1'},
    ice:{floor:'#788e9b',floor2:'#607985',path:'#d8e2dc',path2:'#bfced0',dark:'#3a5969',mid:'#77a5b1',light:'#b8d4d4',accent:'#a8eff0',water:'#327b9b'},
    mansion:{floor:'#61545c',floor2:'#514852',path:'#a89175',path2:'#927d68',dark:'#352e38',mid:'#78645c',light:'#b49c7b',accent:'#ed9d51',water:'#315e73'},
    indigo:{floor:'#818278',floor2:'#73776d',path:'#d9c79a',path2:'#c8b582',dark:'#4b544e',mid:'#7e8b6a',light:'#b0bd8b',accent:'#e5ca6d',water:'#397892'}
  };
  const MAPS={
    'viridian-forest':{kind:'landmark',biome:'forest',name:'Viridian Forest',spawn:[3,17],exit:[28,1],npc:[15,9],object:[9,13],path:[[3,17],[7,17],[7,14],[12,14],[12,10],[19,10],[19,6],[25,6],[25,3],[28,3],[28,1]],grass:[[4,12,2,2],[15,7,2,2],[24,12,2,2],[10,4,2,1]],obstacles:[[3,5,2,3,PROP],[10,3,2,1,PROP],[15,16,2,2,PROP],[23,3,2,1,PROP],[29,10,1,4,PROP],[4,15,1,1,ROCK],[22,8,1,1,ROCK]]},
    'mt-moon':{kind:'dungeon',biome:'moon',name:'Mt. Moon',spawn:[3,17],exit:[28,1],npc:[15,9],object:[8,7],path:[[3,17],[8,17],[8,14],[5,14],[5,10],[12,10],[12,6],[19,6],[19,11],[25,11],[25,5],[28,5],[28,1]],grass:[[3,8,1,2],[17,13,1,1]],obstacles:[[3,4,2,2,ROCK],[9,4,2,1,ROCK],[16,3,2,2,ROCK],[22,15,2,2,ROCK],[27,8,1,2,ROCK],[7,7,1,1,PROP],[18,9,1,1,PROP]]},
    'ss-anne':{kind:'landmark',biome:'ship',name:'S.S. Anne',spawn:[3,17],exit:[28,1],npc:[15,9],object:[8,7],path:[[3,17],[7,17],[7,14],[12,14],[12,10],[18,10],[18,6],[24,6],[24,3],[28,3],[28,1]],grass:[[9,5,1,1]],obstacles:[[3,3,2,2,PROP],[8,3,2,2,PROP],[14,3,1,2,PROP],[20,13,2,2,PROP],[26,13,2,2,PROP],[10,10,1,1,ROCK],[23,9,1,1,ROCK]]},
    'diglett-cave':{kind:'dungeon',biome:'earth',name:'Diglett Cave',spawn:[3,17],exit:[28,1],npc:[17,9],object:[9,13],path:[[3,17],[7,17],[7,12],[12,12],[12,7],[18,7],[18,12],[24,12],[24,5],[28,5],[28,1]],grass:[[4,9,1,2],[20,4,1,1]],obstacles:[[3,4,2,2,ROCK],[9,3,2,2,ROCK],[15,3,1,1,ROCK],[22,15,2,2,ROCK],[27,9,1,2,ROCK],[15,14,1,1,PROP]]},
    'power-plant':{kind:'dungeon',biome:'electric',name:'Usina Elétrica',spawn:[3,17],exit:[28,1],npc:[18,8],object:[8,13],path:[[3,17],[8,17],[8,13],[13,13],[13,8],[19,8],[19,4],[25,4],[25,8],[28,8],[28,1]],grass:[[10,5,1,1]],obstacles:[[3,3,2,2,PROP],[9,3,2,2,PROP],[15,3,2,2,PROP],[22,12,2,2,PROP],[27,12,1,2,PROP],[10,9,1,1,ROCK],[23,6,1,1,ROCK]]},
    'rock-tunnel':{kind:'dungeon',biome:'tunnel',name:'Rock Tunnel',spawn:[3,17],exit:[28,1],npc:[15,9],object:[8,8],path:[[3,17],[8,17],[8,13],[5,13],[5,9],[12,9],[12,5],[19,5],[19,10],[25,10],[25,5],[28,5],[28,1]],grass:[[4,5,1,1]],obstacles:[[3,3,2,1,ROCK],[9,3,2,1,ROCK],[16,12,2,2,ROCK],[22,14,2,2,ROCK],[27,8,1,1,ROCK],[16,7,1,1,PROP]]},
    'pokemon-tower':{kind:'dungeon',biome:'tower',name:'Pokémon Tower',spawn:[3,17],exit:[28,1],npc:[17,9],object:[8,9],path:[[3,17],[7,17],[7,13],[12,13],[12,9],[18,9],[18,5],[24,5],[24,9],[28,9],[28,1]],grass:[[4,6,1,1]],obstacles:[[3,3,1,2,PROP],[9,3,1,2,PROP],[15,3,1,2,PROP],[21,12,1,2,PROP],[27,12,1,2,PROP],[10,7,1,1,ROCK],[20,7,1,1,ROCK]]},
    'rocket-hideout':{kind:'dungeon',biome:'rocket',name:'Esconderijo Rocket',spawn:[3,17],exit:[28,1],npc:[17,9],object:[8,12],path:[[3,17],[8,17],[8,13],[13,13],[13,9],[18,9],[18,5],[23,5],[23,9],[28,9],[28,1]],grass:[[5,5,1,1]],obstacles:[[3,3,2,1,PROP],[10,3,1,1,PROP],[15,3,2,1,PROP],[21,12,2,1,PROP],[26,12,2,1,PROP],[10,7,1,1,ROCK],[21,7,1,1,ROCK]]},
    'silph-co':{kind:'dungeon',biome:'office',name:'Silph Co.',spawn:[3,17],exit:[28,1],npc:[16,9],object:[8,13],path:[[3,17],[7,17],[7,13],[12,13],[12,9],[19,9],[19,5],[24,5],[24,9],[28,9],[28,1]],grass:[[5,5,1,1]],obstacles:[[3,3,2,2,PROP],[9,3,2,2,PROP],[15,3,2,2,PROP],[21,12,2,2,PROP],[27,12,1,2,PROP],[10,7,1,1,ROCK],[21,7,1,1,ROCK]]},
    'safari-zone':{kind:'landmark',biome:'safari',name:'Safari Zone',spawn:[3,17],exit:[28,1],npc:[16,9],object:[9,12],path:[[3,17],[8,17],[8,13],[13,13],[13,9],[19,9],[19,5],[25,5],[25,9],[28,9],[28,1]],grass:[[4,11,2,2],[10,5,2,1],[17,13,2,2],[23,11,2,2],[26,3,1,1]],obstacles:[[3,4,2,2,PROP],[10,15,2,1,PROP],[16,3,2,1,PROP],[22,15,2,1,PROP],[27,13,1,2,PROP],[5,8,1,1,ROCK],[22,7,1,1,ROCK]],water:[[15,4,1,4],[16,4,1,4],[15,11,1,2],[16,11,1,2]]},
    'seafoam':{kind:'dungeon',biome:'ice',name:'Ilhas Seafoam',spawn:[3,17],exit:[28,1],npc:[18,9],object:[8,9],path:[[3,17],[7,17],[7,13],[12,13],[12,9],[18,9],[18,5],[24,5],[24,9],[28,9],[28,1]],grass:[[4,5,1,1]],obstacles:[[3,3,2,2,ROCK],[9,3,2,1,ROCK],[14,3,1,1,ROCK],[22,13,2,2,ROCK],[27,12,1,2,ROCK],[10,7,1,1,PROP]],water:[[3,8,2,1],[4,8,2,1],[21,11,3,2],[22,12,3,1]]},
    'pokemon-mansion':{kind:'dungeon',biome:'mansion',name:'Mansão Pokémon',spawn:[3,17],exit:[28,1],npc:[16,9],object:[8,13],path:[[3,17],[8,17],[8,13],[13,13],[13,9],[19,9],[19,5],[24,5],[24,9],[28,9],[28,1]],grass:[[5,5,1,1]],obstacles:[[3,3,2,2,PROP],[9,3,2,2,PROP],[15,3,2,2,PROP],[21,12,2,2,PROP],[27,12,1,2,PROP],[10,7,1,1,ROCK],[21,7,1,1,ROCK]]},
    'indigo':{kind:'landmark',biome:'indigo',name:'Planalto Índigo',spawn:[3,17],exit:[28,1],npc:[17,9],object:[8,12],path:[[3,17],[7,17],[7,13],[12,13],[12,9],[19,9],[19,5],[25,5],[25,9],[28,9],[28,1]],grass:[[4,5,1,1],[22,14,2,1]],obstacles:[[3,3,2,2,PROP],[9,3,2,2,PROP],[15,3,2,2,PROP],[22,13,2,2,PROP],[27,12,1,2,PROP],[10,7,1,1,ROCK],[21,7,1,1,ROCK]]}
  };

  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  const noise=(seed,x,y,n=0)=>{let z=(seed^Math.imul(x+31,0x45d9f3b)^Math.imul(y+17,0x119de1f3)^n)>>>0;z=Math.imul(z^(z>>>16),0x45d9f3b);z=Math.imul(z^(z>>>16),0x45d9f3b);return ((z^(z>>>16))>>>0)/4294967296};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function build(place) {
    const cfg=MAPS[place?.id];if(!cfg)return null;
    const seed=hash(place.id),grid=Array.from({length:HGT},(_,y)=>Array.from({length:WID},(_,x)=>(x===0||y===0||x===WID-1||y===HGT-1)?WALL:FLOOR));
    const put=(x,y,t)=>{x=Math.round(x);y=Math.round(y);if(x>0&&x<WID-1&&y>0&&y<HGT-1)grid[y][x]=t};
    const line=(a,b,t)=>{const steps=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let i=0;i<=steps;i++){const q=steps?i/steps:0;put(a[0]+(b[0]-a[0])*q,a[1]+(b[1]-a[1])*q,t)}};
    const disk=(cx,cy,rx,ry,t,cut=0)=>{for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){const d=((x-cx)/Math.max(.1,rx))**2+((y-cy)/Math.max(.1,ry))**2;if(d<=1&&noise(seed,x,y,4)>cut)put(x,y,t)}};
    const widePath=(points)=>{
      for(let i=0;i<points.length-1;i++)line(points[i],points[i+1],PATH);
      for(const [x,y] of points)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])put(x+dx,y+dy,PATH);
    };
    // Lay down deterministic ambient patches before solid fixtures and walkways.
    if(cfg.biome==='forest'||cfg.biome==='safari'){
      for(let i=0;i<5;i++)disk(3+(i*7)%26,3+(i*11)%14,2+(i%2),1+(i%3===0?1:0),GRASS,.32);
    }
    if(cfg.water)for(const [x,y,rx,ry] of cfg.water)disk(x,y,rx,ry,WATER,0);
    // Site-specific structural obstacles: canopy, boulders, pillars, furniture,
    // equipment and office partitions all use solid movement tiles.
    for(const [x,y,rx,ry,t] of cfg.obstacles)disk(x,y,rx,ry,t,.02);
    if(cfg.grass)for(const [x,y,rx,ry] of cfg.grass)disk(x,y,rx,ry,GRASS,.12);
    widePath(cfg.path);
    const [sx,sy]=cfg.spawn,[ex,ey]=cfg.exit,[nx,ny]=cfg.npc,[ox,oy]=cfg.object;
    [[sx,sy],[ex,ey],[nx,ny],[ox,oy]].forEach(([x,y])=>put(x,y,PATH));
    // Ensure the object and NPC can be approached without stepping on their tile.
    if(grid[ny][nx]!==PATH)put(nx,ny,PATH);if(grid[oy][ox]!==PATH)put(ox,oy,PATH);
    const props={seed,biome:cfg.biome,kind:cfg.kind};
    return {grid,npc:{x:nx,y:ny},object:{x:ox,y:oy},exit:{x:ex,y:ey},width:WID,height:HGT,authoredKind:cfg.kind,spawn:{x:sx,y:sy,facing:'down'},draw:(ctx,opts)=>drawMap(ctx,opts,props)};
  }

  function drawMap(ctx,opts,props) {
    const {grid,offsetX,offsetY,TILE}=opts,p=C[props.biome]||C.moon,seed=props.seed;
    for(let y=0;y<HGT;y++)for(let x=0;x<WID;x++){
      const t=grid[y][x],sx=offsetX+x*TILE,sy=offsetY+y*TILE;
      if(t===PATH){ctx.fillStyle=noise(seed,x,y,1)>.43?p.path:p.path2;ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle='#fff';ctx.globalAlpha=.13;ctx.fillRect(sx+2,sy+2,TILE-4,2);ctx.globalAlpha=1;
        if(noise(seed,x,y,2)>.72){ctx.fillStyle=p.path2;ctx.fillRect(sx+5+Math.floor(noise(seed,x,y,3)*(TILE-10)),sy+7+Math.floor(noise(seed,x,y,5)*(TILE-14)),3,2)}
      }else if(t===WATER){ctx.fillStyle=noise(seed,x,y,6)>.5?p.water:p.dark;ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle=p.accent;const wx=sx+3+Math.floor(noise(seed,x,y,7)*(TILE-12));ctx.fillRect(wx,sy+7,7,2);ctx.fillRect(sx+12,sy+18,9,2);ctx.fillStyle='#e9ffff55';ctx.fillRect(wx+1,sy+7,3,1);
      }else if(t===WALL){ctx.fillStyle=p.dark;ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle=p.mid;ctx.fillRect(sx,sy+TILE-4,TILE,4);ctx.fillStyle='#0003';ctx.fillRect(sx,sy,TILE,2);
      }else if(t===GRASS){ctx.fillStyle=noise(seed,x,y,8)>.5?p.floor:p.floor2;ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle=p.dark;
        for(let i=0;i<6;i++){const bx=sx+3+Math.floor(noise(seed,x,y,10+i)*(TILE-6)),hh=6+Math.floor(noise(seed,y,x,30+i)*8);ctx.beginPath();ctx.moveTo(bx-2,sy+TILE-2);ctx.lineTo(bx,sy+TILE-hh);ctx.lineTo(bx+2,sy+TILE-2);ctx.fill()}
        ctx.fillStyle=p.accent;ctx.fillRect(sx+7,sy+8,2,3);ctx.fillRect(sx+TILE-9,sy+14,2,3);
      }else if(t===ROCK){ctx.fillStyle=p.floor2;ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle=p.dark;ctx.beginPath();ctx.moveTo(sx+3,sy+TILE-4);ctx.lineTo(sx+5,sy+10);ctx.lineTo(sx+12,sy+4);ctx.lineTo(sx+TILE-5,sy+8);ctx.lineTo(sx+TILE-2,sy+TILE-4);ctx.closePath();ctx.fill();ctx.fillStyle=p.light;ctx.fillRect(sx+8,sy+8,7,3);ctx.fillRect(sx+5,sy+13,3,5);
      }else if(t===PROP){ctx.fillStyle=p.floor;ctx.fillRect(sx,sy,TILE,TILE);drawProp(ctx,sx,sy,TILE,props.biome,noise(seed,x,y,20));
      }else{ctx.fillStyle=noise(seed,x,y,9)>.5?p.floor:p.floor2;ctx.fillRect(sx,sy,TILE,TILE);const q=Math.floor(noise(seed,x,y,11)*TILE);ctx.fillStyle=p.light;ctx.globalAlpha=.22;ctx.fillRect(sx+q,sy+5,2,2);ctx.globalAlpha=1}
    }
  }

  function drawProp(ctx,x,y,T,biome,v){
    const u=T/28;
    if(biome==='forest'||biome==='safari'){
      ctx.fillStyle='#563d2e';ctx.fillRect(x+11*u,y+16*u,7*u,11*u);ctx.fillStyle='#285a39';ctx.fillRect(x+2*u,y+4*u,24*u,17*u);ctx.fillStyle='#347b45';ctx.fillRect(x+5*u,y+1*u,17*u,14*u);ctx.fillStyle='#5aa84e';ctx.fillRect(x+7*u,y+4*u,8*u,5*u);ctx.fillStyle='#95c55d';ctx.fillRect(x+8*u,y+4*u,3*u,2*u);
    }else if(biome==='moon'||biome==='tunnel'||biome==='earth'||biome==='ice'){
      ctx.fillStyle='#292c32';ctx.beginPath();ctx.moveTo(x+2*u,y+26*u);ctx.lineTo(x+4*u,y+9*u);ctx.lineTo(x+11*u,y+3*u);ctx.lineTo(x+16*u,y+10*u);ctx.lineTo(x+23*u,y+5*u);ctx.lineTo(x+27*u,y+26*u);ctx.closePath();ctx.fill();ctx.fillStyle=biome==='ice'?'#c3eded':'#a4a098';ctx.fillRect(x+9*u,y+9*u,5*u,3*u);ctx.fillRect(x+19*u,y+12*u,3*u,2*u);if(v>.58){ctx.fillStyle='#67dce6';ctx.fillRect(x+13*u,y+16*u,3*u,7*u)}
    }else if(biome==='ship'){
      ctx.fillStyle='#654832';ctx.fillRect(x+3*u,y+3*u,22*u,22*u);ctx.fillStyle='#b78b54';ctx.fillRect(x+5*u,y+5*u,18*u,18*u);ctx.fillStyle='#e3c17f';ctx.fillRect(x+7*u,y+7*u,14*u,3*u);ctx.fillStyle='#553c30';ctx.fillRect(x+12*u,y+12*u,4*u,11*u);
    }else if(biome==='electric'){
      ctx.fillStyle='#303846';ctx.fillRect(x+3*u,y+4*u,22*u,20*u);ctx.fillStyle='#6e7a81';ctx.fillRect(x+6*u,y+7*u,16*u,12*u);ctx.fillStyle='#f1d64c';ctx.fillRect(x+8*u,y+9*u,4*u,3*u);ctx.fillStyle='#52d7df';ctx.fillRect(x+15*u,y+9*u,4*u,3*u);ctx.fillStyle='#202733';ctx.fillRect(x+11*u,y+20*u,7*u,4*u);
    }else if(biome==='tower'){
      ctx.fillStyle='#383847';ctx.fillRect(x+4*u,y+3*u,20*u,22*u);ctx.fillStyle='#9b9aa6';ctx.fillRect(x+7*u,y+6*u,14*u,15*u);ctx.fillStyle='#4e4a58';ctx.fillRect(x+11*u,y+10*u,6*u,12*u);ctx.fillStyle='#ced1d8';ctx.fillRect(x+13*u,y+12*u,2*u,2*u);
    }else if(biome==='rocket'){
      ctx.fillStyle='#303e48';ctx.fillRect(x+3*u,y+4*u,22*u,19*u);ctx.fillStyle='#b84443';ctx.fillRect(x+7*u,y+7*u,14*u,5*u);ctx.fillStyle='#d3dfdf';ctx.fillRect(x+7*u,y+15*u,14*u,2*u);ctx.fillStyle='#566b76';ctx.fillRect(x+10*u,y+19*u,8*u,4*u);
    }else if(biome==='office'){
      ctx.fillStyle='#354858';ctx.fillRect(x+4*u,y+2*u,20*u,24*u);ctx.fillStyle='#a8c3c9';ctx.fillRect(x+7*u,y+5*u,14*u,7*u);ctx.fillStyle='#66cfdf';ctx.fillRect(x+9*u,y+7*u,4*u,3*u);ctx.fillStyle='#586f7b';ctx.fillRect(x+7*u,y+15*u,14*u,8*u);ctx.fillStyle='#d6e5e5';ctx.fillRect(x+9*u,y+17*u,10*u,2*u);
    }else if(biome==='mansion'){
      ctx.fillStyle='#3b3039';ctx.fillRect(x+3*u,y+5*u,22*u,19*u);ctx.fillStyle='#806451';ctx.fillRect(x+6*u,y+8*u,16*u,13*u);ctx.fillStyle='#e6a05a';ctx.fillRect(x+8*u,y+10*u,4*u,5*u);ctx.fillRect(x+16*u,y+10*u,4*u,5*u);ctx.fillStyle='#493339';ctx.fillRect(x+12*u,y+16*u,5*u,5*u);
    }else{
      ctx.fillStyle='#44504d';ctx.fillRect(x+3*u,y+11*u,22*u,15*u);ctx.fillStyle='#a59872';ctx.beginPath();ctx.moveTo(x+1*u,y+12*u);ctx.lineTo(x+14*u,y+1*u);ctx.lineTo(x+27*u,y+12*u);ctx.closePath();ctx.fill();ctx.fillStyle='#667b5d';ctx.fillRect(x+7*u,y+15*u,5*u,6*u);ctx.fillRect(x+17*u,y+15*u,5*u,6*u);
    }
  }

  W.PsyKantoAuthoredDungeonsV1={version:1,build,ids:Object.keys(MAPS)};
})(window);
