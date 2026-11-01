/* PSYWORLD — authored Kanto Gen I route layouts V1.
 * Deterministic campaign-route provider. Each route is an isolated map selected
 * by the campaign atlas; none creates a physical connection to a city.
 * Grid contract matches kanto-campaign-playable-v1.js tile ids:
 * 0 lawn, 1 path, 2 tall grass, 3 rock/cave wall, 4 water, 5 habitat grass, 9 edge.
 */
(function (W) {
  'use strict';
  if (W.PsyKantoAuthoredRoutesV1) return;

  const WIDTH = 32, HEIGHT = 20;
  const ROUTES = {
    'route-2': {
      name:'Viridian Forest Approach', style:'forest',
      trail:[[3,17],[8,17],[8,13],[14,13],[14,9],[22,9],[22,4],[28,4],[28,2]],
      npc:[11,13], object:[20,8], exit:[28,2], habitat:[[3,3,6,5],[23,12,5,5]],
      obstacles:'trees', drawKind:'forest'
    },
    'route-3': {
      name:'Meadow Trail', style:'meadow',
      trail:[[3,17],[3,12],[9,12],[9,7],[16,7],[16,12],[23,12],[23,5],[28,5],[28,2]],
      npc:[12,7], object:[21,11], exit:[28,2], habitat:[[4,3,6,5],[24,7,4,5]],
      obstacles:'trees', drawKind:'meadow'
    },
    'route-4': {
      name:'Mount Moon Passage', style:'cave',
      trail:[[3,17],[9,17],[9,13],[5,13],[5,8],[12,8],[12,4],[20,4],[20,9],[27,9],[27,2]],
      npc:[8,8], object:[18,5], exit:[27,2], habitat:[[3,3,3,3],[22,12,5,4]],
      obstacles:'cave', drawKind:'cave'
    },
    'route-24-25': {
      name:'Nugget Bridge and North Bank', style:'bridge',
      trail:[[3,17],[10,17],[10,13],[14,13],[14,3],[18,3],[18,8],[23,8],[23,4],[28,4],[28,2]],
      npc:[16,6], object:[21,8], exit:[28,2], habitat:[[3,3,6,5],[24,11,4,5]],
      obstacles:'water', drawKind:'bridge'
    },
    'route-5-6': {
      name:'Underground Passage Roads', style:'garden',
      trail:[[3,17],[8,17],[8,11],[13,11],[13,6],[19,6],[19,11],[25,11],[25,4],[28,4],[28,2]],
      npc:[16,6], object:[10,10], exit:[28,2], habitat:[[3,3,5,5],[21,13,6,3]],
      obstacles:'garden', drawKind:'garden'
    },
    'route-11': {
      name:'East Gate Road', style:'meadow',
      trail:[[3,17],[3,12],[8,12],[8,6],[14,6],[14,11],[21,11],[21,5],[28,5],[28,2]],
      npc:[11,6], object:[19,10], exit:[28,2], habitat:[[4,3,5,4],[23,12,5,4]],
      obstacles:'trees', drawKind:'meadow'
    },
    'route-9-10': {
      name:'Rock Tunnel Approach', style:'rocky',
      trail:[[3,17],[9,17],[9,12],[5,12],[5,7],[13,7],[13,12],[20,12],[20,6],[28,6],[28,2]],
      npc:[10,7], object:[18,11], exit:[28,2], habitat:[[3,3,4,3],[24,12,4,4]],
      obstacles:'rocky', drawKind:'rocky'
    },
    'route-8': {
      name:'Lavender East Road', style:'meadow',
      trail:[[3,17],[7,17],[7,12],[14,12],[14,6],[20,6],[20,11],[26,11],[26,4],[28,4],[28,2]],
      npc:[17,6], object:[23,10], exit:[28,2], habitat:[[3,3,5,5],[22,13,5,3]],
      obstacles:'trees', drawKind:'meadow'
    },
    'route-7': {
      name:'Saffron Garden Passage', style:'garden',
      trail:[[3,17],[8,17],[8,12],[13,12],[13,7],[19,7],[19,12],[24,12],[24,5],[28,5],[28,2]],
      npc:[16,7], object:[10,11], exit:[28,2], habitat:[[3,3,5,5],[22,13,5,3]],
      obstacles:'garden', drawKind:'garden'
    },
    'route-12-15': {
      name:'Coastal Boardwalk', style:'coast',
      trail:[[3,17],[8,17],[8,12],[13,12],[13,6],[18,6],[18,11],[23,11],[23,5],[28,5],[28,2]],
      npc:[16,6], object:[21,10], exit:[28,2], habitat:[[3,3,5,5],[25,12,3,4]],
      obstacles:'water', drawKind:'coast'
    },
    'route-16-18': {
      name:'Cycling Road', style:'cycling',
      trail:[[3,17],[8,17],[8,14],[12,14],[12,8],[20,8],[20,4],[25,4],[25,10],[28,10],[28,2]],
      npc:[16,8], object:[23,5], exit:[28,2], habitat:[[3,3,5,4],[21,13,6,3]],
      obstacles:'cycling', drawKind:'cycling'
    },
    'route-19-21': {
      name:'Seafoam Coast', style:'coast',
      trail:[[3,17],[9,17],[9,13],[14,13],[14,8],[19,8],[19,13],[24,13],[24,6],[28,6],[28,2]],
      npc:[17,8], object:[22,12], exit:[28,2], habitat:[[3,3,5,4],[25,9,3,4]],
      obstacles:'water', drawKind:'coast'
    },
    'route-22-23': {
      name:'Western Gate Road', style:'rocky',
      trail:[[3,17],[7,17],[7,12],[13,12],[13,6],[18,6],[18,11],[24,11],[24,4],[28,4],[28,2]],
      npc:[16,6], object:[22,10], exit:[28,2], habitat:[[3,3,4,5],[25,12,3,4]],
      obstacles:'rocky', drawKind:'rocky'
    }
  };

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const drawLine = (grid, a, b, tile=1, width=2) => {
    let x=a[0], y=a[1], dx=Math.abs(b[0]-x), sx=x<b[0]?1:-1, dy=-Math.abs(b[1]-y), sy=y<b[1]?1:-1, err=dx+dy;
    for (;;) {
      const r=Math.floor(width/2);
      for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)
        if(grid[yy]?.[xx]!==undefined && xx>0 && yy>0 && xx<WIDTH-1 && yy<HEIGHT-1)grid[yy][xx]=tile;
      if(x===b[0]&&y===b[1])break;
      const e2=2*err;if(e2>=dy){err+=dy;x+=sx}if(e2<=dx){err+=dx;y+=sy}
    }
  };
  const pathSet = (points) => {
    const set=new Set();
    for(let i=1;i<points.length;i++){
      let x=points[i-1][0],y=points[i-1][1],target=points[i];
      const dx=Math.abs(target[0]-x),sx=x<target[0]?1:-1,dy=-Math.abs(target[1]-y),sy=y<target[1]?1:-1;let err=dx+dy;
      for(;;){set.add(x+','+y);if(x===target[0]&&y===target[1])break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx}if(e2<=dx){err+=dx;y+=sy}}
    }
    return set;
  };
  const nearPath = (cells,x,y,r=1) => {
    for(let yy=y-r;yy<=y+r;yy++)for(let xx=x-r;xx<=x+r;xx++)if(cells.has(xx+','+yy))return true;
    return false;
  };
  const hash = s => {let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  function build(place) {
    const id=typeof place==='string'?place:place?.id, spec=ROUTES[id];
    if(!spec)return null;
    const grid=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>x===0||y===0||x===WIDTH-1||y===HEIGHT-1?9:0));
    const trailCells=pathSet(spec.trail),seed=hash(id);
    // Place each route's terrain in a repeatable pattern, away from its main trail.
    for(let y=2;y<HEIGHT-2;y++)for(let x=2;x<WIDTH-2;x++){
      if(nearPath(trailCells,x,y,1))continue;
      const n=(x*37+y*61+seed)%101;
      if(spec.obstacles==='cave'&&n<12)grid[y][x]=3;
      else if(spec.obstacles==='rocky'&&n<9)grid[y][x]=3;
      else if(spec.obstacles==='water'&&((x<7&&n<23)||(x>24&&n<27)))grid[y][x]=4;
      else if(spec.obstacles==='trees'&&n<12)grid[y][x]=9;
      else if(spec.obstacles==='garden'&&n<8)grid[y][x]=3;
      else if(spec.obstacles==='cycling'&&n<8)grid[y][x]=3;
    }
    for(const [x,y,w,h] of spec.habitat){
      for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)
        if(grid[yy]?.[xx]!==undefined&&!nearPath(trailCells,xx,yy,1)&&grid[yy][xx]!==3&&grid[yy][xx]!==4&&grid[yy][xx]!==9)grid[yy][xx]=5;
    }
    // Paths are authored last and override terrain so spawn/objectives/gate stay reachable.
    for(let i=1;i<spec.trail.length;i++)drawLine(grid,spec.trail[i-1],spec.trail[i],1,2);
    // Add narrower trail shoulders where a route has a bridge or a special approach.
    if(spec.style==='bridge'||spec.style==='coast'){
      for(let i=0;i<spec.trail.length;i++){const [x,y]=spec.trail[i];if(grid[y]?.[x]===1&&grid[y]?.[x+1]===0)grid[y][x+1]=1;}
    }
    const npc={x:spec.npc[0],y:spec.npc[1]},object={x:spec.object[0],y:spec.object[1]},exit={x:spec.exit[0],y:spec.exit[1]};
    // Keep objectives on the route or one step beside it and force the exit tile open.
    if(grid[npc.y]?.[npc.x]!==undefined)grid[npc.y][npc.x]=1;
    if(grid[object.y]?.[object.x]!==undefined)grid[object.y][object.x]=1;
    if(grid[exit.y]?.[exit.x]!==undefined)grid[exit.y][exit.x]=1;
    const spawn={x:spec.trail[0][0],y:spec.trail[0][1]};
    const draw=(ctx,view={})=>drawRouteArt(ctx,{...view,routeId:id,style:spec.drawKind});
    return {grid,npc,object,exit,spawn,width:WIDTH,height:HEIGHT,authoredKind:'route',id,name:spec.name,style:spec.style,draw};
  }
  function drawRouteArt(ctx,view={}) {
    if(!ctx)return;
    const tile=Number(view.tile)||28,ox=Number(view.offsetX)||0,oy=Number(view.offsetY)||0,style=view.style;
    const specs=ROUTES[view.routeId];if(!specs)return;
    ctx.save();
    if(style==='bridge'||style==='coast'){
      specs.trail.slice(1,-1).forEach(([x,y],i)=>{const sx=ox+x*tile,sy=oy+y*tile;ctx.fillStyle=i%2?'#9b7048':'#b58351';ctx.fillRect(sx+3,sy+tile*.43,tile-6,Math.max(3,tile*.15));ctx.fillStyle='#e0bd84';ctx.fillRect(sx+3,sy+tile*.43,tile-6,1)});
      if(style==='coast'){ctx.strokeStyle='#7cd4e6';ctx.lineWidth=2;ctx.globalAlpha=.6;for(let i=0;i<5;i++){const y=oy+(4+i*3)*tile;ctx.beginPath();ctx.moveTo(ox+24*tile,y);ctx.quadraticCurveTo(ox+27*tile,y-4,ox+31*tile,y);ctx.stroke()}ctx.globalAlpha=1}
    } else if(style==='cave'){
      for(let i=0;i<12;i++){const x=ox+((i*47+23)%WIDTH)*tile,y=oy+((i*31+7)%5)*tile;ctx.fillStyle=i%2?'#82786c':'#68635d';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+tile*.45,y+tile*.62);ctx.lineTo(x+tile*.9,y);ctx.closePath();ctx.fill()}
    } else if(style==='cycling'){
      ctx.strokeStyle='#c4a06c';ctx.lineWidth=Math.max(2,tile*.12);ctx.setLineDash([tile*.4,tile*.35]);for(const [x,y] of specs.trail.slice(1,-1)){ctx.beginPath();ctx.moveTo(ox+x*tile+tile/2,oy+y*tile+tile/2);ctx.lineTo(ox+x*tile+tile/2+tile,oy+y*tile+tile/2);ctx.stroke()}ctx.setLineDash([]);
    } else {
      specs.habitat.forEach(([x,y,w,h])=>{ctx.fillStyle=style==='forest'?'#38684a':style==='rocky'?'#68635a':'#68844e';ctx.globalAlpha=.58;ctx.fillRect(ox+x*tile,oy+y*tile,w*tile,h*tile);ctx.globalAlpha=1});
    }
    ctx.restore();
  }

  W.PsyKantoAuthoredRoutesV1=Object.freeze({version:1,build,ids:()=>Object.keys(ROUTES)});
})(window);
