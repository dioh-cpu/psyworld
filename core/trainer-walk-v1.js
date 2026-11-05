/* PSYWORLD — walking animation shared by Psy City and Kanto.
 * Preserves all four authentic stride poses from each 4x4 trainer sheet.
 * Never changes trainer size, floor anchor, or movement speed.
 */
(function(W,D){
'use strict';
if(W.PsyTrainerWalkV1)return;
const cache=new WeakMap();
const TW=48,TH=64,BW=33,BH=46,BASE_Y=14;
const sequence=Object.freeze([1,0,3,0]);
const create=()=>D.createElement('canvas');
function getAtlas(img){
  if(!img)return null;
  const saved=cache.get(img);if(saved)return saved;
  const sw=Math.floor((img.naturalWidth||img.width)/4);
  const sh=Math.floor((img.naturalHeight||img.height)/4);
  if(sw<=0||sh<=0)return null;
  const alphaCanvas=create();alphaCanvas.width=384;alphaCanvas.height=384;
  const alphaCtx=alphaCanvas.getContext('2d',{willReadFrequently:true});
  alphaCtx.imageSmoothingEnabled=true;
  alphaCtx.drawImage(img,0,0,384,384);
  let pixels=null;
  try{pixels=alphaCtx.getImageData(0,0,384,384).data}catch(_){}
  const boxes=Array.from({length:4},()=>Array(4));
  let maxBodyW=0,maxBodyH=0;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    let minX=96,minY=96,maxX=-1,maxY=-1;
    if(pixels)for(let y=0;y<96;y++)for(let x=0;x<96;x++){
      if(pixels[(((row*96+y)*384+col*96+x)*4)+3]<=32)continue;
      if(x<minX)minX=x;if(y<minY)minY=y;
      if(x>maxX)maxX=x;if(y>maxY)maxY=y;
    }
    const box=maxX>=minX?
      {x:Math.max(0,(minX-1)*sw/96),y:Math.max(0,(minY-1)*sh/96),
       w:Math.min(sw,(maxX-minX+3)*sw/96),h:Math.min(sh,(maxY-minY+3)*sh/96)}:
      {x:sw*.27,y:sh*.27,w:sw*.5,h:sh*.56};
    boxes[row][col]=box;maxBodyW=Math.max(maxBodyW,box.w);maxBodyH=Math.max(maxBodyH,box.h);
  }
  // One scale for the whole sheet. Independent per-frame stretching made
  // the trainer visibly grow/shrink as the legs changed pose.
  const bodyScale=Math.min(BW/maxBodyW,BH/maxBodyH);
  const atlas=create();atlas.width=TW*4;atlas.height=TH*4;
  const c=atlas.getContext('2d');c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality='high';
  const temp=create();temp.width=TW;temp.height=TH;
  const tc=temp.getContext('2d');tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality='high';
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const box=boxes[row][col],dw=BW,dh=BH;
    const ox=col*TW,oy=row*TH;
    tc.clearRect(0,0,TW,TH);
    tc.drawImage(img,col*sw+box.x,row*sh+box.y,box.w,box.h,
      (TW-dw)/2,BASE_Y+BH-dh,dw,dh);
    c.save();c.beginPath();c.rect(ox,oy,TW,TH);c.clip();
    c.drawImage(temp,ox,oy);
    c.restore();
  }
  cache.set(img,atlas);return atlas;
}
function column(phase,moving){
  if(!moving)return 0;
  return sequence[((Math.floor(phase)||0)%4+4)%4];
}
function draw(ctx,atlas,row,col,x,y,width,height){
  if(!atlas)return false;
  const r=Math.max(0,Math.min(3,row|0)),c=Math.max(0,Math.min(3,col|0));
  ctx.drawImage(atlas,c*TW,r*TH,TW,TH,x,y,width,height);return true;
}
W.PsyTrainerWalkV1={getAtlas,column,draw,columns:sequence,cellWidth:TW,cellHeight:TH};
})(window,document);
