/* PSYWORLD — Halloween city plaza, trainer NPCs and touch dialogs. */
(function (W, D) {
  'use strict';
  if (W.__PSY_HALLOWEEN_CITY_V1__) return;
  W.__PSY_HALLOWEEN_CITY_V1__ = true;

  const NPCS = [
    { id:'luna', name:'Luna', role:'Bruxa da Lua', art:'npc-witch.webp', dx:-4.6, dy:-2.9,
      lines:['Bem-vindo ao Festival das Lanternas. A praça está cheia de surpresas.','Pokémon Fantasma aparecem com mais frequência nas noites de Halloween.','Há lanternas escondidas por toda a cidade.'] },
    { id:'noah', name:'Noah', role:'Pesquisador Pokémon', art:'npc-researcher.webp', dx:4.6, dy:-2.9,
      lines:['Estou estudando como os Pokémon reagem às luzes das abóboras.','Uma cidade bem iluminada é mais segura para os Pokémon pequenos.','Consulte o arquivo antigo se procurar pistas sobre Pokémon Fantasma.'] },
    { id:'amora', name:'Amora', role:'Feirante do Festival', art:'npc-vendor.webp', dx:-4.6, dy:3.8,
      lines:['Minha barraca está cheia de guloseimas e abóboras da estação.','As folhas douradas anunciam que a noite mais assustadora chegou.','Passe aqui depois da sua próxima hunt; sempre há algo especial.'] },
    { id:'elara', name:'Elara', role:'Bibliotecária Noturna', art:'npc-librarian.webp', dx:4.6, dy:3.8,
      lines:['Os livros da torre guardam mapas de regiões muito distantes.','Procure o tomo de capa azul para descobrir lendas de Halloween.','A biblioteca fica aberta até o último treinador voltar da hunt.'] }
  ];
  const HOUSES = [
    { dx:-7.1, dy:-5.8, wall:'#5b3650', roof:'#20182d', sign:'BOTICA', kind:'shop', width:1.22 },
    { dx: 7.1, dy:-5.8, wall:'#493450', roof:'#1d1930', sign:'POUSADA', kind:'inn', width:1.18 },
    { dx:-7.1, dy: 5.8, wall:'#633c4b', roof:'#27192f', sign:'MANSÃO', kind:'mansion', width:1.34 },
    { dx: 7.1, dy: 5.8, wall:'#51435d', roof:'#211a32', sign:'ARQUIVO', kind:'hall', width:1.26 }
  ];
  let origin = null;
  let dialog = null;
  let lastDraw = 0;

  function cityVisible() {
    const wrap = D.getElementById('game-wrap');
    return !!wrap && W.getComputedStyle(wrap).display !== 'none' &&
      !W.__psyIdleActive && !W.PSY_RUNTIME_MODE?.is?.('adventure');
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
    HOUSES.forEach(h => {
      const hx = Math.round(origin.tileX + h.dx), hy = Math.round(origin.tileY + h.dy);
      for (let y=hy-2; y<=hy+2; y++) for (let x=hx-3; x<=hx+3; x++) {
        if (x>0 && y>0 && x<MAP_W-1 && y<MAP_H-1) SOLID.add(x+','+y);
      }
    });
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
    if (x>w+W.innerWidth || x+w< -40 || y>W.innerHeight+40 || y-bodyH< -100) return;
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
  function drawCity() {
    if (!cityVisible() || !(typeof P!=='undefined'&&P.team?.length) || (typeof inBattle!=='undefined'&&inBattle)) return;
    captureOrigin(); if (!origin) return;
    const now=performance.now(); if(now-lastDraw<20)return; lastDraw=now;
    const c=ctx, cv=D.getElementById('gameCanvas'), w=cv.width, h=cv.height, center=screenPoint(0,0);
    c.save();
    // Cool moonlight across the map with warm amber pockets around the town.
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
    // Village crossroads and broad paved lanes.
    const roadW=Math.max(68,TILE*1.42);
    c.fillStyle='#302a3b';c.fillRect(center.x-roadW/2,center.y-12*TILE,roadW,24*TILE);c.fillRect(center.x-12*TILE,center.y-roadW/2,24*TILE,roadW);
    c.fillStyle='#494052';c.fillRect(center.x-roadW/2+4,center.y-12*TILE,5,24*TILE);c.fillRect(center.x+roadW/2-9,center.y-12*TILE,5,24*TILE);
    c.fillRect(center.x-12*TILE,center.y-roadW/2+4,24*TILE,5);c.fillRect(center.x-12*TILE,center.y+roadW/2-9,24*TILE,5);
    c.strokeStyle='#cfad6c';c.lineWidth=2.5;c.setLineDash([18,18]);c.beginPath();c.moveTo(center.x,center.y-12*TILE);c.lineTo(center.x,center.y+12*TILE);c.stroke();c.beginPath();c.moveTo(center.x-12*TILE,center.y);c.lineTo(center.x+12*TILE,center.y);c.stroke();c.setLineDash([]);
    HOUSES.forEach(house=>drawHouse(c,house));
    // Little graveyard at the edge of the square.
    const grave=screenPoint(9.6,0.1);c.fillStyle='rgba(8,13,25,.55)';rounded(c,grave.x-48,grave.y-39,96,76,8);c.fill();c.strokeStyle='#798099';c.lineWidth=2;c.stroke();
    for(let i=0;i<3;i++){const gx=grave.x-28+i*28,gy=grave.y+4;c.fillStyle=['#697083','#7d7888','#59677a'][i];rounded(c,gx-9,gy-17,18,29,8);c.fill();c.fillStyle='#b6bdca';c.fillRect(gx-1,gy-11,2,12);c.fillRect(gx-5,gy-7,10,2)}
    drawWeb(c,grave.x-43,grave.y-34,29);
    // Copper lamps, hanging pennants, scattered leaves and pumpkins.
    [[-4.8,-.7],[4.8,.7],[-.7,-4.8],[.7,4.8],[-8.9,1.6],[8.9,-1.6]].forEach(([dx,dy],i)=>{
      const p=screenPoint(dx,dy);c.fillStyle='#171421';c.fillRect(p.x-4,p.y-23,8,34);
      c.fillStyle='#80583e';c.fillRect(p.x-9,p.y-27,18,5);c.shadowColor='#ff9e46';c.shadowBlur=24;c.fillStyle='#ffb65b';c.beginPath();c.arc(p.x,p.y-34,8,0,Math.PI*2);c.fill();c.shadowBlur=0;
      if(i%2===0)drawPumpkin(c,p.x+22,p.y+8,.68);
    });
    drawBat(c,w*.17,h*.21,.85);drawBat(c,w*.68,h*.29,.65);drawBat(c,w*.92,h*.34,.48);
    drawWeb(c,8,8,55);drawWeb(c,w-8,8,55);
    // Illustrated signboard, typography only; no emoji glyphs.
    const bannerW=Math.min(330,w-28),bannerY=h*.215;
    c.fillStyle='#171426f2';c.strokeStyle='#d78a4a';c.lineWidth=2.4;rounded(c,w/2-bannerW/2,bannerY-20,bannerW,40,18);c.fill();c.stroke();
    c.fillStyle='#f8d98c';c.font='900 13px system-ui';c.textAlign='center';c.fillText('VILA DAS SOMBRAS  ·  FESTIVAL DE HALLOWEEN',w/2,bannerY+5);
    c.restore();
  }
  function makeDialog() {
    if (dialog) return dialog;
    dialog=D.createElement('section'); dialog.className='psy-halloween-dialog'; dialog.setAttribute('role','dialog'); dialog.setAttribute('aria-live','polite');
    dialog.innerHTML='<button type="button" class="psy-halloween-close" aria-label="Fechar">×</button><small>FESTIVAL DE HALLOWEEN</small><h3></h3><p></p><button type="button" class="psy-halloween-next">CONTINUAR</button>';
    dialog.querySelector('.psy-halloween-close').onclick=()=>dialog.classList.remove('open');
    dialog.querySelector('.psy-halloween-next').onclick=()=>dialog.classList.remove('open');
    D.body.appendChild(dialog); return dialog;
  }
  function speak(npc) {
    const panel=makeDialog(), name=panel.querySelector('h3'), copy=panel.querySelector('p');
    const line=npc.lines[Math.floor(Math.random()*npc.lines.length)];
    name.textContent=npc.name+' · '+npc.role; copy.textContent='“'+line+'”'; panel.classList.add('open');
  }
  function ensureNPCs() {
    const wrap=D.getElementById('game-wrap');if(!wrap)return;
    NPCS.forEach(npc=>{
      if(D.getElementById('psy-halloween-npc-'+npc.id))return;
      const button=D.createElement('button');button.type='button';button.id='psy-halloween-npc-'+npc.id;button.className='psy-halloween-npc';button.setAttribute('aria-label','Conversar com '+npc.name);
      button.innerHTML='<span class="psy-halloween-sprite"><img alt=""></span><span class="psy-halloween-name">'+npc.name+'</span><span class="psy-halloween-role">'+npc.role+'</span>';
      const img=button.querySelector('img');
      img.src='/assets/halloween/'+npc.art;
      img.onerror=()=>{button.classList.add('psy-halloween-art-missing')};
      button.onclick=()=>speak(npc);wrap.appendChild(button);
    });
  }
  function positionNPCs() {
    const active=cityVisible()&&!!origin&&!!(typeof P!=='undefined'&&P.team?.length)&&!(typeof inBattle!=='undefined'&&inBattle);
    NPCS.forEach(npc=>{
      const el=D.getElementById('psy-halloween-npc-'+npc.id);if(!el)return;
      if(!active){el.hidden=true;return}
      const p=screenPoint(npc.dx,npc.dy);
      const visible=p.x>-80&&p.x<W.innerWidth+80&&p.y>-110&&p.y<W.innerHeight+40;
      el.hidden=!visible;el.style.left=p.x+'px';el.style.top=p.y+'px';
    });
    if(!cityVisible())dialog?.classList.remove('open');
  }
  const baseDraw=W.draw;
  if(typeof baseDraw==='function')W.draw=function(){baseDraw.apply(this,arguments);drawCity()};
  const baseNpcUpdate=W.updateNPCSprites;
  if(typeof baseNpcUpdate==='function')W.updateNPCSprites=function(){baseNpcUpdate.apply(this,arguments);captureOrigin();ensureNPCs();positionNPCs()};
  W.addEventListener('resize',positionNPCs,{passive:true});
  W.addEventListener('orientationchange',()=>setTimeout(positionNPCs,120),{passive:true});
})(window,document);
