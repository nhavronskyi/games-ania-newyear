import { save, state } from "./state";

// All sounds are synthesized with Web Audio: no asset files, works offline.

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | undefined;

/**
 * Create/resume the AudioContext. iOS only allows this inside a user gesture, so call it
 * from touch/click handlers. Safe to call repeatedly.
 */
export function unlockAudio(): void {
  try {
    // iOS 17+/Safari 16.4+: play even when the ringer switch is on silent.
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = "playback";

    if (!ctx) {
      const Ctor =
        window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state !== "running") void ctx.resume();
  } catch (err) {
    console.warn("Audio unavailable", err);
  }
}

export function isMuted(): boolean {
  return state.muted;
}

export function toggleMute(): boolean {
  state.muted = !state.muted;
  save();
  if (!state.muted) tap();
  return state.muted;
}

function tone(
  freq: number,
  delay: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.18,
): void {
  if (state.muted || !ctx || ctx.state !== "running") return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// C major pentatonic: any order of bulbs sounds pleasant.
const BULB_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export const tap = (): void => tone(660, 0, 0.07, "triangle", 0.1);
export const place = (): void => {
  tone(330, 0, 0.09, "triangle", 0.16);
  tone(495, 0.06, 0.12, "triangle", 0.16);
};
export const coin = (): void => {
  tone(988, 0, 0.08, "square", 0.07);
  tone(1319, 0.07, 0.22, "square", 0.07);
};
export const buy = (): void => {
  coin();
  tone(1568, 0.16, 0.2, "square", 0.06);
};
export const fail = (): void => {
  tone(220, 0, 0.15, "sawtooth", 0.08);
  tone(165, 0.12, 0.25, "sawtooth", 0.08);
};
export const bulb = (i: number, dur = 0.4): void =>
  tone(BULB_NOTES[i % BULB_NOTES.length], 0, dur, "sine", 0.22);
export const goal = (): void => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.11, 0.3, "triangle", 0.16),
  );
};
export const jingle = (): void => {
  [392, 392, 392, 311.13, 349.23, 349.23, 349.23, 293.66].forEach((f, i) =>
    tone(f, i * 0.2, 0.25, "triangle", 0.14),
  );
};
