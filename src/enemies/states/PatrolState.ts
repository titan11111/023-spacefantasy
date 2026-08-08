import type Phaser from 'phaser';
import { EnemyState } from '../EnemyState';

/** 足場端・壁で折り返しながら左右巡回 */
export class PatrolState extends EnemyState {
  enter(): void {
    this.play(this.enemy.animationKey('walk'));
  }

  update(_time: number, _delta: number): void {
    const e = this.enemy;
    const body = e.body as Phaser.Physics.Arcade.Body;
    if (!e.isAlive()) return;

    body.setVelocityX(e.dir * e.patrolSpeed);

    // Probe判定を物理フレーム間で取り逃しても、空中でPatrolを継続させない。
    if (!e.isGrounded() && e.fallsOffLedges) {
      e.goFall();
      return;
    }

    // 壁
    if ((e.dir < 0 && body.blocked.left) || (e.dir > 0 && body.blocked.right)) {
      e.flipDir();
      return;
    }

    // 前方足元のLine Probeが地面を見失ったら崖。
    if (e.isGrounded() && !e.hasGroundAhead()) {
      if (e.fallsOffLedges) {
        // 速度は反転させず、現在方向のまま落下Stateへ。
        e.goFall();
        return;
      } else {
        e.flipDir();
      }
    }

    e.setFlipX(e.dir < 0);
    this.play(e.animationKey('walk'));
  }

  exit(): void {
    this.enemy.clearLedgeProbe();
  }
}
