import confetti from 'canvas-confetti';

const isMobileAPK = (): boolean => {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isCapacitor = Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  return isAndroid || isCapacitor;
};

let safeConfettiInstance: confetti.CreateTypes | null = null;

const getSafeConfetti = (): confetti.CreateTypes | null => {
  if (typeof window === 'undefined') return null;
  if (!safeConfettiInstance) {
    try {
      safeConfettiInstance = confetti.create(undefined, {
        useWorker: false,
        resize: true,
        disableForReducedMotion: true,
      });
    } catch {
      return null;
    }
  }
  return safeConfettiInstance;
};

export const fireConfetti = (opts?: confetti.Options) => {
  if (typeof window === 'undefined' || isMobileAPK()) return;
  try {
    const fire = getSafeConfetti();
    if (!fire) return;
    fire({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b'],
      disableForReducedMotion: true,
      ...opts,
    });
  } catch (err) {
    console.warn('Confetti execution failed:', err);
  }
};

export default fireConfetti;

export const fireStreakConfetti = () => {
  if (typeof window === 'undefined' || isMobileAPK()) return;
  try {
    const fire = getSafeConfetti();
    if (!fire) return;
    const duration = 800;
    const end = Date.now() + duration;

    const frame = () => {
      try {
        fire({
          particleCount: 3,
          angle: 60,
          spread: 45,
          origin: { x: 0 },
          colors: ['#f59e0b', '#fbbf24', '#f87171'],
          disableForReducedMotion: true,
        });
        fire({
          particleCount: 3,
          angle: 120,
          spread: 45,
          origin: { x: 1 },
          colors: ['#f59e0b', '#fbbf24', '#f87171'],
          disableForReducedMotion: true,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      } catch (e) {}
    };
    frame();
  } catch (err) {}
};
