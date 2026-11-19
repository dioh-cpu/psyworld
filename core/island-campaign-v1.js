/* Original monster campaign, using the existing illustrated world and battle engine. */
(function (W, D) {
  'use strict';

  const saveKey = 'psyworld.original-island.v1';
  const starter = {id:9001, name:'Noctarn', type:'Noturno', stars:3, hp:74, damage:1.05, speed:16, isStarter:true, power:55, attack:'Garra do Crepúsculo'};
  const species = [
    {id:9002, name:'Raizardo', type:'Planta', stars:3, hp:86, damage:.98, speed:12, habitat:'Trilha do Bosque', power:48, attack:'Chicote de Espinhos'},
    {id:9003, name:'Salmarim', type:'Agua', stars:3, hp:79, damage:1.01, speed:15, habitat:'Enseada dos Destroços', power:48, attack:'Jato Salgado'},
    {id:9004, name:'Brumasa', type:'Voador', stars:4, hp:69, damage:1.08, speed:21, habitat:'Falésias da Bruma', power:48, attack:'Rajada das Falésias'}
  ];
  const catalog = [starter, ...species, ...W.PsyIslandSummons.creatures];
  const initialEggChance = .005;
  let active = false;
  let race = null;
  const island = () => P.meta.islandCampaign;
  const entryFor = mon => catalog.find(entry=>entry.id===Number(mon?.id));
  const starFactor = mon => 1 + .15 * (mon.stars - 3);
  const speed = mon => Math.round((entryFor(mon).speed + 2*(mon.level-1))*starFactor(mon));
  const damageFactor = mon => entryFor(mon).damage * starFactor(mon);
  function sprite(mon) {
    const entry = entryFor(mon);
    return entry && !entry.isStarter ? 'assets/monsters/island/' + (entry.art || entry.id) + '.svg' : null;
  }

  function applyStars(mon) {
    const entry = entryFor(mon);
    mon.stars = Math.max(entry.stars,Math.min(6,Number(mon.stars)||entry.stars));
    // Start with the old level growth, then apply the species and star bonuses.
    const hp = Math.round((entry.hp+20*(mon.level-1))*starFactor(mon));
    const ratio = mon.maxHp ? mon.hp/mon.maxHp : 1;
    mon.baseMaxHp = mon.maxHp = hp;
    mon.hp = mon.currentHp = ratio > 0 ? Math.max(1,Math.round(hp*Math.min(1,ratio))) : 0;
    return mon;
  }

  function makeMon(entry, level = 1) {
    return applyStars({
      id:entry.id, name:entry.name, type:entry.type, level, exp:0, maxExp:100,
      stars:entry.stars, boost:0, resets:0,
      followerKeyV47:entry.isStarter ? 'island-noctarn' : undefined,
      rarity:{n:'Comum', mult:1, bonus:0}, isStarter:entry.isStarter || false,
      moves:[{name:entry.attack, power:entry.power, type:entry.type},
        {name:'Investida', power:39, type:'Normal'}]
    });
  }

  function acquire(entry) {
    P.box.push(makeMon(entry));
    return entry.name+' '+entry.stars+' ★';
  }

  function summons(dialog) {
    W.PsyIslandSummons.open(dialog,{state:island,catalog,acquire,save});
  }

  const farmUnlocked = () => active && island().quest === 'farmUnlocked';
  function quest(dialog) {
    const state = island();
    if (farmUnlocked()) return dialog('Missões da ilha','Rastros na enseada concluída. A Fazenda está disponível no cabeçalho.');
    if (!Object.values(state.defeats).some(n=>n>0)) return dialog('Rastros na enseada',
      'Derrote uma criatura em Expedições e volte aqui para entregar a missão.');
    dialog('Rastros na enseada','Você voltou da expedição. O porto colocou os canteiros à sua disposição.',[
      {text:'Entregar missão',run:()=>{
        state.quest='farmUnlocked';save();
        W.PsyKantoWorldV2.refreshIslandHud();
        W.notif?.('Fazenda desbloqueada!');
      }}
    ]);
  }

  function read() {
    try { return JSON.parse(localStorage.getItem(saveKey)); } catch (_) { return null; }
  }

  function save() {
    if (!active) return false;
    try {
      localStorage.setItem(saveKey, JSON.stringify({
        name:P.name, team:P.team, box:P.box, gold:P.gold, inventory:P.inventory,
        campaign:island()
      }));
      return true;
    } catch (_) {
      W.notif?.('O navegador não conseguiu salvar o progresso da ilha.');
      return false;
    }
  }

  function start(resume) {
    const nick = D.getElementById('nick-input').value.trim();
    const saved = resume ? read() : null;
    if (!saved && nick.length < 2) { W.notif?.('Digite pelo menos dois caracteres.'); return; }
    if (!saved && read()) {
      W.notif?.('Já existe uma campanha neste navegador. Use Continuar.');
      return;
    }
    P.name = saved?.name || nick;
    P.playerCharacterId = P.trainerCharacterId = P.characterId = 'gothic_boy';
    P.playerCostumeKey = 'basic';
    P.playerCostumeByCharacter = {gothic_boy:'basic'};
    P.team = saved?.team?.filter(mon => catalog.some(entry => entry.id === mon.id)) || [];
    if (!P.team.length) P.team = [makeMon(starter)];
    P.box = saved?.box?.filter(mon => catalog.some(entry => entry.id === mon.id)) || [];
    [...P.team,...P.box].forEach(applyStars);
    P.pokemon = P.team[0];
    P.inventory = saved?.inventory || {};
    P.gold = saved?.gold ?? 0;
    P.meta = {islandCampaign:saved?.campaign || {
      defeats:{}, eggs:{}, plots:[null,null,null], herbs:0, record:null
    }};
    const own = island();
    own.tickets ??= 0;
    own.banners ??= {};
    own.halloweenEggs ??= 0;
    own.quest ??= 'tracks';
    P.meta.followerV47 = {enabled:true,key:'island-noctarn'};
    active = true;
    W.autoSave = save;
    W.psyV9WriteLocal = save;
    D.body.classList.add('psy-original-island');
    D.getElementById('screen-login').style.display = 'none';
    W.PsyKantoWorldV2.open('pallet');
    save();
    if (!saved) W.PsyKantoWorldV2.islandDialog('A Ilha das Marés Sombrias',
      'O barco se partiu no mar. Você acordou entre destroços e seguiu Noctarn até Porto das Cinzas. Explore a vila, cuide do seu companheiro e procure pistas sobre a criatura do naufrágio.');
  }

  function returnToTitle() {
    race = null;
    save();
    D.getElementById('screen-login').style.display = '';
    D.querySelector('[data-island-continue]').hidden = !read();
  }

  const chance = id => Math.min(1, initialEggChance + .01 * Math.floor((island().defeats[id] || 0) / 5));
  function victory(enemy) {
    if (!active || !enemy?.islandEncounter || enemy.islandCounted) return;
    enemy.islandCounted = true;
    island().defeats[enemy.id] = (island().defeats[enemy.id] || 0) + 1;
    if (Math.random() < chance(enemy.id)) {
      island().eggs[enemy.id] = (island().eggs[enemy.id] || 0) + 1;
      W.notif?.('Ovo encontrado: ' + enemy.name, 4000);
    }
    const own = island();
    own.tickets++;
    P.inventory['Doce de Halloween'] = (P.inventory['Doce de Halloween']||0)+3;
    applyStars(P.team[0]);
    save();
  }

  function encounter(entry) {
    if (P.team[0].hp <= 0) { W.notif?.('Descanse no refúgio antes de lutar.'); return; }
    const level = Math.max(1, P.team[0].level - 1);
    W.PsyKantoWorldV2.islandBattle(() => {
      const enemy = makeMon(entry, level);
      enemy.maxHp = enemy.hp = Math.round(enemy.maxHp*.65);
      W.startBattle({...enemy, lvl:level, islandEncounter:true});
    });
  }

  const percent = new Intl.NumberFormat('pt-BR',{style:'percent', maximumFractionDigits:1});
  function explore(dialog) {
    dialog('Expedições da ilha', species.map(entry =>
      entry.name + ': ' + (island().defeats[entry.id] || 0) +
      ' vitórias · ' + percent.format(chance(entry.id)) + ' de chance de ovo').join(' | '),
    species.map(entry => ({text:entry.habitat, run:()=>encounter(entry)})));
  }

  function companions(dialog) {
    const current = P.team[0];
    const actions = P.box.map(mon => ({text:'Viajar com ' + mon.name+' '+mon.stars+' ★', run:()=>{
      P.box.splice(P.box.indexOf(mon),1,current);
      P.team = [mon];
      P.pokemon = mon;
      W.PsyFollower?.clear?.();
      save();
      companions(dialog);
    }}));
    for (const entry of species) {
      const eggs = island().eggs[entry.id] || 0;
      if (!eggs) continue;
      actions.push({text:'Chocar ' + entry.name + ' (' + eggs + ')', run:()=>{
        if (!island().eggs[entry.id]) return;
        island().eggs[entry.id]--;
        P.box.push(makeMon(entry));
        save();
        companions(dialog);
      }});
    }
    actions.push({text:'Fundir '+current.name,run:()=>fusion(dialog,current)});
    actions.push({text:'Fechar'});
    dialog('Companheiros e ovos', current.name + ' '+current.stars+' ★ · Velocidade '+speed(current)+' · Nv. ' + current.level +
      ' · XP ' + current.exp + '/' + current.maxExp +
      ' · Vida ' + current.hp + '/' + current.maxHp + '. Os ovos das expedições podem ser chocados aqui.', actions);
  }

  const fusionCost = {3:2,4:10,5:20};
  const copyCredit = target => Math.max(1,5-target.stars);
  function fusion(dialog,target,selected = new Set()) {
    const cost = fusionCost[target.stars];
    const back = {text:'Voltar',run:()=>companions(dialog)};
    if (!cost) return dialog('Fusão','Este companheiro já tem 6 ★.',[back]);
    const candidates = P.box.filter(mon=>mon.type===target.type && !mon.isStarter);
    const credit = mon => mon.id===target.id ? copyCredit(target) : 1;
    const total = [...selected].reduce((sum,mon)=>sum+credit(mon),0);
    const actions = [];
    if (total>=cost) actions.push({text:'Confirmar fusão',run:()=>{
      if (!cost || target.stars>=6 || [...selected].some(mon=>!P.box.includes(mon))) return companions(dialog);
      P.box = P.box.filter(mon=>!selected.has(mon));
      target.stars++; applyStars(target); save(); companions(dialog);
    }});
    for (const mon of candidates) {
      actions.push({text:(selected.has(mon)?'Remover ':'Selecionar ')+mon.name+' '+mon.stars+' ★ (+'+credit(mon)+')',run:()=>{
        if (selected.has(mon)) selected.delete(mon); else selected.add(mon);
        fusion(dialog,target,selected);
      }});
    }
    actions.push(back);
    dialog('Fusão de '+target.name,'Materiais de '+target.type+': '+total+'/'+cost+
      ' para subir de '+target.stars+' para '+(target.stars+1)+' ★. Os companheiros selecionados serão consumidos.',actions);
  }

  const growthTime = 60000;
  function farm(dialog) {
    if (!farmUnlocked()) return dialog('Fazenda trancada','Entregue a missão Rastros na enseada para liberar a fazenda.',[{text:'Ver missão',run:()=>quest(dialog)}]);
    const own = island();
    const now = Date.now();
    const actions = own.plots.map((plot, index) => {
      const title = 'Canteiro ' + (index + 1) + ' · ';
      if (!plot) return {text:title + 'Plantar', run:()=>{
        own.plots[index] = {plantedAt:Date.now(), wateredAt:null};
        save(); farm(dialog);
      }};
      if (!plot.wateredAt) return {text:title + 'Regar', run:()=>{
        plot.wateredAt = Date.now();
        save(); farm(dialog);
      }};
      if (now - plot.wateredAt >= growthTime) return {text:title + 'Colher', run:()=>{
        own.herbs++; own.plots[index] = null;
        save(); farm(dialog);
      }};
      const seconds = Math.ceil((growthTime - (now - plot.wateredAt))/1000);
      return {text:title + seconds + ' s para colher', run:()=>farm(dialog)};
    });
    actions.push({text:'Fechar'});
    dialog('Horta do cais', 'Plante e regue em cada canteiro. Depois de um minuto, volte para colher. Ervas no estoque: ' + own.herbs + '.', actions);
  }

  function rest(dialog) {
    const mon = P.team[0];
    if (mon.hp === mon.maxHp) { W.notif?.(mon.name + ' já está com a vida cheia.'); return; }
    const heal = full => {
      if (!full && island().herbs < 1) return;
      if (!full) island().herbs--;
      mon.hp = full ? mon.maxHp : Math.min(mon.maxHp,mon.hp + 40);
      mon.fainted = false; mon.currentHp = mon.hp;
      save();
      W.notif?.(mon.name + ' recuperou forças.');
    };
    const actions = [{text:'Descansar no refúgio', run:()=>heal(true)}];
    if (island().herbs) actions.push({text:'Usar uma erva (+40 vida)',run:()=>heal(false)});
    dialog('Refúgio de Porto das Cinzas','Recupere seu companheiro antes da próxima expedição.',actions);
  }

  function beginRace(position, walkable, dialog) {
    const directions = [[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[-.707,-.707],[.707,-.707],[-.707,.707]];
    const checks = [68,136,204];
    const direction = directions.find(([dx,dy]) => {
      for(let length=8;length<=216;length+=8)
        if(!walkable(position.x+dx*length,position.y+dy*length)) return false;
      return true;
    });
    if (!direction) {
      dialog('Corrida do porto','Procure um trecho aberto do caminho e abra a corrida ali.');
      return;
    }
    const [dx,dy] = direction;
    const points = checks.map(distance => ({x:position.x+dx*distance,y:position.y+dy*distance}));
    points.push({...position});
    const record = island().record;
    dialog('Corrida do porto','Passe pelos quatro marcos em ordem e volte ao ponto de partida. ' +
      (record ? 'Recorde: ' + record.toFixed(2) + ' s.' : 'Complete a pista para marcar seu primeiro tempo.'),[
      {text:'Largar',run:()=>{
        race = {points, index:0, readyAt:performance.now()+2000};
        W.notif?.('Prepare-se. Siga os marcos numerados.',2200);
      }},{text:'Fechar'}
    ]);
  }

  function raceFrame(ctx, position, outside) {
    if (!race) return;
    if (!outside) { race = null; return; }
    const now = performance.now();
    const next = race.points[race.index];
    if (now >= race.readyAt && Math.hypot(position.x-next.x, position.y-next.y) < 20) {
      if (++race.index === race.points.length) {
        const seconds = (now-race.readyAt)/1000;
        const best = !island().record || seconds < island().record;
        if (best) { island().record = seconds; save(); }
        race = null;
        W.notif?.((best ? 'Novo recorde: ' : 'Tempo final: ') + seconds.toFixed(2) + ' s',4000);
        return;
      }
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui';
    race.points.forEach(({x,y},index)=>{
      if (index < race.index) return;
      ctx.fillStyle = index === race.index ? '#e9b955' : '#9da3af';
      ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle = '#111522';
      ctx.fillText(String(index+1),x,y+5);
    });
    ctx.restore();
  }

  W.PsyIslandCampaign = {
    active:()=>active, sprite, save, victory, returnToTitle,
    farm, farmUnlocked, quest, summons, speed, damageFactor, moves:mon=>entryFor(mon)?mon.moves:null, rest, explore, companions, beginRace, raceFrame, racing:()=>!!race, cancelRace:()=>{race=null;}
  };
  D.querySelector('[data-island-start]').onclick = ()=>start(false);
  const resume = D.querySelector('[data-island-continue]');
  resume.hidden = !read();
  resume.onclick = ()=>start(true);
  D.getElementById('nick-input').addEventListener('keydown', event=>{
    if(event.key==='Enter') start(false);
  });
  W.addEventListener('pagehide',save);
})(window,document);
