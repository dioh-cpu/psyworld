/* Shared touch math; presentation only, collision stays with each scene. */
(function(W){
 'use strict';
 function vector(dx,dy,radius=42,dead=7){const distance=Math.hypot(dx,dy);if(distance<=dead)return {x:0,y:0,distance};const strength=Math.min(1,(distance-dead)/(radius-dead));return {x:dx/distance*strength,y:dy/distance*strength,distance};}
 function cardinal(dx,dy,previous){if(Math.hypot(dx,dy)<=7)return null;const ax=Math.abs(dx),ay=Math.abs(dy);if(previous&&Math.abs(ax-ay)<5)return previous;return ax>ay?(dx<0?'ArrowLeft':'ArrowRight'):(dy<0?'ArrowUp':'ArrowDown');}
 W.PsyTouchStick={vector,cardinal};
})(window);
