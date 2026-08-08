# Cosmic Runner — Side Scrolling Action

## 概要
宇宙を舞台にした横スクロールアクション。Phaser 4.2 + TypeScript + Vite。
プレイヤーは光線銃を持つ宇宙飛行士。FSM（Strategy Pattern）で状態管理する。

## 技術
- Phaser 4.2.1 / TypeScript / Vite
- Physics: Arcade
- Tilemap: Tiled JSON（`assets/level1.json`）
- Spritesheet: `assets/player.png`（横16フレーム / 64×64）

## Player States（必須7種）
| State | 役割 |
|---|---|
| IdleState | 待機 |
| RunState | 走り |
| JumpState | 上昇中 |
| FallState | 落下（Coyote / Jump Buffer着地） |
| CrouchState | しゃがみ（低速移動） |
| ShootState | 地上・空中射撃 |
| CrouchShootState | しゃがみ射撃（銃口のみ低い・弾道は水平） |

## 操作
- 移動: ←→ / A D
- ジャンプ: Space / Z / 仮想B（Coyote Time 120ms + Jump Buffer 150ms）
- しゃがみ: ↓ / S
- 射撃: J / X / クリック / 仮想A（クールダウン 180ms）

## 敵（モデルケース）
| 名前 | スプライト | 挙動 |
|---|---|---|
| Void Crawler | `assets/enemy.png`（32×32×6） | 左右巡回・崖/壁で反転・被弾2で撃破・接触でプレイヤーノックバック |

敵も Player と同様に Strategy FSM（Patrol / Hurt / Dead）。追加敵はこの型をコピーする。

## iOS
- viewport-fit=cover / ダブルタップ防止 / 仮想パッド / WebAudio unlock / pixelArt

## ビルド
```bash
npm install
npm run dev    # 開発
npm run build  # dist → index.html + assets/ に同期（preview/harness用）
```

## 8MB
公開実体は `node_modules` / `_raw` / `dist` を除外して計測。素材は圧縮済み。
