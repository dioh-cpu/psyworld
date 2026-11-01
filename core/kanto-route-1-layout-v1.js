/* PSYWORLD — authored, campaign-only Kanto Route 1 map. */
(function (W) {
  'use strict';
  if (W.__PSY_KANTO_ROUTE_1_LAYOUT_V1__) return;
  W.__PSY_KANTO_ROUTE_1_LAYOUT_V1__ = true;

  const COLS = 32, ROWS = 20;
  const FLOOR = 0, PATH = 1, GRASS = 5, TREE = 6, ROCK = 3, WATER = 4, WALL = 9;
  const palette = {
    grassA:'#63ad50', grassB:'#579d48', grassC:'#70b757', grassDark:'#397746',
    pathA:'#ddc88e', pathB:'#cfb77b', pathDark:'#b49c68', pathLight:'#f0dba5',
    waterA:'#3b9abb', waterB:'#267ba6', waterLight:'#84d2d2',
    treeDark:'#285a3b', treeMid:'#347b45', treeLight:'#55a84b', treeShine:'#8bc75a',
    rockDark:'#625d52', rockMid:'#8b806b', rockLight:'#b2a186'
  };
  const rand = (x,y,n=0) => {
    let v=(x*374761393+y*668265263+n*1442695041)>>>0;
    v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967296;
  };

  function build(place) {
    if (place?.id !== 'route-1') return null;
    const grid=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>(x===0||y===0||x===COLS-1||y===ROWS-1)?TREE:FLOOR));
    const set=(x,y,t)=>{if(grid[y]&&grid[y][x]!==undefined)grid[y][x]=t};
    const line=(x1,y1,x2,y2,value)=>{
      const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
      for(let i=0;i<=steps;i++){const ratio=steps?i/steps:0;set(Math.round(x1+(x2-x1)*ratio),Math.round(y1+(y2-y1)*ratio),value)}
    };
    const blob=(cx,cy,rx,ry,t,skip=0)=>{
      for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){
        const d=((x-cx)/rx)**2+((y-cy)/ry)**2;
        if(d<=1&&rand(x,y,Math.round(cx+cy))>skip)set(x,y,t);
      }
    };

    // A broad, hand-authored footpath winds from Pallet's southern boundary
    // to the northern gate. The gate is a campaign transition, never a city exit.
    line(3,17,7,17,PATH);line(7,17,7,14,PATH);line(7,14,12,14,PATH);
    line(12,14,12,9,PATH);line(12,9,20,9,PATH);line(20,9,20,5,PATH);
    line(20,5,27,5,PATH);line(27,5,27,1,PATH);
    // Widen turns and the small north/south entrance aprons for easy walking.
    [[3,17],[7,17],[7,14],[12,14],[12,9],[20,9],[20,5],[27,5],[27,1]].forEach(([x,y])=>{
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(Math.abs(ox)+Math.abs(oy)<=1)set(x+ox,y+oy,PATH);
    });

    // Tall-grass encounter habitats sit beside the path, leaving a clear lane.
    blob(4,12,2,2,GRASS,.16);blob(15,7,2,2,GRASS,.18);blob(23,12,2,2,GRASS,.17);
    blob(9,5,2,1,GRASS,.25);blob(25,16,2,1,GRASS,.2);

    // A narrow stream crosses the eastern field; a visible wooden bridge keeps
    // the route traversable and offers a readable landmark.
    for(let y=6;y<=15;y++)for(let x=17;x<=18;x++)set(x,y,WATER);
    for(let x=16;x<=19;x++)set(x,9,PATH);

    // Shaded tree groves and scattered boulders shape the walkable corridor.
    blob(3,5,2,3,TREE,.12);blob(10,3,2,1,TREE,.08);blob(15,16,2,2,TREE,.13);
    blob(23,3,2,1,TREE,.08);blob(29,10,1,4,TREE,.1);blob(4,15,1,1,ROCK,.1);
    blob(14,11,1,1,ROCK,.05);blob(22,7,1,1,ROCK,.1);blob(25,14,1,1,ROCK,.12);

    // Reassert the complete walking route after grove/stream composition.
    line(3,17,7,17,PATH);line(7,17,7,14,PATH);line(7,14,12,14,PATH);
    line(12,14,12,9,PATH);line(12,9,20,9,PATH);line(20,9,20,5,PATH);
    line(20,5,27,5,PATH);line(27,5,27,1,PATH);
    for(let x=25;x<=29;x++)set(x,1,FLOOR);
    const npc={x:14,y:9},object={x:10,y:14},exit={x:27,y:1};
    set(npc.x,npc.y,PATH);set(object.x,object.y,PATH);set(exit.x,exit.y,PATH);
    return {grid,npc,object,exit,draw:drawRoute,authoredId:'kanto-route-1-gba-v1'};
  }

  function drawRoute(ctx, opt) {
    const {grid,offsetX,offsetY,TILE}=opt;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const t=grid[y][x],sx=offsetX+x*TILE,sy=offsetY+y*TILE;
      const base=t===PATH?(rand(x,y,1)>.35?palette.pathA:palette.pathB):
        t===WATER?(rand(x,y,2)>.5?palette.waterA:palette.waterB):
        t===TREE?palette.grassDark:t===ROCK?palette.grassB:palette.grassA;
      ctx.fillStyle=base;ctx.fillRect(sx,sy,TILE,TILE);
      if(t===PATH){
        ctx.fillStyle=rand(x,y,3)>.72?palette.pathLight:palette.pathDark;
        if(rand(x,y,4)>.54){ctx.fillRect(sx+4+Math.floor(rand(x,y,5)*14),sy+5+Math.floor(rand(x,y,6)*15),3,2);}
        ctx.fillStyle='#f5e5b722';ctx.fillRect(sx+2,sy+2,TILE-4,2);
      }else if(t===GRASS){
        ctx.fillStyle=palette.grassDark;
        for(let i=0;i<6;i++){
          const bx=sx+3+Math.floor(rand(x,y,i+10)*(TILE-7)),by=sy+TILE-3;
          ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-2,by-7-Math.floor(rand(y,x,i+3)*7));ctx.lineTo(bx+1,by-3);ctx.lineTo(bx+3,by-9);ctx.lineTo(bx+3,by);ctx.fill();
        }
        ctx.fillStyle='#b5d86b';ctx.fillRect(sx+8,sy+8,2,3);ctx.fillRect(sx+19,sy+15,2,3);
      }else if(t===TREE){
        ctx.fillStyle='#235438';ctx.fillRect(sx+2,sy+2,TILE-4,TILE-3);
        ctx.fillStyle=palette.treeDark;ctx.fillRect(sx+1,sy+3,TILE-2,TILE-4);
        ctx.fillStyle=palette.treeMid;
        ctx.fillRect(sx+4,sy+1,TILE-8,8);ctx.fillRect(sx+2,sy+8,TILE-4,11);ctx.fillRect(sx+5,sy+19,TILE-10,6);
        ctx.fillStyle=palette.treeLight;ctx.fillRect(sx+5,sy+4,7,5);ctx.fillRect(sx+15,sy+10,8,5);
        ctx.fillStyle=palette.treeShine;ctx.fillRect(sx+6,sy+5,3,2);
        ctx.fillStyle='#674b36';ctx.fillRect(sx+12,sy+20,5,6);
      }else if(t===ROCK){
        ctx.fillStyle=palette.rockDark;ctx.beginPath();ctx.moveTo(sx+3,sy+23);ctx.lineTo(sx+5,sy+11);ctx.lineTo(sx+12,sy+4);ctx.lineTo(sx+21,sy+7);ctx.lineTo(sx+25,sy+17);ctx.lineTo(sx+22,sy+24);ctx.closePath();ctx.fill();
        ctx.fillStyle=palette.rockMid;ctx.fillRect(sx+8,sy+9,9,4);ctx.fillRect(sx+6,sy+14,4,5);
        ctx.fillStyle=palette.rockLight;ctx.fillRect(sx+10,sy+8,5,2);
      }else if(t===WATER){
        ctx.fillStyle=palette.waterLight;
        const wave=(Math.floor((x+y)%3));ctx.fillRect(sx+3+wave*5,sy+7,7,2);ctx.fillRect(sx+11-wave*2,sy+19,9,2);
        ctx.fillStyle='#b4e8df';ctx.fillRect(sx+7,sy+8,3,1);ctx.fillRect(sx+16,sy+20,3,1);
      }else{
        ctx.fillStyle=rand(x,y,9)>.5?palette.grassB:palette.grassC;
        ctx.fillRect(sx+5+Math.floor(rand(x,y,10)*16),sy+4+Math.floor(rand(y,x,11)*17),2,2);
      }
    }
    // Wooden bridge rails/deck over the stream.
    const bx=offsetX+16*TILE,by=offsetY+9*TILE;
    ctx.fillStyle='#704c32';ctx.fillRect(bx,by+3,TILE*4,TILE-6);
    ctx.fillStyle='#b7874f';ctx.fillRect(bx,by+7,TILE*4,TILE-14);
    ctx.fillStyle='#e0b773';for(let x=0;x<4;x++)ctx.fillRect(bx+x*TILE+3,by+8,2,TILE-16);
    ctx.fillStyle='#573c31';ctx.fillRect(bx,by+3,TILE*4,3);ctx.fillRect(bx,by+TILE-6,TILE*4,3);
    // A painted route marker near the north edge, with no route number on the city map.
    const sx=offsetX+27*TILE+TILE/2,sy=offsetY+3*TILE;
    ctx.fillStyle='#785537';ctx.fillRect(sx-2,sy-8,4,18);ctx.fillStyle='#f1dfa8';ctx.fillRect(sx-12,sy-11,24,10);
    ctx.fillStyle='#435c3c';ctx.fillRect(sx-9,sy-8,18,2);ctx.fillRect(sx-7,sy-5,14,1);
  }

  W.PsyKantoRoute1LayoutV1={version:1,build};
})(window);
