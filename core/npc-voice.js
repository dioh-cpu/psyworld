/* PSYWORLD NPC VOICE V1
 * Vozes locais para NPCs: sem upload de áudio, sem dependência externa e com
 * fallback automático para a voz pt-BR disponível no aparelho/navegador.
 */
(function(W,D){
  'use strict';
  if(W.psyNpcVoice)return;
  const STORE='psy_npc_voice_v1';
  const defaults={enabled:true,volume:.95};
  let settings={...defaults};
  try{const saved=JSON.parse(localStorage.getItem(STORE)||'{}');settings={...settings,...saved}}catch(e){}
  const profiles={
    arven:{name:'Arven',lang:'pt-BR',rate:.86,pitch:.68,voiceHints:['Daniel','Microsoft Daniel','Felipe','Ricardo','Google português Brasil'],moods:{welcome:{rate:.88,pitch:.72},quest:{rate:.85,pitch:.66},warning:{rate:.76,pitch:.56},boss:{rate:.70,pitch:.48},reward:{rate:.94,pitch:.76},sad:{rate:.80,pitch:.60},happy:{rate:.92,pitch:.72}}},
    guardiao:{name:'Guardião Musgárion',lang:'pt-BR',rate:.70,pitch:.48,voiceHints:['Daniel'],moods:{warning:{rate:.62,pitch:.42},boss:{rate:.58,pitch:.36},defeat:{rate:.78,pitch:.54}}},
    amigo_floresta:{name:'Amigo da Floresta',lang:'pt-BR',rate:1.04,pitch:1.18,voiceHints:['Luciana','Google português'],moods:{sad:{rate:.88,pitch:1.05},happy:{rate:1.08,pitch:1.25}}},
    mercador:{name:'Mercador',lang:'pt-BR',rate:1.00,pitch:.96,voiceHints:['Google português'],moods:{happy:{rate:1.06,pitch:1.02}}},
    curandeira:{name:'Curandeira',lang:'pt-BR',rate:.88,pitch:1.12,voiceHints:['Luciana'],moods:{welcome:{rate:.90,pitch:1.15},heal:{rate:.82,pitch:1.20}}},
    lider_ginasio:{name:'Líder de Ginásio',lang:'pt-BR',rate:.84,pitch:.70,voiceHints:['Daniel'],moods:{warning:{rate:.76,pitch:.58},victory:{rate:.90,pitch:.78}}},
    professor:{name:'Professor',lang:'pt-BR',rate:.90,pitch:.98,voiceHints:['Google português'],moods:{welcome:{rate:.88,pitch:1.02},serious:{rate:.78,pitch:.86}}},
    default:{name:'NPC',lang:'pt-BR',rate:1,pitch:1,voiceHints:[],moods:{}}
  };
  let voices=[];
  function refreshVoices(){try{voices=window.speechSynthesis?.getVoices?.()||[]}catch(e){voices=[]}}
  refreshVoices();
  try{window.speechSynthesis?.addEventListener?.('voiceschanged',refreshVoices)}catch(e){}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(settings))}catch(e){}}
  function profileFor(id){return profiles[String(id||'default')]||profiles.default}
  function pickVoice(profile){
    const lang=String(profile.lang||'pt-BR').toLowerCase(),hints=(profile.voiceHints||[]).map(x=>String(x).toLowerCase());
    return voices.find(v=>hints.some(h=>v.name.toLowerCase().includes(h))&&v.lang.toLowerCase().startsWith(lang.slice(0,2)))||voices.find(v=>v.lang.toLowerCase()===lang)||voices.find(v=>v.lang.toLowerCase().startsWith(lang.slice(0,2)))||null;
  }
  function speak(text,opts={}){
    const value=String(text||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    if(!value||!settings.enabled||!('speechSynthesis' in W)||!('SpeechSynthesisUtterance' in W))return false;
    const profile=profileFor(opts.npc||opts.id||'default'),mood=profile.moods?.[opts.mood]||{},u=new SpeechSynthesisUtterance(value);
    u.lang=opts.lang||profile.lang||'pt-BR';u.rate=Math.max(.45,Math.min(1.8,Number(opts.rate??mood.rate??profile.rate??1)));u.pitch=Math.max(.35,Math.min(1.7,Number(opts.pitch??mood.pitch??profile.pitch??1)));u.volume=Math.max(0,Math.min(1,Number(opts.volume??settings.volume??1)));
    const voice=pickVoice(profile);if(voice)u.voice=voice;
    try{W.speechSynthesis.cancel();W.speechSynthesis.speak(u);return true}catch(e){return false}
  }
  function stop(){try{W.speechSynthesis?.cancel()}catch(e){}}
  function registerNpc(id,profile={}){const key=String(id||'default');profiles[key]={...(profiles[key]||profiles.default),...profile,moods:{...(profiles[key]?.moods||{}),...(profile.moods||{})}};return profiles[key]}
  function setEnabled(value){settings.enabled=!!value;save();if(!settings.enabled)stop()}
  function setVolume(value){settings.volume=Math.max(0,Math.min(1,Number(value)||0));save()}
  function installAudioVoiceControl(){
    const panel=D.getElementById('psy-audio-panel'),close=D.getElementById('psy-audio-close');
    if(!panel||!close||D.getElementById('psy-voice-row'))return;
    const row=D.createElement('div');row.id='psy-voice-row';row.innerHTML='<label style="display:flex;justify-content:space-between;gap:12px;margin:16px 0 8px"><b>🗣 Vozes dos NPCs</b><input id="psy-voice-on" type="checkbox"></label><input id="psy-voice-vol" type="range" min="0" max="100" style="width:100%">';close.parentNode.insertBefore(row,close);
    const on=row.querySelector('#psy-voice-on'),vol=row.querySelector('#psy-voice-vol');on.checked=settings.enabled;vol.value=Math.round(settings.volume*100);on.onchange=()=>setEnabled(on.checked);vol.oninput=()=>setVolume(Number(vol.value)/100);
  }
  setInterval(installAudioVoiceControl,1200);
  W.psyNpcVoice={profiles,settings,speak,stop,registerNpc,setEnabled,setVolume,refreshVoices};
  W.speakNpc=(text,npc='default',mood='neutral')=>speak(text,{npc,mood});
  console.log('🗣️ PSYWORLD NPC Voice V1 carregado');
})(window,document);
