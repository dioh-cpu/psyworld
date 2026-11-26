// Som e preferências dos efeitos (revelação, ovos, conexão). Sons sintetizados com WebAudio: sem arquivos para baixar.
// Preferências por aparelho (localStorage, com try/catch): volume 0–1, reduzir movimento (segue o sistema por padrão) e pular revelações.
const CH = { volume: 'cw_fx_volume', reduzir: 'cw_fx_reduzir', pular: 'cw_fx_pular' };
const ler = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const sistemaReduz = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const pref = {
  get volume() { return Math.max(0, Math.min(1, Number(ler(CH.volume, 0.6)) || 0)); },
  set volume(v) { gravar(CH.volume, Math.max(0, Math.min(1, v))); },
  get reduzir() { const v = ler(CH.reduzir, null); return v == null ? sistemaReduz() : Boolean(v); },
  set reduzir(v) { gravar(CH.reduzir, Boolean(v)); },
  get pular() { return Boolean(ler(CH.pular, false)); },
  set pular(v) { gravar(CH.pular, Boolean(v)); },
};
// Ciclo do botão de volume: 60% → 30% → mudo → 60%
export function proximoVolume() { const v = pref.volume; pref.volume = v > 0.45 ? 0.3 : v > 0 ? 0 : 0.6; return pref.volume; }
export const iconeVolume = () => (pref.volume === 0 ? '🔇' : pref.volume < 0.45 ? '🔉' : '🔊');

let ac = null, mestre = null;
function audio() {
  if (pref.volume <= 0) return null;
  try {
    if (!ac) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ac = new C(); mestre = ac.createGain(); mestre.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    mestre.gain.value = pref.volume * 0.5; return ac;
  } catch { return null; }
}
function tom(a, { f = 440, f2, tipo = 'sine', t0 = 0, dur = 0.3, g = 0.4, ataque = 0.01 }) {
  const o = a.createOscillator(), v = a.createGain(), t = a.currentTime + t0;
  o.type = tipo; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(g, t + ataque); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(v); v.connect(mestre); o.start(t); o.stop(t + dur + 0.05);
}
function ruido(a, { t0 = 0, dur = 0.4, g = 0.3, de = 800, para = 3000, tipo = 'bandpass' }) {
  const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), fl = a.createBiquadFilter(), v = a.createGain(), t = a.currentTime + t0;
  s.buffer = buf; fl.type = tipo; fl.frequency.setValueAtTime(de, t); fl.frequency.exponentialRampToValueAtTime(para, t + dur); fl.Q.value = 1.2;
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(v); v.connect(mestre); s.start(t);
}
// Sons nomeados. `tier` (1–5) escala brilho e peso.
export function tocar(nome, tier = 1) {
  const a = audio(); if (!a) return;
  try {
    if (nome === 'toque') tom(a, { f: 660, f2: 880, tipo: 'triangle', dur: 0.08, g: 0.15 });
    else if (nome === 'carga') { ruido(a, { dur: 0.45 + tier * 0.08, g: 0.12 + tier * 0.03, de: 300, para: 2400 + tier * 600 }); tom(a, { f: 180, f2: 360 + tier * 60, tipo: 'sawtooth', dur: 0.45, g: 0.04 }); }
    else if (nome === 'virar') ruido(a, { dur: 0.16, g: 0.22, de: 1500, para: 5000, tipo: 'highpass' });
    else if (nome === 'impacto') {
      tom(a, { f: 120 + tier * 10, f2: 40, tipo: 'sine', dur: 0.35 + tier * 0.06, g: 0.25 + tier * 0.08 });
      const notas = [[523], [523, 659], [523, 659, 784], [523, 659, 784, 988], [523, 659, 784, 1047, 1319]][tier - 1];
      notas.forEach((f, i) => tom(a, { f, tipo: 'triangle', t0: 0.04 + i * 0.07, dur: 0.6 + tier * 0.12, g: 0.09 + tier * 0.012 }));
      if (tier >= 4) ruido(a, { t0: 0.02, dur: 0.9 + tier * 0.2, g: 0.08, de: 4000, para: 9000, tipo: 'highpass' });
    } else if (nome === 'rachar') ruido(a, { dur: 0.12, g: 0.25, de: 2000, para: 600 });
    else if (nome === 'conexao') { tom(a, { f: 220, f2: 880, tipo: 'sine', dur: 0.5, g: 0.12 }); ruido(a, { dur: 0.5, g: 0.08, de: 400, para: 4000 }); tom(a, { f: 880, tipo: 'triangle', t0: 0.42, dur: 0.6, g: 0.1 }); tom(a, { f: 1320, tipo: 'triangle', t0: 0.48, dur: 0.6, g: 0.06 }); }
  } catch { /* áudio indisponível */ }
}
