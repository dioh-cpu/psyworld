(function(){
'use strict';
const D=document,W=window;
function load(src,flag,onload){if(D.querySelector('script['+flag+']')){onload?.();return}const s=D.createElement('script');s.src=src;s.async=false;s.setAttribute(flag,'1');if(onload)s.onload=onload;s.onerror=()=>console.warn('Falha ao carregar '+src);D.head.appendChild(s)}
load('core/audio-v1-base.js?build=AUDIO_V1_BASE_V24','data-psy-audio-base-v24',()=>{
  load('core/online-authority-v24.js?build=ONLINE_AUTHORITY_V24_20260902','data-psy-authority-v24');
});
})();
