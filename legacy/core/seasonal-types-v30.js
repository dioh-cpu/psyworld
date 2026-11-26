/* Special form type identity, without changing the underlying species. */
(function(W){'use strict';const base=W.psyResolvePokemonTypes;W.psyResolvePokemonTypes=function(mon){const f=W.PsySeason?.forms?.find(f=>f.key===mon?.halloweenForm&&f.id===Number(mon?.id));return f?f.type:base?base(mon):mon?.type||'Normal';};})(window);
