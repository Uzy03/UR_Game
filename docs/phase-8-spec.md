# UR_Game Phase 8 — Reach Zone / Journey Gameplay

## Baseline

- Repository: `Uzy03/UR_Game`
- Phase 7 baseline branch: `codex/phase-7-prologue-slice`
- Phase 7 commit: `d797d1a204217a32b1f58edcb59ba661d99bbbe5`
- Working branch: `codex/phase-8-reach-zone`
- Target package version: `0.8.0`

Phase 7のレビューでは、Phase 8前に修正必須のblocking issueは見つからなかった。
Phase 8では新しいStory基盤を増やさず、既存Task境界へ移動目標を1種類だけ追加する。

## 検証ワークフロー

実装エージェントはゲームpreview、localhost、ゲームサイトを開かず、ブラウザ操作も行わない。
実装側の確認範囲は次のとおり。

```text
npm run build
git diff --check
静的な参照・schema確認
ブラウザを必要としない純ロジック確認
secret / personal-data候補確認
```

ゲームの実操作はユーザー本人が行う。実装完了報告には、順番に実施できる手動確認
チェックリストを必ず含める。Phase 8のためだけにPlaywright等を導入しない。

## 目的

プレイヤー自身が3D空間の目的地まで移動すると成功する`ReachZoneTask`を追加する。
これにより既存EventSequenceだけで、次の流れを構成できるようにする。

```text
Dialogue
  -> set_objective
  -> task(ReachZoneTask)
  -> WASDで目的地へ移動
  -> 範囲へ入ると自動成功
  -> 次のEvent
```

## Gameplay primitive

追加するgameplay primitiveは`ReachZoneTask`だけとする。

- 既存`Task` interfaceを実装する。
- `remainingSeconds`は常に`null`。
- 状態遷移は`idle -> running -> succeeded`のみ。
- Playerと目的地のXZ平面距離がradius以内なら成功する。
- Y座標は成功判定に使用しない。
- `running`中のみ地面のGoal Markerを表示する。
- 成功、reset、cancel、Scene破棄でMarkerを残さない。

新しいGame Eventは作らず、既存の`{ type: 'task', taskId }`を利用する。
EventRunner、TaskManager、PhysicsWorld、InputActionにReach固有分岐を追加しない。
Rapier sensorやTrigger Colliderも追加しない。

## Scene integration

`SceneDefinition`へ任意の`reachTasks`を追加する。

```ts
interface SceneReachTaskDefinition {
  readonly id: string;
  readonly label: string;
  readonly targetPosition: Vector3Config;
  readonly radius: number;
}
```

`SceneContentRegistry`は以下を検証する。

- IDが空でない。
- Placement/Reachを跨いでTask IDが一意。
- labelが空でない。
- targetPositionの全座標がfinite。
- radiusがfiniteかつ0より大きい。

`SceneRuntime`は定義から`ReachZoneTask`と`ReachZoneTaskEventBinding`を生成し、既存の
`taskBindings`へPlacement Bindingと一緒に登録する。Task種別はEventRunnerへ見せない。

Goal Markerは`Stage.object`の子として所有する。`Stage.dispose()`の既存Object3D
破棄経路でGeometryとMaterialを解放し、SceneManagerへReach固有cleanupを追加しない。

## Binding

`ReachZoneTaskEventBinding.prepareAttempt()`は次だけを行う。

- Interactionの現在選択をreset。
- ResultOverlayをhide。
- SpeechBubbleをhide。

Playerをteleportしない。Carry、Item、PlacePointもresetしない。現在位置と現在の保持状態から
歩き始められる境界を維持する。

## 架空デモ

新しい`demo-promenade` Sceneを使用する。

- 架空の一本道風promenade。
- Demo Friend NPC 1人。
- Picnic Box 1個。
- Bench PlacePoint 1個。
- 既存PlacementTask 1件。
- Fountain用ReachZoneTask 1件。
- Viewpoint用ReachZoneTask 1件。
- Three.js primitiveだけで構成。

Main Sequenceは次の一本道とする。

