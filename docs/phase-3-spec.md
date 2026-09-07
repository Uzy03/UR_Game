# Phase 2 Review and Phase 3 Specification

Phase 2 baseline commit: `7f57302130f176987fda62bd8bbc910b18d01dd9`

Phase 2 branch: `feature/phase-2-game-systems`

## Phase 2 review result

Phase 3へ進んで問題ありません。重大な修正必須項目はありません。

Phase 3で追加すべき小さな境界は次の2点です。

- `NPCController.moveTo()`の完了を外部から確認するため、`isMoving`相当のreadonly APIを追加する。
- `TaskManager`のfinished handlerは1個だけなので、`Phase2DemoController`と`EventRunner`を同時に稼働させない。

---

# UR_Game Phase 3 実装仕様

Repository: `https://github.com/Uzy03/UR_Game`

Phase 2基準コミット: `7f57302130f176987fda62bd8bbc910b18d01dd9`

Phase 2ブランチ: `feature/phase-2-game-systems`

Phase 3では、このPhase 2を基盤として、**EventRunner + データ駆動イベント列**を実装してください。

推奨作業ブランチ: `feature/phase-3-event-runner`

## 0. 実装前に必ず確認すること

まず既存コードを十分に読んでください。

Phase 2ではすでに以下が実装されています。

- PlayerController
- InteractionSystem
- CarrySystem
- PickableItem
- PlacePoint
- NPCController
- DialogueManager
- DialogueUI
- Task / TaskManager
- PlacementTask
- CountdownTimer
- TaskHUD
- ResultOverlay
- SpeechBubble
- InputManager / InputAction
- Phase2DemoController
- Exploration / Dialogue / PlayingTask / Result相当の操作制御
- 完全なRetry処理

Phase 3ではこれらを書き直すのではなく、既存SubsystemをEventRunnerから順番に呼べるようにする層を追加してください。

まず現在の状態で、`npm run build`が成功することを確認してください。

## 1. Phase 3の目的

現在は`Phase2DemoController`がコードで、NPCへ話しかける→Dialogue→Task開始→Success / Failure→Retryという順序を管理しています。

Phase 3では、この順序をコードから切り離します。最終的に以下のようなデータだけでイベントを記述できるようにしてください。

```ts
const demoSequence = {
  id: 'phase-3-demo',
  events: [
    {
      type: 'dialogue',
      sequence: {
        id: 'intro',
        lines: [
          { speaker: 'Helper', text: 'Could you help me?' },
          { speaker: 'Helper', text: 'Follow me.' },
        ],
      },
    },
    {
      type: 'move_npc',
      npcId: 'helper-npc',
      position: { x: -1.35, y: 0.87, z: 5.5 },
    },
    {
      type: 'speech',
      npcId: 'helper-npc',
      text: 'Let’s do it!',
      durationSeconds: 1.5,
    },
    { type: 'wait', durationSeconds: 0.5 },
    { type: 'task', taskId: 'counter-delivery' },
    {
      type: 'speech',
      npcId: 'helper-npc',
      text: 'We did it!',
      durationSeconds: 2.5,
    },
    { type: 'wait', durationSeconds: 2.5 },
    {
      type: 'dialogue',
      sequence: {
        id: 'outro',
        lines: [{ speaker: 'Helper', text: 'Thanks for helping!' }],
      },
    },
  ],
};
```

重要なのは、イベント内容を変更してもEventRunner本体を書き換える必要がないことです。

## 2. 今回実装するイベント型

Phase 3では種類を増やしすぎず、以下の5種類だけを実装してください。

- DialogueEvent
- MoveNpcEvent
- TaskEvent
- SpeechEvent
- WaitEvent

Discriminated Unionを使用してください。

```ts
export type GameEvent =
  | {
      readonly type: 'dialogue';
      readonly sequence: DialogueSequence;
    }
  | {
      readonly type: 'move_npc';
      readonly npcId: string;
      readonly position: Vector3Config;
    }
  | {
      readonly type: 'task';
      readonly taskId: string;
    }
  | {
      readonly type: 'speech';
      readonly npcId: string;
      readonly text: string;
      readonly durationSeconds: number;
    }
  | {
      readonly type: 'wait';
      readonly durationSeconds: number;
    };

interface EventSequence {
  readonly id: string;
  readonly events: readonly GameEvent[];
}
```

