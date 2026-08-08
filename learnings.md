# Learnings — 023-spacefantasy (Cosmic Runner)

日付: 2026-08-08

## 何をしたか
- Phaser 4.2.1 + TypeScript + Vite で横スクロールアクションを新規実装
- Player FSM（Strategy）: Idle / Run / Jump / Fall / Crouch / Shoot / CrouchShoot
- Coyote Time 120ms + Jump Buffer 150ms
- PlayerInputController で入力を Command 化（仮想パッド共有）
- Tiled JSON tilemap 衝突、4層 Parallax、光線銃 Projectile
- iOS: ダブルタップ防止・仮想パッド・WebAudio unlock・safe-area・pixelArt

## ハマりどころ
1. Phaser `Sprite.input`（InteractiveObject）と自前の `input` が衝突 → `playerInput` に改名
2. `erasableSyntaxOnly` だと parameter property（`constructor(protected player)`）が不可
3. Vite 成果物を harness / preview（静的配信）で動かすため、`build` 後に `dist` → `index.html` + `assets/` へ同期
4. 生PNGが合計約3.7MB → JPEG化・リサイズで素材約148KB。bundle含めて harness 計測 1.77MB

## 検証
- `npm run build` 成功
- `node _tools/game-harness.mjs 023-spacefantasy` → **RESULT PASS**（描画60RAF、エラー0、1.77MB）
- Playwright 実機操作の手触り確認は未実施（シミュレータ未実行）

## 次があれば
- 敵・ダメージ・ゴールのゲームループ
- `_raw` を公開対象から外す運用（現状サイズは余裕あり）
- BGM/SFX（WebAudio）
