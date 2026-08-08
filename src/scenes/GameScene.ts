import Phaser from 'phaser';
import { Player } from '../player/Player';
import { Projectile, ProjectileGroup, type ShotPayload } from '../projectiles/Projectile';
import { ParallaxBackground } from '../world/ParallaxBackground';
import { FarEarth } from '../world/FarEarth';
import { VoidCrawler } from '../enemies/VoidCrawler';
import { Sfx } from '../audio/Sfx';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private projectiles!: ProjectileGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private parallax!: ParallaxBackground;
  private farEarth!: FarEarth;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super('GameScene');
  }

  create(): void {
    // 地面・足場・キャラを上げる量。背景パララックス／地球は動かさない。
    // 端末表示でおよそ 2cm 相当（CSS換算 ≈75px → タイル整合で 64）
    const STAGE_RAISE = 64;

    const map = this.make.tilemap({ key: 'level1' });
    const tileset = map.addTilesetImage('tileset', 'tileset');
    if (!tileset) {
      throw new Error('tileset missing');
    }

    const layer = map.createLayer('ground', tileset, 0, -STAGE_RAISE);
    if (!layer || !('setCollisionByExclusion' in layer)) {
      throw new Error('ground layer missing');
    }
    this.groundLayer = layer as Phaser.Tilemaps.TilemapLayer;
    this.groundLayer.setCollisionByExclusion([-1, 0]);
    this.groundLayer.setDepth(5);
    this.groundLayer.forEachTile((tile) => {
      if (tile.y >= 16) {
        tile.setVisible(false);
      }
    });
    this.data.set('groundLayer', this.groundLayer);

    const worldWidth = map.widthInPixels;
    const worldHeight = map.heightInPixels;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor('#02040a');

    this.parallax = new ParallaxBackground(this, [
      { key: 'bg_far', scrollX: 0.05, scrollY: 0.02 },
      { key: 'bg_mid', scrollX: 0.12, scrollY: 0.04, alpha: 0.8 },
      { key: 'bg_stars', scrollX: 0.28, scrollY: 0.08 },
    ]);
    this.farEarth = new FarEarth(this);

    const groundTop = 16 * map.tileHeight - STAGE_RAISE;
    const groundFaceSurfaceOffset = 20;
    this.add
      .tileSprite(0, groundTop - groundFaceSurfaceOffset, worldWidth, 130, 'ground_face')
      .setOrigin(0, 0)
      .setDepth(6)
      .setScrollFactor(1);

    const spawnX = 120;
    const spawnY = groundTop - 96;
    this.player = new Player(this, spawnX, spawnY);
    this.physics.add.collider(this.player, this.groundLayer);

    this.enemies = this.physics.add.group({ runChildUpdate: true });
    // モデルケース: 地面に2体、足場に1体。
    // Sprite の見た目ではなく Arcade Body の底面をタイル表面へ揃え、
    // 最初の物理フレームで敵が空中から落ちて見えるのを防ぐ。
    const crawlerSpawns = [
      { x: 420, surfaceY: groundTop, fallsOffLedges: false },
      { x: 780, surfaceY: groundTop, fallsOffLedges: false },
      {
        x: 400,
        surfaceY: 12 * map.tileHeight - STAGE_RAISE,
        fallsOffLedges: true,
      },
    ];
    for (const s of crawlerSpawns) {
      const enemy = new VoidCrawler(this, s.x, s.surfaceY, {
        fallsOffLedges: s.fallsOffLedges,
      });
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      // 96dpi換算で約1mm（3.78px）上へ。見た目と当たり判定を一緒に移動する。
      const enemyVerticalOffset = -4;
      enemy.y += s.surfaceY - body.bottom + enemyVerticalOffset;
      body.updateFromGameObject();
      this.enemies.add(enemy, true);
      this.physics.add.collider(enemy, this.groundLayer);
    }

    this.projectiles = new ProjectileGroup(this);
    this.physics.add.collider(
      this.projectiles,
      this.groundLayer,
      (bolt) => {
        const p = bolt as Phaser.Physics.Arcade.Image & { kill?: () => void };
        p.kill?.();
      },
    );

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (objA, objB) => {
        // Group 同士は引数順が不定なことがあるため、役割で振り分ける
        const candidates = [objA, objB] as Phaser.GameObjects.GameObject[];
        const projectile = candidates.find(
          (o) => o instanceof Projectile || (o as Projectile).texture?.key === 'projectile',
        ) as Projectile | undefined;
        const enemy = candidates.find(
          (o) => o instanceof VoidCrawler || (o as VoidCrawler).texture?.key === 'enemy',
        ) as VoidCrawler | undefined;
        if (!projectile?.active || !enemy || typeof enemy.takeDamage !== 'function') return;
        if (!enemy.isAlive()) return;

        // 弾の進行方向へノックバック（右向き弾 → 敵は右へ）
        const pBody = projectile.body as Phaser.Physics.Arcade.Body | undefined;
        let knockDir = 1;
        if (pBody && Math.abs(pBody.velocity.x) > 1) {
          knockDir = Math.sign(pBody.velocity.x);
        } else {
          knockDir = projectile.x <= enemy.x ? 1 : -1;
        }
        enemy.takeDamage(knockDir);
        Sfx.hit();
        projectile.kill();
      },
    );

    this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
      const enemy = enemyObj as VoidCrawler;
      if (!enemy.isAlive?.()) return;
      this.player.applyHitFrom(enemy.x);
    });

    this.events.on('player-shot', (payload: ShotPayload) => {
      this.projectiles.fire(payload);
    });

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(40, 60);

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.parallax.resize(gameSize.width, gameSize.height);
      this.farEarth.resize(gameSize.width, gameSize.height);
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.parallax.update(this.cameras.main);
    this.farEarth.update(this.cameras.main);
  }
}
