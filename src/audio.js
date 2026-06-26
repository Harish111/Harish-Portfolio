// Procedural Japanese score — ORIGINAL generated audio via the Web Audio API.
// No copyrighted material, no audio files, no downloads.
//
// Styled after the Ghost of Tsushima / Yotei mood: a slow, melancholic
// shakuhachi MELODY (stepwise phrases, not random notes) over a warm string
// pad, sparse koto, deep taiko and wind. Built on the D Kumoi scale
// (a minor pentatonic colour that gives that bittersweet, cinematic feel).
// Must be started by a user gesture (browsers block autoplay).

let ctx = null;
let master = null; // { out, dry, wet }
let started = false;
let playing = false;
const timers = [];

// D Kumoi scale across two octaves (Hz): D E F A B
const MELODY = [
  293.66, 329.63, 349.23, 440.0, 493.88, // D4 E4 F4 A4 B4
  587.33, 659.25, 698.46, 880.0,         // D5 E5 F5 A5
];
let mi = 3; // current melody index (start on A4)

// Low chord tones for the string pad / drone (D minor colour).
const CHORDS = [
  [73.42, 110.0, 146.83], // D2 A2 D3
  [87.31, 130.81, 174.61], // F2 C3 F3
  [98.0, 146.83, 196.0],  // G2 D3 G3
  [73.42, 110.0, 146.83], // D2 A2 D3
];
let ci = 0;

function rand(a, b) { return a + Math.random() * (b - a); }

function makeReverb() {
  const len = Math.floor(ctx.sampleRate * 3.4);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
  }
  const c = ctx.createConvolver(); c.buffer = buf; return c;
}

// Koto-like pluck (bright attack, ringing decay).
function pluck(freq, time, gainVal) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'triangle'; osc2.type = 'sine';
  osc.frequency.value = freq; osc2.frequency.value = freq * 2.001;
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(3000, time);
  filt.frequency.exponentialRampToValueAtTime(800, time + 2.2);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gainVal, time + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 3.4);
  osc.connect(g); osc2.connect(g);
  g.connect(master.dry); g.connect(master.wet);
  osc.start(time); osc2.start(time);
  osc.stop(time + 3.5); osc2.stop(time + 3.5);
}

// Breathy shakuhachi note with slow attack, vibrato and air — the lead voice.
function shakuhachi(freq, time, dur, gainVal = 0.12) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filt = ctx.createBiquadFilter();
  osc.type = 'sine'; osc.frequency.value = freq;
  filt.type = 'lowpass'; filt.frequency.value = 1500;
  const vib = ctx.createOscillator();
  const vibGain = ctx.createGain();
  vib.frequency.value = 5.2; vibGain.gain.value = freq * 0.011;
  vib.connect(vibGain); vibGain.connect(osc.frequency);
  // breath
  const nlen = Math.floor(ctx.sampleRate * dur);
  const nbuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
  const nd = nbuf.getChannelData(0);
  for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = nbuf;
  const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = freq * 2; nf.Q.value = 0.8;
  const ng = ctx.createGain(); ng.gain.value = 0.012;
  noise.connect(nf); nf.connect(ng); ng.connect(master.dry);

  const a = Math.min(0.4, dur * 0.25);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gainVal, time + a);
  g.gain.setValueAtTime(gainVal, time + dur - 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(g); g.connect(filt);
  filt.connect(master.dry); filt.connect(master.wet);
  osc.start(time); vib.start(time); noise.start(time);
  osc.stop(time + dur + 0.1); vib.stop(time + dur + 0.1); noise.stop(time + dur);
}

// Warm string/erhu-like pad: a slow-swelling sustained chord.
function stringPad(freqs, time, dur) {
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = f;
    filt.type = 'lowpass'; filt.frequency.value = 700; filt.Q.value = 0.5;
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.05, time + dur * 0.4);
    g.gain.setValueAtTime(0.05, time + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filt); filt.connect(g);
    g.connect(master.dry); g.connect(master.wet);
    osc.start(time); osc.stop(time + dur + 0.1);
  });
}

