import confetti from 'canvas-confetti';

/** Fire a multi-burst celebration confetti from both sides of the screen */
export function fireConfetti() {
  const duration = 2500;
  const end = Date.now() + duration;

  const colors = ['#538d4e', '#b59f3b', '#ffffff', '#ffcc00', '#ff6b6b'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors,
  });

  frame();
}
