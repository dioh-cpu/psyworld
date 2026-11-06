const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('core/essential-tutorial-v56.js','utf8');
const roster=fs.readFileSync('core/battle-roster-integrity-v31.js','utf8');
function rig({dead=true,heal}={}){
 const mon={name:'Quaxly',hp:dead?0:100,maxHp:100,currentHp:dead?0:100,fainted:dead,_psyFaintedV31:dead};
 const p={team:[mon],playerCharacterId:'adventure_boy',meta:{essentialGuideV56:{step:3,done:false}}};
 let opened=false,guide,selected=null,launches=0;const clicks=[];
 const el={getClientRects:()=>[{}],scrollIntoView(){},click(){launches++;}};
 const nodes={'game-wrap':el,'psy-follower-launch':el};
 const D={body:{classList:{contains:()=>false}},getElementById:id=>nodes[id]||null,querySelector:()=>el,addEventListener:(type,fn)=>{if(type==='click')clicks.push(fn);}};
 const W={P:p,autoSave(){},notif(){},toggleCityGameContent(){},PsyFollower:{selected:()=>selected},PsyGuide:{show(g){guide=g;opened=true;},close(){opened=false;},isOpen:()=>opened},setInterval(){},setTimeout(fn){fn();}};
 let healer=()=>{mon.hp=mon.maxHp;};
 const guard={P0:()=>p,currentFn:name=>name==='curarTimeCity'?healer:name==='calcDetailedStats'?()=>({finalHp:100}):null,assignFn:(_,fn)=>{healer=fn;},clearFainted(m){delete m._psyFaintedV31;delete m._psyFaintedAtV31;},sync(){},D:{querySelector:()=>null}};
 vm.runInNewContext(roster.slice(roster.indexOf('function installHealGuard(){'),roster.indexOf('\nfunction installReviveGuard(){'))+';installHealGuard();',guard);
 W.curarTimeCity=heal?()=>heal(p,healer):()=>healer();
 vm.runInNewContext(source,{window:W,document:D,P:p,location:{pathname:'/'},getComputedStyle:()=>({display:'block'})});
 return {p,mon,W,resume:()=>W.PsyEssentialGuide.resume(),guide:()=>guide,opened:()=>opened,launches:()=>launches,async action(){opened=false;await guide.actions[0].run();},confirm(){selected=mon;p.meta.followerV47={enabled:true};clicks.forEach(fn=>fn({target:{closest:()=>({textContent:'Confirmar acompanhante'})}}));},heal:()=>healer()};
}
(async()=>{
 // Actual menu heal must release an already-open recovery guide.
 const a=rig();a.resume();assert.match(a.guide().speaker,/Cuide da equipe/);a.heal();a.resume();assert.equal(a.launches(),1);assert(!a.opened());assert.equal(a.mon.hp,100);assert.equal(a.mon.currentHp,100);assert.equal(a.mon.fainted,false);assert(!a.mon._psyFaintedV31);assert(!a.p.meta.essentialGuideV56.done);
 a.confirm();assert(a.p.meta.essentialGuideV56.done,'only actual companion confirmation completes the guide');
 // The recovery guide's own button follows the same path.
 const b=rig();b.resume();await b.action();assert.equal(b.launches(),1);assert(!b.opened());
 // No premature step advance while an asynchronous heal is pending.
 let finish;const c=rig({heal:(_,real)=>new Promise(resolve=>{finish=()=>{real();resolve();};})});c.resume();const pending=c.action();c.resume();assert(!c.opened());finish();await pending;assert.equal(c.launches(),1);
 const invalid=rig();invalid.mon.maxHp=NaN;invalid.mon.hp=NaN;invalid.resume();await invalid.action();assert.equal(invalid.mon.hp,100);assert.equal(invalid.mon.maxHp,100);assert.equal(invalid.launches(),1,'invalid saved HP is rebuilt using current stats');
 const failed=rig({heal:()=>Promise.reject(new Error('unavailable'))});failed.resume();await failed.action();assert.equal(failed.mon.hp,0);assert.match(failed.guide().speaker,/Cuide da equipe/);assert(!failed.p.meta.essentialGuideV56.done);
 const fresh=rig({dead:false});fresh.resume();assert.match(fresh.guide().speaker,/4\/4/,'healthy starters do not need recovery');
 console.log('PASS V59: menu and guide heals resume companion selection; faint flags/currentHp agree; async healing waits; failure retries; only real companion confirmation completes tutorial.');
})().catch(e=>{console.error(e);process.exitCode=1;});
