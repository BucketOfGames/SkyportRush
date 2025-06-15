export class AudioManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 0.3;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.gainNode) return;

    const oscillator = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    oscillator.connect(envelope);
    envelope.connect(this.gainNode);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // Envelope
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  public playCollect(): void {
    // Pleasant upward chime
    this.createTone(440, 0.1);
    setTimeout(() => this.createTone(554, 0.1), 50);
    setTimeout(() => this.createTone(659, 0.15), 100);
  }

  public playHit(): void {
    // Harsh downward noise
    this.createTone(200, 0.3, 'sawtooth');
    setTimeout(() => this.createTone(150, 0.2, 'square'), 100);
  }

  public playEngine(): void {
    // Low rumble
    this.createTone(80, 0.1, 'sawtooth');
  }

  public destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}