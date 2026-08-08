import type Phaser from 'phaser';
import { EnemyState } from '../EnemyState';
import { PatrolState } from './PatrolState';
import { DeadState } from './DeadState';

/** 被弾ノックバック＋点滅。終了後パトロールへ戻る（HP0なら死亡） */
export class HurtState extends EnemyState {
  private until = 0;

  enter(): void {
    this.play(this.enemy.animationKey('hurt'));
    this.until = this.enemy.scene.time.now + 280;
    const body = this.enemy.body as Phaser.Physics.Arcade.Body;
    // 弾の進行方向へ水平ノックバックのみ（空中打ち上げなし）
    const knockX = 260;
    body.setVelocityY(0);
    body.setVelocityX(this.enemy.knockDir * knockX);
    this.enemy.setFlipX(this.enemy.knockDir < 0);
    this.enemy.setTint(0xffa0ff);
  }

  update(time: number): void {
    const body = this.enemy.body as Phaser.Physics.Arcade.Body;
    if (time < this.until) {
      // ノックバック中は水平のみ。上方向の速度は打ち消す
      body.setVelocityX(this.enemy.knockDir * 200);
      if (body.velocity.y < 0) {
        body.setVelocityY(0);
      }
      this.enemy.setAlpha(time % 80 < 40 ? 0.4 : 1);
      return;
    }
    this.enemy.clearTint();
    this.enemy.setAlpha(1);
    if (this.enemy.hp <= 0) {
      this.enemy.changeState(new DeadState(this.enemy));
    } else {
      this.enemy.changeState(new PatrolState(this.enemy));
    }
  }

  exit(): void {
    this.enemy.clearTint();
    this.enemy.setAlpha(1);
  }
}
