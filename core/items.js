(function(W,D){
'use strict';
const ROOT='assets/items/';
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const map=Object.create(null);
const remote=Object.create(null);
const add=(slug,names)=>names.forEach(n=>map[norm(n)]=slug);
const addRemote=(url,names)=>names.forEach(n=>remote[norm(n)]=url);
add('poke-ball',['Pokéball','Pokeball','Poké Ball']);add('great-ball',['Great Ball']);add('super-ball',['Super Ball']);add('ultra-ball',['Ultra Ball']);add('premier-ball',['Premier Ball']);
add('potion',['Poção 50']);add('super-potion',['Poção 100']);add('hyper-potion',['Poção 200']);add('fresh-water',['Poção 30%']);add('moomoo-milk',['Poção 50% HP']);add('max-potion',['Poção 100% HP']);
[['Normal','premier-ball'],['Fire','cherish-ball'],['Water','dive-ball'],['Grass','friend-ball'],['Electric','quick-ball'],['Ice','lure-ball'],['Fighting','level-ball'],['Poison','heal-ball'],['Ground','heavy-ball'],['Flying','lawing-ball'],['Psychic','dream-ball'],['Bug','net-ball'],['Rock','lagigaton-ball'],['Ghost','dusk-ball'],['Dragon','beast-ball'],['Dark','luxury-ball'],['Steel','laorigin-ball'],['Fairy','love-ball']].forEach(([t,s])=>add(s,[t+' Ball']));
[['Fire','fire-stone'],['Water','water-stone'],['Leaf','leaf-stone'],['Thunder','thunder-stone'],['Ice','ice-stone'],['Punch','punch-stone'],['Venom','venom-stone'],['Earth','earth-stone'],['Feather','feather-stone'],['Enigma','enigma-stone'],['Cocoon','cocoon-stone'],['Rock','rock-stone'],['Crystal','crystal-stone'],['Darkness','darkness-stone'],['Metal','metal-stone'],['Heart','heart-stone']].forEach(([n,s])=>add(s,[n+' Stone']));
add('shiny-stone',['Shiny Stone']);add('boost-stone',['Boost Stone']);add('ancient-stone',['Ancient Stone']);add('key-stone',['Mega Stone','Fragmento Mega Stone']);add('sparkling-stone',['PsyStone']);add('dawn-stone',['Dawn Stone']);add('moon-stone',['Moon Stone']);
[['Normal Stone','heart-stone'],['Fairy Stone','heart-stone'],['Fighting Stone','punch-stone'],['Poison Stone','venom-stone'],['Ground Stone','earth-stone'],['Flying Stone','feather-stone'],['Psychic Stone','enigma-stone'],['Bug Stone','cocoon-stone'],['Dragon Stone','crystal-stone'],['Ghost Stone','darkness-stone'],['Dark Stone','darkness-stone']].forEach(([n,s])=>add(s,[n]));
[['Normal','normal-gem'],['Fogo','fire-gem'],['Água','water-gem'],['Planta','grass-gem'],['Elétrica','electric-gem'],['Gelo','ice-gem'],['Lutador','fighting-gem'],['Veneno','poison-gem'],['Terra','ground-gem'],['Voador','flying-gem'],['Psíquica','psychic-gem'],['Inseto','bug-gem'],['Pedra','rock-gem'],['Fantasma','ghost-gem'],['Dragão','dragon-gem'],['Sombria','dark-gem'],['Metal','steel-gem'],['Fada','fairy-gem']].forEach(([n,s])=>add(s,['Essência '+n]));
const loot={'Rubber Ball':'poke-ball',Fur:'silk-scarf','Giant Piece Of Fur':'choice-band','Essence Of Fire':'heat-rock','Fire Tail':'red-card','Water Gem':'water-gem','Water Pendant':'sea-incense',Seed:'miracle-seed',Leaves:'big-root','Great Petal':'grassy-seed',Screw:'magnet','Electric Box':'cell-battery','Electric Rat Tail':'light-ball',Snowball:'snowball','Ice Orb':'icy-rock','Band Aid':'black-belt',Sandbag:'macho-brace','Belt Of Champion':'expert-belt','Belt of Champion':'expert-belt','Punch Machine':'lucky-punch','Bottle Of Poison':'toxic-orb','Bug Venom':'poison-barb','Earth Ball':'smooth-rock','Piece Of Diglett':'soft-sand',Straw:'pretty-wing',Feather:'pretty-wing','Giant Beak':'sharp-beak','Enchanted Gem':'psychic-gem','Future Orb':'psychic-seed','Psychic Spoon':'twisted-spoon','Bug Gosme':'sticky-barb','Bug Antenna':'silver-powder','Small Stone':'hard-stone','Strange Rock':'float-stone','Ghost Essence':'spell-tag','Bat Wing':'dusk-stone','Dragon Scale':'dragon-scale','Dragon Tooth':'dragon-fang','Dark Gem':'dark-gem','Dark Ear':'black-glasses','Piece Of Steel':'metal-coat','Metal Hull':'iron-ball','Point Of Light':'bright-powder','Cute Ball':'sweet-heart'};
Object.entries(loot).forEach(([n,s])=>add(s,[n]));
/* Rubber Ball e Earth Ball são materiais de craft. O nome termina em
   “Ball”, mas eles nunca podem entrar no seletor de captura. */
const craftMaterials=new Set(['Rubber Ball','Earth Ball']);
/* Itens de contrato cujo nome pode coincidir com categorias especiais.
   Small Stone é loot de PokéTibia/PXGames, não uma pedra de evolução. */
const contractItems=new Set(['Small Stone']);
const isContractItem=name=>contractItems.has(String(name||'').trim());
/* Exact PokeXGames loot sprites (official wiki image files). */
addRemote('https://wiki.pokexgames.com/images/8/81/Rubber_Ball.png',['Rubber Ball']);
addRemote('https://wiki.pokexgames.com/images/5/5c/FurMark.png',['Fur']);
addRemote('https://wiki.pokexgames.com/images/a/a8/Giant_Piece_Of_Fur.png',['Giant Piece Of Fur']);
addRemote('https://wiki.pokexgames.com/images/9/94/Essence_of_fire.png',['Essence Of Fire']);
addRemote('https://wiki.pokexgames.com/images/2/22/Fire_Tail.png',['Fire Tail']);
addRemote('https://wiki.pokexgames.com/images/c/c0/Water_gem.png',['Water Gem']);
addRemote('https://wiki.pokexgames.com/images/2/27/WaterPendant.png',['Water Pendant']);
addRemote('https://wiki.pokexgames.com/images/2/2e/Seed.png',['Seed']);
addRemote('https://wiki.pokexgames.com/images/f/f1/Leaves.png',['Leaves']);
addRemote('https://wiki.pokexgames.com/images/8/86/Great_Petal.png',['Great Petal']);
addRemote('https://wiki.pokexgames.com/images/5/59/Screw.png',['Screw']);
addRemote('https://wiki.pokexgames.com/images/6/6c/ElectricBox.png',['Electric Box']);
addRemote('https://wiki.pokexgames.com/images/d/d9/Electric_Rat_Tail.png',['Electric Rat Tail']);
addRemote('https://wiki.pokexgames.com/images/0/04/Snowball.png',['Snowball']);
addRemote('https://wiki.pokexgames.com/images/f/f6/IceOrb.png',['Ice Orb']);
addRemote('https://wiki.pokexgames.com/images/b/b9/Band_aids.png',['Band Aid']);
addRemote('https://wiki.pokexgames.com/images/5/52/SandbagMark.png',['Sandbag']);
addRemote('https://wiki.pokexgames.com/images/2/2e/Belt_Of_Champion.png',['Belt Of Champion']);
addRemote('https://wiki.pokexgames.com/images/2/2e/Belt_Of_Champion.png',['Belt of Champion']);
addRemote('https://wiki.pokexgames.com/images/2/26/Punch_Machine.png',['Punch Machine']);
addRemote('https://wiki.pokexgames.com/images/3/3b/Bottles_of_poison.png',['Bottle Of Poison']);
addRemote('https://wiki.pokexgames.com/images/5/56/Bug_Venom.png',['Bug Venom']);
addRemote('https://wiki.pokexgames.com/images/6/61/EarthBall.png',['Earth Ball']);
addRemote('https://wiki.pokexgames.com/images/2/2a/Piece_Of_Diglett.png',['Piece Of Diglett']);
addRemote('https://wiki.pokexgames.com/images/5/55/Straw.png',['Straw']);
addRemote('https://wiki.pokexgames.com/images/7/7f/FeatherMark.png',['Feather']);
addRemote('https://wiki.pokexgames.com/images/3/34/Giant-beak.png',['Giant Beak']);
addRemote('https://wiki.pokexgames.com/images/4/4c/EnchantedGem.png',['Enchanted Gem']);
addRemote('https://wiki.pokexgames.com/images/8/86/FutureooOrb.png',['Future Orb']);
addRemote('https://wiki.pokexgames.com/images/2/28/Psychic_Spoon.png',['Psychic Spoon']);
addRemote('https://wiki.pokexgames.com/images/e/e8/Bug_Gosme.png',['Bug Gosme']);
addRemote('https://wiki.pokexgames.com/images/1/1c/Bug_Antenna.png',['Bug Antenna']);
addRemote('https://wiki.pokexgames.com/images/c/c8/Small_stone.png',['Small Stone']);
addRemote('https://wiki.pokexgames.com/images/3/3b/Strange_Rock.png',['Strange Rock']);
addRemote('https://wiki.pokexgames.com/images/d/dd/GhostEssence.png',['Ghost Essence']);
addRemote('https://wiki.pokexgames.com/images/3/35/Bat_Wing.png',['Bat Wing']);
addRemote('https://wiki.pokexgames.com/images/5/58/DragonScale.png',['Dragon Scale']);
addRemote('https://wiki.pokexgames.com/images/9/9f/DragonTooth.png',['Dragon Tooth']);
addRemote('https://wiki.pokexgames.com/images/2/21/DarkGem.png',['Dark Gem']);
addRemote('https://wiki.pokexgames.com/images/8/84/Dark_Ear.png',['Dark Ear']);
addRemote('https://wiki.pokexgames.com/images/c/c1/PieceOfSteel.png',['Piece Of Steel']);
addRemote('https://wiki.pokexgames.com/images/c/c7/Metal_Hull.png',['Metal Hull']);
addRemote('https://wiki.pokexgames.com/images/9/9b/Point_of_Light.png',['Point Of Light']);
addRemote('https://wiki.pokexgames.com/images/6/68/Cute_Ball.png',['Cute Ball']);
add('amulet-coin',['Gold','Gold Coin','Moeda']);add('comet-shard',['Diamante','Diamond']);add('odd-keystone',['PsyCoin']);add('discount-coupon',['Cupom 30% OFF','Cupom']);add('star-piece',['Estrela','Stars']);add('parcel',['Presente','Gift']);
const packs={normal:'pack-normal',raro:'pack-rare',rare:'pack-rare','épico':'pack-epic',epico:'pack-epic',epic:'pack-epic',s:'pack-s',ss:'pack-ss',sss:'pack-sss',ur:'pack-ur','ur+':'pack-urp','ur++':'pack-urpp',neon:'pack-normal',prisma:'pack-epic',supreme:'pack-urpp'};
function slug(name){const raw=String(name||''),n=norm(raw);if(map[n])return map[n];if(/^tm\b/.test(n))return'tm-normal';if(n.includes('egg')||n.includes('ovo')){if(n.includes('shiny mega'))return'egg-shiny-mega';if(n.includes('shiny legendary')||n.includes('shiny lend'))return'egg-shiny-legendary';if(n.includes('legend'))return'egg-legendary';if(n.includes('mega'))return'egg-mega';if(n.includes('shiny'))return'egg-shiny';if(n.includes('boss'))return'egg-boss';return'mystery-egg'}if(n.includes('pack')){for(const [k,v] of Object.entries(packs))if(n.includes(k))return v;return'pack-normal'}return''}
const pxgBuild='PXG_V4_20260829_1725';
const remoteUrl=name=>{const u=remote[norm(name)]||'';return u?(u+(u.includes('?')?'&':'?')+'psy='+pxgBuild):''};
const localUrl=name=>{const s=slug(name);return s?ROOT+s+'.png':''};
const url=name=>remoteUrl(name)||localUrl(name);
function fallback(name,cls=''){const t=esc(String(name||'?').trim().slice(0,2).toUpperCase());return`<span class="psy-item-fallback ${esc(cls)}">${t}</span>`}
function html(name,alt=name,cls=''){const ru=remoteUrl(name),lu=localUrl(name),u=ru||lu;if(!u)return fallback(name,cls);const fb=`this.replaceWith(window.PSY_ITEMS.fallbackNode('${encodeURIComponent(String(name||''))}'))`;return`<img class="psy-item-sprite ${esc(cls)}" src="${u}" alt="${esc(alt)}" loading="eager" decoding="async" referrerpolicy="no-referrer" data-pxg-exact="${ru?'1':'0'}" onerror="${fb}">`}
const cache=new Map();function image(name){const u=url(name);if(!u)return null;if(!cache.has(u)){const im=new Image();im.src=u;cache.set(u,im)}return cache.get(u)}
function fallbackNode(encoded){const s=D.createElement('span');s.className='psy-item-fallback';s.textContent=decodeURIComponent(encoded||'').trim().slice(0,2).toUpperCase()||'?';return s}
const stoneType={
 'Fire Stone':'Fogo','Water Stone':'Água','Leaf Stone':'Planta','Thunder Stone':'Elétrico','Ice Stone':'Gelo',
 'Punch Stone':'Lutador','Fighting Stone':'Lutador','Venom Stone':'Veneno','Poison Stone':'Veneno','Earth Stone':'Terra','Ground Stone':'Terra',
 'Feather Stone':'Voador','Flying Stone':'Voador','Enigma Stone':'Psíquico','Psychic Stone':'Psíquico','Cocoon Stone':'Inseto','Bug Stone':'Inseto',
 'Rock Stone':'Pedra','Crystal Stone':'Dragão / Fada','Dragon Stone':'Dragão','Darkness Stone':'Fantasma / Sombrio','Ghost Stone':'Fantasma','Dark Stone':'Sombrio',
 'Metal Stone':'Metal','Heart Stone':'Normal / Fada','Normal Stone':'Normal','Fairy Stone':'Fada','Shiny Stone':'Evolução Shiny','Boost Stone':'Boost','PsyStone':'Ascensão'
};
function category(name){const n=String(name||'');if(craftMaterials.has(n)||/^Essência /i.test(n))return'craft';if(isContractItem(n)||Object.prototype.hasOwnProperty.call(loot,n))return'quest';if(n==='Revive')return'potion';if(n==='Pedra de Ascensão')return'craft';if(/Ball$/i.test(n)||/Pok[eé]ball/i.test(n))return'ball';if(/Poção/i.test(n))return'potion';if(/Stone|PsyStone/i.test(n))return'stone';if(/Egg|Ovo/i.test(n))return'egg';if(/Pack/i.test(n))return'pack';if(/^TM\b/i.test(n))return'tm';if(/Gold|Coin|Diamante|Diamond|Cupom|Estrela|Stars|Presente|Gift/i.test(n))return'currency';return'item'}
function label(name){return({ball:'BALL',potion:'CURA',stone:'STONE',craft:'CRAFT',quest:'QUEST',egg:'EGG',pack:'PACK',tm:'TM',currency:'RECOMPENSA',item:'ITEM'})[category(name)]}
function detail(name){const n=String(name||'');if(isContractItem(n)||Object.prototype.hasOwnProperty.call(loot,n))return'Item de contrato';if(stoneType[n])return stoneType[n];if(/^Essência /i.test(n))return'Material de Ball elemental';if(n==='Revive')return'Revive 50% HP • usado em batalha';if(n==='Pedra de Ascensão')return'Ascensão de equipamentos • 2% base na Aventura + Drop/raridade';if(/Ball$/i.test(n)||/Pok[eé]ball/i.test(n))return'Item de captura';if(/Poção/i.test(n))return'Item de cura';if(/Pack/i.test(n))return'Pack de figurinhas';if(/Egg|Ovo/i.test(n))return'Ovo Pokémon';return'Item especial'}
const legacyNames={'Fighting Stone':'Punch Stone','Poison Stone':'Venom Stone','Ground Stone':'Earth Stone','Flying Stone':'Feather Stone','Psychic Stone':'Enigma Stone','Bug Stone':'Cocoon Stone','Dragon Stone':'Crystal Stone','Normal Stone':'Heart Stone','Fairy Stone':'Heart Stone','Ghost Stone':'Darkness Stone','Dark Stone':'Darkness Stone','Fur':'Rubber Ball','Leaves':'Seed','Electric Box':'Screw','Sandbag':'Band Aid','Feather':'Straw','Future Orb':'Enchanted Gem','Point Of Light':'Rubber Ball'};
function migrateInventory(){const inv=W.P?.inventory;if(!inv)return false;let changed=false;for(const [oldName,newName] of Object.entries(legacyNames)){const q=Number(inv[oldName]||0);if(q){inv[newName]=Number(inv[newName]||0)+q;changed=true}if(Object.prototype.hasOwnProperty.call(inv,oldName)){delete inv[oldName];changed=true}}return changed}
W.PSY_ITEMS={slug,url,remoteUrl,localUrl,html,image,fallback,fallbackNode,map,remote,category,label,detail,stoneType,contractItems,isContractItem,legacyNames,migrateInventory};
console.log('✅ PSYWORLD loot sprites PXG_V4_20260829_1725 carregados');
W.psyV11ItemIconUrl=url;W.psyV11ItemIcon=(n,a)=>html(n,a);W.v12ItemIcon=n=>html(n);W.v12ShopIcon=n=>html(n);
const st=D.createElement('style');st.textContent='.psy-item-sprite{width:48px;height:48px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;filter:drop-shadow(0 3px 3px #000a) drop-shadow(0 0 8px currentColor)}.psy-item-fallback{width:44px;height:44px;display:inline-grid;place-items:center;border-radius:10px;background:linear-gradient(145deg,#334155,#0f172a);border:1px solid #94a3b8;color:#fff;font:900 10px system-ui;vertical-align:middle}.psy-surv-pause-history-list>span{display:grid!important;grid-template-columns:34px 1fr auto;align-items:center;gap:7px}.psy-surv-drop-icon{width:30px!important;height:30px!important;grid-row:1/3}.psy-surv-pause-history-list>span small{grid-column:2/4}';D.head.appendChild(st);
})(window,document);
