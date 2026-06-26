// Procedural ambient music + wind, Japanese "yo" pentatonic scale.
// ORIGINAL generated audio via the Web Audio API — no copyrighted material,
// no audio files, no downloads. Evokes the Ghost-of-Yotei mood (koto plucks
// over windswept fields) without using the actual game soundtrack.
// Must be started by a user gesture (browsers block autoplay).

let ctx = null;
let master = null;       // { out, dry, wet }
let started = false;     // wind/context initialised
let playing = false;     // notes scheduling on
let schedulerTimer = null;

// Yo scale (bright pentatonic), spanning a couple of octaves, in Hz.
const SCALE = [
  220.0, 246.94, 293.66, 329.63, 392.0, // A3 B3 D4 E4 G4
  440.0, 493.88, 587.33, 659.25, 783.99, // A4 B4 D5 E5 G5
];

function makeReverb() {
  // Algorithmic impulse response for a soft, roomy tail.
  const len = Math.floor(ctx.sampleRate * 2.6);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = buf;
  return conv;
}

// One koto-like plucked note.
function pluck(freq, time, gainVal) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'triangle';
  osc2.type = 'sine';
  osc.frequency.value = freq;
  osc2.frequency.value = freq * 2.001; // shimmer
  filt.type = 'lowpass';
  filt.frequency.value = 2600;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gainVal, time + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 3.2);
  osc.connect(g);
  osc2.connect(g);
  g.connect(filt);
  filt.connect(master.dry);
  filt.connect(master.wet);
  osc.start(time);
  osc2.start(time);
  osc.stop(time + 3.3);
  osc2.stop(time + 3.3);
}

function scheduleNote() {
  if (!playing) return;
  const now = ctx.currentTime;
  pluck(SCALE[(Math.random() * SCALE.length) | 0], now + 0.05, 0.1 + Math.random() * 0.07);
  // occasional gentle harmony
  if (Math.random() < 0.35) {
    pluck(SCALE[(Math.random() * SCALE.length) | 0], now + 0.2, 0.06);
  }
  schedulerTimer = setTimeout(scheduleNote, 1100 + Math.random() * 1700);
}

// Looping filtered noise with a slow LFO = wind over the fields.
function startWind() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 600;
  filt.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.05;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 320;
  lfo.connect(lfoGain);
  lfoGain.connect(filt.frequency);
  noise.connect(filt);
  filt.connect(g);
  g.connect(master.dry);
  noise.start();
  lfo.start();
}

function ensureContext() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const out = ctx.createGain();
  out.gain.value = 0.0;
  out.connect(ctx.destination);
  const dry = ctx.createGain();
  dry.gain.value = 0.9;
  dry.connect(out);
  const reverb = makeReverb();
  const wet = ctx.createGain();
  wet.gain.value = 0.5;
  wet.connect(reverb);
  reverb.connect(out);
  master = { out, dry, wet };
}

// Toggle playback. Returns the new playing state. Call from a click handler.
export function toggleAudio() {
  ensureContext();
  if (ctx.state === 'suspended') ctx.resume();
  if (!started) {
    started = true;
    startWind();
  }
  playing = !playing;
  master.out.gain.cancelScheduledValues(ctx.currentTime);
  if (playing) {
    master.out.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.0);
    scheduleNote();
  } else {
    master.out.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
    clearTimeout(schedulerTimer);
  }
  return playing;
}
