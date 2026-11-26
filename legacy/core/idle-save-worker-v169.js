'use strict';self.onmessage=({data})=>{self.postMessage({ticket:data.ticket,savedAt:data.snapshot.savedAt,raw:JSON.stringify(data.snapshot)})};
