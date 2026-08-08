import type Phaser from 'phaser';
import { EnemyState } from '../EnemyState';

/** 足場端・壁で折り返しながら左右巡回 */
export class PatrolState extends EnemyState {
  enter(): void {
    this.play('enemy-walk');
  }

  update(_time: number, _delta: number): void {
    const e = this.enemy;
    const body = e.body as Phaser.Physics.Arcade.Body;
    if (!e.isAlive()) return;

    body.setVelocityX(e.dir * e.patrolSpeed);

    // 壁
    if ((e.dir < 0 && body.blocked.left) || (e.dir > 0 && body.blocked.right)) {
      e.flipDir();
      return;
    }

    // 崖（進行方向の足元1タイル先が空）
    if (e.isGrounded() && !e.fallsOffLedges && e.isLedgeAhead()) {
      e.flipDir();
    }

    e.setFlipX(e.dir < 0);
    this.play('enemy-walk');
  }

  exit(): void {}
}
