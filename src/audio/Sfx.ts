/**
 * Web Audio API のみの SE（外部音声ファイルなし）。
 * iOS: 最初の pointer/key で unlock 必須。
 */
class SfxEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    return this.ctx;
  }

  /** ユーザージェスチャー内で呼ぶ */
  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    // 無音バッファで iOS ロック解除
    if (!this.unlocked) {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      this.unlocked = true;
    }
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    slideTo?: number,
  ): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state === 'suspended') return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + duration);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  private noiseBurst(duration: number, volume: number, filterFreq: number): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state === 'suspended') return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  /** 光線銃：ピコ・ピコ */
  shoot(): void {
    this.tone(1480, 0.07, 'square', 0.09, 880);
    this.tone(2200, 0.04, 'triangle', 0.04, 1400);
  }

  /** 敵ヒット */
  hit(): void {
    this.tone(320, 0.09, 'square', 0.11, 90);
    this.noiseBurst(0.06, 0.08, 900);
  }

  /** ジャンプ */
  jump(): void {
    this.tone(260, 0.12, 'triangle', 0.1, 620);
  }

  /** 着地 */
  land(): void {
    this.noiseBurst(0.05, 0.07, 280);
    this.tone(140, 0.06, 'sine', 0.06, 70);
  }

  /** 仮想コントローラー：短く乾いた機械スイッチ音 */
  buttonPress(): void {
    this.noiseBurst(0.018, 0.035, 2600);
    this.tone(920, 0.022, 'square', 0.025, 620);
  }
}

export const Sfx = new SfxEngine();
