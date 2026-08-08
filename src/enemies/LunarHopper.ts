import Phaser from 'phaser';
import { VoidCrawler } from './VoidCrawler';
import { PatrolState } from './states/PatrolState';

/** 地上を巡回しながら、一定間隔で月面ジャンプする敵。 */
export class LunarHopper extends VoidCrawler {
  public jumpInterval = 850;
  public jumpVelocity = -265;
  // 追跡ジャンプの横移動は従来速度135の0.7倍。
  public chaseJumpSpeed = 94.5;
  private nextJumpAt = 0;
  private wasGrounded = false;
  private lastGroundContactAt = Number.NEGATIVE_INFINITY;
  private readonly target: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, target: Phaser.GameObjects.Sprite) {
    super(scene, x, y, { animationPrefix: 'hopper' });
    this.target = target;
    this.setTexture('hopper', 0);
    // 基底クラスの2倍表示から、さらに1.2倍へ。
    this.setScale(2.4);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // 拡大後の寸法を即時反映してから、Scene側で足元を地面へ揃える。
    body.updateFromGameObject();
    body.setGravityY(this.gravity);
    this.hp = 2;
    this.nextJumpAt = scene.time.now + Phaser.Math.Between(450, 700);
  }

  override update(time: number, delta: number): void {
    if (!this.active) return;

    // 被弾・死亡中は共通FSMへ任せる。
    if (!(this.currentState instanceof PatrolState)) {
      super.update(time, delta);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Arcadeの衝突フラグは更新順によって既にリセットされるため、
    // Colliderで記録した直前の着地も接地として扱う。
    const grounded =
      this.isGrounded() ||
      (body.velocity.y >= 0 && time - this.lastGroundContactAt <= 50);

    if (grounded && !this.wasGrounded) {
      // 着地直後にわずかに溜め、連続ジャンプを読みやすくする。
      this.nextJumpAt = time + 260;
    }

    if (grounded) {
      body.setVelocityX(0);
      this.anims.play('hopper-walk', true);

      if (time >= this.nextJumpAt) {
        const distanceX = this.target.x - this.x;
        if (Math.abs(distanceX) > 6) this.dir = distanceX < 0 ? -1 : 1;
        this.setFlipX(this.dir < 0);
        body.setVelocityX(this.dir * this.chaseJumpSpeed);
        body.setVelocityY(this.jumpVelocity);
        this.nextJumpAt = time + this.jumpInterval;
        this.anims.play('hopper-jump', true);
      }
    } else {
      // 空中では踏み切った勢いを保ち、歩行せず弧を描いて接近する。
      if ((this.dir < 0 && body.blocked.left) || (this.dir > 0 && body.blocked.right)) {
        this.dir *= -1;
        body.setVelocityX(this.dir * this.chaseJumpSpeed);
      }
      this.setFlipX(this.dir < 0);
      this.anims.play(body.velocity.y < 0 ? 'hopper-jump' : 'hopper-fall', true);
    }

    this.wasGrounded = grounded;
  }

  /** Tilemap Colliderから呼ばれる、更新順に依存しない着地ラッチ。 */
  markGroundContact(time: number): void {
    this.lastGroundContactAt = time;
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
