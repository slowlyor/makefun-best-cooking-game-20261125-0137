// audio.js — every sound is synthesized with WebAudio: short oscillator blips
// and filtered noise, so the game ships no audio files and loads nothing.
// The context is created lazily on the first user gesture; headless runs and
// browsers that block autoplay simply stay silent.

let ctx = null;
let sizzleTimer = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch { /* silent */ }
}

function noise(dur, gain, filterFreq) {
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start();
  } catch { /* silent */ }
}

export const sfx = {
  pickup() { tone(520, 0.09, 'sine', 0.12); },
  drop() { tone(340, 0.08, 'sine', 0.1); },
  chop() { noise(0.08, 0.25, 900); tone(180, 0.06, 'square', 0.08); },
  chopped() { tone(660, 0.1, 'sine', 0.12); tone(880, 0.12, 'sine', 0.1, 0.08); },
  grill() { noise(0.15, 0.12, 2400); },
  ready() { tone(740, 0.12, 'sine', 0.14); tone(988, 0.18, 'sine', 0.12, 0.1); },
  serve() { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.09); tone(784, 0.2, 'triangle', 0.14, 0.18); },
  error() { tone(160, 0.18, 'sawtooth', 0.1); },
  expire() { tone(220, 0.25, 'sawtooth', 0.1); tone(165, 0.3, 'sawtooth', 0.1, 0.15); },
  tick() { tone(980, 0.05, 'square', 0.05); },
  start() { tone(392, 0.1, 'triangle', 0.12); tone(523, 0.1, 'triangle', 0.12, 0.1); tone(659, 0.16, 'triangle', 0.12, 0.2); },
  end() { tone(523, 0.15, 'triangle', 0.12); tone(392, 0.15, 'triangle', 0.12, 0.14); tone(330, 0.3, 'triangle', 0.12, 0.28); },
};

// A soft looping sizzle while something grills; main.js starts/stops it.
export function setSizzle(on) {
  if (on && !sizzleTimer) {
    sizzleTimer = window.setInterval(() => noise(0.2, 0.05, 2600), 220);
  } else if (!on && sizzleTimer) {
    window.clearInterval(sizzleTimer);
    sizzleTimer = null;
  }
}
