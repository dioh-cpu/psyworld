const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.parentElement=null;this.dataset={};this.attributes={};this.className='';this.textContent='';this.style={};}
 appendChild(child){child.parentElement=this;this.children.push(child);return child}
 append(...children){children.forEach(child=>this.appendChild(child))}
 replaceChildren(...children){this.children.forEach(child=>child.parentElement=null);this.children=[];this.append(...children)}
 setAttribute(key,value){this.attributes[key]=String(value)}
 addEventListener(type,fn){this['on'+type]=fn}
 focus(){this.focused=true}
 remove(){if(!this.parentElement)return;this.parentElement.children=this.parentElement.children.filter(child=>child!==this);this.parentElement=null}
 querySelector(selector){if(selector==='[data-vip-close]')return find(this,node=>node.dataset.vipClose==='1');return null}
}
function find(root,predicate){if(predicate(root))return root;for(const child of root.children||[]){const found=find(child,predicate);if(found)return found}return null}
function text(root){return [root.textContent,...(root.children||[]).map(text)].filter(Boolean).join(' ')}

const source=fs.readFileSync(require('node:path').join(__dirname,'../core/campaign-automation-v1.js'),'utf8');
const body=new Element('body'),head=new Element('head'),intervals=[];let survivorOpens=0,worldCloses=0,notes=[],opened=[];
const gameWrap=new Element('div');gameWrap.id='game-wrap';gameWrap.style.display='block';body.appendChild(gameWrap);
const document={body,head,createElement:tag=>new Element(tag),getElementById:id=>find(body,node=>node.id===id)||find(head,node=>node.id===id),querySelector:()=>null,addEventListener(){},visibilityState:'hidden'};
const player={team:[{hp:10}],inventory:{},meta:{}};
const window={PsyKantoWorldV2:{isOpen:()=>true,close:()=>worldCloses++},openPsyduckDungeon5:()=>survivorOpens++,open:(...args)=>opened.push(args),notif:(message)=>notes.push(message),setInterval:fn=>intervals.push(fn),getComputedStyle:()=>({display:'block'}),autoSave(){}};
vm.runInNewContext(source,{window,document,P:player,Date,Math,Number,Object,Array,String,Set,Map,Promise,performance:{now:()=>0},getComputedStyle:()=>({display:'block'})});
const automation=window.PsyCampaignAutomation;
intervals[0]();
const tools=find(body,node=>node.id==='psy-campaign-tools');
assert.ok(tools,'campaign automation control exists');
const hunt=tools.children[0];
hunt.onclick();
let gate=document.getElementById('psy-vip-gate');
assert.ok(gate,'non-VIP Auto Hunt opens the friendly guide');
assert.match(text(gate),/Opa! Parece que você ainda não tem VIP/);
assert.match(text(gate),/PsyCoins/);
assert.match(text(gate),/participando de eventos/);
assert.match(text(gate),/apoiando o servidor/);
assert.equal(automation.huntActive(),false,'VIP gate does not start automation');
assert.equal(document.getElementById('psy-auto-config'),null,'VIP gate cannot open automation configuration');
const actions=find(gate,node=>node.className==='psy-vip-gate-actions');
assert.deepEqual(actions.children.map(node=>node.textContent),['🦆 SURVIVOR','✦ APOIAR O SERVIDOR']);
actions.children[0].onclick();
assert.equal(survivorOpens,1,'Survivor shortcut invokes the existing game entry');
assert.equal(worldCloses,1,'campaign map closes before switching into Survivor');
assert.equal(document.getElementById('psy-vip-gate'),null);

hunt.onclick();gate=document.getElementById('psy-vip-gate');
find(gate,node=>node.className==='psy-vip-gate-actions').children[1].onclick();
assert.equal(opened.length,0,'no unofficial donation destination is invented');
assert.match(notes.at(-1),/canal oficial de apoio ainda não está disponível/);
assert.match(find(gate,node=>node.className==='psy-vip-gate-foot').textContent,/canal oficial de apoio ainda não está disponível/,'missing official link is explained visibly in the gate');
window.PSYWORLD_SUPPORT_URL='https://apoio.psyworld.example/';
find(gate,node=>node.className==='psy-vip-gate-actions').children[1].onclick();
assert.deepEqual(opened,[['https://apoio.psyworld.example/','_blank','noopener,noreferrer']]);
assert.equal(document.getElementById('psy-vip-gate'),null,'configured official support link closes the gate');

player.meta.vipUntil=Date.now()+60_000;
assert.equal(automation.vipActive(),true,'VIP status remains driven by the current expiry');
assert.equal(automation.setAutoBattle(true),true,'existing VIP profiles retain automation access');
assert.equal(document.getElementById('psy-vip-gate'),null,'VIP profiles do not get a non-VIP interruption');
console.log('PASS campaign VIP gate: blocks non-VIP automation, opens Survivor, accepts only configured HTTPS support URLs, preserves VIP expiry checks.');
