import Phaser from 'phaser';

/**
 * player.png（横16フレーム / 64×64）足元揃え済み
 * 0-5  run
 * 6    shoot
 * 7    idle
 * 8    crouch
 * 9-11 jump / air
 * 12   land（未使用・予備）
 * 13-15 hurt（予備）
 */
export function createPlayerAnimations(scene: Phaser.Scene): void {
  if (scene.anims.exists('player-idle')) return;

  scene.anims.create({
    key: 'player-run',
    frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 5 }),
    frameRate: 12,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-idle',
    frames: scene.anims.generateFrameNumbers('player', { frames: [7] }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-shoot',
    frames: scene.anims.generateFrameNumbers('player', { frames: [6, 7] }),
    frameRate: 10,
    repeat: -1,
  });

  // 上昇中は1枚固定（フレーム送りで足元がブレない）
  scene.anims.create({
    key: 'player-jump',
    frames: scene.anims.generateFrameNumbers('player', { frames: [9] }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-fall',
    frames: scene.anims.generateFrameNumbers('player', { frames: [11] }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-crouch',
    frames: scene.anims.generateFrameNumbers('player', { frames: [8] }),
    frameRate: 1,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-crouch-walk',
    frames: scene.anims.generateFrameNumbers('player', { frames: [8] }),
    frameRate: 6,
    repeat: -1,
  });

  scene.anims.create({
    key: 'player-crouch-shoot',
    frames: scene.anims.generateFrameNumbers('player', { frames: [8] }),
    frameRate: 1,
    repeat: -1,
  });
}
