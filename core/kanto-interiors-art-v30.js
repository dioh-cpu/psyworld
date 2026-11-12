/* Six illustrated playable interiors; geometry follows their furniture footprints. */
(function(W){'use strict';const rooms=W.PsyKantoInteriorsV9?.rooms;if(!rooms)return;
const layouts={
 lab:{blocks:[[25,130,120,236],[350,130,457,236],[150,130,334,229],[25,250,122,363],[352,250,457,363],[25,398,141,515],[340,398,458,515]],npcs:[[240,275],[320,375]]},
 center:{blocks:[[113,136,375,240],[29,110,106,215],[384,110,456,215],[28,270,92,357],[385,270,454,357],[28,428,91,529],[385,428,454,529],[33,552,100,616],[386,552,455,616]],npcs:[[240,270],[318,430]]},
 market:{blocks:[[135,166,338,253],[29,100,130,218],[350,100,455,218],[25,302,126,427],[352,302,455,427],[24,517,132,631],[342,517,455,631]],npcs:[[240,283]]},
 home:{blocks:[[31,164,128,300],[345,163,450,280],[175,300,312,420],[26,359,100,487],[374,474,457,624]],npcs:[[240,455]]},
 'house-east':{blocks:[[29,109,156,220],[338,102,456,223],[186,204,302,304],[29,315,77,438],[399,295,455,479],[32,540,95,627]],npcs:[[240,345]]},
 'house-west':{blocks:[[28,170,126,342],[330,171,454,278],[25,445,125,615]],npcs:[[240,382]]}
};
for(const [id,layout]of Object.entries(layouts)){const room=rooms[id];if(!room)continue;room.art='assets/kanto/interiors/'+id+'-v30.webp';Object.defineProperty(room,'paint',{value:null,writable:true,configurable:true});room.blocks=layout.blocks;room.walkBounds=[25,174,455,687];room.spawn=[240,630];room.exit=[240,675];room.npcs.forEach((npc,i)=>npc.at=layout.npcs[i]||[320,450]);}
if(rooms.lab?.npcs?.[0]){rooms.lab.npcs[0].sprite='assets/kanto/npcs/professor-v33.webp';rooms.lab.npcs[0].footOffset=20/280;}
W.PsyKantoInteriorArtV30={layouts};
})(window);
