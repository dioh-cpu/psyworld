/* PSYWORLD — catálogo de rigs autorais do Mundo Selvagem 3D V143. */
(function(W){
  'use strict';
  W.PSY_WILDLANDS_3D_ASSETS_V143={
    version:'WILDLANDS_3D_ASSETS_V143_20260914',
    policy:'articulated-low-poly-original',
    clips:{
      idle:{duration:1.30,loop:true},
      walk:{duration:.72,loop:true},
      run:{duration:.48,loop:true},
      attack:{duration:.34,loop:false},
      cast:{duration:.62,loop:false},
      work:{duration:.90,loop:true},
      hit:{duration:.20,loop:false},
      dodge:{duration:.48,loop:false},
      death:{duration:.70,loop:false}
    },
    rigs:{
      lumion:{species:'Lúmion',skeleton:'fox-spirit',parts:['body','head','ears','legs','tail','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','dodge','death']},
      oriel:{species:'Oriel',skeleton:'fox-spirit-ally',parts:['body','head','ears','legs','tail','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','dodge','death']},
      embermite:{species:'Embermite',skeleton:'six-leg-beetle',parts:['shell','head','six-legs','horns','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','death']},
      mossclaw:{species:'Mossclaw',skeleton:'thorn-beast',parts:['body','head','four-claws','vines','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','death']},
      gloomfin:{species:'Gloomfin',skeleton:'void-ray',parts:['body','fin','tail','wisps','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','death']},
      glintling:{species:'Glintling',skeleton:'void-ray-small',parts:['body','fin','tail','wisps','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','death','hit']},
      ironroot:{species:'Ironroot',skeleton:'ancient-guardian',parts:['core','head','arms','roots','crown','aura'],directions:8,clips:['idle','walk','run','attack','cast','work','hit','death']}
    }
  };
})(window);
