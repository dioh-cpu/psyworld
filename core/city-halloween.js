/* PSYWORLD — Halloween city plaza, trainer NPCs and touch dialogs. */
(function (W, D) {
  'use strict';
  if (W.__PSY_HALLOWEEN_CITY_V1__) return;
  W.__PSY_HALLOWEEN_CITY_V1__ = true;

  const NPCS = [
    { id:'luna', name:'Luna', role:'Bruxa da Lua', art:'npc-witch.webp', dx:-9.6, dy:-2.9,
      lines:['Bem-vindo ao Festival das Lanternas. A praça está cheia de surpresas.','Pokémon Fantasma aparecem com mais frequência nas noites de Halloween.','Há lanternas escondidas por toda a cidade.'] },
    { id:'noah', name:'Noah', role:'Pesquisador Pokémon', art:'npc-researcher.webp', dx:9.6, dy:-2.9,
      lines:['Estou estudando como os Pokémon reagem às luzes das abóboras.','Uma cidade bem iluminada é mais segura para os Pokémon pequenos.','Consulte o arquivo antigo se procurar pistas sobre Pokémon Fantasma.'] },
    { id:'amora', name:'Amora', role:'Feirante do Festival', art:'npc-vendor.webp', dx:-4.6, dy:3.2,
      lines:['Minha barraca está cheia de guloseimas e abóboras da estação.','As folhas douradas anunciam que a noite mais assustadora chegou.','Passe aqui depois da sua próxima hunt; sempre há algo especial.'] },
    { id:'elara', name:'Elara', role:'Bibliotecária Noturna', art:'npc-librarian.webp', dx:4.6, dy:3.2,
      lines:['Os livros da torre guardam mapas de regiões muito distantes.','Procure o tomo de capa azul para descobrir lendas de Halloween.','A biblioteca fica aberta até o último treinador voltar da hunt.'] },
    { id:'rival', name:'Rival', role:'Treinador desafiante', art:'/assets/story/rival.png', dx:-9.6, dy:0.1, story:'rival',
      lines:['Eu já escolhi meu parceiro. Vamos ver quem conhece melhor os Pokémon!','Encontre espécies nas rotas e monte uma equipe equilibrada antes de avançar pelos ginásios.','Quando estiver pronto, vamos nos enfrentar no campo de treino.'] },
    { id:'rocket', name:'Agente Rocket', role:'Vendedor suspeito', art:'/assets/story/rocket-grunt.png', dx:9.7, dy:0.1, story:'rocket',
      lines:['Só vendo itens raros. Não pergunte sobre as caixas atrás da barraca.','A Equipe Rocket procura Pokémon raros pelas rotas. Ninguém vai nos impedir de encontrá-los primeiro.','Você atrapalhou nossos planos por enquanto. A Equipe Rocket vai voltar.'] }
  ];
  const HOUSES = [
    { dx:-9.4, dy:-5.8, wall:'#5b3650', roof:'#20182d', sign:'POÇÕES', kind:'shop', width:1.22 },
    { dx: 9.4, dy:-5.8, wall:'#493450', roof:'#1d1930', sign:'POUSADA', kind:'inn', width:1.18 },
    { dx:-7.1, dy: 5.8, wall:'#633c4b', roof:'#27192f', sign:'MANSÃO', kind:'mansion', width:1.34 },
    { dx: 7.1, dy: 5.8, wall:'#51435d', roof:'#211a32', sign:'ARQUIVO', kind:'hall', width:1.26 },
    { dx:-12.6, dy:-8.2, wall:'#55445d', roof:'#2a2341', sign:'LABORATÓRIO', kind:'lab', width:1.18 },
    { dx: 12.6, dy: 8.2, wall:'#613d43', roof:'#301d2b', sign:'CENTRO', kind:'center', width:1.2 },
    { dx: 0, dy: 12.4, wall:'#3f495e', roof:'#22283b', sign:'ESTAÇÃO', kind:'station', width:1.14 }
  ];
  const CITY_LAMPS=[[-4.8,-.7],[4.8,.7],[-10.4,-4.8],[.7,4.8],[-8.9,1.6],[8.9,-1.6]];
  const CITY_GRAVEYARD={dx:9.6,dy:.1};
  let origin = null;
  let dialog = null;
  let dialogIndex = 0;

  function inCityWorld() {
    if (!origin || !(typeof P !== 'undefined' && P.team?.length)) return true;
    const x=Math.floor(Number(P.x)||0), y=Math.floor(Number(P.y)||0);
    if (x < origin.tileX-20 || x > origin.tileX+20 || y < origin.tileY-18 || y > origin.tileY+18) return false;
    // Keep the town layer alive while the player walks onto Route 1.
    // The canvas clip already excludes route tiles; disabling the whole city
    // overlay here made every building and NPC vanish at the route boundary.
    if(W.PsyKantoJourneyV1?.isAdventureTile?.(x,y))return false;
    return true;
  }
  function cityVisible() {
    const wrap = D.getElementById('game-wrap');
    return !!wrap && W.getComputedStyle(wrap).display !== 'none' &&
      !W.__psyIdleActive && !W.PSY_RUNTIME_MODE?.is?.('adventure') && inCityWorld();
  }
  function cityScreenBounds(w,h) {
    const tile=Number(TILE)||55, x0=Math.max(0,origin.tileX-16), x1=Math.min(MAP_W-1,origin.tileX+16);
    const y0=Math.max(0,origin.tileY-15), y1=Math.min(MAP_H-1,origin.tileY+15);
    const ox=w/2-P.px-tile/2, oy=h/2-P.py-tile/2;
    return {tile,x0,x1,y0,y1,left:ox+x0*tile,top:oy+y0*tile,right:ox+(x1+1)*tile,bottom:oy+(y1+1)*tile};
  }
  function clipCityArea(c,w,h) {
    const b=cityScreenBounds(w,h); let r={x1:19,x2:31,y1:3,y2:23};
    try { if (typeof ROUTE1 !== 'undefined') r=ROUTE1; } catch (_) {}
    const hx0=Math.max(b.x0,r.x1), hx1=Math.min(b.x1,r.x2);
    const routeY2=Math.max(r.y2,23);
    const hy0=Math.max(b.y0,r.y1), hy1=Math.min(b.y1,routeY2);
    const x=n=>w/2-P.px-b.tile/2+n*b.tile;
    const y=n=>h/2-P.py-b.tile/2+n*b.tile;
    c.beginPath();
    if(hx0>hx1||hy0>hy1)c.rect(b.left,b.top,b.right-b.left,b.bottom-b.top);
    else {
      if(hx0>b.x0)c.rect(b.left,b.top,x(hx0)-b.left,b.bottom-b.top);
      if(hx1<b.x1)c.rect(x(hx1+1),b.top,b.right-x(hx1+1),b.bottom-b.top);
      if(hy0>b.y0)c.rect(x(hx0),b.top,x(hx1+1)-x(hx0),y(hy0)-b.top);
      if(hy1<b.y1)c.rect(x(hx0),y(hy1+1),x(hx1+1)-x(hx0),b.bottom-y(hy1+1));
    }
    c.clip();
  }
  function drawCityFloor(c,w,h) {
    const b=cityScreenBounds(w,h), shades=['#30283c','#342b40','#2a2537','#382c3d','#29263a'];
    for(let ty=b.y0;ty<=b.y1;ty++)for(let tx=b.x0;tx<=b.x1;tx++){
      if(typeof map!=='undefined' && map?.[ty]?.[tx]!==1) continue;
      const sx=w/2-P.px-b.tile/2+tx*b.tile, sy=h/2-P.py-b.tile/2+ty*b.tile;
      if(sx+b.tile<0||sy+b.tile<0||sx>w||sy>h)continue;
      c.fillStyle='#211d30';c.fillRect(sx,sy,b.tile+1,b.tile+1);
      const stone=19;
      for(let row=0;row<Math.ceil(b.tile/stone);row++)for(let col=0;col<Math.ceil(b.tile/stone);col++){
        const seed=(ty*73+tx*97+row*19+col*31+(row%2)*7)%shades.length;
        const px=sx+col*stone+(row%2)*8, py=sy+row*stone;
        c.fillStyle=shades[seed];rounded(c,px+1,py+1,stone-3,stone-3,3);c.fill();
        c.fillStyle='rgba(205,170,118,.09)';c.fillRect(px+4,py+3,stone-9,1);
      }
    }
  }
  function captureOrigin() {
    if (origin || !(typeof P!=='undefined'&&P.team?.length) || !cityVisible()) return;
    origin = {
      px:Number(P.px) || Number(P.x || 25) * TILE,
      py:Number(P.py) || Number(P.y || 25) * TILE,
      tileX:Number(P.x) || 25,
      tileY:Number(P.y) || 25
    };
    const wrap = D.getElementById('game-wrap');
    wrap.dataset.citySeason = 'halloween';
    const block=(dx,dy,rx,ry)=>{
      const cx=Math.round(origin.tileX+dx),cy=Math.round(origin.tileY+dy);
      for(let y=cy-ry;y<=cy+ry;y++)for(let x=cx-rx;x<=cx+rx;x++){
        if(x>0&&y>0&&x<MAP_W-1&&y<MAP_H-1)SOLID.add(x+','+y);
      }
    };
    // Buildings: 7×5 tile footprints. The center cross and lanes between plots stay open.
    HOUSES.forEach(h=>block(h.dx,h.dy,3,2));
    // NPCs: three feet tiles (1×3), leaving every adjacent tile reachable for interaction.
    NPCS.forEach(npc=>block(npc.dx,npc.dy,1,0));
    // Cemetery fence and grave markers occupy a 3×3 tile patch.
    block(CITY_GRAVEYARD.dx,CITY_GRAVEYARD.dy,1,1);
    // Fountain basin is solid while its ring leaves a walkable plaza around it.
    block(0,0,1,0);
    // Lamp post bases and the three pumpkin props occupy their ground tiles.
    CITY_LAMPS.forEach(([dx,dy])=>block(dx,dy,0,0));
    [[CITY_LAMPS[0][0]+22/TILE,CITY_LAMPS[0][1]+8/TILE],
     [CITY_LAMPS[2][0]+22/TILE,CITY_LAMPS[2][1]+8/TILE],
     [CITY_LAMPS[4][0]+22/TILE,CITY_LAMPS[4][1]+8/TILE]].forEach(([dx,dy])=>block(dx,dy,0,0));
  }
  function screenPoint(dx, dy) {
    const cv = D.getElementById('gameCanvas');
    const w = cv?.width || W.innerWidth, h = cv?.height || W.innerHeight;
    return { x:w/2 + origin.px + dx*TILE - P.px, y:h/2 + origin.py + dy*TILE - P.py };
  }
  function rounded(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r);
    c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath();
  }
  function drawPumpkin(c,x,y,s) {
    c.save(); c.translate(x,y); c.scale(s,s);
    c.fillStyle='#f97316'; c.strokeStyle='#7c2d12'; c.lineWidth=2;
    c.beginPath(); c.ellipse(0,0,15,11,0,0,Math.PI*2); c.fill(); c.stroke();
    c.strokeStyle='#fdba74'; c.lineWidth=2;
    [-7,0,7].forEach(dx=>{c.beginPath();c.ellipse(dx,0,5,10,0,0,Math.PI*2);c.stroke()});
    c.fillStyle='#365314'; c.fillRect(-2,-15,4,7);
    c.fillStyle='#1f2937';
    c.beginPath();c.moveTo(-7,-3);c.lineTo(-3,-7);c.lineTo(0,-3);c.fill();
    c.beginPath();c.moveTo(2,-3);c.lineTo(6,-7);c.lineTo(9,-3);c.fill();
    c.fillRect(-5,3,11,2);
    c.restore();
  }
  function drawHouse(c,h) {
    const p=screenPoint(h.dx,h.dy), scale=Math.max(.82,Math.min(1.5,TILE/30));
    const w=Math.round(164*h.width*scale), bodyH=Math.round(102*scale), roofH=Math.round(68*scale);
    const x=p.x-w/2, y=p.y-bodyH/2;
    const cv=D.getElementById('gameCanvas'), viewW=cv?.width||W.innerWidth, viewH=cv?.height||W.innerHeight;
    if (x>viewW+40 || x+w< -40 || y>viewH+40 || y-bodyH-roofH< -100) return;
    c.save();
    c.fillStyle='#020617aa'; c.beginPath(); c.ellipse(p.x,y+bodyH+12,w*.64,16*scale,0,0,Math.PI*2); c.fill();
    // Broad timbered facade and stone foundation.
    c.fillStyle=h.wall; c.strokeStyle='#160f24'; c.lineWidth=5*scale;
    rounded(c,x,y,w,bodyH,9*scale); c.fill(); c.stroke();
    c.fillStyle='#3a263f'; c.fillRect(x+5*scale,y+bodyH-18*scale,w-10*scale,13*scale);
    c.strokeStyle='#b88a63'; c.lineWidth=2*scale;
    c.beginPath(); c.moveTo(x+8*scale,y+21*scale); c.lineTo(x+w-8*scale,y+21*scale); c.stroke();
    c.beginPath(); c.moveTo(x+10*scale,y+24*scale); c.lineTo(x+10*scale,y+bodyH-21*scale); c.stroke();
    c.beginPath(); c.moveTo(x+w-10*scale,y+24*scale); c.lineTo(x+w-10*scale,y+bodyH-21*scale); c.stroke();
    // Tall mansard roof with layered shingles, dormer and copper ridge.
    c.fillStyle=h.roof; c.beginPath(); c.moveTo(x-17*scale,y+12*scale); c.lineTo(p.x,y-roofH); c.lineTo(x+w+17*scale,y+12*scale); c.closePath(); c.fill();
    c.strokeStyle='#b27672'; c.lineWidth=3*scale; c.stroke();
    c.strokeStyle='#694c70'; c.lineWidth=2*scale;
    for(let row=0;row<4;row++){
      const yy=y-(roofH*(.72-row*.15));
      const inset=(row+1)*11*scale;
      c.beginPath();c.moveTo(x+inset,yy);c.lineTo(x+w-inset,yy);c.stroke();
    }
    // Glowing windows and deep wooden door.
    const winY=y+34*scale, winW=25*scale, winH=29*scale;
    c.shadowColor='#ffb34d';c.shadowBlur=20*scale;c.fillStyle='#ffd47a';
    [x+22*scale,x+w-22*scale-winW].forEach(wx=>{
      c.fillRect(wx,winY,winW,winH);c.strokeStyle='#4b3145';c.lineWidth=3*scale;c.strokeRect(wx,winY,winW,winH);
      c.beginPath();c.moveTo(wx+winW/2,winY);c.lineTo(wx+winW/2,winY+winH);c.stroke();
      c.beginPath();c.moveTo(wx,winY+winH/2);c.lineTo(wx+winW,winY+winH/2);c.stroke();
    }); c.shadowBlur=0;
    c.fillStyle='#301d36';rounded(c,p.x-17*scale,y+bodyH-48*scale,34*scale,48*scale,7*scale);c.fill();
    c.fillStyle='#d9a66b';c.beginPath();c.arc(p.x+10*scale,y+bodyH-25*scale,2.4*scale,0,Math.PI*2);c.fill();
    // Painted wooden sign, carved pumpkins, and two tall lantern posts.
    const signY=y+bodyH+20*scale;
    c.fillStyle='#21172b';rounded(c,p.x-35*scale,signY-12*scale,70*scale,20*scale,8*scale);c.fill();
    c.strokeStyle='#e5b75b';c.lineWidth=1.2*scale;c.stroke();
    c.fillStyle='#ffe6a3';c.font='900 '+Math.round(9*scale)+'px system-ui';c.textAlign='center';c.fillText(h.sign,p.x,signY+2*scale);
    drawPumpkin(c,x+15*scale,y+bodyH+4*scale,.76*scale);drawPumpkin(c,x+w-14*scale,y+bodyH+4*scale,.76*scale);
    c.fillStyle='#24162d';c.fillRect(x-15*scale,y+bodyH-3*scale,5*scale,29*scale);
    c.fillRect(x+w+10*scale,y+bodyH-3*scale,5*scale,29*scale);
    c.shadowColor='#ff8a37';c.shadowBlur=17*scale;c.fillStyle='#ffbd59';
    [x-12*scale,x+w+12*scale].forEach(lx=>{c.beginPath();c.arc(lx,y+bodyH-9*scale,6*scale,0,Math.PI*2);c.fill()});
    c.shadowBlur=0;c.restore();
  }
  function drawWeb(c,x,y,s) {
    c.save();c.strokeStyle='rgba(221,210,235,.52)';c.lineWidth=1.3;
    for(let i=0;i<5;i++){const a=(Math.PI/2)*(i/4);c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);c.stroke()}
    for(let r=9;r<=s;r+=10){c.beginPath();for(let i=0;i<=4;i++){const a=(Math.PI/2)*(i/4);const qx=x+Math.cos(a)*r,qy=y+Math.sin(a)*r;i?c.lineTo(qx,qy):c.moveTo(qx,qy)}c.stroke()}
    c.restore();
  }
  function drawBat(c,x,y,s) {
    c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='#171326';
    c.beginPath();c.moveTo(-20,0);c.quadraticCurveTo(-17,-14,-7,-7);c.quadraticCurveTo(-3,-15,0,-7);c.quadraticCurveTo(4,-15,8,-7);c.quadraticCurveTo(18,-14,21,0);c.quadraticCurveTo(12,-4,8,5);c.lineTo(3,1);c.lineTo(0,7);c.lineTo(-4,1);c.lineTo(-9,5);c.quadraticCurveTo(-13,-3,-20,0);c.fill();
    c.fillStyle='#f7a943';c.fillRect(-5,-2,2,2);c.fillRect(3,-2,2,2);c.restore();
  }

  // Decorative Ghost Pokémon are anchored to world coordinates around the outer plaza.
  // PokeAPI sprites are loaded once with a hand-drawn fallback for offline/CORS failures.
  const GHOST_DECOR = [
    {id:92, dx:-9.4, dy:-5.2, color:'#8d74b8'},
    {id:93, dx:9.5, dy:-5.2, color:'#9b67c4'},
    {id:94, dx:-13.2, dy:2.1, color:'#7550a5'},
    {id:200,dx:13.2, dy:-2.1, color:'#bd75dc'},
    {id:302,dx:-10.2,dy:8.5, color:'#62729a'},
    {id:353,dx:10.2, dy:-8.5,color:'#8b73b6'},
    {id:354,dx:-14.1,dy:-5.8,color:'#73559d'},
    {id:355,dx:14.1, dy:5.8, color:'#9b9aa8'},
    {id:425,dx:-8.3, dy:11.4,color:'#a88ad8'},
    {id:426,dx:8.3,  dy:-11.4,color:'#8b70c2'},
    {id:607,dx:-14.0,dy:8.1, color:'#efb85c'},
    {id:609,dx:14.0, dy:-8.1,color:'#d17b61'},
    {id:778,dx:-11.5,dy:-10.5,color:'#e0ddd5'},
    {id:854,dx:11.5, dy:10.5,color:'#8d6cc2'},
    {id:885,dx:-12.8,dy:5.8,color:'#729bd1'}
  ];
  const ghostSpriteCache = new Map();
  function loadGhostSprite(id) {
    if (ghostSpriteCache.has(id)) return ghostSpriteCache.get(id);
    const image = new Image();
    const entry = { image, ready:false, failed:false };
    image.crossOrigin = 'anonymous';
    image.onload = () => { entry.ready = true; };
    image.onerror = () => { entry.failed = true; };
    image.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + id + '.png';
    ghostSpriteCache.set(id, entry);
    return entry;
  }
  function drawGhostFallback(c, x, y, color, scale) {
    c.save(); c.translate(x,y); c.scale(scale,scale);
    c.shadowColor=color; c.shadowBlur=11;
    c.fillStyle=color; c.beginPath();
    c.moveTo(-15,-5); c.quadraticCurveTo(-14,-18,0,-18);
    c.quadraticCurveTo(15,-18,15,-4); c.lineTo(15,12);
    c.lineTo(8,8); c.lineTo(2,13); c.lineTo(-5,8); c.lineTo(-14,13); c.closePath(); c.fill();
    c.shadowBlur=0; c.fillStyle='#fff2cd';
    c.beginPath(); c.ellipse(-5,-4,2.6,4.1,-.2,0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(5,-4,2.6,4.1,.2,0,Math.PI*2); c.fill();
    c.fillStyle='#241632'; c.beginPath(); c.arc(-4,-4,1.2,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(6,-4,1.2,0,Math.PI*2); c.fill();
    c.restore();
  }
  function drawGhostDecorations(c) {
    const scale = Math.max(.82, Math.min(1.34, TILE / 30));
    GHOST_DECOR.forEach(mon => {
      const p = screenPoint(mon.dx, mon.dy);
      const size = 46 * scale;
      if (p.x < -size || p.y < -size || p.x > W.innerWidth+size || p.y > W.innerHeight+size) return;
      // The center lanes remain clear; all decorations sit at least eight tiles away.
      c.save(); c.globalAlpha=.93;
      c.fillStyle='rgba(0,0,0,.34)'; c.beginPath();
      c.ellipse(p.x,p.y+size*.36,size*.31,size*.1,0,0,Math.PI*2); c.fill();
      const sprite=loadGhostSprite(mon.id);
      if (sprite.ready) {
        c.shadowColor=mon.color; c.shadowBlur=10;
        c.imageSmoothingEnabled=false;
        c.drawImage(sprite.image,p.x-size/2,p.y-size*.78,size,size);
      } else {
        drawGhostFallback(c,p.x,p.y-size*.16,mon.color,scale);
      }
      c.restore();
    });
  }

  function drawRouteGate(c) {
    // Put the entrance on the town side of the existing open 3-tile trail.
    // It is decorative only; the original walkable Route 1 tiles stay intact.
    const p=screenPoint(0,.35), half=Math.min(TILE*1.52,W.innerWidth*.39), postTop=p.y-55, postBottom=p.y+23;
    c.save();
    c.fillStyle='#21172b';c.strokeStyle='#d69b52';c.lineWidth=3;
    [-1,1].forEach(side=>{const x=p.x+side*half;c.fillRect(x-5,postTop,10,postBottom-postTop);c.strokeRect(x-5,postTop,10,postBottom-postTop)});
    c.fillStyle='#261a2b';c.strokeStyle='#f4c66f';c.lineWidth=2.4;
    rounded(c,p.x-half-6,p.y-73,half*2+12,31,10);c.fill();c.stroke();
    c.fillStyle='#ffedbd';c.font='900 12px system-ui';c.textAlign='center';c.fillText('↑  ROTA 1 · VIRIDIAN',p.x,p.y-53);
    c.fillStyle='#ffb45e';c.shadowColor='#ff9e46';c.shadowBlur=12;
    [-1,1].forEach(side=>{c.beginPath();c.arc(p.x+side*half,p.y-57,5,0,Math.PI*2);c.fill()});
    c.shadowBlur=0;c.restore();
  }

  function drawCity() {
    if (!cityVisible() || !(typeof P!=='undefined'&&P.team?.length) || (typeof inBattle!=='undefined'&&inBattle)) return;
    captureOrigin(); if (!origin) return;
    // Legacy draw clears the canvas on every animation frame; repaint this overlay each time too.
    const c=ctx, cv=D.getElementById('gameCanvas'), w=cv.width, h=cv.height, center=screenPoint(0,0);
    c.save();
    clipCityArea(c,w,h);
    // Halloween lighting and cobblestones stay inside the town; Route 1 remains clear.
    c.fillStyle='rgba(7,10,27,.47)';c.fillRect(0,0,w,h);
    const vignette=c.createRadialGradient(w*.52,h*.4,12,w*.52,h*.45,Math.max(w,h)*.78);
    vignette.addColorStop(0,'rgba(39,67,106,.08)');vignette.addColorStop(.55,'rgba(22,19,49,.28)');vignette.addColorStop(1,'rgba(5,7,19,.72)');
    c.fillStyle=vignette;c.fillRect(0,0,w,h);
    const moonX=w*.82, moonY=h*.14;
    c.shadowColor='#b7d6ff';c.shadowBlur=35;c.fillStyle='#e7e2d0';c.beginPath();c.arc(moonX,moonY,28,0,Math.PI*2);c.fill();c.shadowBlur=0;
    c.fillStyle='#b9b4a7';[[moonX-8,moonY-6,5],[moonX+8,moonY+5,4],[moonX-2,moonY+12,3]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()});
    // Soft distant hills and star field keep the existing map readable.
    c.fillStyle='rgba(17,22,43,.4)';c.beginPath();c.moveTo(0,h*.33);c.quadraticCurveTo(w*.2,h*.22,w*.42,h*.34);c.quadraticCurveTo(w*.72,h*.20,w,h*.31);c.lineTo(w,h*.49);c.lineTo(0,h*.49);c.fill();
    for(let i=0;i<34;i++){const x=((i*197+53)%997)/997*w,y=((i*83+31)%271)/271*h*.36;c.fillStyle=i%5===0?'#ffd789':'#dbeafe';c.globalAlpha=.35+(i%4)*.12;c.beginPath();c.arc(x,y,i%7===0?1.5:1,0,Math.PI*2);c.fill()}
    c.globalAlpha=1;
    // World-anchored cobblestone floor only replaces ordinary town ground.
    // Route 1 path, grass, obstacles and surrounding map retain their own tiles.
    drawCityFloor(c,w,h);
    HOUSES.forEach(house=>drawHouse(c,house));
    drawRouteGate(c);
    // Little graveyard at the edge of the square.
    const grave=screenPoint(CITY_GRAVEYARD.dx,CITY_GRAVEYARD.dy);c.fillStyle='rgba(8,13,25,.55)';rounded(c,grave.x-48,grave.y-39,96,76,8);c.fill();c.strokeStyle='#798099';c.lineWidth=2;c.stroke();
    for(let i=0;i<3;i++){const gx=grave.x-28+i*28,gy=grave.y+4;c.fillStyle=['#697083','#7d7888','#59677a'][i];rounded(c,gx-9,gy-17,18,29,8);c.fill();c.fillStyle='#b6bdca';c.fillRect(gx-1,gy-11,2,12);c.fillRect(gx-5,gy-7,10,2)}
    drawWeb(c,grave.x-43,grave.y-34,29);
    // Fountain and ringed stonework create a readable central town square.
    const plaza=screenPoint(0,0);
    c.save();c.fillStyle='#4a4053';c.strokeStyle='#b68c55';c.lineWidth=3;
    c.beginPath();c.ellipse(plaza.x,plaza.y,Math.max(78,TILE*1.45),Math.max(40,TILE*.76),0,0,Math.PI*2);c.fill();c.stroke();
    c.fillStyle='#343447';c.beginPath();c.ellipse(plaza.x,plaza.y,Math.max(51,TILE*.96),Math.max(25,TILE*.48),0,0,Math.PI*2);c.fill();
    c.fillStyle='#667c94';c.beginPath();c.ellipse(plaza.x,plaza.y,Math.max(35,TILE*.64),Math.max(15,TILE*.28),0,0,Math.PI*2);c.fill();
    c.shadowColor='#76d8ec';c.shadowBlur=15;c.fillStyle='#a5edff';c.beginPath();c.arc(plaza.x,plaza.y-8,5,0,Math.PI*2);c.fill();c.shadowBlur=0;c.restore();
    // Lantern strings and pennants across the market lanes.
    c.save();c.strokeStyle='#725568';c.lineWidth=2;
    [[-5.7,-.2,5.7,-.2],[-5.7,3.8,5.7,3.8]].forEach(([ax,ay,bx,by])=>{
      const a=screenPoint(ax,ay),b=screenPoint(bx,by);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+13,b.x,b.y);c.stroke();
      for(let i=1;i<9;i++){const t=i/9,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t+Math.sin(t*Math.PI)*13;c.fillStyle=i%2?'#a33f59':'#e19d45';c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.lineTo(x,y+12);c.closePath();c.fill()}
    });c.restore();
    // Benches and pumpkin planters make side lanes feel inhabited.
    [[-10,-4.8],[10,4.8],[-3,9],[10.5,-9]].forEach(([dx,dy],i)=>{
      const p=screenPoint(dx,dy);c.fillStyle='#20182b';c.fillRect(p.x-19,p.y-3,38,8);c.fillStyle=i%2?'#a76449':'#8c543e';c.fillRect(p.x-17,p.y-8,34,7);c.fillStyle='#403047';c.fillRect(p.x-14,p.y+5,4,7);c.fillRect(p.x+10,p.y+5,4,7);
      c.fillStyle='#344d3f';c.fillRect(p.x+30,p.y-8,17,15);c.fillStyle='#ef9d4e';c.beginPath();c.arc(p.x+33,p.y-8,4,0,Math.PI*2);c.fill()
    });
    // Copper lamps, hanging pennants, scattered leaves and pumpkins.
    CITY_LAMPS.forEach(([dx,dy],i)=>{
      const p=screenPoint(dx,dy);c.fillStyle='#171421';c.fillRect(p.x-4,p.y-23,8,34);
      c.fillStyle='#80583e';c.fillRect(p.x-9,p.y-27,18,5);c.shadowColor='#ff9e46';c.shadowBlur=24;c.fillStyle='#ffb65b';c.beginPath();c.arc(p.x,p.y-34,8,0,Math.PI*2);c.fill();c.shadowBlur=0;
      if(i%2===0)drawPumpkin(c,p.x+22,p.y+8,.68);
    });
    drawBat(c,w*.17,h*.21,.85);drawBat(c,w*.68,h*.29,.65);drawBat(c,w*.92,h*.34,.48);
    drawWeb(c,8,8,55);drawWeb(c,w-8,8,55);
    // Illustrated signboard, typography only; no emoji glyphs.
    const bannerW=Math.min(330,w-28),banner=screenPoint(-10,-1.2),bannerY=banner.y;
    c.fillStyle='#171426f2';c.strokeStyle='#d78a4a';c.lineWidth=2.4;rounded(c,banner.x-bannerW/2,bannerY-20,bannerW,40,18);c.fill();c.stroke();
    c.fillStyle='#f8d98c';c.font='900 13px system-ui';c.textAlign='center';c.fillText('PALLET TOWN  ·  FESTIVAL DE HALLOWEEN',banner.x,bannerY+5);
    drawGhostDecorations(c);
    c.restore();
  }
  function makeDialog() {
    if (dialog) return dialog;
    dialog=D.createElement('section'); dialog.className='psy-halloween-dialog'; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-live','polite');
    dialog.innerHTML='<button type="button" class="psy-halloween-close" aria-label="Fechar">×</button><small>PALLET TOWN · KANTO · FESTIVAL DE HALLOWEEN</small><img class="psy-route-preview" src="/assets/story/kanto-route-1-v1.webp" alt="Mapa ilustrado da Rota 1" loading="lazy"><div class="psy-halloween-dialog-body"><div class="psy-halloween-portrait" data-emotion="neutral"><img alt=""><span class="psy-halloween-expression" aria-hidden="true"><i class="brow left"></i><i class="brow right"></i><i class="mouth"></i></span></div><div class="psy-halloween-dialog-copy"><h3></h3><p></p></div></div><button type="button" class="psy-halloween-next">CONTINUAR</button>';
    dialog.querySelector('.psy-halloween-close').onclick=()=>dialog.classList.remove('open');
    dialog.querySelector('.psy-halloween-next').onclick=()=>dialog.classList.remove('open');
    D.body.appendChild(dialog); return dialog;
  }
  const STORY_KEY='psy_kanto_city_story_v1';
  function storyState(){try{return JSON.parse(localStorage.getItem(STORY_KEY)||'{}')}catch(_){return {}}}
  function storyLine(npc){
    if(!npc.story)return {index:Math.floor(Math.random()*npc.lines.length),locked:false};
    const state=storyState(),seen=Number(W.PsyWorldProgressV1?.snapshot?.().seenPokemon?.length||0);
    let index=0,locked=false;
    if(npc.story==='oak'){index=Math.min(2,Number(state.oakStage||0));state.oakStage=Math.min(3,index+1)}
    if(npc.story==='rival'){
      if(!state.oakStage){index=0;locked=true}
      else if(seen<1){index=1;locked=true}
      else{index=Math.min(2,Number(state.rivalStage||0));state.rivalStage=Math.min(3,index+1)}
    }
    if(npc.story==='rocket'){
      if(seen<3){index=0;locked=true}
      else{index=Math.min(2,Number(state.rocketStage||0));state.rocketStage=Math.min(3,index+1)}
    }
    try{localStorage.setItem(STORY_KEY,JSON.stringify(state))}catch(_){}
    return {index,locked};
  }
  function speak(npc) {
    const panel=makeDialog(), name=panel.querySelector('h3'), copy=panel.querySelector('p');
    dialogIndex=(dialogIndex+1)%npc.lines.length;
    const progression=storyLine(npc),index=progression.index;
    const line=progression.locked
      ? (npc.story==='rival'&&!storyState().oakStage?'Vá ao laboratório e converse com o Professor Carvalho primeiro.':npc.story==='rocket'?'A barraca parece comum. Volte depois de conhecer mais Pokémon.':npc.lines[index])
      : npc.lines[index];
    const emotions=['happy','curious','mysterious'];
    const portrait=panel.querySelector('.psy-halloween-portrait');
    portrait.dataset.emotion=emotions[index%emotions.length];
    const portraitImg=portrait.querySelector('img');
    portraitImg.src=npc.art.startsWith('/')?npc.art:'/assets/halloween/'+npc.art;
    portraitImg.alt='Retrato de '+npc.name;
    name.textContent=npc.name+' · '+npc.role; copy.textContent='“'+line+'”'; panel.dataset.npc=npc.id; panel.classList.add('open');
  }
  function ensureNPCs() {
    const wrap=D.getElementById('game-wrap');if(!wrap)return;
    NPCS.forEach(npc=>{
      if(D.getElementById('psy-halloween-npc-'+npc.id))return;
      const button=D.createElement('button');button.type='button';button.id='psy-halloween-npc-'+npc.id;button.className='psy-halloween-npc';button.setAttribute('aria-label','Conversar com '+npc.name);
      button.innerHTML='<span class="psy-halloween-sprite"><img alt=""></span><span class="psy-halloween-name">'+npc.name+'</span><span class="psy-halloween-role">'+npc.role+'</span>';
      const img=button.querySelector('img');
      img.src=npc.art.startsWith('/')?npc.art:'/assets/halloween/'+npc.art;
      img.onerror=()=>{button.classList.add('psy-halloween-art-missing')};
      button.onclick=()=>speak(npc);wrap.appendChild(button);
    });
  }
  function positionNPCs() {
    const active=cityVisible()&&!!origin&&!!(typeof P!=='undefined'&&P.team?.length)&&!(typeof inBattle!=='undefined'&&inBattle);
    const cv=D.getElementById('gameCanvas'),wrap=D.getElementById('game-wrap');
    const canvasBox=cv?.getBoundingClientRect(),wrapBox=wrap?.getBoundingClientRect();
    const sx=canvasBox?.width&&cv.width?canvasBox.width/cv.width:1;
    const sy=canvasBox?.height&&cv.height?canvasBox.height/cv.height:1;
    NPCS.forEach(npc=>{
      const el=D.getElementById('psy-halloween-npc-'+npc.id);if(!el)return;
      if(!active){if(!el.hidden)el.hidden=true;return}
      if(el.hidden)el.hidden=false;
      const p=screenPoint(npc.dx,npc.dy);
      // Project the world-space point through the canvas camera into the wrapper's
      // local coordinate system. UI panels never change this position.
      const left=(canvasBox?.left||0)-(wrapBox?.left||0)-(wrap?.clientLeft||0)+p.x*sx;
      const top=(canvasBox?.top||0)-(wrapBox?.top||0)-(wrap?.clientTop||0)+p.y*sy;
      const x=Math.round(left),y=Math.round(top);
      if(el.style.left!==x+'px')el.style.left=x+'px';
      if(el.style.top!==y+'px')el.style.top=y+'px';
      const rect=el.getBoundingClientRect();
      const view=canvasBox||{left:0,top:0,right:W.innerWidth,bottom:W.innerHeight};
      const intersects=rect.right>view.left&&rect.left<view.right&&rect.bottom>view.top&&rect.top<view.bottom;
      if(!intersects){if(!el.hidden)el.hidden=true;return}
      if(el.hidden)el.hidden=false;
      // Keep NPC visibility independent from floating HUD/menu rectangles. Hiding
      // whole sprites on UI overlap caused characters to blink out while the
      // camera moved. UI keeps its own higher stacking layer and NPC world points
      // remain projected exclusively from game coordinates.
      el.dataset.uiBlocked='0';
      el.style.visibility='visible';
      el.style.pointerEvents='auto';
      el.style.zIndex='38';
    });
    if(!cityVisible())dialog?.classList.remove('open');
  }
  const baseDraw=W.draw;
  if(typeof baseDraw==='function')W.draw=function(){
    const wrap=D.getElementById('game-wrap');
    if(wrap){
      const worldActive=wrap.style.display!=='none'&&!!(typeof P!=='undefined'&&P.team?.length)&&!W.__psyIdleActive&&!W.PSY_RUNTIME_MODE?.is?.('adventure');
      if(worldActive)wrap.dataset.citySeason='halloween';else delete wrap.dataset.citySeason;
    }
    const result=baseDraw.apply(this,arguments);
    drawCity();
    if(cityVisible()){captureOrigin();ensureNPCs();positionNPCs()}
    return result;
  };
  const baseNpcUpdate=W.updateNPCSprites;
  if(typeof baseNpcUpdate==='function')W.updateNPCSprites=function(){baseNpcUpdate.apply(this,arguments);captureOrigin();ensureNPCs();positionNPCs()};
  W.addEventListener('resize',positionNPCs,{passive:true});
  W.addEventListener('orientationchange',()=>setTimeout(positionNPCs,120),{passive:true});
})(window,document);
