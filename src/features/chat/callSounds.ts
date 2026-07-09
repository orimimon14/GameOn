// Call sounds without asset files — WebAudio oscillators.
// Caller hears a dial tone while the call rings; callee hears a ringtone
// while the incoming banner shows. Both stop on accept/decline/hang-up.
type SoundHandle = { stop: () => void };

const startPattern = (
  frequency: number,
  onMs: number,
  offMs: number,
  volume: number,
): SoundHandle => {
  let ctx: AudioContext | null = null;
  let interval: ReturnType<typeof setInterval> | null = null;
  try {
    ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.frequency.value = frequency;
    osc.connect(gain);
    osc.start();

    const beep = () => {
      if (!ctx) return;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.setValueAtTime(0, now + onMs / 1000);
    };
    beep();
    interval = setInterval(beep, onMs + offMs);
  } catch {
    // Audio may be blocked before a user gesture — sounds are best-effort.
  }
  return {
    stop: () => {
      if (interval) clearInterval(interval);
      void ctx?.close().catch(() => undefined);
    },
  };
};

// Caller side: long beep, long pause (like a phone dialing).
export const startDialTone = (): SoundHandle => startPattern(440, 1000, 2000, 0.08);

// Callee side: double-ring pattern, brighter.
export const startRingtone = (): SoundHandle => startPattern(880, 400, 800, 0.12);
