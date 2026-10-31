/* PSYWORLD — Halloween city plaza, trainer NPCs and touch dialogs. */
(function (W, D) {
  'use strict';
  if (W.__PSY_HALLOWEEN_CITY_V1__) return;
  W.__PSY_HALLOWEEN_CITY_V1__ = true;

  const NPCS = [
    { id:'luna', name:'Luna', role:'Aprendiz da Lua', sprite:'hex_maniac', fallback:'🧙🏻‍♀️', dx:-2.35, dy:-2.35,
      lines:['Bem-vindo ao Festival das Lanternas! A praça está cheia de surpresas.','Dizem que Pokémon Fantasma aparecem com mais frequência nas noites de Halloween.','Não se esqueça de visitar cada canto da cidade. Há lanternas escondidas por toda parte.'] },
    { id:'noah', name:'Noah', role:'Pesquisador', sprite:'scientist', fallback:'🧑🏻‍🔬', dx:2.35, dy:-2.35,
      lines:['Estou estudando como os Pokémon reagem às luzes das abóboras.','Uma cidade bem iluminada é mais segura para os Pokémon pequenos.','Aproveite o festival e cuide bem da sua equipe!'] },
    { id:'mina', name:'Mina', role:'Guardiã do Festival', sprite:'channeler', fallback:'🧛🏻‍♀️', dx:0, dy:4.05,
      lines:['As casas estão decoradas para o Halloween. Ficaram assustadoramente fofas, não acha?','A praça é o ponto de encontro dos treinadores esta noite.','Feliz Halloween! Que sua próxima aventura seja cheia de bons encontros.'] }
  ];
  const HOUSES = [
    { dx:-6.15, dy:-5.15, wall:'#51304f', roof:'#22162f', sign:'POÇÕES' },
    { dx: 6.15, dy:-5.15, wall:'#4a3145', roof:'#25182c', sign:'CENTRO' },
    { dx:-6.15, dy: 5.65, wall:'#57364b', roof:'#29182d', sign:'CASA' },
    { dx: 6.15, dy: 5.65, wall:'#51304f', roof:'#22162f', sign:'FESTIVAL' }
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
      for (let y=hy-1; y<=hy+1; y++) for (let x=hx-1; x<=hx+1; x++) {
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
    const p=screenPoint(h.dx,h.dy), w=142, bodyH=72, roofH=46, x=p.x-w/2, y=p.y-bodyH/2;
    if (x>w+W.innerWidth || x+w< -40 || y>W.innerHeight+40 || y-bodyH< -100) return;
    c.save();
    c.fillStyle='#0009'; c.beginPath(); c.ellipse(p.x,y+bodyH+8,w*.55,11,0,0,Math.PI*2); c.fill();
    c.fillStyle=h.wall; c.strokeStyle='#170f22'; c.lineWidth=4;
    rounded(c,x,y,w,bodyH,8);c.fill();c.stroke();
    c.fillStyle=h.roof;c.beginPath();c.moveTo(x-11,y+6);c.lineTo(p.x,y-roofH);c.lineTo(x+w+11,y+6);c.closePath();c.fill();
    c.strokeStyle='#a855f7';c.lineWidth=3;c.stroke();
    c.fillStyle='#fbbf24';c.shadowColor='#fb923c';c.shadowBlur=13;
    c.fillRect(x+20,y+24,22,22);c.fillRect(x+w-42,y+24,22,22);c.shadowBlur=0;
    c.fillStyle='#352239';c.fillRect(p.x-13,y+bodyH-34,26,34);
    c.fillStyle='#fde68a';c.font='bold 9px system-ui';c.textAlign='center';c.fillText(h.sign,p.x,y+bodyH+21);
    drawPumpkin(c,x+14,y+bodyH+3,.66);drawPumpkin(c,x+w-13,y+bodyH+3,.66);
    c.restore();
  }
  function drawCity() {
    if (!cityVisible() || !(typeof P!=='undefined'&&P.team?.length) || (typeof inBattle!=='undefined'&&inBattle)) return;
    captureOrigin(); if (!origin) return;
    const now=performance.now();
    if(now-lastDraw<20)return; lastDraw=now;
    const c=ctx, cv=D.getElementById('gameCanvas'), w=cv.width, h=cv.height;
    c.save();
    const glow=c.createRadialGradient(w*.5,h*.48,30,w*.5,h*.48,Math.max(w,h)*.82);
    glow.addColorStop(0,'rgba(38,16,44,.04)');glow.addColorStop(1,'rgba(13,7,25,.48)');
    c.fillStyle=glow;c.fillRect(0,0,w,h);
    const center=screenPoint(0,0), roadW=Math.max(56,TILE*1.05);
    c.fillStyle='#49384d';c.strokeStyle='#231a2c';c.lineWidth=5;
    c.fillRect(center.x-roadW/2,center.y-10*TILE,roadW,20*TILE);
    c.fillRect(center.x-10*TILE,center.y-roadW/2,20*TILE,roadW);
    c.strokeStyle='#b39a72';c.lineWidth=2;
    c.setLineDash([12,12]);
    c.beginPath();c.moveTo(center.x,center.y-10*TILE);c.lineTo(center.x,center.y+10*TILE);c.stroke();
    c.beginPath();c.moveTo(center.x-10*TILE,center.y);c.lineTo(center.x+10*TILE,center.y);c.stroke();
    c.setLineDash([]);
    HOUSES.forEach(house=>drawHouse(c,house));
    [[-3.2,-.5],[3.2,.5],[-.6,-3.4],[.6,3.4]].forEach(([dx,dy],i)=>{
      const p=screenPoint(dx,dy);
      c.fillStyle='#160f20';c.fillRect(p.x-4,p.y-25,8,34);
      c.fillStyle='#4c1d95';c.fillRect(p.x-12,p.y-34,24,13);
      c.fillStyle='#fb923c';c.shadowColor='#fb923c';c.shadowBlur=15;
      c.beginPath();c.arc(p.x,p.y-27,5,0,Math.PI*2);c.fill();c.shadowBlur=0;
      if(i%2===0)drawPumpkin(c,p.x+18,p.y+4,.55);
    });
    c.fillStyle='#f8c96b';c.beginPath();c.arc(w*.52,h*.14,24,0,Math.PI*2);c.fill();
    c.fillStyle='#301d3a';[[w*.51,h*.13,7],[w*.55,h*.16,5],[w*.49,h*.17,4]].forEach(([x,y,r])=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()});
    c.fillStyle='#1d1329';c.font='bold 14px system-ui';c.textAlign='center';c.fillText('🎃 FESTIVAL DE HALLOWEEN 🎃',w*.52,h*.205);
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
      button.innerHTML='<span class="psy-halloween-sprite"><img alt=""><b></b><i hidden>'+npc.fallback+'</i></span><span class="psy-halloween-name">'+npc.name+'</span><span class="psy-halloween-role">'+npc.role+'</span>';
      const img=button.querySelector('img'),fallback=button.querySelector('i');
      img.src='https://play.pokemonshowdown.com/sprites/trainers/'+npc.sprite+'.png';
      img.onerror=()=>{img.hidden=true;fallback.hidden=false};
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
