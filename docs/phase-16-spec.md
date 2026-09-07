# Phase 16 — Visual & Game Feel Vertical Slice: Cafe

Phase 16は`campaign-cafe`だけを、今後のSceneが再利用できる「Warm Miniature Memory」方向の縦切りサンプルへ仕上げる。全Campaignのアート更新や外部3Dアセット導入は行わない。

## 実装範囲

- `PerspectiveCamera`を維持した狭めのFOVと固定斜め見下ろし構図
- Rapier解決前の入力速度に加速・減速を適用し、解決後の実移動量でCharacter animationを駆動
- Player / Companion共通のprimitive製チビCharacter rig
- idle、walk、carry、interactのdelta-time procedural animation
- Cafe専用の小さなvisual style/decorations定義
- warm lighting、soft shadow、character blob contact shadow
- interaction target pulse、pickup pop、placement settle
- 既存UIの最小限のwarm-neutral調整

## 最終調整値

```text
Camera FOV: 34 degrees
Camera offset: (8.7, 16.5, 10.6)
Camera look-at offset: (0, 0.45, 0)
Follow sharpness: position 7.5 / look-at 10.5
Look-ahead: 0.12 sec, maximum 0.48

Player maximum speed: 4.4 units/sec
Acceleration: 20 units/sec²
Deceleration / reversing: 26 units/sec²
Turn sharpness: 16
```

値はコード上の`GAME_CONFIG`を唯一の調整元とする。

## 責務境界

- `CharacterVisual`: primitive meshとrigを生成する。入力・物理・Taskを知らない。
- `CharacterAnimator`: 実移動速度とcarry/interact状態をposeへ変換する。
- `PlayerController`: 抽象移動入力から平面速度を作り、Rapierへ移動要求を送る。
- `FollowCamera`: target追従、look-ahead、Scene移動時のsnapを所有する。
- `campaignVisualStyle`: Cafeのpaletteとvisual-only decorationだけを定義する。
- `Stage`: visual definitionを描画Objectへ変換するが、装飾をInteractableやSave stateにしない。

## 互換性

以下はPhase 15から変更しない。

- `ur-game:save:v1`
- `ur-game:phone-progress:v1`
- Scene / Task / Checkpoint / Item / NPC ID
- Campaign Story schemaとprivate loader
- canonical resume sequence
- Task条件・duration・Event順・Audio Cue

## 意図的に延期

- 他Sceneへの全面展開
- GLTF、skeletal animation、Mixamo
- texture pack、post-processing、particle framework
- gameplay/Event/Task追加
- Phoneを含む全面的なUI redesign
- 本番private Storyと実写真
