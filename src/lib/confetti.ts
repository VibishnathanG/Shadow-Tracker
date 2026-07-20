import confetti from 'canvas-confetti';

export const fireConfetti = () => {
  if (typeof window === 'undefined') return;
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b']
    });
  } catch (err) {
    console.warn('Confetti execution failed:', err);
  }
};

export const fireStreakConfetti = () => {
  if (typeof window === 'undefined') return;
  try {
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      try {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#fbbf24', '#f87171']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#fbbf24', '#f87171']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      } catch (e) {
        console.warn('Streak confetti frame error:', e);
      }
    };
    frame();
  } catch (err) {
    console.warn('Streak confetti failed:', err);
  }
};
