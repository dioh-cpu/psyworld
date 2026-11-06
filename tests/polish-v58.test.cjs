const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const main={trainerLevel:1,gold:10000,team:[{id:912,hp:100}],meta:{}},w={P:main},d={readyState:'loading',addEventListener(){},querySelectorAll:()=>[]};
vm.runInNewContext(fs.readFileSync('core/professions-v1.js','utf8'),{window:w,document:d,setInterval(){},console});
assert.equal(w.PsyProfessions.choose('engineer','Mecânico','main'),false,'Lv1 cannot select a profession');assert.equal(main.gold,10000);
main.trainerLevel=2;assert.equal(w.PsyProfessions.choose('engineer','Mecânico','main'),true,'Lv2 can select a profession');assert.equal(main.gold,10000,'first choice remains free');
assert.equal(w.PsyProfessions.bonus('main','atk'),3,'Engineer passive is separate from specialization');
const effects=w.PsyProfessions.bonus('main','drop');assert(effects>0);assert.equal(w.PsyProfessions.choose('engineer','Fundidor','main'),true);assert.equal(main.gold,9000,'changing specialization retains its cost');
const iw={};vm.runInNewContext(fs.readFileSync('core/items.js','utf8'),{window:iw,document:{createElement:()=>({}),head:{appendChild(){}}},console,Image:class{}});
for(const n of ['Rubber Ball','Giant Piece Of Fur','Essence Of Fire','Fire Tail','Water Gem','Water Pendant','Seed','Screw','Small Stone']){const u=iw.PSY_ITEMS.url(n);assert(u.startsWith('assets/items/'),n+' uses a local image');assert(fs.existsSync(u),u);assert(iw.PSY_ITEMS.html(n).includes('src="'+u+'"'));}
assert.equal(iw.PSY_ITEMS.category('Rubber Ball'),'craft');assert.equal(iw.PSY_ITEMS.category('Small Stone'),'quest');
// Execute the actual camera portion of render over portrait/landscape/DPR and map edges.
const src=fs.readFileSync('core/kanto-campaign-playable-v1.js','utf8'),camera=src.slice(src.indexOf('const scale=Math.max(cw/'),src.indexOf('c.drawImage(terrainPaint()'));
for(const [cw,ch] of [[390,650],[720,1200],[1363,760],[844,390]])for(const x of [1,16,30])for(const y of [1,10,18]){
 const transforms=[],ctx={cw,ch,COLS:32,ROWS:20,TILE:28,model:{x,y},c:{save(){},translate(...v){transforms.push(v)},scale(){}}};vm.runInNewContext(camera,ctx);const {scale,ox,oy}=ctx.model.camera;
 assert(ox<=0&&oy<=0);assert(ox+896*scale>=cw-.001);assert(oy+560*scale>=ch-.001);
 const sx=ox+(x+.5)*28*scale,sy=oy+(y+.5)*28*scale;assert(sx>=0&&sx<=cw);assert(sy>=0&&sy<=ch);
 const wx=(sx-ox)/scale,wy=(sy-oy)/scale;assert(Math.abs(wx-(x+.5)*28)<1e-6&&Math.abs(wy-(y+.5)*28)<1e-6,'tap projection round trips');
}
const legacy=fs.readFileSync('core/legacy-runtime.js','utf8');assert(!legacy.includes('Card ativo (somente modo Cards)'));
new vm.Script(legacy);console.log('PASS V58: Lv1/2 profession gate and switching cost, nine real local loot sprites, 36 viewport/edge camera transforms and taps, classic runtime syntax, removed retired card detail.');
