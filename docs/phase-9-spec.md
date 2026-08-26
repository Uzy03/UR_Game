# UR_Game Phase 9 — Processing Station / Item Processing

## Baseline

- Repository: `Uzy03/UR_Game`
- Phase 8 branch: `codex/phase-8-reach-zone`
- Phase 8 commit: `74330b8f76600be2fb253ef1078247a8cc63e8b5`
- Working branch: `codex/phase-9-processing`
- Target package version: `0.9.0`

Phase 8レビューではblocking issueはなかった。Phase 9ではOvercooked系の基本操作として、
同じItem instanceを`raw -> processed`へ1段階だけ加工する仕組みを追加する。

## 検証ワークフロー

実装エージェントはゲームpreview、localhost、ゲームサイトを開かず、ブラウザ操作をしない。
実装側では次だけを確認する。

```text
npm run build
git diff --check
型・静的参照確認
ブラウザ不要の純ロジック確認
secret / personal-data候補確認
```

実操作はユーザー本人が行う。完了報告には順番付きの手動確認チェックリストを含める。
Phase 9だけのためにPlaywright等を導入しない。

## 目的

次の小さなgameplay loopを既存EventSequenceから実行できるようにする。

```text
Itemを拾う
  -> ProcessingStationへ置く
  -> E / Spaceで加工開始
  -> deltaTimeで待つ
  -> processedになる
  -> 拾い直す
  -> PlacePointへ運ぶ
```

新しいGameEventは作らず、既存の`{ type: 'task', taskId }`を使う。

## PickableItem加工状態

`PickableItem`は`raw | processed`の2状態だけを持つ。IDとinstanceは加工前後で変更しない。

```ts
type ItemProcessingState = 'raw' | 'processed';

get processingState(): ItemProcessingState;
get isProcessed(): boolean;
markProcessed(): void;
resetTransform(): void;
resetProcessingState(): void;
reset(): void;
```

- `markProcessed()`は緑色indicatorを表示する。
- `resetTransform()`はparent/position/rotationだけを初期化し、加工状態を維持する。
- `resetProcessingState()`はScene定義の初期加工状態へ戻す。省略時はrawとする。
- 既存`reset()`は両方を実行し、Phase 0-8互換を維持する。

## ProcessingStation

Scene-localな`Interactable`として実装する。状態は次の4つ。

```text
empty
loaded
processing
processed
```

操作:

- empty + accepted Itemを保持: `Place`
- loaded raw + empty-handed: `Process`
- processing: 操作不可、3D progress barを表示
- processed + empty-handed: `Pick up`

Stationは1 Itemだけを保持する。加工時間はScene定義から受け取り、`setTimeout`を使わず
`update(deltaSeconds)`で進める。processed Itemは既存CarrySystemへ戻す。

ProcessingTaskがactiveな間だけraw Itemの配置・加工開始を許可する。processed Itemの回収は
次のPlacementTaskでも許可する。Scene disposeではStage所有resourceとして破棄する。

## ProcessingTask

既存Task interfaceを実装し、既存CountdownTimerを使う。

```text
start
  -> stations processing enabled
update
  -> station.update(deltaSeconds)
  -> 全required Item processedならsucceeded
  -> それ以外はtimer更新
  -> timeoutならfailed
reset
  -> idle / timer reset / processing disabled
```

境界フレームではStation更新と成功判定をtimeoutより先に行う。EventRunnerとTaskManagerへ
Processing固有分岐を追加しない。

## RetryとTask引き継ぎ

`ProcessingTaskEventBinding`のRetry準備順序:

```text
Interaction reset
Carry reset
Station reset
PlacePoint reset
Item reset(raw)
Player reset
temporary UI hide
```

Processing成功後のPlacementTask初回開始では、現在のCarry・Station・Item位置を維持する。
Placement TIME UP後のRetryではStation/PlacePoint/Carryを解除し、Itemを安全な初期位置へ戻すが、
`processed`状態は維持する。これをBinding内部の限定的なattempt policyで扱い、world snapshotや
localStorageへ保存しない。

## Scene定義とvalidation

`SceneDefinition`へoptionalな次を追加する。

```ts
processingStations?: readonly SceneProcessingStationDefinition[];
processingTasks?: readonly SceneProcessingTaskDefinition[];
```

Station validation:

- IDが空でなく重複しない。
- positionがfinite。
- processing durationがfiniteかつ0より大きい。
- accepted Itemが1件以上で重複しない。
- accepted ItemがScene Itemとして存在する。

Processing Task validation:

