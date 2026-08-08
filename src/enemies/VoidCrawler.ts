import Phaser from 'phaser';
import { EnemyState } from './EnemyState';
import { PatrolState } from './states/PatrolState';
import { HurtState } from './states/HurtState';

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
  /** プレイヤーと同じ月面重力（地球相当980の1/6） */
  public gravity = Math.round(980 / 6);
  private invulnUntil = 0;

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

  /** 進行方向の少し先・足元下に地面が無ければ崖 */
  isLedgeAhead(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const probeX = this.x + this.dir * (body.width * this.scaleX * 0.55 + 4);
    const probeY = body.bottom + 4;
    const map = this.scene.data.get('groundLayer') as Phaser.Tilemaps.TilemapLayer | undefined;
    if (!map) return false;
    const tile = map.getTileAtWorldXY(probeX, probeY, true);
    return !tile || tile.index <= 0;
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
