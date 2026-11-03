/* PSYWORLD — Kanto walkable campaign graph V4; extends the existing atlas. */
(function (W) {
  'use strict';
  const api = W.PsyKantoJourneyV1;
  if (!api || api.__campaignGraphV4) return;
  const LINKS = Object.freeze([
    {a:'pallet',b:'route-1',at:[16,4],entry:[16,30],gateA:false},
    {a:'route-1',b:'viridian',at:[17,1],entry:[16,29],gateA:false},
    {a:'viridian',b:'route-2',at:[16,1],entry:[16,30],gateA:true},
    {a:'route-2',b:'viridian-forest',at:[16,1],entry:[16,30],gateA:true},
    {a:'viridian-forest',b:'pewter',at:[16,1],entry:[16,30],gateA:true},
    {a:'pewter',b:'route-3',at:[16,0],entry:[16,30],gateA:true},
    {a:'route-3',b:'mt-moon',at:[17,1],entry:[16,30],gateA:true},
    {a:'mt-moon',b:'route-4',at:[16,1],entry:[16,30],gateA:true},
    {a:'route-4',b:'cerulean',at:[17,1],entry:[16,4],gateA:true},
    {a:'cerulean',b:'route-24-25',at:[16,0],entry:[16,30],gateA:false},
    {a:'cerulean',b:'route-5-6',at:[16,31],entry:[16,30],gateA:true},
    {a:'route-5-6',b:'vermilion',at:[16,1],entry:[16,1],gateA:true}
  ]);
  const req = {
    pallet:[[],[]], 'route-1':[['pallet'],[]], viridian:[['route-1'],['route-1']],
    'route-2':[['viridian'],['viridian']], 'viridian-forest':[['route-2'],['route-2']],
    pewter:[['viridian-forest'],['viridian-forest']], 'route-3':[['pewter'],['pewter']],
    'mt-moon':[['route-3'],['route-3']], 'route-4':[['mt-moon'],['mt-moon']],
    cerulean:[['route-4'],['route-4']], 'route-24-25':[['cerulean'],[]],
    'route-5-6':[['cerulean'],['cerulean']], vermilion:[['route-5-6'],['route-5-6']]
  };
  for (const place of api.places || []) {
    const value = req[place.id];
    if (value) { place.requiresVisited=value[0].slice(); place.requiresCleared=value[1].slice(); }
  }
  api.connectionsFor = function (id) {
    return LINKS.flatMap(link => {
      if (link.a===id) return [{to:link.b,at:link.at,entry:link.entry,gate:!!link.gateA}];
      if (link.b===id) return [{to:link.a,at:link.entry,entry:link.at,gate:!!link.gateB}];
      return [];
    });
  };
  Object.defineProperty(api,'__campaignGraphV4',{value:true});
})(window);
