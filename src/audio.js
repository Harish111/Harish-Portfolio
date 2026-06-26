// Procedural Japanese ambient music — ORIGINAL generated audio via the Web
// Audio API. No copyrighted material, no audio files, no downloads.
//
// To actually "feel Japan" it uses the HIRAJOSHI scale (the classic koto
// tuning, whose minor-2nd intervals give that distinctly Japanese sound),
// layered koto plucks, a breathy shakuhachi flute, sparse taiko drum hits,
// a low drone and wind over the fields.
// Must be started by a user gesture (browsers block autoplay).

let ctx = null;
let master = null; // { out, dry, wet }
let started = false;
let playing = false;
const timers = [];

// Hirajoshi scale (Miyako-bushi), root D, across two octaves, in Hz.
// Degrees: 1, 2, b3, 5, b6  ->  D, E, F, A, Bb
const SCALE = [
  146.83, 164.81, 174.61, 220.0, 233.08, // D3 E3 F3 A3 Bb3
  293.66, 329.63, 349.23, 440.0, 466.16, // D4 E4 F4 A4 Bb4
  587.33, 659.25, 698.46, // D5 E5 F5
];
const ROOT = 73.42; // D2, for the drone

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

function makeReverb() {
  const len = Math.floor(ctx.sampleRate * 3.0);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

// A koto-like plucked note (bright attack, long ringing decay).
function pluck(freq, time, gainVal) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'triangle';
  osc2.type = 'sine';
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2.001;
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(3200, time);
  filt.frequency.exponentialRampToValueAtTime(900, time + 2.4);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gainVal, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 3.6);
  osc.connect(g); osc2.connect(g);
  g.connect(filt);
  filt.connect(master.dry);
  filt.connect(master.wet);
  osc.start(time); osc2.start(time);
  osc.stop(time + 3.7); osc2.stop(time + 3.7);
}

// A breathy shakuhachi-like sustained tone with slow attack + vibrato + air.
function shakuhachi(freq, time, dur) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.value = freq;
  filt.type = 'lowpass';
  filt.frequency.value = 1400;
  // vibrato
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vib.frequency.value = 5;
  vibGain.gain.value = freq * 0.012;
  vib.connect(vibGain); vibGain.connect(osc.frequency);
  // breath noise
  const nlen = ctx.sampleRate * dur;
  const nbuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
  const nd = nbuf.getChannelData(0);
  for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = nbuf;
  const nfilt = ctx.createBiquadFilter();
  nfilt.type = 'bandpass'; nfilt.frequency.value = freq * 2; nfilt.Q.value = 0.8;
  const ngain = ctx.createGain(); ngain.gain.value = 0.015;
  noise.connect(nfilt); nfilt.connect(ngain); ngain.connect(master.dry);

  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.09, time + 0.5);
  g.gain.setValueAtTime(0.09, time + dur - 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g); g.connect(filt);
  filt.connect(master.dry); filt.connect(master.wet);
  osc.start(time); vib.start(time); noise.start(time);
  osc.stop(time + dur + 0.1); vib.stop(time + dur + 0.1); noise.stop(time + dur);
}

// A soft taiko-like drum hit (low pitched thump + transient).
function taiko(time) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.18);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.16, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
  osc.connect(g); g.connect(master.dry); g.connect(master.wet);
  osc.start(time); osc.stop(time + 0.55);
}

// Looping filtered noise + slow LFO = wind over the fields.
function startWind() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 550; filt.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.045;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 280;
  lfo.connect(lfoGain); lfoGain.connect(filt.frequency);
  noise.connect(filt); filt.connect(g); g.connect(master.dry);
  noise.start(); lfo.start();
}

// Quiet low drone on the root for grounding.
function startDrone() {
  [ROOT, ROOT * 2].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = f;
    g.gain.value = i === 0 ? 0.04 : 0.02;
    osc.connect(g); g.connect(master.dry);
    osc.start();
  });
}

// ---- schedulers (each re-arms itself while playing) -----------------------
function loopKoto() {
  if (!playing) return;
  const now = ctx.currentTime;
  pluck(pick(SCALE), now + 0.05, rand(0.08, 0.15));
  if (Math.random() < 0.3) pluck(pick(SCALE), now + rand(0.25, 0.6), 0.06);
  timers.push(setTimeout(loopKoto, rand(1800, 3600)));
}
function loopShakuhachi() {
  if (!playing) return;
  // pick a mid/high scale note for the flute
  const f = pick(SCALE.slice(5));
  shakuhachi(f, ctx.currentTime + 0.1, rand(3.0, 5.0));
  timers.push(setTimeout(loopShakuhachi, rand(9000, 16000)));
}
function loopTaiko() {
  if (!playing) return;
  taiko(ctx.currentTime + 0.05);
  if (Math.random() < 0.4) taiko(ctx.currentTime + rand(0.4, 0.8));
  timers.push(setTimeout(loopTaiko, rand(7000, 14000)));
}

function ensureContext() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const out = ctx.createGain(); out.gain.value = 0.0; out.connect(ctx.destination);
  const dry = ctx.createGain(); dry.gain.value = 0.9; dry.connect(out);
  const reverb = makeReverb();
  const wet = ctx.createGain(); wet.gain.value = 0.55; wet.connect(reverb); reverb.connect(out);
  master = { out, dry, wet };
}

// Toggle playback. Returns the new playing state. Call from a click handler.
export function toggleAudio() {
  ensureContext();
  if (ctx.state === 'suspended') ctx.resume();
  if (!started) {
    started = true;
    startWind();
    startDrone();
  }
  playing = !playing;
  master.out.gain.cancelScheduledValues(ctx.currentTime);
  if (playing) {
    master.out.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.2);
    loopKoto();
    timers.push(setTimeout(loopShakuhachi, 2500));
    timers.push(setTimeout(loopTaiko, 4000));
  } else {
    master.out.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
    while (timers.length) clearTimeout(timers.pop());
  }
  return playing;
}
