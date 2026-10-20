/**
 * Obsidian Geist Tactile Sound & Haptic Feedback Engine
 * Utilizes Web Audio API synthesis for zero-latency, asset-free audible cues,
 * with graceful fallback to mobile navigator.vibrate() haptics.
 */

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

function triggerHaptic(pattern = [50]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Non-fatal if blocked by system permissions
    }
  }
}

export const soundEffects = {
  /**
   * Positive dual-tone chime when driver is assigned / ride confirmed
   */
  playBookingConfirmed() {
    triggerHaptic([40, 60, 40]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Chime progression: C5 (523.25) -> G5 (783.99)
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 harmony
      osc2.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.25); // C6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignored if autoplay policy prevents playback prior to user gesture
    }
  },

  /**
   * Harmonious arrival chime when driver arrives at pickup
   */
  playDriverArrived() {
    triggerHaptic([80, 50, 80]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pleasant elevator style double-bell: F5 -> A5
      osc.frequency.setValueAtTime(698.46, ctx.currentTime);
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Autoplay safety
    }
  },

  /**
   * Triumphant crystal chime for payment verification and settlement
   */
  playPaymentSuccess() {
    triggerHaptic([50, 100, 50]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    } catch {
      // Autoplay safety
    }
  },

  /**
   * Urgent pulse chime for incoming driver trip dispatches
   */
  playIncomingRequestPing() {
    triggerHaptic([100, 50, 100, 50, 100]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // A6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Autoplay safety
    }
  },

  /**
   * Emergency siren tone for SOS triggers
   */
  playEmergencySiren() {
    triggerHaptic([200, 100, 200, 100, 200]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Autoplay safety
    }
  },

  /**
   * Crisp micro-interaction tick for UI transitions and approvals
   */
  playSuccessTick() {
    triggerHaptic([30]);
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Autoplay safety
    }
  },
};

export default soundEffects;