// Soft taiko-like drum hit.
function taiko(time, gainVal = 0.16) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.18);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(gainVal, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.5);
  osc.connect(g); g.connect(master.dry); g.connect(master.wet);
  osc.start(time); osc.stop(time + 0.55);
}

function startWind() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 520; filt.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.04;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.06;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
  lfo.connect(lfoGain); lfoGain.connect(filt.frequency);
  noise.connect(filt); filt.connect(g); g.connect(master.dry);
  noise.start(); lfo.start();
}

// ---- schedulers (each re-arms itself while playing) -----------------------

// Lead melody: build short stepwise phrases with breathing rests between.
let phraseLeft = 0;
function loopMelody() {
  if (!playing) return;
  if (phraseLeft <= 0) {
    phraseLeft = 3 + ((Math.random() * 4) | 0); // 3..6 notes
    // long rest between phrases
    timers.push(setTimeout(loopMelody, rand(2600, 4200)));
    phraseLeft += 0.0;
    // resolve toward a stable tone at phrase start sometimes
    if (Math.random() < 0.5) mi = [0, 3, 5][(Math.random() * 3) | 0];
    return;
  }
  // step mostly by ±1, sometimes ±2, occasionally repeat
  const r = Math.random();
  const step = r < 0.6 ? (Math.random() < 0.5 ? 1 : -1)
    : r < 0.85 ? (Math.random() < 0.5 ? 2 : -2) : 0;
  mi = Math.max(0, Math.min(MELODY.length - 1, mi + step));
  const dur = rand(1.4, 2.6);
  shakuhachi(MELODY[mi], ctx.currentTime + 0.05, dur, rand(0.09, 0.14));
  phraseLeft -= 1;
  timers.push(setTimeout(loopMelody, dur * 1000 * rand(0.7, 0.95)));
}

// Koto accompaniment: sparse plucks from the low/mid melody notes.
function loopKoto() {
  if (!playing) return;
  pluck(MELODY[(Math.random() * 5) | 0], ctx.currentTime + 0.05, rand(0.06, 0.11));
  timers.push(setTimeout(loopKoto, rand(2400, 4200)));
}

// String pad: slow chord changes underneath everything.
function loopPad() {
  if (!playing) return;
  const dur = rand(9, 13);
  stringPad(CHORDS[ci % CHORDS.length], ctx.currentTime + 0.1, dur);
  ci++;
  timers.push(setTimeout(loopPad, dur * 1000 * 0.85));
}

// Taiko: occasional deep hits.
function loopTaiko() {
  if (!playing) return;
  taiko(ctx.currentTime + 0.05);
  if (Math.random() < 0.35) taiko(ctx.currentTime + rand(0.45, 0.8), 0.1);
  timers.push(setTimeout(loopTaiko, rand(8000, 15000)));
}

function ensureContext() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const out = ctx.createGain(); out.gain.value = 0.0; out.connect(ctx.destination);
  const dry = ctx.createGain(); dry.gain.value = 0.9; dry.connect(out);
  const reverb = makeReverb();
  const wet = ctx.createGain(); wet.gain.value = 0.6; wet.connect(reverb); reverb.connect(out);
  master = { out, dry, wet };
}

// Toggle playback. Returns the new playing state. Call from a click handler.
export function toggleAudio() {
  ensureContext();
  if (ctx.state === 'suspended') ctx.resume();
  if (!started) { started = true; startWind(); }
  playing = !playing;
  master.out.gain.cancelScheduledValues(ctx.currentTime);
  if (playing) {
    master.out.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.4);
    loopPad();
    timers.push(setTimeout(loopKoto, 1500));
    timers.push(setTimeout(loopMelody, 3500));
    timers.push(setTimeout(loopTaiko, 6000));
  } else {
    master.out.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
    while (timers.length) clearTimeout(timers.pop());
  }
  return playing;
}
