import type Phaser from 'phaser';
import { EnemyState } from '../EnemyState';

/** 足場を出た後、歩行アニメーションを止めて下段へ自然落下する状態。 */
export class FallState extends EnemyState {
  private hasLeftGround = false;

  enter(): void {
    this.enemy.clearLedgeProbe();
    this.play('enemy-fall');
  }

  update(_time: number, _delta: number): void {
    const enemy = this.enemy;
    const body = enemy.body as Phaser.Physics.Arcade.Body;

    // 空中でも前進速度を維持し、「端から前方へ踏み出す」軌道にする。
    body.setVelocityX(enemy.dir * enemy.patrolSpeed);
    enemy.setFlipX(enemy.dir < 0);
    this.play('enemy-fall');

    if (!enemy.isGrounded()) {
      this.hasLeftGround = true;
      return;
    }

    // State切替直後は旧足場のtouching.downが1フレーム残るため、
    // 一度空中へ出た後の接地だけを着地として扱う。
    if (this.hasLeftGround && body.velocity.y >= 0) {
      enemy.goPatrol();
    }
  }

  exit(): void {}
}
