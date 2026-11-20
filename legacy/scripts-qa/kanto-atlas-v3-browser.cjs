// Playwright QA and real Atlas recording. Usage: node scripts/qa/kanto-atlas-v3-browser.cjs [ORIGIN] [OUTPUT]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

const origin = process.argv[2] || 'http://127.0.0.1:8768';
const output = path.resolve(process.argv[3] || '/tmp/psyworld-kanto-atlas-v3');
fs.mkdirSync(output, {recursive:true});

async function seed(context) {
  await context.addInitScript(() => {
    localStorage.setItem('psy_kanto_world_v2_quests', JSON.stringify({oak:true}));
    localStorage.setItem('psy_kanto_journey_progress_v1', JSON.stringify({
      visited:['pallet'],
      'route-1':[16,19,21]
    }));
  });
}

async function openAtlas(page) {
  await page.goto(origin, {waitUntil:'domcontentloaded', timeout:60000});
  await page.waitForFunction(() => typeof window.openKantoJourneyV1 === 'function', null, {timeout:30000});
  await page.evaluate(() => {
    if (typeof P !== 'undefined') {
      P.name='Kai';P.team=[{id:16,name:'Pidgey',hp:10,maxHp:10,level:3}];
      P.seenPokemon=[];P.gymsDefeated=0;P.inventory={};P.meta={};
    }
    window.openKantoJourneyV1();
  });
  await page.waitForTimeout(200);
  const state = await page.evaluate(() => ({atlas:document.querySelector('#psy-kanto-atlas')?.className||null, journey:typeof window.PsyKantoJourneyV1, open:typeof window.openKantoJourneyV1, title:document.title}));
  assert.match(state.atlas||'',/open/,`Atlas opened: ${JSON.stringify(state)}`);
  await page.waitForTimeout(350);
}

async function finishCampaignDialogue(page) {
  let clicks=0;
  while (await page.locator('#psy-kanto-story').count()) {
    const next=page.locator('#psy-kanto-story .ks49-actions button').first();
    assert.ok(await next.count(),'campaign dialogue provides a real continuation action');
    await next.click();
    clicks++;
    await page.waitForTimeout(75);
    assert.ok(clicks<20,'campaign dialogue completes through its authored beats');
  }
  return clicks;
}