## 3. EventRunner

`src/events/EventRunner.ts`を新設してください。

EventRunnerの責務は、EventSequenceを受け取り、現在のeventを開始し、完了するまで待ち、次のeventへ進み、最後まで到達したらsequence完了とすることだけです。

ストーリー内容そのものをEventRunnerへ書かないでください。

## 4. Promiseでゲームループを止めない

以下のような実装は避けてください。

```ts
await waitUntilNpcArrives();
await dialogue();
await task();
```

ゲーム進行の中心を長時間のPromise chainにせず、`eventRunner.update(deltaSeconds)`を毎フレーム呼び、ゲームループ上の状態として完了を待ってください。cancel、retry、将来のsave/loadとの状態同期を明確に保つためです。

## 5. EventRunnerの状態

最低限、`idle`、`running`、`completed`、`cancelled`、`error`を管理してください。

外部から以下を確認できるようにしてください。

```ts
runner.state
runner.currentSequenceId
runner.currentEventIndex
runner.lastError
```

巨大なState Machine Frameworkは導入しないでください。

## 6. EventRunner API

最低限、以下に相当するAPIを持たせてください。

```ts
start(sequence): boolean
update(deltaSeconds): void
cancel(): void
reset(): void
dispose(): void
```

実行中の`start()`は現在のsequenceを破棄せず`false`を返してください。新しいsequenceを始めるには明示的に`cancel()`してください。

## 7. Dialogueイベント

イベント開始時に`DialogueManager.start(sequence, onComplete)`を利用してください。EventRunnerはDialogue中、`input.consumeActionPress(InputAction.Interact)`をDialogueManagerへ渡してください。

Dialogue完了callbackが呼ばれたらイベントを完了し、次へ進んでください。空のDialogueSequenceが同期的に完了しても状態が壊れないようにしてください。

## 8. move_npcイベント

既存の`NPCController.moveTo(position)`を利用してください。NPCControllerへ最小限の`get isMoving(): boolean`相当を追加し、EventRunnerは`isMoving === false`になるまで毎フレーム待ってください。

NPCControllerへPromiseやストーリー処理を追加しないでください。

## 9. NPC ID解決

EventデータにはNPCオブジェクトではなく`npcId`を入れてください。EventRunnerへ`ReadonlyMap<string, NPCController>`相当のRegistryを渡してください。

存在しないNPC IDは無視せずエラーにしてください。

## 10. speechイベント

既存SpeechBubbleを利用し、`SpeechBubble.show(...)`後にイベント自体は即完了させて構いません。表示終了を待ちたい場合は、データ側でspeechの次にwaitを記述してください。

## 11. waitイベント

`setTimeout`は使用せず、EventRunner内部で`remainingSeconds -= deltaSeconds`してください。0以下で完了です。

負数・NaN・Infinityなどの不正durationはエラーまたは安全な値として扱い、silent failureを避けてください。

## 12. Taskイベント

Taskイベントは`taskId`だけをEventSequenceに持たせ、Taskオブジェクトを埋め込まないでください。

```ts
{ type: 'task', taskId: 'counter-delivery' }
```

## 13. Task Binding

Phase2DemoControllerにある世界のリセット処理をEventRunnerへハードコードしないでください。

```ts
interface TaskEventBinding {
  readonly task: Task;
  prepareAttempt(): void;
}
```

EventRunnerには`ReadonlyMap<string, TaskEventBinding>`を渡してください。`prepareAttempt()`はそのタスクを1回開始できる世界状態へ戻します。

EventRunner自身はPlayer開始位置、戻すアイテム、空にするPlacePointを知ってはいけません。

## 14. 既存PlacementTaskのBinding

Phase 3ダミーデモではPhase 2の`counter-delivery`を利用してください。Bindingの`prepareAttempt()`で、以下を含む必要な状態を戻してください。

