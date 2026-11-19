/* Banner rotation and rewards for the original island campaign. */
(function (W) {
  'use strict';

  const creatures = [
    {id:9005,name:'Velumbria',type:'Noturno',stars:5,hp:94,damage:1.18,speed:19,power:56,attack:'Eco Umbral',art:9004},
    {id:9006,name:'Coralume',type:'Agua',stars:6,hp:118,damage:1.12,speed:16,power:55,attack:'Maré de Coral',art:9003},
    {id:9007,name:'Vendral',type:'Voador',stars:6,hp:85,damage:1.22,speed:24,power:57,attack:'Vento Cortante',art:9004},
    {id:9008,name:'Abobral',type:'Planta',stars:3,hp:82,damage:.92,speed:12,power:47,attack:'Cipó Espinhoso',art:9002,halloween:true},
    {id:9009,name:'Morcebrasa',type:'Fogo',stars:4,hp:73,damage:1.08,speed:20,power:51,attack:'Brasa Noturna',art:9004,halloween:true},
    {id:9010,name:'Umbrafenda',type:'Noturno',stars:5,hp:91,damage:1.16,speed:18,power:54,attack:'Fenda Espectral',art:9002,halloween:true},
    {id:9011,name:'Maré Oca',type:'Agua',stars:4,hp:86,damage:1.05,speed:15,power:50,attack:'Onda Oca',art:9003},
    {id:9012,name:'Espinharca',type:'Planta',stars:5,hp:104,damage:1.1,speed:14,power:53,attack:'Raízes da Vigília',art:9002}
  ];
  const prizes = [
    ['Pedra de evolução',12], ['Carta de coleção',10], ['Equipamento do porto',9], ['Runa antiga',9]
  ];
  const week = 7 * 86400000;
  const monday = Date.UTC(2026,10,16);
  const candy = 'Doce de Halloween';
  const eggCost = 30;
  const starWeight = {3:65,4:30,5:8,6:2};
  const pick = list => list[Math.floor(Math.random()*list.length)];

  function weighted(entries) {
    const total = entries.reduce((sum,entry)=>sum+entry.weight,0);
    let roll = Math.random()*total;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll < 0) return entry;
    }
    return entries.at(-1);
  }

  function banners(now = Date.now()) {
    const index = Math.floor((now-monday)/week);
    const featured = [9006,9007,9005,9012];
    const slot = ((index*2)%featured.length+featured.length)%featured.length;
    return [
      {id:'permanent', name:'Permanente', min:3,max:5, guaranteed:100},
      ...[0,1].map(n=>({id:'weekly-'+index+'-'+n,name:'Semanal '+(n+1),min:4,max:6,guaranteed:20,featured:featured[slot+n]})),
      {id:'halloween', name:'Evento de Halloween', min:5,max:6, event:true}
    ];
  }

  function open(dialog, api) {
    const own = api.state();
    dialog('Invocações','Tíquetes: '+own.tickets+' · Doces de Halloween: '+(P.inventory[candy]||0)+' · Você recebe 1 tíquete por vitória.',[
      ...banners().map(banner=>({text:banner.name,run:()=>showBanner(dialog,api,banner.id)})),
      {text:'Ovos de Halloween',run:()=>showHalloween(dialog,api)},
      {text:'Inventário de prêmios',run:()=>dialog('Prêmios de invocação',
        prizes.map(([name])=>name+': '+(P.inventory[name]||0)).join(' · '),[{text:'Voltar',run:()=>open(dialog,api)}])},
      {text:'Fechar'}
    ]);
  }

  function showBanner(dialog, api, id, last = '') {
    const banner = banners().find(item=>item.id===id);
    if (!banner) return open(dialog,api);
    const own = api.state();
    const pool = api.catalog.filter(mon=>!mon.isStarter && mon.stars>=banner.min && mon.stars<=banner.max &&
      (banner.event || !mon.halloween));
    const counts = own.banners[id] || (own.banners[id] = {gold:0,featured:0});
    const featured = pool.find(mon=>mon.id===banner.featured);
    const status = [banner.min+'–'+banner.max+' ★ · 1 tíquete por invocação'];
    if (banner.guaranteed) status.push('5 ★: '+counts.gold+'/'+banner.guaranteed);
    if (featured) status.push(featured.name+' garantido: '+counts.featured+'/150');
    status.push('Tíquetes: '+own.tickets);
    if (last) status.push(last);
    dialog(banner.name,status.join(' · '),[
      {text:'Invocar',run:()=>{
        if (!banners().some(item=>item.id===id)) return open(dialog,api);
        if (own.tickets<1) return showBanner(dialog,api,id,'Você precisa de um tíquete.');
        own.tickets--;
        if (banner.guaranteed) counts.gold++;
        if (featured) counts.featured++;
        let reward;
        if (featured&&counts.featured>=150) {
          reward={mon:featured}; counts.featured=0;
        } else if (banner.guaranteed&&counts.gold>=banner.guaranteed) {
          reward={mon:pick(pool.filter(mon=>mon.stars===5))};
        } else {
          reward=weighted([
            ...pool.map(mon=>({mon,weight:starWeight[mon.stars]*(mon===featured?3:1)})),
            ...prizes.map(([item,weight])=>({item,weight}))
          ]);
        }
        let extra = '';
        if (banner.guaranteed && counts.gold>=banner.guaranteed) {
          if (reward.mon?.stars!==5) extra = ' + '+api.acquire(pick(pool.filter(mon=>mon.stars===5)));
          counts.gold=0;
        }
        const text = reward.mon ? api.acquire(reward.mon) :
          (P.inventory[reward.item]=(P.inventory[reward.item]||0)+1, reward.item);
        api.save();
        showBanner(dialog,api,id,'Resultado: '+text+extra);
      }},
      {text:'Voltar',run:()=>open(dialog,api)}
    ]);
  }

  function showHalloween(dialog, api, last = '') {
    const own = api.state();
    dialog('Ovos de Halloween','Doces: '+(P.inventory[candy]||0)+' · Custo: '+eggCost+' por ovo · Ovos guardados: '+own.halloweenEggs+' · Monstros de 3–5 ★. '+last,[
      {text:'Trocar doces por ovo',run:()=>{
        if((P.inventory[candy]||0)<eggCost)return showHalloween(dialog,api,'Doces insuficientes.');
        P.inventory[candy]-=eggCost; own.halloweenEggs++; api.save(); showHalloween(dialog,api);
      }},
      {text:'Chocar ovo de Halloween',run:()=>{
        if(!own.halloweenEggs)return showHalloween(dialog,api,'Troque doces por um ovo primeiro.');
        const mon = weighted(creatures.filter(item=>item.halloween).map(mon=>({mon,weight:starWeight[mon.stars]}))).mon;
        own.halloweenEggs--; const text=api.acquire(mon); api.save(); showHalloween(dialog,api,'Nasceu: '+text);
      }},
      {text:'Voltar',run:()=>open(dialog,api)}
    ]);
  }

  W.PsyIslandSummons = {creatures,open};
})(window);