```text
set_date
  -> intro dialogue
  -> set_objective: picnic box
  -> PlacementTask
  -> dialogue
  -> set_objective: fountain
  -> ReachZoneTask #1
  -> dialogue
  -> move_npc
  -> set_objective: viewpoint
  -> ReachZoneTask #2
  -> unlock_photo
  -> clear objective
  -> outro dialogue
  -> set_checkpoint
  -> speech / wait
  -> exploration
```

架空Photoはrepository所有の`public/demo/phase8-promenade-placeholder.svg`を使い、
外部画像へ依存しない。

## Checkpointと互換性

追加するCheckpointは次の2つ。

- `phase8-promenade-start`
- `phase8-promenade-complete`

New Gameのinitial checkpointはPhase 8 startへ変更する。Phase 6/7のCheckpoint、Scene、
Phone contentは削除・renameせず、過去の有効なv1 Saveを引き続き解決する。

以下は変更しない。

```text
Game Save key: ur-game:save:v1
Game Save schema: { version: 1, checkpointId: string }
Phone key: ur-game:phone-progress:v1
Phone Progress version: 1
```

Reach途中のPlayer座標、Task state、Marker状態は保存しない。reload後は直前の安全な
CheckpointからSceneとresumeSequenceを再構築する。

## 今回実装しないもの

- 新しいEvent primitive。
- timed Reach。
- Trigger framework、Rapier sensor。
- NavMesh、pathfinding、waypoint、route line。
- minimap、map/compass/navigation Phone app。
- Processing、Combining、料理、レシピ。
- campaign統合、Chapter、Save v2、full snapshot。
- BGM、SE、fade、cinematic camera。
- GLTF、animation、gamepad、touch。
- 実名、実日付、実メッセージ、実写真、実在場所などの個人情報。

## 変更対象

新規:

```text
src/task/ReachZoneTask.ts
src/events/ReachZoneTaskEventBinding.ts
src/content/demo/phase8Ids.ts
src/content/demo/phase8Scenes.ts
src/content/demo/phase8Sequence.ts
src/content/demo/phase8PhoneContent.ts
src/content/demo/phase8Checkpoints.ts
public/demo/phase8-promenade-placeholder.svg
docs/phase-8-spec.md
```

変更:

```text
src/scene/SceneTypes.ts
src/scene/SceneContentRegistry.ts
src/scene/SceneRuntime.ts
src/core/Game.ts
package.json
package-lock.json
index.html
README.md
```

## 完成条件

1. `ReachZoneTask`が既存Task interfaceを実装している。
2. XZ距離でradius内へ入ると成功する。
3. timerを持たず、failureへ遷移しない。
4. running中だけGoal Markerが表示される。
5. success/reset/Scene破棄でMarkerが残らない。
6. EventRunnerとTaskManagerへReach固有分岐がない。
7. PhysicsWorldとInputActionに変更がない。
8. Placement/Reach間のTask ID重複をrejectする。
9. 不正label、target、radiusをrejectする。
10. `demo-promenade`でPlacementTask 1件とReach Task 2件を実行できる。
11. 架空Photoをunlockし、complete checkpointを保存する。
12. Phase 6/7の旧Checkpoint IDを維持する。
13. Game Save v1とPhone Progress v1を維持する。
14. `npm run build`が成功する。
15. `git diff --check`が成功する。
16. public repositoryへ個人情報やcredentialを追加しない。

## ユーザー向け手動確認

実装エージェントは以下を実行せず、完了報告でユーザーへ依頼する。

1. Reset ProgressからNew Gameを開始し、`demo-promenade`を確認。
2. Intro Dialogue後、Picnic BoxをBenchへ運んでCLEARになることを確認。
3. FountainのMarkerが見え、その場で待っても成功しないことを確認。
4. MarkerへWASDで入り、自動CLEARとMarker消去を確認。
5. 2つ目のMarkerが別地点だけに表示されることを確認。
6. Viewpoint到着後、Photo unlockとOutroを確認。
7. 自由探索中にPhone AlbumでPhase 8の架空Photoを確認。
8. Reach途中にreloadし、Continueで安全Checkpointから再開することを確認。
9. Restart/Continueを繰り返してMarker、NPC、Promptが重複しないことを確認。
10. WASD、Dialogue、Pick/Carry/Place、TIME UPからR Retry、Phone操作の回帰を確認。
