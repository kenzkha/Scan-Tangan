import { SirenSoundType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentVolume: number = 0.95;

  // Custom siren audio buffer & nodes
  private sirenAudioBuffer: AudioBuffer | null = null;
  private customAudioBuffer: AudioBuffer | null = null;
  private sirenSourceNode: AudioBufferSourceNode | null = null;
  private sirenGainNode: GainNode | null = null;
  private sirenTimeoutId: number | null = null;
  private fallbackAudioEl: HTMLAudioElement | null = null;
  private synthIntervalId: number | null = null;
  private synthOscillators: OscillatorNode[] = [];
  private isSirenPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  constructor() {
    this.preloadSirenAudio();
  }

  private async preloadSirenAudio() {
    const urls = [
      '/assets/sirene-da-escola.mp3',
      'https://www.myinstants.com/media/sounds/sirene-da-escola.mp3'
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arrayBuffer = await res.arrayBuffer();
        this.initContext();
        if (this.ctx) {
          const decoded = await this.ctx.decodeAudioData(arrayBuffer);
          this.sirenAudioBuffer = decoded;
          break;
        }
      } catch {
        // try next url
      }
    }
  }

  public async loadCustomAudioFromDataUrl(dataUrl: string): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx) return false;
      const res = await fetch(dataUrl);
      const arrayBuffer = await res.arrayBuffer();
      const decoded = await this.ctx.decodeAudioData(arrayBuffer);
      this.customAudioBuffer = decoded;
      return true;
    } catch (e) {
      console.error('Failed to load custom audio data URL', e);
      return false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.currentVolume, this.ctx.currentTime);
    }
    if (this.fallbackAudioEl) {
      this.fallbackAudioEl.muted = muted;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
    if (this.fallbackAudioEl) {
      this.fallbackAudioEl.volume = this.currentVolume;
    }
  }

  // Continuous futuristic biometric scan hum sound
  public startScanHum() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      if (this.humOsc) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.humOsc = osc;
      this.humGain = gain;
    } catch {
      // ignore
    }
  }

  public stopScanHum() {
    if (this.humGain && this.ctx && this.humOsc) {
      try {
        const osc = this.humOsc;
        const gain = this.humGain;
        gain.gain.setValueAtTime(gain.gain.value, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // ignore
          }
        }, 150);
      } catch {
        // ignore
      }
      this.humOsc = null;
      this.humGain = null;
    }
  }

  // Futuristic scan node chime
  public playScanTick(progress: number = 0.5) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 500 + progress * 900;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // ignore
    }
  }

  // Play Siren according to selected type and duration
  public async startAlarmAudio(
    durationSeconds: number = 10,
    sirenType: SirenSoundType = 'school_alarm',
    customAudioUrl?: string,
    onComplete?: () => void
  ) {
    this.stopAlarmAudio();
    this.initContext();
    this.isSirenPlaying = true;

    // Handle Custom Uploaded Audio
    if (sirenType === 'custom_upload' && (this.customAudioBuffer || customAudioUrl)) {
      if (this.customAudioBuffer && this.ctx && this.masterGain) {
        this.playBufferSource(this.customAudioBuffer, durationSeconds, onComplete);
        return;
      } else if (customAudioUrl) {
        this.playAudioElement(customAudioUrl, durationSeconds, onComplete);
        return;
      }
    }

    // Handle School Siren
    if (sirenType === 'school_alarm') {
      if (this.ctx && this.sirenAudioBuffer && this.masterGain) {
        this.playBufferSource(this.sirenAudioBuffer, durationSeconds, onComplete);
        return;
      } else {
        this.playAudioElement('/assets/sirene-da-escola.mp3', durationSeconds, onComplete);
        return;
      }
    }

    // Handle Synthesized Sci-Fi Sirens
    if (this.ctx && this.masterGain) {
      this.playSynthesizedSiren(sirenType, durationSeconds, onComplete);
      return;
    }

    // Fallback timer if audio fails
    this.sirenTimeoutId = window.setTimeout(() => {
      this.stopAlarmAudio();
      if (onComplete) onComplete();
    }, durationSeconds * 1000);
  }

  // Plays an audio buffer with smooth fade-in and fade-out
  private playBufferSource(buffer: AudioBuffer, durationSeconds: number, onComplete?: () => void) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();

      source.buffer = buffer;
      source.loop = true;

      const now = this.ctx.currentTime;
      const fadeOutDuration = Math.min(2.5, durationSeconds * 0.3);
      const fadeOutStartTime = now + Math.max(0, durationSeconds - fadeOutDuration);
      const endTime = now + durationSeconds;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(1.0, now + 0.06);
      gain.gain.setValueAtTime(1.0, fadeOutStartTime);
      gain.gain.linearRampToValueAtTime(0.0001, endTime);

      source.connect(gain);
      gain.connect(this.masterGain);

      source.start(now);
      source.stop(endTime);

      this.sirenSourceNode = source;
      this.sirenGainNode = gain;

      this.sirenTimeoutId = window.setTimeout(() => {
        this.isSirenPlaying = false;
        this.stopAlarmAudio();
        if (onComplete) onComplete();
      }, durationSeconds * 1000);
    } catch (e) {
      console.error('Error playing buffer source', e);
    }
  }

  // Synthesized Cyber Sirens
  private playSynthesizedSiren(type: SirenSoundType, durationSeconds: number, onComplete?: () => void) {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const master = this.masterGain;

    const sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.001, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.85, now + 0.1);

    const fadeOutDuration = Math.min(2.0, durationSeconds * 0.3);
    const fadeOutStartTime = now + Math.max(0, durationSeconds - fadeOutDuration);
    const endTime = now + durationSeconds;

    sirenGain.gain.setValueAtTime(0.85, fadeOutStartTime);
    sirenGain.gain.linearRampToValueAtTime(0.0001, endTime);
    sirenGain.connect(master);
    this.sirenGainNode = sirenGain;

    if (type === 'cyber_scifi') {
      // Dual oscillator cyber sweep (450Hz <-> 1100Hz with LFO)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(650, now);
      osc2.frequency.setValueAtTime(655, now);

      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(1.8, now); // 1.8 Hz sweep
      lfoGain.gain.setValueAtTime(320, now);

      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(sirenGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(endTime);
      osc1.stop(endTime);
      osc2.stop(endTime);

      this.synthOscillators = [osc1, osc2, lfo];
    } else if (type === 'euro_twotone') {
      // High-low Euro two-tone horn (700Hz / 900Hz alternating)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(1.5, now);

      osc.connect(filter);
      filter.connect(sirenGain);
      osc.start(now);
      osc.stop(endTime);

      this.synthOscillators = [osc];

      let isHigh = false;
      this.synthIntervalId = window.setInterval(() => {
        if (!this.isSirenPlaying || !this.ctx) return;
        isHigh = !isHigh;
        osc.frequency.setValueAtTime(isHigh ? 960 : 720, this.ctx.currentTime);
      }, 450);
    } else if (type === 'nuclear_pulsar') {
      // Low sinister pulsing nuclear alarm (220Hz modulated pulse with 110Hz sub)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(280, now);
      osc2.frequency.setValueAtTime(140, now);

      const pulseGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(2.2, now); // Pulse 2.2 times per second
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.5, now);

      pulseGain.gain.setValueAtTime(0.6, now);
      lfo.connect(pulseGain.gain);

      osc1.connect(pulseGain);
      osc2.connect(pulseGain);
      pulseGain.connect(sirenGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(endTime);
      osc1.stop(endTime);
      osc2.stop(endTime);

      this.synthOscillators = [osc1, osc2, lfo];
    } else if (type === 'majestic_chime') {
      // Grand celebratory inauguration chord / synth chime fanfares
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major Sci-Fi chord
      const oscs: OscillatorNode[] = [];

      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3 / chords.length, now);
        osc.connect(gain);
        gain.connect(sirenGain);
        osc.start(now);
        osc.stop(endTime);
        oscs.push(osc);
      });

      this.synthOscillators = oscs;
    }

    this.sirenTimeoutId = window.setTimeout(() => {
      this.isSirenPlaying = false;
      this.stopAlarmAudio();
      if (onComplete) onComplete();
    }, durationSeconds * 1000);
  }

  private async playAudioElement(src: string, durationSeconds: number, onComplete?: () => void) {
    try {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = this.isMuted ? 0 : this.currentVolume;
      audio.currentTime = 0;
      this.fallbackAudioEl = audio;

      await audio.play();

      const fadeDuration = Math.min(2500, durationSeconds * 300);
      const totalDuration = durationSeconds * 1000;
      const fadeStartTime = totalDuration - fadeDuration;

      setTimeout(() => {
        if (!this.isSirenPlaying || !this.fallbackAudioEl) return;
        const fadeInterval = 50;
        const steps = fadeDuration / fadeInterval;
        const initialVol = this.fallbackAudioEl.volume;
        let currentStep = 0;

        const fader = setInterval(() => {
          currentStep++;
          if (this.fallbackAudioEl) {
            const newVol = Math.max(0, initialVol * (1 - currentStep / steps));
            this.fallbackAudioEl.volume = newVol;
          }
          if (currentStep >= steps) {
            clearInterval(fader);
          }
        }, fadeInterval);
      }, fadeStartTime);

      this.sirenTimeoutId = window.setTimeout(() => {
        this.isSirenPlaying = false;
        this.stopAlarmAudio();
        if (onComplete) onComplete();
      }, totalDuration);
    } catch {
      if (onComplete) {
        setTimeout(onComplete, durationSeconds * 1000);
      }
    }
  }

  public stopAlarmAudio() {
    this.isSirenPlaying = false;

    if (this.sirenTimeoutId) {
      clearTimeout(this.sirenTimeoutId);
      this.sirenTimeoutId = null;
    }

    if (this.synthIntervalId) {
      clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }

    this.synthOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.synthOscillators = [];

    if (this.sirenSourceNode) {
      try {
        this.sirenSourceNode.stop();
        this.sirenSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sirenSourceNode = null;
    }

    if (this.sirenGainNode) {
      try {
        this.sirenGainNode.disconnect();
      } catch {
        // ignore
      }
      this.sirenGainNode = null;
    }

    if (this.fallbackAudioEl) {
      try {
        this.fallbackAudioEl.pause();
        this.fallbackAudioEl.currentTime = 0;
      } catch {
        // ignore
      }
      this.fallbackAudioEl = null;
    }
  }

  public playButtonClick() {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain || this.isMuted) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