- ID・label、positive duration、finite retry transform。
- Placement / Reach / Processingを跨いでTask ID一意。
- required ItemとStationが1件以上で重複しない。
- 全参照がScene内に存在する。
- 各required Itemを少なくとも1つの指定Stationがacceptする。

`SceneRuntime`はStationをScene-local objectとして生成し、genericな`Interactable[]`として
SceneManagerへ公開する。SceneManagerはStation型を知らず、Interactableとして登録するだけとする。

## 架空デモ

`demo-prep-room`を追加する。

- Demo Companion NPC 1人。
- Raw Item 2個。
- Processing Station 1台。
- 最終PlacePoint 2個。
- 45秒ProcessingTask。
- 35秒PlacementTask。
- Three.js primitiveとrepository所有SVGだけを使う。

Sequence:

```text
set_date
  -> intro dialogue
  -> set_objective: process items
  -> ProcessingTask
  -> dialogue
  -> set_objective: deliver processed items
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

- `phase9-prep-start`
- `phase9-prep-complete`

New Game initial checkpointはPhase 9 startへ変更する。Phase 6-8のCheckpoint、Scene、Phone
contentは削除・renameしない。

complete Checkpointは完成状態用Sceneを復元し、2個のItemをprocessed状態で最終Table上に配置する。
これによりworld snapshotを保存しなくても、クリア後のContinueでraw Itemと無効なStationだけが残る
操作不能状態を避ける。加工タスクを再挑戦する場合はReset ProgressからNew Gameを開始する。

変更禁止:

```text
Game Save: ur-game:save:v1 / { version: 1, checkpointId }
Phone Progress: ur-game:phone-progress:v1 / version 1
```

加工途中・Task途中reloadでは、Station、加工状態、Item transformを復元せず、直前Checkpointから
rawなSceneとresumeSequenceを再構築する。

## 今回実装しないもの

- 新GameEvent、Recipe、複数加工段階、Combine、料理。
- 長押し加工、button mash、Station queue/multi-slot。
- DynamicRigidBody、Rapier sensor。
- score、stars、difficulty、Chapter、Campaign統合。
- Save v2、world snapshot。
- BGM、SE、fade、camera event、GLTF、animation。
- gamepad、touch/mobile polish。
- 実名、実日付、実メッセージ、実写真、実在場所、credential。

## 完成条件

1. ProcessingStationが既存Interactableとして動く。
2. accepted Itemを1個だけ配置できる。
3. E / Space 1回でdeltaTime加工が始まる。
4. progress visualが伸び、完了・resetで消える。
5. Itemがprocessedになり、見た目で判別できる。
6. processed ItemをCarrySystemで回収できる。
7. ProcessingTaskがsuccess/timeoutを既存Task経路で通知する。
8. R RetryでItem・Station・Player・UIがraw開始状態へ戻る。
9. Processing成功後、同じprocessed ItemをPlacementへ引き継ぐ。
10. Placement Retryでもprocessed状態を維持する。
11. 3 Task種別間でID重複をrejectする。
12. Station/Taskの不正定義を起動時にrejectする。
13. EventRunner、TaskManager、PhysicsWorld、InputActionへ固有分岐がない。
14. Phase 6-8のCheckpoint互換を維持する。
15. Game Save v1 / Phone Progress v1を維持する。
16. `npm run build`と`git diff --check`が成功する。
17. public repositoryに個人情報・credentialがない。

## ユーザー向け手動確認

実装エージェントは実施せず、完了報告でユーザーへ依頼する。

1. Reset Progress -> New Gameで`demo-prep-room`を確認。
2. Itemを緑色Stationへ置き、`Process`を1回押す。
3. progress barが伸び、完了後に緑色indicatorが出る。
4. processed Itemを拾い、2個目も同様に加工する。
5. Processing CLEAR後もprocessed表示と現在位置が維持される。
6. 2個を右側Tableへ運び、Placement CLEARを確認。
7. Processing TIME UP -> Rでraw状態から再開する。
8. Placement TIME UP -> Rでprocessed状態のまま安全位置へ戻る。
9. 完走後、Phone AlbumでPhase 9の架空Photoを確認。
10. 加工途中reload -> ContinueでCheckpoint先頭・raw状態から再開する。
11. 完走後reload -> Continueでcomplete Checkpointから再開する。
12. Retry/Continueを繰り返してStation、Item、NPC、Promptが重複しない。
13. WASD、衝突、Pick/Carry/Place、Reach、Phoneの既存回帰を確認する。
