import type Phaser from 'phaser';
import { EnemyState } from '../EnemyState';

export class DeadState extends EnemyState {
  private until = 0;

  enter(): void {
    this.play(this.enemy.animationKey('dead'));
    this.until = this.enemy.scene.time.now + 380;
    const body = this.enemy.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -Math.round(80 / Math.sqrt(6)));
    body.setAllowGravity(true);
    this.enemy.setFlipY(true);
  }

  update(time: number): void {
    this.enemy.setAlpha(Math.max(0, 1 - (time - (this.until - 380)) / 380));
    if (time >= this.until) {
      this.enemy.destroy();
    }
  }

  exit(): void {}
}
