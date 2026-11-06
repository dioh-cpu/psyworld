const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('core/module-loader.js','utf8'),index=fs.readFileSync('index.html','utf8');
const button={dataset:{},textContent:'🃏 CARDS',closest:()=>null,getAttribute:()=>"openCardMode()",remove(){throw Error('Cards must remain accessible');}};
const grid={innerHTML:''},ctx={D:{querySelectorAll:()=>[button],getElementById:()=>grid},installed:()=>false,ensureUI(){}};
vm.createContext(ctx);vm.runInContext(src.slice(src.indexOf('const MODES={'),src.indexOf('const PACKAGES='))+src.slice(src.indexOf('function modeFromButton('),src.indexOf('\nfunction ensureUI('))+src.slice(src.indexOf('function renderManager('),src.indexOf('\nW.psyOpenModeManager='))+';decorateButtons();renderManager();',ctx);
assert.equal(button.dataset.psyModule,'cards');assert.match(button.title,/CARDS/);assert.match(grid.innerHTML,/data-mode-card="cards"/);assert.match(index,/id="btn-card-float"[^>]*openCardMode/);assert.equal((index.match(/onclick="openCardMode\(\)"/g)||[]).length,2);
console.log('PASS Cards: normal menu/content entry restored; lazy module catalogue and decoration retain Cards.');
