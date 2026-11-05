(function(){
  const KEY='psyworld_city_content_collapsed_v3';

  window.toggleCityGameContent=function(force){
    const dock=document.getElementById('world-btn-float');
    const btn=document.getElementById('btn-city-content-toggle');
    if(!dock||!btn)return;

    let collapsed;
    if(typeof force==='boolean') collapsed=force;
    else collapsed=!dock.classList.contains('city-content-collapsed');

    dock.classList.toggle('city-content-collapsed',collapsed);
    btn.innerHTML=collapsed?'🎃 CONTEÚDO DO JOGO':'CONTEÚDO DO JOGO <span aria-hidden="true">×</span>';
    btn.setAttribute('aria-expanded',String(!collapsed));
    document.getElementById('psy-content-backdrop')?.classList.toggle('open',!collapsed);
    btn.title=collapsed?'Mostrar atalhos da cidade':'Minimizar atalhos da cidade';

    try{localStorage.setItem(KEY,collapsed?'1':'0')}catch(e){}
  };

  function restoreCityContentState(){
    const backdrop=document.createElement('button');backdrop.id='psy-content-backdrop';backdrop.type='button';backdrop.setAttribute('aria-label','Fechar conteúdo do jogo');backdrop.onclick=()=>window.toggleCityGameContent(true);document.body.appendChild(backdrop);
    document.getElementById('city-game-content-buttons')?.addEventListener('click',e=>{if(e.target.closest('button'))window.toggleCityGameContent(true)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')window.toggleCityGameContent(true)});
    let collapsed=false, saved=null;
    try{saved=localStorage.getItem(KEY);collapsed=saved==='1'}catch(e){}
    collapsed=true;
    window.toggleCityGameContent(collapsed);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',restoreCityContentState,{once:true});
  }else{
    restoreCityContentState();
  }
})();


/* PSYWORLD Audio System V1 — carregamento global */
(function psyLoadAudioSystem(){
  if(document.getElementById('psy-audio-system-script'))return;
  const s=document.createElement('script');
  s.id='psy-audio-system-script';
  s.src='core/audio.js?v=2';
  s.async=true;
  document.head.appendChild(s);
})();
