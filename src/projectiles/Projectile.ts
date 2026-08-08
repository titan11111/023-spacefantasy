import Phaser from 'phaser';

export type ShotPayload = {
  x: number;
  y: number;
  angle: number;
  facingLeft: boolean;
};

export class Projectile extends Phaser.Physics.Arcade.Image {
  private life = 1200;

  fire(x: number, y: number, angle: number): void {
    this.enableBody(true, x, y, true, true);
    this.setActive(true);
    this.setVisible(true);
    this.setRotation(angle);
    this.life = 1200;

    const speed = 520;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    // テクスチャ 16x6。判定を少し広げて取りこぼしを防ぐ
    body.setSize(16, 8);
    body.setOffset(0, -1);
    body.enable = true;
  }

  override update(_time: number, delta: number): void {
    this.life -= delta;
    if (this.life <= 0 || !this.scene.cameras.main.worldView.contains(this.x, this.y)) {
      this.kill();
    }
  }

  kill(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body?.stop();
    this.disableBody(true, true);
  }
}

export class ProjectileGroup extends Phaser.Physics.Arcade.Group {
  constructor(scene: Phaser.Scene) {
    super(scene.physics.world, scene, {
      classType: Projectile,
      maxSize: 40,
      runChildUpdate: true,
    });
    // Factoryを経由せず生成するため、明示的にUpdate Listへ登録する。
    // これがないとProjectile.updateが走らず、弾がactiveのまま残り続ける。
    scene.sys.updateList.add(this as unknown as Phaser.GameObjects.GameObject);
  }

  fire(payload: ShotPayload): Projectile | null {
    const bolt = this.getFirstDead(false) as Projectile | null;
    if (!bolt) {
      const created = this.create(payload.x, payload.y, 'projectile') as Projectile | null;
      if (!created) return null;
      created.fire(payload.x, payload.y, payload.angle);
      return created;
    }
    bolt.fire(payload.x, payload.y, payload.angle);
    return bolt;
  }
}
