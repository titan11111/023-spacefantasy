import Phaser from 'phaser';
import { EnemyState } from './EnemyState';
import { PatrolState } from './states/PatrolState';
import { HurtState } from './states/HurtState';
import { FallState } from './states/FallState';

/**
 * Void Crawler — モデルケース敵
 * 月面を左右巡回。光線で2発撃破。プレイヤー接触でノックバック。
 * 状態は Player と同じ Strategy FSM（Patrol / Hurt / Dead）。
 */
export class VoidCrawler extends Phaser.Physics.Arcade.Sprite {
  public currentState: EnemyState;
  public dir = -1;
  public patrolSpeed = 70;
  public hp = 2;
  /** true の敵は足場の端で反転せず、そのまま下段へ落下する。 */
  public fallsOffLedges = false;
  /** 進行方向へ何px先から足元を調べるか。 */
  public ledgeCheckOffset = 20;
  /** 足元チェックを下へ何px伸ばすか。 */
  public ledgeCheckDepth = 34;
  /** 開発確認用。必要なときだけ true にする。 */
  public debugLedgeProbe = false;
  /** プレイヤーと同じ月面重力（地球相当980の1/6） */
  public gravity = Math.round(980 / 6);
  private invulnUntil = 0;
  private ledgeDebug!: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: { fallsOffLedges?: boolean } = {},
  ) {
    super(scene, x, y, 'enemy', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2);
    this.setDepth(18);
    this.setBounce(0);
    this.setFlipX(true);
    this.fallsOffLedges = options.fallsOffLedges ?? false;
    this.ledgeDebug = scene.add.graphics().setDepth(100);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setGravityY(this.gravity);
    body.setSize(24, 28);
    body.setOffset(4, 3);
    body.setMaxVelocity(200, 800);
    body.setImmovable(false);

    this.currentState = new PatrolState(this);
    this.currentState.enter();
  }

  changeState(next: EnemyState): void {
    if (this.currentState === next) return;
    this.currentState.exit();
    this.currentState = next;
    this.currentState.enter();
  }

  goPatrol(): void {
    this.changeState(new PatrolState(this));
  }

  goFall(): void {
    this.changeState(new FallState(this));
  }

  isAlive(): boolean {
    return this.hp > 0 && this.active;
  }

  isGrounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  flipDir(): void {
    this.dir *= -1;
    this.setFlipX(this.dir < 0);
  }

  /**
   * 進行方向の前方足元へLine Probeを伸ばす。
   * Arcade PhysicsにはMatterのworld.raycast相当がないため、線上を分割し
   * Tilemapの衝突タイルに当たるか調べて同じ判定を行う。
   */
  hasGroundAhead(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const startX = body.center.x + this.dir * this.ledgeCheckOffset;
    const startY = body.bottom - 6;
    const endX = startX + this.dir * 8;
    const endY = body.bottom + this.ledgeCheckDepth;
    const layer = this.scene.data.get('groundLayer') as
      | Phaser.Tilemaps.TilemapLayer
      | undefined;

    this.ledgeDebug.clear();
    if (this.debugLedgeProbe) {
      this.ledgeDebug.lineStyle(2, 0xff3344, 0.9);
      this.ledgeDebug.lineBetween(startX, startY, endX, endY);
    }
    if (!layer) return false;

    const samples = 10;
    for (let i = 0; i <= samples; i += 1) {
      const t = i / samples;
      const x = Phaser.Math.Linear(startX, endX, t);
      const y = Phaser.Math.Linear(startY, endY, t);
      const tile = layer.getTileAtWorldXY(x, y, true);
      if (tile && tile.index > 0 && tile.collides) return true;
    }
    return false;
  }

  clearLedgeProbe(): void {
    this.ledgeDebug.clear();
  }

  /** ノックバック水平方向（+1=右へ、-1=左へ）。弾の進行方向と同じ。 */
  public knockDir = 1;

  takeDamage(knockDirX: number): void {
    if (!this.isAlive()) return;
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return;

    this.hp -= 1;
    this.invulnUntil = now + 280;
    this.knockDir = knockDirX >= 0 ? 1 : -1;
    // パトロール向きはノックバック後に戻す用（撃たれた方を向く）
    this.dir = -this.knockDir;
    this.changeState(new HurtState(this));
  }

  override update(time: number, delta: number): void {
    if (!this.active) return;
    this.currentState.update(time, delta);
  }

  override destroy(fromScene?: boolean): void {
    this.ledgeDebug?.destroy();
    super.destroy(fromScene);
  }
}

export function createEnemyAnimations(scene: Phaser.Scene): void {
  if (scene.anims.exists('enemy-walk')) return;

  scene.anims.create({
    key: 'enemy-walk',
    frames: scene.anims.generateFrameNumbers('enemy', { start: 0, end: 2 }),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: 'enemy-idle',
    frames: scene.anims.generateFrameNumbers('enemy', { start: 3, end: 3 }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'enemy-fall',
    frames: scene.anims.generateFrameNumbers('enemy', { start: 3, end: 3 }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'enemy-hurt',
    frames: scene.anims.generateFrameNumbers('enemy', { start: 4, end: 4 }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'enemy-dead',
    frames: scene.anims.generateFrameNumbers('enemy', { start: 5, end: 5 }),
    frameRate: 1,
    repeat: -1,
  });
}
