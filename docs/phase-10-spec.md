# UR_Game Phase 10 — Assembly Station / Two-Item Combining

## Baseline

- Repository: `Uzy03/UR_Game`
- Phase 9 branch: `codex/phase-9-processing`
- Phase 9 commit: `96f572ec5ec4be47cccd019da7baeae7e6d23392`
- Working branch: `codex/phase-10-combining`
- Target package version: `0.10.0`

Phase 9のGitHubレビューにblocking issueはなかった。Phase 10では新しいEventを増やさず、
2個の既存Item instanceを1個の事前生成済みItemへ組み立てる最後のgameplay primitiveを追加する。

## 検証ワークフロー

実装エージェントはゲームpreview、localhost、ゲームサイトを開かず、ブラウザ操作を行わない。
実装側の確認範囲は次とする。

```text
npm run build
git diff --check
TypeScriptと静的参照確認
ブラウザ不要の純ロジック確認
SVG構文確認
secret / personal-data候補確認
```

実操作はユーザー本人が行う。完了報告には手動確認チェックリストを含める。

## 目的

```text
Component Aを拾う
  -> AssemblyStationへ置く
Component Bを拾う
  -> AssemblyStationへ置く
  -> E / SpaceでCombine
  -> deltaTimeで短い進捗
  -> 入力2個がinactive
  -> 完成Itemがactive
  -> 完成Itemを拾う
  -> PlacePointへ運ぶ
```

新しいGameEventは作らず、既存の`{ type: 'task', taskId }`を使う。

## PickableItem active状態

加工状態と表示有効状態を独立させる。

```text
processing: raw | processed
active: true | false
```

Stage Item定義へ`initialActive?: boolean`を追加し、省略時は`true`とする。

inactive Itemは次を満たす。

- Object3Dが非表示。
- Interaction対象にならない。
- CarrySystemで取得できない。
- floor dropのItem間隔判定対象にならない。
- Scene Runtimeには事前生成済みinstanceとして存在する。

`reset()`はtransform、processing state、active stateをScene定義の初期値へ戻す。

## Item runtime state

Placement RetryでAssembly成功状態を維持するため、PickableItemはScene内限定のruntime stateを
capture / restoreできる。

```text
parent
local position
local quaternion
placement state
processing state
active state
```

このstateは`PlacementTaskEventBinding`のmemoryだけに保持し、localStorageやSave schemaへ保存しない。
Retry時にStation / PlacePointの参照を解除した後、activeな配置済みItemはworldへreparentし、
直接Pick up可能な安全状態にする。

Phase 9の`preserveItemProcessingOnRetry`は互換用として維持する。

## AssemblyStation

Scene-localな`Interactable`として実装する。状態は次のとおり。

```text
empty
one-loaded
ready
combining
completed
output-collected
```

Stationは`inputAnchorA`、`inputAnchorB`、`outputAnchor`を持つ。定義は次の1 recipeだけを持つ。

```ts
inputItemIds: readonly [string, string];
outputItemId: string;
combineDurationSeconds: number;
```

入力順はA→B、B→Aのどちらも許可する。投入済み入力の途中回収はPhase 10では行わない。

両入力が揃い、Playerが空手の場合だけ`Combine`を提示する。E / Space 1回で開始し、
`update(deltaSeconds)`で3D progress barを進める。完了時は入力Itemをdeactivateし、
事前生成済みoutput ItemをoutputAnchorでactivateする。

AssemblyTaskがactiveな間だけ入力配置とCombine開始を許可する。完成Itemの回収は次のPlacementTaskでも
許可する。

## AssemblyTask

既存Task interfaceとCountdownTimerを使用する。

```text
start
  -> stations assembly enabled
update
  -> station.update(deltaSeconds)
  -> 全Station completeならsucceeded
  -> それ以外はtimer更新
  -> timeoutならfailed
reset
  -> idle / timer reset / assembly disabled
```

成功判定はtimeout判定より先に行う。EventRunnerとTaskManagerはAssembly型を知らない。

## RetryとTask引き継ぎ

AssemblyTask Retry:

```text
Interaction reset
Carry reset
AssemblyStation reset
PlacePoint reset
Item reset
Player reset
temporary UI hide
```

これにより入力2個はactive・初期位置、outputはinactiveへ戻る。

Assembly成功後のPlacement初回は現在worldを維持し、同時にItem runtime stateをcaptureする。
Placement TIME UP後のRetryでは、入力inactiveとoutput activeを維持しながら、outputを安全に
再取得できる状態へ戻す。

## Scene定義とvalidation

`SceneDefinition`へoptionalな次を追加する。

```ts
assemblyStations?: readonly SceneAssemblyStationDefinition[];
assemblyTasks?: readonly SceneAssemblyTaskDefinition[];
```

Assembly Station validation:

