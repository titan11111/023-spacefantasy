import Phaser from 'phaser';
import { VoidCrawler } from './VoidCrawler';
import { PatrolState } from './states/PatrolState';

/** 重力を受けず、指定範囲を上下に漂いながら巡回する飛行敵。 */
export class VoidFlyer extends VoidCrawler {
  public readonly isFlyingEnemy = true;
  public flightAmplitude = 34;
  public flightFrequency = 0.0022;
  private flightCenterY: number;
  private minX: number;
  private maxX: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, range = 190) {
    super(scene, x, y);
    this.flightCenterY = y;
    this.minX = x - range;
    this.maxX = x + range;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.hp = 1;
    this.patrolSpeed = 92;
    this.setTint(0x8de9ff);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(-this.patrolSpeed, 0);
  }

  override update(time: number, delta: number): void {
    if (!this.active) return;

    // Hurt / Deadは共通FSMへ渡し、通常巡回時だけ飛行運動を上書きする。
    if (!(this.currentState instanceof PatrolState)) {
      super.update(time, delta);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.x <= this.minX) this.dir = 1;
    if (this.x >= this.maxX) this.dir = -1;
    body.setVelocityX(this.dir * this.patrolSpeed);
    const targetY =
      this.flightCenterY +
      Math.sin(time * this.flightFrequency + this.phase) * this.flightAmplitude;
    body.setVelocityY((targetY - this.y) * 7);
    this.setFlipX(this.dir < 0);
    this.anims.play('enemy-walk', true);
  }
}
