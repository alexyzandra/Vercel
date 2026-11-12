// Tiny synthesised sound effects and spoken prompts (no audio files).

let ctx: AudioContext | null = null;

/** Call from a tap handler so the browser allows audio. */
export function unlockAudio(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    void ctx?.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18): void {
  if (!ctx) return;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

export function playSound(kind: 'found' | 'boop' | 'peek' | 'fanfare'): void {
  if (kind === 'found') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.22, 'triangle'));
  else if (kind === 'boop') tone(220, 0, 0.15, 'sine', 0.12);
  else if (kind === 'peek') [392, 523].forEach((f, i) => tone(f, i * 0.12, 0.25));
  else [523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle'));
}

export function say(text: string): void {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;
    u.pitch = 1.3;
    window.speechSynthesis.speak(u);
  } catch {
    // Speech is a nice-to-have.
  }
}
