import confetti from 'canvas-confetti';

const isMobileAPK = (): boolean => {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isCapacitor = Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  return isAndroid || isCapacitor;
};

export const fireConfetti = () => {
  if (typeof window === 'undefined' || isMobileAPK()) return;
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b']
    });
  } catch (err) {
    console.warn('Confetti execution failed:', err);
  }
};

export const fireStreakConfetti = () => {
  if (typeof window === 'undefined' || isMobileAPK()) return;
  try {
    const duration = 1000;
    const end = Date.now() + duration;

    const frame = () => {
      try {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 45,
          origin: { x: 0 },
          colors: ['#f59e0b', '#fbbf24', '#f87171']
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 45,
          origin: { x: 1 },
          colors: ['#f59e0b', '#fbbf24', '#f87171']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      } catch (e) {}
    };
    frame();
  } catch (err) {}
};
