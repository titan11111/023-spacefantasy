import Phaser from 'phaser';
import { createPlayerAnimations } from '../player/createPlayerAnimations';
import { createEnemyAnimations } from '../enemies/VoidCrawler';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.spritesheet('player', 'assets/player.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('enemy', 'assets/enemy.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.image('projectile', 'assets/projectile.png');
    this.load.image('tileset', 'assets/tileset.png');
    this.load.tilemapTiledJSON('level1', 'assets/level1.json');
    this.load.image('bg_far', 'assets/bg_far.jpg');
    this.load.image('bg_mid', 'assets/bg_mid.jpg');
    this.load.image('bg_stars', 'assets/bg_stars.png');
    this.load.image('bg_earth', 'assets/bg_earth.png');
    this.load.image('ground_face', 'assets/ground_face.png');

    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2, height / 2, 240, 12, 0x12324a).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 118, height / 2, 4, 8, 0x5ce1ff).setOrigin(0, 0.5);
    this.load.on('progress', (value: number) => {
      fill.width = 236 * value;
    });
    this.load.on('complete', () => {
      bar.destroy();
      fill.destroy();
    });
  }

  create(): void {
    createPlayerAnimations(this);
    createEnemyAnimations(this);
    this.scene.start('GameScene');
  }
}