- CarrySystem.reset()
- PlacePoint.reset()
- PickableItem.reset()
- PlayerController.reset()
- InteractionSystem.reset()
- ResultOverlay.hide()
- SpeechBubble.hide()

TaskManagerのreset/startはEventRunner側で統一して管理してください。

## 15. Task開始

Taskイベント開始時は以下の順序にしてください。

```text
TaskManager.reset
→ binding.prepareAttempt()
→ TaskManager.start(binding.task)
→ TaskHUD表示
→ ゲーム操作ON
```

Task中は既存の移動、Pick up、Carry、Place、Dropを利用可能にしてください。

## 16. Task成功待ち

Taskイベント中はEventRunnerが`TaskManager.update(deltaSeconds)`を呼んでください。成功時はCLEARを0.8〜1.0秒程度表示し、この時間もdeltaTimeで管理してください。

その後、ResultOverlayとTaskHUDを非表示にし、task eventを完了して次へ進んでください。

## 17. Task失敗とRetry

時間切れ時はTIME UPと`R : Retry`を表示し、プレイヤー移動とInteractionをOFFにしてください。

`InputAction.Retry`が押されたら以下を実行し、同じtaskイベントだけを最初から再実行してください。

```text
TaskManager.reset
→ binding.prepareAttempt()
→ TaskManager.start(task)
→ ResultOverlay hide
→ TaskHUD表示
→ 操作ON
```

EventSequenceのevent indexを先頭へ戻してはいけません。

## 18. CountdownTimerとの境界

EventRunnerはCountdownTimerを直接操作しないでください。

```text
EventRunner → TaskManager → Task → CountdownTimer
```

の境界を維持してください。

## 19. TaskManagerとの境界

Phase 3ではEventRunnerがTaskManagerのfinished handlerの所有者になります。Phase2DemoControllerとEventRunnerを同時に接続しないでください。EventRunner.dispose時にはhandlerを解除してください。

## 20. Phase2DemoControllerとの境界

Phase 3ではGame.tsからPhase2DemoControllerの実行を外してください。EventRunnerと同時に稼働させてはいけません。

Phase2DemoControllerの順序制御をEventRunnerへハードコードせず、イベントデータへ移してください。Phase2DemoController自体は参考用に残すか削除するか、どちらでも構いません。

## 21. 入力ロック

イベント別に以下を制御してください。

| 状態 | Player movement | InteractionSystem |
|---|---:|---:|
| Dialogue | OFF | OFF |
| Move NPC | OFF | OFF |
| Wait | OFF | OFF |
| Task running | ON | ON |
| Task failure Result | OFF | OFF |
| Sequence complete / cancel / error | ON | ON |

EventRunner固有ロジックをPlayerControllerやInteractionSystem内部へ入れず、既存の`setMovementEnabled()`と`setEnabled()`を利用してください。

## 22. NPC Interaction制御

EventSequence実行中にNPCへ再度Talkして同じsequenceを二重起動しないようにしてください。Task中はInteractionSystemがONですが、story NPCのInteractionは不要です。

必要ならNPCControllerへ`isInteractionEnabled`相当のreadonly getterを追加し、EventRunner開始前の状態を保存して完了・cancel・error時に復元してください。

## 23. Cancel

`cancel()`時には最低限、以下を行ってください。

- DialogueManager.close()
- 移動中NPC.stop()
- TaskManager.reset()
- TaskHUD.hide()
- ResultOverlay.hide()
- SpeechBubble.hide()
- EventRunner内部タイマー解除
- Player操作復元
- InteractionSystem復元
- NPC Interaction状態復元

世界全体をsequence開始位置へ戻すWorld Snapshotは不要です。

## 24. Reset

`reset()`はcancel処理に加えてEventRunner内部状態をidleへ戻す程度で構いません。汎用World Snapshotは実装しないでください。

Task RetryはTaskEventBindingの`prepareAttempt()`で保証してください。

## 25. エラー処理

以下をsilent skipしないでください。

- 不明なnpcId
- 不明なtaskId
- 不正なwait duration
- 不正なNPC座標
- 実行不可能なevent type
- 必須dependency不足

