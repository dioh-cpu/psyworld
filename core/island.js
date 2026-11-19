'use strict';
const el = id => document.getElementById(id);
const key = 'psyworld.island.v1';
const newMonster = () => ({level:1, exp:0, maxExp:100});
const state = JSON.parse(localStorage.getItem(key) || 'null') || {
  arrived:false, team:{Noctarn:newMonster()}, active:'Noctarn', wins:{}, eggs:{}, planted:0, harvest:0, record:0
};
function render(){
  el('intro').hidden = state.arrived;
  el('game').hidden = !state.arrived;
  const mon = state.team[state.active];
  const video = el('companion');
  video.hidden = !state.arrived || state.active !== 'Noctarn';
  if(video.hidden) video.pause();
  else if(video.paused) video.play().catch(()=>{});
  el('stats').textContent = state.active+' · Nv. '+mon.level+' · XP '+mon.exp+'/'+mon.maxExp;
  el('ally').replaceChildren(...Object.keys(state.team).map(n=>new Option(n,n,false,n===state.active)));
  const species = el('enemy').value;
  el('inventory').textContent = species+' · Vitórias '+(state.wins[species]||0)+' · Ovos '+(state.eggs[species]||0)+' · Colheitas '+state.harvest;
  el('farm').textContent = state.planted ? 'Verificar colheita' : 'Plantar ervas';
  localStorage.setItem(key,JSON.stringify(state));
}
el('begin').onclick = ()=>{state.arrived=true;render()};
el('ally').onchange = ()=>{state.active=el('ally').value;render()};
el('enemy').onchange = render;
el('battle').onclick = ()=>{
  const species=el('enemy').value, mon=state.team[state.active];
  const won=Math.random()<Math.min(.95,.72+.02*mon.level);
  if(!won){el('log').textContent=species+' escapou.';return}
  state.wins[species]=(state.wins[species]||0)+1;
  mon.exp+=30;
  while(mon.exp>=mon.maxExp){mon.exp-=mon.maxExp;mon.level++;mon.maxExp=Math.floor(mon.maxExp*1.3)}
  const egg = Math.random()<Math.min(1,.005+.01*Math.floor(state.wins[species]/5));
  if(egg) state.eggs[species]=(state.eggs[species]||0)+1;
  el('log').textContent='Vitória! +30 XP.'+(egg?' Você encontrou um ovo de '+species+'!':'');
  render();
};
el('hatch').onclick=()=>{
  const species=el('enemy').value;
  if(!state.eggs[species]){el('log').textContent='Você ainda não encontrou um ovo de '+species+'.';return}
  let name=species, i=2;
  while(state.team[name]) name=species+' '+i++;
  state.eggs[species]--;state.team[name]=newMonster();el('log').textContent=name+' nasceu!';render();
};
el('farm').onclick=()=>{
  if(!state.planted){state.planted=Date.now();el('log').textContent='Ervas plantadas. Colha em um minuto.'}
  else if(Date.now()-state.planted>=60000){state.planted=0;state.harvest++;el('log').textContent='Ervas colhidas.'}
  else el('log').textContent='As ervas ainda estão crescendo.';
  render();
};
let start=0, steps=0;
el('race').onclick=()=>{
  if(!start){start=performance.now();steps=0;el('race').textContent='Avançar';el('track').textContent='Já!';return}
  el('track').textContent=++steps+' / 10';
  if(steps===10){const time=(performance.now()-start)/1000;state.record=state.record?Math.min(time,state.record):time;start=0;el('track').textContent='Tempo '+time.toFixed(2)+' s · Recorde '+state.record.toFixed(2)+' s';el('race').textContent='Correr novamente';render()}
};
render();
