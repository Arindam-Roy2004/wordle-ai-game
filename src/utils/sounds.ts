// Sound effects using Web Audio API — no external files needed

const audioCtx = () => {
  // Lazily initialize AudioContext on first user interaction
  if (!(window as any).__wordleAudioCtx) {
    (window as any).__wordleAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__wordleAudioCtx as AudioContext;
};

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15) {
  const ctx = audioCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/** Short click/pop sound on letter key press */
export function playKeyPress() {
  playTone(800, 0.05, 'square', 0.08);
}

/** Softer sound on backspace/delete */
export function playDelete() {
  playTone(400, 0.06, 'sine', 0.07);
}

/** Deeper tone on Enter/submit */
export function playSubmit() {
  playTone(600, 0.12, 'triangle', 0.1);
}

/** Ascending chime on correct guess */
export function playWin() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.15), i * 150);
  });
}

/** Low buzz on invalid input */
export function playError() {
  playTone(200, 0.2, 'sawtooth', 0.08);
}
