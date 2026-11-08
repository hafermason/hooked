// Tiny synth sound effects (no audio files to download).
let ac = null, muted = false;
try { muted = localStorage.getItem('hooked.muted') === '1'; } catch (e) {}

function tone(f0, f1, dur, type = 'sine', vol = 0.18, delay = 0) {
  if (!ac || muted) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

const SOUNDS = {
  hook:  () => tone(300, 600, 0.08, 'square', 0.08),
  catch: () => { tone(520, 1040, 0.12, 'triangle'); tone(780, 1560, 0.12, 'triangle', 0.12, 0.07); },
  rare:  () => [660, 880, 1320].forEach((f, i) => tone(f, f * 1.5, 0.12, 'triangle', 0.15, i * 0.06)),
  king:  () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f * 1.02, 0.22, 'triangle', 0.16, i * 0.09)),
  zap:   () => { tone(120, 90, 0.25, 'sawtooth', 0.12); tone(900, 200, 0.2, 'square', 0.05); },
  chomp: () => { tone(160, 50, 0.22, 'sawtooth', 0.2); tone(90, 40, 0.18, 'square', 0.12, 0.08); },
  snip:  () => { tone(2000, 800, 0.05, 'square', 0.1); tone(1600, 600, 0.05, 'square', 0.1, 0.07); },
  bonk:  () => tone(220, 110, 0.12, 'square', 0.12),
  worm:  () => { tone(660, 660, 0.08, 'triangle'); tone(880, 880, 0.12, 'triangle', 0.18, 0.08); },
  shoo:  () => tone(400, 1200, 0.15, 'sine', 0.12),
  warn:  () => { tone(440, 440, 0.07, 'square', 0.06); tone(440, 440, 0.07, 'square', 0.06, 0.12); },
  shark: () => tone(70, 50, 0.3, 'sawtooth', 0.08),
  boss:  () => [262, 330, 392, 523, 392, 523, 659].forEach((f, i) => tone(f, f, 0.18, 'square', 0.07, i * 0.11)),
  over:  () => [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.22, 'triangle', 0.14, i * 0.14)),
};

export const sfx = {
  unlock() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ac && ac.state === 'suspended') ac.resume();
  },
  play(name) { try { SOUNDS[name] && SOUNDS[name](); } catch (e) {} },
  get muted() { return muted; },
  toggle() { muted = !muted; try { localStorage.setItem('hooked.muted', muted ? '1' : '0'); } catch (e) {} return muted; },
  get ctx() { return ac; },
};
