import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { virtualPad } from './input/virtualPad';
import { Sfx } from './audio/Sfx';

function preventIosChrome(): void {
  let lastTap = 0;
  document.addEventListener(
    'touchstart',
    (e) => {
      const now = Date.now();
      if (now - lastTap < 300) e.preventDefault();
      lastTap = now;
    },
    { passive: false },
  );
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

function unlockAudioOnce(): void {
  const unlock = () => {
    Sfx.unlock();
  };
  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
}

function bindPointer(el: HTMLElement, codes: string[]): void {
  const down = (e: PointerEvent) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    // 最優先でCommandを立てる。音・見た目の処理より先にFSMへ渡す。
    for (const code of codes) virtualPad[code] = true;
    el.classList.add('is-pressed');
    el.setAttribute('aria-pressed', 'true');
    Sfx.unlock();
    Sfx.buttonPress();
  };
  const up = () => {
    el.classList.remove('is-pressed');
    el.setAttribute('aria-pressed', 'false');
    for (const code of codes) virtualPad[code] = false;
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
}

function initVirtualControls(): void {
  const map: Record<string, string[]> = {
    'cv-left': ['Left', 'ArrowLeft', 'KeyA'],
    'cv-right': ['Right', 'ArrowRight', 'KeyD'],
    'cv-down': ['Crouch', 'ArrowDown', 'KeyS'],
    'cv-up': ['Jump', 'Space'],
    'cv-b': ['Jump', 'Space', 'KeyZ'],
    'cv-a': ['Shoot', 'KeyX', 'KeyJ'],
  };

  for (const [id, codes] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('aria-pressed', 'false');
      bindPointer(el, codes);
    }
  }

  const releaseAll = () => {
    for (const code of Object.keys(virtualPad)) virtualPad[code] = false;
    document.querySelectorAll('#virtual-controls .is-pressed').forEach((el) => {
      el.classList.remove('is-pressed');
      el.setAttribute('aria-pressed', 'false');
    });
  };
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });
}

preventIosChrome();
unlockAudioOnce();
initVirtualControls();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#02040a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      // ProMotion端末でも物理は60Hz固定にしてCPU負荷を抑える。
      fps: 60,
      fixedStep: true,
      debug: false,
    },
  },
  fps: {
    // 120HzのiPhoneでも描画・更新を60FPSより増やさない。
    target: 60,
    limit: 60,
    forceSetTimeOut: false,
    smoothStep: true,
    deltaHistory: 10,
    panicMax: 60,
  },
  scene: [BootScene, GameScene],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

const game = new Phaser.Game(config);

export default game;
