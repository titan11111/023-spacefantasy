import Phaser from 'phaser';
import { VoidCrawler } from './VoidCrawler';
import { PatrolState } from './states/PatrolState';

/** 地上を巡回しながら、一定間隔で月面ジャンプする敵。 */
export class LunarHopper extends VoidCrawler {
  public jumpInterval = 1500;
  public jumpVelocity = -245;
  private nextJumpAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, { animationPrefix: 'hopper' });
    this.setTexture('hopper', 0);
    this.hp = 2;
    this.patrolSpeed = 82;
    this.nextJumpAt = scene.time.now + Phaser.Math.Between(650, 1100);
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
    if (!this.isGrounded()) {
      const key = body.velocity.y < 0 ? 'hopper-jump' : 'hopper-fall';
      this.anims.play(key, true);
    }
  }
}

export function createHopperAnimations(scene: Phaser.Scene): void {
  if (scene.anims.exists('hopper-walk')) return;

  scene.anims.create({
    key: 'hopper-walk',
    frames: scene.anims.generateFrameNumbers('hopper', { frames: [0, 1] }),
    frameRate: 5,
    repeat: -1,
  });
  scene.anims.create({
    key: 'hopper-jump',
    frames: scene.anims.generateFrameNumbers('hopper', { frames: [2] }),
    frameRate: 1,
  });
  scene.anims.create({
    key: 'hopper-fall',
    frames: scene.anims.generateFrameNumbers('hopper', { frames: [3] }),
    frameRate: 1,
  });
  scene.anims.create({
    key: 'hopper-hurt',
    frames: scene.anims.generateFrameNumbers('hopper', { frames: [4] }),
    frameRate: 1,
  });
  scene.anims.create({
    key: 'hopper-dead',
    frames: scene.anims.generateFrameNumbers('hopper', { frames: [5] }),
    frameRate: 1,
  });
}
