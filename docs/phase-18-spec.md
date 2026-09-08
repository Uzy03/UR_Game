# Phase 18: Dash & Throw Action Foundation

Phase 18は既存のPhase 17 gameplayへ、抽象ActionとしてDashと床着地Throwを追加する。Stationへの自動投入、新規UI、production asset、Story変更は対象外とする。

## Input

- `Dash`: `Space`
- `Interact`: `KeyE`
- `Throw`: `KeyQ`
- キーコードは`KeyboardInput`だけが知り、gameplay側は`InputAction`を消費する。
- 各Actionはkeydown edgeを使うため、押しっぱなしで再発火しない。

## Dash

- 継続: `0.18秒`
- 速度: `8.8 units/秒`（通常速度`4.4`の2倍）
- cooldown: `0.42秒`
- 方向: 長さ`0.1`以上の移動入力を正規化。入力がなければPlayerの向き。
- Dash開始時に方向を固定し、通常移動と同じ`KinematicCharacter.move`へ変位を渡す。
- フレーム末尾でDashが終了する場合、残り時間を通常移動として積分する。
- Phone、Event、Transitionなど既存のmovement lock中は開始できず、lockされた時点で進行中Dashも停止する。

## Throw

- 距離: `3.6 units`
- 飛行時間: `0.42秒`
- arc高: `1.25 units`
- 最短着地距離: `0.8 units`
- 後退探索step: `0.2 units`
- 方向: Dashと同じ入力優先・向きfallback。
- 最大距離から後方へ、`Stage.isFloorDropPositionValid`を満たす最遠点を探す。見つからなければItemは手元に残る。
- PlacePointやProcessing／Assembly Stationへの自動配置は行わず、必ず床へ着地する。
- ItemはDynamicRigidBodyにせず、同じ`PickableItem`インスタンスを`thrown`状態へ移して決定的な放物線で補間する。ID、kind、加工状態、active状態を維持する。
- 飛行中はInteraction対象にも床上Itemにもならない。
- 複数の飛行中Itemを管理し、予約済み着地点との重なりも避ける。

## Cleanup

- Retry準備前に飛行中Itemを予約済み着地点へ確定し、その後でTask固有のauthoritative reset／snapshot restoreを行う。
- Scene交換・load失敗・Game disposeでは`ItemThrowSystem.unbindScene`または`dispose`が全飛行を確定し、遅延着地や旧Scene参照を残さない。
- Player resetはDashの継続時間とcooldownを初期化する。

## Compatibility

- 通常移動値`speed 4.4 / acceleration 20 / deceleration 26 / turnSharpness 16`は変更しない。
- Phase 17の`maxDeltaSeconds 0.1`、shadow削減、Scene visual identityを維持する。
- Save v1、Phone進行v1、Checkpoint schemaは変更しない。
- browser-free検証は10 / 15 / 20 / 60 FPSでDash時間積分とThrow着地点の一致を確認する。