EventRunnerを`error`へ移し、`lastError`からsequence ID、event index、event type、messageが分かるようにしてください。

エラー時はcancel相当のcleanupを行ってゲーム操作を復元してください。`any`は使用せず、catchでは`unknown`を扱ってください。

## 26. Sequence完了

最後のevent完了時は`completed`へ移し、Dialogue、TaskHUD、ResultOverlayを閉じ、Player操作とInteractionSystemをONにし、NPC interaction状態を復元してください。

過度なEventEmitterを使わず、簡単な完了callbackを用意して構いません。

## 27. Phase 3ダミーシーケンス

Phase 2のダミーゲームを必ずイベント列として再構築してください。

```text
NPCへTalk
→ EventRunner.start()
→ dialogue
→ move_npc
→ speech
→ wait
→ task
→ speech
→ wait
→ dialogue
→ sequence complete
```

具体的には以下を確認できるようにしてください。

1. NPCへ話しかける
2. 2〜3行会話
3. NPCがカウンター付近へ歩く
4. 「Let’s do it!」吹き出し
5. 少し待つ
6. Phase 2の45秒PlacementTask
7. 成功後「We did it!」
8. 少し待つ
9. 1行程度の終了会話
10. explorationへ戻る

## 28. NPC TalkはTriggerでありEventではない

NPC interaction handlerから`eventRunner.start(demoSequence)`を呼び、TriggerとSequenceを分離してください。NPCへ話しかけること自体をEvent型にしないでください。

将来別Triggerから同じEventRunnerを呼べるようにしますが、Phase 3ではTrigger Frameworkを作らないでください。

## 29. 推奨ディレクトリ

```text
src/
├── events/
│   ├── EventTypes.ts
│   ├── EventRunner.ts
│   └── TaskEventBinding.ts
├── content/
│   └── demo/
│       └── phase3DemoSequence.ts
├── core/
│   └── Game.ts
├── dialogue/
├── npc/
├── task/
├── interaction/
└── ...
```

Eventごとに大量のExecutorクラスは作らず、EventRunner内部を`beginEvent()`、`updateCurrentEvent()`、`completeCurrentEvent()`程度に分割すれば十分です。

## 30. Game.ts

Game.tsはsubsystem生成、registry生成、EventRunner生成、game loop、lifecycle程度に留めてください。

イベント内容は`phase3DemoSequence.ts`などへ置いてください。Retryに必要なworld reset処理はTaskEventBinding生成部分へ閉じ込めてください。

## 31. Game Loop

概念的に以下を維持してください。

```text
InputManager.update
→ NPCController.update
→ Player before physics
→ PhysicsWorld.step
→ Player after physics
→ InteractionSystem.update
→ EventRunner.update
→ FollowCamera.update
→ SpeechBubble.update
→ render
```

NPC movement更新、到着検出、Interaction入力の二重消費防止、Dialogue中のInteraction停止、Task中のInteraction有効化を保証してください。

## 32. 入力の二重処理

Phase 2の`consumeActionPress()`を維持してください。DialogueがInteractを消費したフレームでInteractionSystemが同じ入力を使用してはいけません。キーコードをEventRunnerへ直接書かないでください。

## 33. Phase 3では実装しないもの

以下は実装しないでください。

- SceneManager
- 複数Map
- Chapterシステム
- Save / Load
- Smartphone
- Matching App
- LINE
- Photo Album
- 実写写真
- 日付システム
- BGM / SE
- Camera演出イベント
- Player自動移動
- Fade in / Fade out
- Scene transition
- 条件分岐
- Choice / Branching Story
- Event parallel execution
- Event goto / label
- Loop event
- Trigger framework
- Quest system
- Inventory
- World Snapshot
- JSON schema library
- 外部JSON読み込み
- Script language
- Gamepad / Touch
- NavMesh / Pathfinding

Phase 3では一本道のイベント列を順番に確実に実行することだけに集中してください。

## 34. 完成条件

### EventRunner

