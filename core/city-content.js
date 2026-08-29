(function(){
  const KEY='psyworld_city_content_collapsed_v1';

  window.toggleCityGameContent=function(force){
    const dock=document.getElementById('world-btn-float');
    const btn=document.getElementById('btn-city-content-toggle');
    if(!dock||!btn)return;

    let collapsed;
    if(typeof force==='boolean') collapsed=force;
    else collapsed=!dock.classList.contains('city-content-collapsed');

    dock.classList.toggle('city-content-collapsed',collapsed);
    btn.innerHTML=collapsed?'📦 CONTEÚDO DO JOGO ▶':'📦 CONTEÚDO DO JOGO ▼';
    btn.title=collapsed?'Mostrar atalhos da cidade':'Minimizar atalhos da cidade';

    try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(e){}
  };

  function restoreCityContentState(){
    let collapsed=false;
    try{collapsed=localStorage.getItem(KEY)==='1'}catch(e){}
    window.toggleCityGameContent(collapsed);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',restoreCityContentState,{once:true});
  }else{
    restoreCityContentState();
  }
})();
