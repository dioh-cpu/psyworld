const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('core/kanto-city-cinematics-v1.js','utf8');
const legacy=fs.readFileSync('core/legacy-runtime.js','utf8');
const html=fs.readFileSync('index.html','utf8');
assert(legacy.includes('window.renderTutorial=function()'));
assert(legacy.includes('onclick="tutorialNext()"'));
assert(html.includes('kanto-city-cinematics-v1.js?build=TUTORIAL_BLANK_SCREEN_FIX_V68_20261107'));
let oldClosed=0,guideOpened=0;
const screen={style:{display:'none'}};
const oldRender=()=>{},oldNext=()=>{},oldPrev=()=>{},oldClose=()=>{oldClosed++;screen.style.display='none'};
const W={renderTutorial:oldRender,tutorialNext:oldNext,tutorialPrev:oldPrev,closeTutorial:oldClose,
  addEventListener:()=>{},removeEventListener:()=>{},requestAnimationFrame:()=>0,
  PsyGuide:{tutorial:()=>{guideOpened++},close:()=>{}},toggleCityGameContent:()=>{}};
const D={getElementById:id=>id==='screen-psy-tutorial'?screen:null,head:{appendChild:()=>{}},
 createElement:()=>({style:{},id:'',innerHTML:'',textContent:''})};
vm.runInNewContext(src,{window:W,document:D,console,P:{team:[],meta:{}}});
assert.strictEqual(W.renderTutorial,oldRender);
assert.strictEqual(W.tutorialNext,oldNext);
assert.strictEqual(W.tutorialPrev,oldPrev);
assert.equal(typeof W.psyKantoRenderTutorial,'function');
screen.style.display='block';W.closeTutorial();
assert.equal(screen.style.display,'none');assert.equal(oldClosed,1);
screen.style.display='block';W.openTutorial();
assert.equal(screen.style.display,'none');assert.equal(guideOpened,1);
console.log('PASS: tutorial startup collision fixed and legacy navigation intact');