/* Subtle, costume-matched pixel aura. Cosmetic only; no save or battle effects. */
(function(W){
'use strict';
if(W.PsyCostumeAuraV1)return;
const TAU=Math.PI*2;
function palette(source){
 const file=String(source||'').split('/').pop().split('?')[0].toLowerCase();
 if(!file||file.startsWith('basic-'))return null;
 if(file.startsWith('divine-'))return ['#ffe59a','#fff2c4'];
 if(file.startsWith('apex-'))return ['#cf9aff','#f7ca8a'];
 if(file.startsWith('macabre-alt-'))return ['#83e4bd','#d3ff9e'];
 if(file.includes('freddy'))return ['#ff9d58','#ffdc7c'];
 if(file.includes('myers'))return ['#9fc7ff','#e0f1ff'];
 if(file.includes('jason'))return ['#f18a74','#ffcf8b'];
 if(file.includes('spectral-bride'))return ['#efa8dd','#d4d7ff'];
 if(file.includes('ghostface'))return ['#c7d7ff','#f5f6ff'];
 return ['#b79aff','#e7d8ff'];
}
function draw(ctx,source,x,baselineY,scale=1){
 const colors=palette(source);if(!ctx||!colors||!Number.isFinite(x)||!Number.isFinite(baselineY))return false;
 const reduced=!!W.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,phase=reduced?.5:(Number(W.performance?.now?.()||0)/1000),pulse=reduced?.5:.5+.5*Math.sin(phase*1.7);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.12+.045*pulse;ctx.fillStyle=colors[0];
 ctx.beginPath();ctx.ellipse(x,baselineY-26*scale,14*scale,22*scale,0,0,TAU);ctx.fill();
 ctx.globalAlpha=.22+.06*pulse;ctx.strokeStyle=colors[1];ctx.lineWidth=Math.max(1,scale);
 ctx.beginPath();ctx.ellipse(x,baselineY+1*scale,11*scale+pulse*2*scale,3.3*scale,0,0,TAU);ctx.stroke();
 const flicker=reduced?0:Math.floor(phase*4)%4;
 ctx.globalAlpha=.66;
 ctx.fillStyle=colors[1];ctx.fillRect(Math.round(x-14*scale),Math.round(baselineY-(35+flicker)*scale),2*scale,2*scale);
 ctx.fillStyle=colors[0];ctx.fillRect(Math.round(x+(11+flicker%2)*scale),Math.round(baselineY-(20+(flicker+2)%3)*scale),2*scale,2*scale);
 ctx.restore();return true;
}
W.PsyCostumeAuraV1={draw,palette};
})(window);