(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const pageErrors = [];
  const result = {origin,baseProfile:'disposable browser context',desktop:{},mobilePortrait:{},mobileLandscape:{}};
  let desktopVideo;
  try {
    const comparison=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
    await seed(comparison);
    const comparisonPage=await comparison.newPage();
    comparisonPage.on('pageerror',error=>pageErrors.push(String(error)));
    await openAtlas(comparisonPage);
    await comparisonPage.screenshot({path:path.join(output,'atlas-v3-desktop-compare.png')});
    result.desktopComparison={width:1440,height:1000,selection:await comparisonPage.locator('.psy-kanto-detail').getAttribute('data-place-id')};
    await comparison.close();

    const videoDir = path.join(output,'recording');
    fs.mkdirSync(videoDir,{recursive:true});
    const context = await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:videoDir,size:{width:1440,height:900}}});
    await seed(context);
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(String(error)));
    await openAtlas(page);
    const initial = await page.evaluate(() => ({
      count:document.querySelectorAll('.psy-kanto-node').length,
      goal:document.querySelector('.psy-kanto-map')?.dataset.goalId,
      selected:document.querySelector('.psy-kanto-detail')?.dataset.placeId,
      aspect:(()=>{const r=document.querySelector('.psy-kanto-map-world').getBoundingClientRect();return +(r.width/r.height).toFixed(2)})(),
      highlightedRouteLinks:document.querySelectorAll('.psy-kanto-link.goal').length,
      frameLoaded:document.querySelector('.psy-kanto-map-compass')?.naturalWidth===96
    }));
    assert.equal(initial.count,38);
    assert.equal(initial.goal,'route-1');
    assert.equal(initial.selected,'route-1');
    assert.equal(initial.aspect,1.5);
    assert.equal(initial.highlightedRouteLinks,1,'route highlight follows the real Pallet → Route 1 path, not every edge touching the goal');
    assert.equal(initial.frameLoaded,true);
    await page.screenshot({path:path.join(output,'atlas-v3-desktop-route1.png')});

    await page.locator('[data-place="viridian"]').click();
    assert.equal(await page.locator('.psy-kanto-detail').getAttribute('data-place-id'),'viridian');
    await page.screenshot({path:path.join(output,'atlas-v3-desktop-viridian.png')});

    await page.locator('[data-place="route-1"]').click();
    await page.getByRole('tab',{name:/Habitats/}).click();
    const firstHabitat = page.locator('.psy-kanto-hunt-card:not([disabled])').first();
    assert.ok(await firstHabitat.count(),'Route 1 offers an available habitat');
    await firstHabitat.click();
    assert.match(await page.locator('.psy-kanto-detail').getAttribute('data-place-id'),/route-1/);
    const huntId = await page.evaluate(() => P?.activeKantoHunt||null);
    assert.ok(huntId,'selecting a habitat stores the real campaign hunt selection');
    await page.getByRole('tab',{name:/Jornada/}).click();

    await page.getByRole('button',{name:'Aumentar zoom'}).click();
    const zoomMode = await page.locator('.psy-kanto-map').getAttribute('data-label-mode');
    assert.equal(zoomMode,'regional','one zoom step reveals city names');
    await page.screenshot({path:path.join(output,'atlas-v3-desktop-zoom.png')});
    await page.getByRole('button',{name:'Centralizar mapa'}).click();
    await page.getByRole('button',{name:/SEGUIR OBJETIVO/}).click();
    await page.waitForTimeout(350);
    const dialogueClicks=await finishCampaignDialogue(page);
    await page.waitForFunction(()=>window.PsyKantoWorldV2.progress().viridian===true,{},{timeout:20000});
    const routed = await page.evaluate(() => ({
      worldOpen:!!window.PsyKantoWorldV2?.isOpen?.(),
      pos:window.PsyKantoWorldV2?.getPosition?.()||null,
      navState:document.querySelector('#psy-kanto-world-v2')?.dataset.navigationState||null,
      viridian:window.PsyKantoWorldV2?.progress?.()?.viridian===true,
      dialogue:document.body.innerText.includes('Você atravessou a Rota 1'),
      controller:typeof window.PsyCampaignAutomation?.startPrimaryRoute
    }));
    assert.equal(routed.worldOpen,true,'real route controller opens the campaign map');
    assert.equal(routed.controller,'function','Atlas uses production Auto Route controller');
    assert.equal(routed.pos?.world,'route-1','first real mission routes to Route 1');
    assert.equal(routed.viridian,true,'real Auto Route activates the Route 1 exit objective');
    assert.equal(routed.dialogue,true,'reaching the goal starts its real campaign dialogue');
    assert.ok(dialogueClicks>0,'Auto Route preserves and presents the authored arrival dialogue');
    assert.equal(routed.navState,'following','real Auto Route finds a collision-valid path');
    assert.ok(Math.hypot(routed.pos.x-108,routed.pos.y-409)>1,`trainer begins walking instead of teleporting: ${JSON.stringify({dialogueClicks,routed,storyOpen:await page.locator('#psy-kanto-story').count(),world:await page.locator('#psy-kanto-world-v2').evaluate(el=>({position:el.dataset.worldPosition,pathLength:el.dataset.pathLength,suspended:el.dataset.suspended}))})}`);
    result.desktop={...initial,selectedHabitat:huntId,zoomMode,dialogueClicks,autoRoute:routed};
    await page.screenshot({path:path.join(output,'atlas-v3-auto-route-start.png')});
    await page.waitForTimeout(600);
    await page.evaluate(() => window.PsyCampaignAutomation?.stop?.());
    desktopVideo = page.video();
    await context.close();
    result.desktopVideo=path.resolve(await desktopVideo.path());

    const inWorld=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
    await seed(inWorld);
    const routePage=await inWorld.newPage();
    routePage.on('pageerror',error=>pageErrors.push(String(error)));
    await routePage.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
    await routePage.waitForFunction(()=>window.PsyKantoWorldV2&&window.PsyCampaignAutomation&&typeof P!=='undefined',{},{timeout:30000});
    await routePage.evaluate(()=>{P.name='Kai';P.team=[{id:16,name:'Pidgey',hp:10,maxHp:10,level:3}];P.seenPokemon=[];P.gymsDefeated=0;P.inventory={};P.meta={};window.PsyKantoWorldV2.open('route-1',{spawn:[850,135]});});
    await routePage.waitForTimeout(300);
    await finishCampaignDialogue(routePage);
    const atlasEntry=routePage.locator('#psy-kanto-world-v2 [data-atlas]');
    assert.ok(await atlasEntry.count(),'campaign map provides its real Atlas entry button');
    await atlasEntry.click();
    await routePage.waitForSelector('#psy-kanto-atlas.open .psy-kanto-sheet',{timeout:10000});
    const beforeWorldAtlas=await routePage.evaluate(()=>({open:window.PsyKantoWorldV2.isOpen(),pos:window.PsyKantoWorldV2.getPosition()}));
    assert.equal(beforeWorldAtlas.open,false,'the in-world Atlas closes the map without losing its position');
    await routePage.getByRole('button',{name:/SEGUIR OBJETIVO/}).click();
    await routePage.waitForFunction(()=>window.PsyKantoWorldV2.isOpen()&&Math.hypot(window.PsyKantoWorldV2.getPosition().x-850,window.PsyKantoWorldV2.getPosition().y-135)>3,{},{timeout:10000});
    await routePage.waitForFunction(()=>window.PsyKantoWorldV2.progress().viridian===true,{},{timeout:10000});
    const arrived=await routePage.evaluate(()=>({pos:window.PsyKantoWorldV2.getPosition(),viridian:window.PsyKantoWorldV2.progress().viridian,dialog:[...document.querySelectorAll('[role="dialog"]')].map(el=>el.innerText).join(' ')}));
    assert.equal(arrived.viridian,true,'Auto Route reaches and activates the actual Route 1 exit');
    assert.match(arrived.dialog,/Você atravessou a Rota 1/,'the destination action starts its real campaign dialogue');
    result.autoRouteFromWorldAtlas={before:beforeWorldAtlas,after:arrived};
    await routePage.screenshot({path:path.join(output,'atlas-v3-auto-route-arrival.png')});
    await inWorld.close();

    for (const [key,viewport] of [
      ['mobilePortrait',{width:390,height:844}],
      ['mobileLandscape',{width:844,height:390}]
    ]) {
      const mobile = await browser.newContext({viewport,deviceScaleFactor:1,isMobile:true,hasTouch:true});
      await seed(mobile);
      const mobilePage = await mobile.newPage();
      mobilePage.on('pageerror', error => pageErrors.push(String(error)));
      await openAtlas(mobilePage);
      const state = await mobilePage.evaluate(() => {
        const map=document.querySelector('.psy-kanto-map'),detail=document.querySelector('.psy-kanto-detail'),sheet=document.querySelector('.psy-kanto-sheet');
        const progress=document.querySelector('.psy-kanto-progress');
        return {nodes:document.querySelectorAll('.psy-kanto-node').length,goal:map.dataset.goalId,aspect:+(map.querySelector('.psy-kanto-map-world').getBoundingClientRect().width/map.querySelector('.psy-kanto-map-world').getBoundingClientRect().height).toFixed(2),sheet:{width:sheet.clientWidth,height:sheet.clientHeight},progress:{width:progress.clientWidth,scrollWidth:progress.scrollWidth},detail:{width:detail.clientWidth,height:detail.clientHeight,scrollHeight:detail.scrollHeight},irVisible:!!document.querySelector('.psy-kanto-follow-goal')};
      });
      assert.equal(state.nodes,38);
      assert.equal(state.goal,'route-1');
      assert.equal(state.aspect,1.5);
      assert.ok(state.progress.scrollWidth<=state.progress.width+2,'mobile campaign stats fit without hidden horizontal overflow');
      await mobilePage.locator('[data-place="viridian"]').tap();
      assert.equal(await mobilePage.locator('.psy-kanto-detail').getAttribute('data-place-id'),'viridian','touch selects a city');
      await mobilePage.locator('[data-place="route-1"]').tap();
      await mobilePage.screenshot({path:path.join(output,`atlas-v3-${key}-route1.png`)});
      const enterButton=mobilePage.locator('.psy-kanto-enter-world');
      await enterButton.scrollIntoViewIfNeeded();
      const enterGeometry=await enterButton.evaluate(button=>{
        const body=button.closest('.psy-kanto-detail-body'),rect=button.getBoundingClientRect(),parent=body.getBoundingClientRect();
        return {scrollTop:body.scrollTop,top:rect.top,bottom:rect.bottom,parentTop:parent.top,parentBottom:parent.bottom};
      });
      assert.ok(enterGeometry.scrollTop>0,'mobile detail panel scrolls to the locality action');
      assert.ok(enterGeometry.top>=enterGeometry.parentTop-1.5&&enterGeometry.bottom<=enterGeometry.parentBottom+1.5,
        `mobile locality action becomes fully visible after scrolling: ${JSON.stringify(enterGeometry)}`);
      await mobilePage.screenshot({path:path.join(output,`atlas-v3-${key}-route1-actions.png`)});
      result[key]={...state,touchSelection:'viridian and route-1',enterActionAfterScroll:enterGeometry};
      await mobile.close();
    }
    assert.deepEqual(pageErrors,[],'Atlas browser run has no uncaught JavaScript exceptions');
    fs.writeFileSync(path.join(output,'atlas-v3-browser-report.json'),JSON.stringify({...result,pageErrors},null,2));
    console.log(JSON.stringify({...result,pageErrors},null,2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
