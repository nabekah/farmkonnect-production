/**
 * Notification Sound Manager
 * Handles audio playback for notifications with volume control and sound selection
 */

export type SoundType = 'chime' | 'bell' | 'alert' | 'notification' | 'success' | 'error';
export type AlertType = 'info' | 'warning' | 'critical' | 'success' | 'error';

interface SoundConfig {
  type: SoundType;
  volume: number; // 0-1
  enabled: boolean;
}

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private config: SoundConfig = {
    type: 'chime',
    volume: 0.5,
    enabled: true,
  };

  private soundMap: Record<SoundType, () => void> = {
    chime: () => this.playChime(),
    bell: () => this.playBell(),
    alert: () => this.playAlert(),
    notification: () => this.playNotification(),
    success: () => this.playSuccess(),
    error: () => this.playError(),
  };

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
  }

  setConfig(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig() {
    return { ...this.config };
  }

  playSound(soundType: SoundType = this.config.type) {
    if (!this.config.enabled || !this.audioContext) {
      return;
    }

    const playFunc = this.soundMap[soundType];
    if (playFunc) {
      playFunc();
    }
  }

  playAlertSound(alertType: AlertType) {
    const soundTypeMap: Record<AlertType, SoundType> = {
      info: 'notification',
      warning: 'bell',
      critical: 'alert',
      success: 'success',
      error: 'error',
    };

    this.playSound(soundTypeMap[alertType]);
  }

  private playChime() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.5;

    // Create oscillator for chime sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Chime frequencies
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(this.config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playBell() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const duration = 0.8;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1046, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration);

    gain.gain.setValueAtTime(this.config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  private playAlert() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + i * 0.15;
      osc.frequency.setValueAtTime(1200, startTime);
      gain.gain.setValueAtTime(this.config.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    }
  }

  private playNotification() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const frequencies = [523, 659, 784]; // C, E, G

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + index * 0.1;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.config.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  private playSuccess() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const frequencies = [523, 659, 784, 1047]; // C, E, G, C

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + index * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.config.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  private playError() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const frequencies = [349, 293]; // F, D

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + index * 0.15;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.config.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  enable() {
    this.config.enabled = true;
  }

  disable() {
    this.config.enabled = false;
  }

  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.config.volume;
  }
}

// Export singleton instance
export const notificationSoundManager = new NotificationSoundManager();