- IDがnon-emptyかつ重複しない。
- positionがfinite。
- combine durationがpositive。
- inputが正確に2個で異なるID。
- input / output ItemがScene内に存在する。
- input Itemは初期状態でactive。
- outputがinputと異なる。
- outputは`initialActive: false`。
- 同じoutputを複数Stationが生成しない。

Assembly Task validation:

- ID・label、positive duration、finite retry transform。
- Stationが1件以上で重複しない。
- Station参照がScene内に存在する。
- Placement / Reach / Processing / Assemblyを跨いでTask IDが一意。

SceneRuntimeがAssemblyStation、AssemblyTask、Bindingを生成する。Stationはgenericな
`Interactable[]`としてSceneManagerへ公開し、Stageの既存dispose経路でresourceを破棄する。

## 架空デモ

`demo-assembly-room`を追加する。

- Demo Maker NPC 1人。
- active input Item 2個。
- inactive output Bundle 1個。
- AssemblyStation 1台。
- final PlacePoint 1個。
- 45秒AssemblyTask。
- 30秒PlacementTask。
- Three.js primitiveとrepository所有SVGだけを使用。

Sequence:

```text
set_date
  -> intro dialogue
  -> set_objective: combine
  -> AssemblyTask
  -> dialogue
  -> set_objective: deliver
  -> PlacementTask
  -> unlock_photo
  -> clear objective
  -> outro dialogue
  -> set_checkpoint
  -> speech / wait
  -> exploration
```

## Checkpointと互換性

追加Checkpoint:

- `phase10-assembly-start`
- `phase10-assembly-complete`

complete Checkpointは`demo-assembly-room-complete`を読み込み、入力2個をinactive、完成Bundleを
activeかつ最終Table位置で復元する。Assembly途中のreloadではstart Checkpointから入力active、
output inactiveで再開する。

Phase 6〜9のCheckpoint、Scene、Phone contentを維持する。

変更禁止:

```text
Game Save: ur-game:save:v1 / { version: 1, checkpointId }
Phone Progress: ur-game:phone-progress:v1 / version 1
```

## 今回実装しないもの

- 3 input以上、複数Recipe、順番依存Recipe、chain crafting。
- 投入済みinputの回収、reverse combine、combine failure。
- score、stars、quality、inventory。
- 新GameEvent、Chapter、Campaign統合。
- Save v2、world snapshot、manual save。
- DynamicRigidBody、Rapier sensor。
- Audio、Fade、Camera Event、GLTF、animation。
- gamepad、touch/mobile polish。
- 実記念コンテンツ、実名、実日付、実写真、credential。

## 完成条件

1. `initialActive`省略時はtrue。
2. inactive Itemは非表示・Interaction不可・spacing判定外。
3. activeとprocessing stateが独立する。
4. Item resetがScene初期状態を復元する。
5. AssemblyStationが既存Interactableとして動く。
6. A/B順不同で2個を配置できる。
7. 両方揃うまでCombineできない。
8. E / Space 1回でdeltaTime Combineが始まる。
9. progress visualが伸び、完了・resetで消える。
10. 完了時にinputs inactive、output activeとなる。
11. outputをCarrySystemで回収できる。
12. AssemblyTaskがsuccess/timeoutを既存Task経路で通知する。
13. Assembly Retryでinputs active、output inactiveへ戻る。
14. Assembly成功worldをPlacement初回へ引き継ぐ。
15. Placement Retryでもinputs inactive、output activeを維持する。
16. 4 Task種別間でID重複をrejectする。
17. Station/Taskの不正定義を起動時にrejectする。
18. EventRunner、TaskManager、PhysicsWorld、InputActionへ固有分岐がない。
19. Phase 6〜9 Checkpoint互換を維持する。
20. Game Save v1 / Phone Progress v1を維持する。
21. `npm run build`と`git diff --check`が成功する。
22. public repositoryに個人情報・credentialがない。

## ユーザー向け手動確認

実装エージェントは実施せず、完了報告でユーザーへ依頼する。

1. Reset Progress -> New Gameで`demo-assembly-room`を確認。
2. Component AをStationへ置き、まだCombineできないことを確認。
3. Component Bを置き、Combine表示を確認。
4. Combine後、progress、入力消失、青いBundle出現を確認。
5. Bundleを拾い、右Tableへ置いてPlacement CLEARを確認。
6. Reset後、B→A順でも成功することを確認。
7. Assembly TIME UP -> Rでinputs active / output inactiveへ戻ることを確認。
8. Placement TIME UP -> Rでinputs inactive / output activeを維持することを確認。
9. Assembly途中reload -> Continueでstart状態から再開することを確認。
10. 完走後reload -> Continueで完成状態を確認。
11. Phone AlbumでPhase 10架空Photoを確認。
12. Retry/Continueを繰り返してStation、Item、NPC、Promptが重複しないことを確認。
13. WASD、衝突、Processing、Reach、Phoneの既存回帰を確認。
