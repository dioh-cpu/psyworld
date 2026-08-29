window.MEGA_POKES = [3,6,9,15,18,36,65,71,80,94,115,121,127,130,142,149,150,154,160,181,208,212,214,227,229,248,254,257,260,282,302,303,306,308,310,319,323,334,354,358,359,362,373,376,380,381,384,398,428,445,448,460,475,478,500,530,531,545,560,604,609,623,652,655,658,668,670,687,689,691,701,719,740,780,870,952,970];
window.MEGA_XY = {
  6: [{id:'charizard-megax', name:'Mega X', letter:'X', color:'#00aaff'}, {id:'charizard-megay', name:'Mega Y', letter:'Y', color:'#ff6600'}],
  150: [{id:'mewtwo-megax', name:'Mega X', letter:'X', color:'#00aaff'}, {id:'mewtwo-megay', name:'Mega Y', letter:'Y', color:'#ff99ff'}],
  3: [{id:'venusaur-mega', name:'Mega', letter:'', color:'#00aaff'}],
  149: [{id:'dragonite-mega', name:'Mega', letter:'', color:'#00aaff'}]
};

function getShowdownName(id){
  if(!id) return 'bulbasaur';
  if(typeof ALL_POKE_NAMES!=='undefined' && ALL_POKE_NAMES[id]) return ALL_POKE_NAMES[id].toLowerCase().replace(/[^a-z0-9]/g,'');
  return 'bulbasaur';
}

function getRealSprite(p){
  if(!p || !p.id) return 'https://play.pokemonshowdown.com/sprites/ani/bulbasaur.gif';
  let base = (p.isMega && p.megaForm)
    ? p.megaForm
    : ((getShowdownName(p.id) || 'bulbasaur') + (p.isMega ? '-mega' : ''));
  base = String(base).toLowerCase()
    .replace('mega-x','megax')
    .replace('mega-y','megay');
  const folder = p.shiny ? 'ani-shiny' : 'ani';
  return `https://play.pokemonshowdown.com/sprites/${folder}/${base}.gif`;
}

// FIX SEM PISCAR - substitui o getSpriteUrl da linha 3041
window.getSpriteUrl = function(id, shiny, isMega, megaForm){
  let active = window.P?.team?.[0];
  if(active && active.id===id){
    return getRealSprite(active);
  }
  let base = megaForm || (getShowdownName(id) + (isMega?'-mega':''));
  base = base.replace('mega-x','megax').replace('mega-y','megay');
  let folder = shiny?'ani-shiny':'ani';
  return `https://play.pokemonshowdown.com/sprites/${folder}/${base}.gif`;
}

window.getPokeAnim = function(p){ return getRealSprite(p); }
function getPokeAnim(p){ return window.getPokeAnim(p); }

window.getPokeAnimMegaFix = function(p){
  let id = typeof p==='number'? p : p.id;
  if(id==6) return 'https://play.pokemonshowdown.com/sprites/ani/charizard-megax.gif';
  if(id==150) return 'https://play.pokemonshowdown.com/sprites/ani/mewtwo-megax.gif';
  return 'https://play.pokemonshowdown.com/sprites/ani/'+getShowdownName(id)+'-mega.gif';
}
function getPokeAnimMegaFix(p){ return window.getPokeAnimMegaFix(p); }

window.getImg = function(id, shiny, isMega, megaForm){
  let base = megaForm || (getShowdownName(id) + (isMega?'-mega':''));
  base = base.replace('mega-x','megax').replace('mega-y','megay');
  let key = base + (shiny?'_s':'');
  if(typeof imgCache==='undefined') window.imgCache={};
  if(imgCache[key]) return imgCache[key];
  let img = new Image();
  img.src = 'https://play.pokemonshowdown.com/sprites/'+(shiny?'ani-shiny':'ani')+'/'+base+'.gif';
  img.onerror = function(){ this.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+id+'.png'; };
  imgCache[key]=img;
  return img;
}

