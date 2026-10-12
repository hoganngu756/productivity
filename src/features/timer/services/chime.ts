let ctx: AudioContext | null = null;

/**
 * Creates/resumes the AudioContext. Call from a user gesture (e.g. Start)
 * so the browser allows the chime to play later when the tab is in the background.
 */
export function primeAudio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A soft three-note bell, synthesised with Web Audio. */
export function playChime(): void {
  const audio = primeAudio();
  if (!audio) return;
  const notes = [659.25, 880, 1318.5];
  const t0 = audio.currentTime + 0.05;
  notes.forEach((freq, i) => {
    const start = t0 + i * 0.18;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 1.25);
  });
}
