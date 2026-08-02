// Cat sound effects synthesized with the Web Audio API.
// No external audio files needed — sounds are generated procedurally.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// A "meow" is a rapid pitch sweep with a formant-ish resonant filter.
export function playHappyMeow() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.linearRampToValueAtTime(1400, now + 0.12);
  filter.frequency.linearRampToValueAtTime(700, now + 0.32);
  filter.Q.value = 6;

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.linearRampToValueAtTime(880, now + 0.14);
  osc.frequency.linearRampToValueAtTime(460, now + 0.34);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  osc.connect(filter).connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.45);
}

// A low, unhappy growl/sad meow: descending growl with distortion-ish lowpass.
export function playSadMeow() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.linearRampToValueAtTime(280, now + 0.5);
  filter.Q.value = 4;

  osc.type = 'sawtooth';
  osc2.type = 'square';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(160, now + 0.5);
  osc2.frequency.setValueAtTime(305, now);
  osc2.frequency.linearRampToValueAtTime(150, now + 0.5);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.28, now + 0.06);
  gain.gain.linearRampToValueAtTime(0.24, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gain).connect(ac.destination);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.62);
  osc2.stop(now + 0.62);
}

// Soft click for UI interactions (not cat-related)
export function playClick() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}