1. EventSequenceをstartできる
2. eventを先頭から順番に実行する
3. currentEventIndexを管理できる
4. 最後まで行くとcompletedになる
5. 実行中の二重startを拒否する

### Dialogue

6. dialogue eventでDialogueManagerが開始する
7. E / Spaceで進む
8. 最終行まで次eventへ進まない
9. 会話中Playerが動かない
10. 会話中Interactionできない

### NPC

11. move_npcでID指定したNPCが移動する
12. NPC到着まで次eventへ進まない
13. 不明npcIdでerrorになる

### Speech / Wait

14. speechでNPC頭上に吹き出しが出る
15. speech自体は即completeする
16. waitとの組み合わせで表示時間を作れる
17. waitがdeltaTimeで待つ
18. setTimeoutを使わない
19. 不正durationを安全に処理する

### Task

20. taskIdからTaskBindingを取得できる
21. Task開始前にprepareAttemptが呼ばれる
22. 既存PlacementTaskを利用できる
23. Task中はPlayerが操作できる
24. Task中はPick/Carry/Placeが動く
25. Task成功までeventが完了しない
26. CountdownTimerを直接操作しない

### Failure / Retry

27. 時間切れでTIME UPになる
28. Result中はPlayerが動かない
29. RでRetryできる
30. 同じtask eventだけ再開する
31. Dialogue等へevent indexが戻らない
32. Item・PlacePoint・Carry・Playerが開始状態へ戻る
33. タイマーが最初から始まる

### Completion

34. Success後CLEAR表示が出る
35. 少し表示した後次eventへ進む
36. Sequence最後まで進める
37. 完了後通常操作へ戻る

### Cancel / Error

38. cancelで安全に停止できる
39. Dialogueが閉じる
40. NPC movementが止まる
41. Taskがresetされる
42. UIが残らない
43. Player操作が復元される
44. Interactionが復元される
45. NPC Interaction状態が復元される
46. 不明taskIdでerrorになる
47. lastErrorから原因を確認できる

### Architecture

48. Phase2DemoControllerとEventRunnerが同時稼働しない
49. Event順序がGame.tsにハードコードされていない
50. Event内容がEventRunnerにハードコードされていない
51. DialogueManagerにEventRunner固有処理がない
52. NPCControllerにストーリー処理がない
53. TaskManagerにストーリー処理がない
54. CountdownTimerにEventRunner処理がない
55. `any`を安易に使わない
56. `npm run build`が成功する
57. Phase 1・Phase 2機能の回帰がない

## 35. 手動確認

ブラウザで最低限、以下を1回通してください。

```text
NPCへ近づく
→ Talk
→ Dialogue
→ NPC移動
→ Speech
→ Task
→ 意図的に時間切れ
→ RでRetry
→ Task成功
→ Speech
→ Outro Dialogue
→ 通常操作へ戻る
```

加えて以下も確認してください。

- Task成功を最初から狙う経路
- Dialogue中にWASDを押す
- Dialogue中にE長押し
- Result中にWASDを押す
- 実行中に再度NPCへTalkしようとする
- Retry後にアイテムとPlacePointが完全に戻っているか

## 36. 実装後の報告

完了後、以下を必ず報告してください。

1. 追加・変更ファイル一覧
2. EventRunnerの責務
3. GameEventの型一覧
4. EventSequenceのデータ構造
5. Dialogue完了をどう待っているか
6. NPC到着をどう待っているか
7. Task完了をどう待っているか
8. Task Failure / Retryをどう処理しているか
9. Input lockをどう管理しているか
10. Phase2DemoControllerをどう扱ったか
11. TaskEventBindingの設計
12. cancel / reset時のcleanup内容
13. Error処理の方法
14. Phase 3ダミーsequence全文
15. `npm run build`結果
16. 手動ブラウザテスト結果
17. Phase 4へ進む際に必要になる拡張点

既存コードにPhase 3とは無関係な問題を発見しても、大規模リファクタリングは行わないでください。

Phase 3の最終目的は、**Dialogue・NPC移動・Taskなどをコード上の順序ではなく、データとして並べるだけでゲームイベントを構成できる状態を作ること**です。
