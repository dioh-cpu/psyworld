/* Kanto interiors V10: detailed, individually themed, pixel-rendered maps.
 * Each location is rasterized ONCE into a world-sized canvas (no per-frame work).
 * Coordinates of furniture and interaction zones are shared with collisions.
 */
(function(W,D){
'use strict';
if(!W.PsyKantoInteriorsV9)return;
const rooms=W.PsyKantoInteriorsV9.rooms,WIDTH=480,HEIGHT=720;
const palettes={
center:{wall:'#654c72',top:'#d4ab9f',floor:'#d7c4b6',joint:'#af9e9d',edge:'#514667',accent:'#c44c65',light:'#ffe0ad',rug:'#e17887'},
market:{wall:'#39556e',top:'#b4b5b4',floor:'#aebbd3',joint:'#8698b4',edge:'#263d5e',accent:'#368fba',light:'#d8f3f5',rug:'#5aa5c8'},
lab:{wall:'#3b5d67',top:'#bbc9bf',floor:'#9eb9ba',joint:'#6b939a',edge:'#28485b',accent:'#58b6b9',light:'#b9fff1',rug:'#539ba6'},
home:{wall:'#77584f',top:'#d8b58e',floor:'#ba936c',joint:'#85634b',edge:'#604436',accent:'#a65d72',light:'#fff0b1',rug:'#c06c77'},
'house-east':{wall:'#76647d',top:'#e2bdaf',floor:'#d0aa83',joint:'#967e6d',edge:'#634f59',accent:'#8b83b9',light:'#ffeca7',rug:'#bf8cab'},
'house-west':{wall:'#395667',top:'#c0c7be',floor:'#c09a70',joint:'#8a694e',edge:'#35516a',accent:'#3d8ca4',light:'#cff5f3',rug:'#78a9b2'}
};
function srand(seed){let v=seed>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296}}
function raster(id){
 const p=palettes[id]||palettes.home;
 const c=D.createElement('canvas');c.width=WIDTH;c.height=HEIGHT;
 const g=c.getContext('2d',{alpha:false});g.imageSmoothingEnabled=false;
 let seed=0;for(const ch of id)seed=seed*31+ch.charCodeAt(0);
 const rnd=srand(seed);
 const R=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x|0,y|0,w|0,h|0)};
 const L=(x,y,xx,yy,color,w=1)=>{g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke()};
 const E=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()};
 const RR=(x,y,w,h,color,border,shadow=4)=>{R(x+shadow,y+shadow,w,h,'#26304488');R(x-2,y-2,w+4,h+4,border);R(x,y,w,h,color)};
 const G=(x,y,w,h,colors,vertical=true)=>{
  const v=g.createLinearGradient(x,y,vertical?x:x+w,vertical?y+h:y);
  colors.forEach(([stop,color])=>v.addColorStop(stop,color));
  R(x,y,w,h,v);
 };
 function outline(x,y,w,h,fill,stroke,lit){RR(x,y,w,h,fill,stroke,3);if(lit)R(x+3,y+3,w-6,3,lit)}
 function light(x,y,color,rad=42){
  const lg=g.createRadialGradient(x,y,2,x,y,rad);
  lg.addColorStop(0,color);lg.addColorStop(1,'#ffffff00');g.fillStyle=lg;g.fillRect(x-rad,y-rad,rad*2,rad*2);
 }
 function pot(x,y,flower=false){RR(x-12,y-7,24,23,'#b16f48','#523e3a',2);R(x-15,y-10,30,5,'#f5c88b');E(x,y-21,19,13,'#1b694f');E(x-7,y-28,10,11,'#448e5b');E(x+8,y-30,11,12,'#63ad68');for(let k=0;k<8;k++){const ax=x+(rnd()-.5)*31,ay=y-34+rnd()*16;R(ax,ay,3,3,flower?'#e6a5e3':'#d0e08c')}}
 function lamp(x,y){R(x-7,y-11,14,25,'#3c3c52');R(x-10,y-16,20,4,'#f7dfab');R(x-5,y-12,10,17,'#ffe5a6');R(x-6,y-33,12,13,'#9e7354');R(x-3,y-39,6,6,'#f8d18c');light(x,y-3,'#ffe7a974',76)}
 function chair(x,y,color){RR(x,y,53,37,color,'#554454',4);R(x+5,y+7,43,16,'#f3c9a855');R(x-4,y-5,61,8,color);R(x+4,y+37,7,7,'#674b40');R(x+42,y+37,7,7,'#674b40')}
 function woodCrate(x,y,w=68){RR(x,y,w,56,'#98704a','#4a3d32',4);R(x+3,y+4,w-6,7,'#c1a172');R(x+3,y+44,w-6,5,'#6d503f');L(x+3,y+5,x+w-3,y+50,'#775135',3);L(x+w-3,y+5,x+3,y+50,'#775135',3)}
 function framed(x,y,w,h,colors){RR(x,y,w,h,'#3b4354','#b58a60',4);G(x+8,y+8,w-16,h-16,colors);R(x+w/2-2,y+8,4,h-16,'#f6e5ca');R(x+8,y+h/2-2,w-16,4,'#f6e5ca')}
 function shelf(x,y,w,h,book=false){RR(x,y,w,h,'#634a4b','#342c40',5);R(x+7,y+5,w-14,h-10,'#2e334a');const rows=Math.floor((h-12)/36);
  for(let row=0;row<rows;row++){const sy=y+9+row*36;for(let i=0;i<Math.floor((w-16)/16);i++){const px=x+10+i*16;const cl=['#8fe6ce','#d69d5f','#e67f8e','#8aa3ef','#c0a2d8','#e5bb72'][(i*3+row)%6];
   if(book){R(px,sy+3,11,21,cl);R(px+2,sy+5,2,17,'#e6eee777')}else{R(px+2,sy+5,9,17,cl);R(px+4,sy+2,5,4,'#f4efda');R(px+4,sy+11,5,3,'#fff6d6')}}
   R(x+5,sy+27,w-10,6,'#a87c53');R(x+7,sy+26,w-14,2,'#edd5a2')}}
 function bottle(x,y,color){R(x+3,y,6,5,'#f7e4bc');R(x,y+6,12,24,color);R(x+2,y+10,8,8,'#e9ece8');R(x+4,y+12,4,4,color);R(x+1,y+26,10,3,'#3d5971')}
 function rug(cx,cy,color){E(cx+3,cy+5,97,66,'#4b42555c');E(cx,cy,93,63,'#efe4d5');E(cx,cy,86,56,color);E(cx,cy,76,46,'#f9edca');E(cx,cy,66,36,color);E(cx,cy,38,21,'#e7bf91');E(cx,cy,14,12,'#f8eede');R(cx-33,cy-2,66,5,color);R(cx-3,cy-29,6,58,color)}
 function desk(x,y){RR(x,y,136,55,'#976a51','#4c3c3c',5);R(x+8,y+4,120,41,'#d7a775');RR(x+41,y-30,60,36,'#273c56','#b3cfd6',3);R(x+47,y-23,48,20,'#68c2c8');R(x+55,y-19,26,9,'#2e6e98');R(x+58,y+9,45,4,'#dcdbbf');R(x+13,y+14,14,22,'#5a7a90');R(x+116,y+13,9,16,'#b08ccc')}
 function terminal(x,y){RR(x,y,70,56,'#334e61','#c4dfd4',4);R(x+7,y+6,56,37,'#6dc7cd');R(x+10,y+10,50,16,'#aad4bd');for(let k=0;k<5;k++)R(x+11+k*10,y+30,6,5,'#397398');R(x+23,y+47,25,4,'#e9ddbb')}
 function bed(x,y,paint){RR(x,y,124,149,'#926b58','#4e3e3f',5);R(x+8,y+8,108,135,'#f1e4d1');R(x+13,y+62,98,77,paint);R(x+19,y+17,39,34,'#fff3da');R(x+65,y+17,39,34,'#fff3da');R(x+15,y+64,94,7,'#edb7a2')}
 function table(x,y){RR(x,y,111,65,'#98704f','#503b3c',5);R(x+8,y+5,95,48,'#d5aa72');R(x+47,y+19,17,17,'#f4e2c2');E(x+55,y+25,9,6,'#b85b62')}
 function tank(x,y){RR(x,y,79,103,'#375774','#2b405b',5);G(x+12,y+8,55,80,[[0,'#c8f4e4'],[.6,'#478dc0'],[1,'#235987']]);for(let k=0;k<14;k++){let ax=x+17+rnd()*43,ay=y+15+rnd()*72;R(ax,ay,2+(rnd()*3|0),2,'#ddffef')}E(x+40,y+55,22,19,'#f3eed8');E(x+40,y+55,15,13,'#b75b6b');R(x+18,y+44,44,5,'#f2f3e2');E(x+40,y+55,5,5,'#e8f8f0');R(x+26,y+91,28,5,'#7ec9d1')}
 function deskPlant(x,y){pot(x,y,true)}
 function roomCounter(color){RR(99,215,282,83,'#474b5e','#25314e',5);R(92,207,296,25,color);R(103,239,274,44,'#c2b9a9');R(111,257,258,16,'#727e9b');R(131,209,54,13,'#f8e7c8');R(298,209,57,13,'#f8e7c8');R(226,217,28,26,'#d2f1e9');R(230,221,20,15,'#335f89');R(234,227,12,5,'#a2dce0')}
 // Level geometry: tall portrait interior to fit mobile; every pixel is art, not a UI mock.
 G(0,0,WIDTH,HEIGHT,[[0,'#24304a'],[1,'#171e2f']]);
 R(11,12,458,694,p.edge);R(18,20,444,681,p.top);
 // Main back wall, paneling, decorative cornice, wooden beams.
 G(18,20,444,139,[[0,p.wall],[.65,p.wall],[1,p.edge]]);
 R(18,153,444,10,'#ead5a9');R(18,163,444,7,'#725f65');
 for(let x=31;x<=450;x+=54){R(x,23,4,128,'#fff8e524');R(x+3,26,3,125,'#211b3334')}
 R(20,174,440,528,p.floor);
 // Fine hand-pixelated floor texture: tiles, seams, highlights and grain.
 for(let y=174;y<704;y+=24)for(let x=20;x<460;x+=24){
    const n=rnd();R(x,y,24,24,n>.8?'#fff9f010':n<.15?'#28213210':'#ffffff07');
    R(x,y+23,24,1,p.joint);R(x+23,y,1,24,p.joint);
    R(x+2,y+2,17,1,'#fff9f034');
    for(let i=0;i<3;i++){const a=x+3+(rnd()*19|0),b=y+3+(rnd()*17|0);
      R(a,b,rnd()>.6?2:1,1,rnd()>.55?'#fef1c944':'#684f6344')}
 }
 for(let k=0;k<1800;k++){
   const x=22+(rnd()*436|0),y=177+(rnd()*520|0);
   R(x,y,1+(rnd()*2|0),1,rnd()>.5?'#fff0cf28':'#49425228');
 }
 // Tall stained windows, with outdoor greenery of Pallet.
 for(const x of [53,341]){
  RR(x,43,83,87,'#243e59','#c39465',4);G(x+8,50,67,70,[[0,'#6cb0cc'],[.55,'#b9dbca'],[1,'#59977a']]);
  E(x+44,110,35,13,'#2f856f');E(x+26,105,20,16,'#357a65');
  R(x+40,51,4,69,'#f6e2b4');R(x+10,83,62,4,'#f6e2b4');R(x+4,127,75,5,'#a57255');
 }
 lamp(240,79);light(240,130,'#ffddab6b',185);
 // Floor borders and walking entrance.
 R(18,695,444,8,'#4d4055');R(191,676,98,20,'#e8cd9c');R(202,688,76,8,'#a77956');
 // Furnishing is room specific; draw in painting order.
 if(id==='center'){
  rug(240,501,p.rug);
  roomCounter(p.accent);
  shelf(30,214,58,151);shelf(392,214,58,151);
  terminal(32,44);terminal(378,44);
  chair(42,420,'#c97779');chair(389,420,'#c97779');
  pot(87,346,true);pot(390,348,true);pot(56,572,true);pot(424,570,true);
  for(const x of [135,324]){R(x,337,22,18,'#fff0ee');R(x+8,329,7,35,p.accent);R(x-5,343,31,6,p.accent)}
  lamp(72,197);lamp(406,197);
 }else if(id==='market'){
  rug(240,526,p.rug);
  roomCounter(p.accent);
  shelf(26,206,64,194);shelf(388,206,64,194);
  shelf(38,458,76,150);shelf(366,458,76,150);
  for(let x=166;x<=304;x+=31)for(let k=0;k<2;k++)bottle(x,342+k*43,['#d56c7d','#59b3cd','#84bcb2','#e1bc69'][((x/31|0)+k)%4]);
  pot(121,310,true);pot(364,309,true);
  terminal(201,47);R(221,57,36,32,'#9fddfa');E(239,73,11,12,'#f2f3e4');
  lamp(127,183);lamp(356,183);
 }else if(id==='lab'){
  rug(240,525,p.rug);
  tank(41,217);tank(360,217);tank(198,47);
  RR(143,217,195,91,'#66869e','#314f6a',5);
  terminal(199,224);terminal(264,224);
  desk(35,453);desk(313,453);
  shelf(25,336,90,106,true);shelf(363,336,92,106,true);
  pot(157,332);pot(331,334);
  for(let k=0;k<5;k++){const cx=151+k*42;E(cx,341,12,6,'#244762');R(cx-8,327,16,12,['#8acece','#e4c2a0','#dd8b90'][k%3])}
  lamp(242,172);
 }else if(id==='home'){
  rug(239,517,p.rug);
  bed(32,227,'#ce7386');desk(306,240);
  shelf(188,42,100,100,true);pot(275,329,true);
  table(191,380);chair(52,478,'#a85c67');chair(375,491,'#a85c67');
  lamp(244,182);pot(410,426,true);woodCrate(371,590,66);
 }else if(id==='house-east'){
  rug(240,514,p.rug);
  bed(331,227,'#b08bba');shelf(34,229,115,198,true);
  table(188,339);chair(95,466,'#8e76a0');chair(348,477,'#8e76a0');
  for(const [x,y] of [[158,292],[302,298],[48,588],[427,574]])pot(x,y,true);
  lamp(240,186);framed(191,51,99,69,[[0,'#9d7cbd'],[1,'#e9bbbd']]);
 }else if(id==='house-west'){
  rug(240,515,p.rug);
  bed(34,230,'#7daebf');desk(309,238);
  woodCrate(32,424);woodCrate(394,442,52);
  shelf(316,52,116,100,true);
  RR(177,55,119,72,'#3e7181','#a7c6be',3);
  L(196,91,271,83,'#d8ecdb',4);
  for(let k=0;k<7;k++){E(232+Math.cos(k*2.8)*31,93+Math.sin(k*2.8)*24,4,4,'#b9dcdd')}
  pot(367,383);lamp(238,184);chair(143,464,'#5b9caa');
 }
 // Lighting vignette, stronger than previous flat vector implementation.
 G(19,177,440,90,[[0,'#fbefc214'],[1,'#ffffff00']]);
 for(const [x,y] of [[44,174],[436,175],[40,692],[441,692]])light(x,y,'#ffe6b81f',60);
 return c;
}
for(const [id,room] of Object.entries(rooms)){
 room.w=WIDTH;room.h=HEIGHT;
 room.spawn=[240,630];room.exit=[240,675];room.art=null;
 room.blocks=[];
 if(id==='center')room.blocks=[[98,202,382,289],[23,205,93,404],[390,205,459,404],[35,409,103,472],[381,409,449,472]];
 if(id==='market')room.blocks=[[96,200,385,289],[21,201,94,410],[386,201,460,412],[30,453,121,613],[359,453,449,614]];
 if(id==='lab')room.blocks=[[143,205,338,310],[36,211,127,331],[351,211,455,331],[28,449,188,530],[299,449,460,530]];
 if(id==='home')room.blocks=[[26,219,171,385],[301,223,450,332],[184,374,313,454],[185,25,301,160]];
 if(id==='house-east')room.blocks=[[325,219,462,390],[24,220,154,433],[177,324,311,404]];
 if(id==='house-west')room.blocks=[[26,219,170,391],[300,227,457,344],[172,48,302,162],[22,417,111,495]];
 room.npcs.forEach((n,i)=>{
   const y=id==='lab'?(i===0?363:408):id==='home'?400:id==='house-west'?399: id==='house-east'?405:id==='center'?(i===0?347:557):350;
   n.at=[i===0?240:334,y];
   // Matching character and portrait art: no unrelated Halloween portraits.
   if(n.sprite)n.portrait=n.sprite;
 });
 Object.defineProperty(room,'paint',{configurable:true,get(){if(!this._paint)this._paint=raster(id);return this._paint}});
}
W.PsyKantoRoomPaintV10={version:10,room:(id)=>rooms[id]||null,paint:raster};
})(window,document);
