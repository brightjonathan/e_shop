// lib/playNotificationSound.ts
// Generates a short two-tone "ding" using the Web Audio API — no audio
// file to host or bundle, works in every modern browser.
export const playNotificationSound = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.12); // first note
    playTone(1174, now + 0.1, 0.15); // second, slightly higher note
  } catch {
    // Browsers block audio before any user interaction on the page —
    // fail silently rather than throwing, this is just a nice-to-have.
  }
};