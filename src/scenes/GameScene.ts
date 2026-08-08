import Phaser from 'phaser';
import { Player } from '../player/Player';
import { Projectile, ProjectileGroup, type ShotPayload } from '../projectiles/Projectile';
import { ParallaxBackground } from '../world/ParallaxBackground';
import { FarEarth } from '../world/FarEarth';
import { WhiteBlackHole } from '../world/WhiteBlackHole';
import { VoidCrawler } from '../enemies/VoidCrawler';
import { LunarHopper } from '../enemies/LunarHopper';
import { VoidFlyer } from '../enemies/VoidFlyer';
import { Sfx } from '../audio/Sfx';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private projectiles!: ProjectileGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private parallax!: ParallaxBackground;
  private farEarth!: FarEarth;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private level: 1 | 2 = 1;
  private bgm?: Phaser.Sound.BaseSound;
  private readonly enemyActivationMargin = 420;
  private remainingEnemies = 0;
  private portal?: WhiteBlackHole;
  private transitioning = false;
  private shuttingDown = false;

  constructor() {
    super('GameScene');
  }

  init(data: { level?: number }): void {
    this.level = data.level === 2 ? 2 : 1;
    this.remainingEnemies = 0;
    this.portal = undefined;
    this.transitioning = false;
    this.shuttingDown = false;
  }

  create(): void {
    this.startBgm();
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
    // 地上・足場の敵をステージ中盤〜終盤まで広く配置。
    // Sprite の見た目ではなく Arcade Body の底面をタイル表面へ揃え、
    // 最初の物理フレームで敵が空中から落ちて見えるのを防ぐ。
    const crawlerSpawns = [
      { x: 520, surfaceY: groundTop, fallsOffLedges: false },
      { x: 920, surfaceY: groundTop, fallsOffLedges: false },
      { x: 1360, surfaceY: groundTop, fallsOffLedges: false },
      { x: 1740, surfaceY: groundTop, fallsOffLedges: false },
      {
        x: 400,
        surfaceY: 12 * map.tileHeight - STAGE_RAISE,
        fallsOffLedges: true,
      },
      {
        x: 1210,
        surfaceY: 13 * map.tileHeight - STAGE_RAISE,
        fallsOffLedges: true,
      },
      {
        x: 1640,
        surfaceY: 11 * map.tileHeight - STAGE_RAISE,
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
      this.registerEnemy(enemy);
      this.physics.add.collider(enemy, this.groundLayer);
    }

    // ジャンプ型：地上を進み、約1.5秒ごとに跳ぶ。
    for (const x of [720, 1510]) {
      const hopper = new LunarHopper(this, x, groundTop);
      const body = hopper.body as Phaser.Physics.Arcade.Body;
      hopper.y += groundTop - body.bottom - 4;
      body.updateFromGameObject();
      this.registerEnemy(hopper);
      this.physics.add.collider(hopper, this.groundLayer);
    }

    // 飛行型：中盤・終盤の上空をサイン波で巡回。地面とは衝突しない。
    for (const spawn of [
      { x: 1080, y: groundTop - 150, range: 170 },
      { x: 1660, y: groundTop - 185, range: 145 },
    ]) {
      const flyer = new VoidFlyer(this, spawn.x, spawn.y, spawn.range);
      this.registerEnemy(flyer);
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

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shuttingDown = true;
      this.bgm?.stop();
      this.bgm?.destroy();
    });
  }

  /** 敵の休止状態に影響されない、実撃破ベースの残数管理。 */
  private registerEnemy(enemy: VoidCrawler): void {
    this.remainingEnemies += 1;
    this.enemies.add(enemy, true);
    enemy.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.shuttingDown) return;
      this.remainingEnemies = Math.max(0, this.remainingEnemies - 1);
      if (this.remainingEnemies === 0 && this.level === 1) this.spawnExitPortal();
    });
  }

  /** ステージ右端へ出口を出し、触れたプレイヤーを2面へ送る。 */
  private spawnExitPortal(): void {
    if (this.portal || this.transitioning) return;

    const worldBounds = this.physics.world.bounds;
    this.portal = new WhiteBlackHole(this, worldBounds.right - 92, worldBounds.bottom - 214);
    this.add
      .text(this.portal.x, this.portal.y - 70, 'NEXT WORLD', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#18364d',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(31);

    this.physics.add.overlap(this.player, this.portal, () => this.enterNextWorld());
    this.cameras.main.flash(260, 210, 245, 255, false);
  }

  private enterNextWorld(): void {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.setVelocity(0, 0);
    this.player.body!.enable = false;
    this.cameras.main.fadeOut(650, 255, 255, 255);
    this.time.delayedCall(650, () => this.scene.restart({ level: 2 }));
  }

  /** iOSはSound Managerのアンロック後に再試行。面番号に応じて曲を切り替える。 */
  private startBgm(): void {
    const key = this.level === 2 ? 'bgm-level2' : 'bgm-level1';
    if (!this.cache.audio.exists(key)) {
      this.load.audio(key, `assets/${key}.mp3`);
      this.load.once(Phaser.Loader.Events.COMPLETE, () => this.startBgm());
      this.load.start();
      return;
    }
    this.bgm = this.sound.add(key, { loop: true, volume: 0.38 });
    const play = () => {
      if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
    };

    if (this.sound.locked) {
      this.sound.once(Phaser.Sound.Events.UNLOCKED, play);
      this.input.once(Phaser.Input.Events.POINTER_DOWN, play);
      this.input.keyboard?.once(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, play);
    } else {
      play();
    }
  }

  update(time: number, delta: number): void {
    this.updateEnemyActivation();
    this.player.update(time, delta);
    this.parallax.update(this.cameras.main);
    this.farEarth.update(this.cameras.main);
  }

  /**
   * 画面から遠い敵は物理・FSM・アニメーションを完全に休止する。
   * 画面幅の外側に十分な余白を取るため、プレイ中に復帰が見えることはない。
   */
  private updateEnemyActivation(): void {
    const view = this.cameras.main.worldView;
    const minX = view.left - this.enemyActivationMargin;
    const maxX = view.right + this.enemyActivationMargin;

    for (const child of this.enemies.getChildren()) {
      const enemy = child as VoidCrawler;
      const body = enemy.body as Phaser.Physics.Arcade.Body | null;
      if (!body || !enemy.scene) continue;

      const shouldRun = enemy.x >= minX && enemy.x <= maxX;
      const performanceCulled = enemy.getData('performanceCulled') === true;

      if (!shouldRun && enemy.active) {
        enemy.setData('performanceCulled', true);
        body.stop();
        body.enable = false;
        enemy.setActive(false).setVisible(false);
      } else if (shouldRun && performanceCulled) {
        enemy.setData('performanceCulled', false);
        enemy.setActive(true).setVisible(true);
        body.enable = true;
        body.updateFromGameObject();
      }
    }
  }
}