window.useMegaStone = function(idx,isBox){
  let poke = isBox?P.box[idx]:P.team[idx];
  if(!poke || poke.isMega) return;
  if(!window.MEGA_POKES.includes(poke.id)) return notif('Esse não mega evolui');
  let cost = poke.shiny?150:50;
  if((P.inventory["Fragmento Mega Stone"]||0) < cost) return notif('Precisa '+cost+' frag');
  if(window.MEGA_XY[poke.id] && window.MEGA_XY[poke.id].length>1){ openMegaChoice(idx,isBox,cost); return; }
  if(!confirm('MEGA '+poke.name+'? -'+cost)) return;
  P.inventory["Fragmento Mega Stone"]-=cost;
  if(P.inventory["Fragmento Mega Stone"]<=0) delete P.inventory["Fragmento Mega Stone"];
  poke.isMega=true; poke.megaForm = window.MEGA_XY[poke.id]?.[0]?.id || getShowdownName(poke.id)+'-mega';
  poke.name = (poke.shiny?'Shiny Mega ':'Mega ') + getPokeName(poke.id);
  poke.rarity={n:"DEUS",mult:15,color:"#fff"};
  recalcPoke(poke); autoSave(); renderTeam(); openPokeDetail(idx,isBox);
}

window.openMegaChoice = function(idx,isBox,cost){
  let poke = isBox?P.box[idx]:P.team[idx];
  let choices = window.MEGA_XY[poke.id];
  let folder = poke.shiny?'ani-shiny':'ani';
  let html = '<div style="background:#111;border:2px solid #00aaff;border-radius:12px;padding:16px;max-width:420px;text-align:center;">';
  html += '<h3 style="color:#00aaff;">ESCOLHA A MEGA DE '+poke.name.toUpperCase()+'</h3><div style="display:flex;gap:10px;margin:12px 0;">';
  for(let i=0;i<choices.length;i++){
    let c = choices[i];
    html += '<button onclick="confirmMegaChoice('+idx+','+isBox+','+i+','+cost+')" style="flex:1;background:'+c.color+';color:#fff;border:none;padding:12px;border-radius:8px;font-weight:900;">';
    html += '<img src="https://play.pokemonshowdown.com/sprites/'+folder+'/'+c.id+'.gif" style="width:96px;height:96px;"><br>'+c.name+'</button>';
  }
  html += '</div><div style="color:#ffd700;font-size:12px;">Custo: '+cost+' (tem '+(P.inventory["Fragmento Mega Stone"]||0)+')</div>';
  html += '<button onclick="document.getElementById(\'mega-choice-screen\').remove()" style="margin-top:10px;background:#333;color:#fff;border:none;padding:8px 16px;border-radius:6px;">CANCELAR</button></div>';
  let div=document.createElement('div'); div.id='mega-choice-screen';
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000000;display:flex;align-items:center;justify-content:center;';
  div.innerHTML=html; document.body.appendChild(div);
}

window.confirmMegaChoice = function(idx,isBox,choiceIdx,cost){
  let poke = isBox?P.box[idx]:P.team[idx];
  P.inventory["Fragmento Mega Stone"]-=cost;
  if(P.inventory["Fragmento Mega Stone"]<=0) delete P.inventory["Fragmento Mega Stone"];
  let choice = window.MEGA_XY[poke.id][choiceIdx];
  poke.isMega=true; poke.megaForm = choice.id;
  poke.name = (poke.shiny?'Shiny Mega ':'Mega ') + getPokeName(poke.id) + (choice.letter?' '+choice.letter:'');
  poke.rarity={n:"DEUS",mult:15,color:"#fff"};
  if(window.imgCache){
    Object.keys(window.imgCache).forEach(k=>{ if(k.includes(getShowdownName(poke.id)) || k.includes('charizard') || k.includes('mewtwo')) delete window.imgCache[k]; });
  }
  recalcPoke(poke);
  document.getElementById('mega-choice-screen').remove();
  notif('🔥 '+poke.name+'!');
  autoSave(); renderTeam(); openPokeDetail(idx,isBox);
}
window.handleMegaClick = (i,b)=>{ let p=(b?P.box[i]:P.team[i]); if(window.MEGA_XY[p.id]?.length>1) openMegaChoice(i,b,p.shiny?150:50); else useMegaStone(i,b); }
