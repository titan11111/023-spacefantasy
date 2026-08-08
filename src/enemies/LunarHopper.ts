import Phaser from 'phaser';
import { VoidCrawler } from './VoidCrawler';
import { PatrolState } from './states/PatrolState';

/** 地上を巡回しながら、一定間隔で月面ジャンプする敵。 */
export class LunarHopper extends VoidCrawler {
  public jumpInterval = 1500;
  public jumpVelocity = -245;
  private nextJumpAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.hp = 2;
    this.patrolSpeed = 82;
    this.nextJumpAt = scene.time.now + Phaser.Math.Between(650, 1100);
    this.setTint(0xffb65c);
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (!this.active || !(this.currentState instanceof PatrolState)) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.isGrounded() && time >= this.nextJumpAt) {
      body.setVelocityY(this.jumpVelocity);
      this.nextJumpAt = time + this.jumpInterval;
    }

    // 空中で歩行アニメーションに見えないよう、静止フレームへ切り替える。
    if (!this.isGrounded()) this.anims.play('enemy-fall', true);
  }
}
