# Phase 3 Review and Phase 4 Specification

Phase 3 baseline commit: `f682cc293d6947995c5174630c18256ec9ae53df`

Phase 3 branch: `feature/phase-3-event-runner`

## Phase 3 review result

Phase 4へ進む前に修正必須のblocking issueはありません。Phase 3は合格として進めてよい状態です。

レビューでは、次の点が確認されました。

- `GameEvent`が`dialogue` / `move_npc` / `task` / `speech` / `wait`のDiscriminated Unionとして分離されている。
- `EventRunner`が`idle` / `running` / `completed` / `cancelled` / `error`をゲームループ駆動で管理している。
- Dialogueはcallback、NPC移動は`isMoving`、Waitはdelta time、Taskは完了通知で待機しており、長時間のPromise chainを使っていない。
- Task Retryではevent indexを戻さず、現在のTaskだけを再試行している。
- `TaskEventBinding`が世界状態の準備を担当し、`EventRunner`はPlayerやItemの具体的なリセット方法を知らない。
- complete / cancel / error時にPlayer・Interaction・NPCの開始前入力状態を復元している。
- `Phase2DemoController`を外し、実行経路を`EventRunner`へ一本化している。
- Rapierの補正済み位置をBodyへ反映する移動修正と、短いWASD入力を入力層で保持する修正も妥当である。

### Non-blocking improvement

`successResultDurationSeconds`が`NaN`または`Infinity`の場合、`success-delay`から抜けられない可能性があります。Phase 4着手時に、有限かつ0以上であることを検証する小さな防御処理を追加してください。現在値`0.9`では問題ありません。大規模な`EventRunner`リファクタリングは不要です。

---

# UR_Game Phase 4 実装仕様

Smartphone UI / Messages / Album / Story Progress

Repository: `https://github.com/Uzy03/UR_Game`

Phase 3基準コミット: `f682cc293d6947995c5174630c18256ec9ae53df`

Phase 3基準ブランチ: `feature/phase-3-event-runner`

推奨作業ブランチ: `feature/phase-4-smartphone`

## 0. 実装前確認

Phase 3の既存コードを十分に読み、次の既存システムを置き換えずに接続してください。

- Three.js / Rapier
- `PlayerController`
- `InputManager` / `KeyboardInput` / `InputAction`
- `InteractionSystem`
- `CarrySystem`
- `PickableItem` / `PlacePoint`
- `NPCController`
- `DialogueManager`
- `TaskManager` / `CountdownTimer` / `PlacementTask`
- `EventRunner` / `EventSequence` / `GameEvent`
- `TaskEventBinding`
- `SpeechBubble` / `DialogueUI` / `TaskHUD` / `ResultOverlay`

実装前に`npm run build`が成功することを確認してください。また、上記の`successResultDurationSeconds`検証を最小限の修正として追加してください。

## 1. Phase 4の目的

ゲーム内スマートフォンの最小基盤を実装します。

```text
Smartphone
├─ Home
│  ├─ 現在の日付
│  └─ 現在の目的
├─ Messages
│  └─ 解放済みメッセージ
└─ Album
   └─ 解放済み写真
```

さらに`EventRunner`から、次の更新をデータ駆動で行えるようにします。

- 日付更新
- 目的更新
- Message解放
- Photo解放

## 2. Phase 4で実装しないもの

今回は次を実装しないでください。

- Matching App、LINE固有デザイン、Map、Save App、Load App、Settings App
- BGM、SE
- `SceneManager`、複数Map、Chapter、Checkpoint
- ゲーム全体のSave / Load
- `EventRunner`途中状態、Player位置、NPC位置、Task途中状態の永続化
- 実際の写真、メッセージ、実名、本番用個人データ
- Push通知、スマートフォン内アニメーションの作り込み
- Gamepad用UIナビゲーション、Touch操作
- 外部JSON読み込み、クラウド同期

Phase 4のコンテンツは、必ず架空のダミーデータにしてください。

## 3. 責務分離

次の境界を維持してください。

```text
EventRunner
    ↓
PhoneProgress
    ↓
PhoneProgressStore

InputManager
    ↓
PhoneController
    ↓
PhoneUI
```

- `EventRunner`: 日付・目的の設定とMessage / Photo IDの解放を`PhoneProgress`へ指示する。DOM、描画、`localStorage`を直接扱わない。
- `PhoneProgress`: 現在の日付、現在の目的、解放済みMessage ID、解放済みPhoto IDを管理する。Three.jsやPlayerを知らない。
- `PhoneProgressStore`: `PhoneProgressSnapshot`の限定的な永続化を担当する。
- `PhoneUI`: DOM表示だけを担当し、ゲーム進行や永続化を行わない。
- `PhoneController`: 開閉、画面遷移、入力ロックを担当する。

## 4. 推奨ディレクトリ

```text
src/
├── phone/
│   ├── PhoneController.ts
│   ├── PhoneProgress.ts
│   ├── PhoneProgressStore.ts
│   ├── PhoneTypes.ts
│   └── PhoneContentRegistry.ts
├── ui/
│   └── phone/
│       └── PhoneUI.ts
├── content/
│   └── demo/
│       ├── phase4PhoneContent.ts
│       └── phase4DemoSequence.ts
├── events/
│   ├── EventRunner.ts
│   └── EventTypes.ts
└── core/
    └── Game.ts
```

軽微な変更は構いません。Appごとに大量のクラスを作ったり、DI frameworkを導入したりしないでください。

## 5. Phone入力

`InputAction`へ次を追加してください。

```ts
Phone
Back
```

キーボード割当は次のとおりです。

```text
F      → Phone
Escape → Back
```

実キーは`KeyboardInput`だけが知る構造を維持し、`PhoneController`で`event.code`を確認しないでください。

## 6. 基本操作

- 通常探索中にFでPhoneを開く。
- Phone表示中にFで閉じる。
- Escapeで1階層戻る。
- HomeでEscapeを押すと閉じる。
- App選択はHTMLの`button`クリックでよい。
- Arrow Key / GamepadのUIナビゲーションは実装しない。

## 7. Phoneを開けるタイミング

`EventRunner`が`running`の間はPhoneを開けないでください。現時点ではTask TimerやNPC移動を含む安全なpause / resume機構がないためです。

Phase 4で`EventRunner`のpause機能を先回り実装しないでください。通常探索状態では開けます。

## 8. Phone表示中の入力ロック

Phoneを開いた瞬間に次を無効化してください。

```text
Player movement      OFF
InteractionSystem    OFF
```

閉じる際は、開く直前の状態へ戻してください。無条件に両方を`true`へ戻さないでください。開始前状態は`PhoneController`が保存します。

`InteractionSystem`自体を止めるため、NPC個別のInteraction状態を変更する必要はありません。

## 9. PhoneControllerの状態とAPI

最低限の画面状態は次のとおりです。

```ts
type PhoneScreen = 'home' | 'messages' | 'album';
```

必要なら`message-thread`や`photo-detail`を追加して構いません。Routerライブラリは不要です。

最低限、次に相当するAPIを持たせてください。

```ts
update(): void;
open(): boolean;
close(): void;
back(): void;
dispose(): void;
get isOpen(): boolean;
```

`open()`は`EventRunner`実行中なら`false`を返してください。強い結合を避けるため、`canOpen: () => boolean`をconstructor dependencyとして渡す方法を推奨します。

## 10. Game Loopとの接続

`PhoneController`の入力処理はPlayer移動より前に行ってください。

```text
InputManager.update
↓
PhoneController.update
↓
NPCController.update
↓
PlayerController.updateBeforePhysics
↓
Physics
↓
PlayerController.updateAfterPhysics
↓
InteractionSystem.update
↓
EventRunner.update
↓
Camera
↓
SpeechBubble
↓
Render
```

Fで開いたフレームからPlayer移動を停止できる順序にします。

## 11. PhoneTypes

最低限、次に相当する型を用意してください。

```ts
interface PhoneObjective {
  readonly id: string;
  readonly text: string;
}

interface PhoneMessageDefinition {
  readonly id: string;
  readonly threadId: string;
  readonly sender: string;
  readonly text: string;
  readonly timeLabel: string;
}

interface PhoneThreadDefinition {
  readonly id: string;
  readonly title: string;
}

interface PhonePhotoDefinition {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly date: string;
}
```

## 12. PhoneContentRegistry

MessageとPhotoの定義データは`PhoneProgress`へ埋め込まず、静的なContent Registryとして管理してください。

```ts
const PHONE_DEMO_CONTENT = {
  threads: [...],
  messages: [...],
  photos: [...],
};
```

最低限`getMessage(id)`、`getPhoto(id)`、`getThread(id)`を提供し、未知のIDを検出できるようにしてください。同一種類でIDが重複する場合は、初期化時に明確なエラーとします。

## 13. PhoneProgress

`PhoneProgress`はゲーム進行に伴って変化するデータだけを持ちます。

```ts
interface PhoneProgressSnapshot {
  readonly version: 1;
  readonly storyDate: string | null;
  readonly currentObjective: PhoneObjective | null;
  readonly unlockedMessageIds: readonly string[];
  readonly unlockedPhotoIds: readonly string[];
}
```

最低限、次の操作を提供してください。

```ts
setStoryDate(...)
setObjective(...)
unlockMessage(...)
unlockPhoto(...)
```

### Unlockの性質

`unlockMessage(id)`と`unlockPhoto(id)`はidempotentにします。同じIDを2回解放しても重複表示せず、エラーにしません。ただし存在しないIDは成功扱いにせず、`EventRunner`が失敗を判定できるAPIにしてください。

### 日付

`storyDate`は`YYYY-MM-DD`形式とし、文字列形式だけでなく実在する日付であることを検証してください。外部date libraryは不要です。

### Current Objective

現在の目的は1つだけ保持します。

```ts
{
  id: 'demo-objective',
  text: 'Help the character with the delivery.',
}
```

`null`で目的を消せるようにします。Quest一覧や完了履歴は作りません。

## 14. PhoneProgressStore

`localStorage`で`PhoneProgress`だけを永続化してください。

Storage key例:

```text
ur-game:phone-progress:v1
```

保存対象は次だけです。

- `storyDate`
- `currentObjective`
- unlocked Message IDs
- unlocked Photo IDs

Player位置、`EventRunner`状態、Task状態などは保存しません。これはゲーム全体のSave機能ではありません。

### エラー処理

次の状況でゲーム全体をクラッシュさせないでください。

- `localStorage` unavailable
- JSON parse failure
- schema不整合
- version不一致
- 古いデータ内の未知Message / Photo ID

壊れたデータは安全な初期状態へfallbackし、unknown IDは読み込み時に除去します。必要なら`console.warn`を1回だけ出して構いません。

### 保存タイミング

`setStoryDate`、`setObjective`、`unlockMessage`、`unlockPhoto`の変更直後に保存します。毎フレーム書き込まないでください。

## 15. Home画面

最低限、次を表示してください。

- Date
- Current Objective
- Messagesボタン
- Albumボタン

日付またはObjectiveが未設定なら、`No current date` / `No current objective`等の安全な表示にしてください。

## 16. Messages画面

- 解放済みMessageだけを表示する。
- 未解放MessageをDOMへ生成して隠すのではなく、一覧自体へ出さない。
- Messageを`threadId`でまとめられる構造にする。
- Phase 4のダミーデータは1 threadでもよい。
- 本番のLINE風デザインは不要で、「チャットUIとして読める」程度にする。

## 17. Album画面

解放済みPhotoだけを表示し、最低限次を扱ってください。

- thumbnail
- caption
- date
- alt

Photoクリック時の簡易detail画面は任意です。画像viewerライブラリは導入しません。

## 18. デモ画像と個人情報

実際の個人写真や個人情報は絶対にコミットしないでください。`public/demo/`等へ架空のSVGまたは簡単なデモ画像を1〜2枚置き、写真機能だけを確認します。既存READMEの個人情報・public build方針を維持してください。

## 19. PhoneUI

`PhoneUI`はDOM表示を担当し、最低限次に相当するAPIを持ちます。

```ts
show()
hide()
renderHome(...)
renderMessages(...)
renderAlbum(...)
dispose()
```

ゲーム状態を保存せず、`localStorage`へ直接アクセスしないでください。

Message本文、caption、objective等の文字列は`textContent`等を使用し、`innerHTML`へ直接埋め込まないでください。

## 20. Phone DOMと見た目

`index.html`へ最小限のPhone用コンテナを追加してください。

```html
<section id="phone-overlay" hidden>
  <div class="phone-shell" role="dialog" aria-modal="true">
    <header>
      <button data-phone-back>Back</button>
      <div data-phone-title></div>
      <button data-phone-close>Close</button>
    </header>
    <main data-phone-screen></main>
  </div>
</section>
```

細部は変更して構いません。React等は導入しません。

見た目は、小さく丸みのある明るいPhoneをゲーム画面上へ表示し、背景を少し暗くする程度で十分です。最終デザインは作り込まず、既存ゲームのassetやUIをコピーしないでください。

## 21. EventRunner拡張

既存5 Eventへ、次の4種類だけを追加してください。

```ts
interface SetDateEvent {
  readonly type: 'set_date';
  readonly date: string;
}

interface SetObjectiveEvent {
  readonly type: 'set_objective';
  readonly objective: PhoneObjective | null;
}

interface UnlockMessageEvent {
  readonly type: 'unlock_message';
  readonly messageId: string;
}

interface UnlockPhotoEvent {
  readonly type: 'unlock_photo';
  readonly photoId: string;
}
```

これらを既存`GameEvent` unionへ追加します。これ以上Event型を増やさないでください。

### EventRunnerとPhoneProgressの境界

`EventRunner`へ`PhoneUI`を渡さず、`phoneProgress`または同等の最小interfaceだけを渡してください。

```text
set_date       → PhoneProgress.setStoryDate()
set_objective  → PhoneProgress.setObjective()
unlock_message → PhoneProgress.unlockMessage()
unlock_photo   → PhoneProgress.unlockPhoto()
```

4 Eventはすべて即時完了Eventとします。

### Error

次は`EventRunner`を`error`へ移行させてください。

- 不正date
- 存在しない`messageId`
- 存在しない`photoId`
- 不正objective data

既存の`sequenceId`、`eventIndex`、`eventType`、`message`を持つ`lastError`方針を維持し、silent skipしないでください。

### Cleanup

`PhoneProgress`への変更は`EventRunner.cancel()`時に巻き戻しません。トランザクションやrollback機構は実装しないでください。Phone UI自体は`EventRunner`と独立させます。

## 22. Demo Content

実名や実際の出来事を使わない架空データを用意してください。

```ts
threads: [
  {
    id: 'demo-helper-thread',
    title: 'Helper',
  },
]

messages: [
  {
    id: 'demo-message-1',
    threadId: 'demo-helper-thread',
    sender: 'Helper',
    text: 'Thanks for helping today!',
    timeLabel: '18:30',
  },
]

photos: [
  {
    id: 'demo-photo-1',
    src: '/demo/demo-photo-1.svg',
    alt: 'Demo landscape illustration',
    caption: 'A demo memory',
    date: '2026-01-01',
  },
]
```

## 23. Phase 4 Demo Sequence

Phase 3の既存demoを置き換えるか、Phase 4版として新設してください。

```text
set_date
↓
set_objective
↓
dialogue
↓
unlock_message
↓
move_npc
↓
speech
↓
wait
↓
task
↓
unlock_photo
↓
set_objective(null)
↓
speech
↓
wait
↓
outro dialogue
```

具体例:

```ts
{
  type: 'set_date',
  date: '2026-01-01',
},
{
  type: 'set_objective',
  objective: {
    id: 'demo-delivery',
    text: 'Help with the delivery.',
  },
},
{
  type: 'unlock_message',
  messageId: 'demo-message-1',
},
// Existing Phase 3 events...
{
  type: 'unlock_photo',
  photoId: 'demo-photo-1',
},
{
  type: 'set_objective',
  objective: null,
},
```

## 24. Demo確認フロー

起動直後:

```text
F → Phone opens → Home → Messages empty → Album empty → Phone close
```

その後NPCへTalkしてPhase 4 Demo Sequenceを完了します。完了後は次を確認できるようにしてください。

```text
F → Phone → Date updated → Objective cleared
  → Messagesにdemo-message-1 → Albumにdemo-photo-1
```

Demo完了後にreloadし、Phoneを開いた際にstory date、unlocked Message、unlocked Photoが残ることを確認します。Player位置、NPC位置、`EventRunner`完了状態が保存されないのは意図した仕様です。

## 25. EventRunnerとの排他

- `EventRunner`実行中にFを押してもPhoneを開かない。
- Phone表示中は`InteractionSystem`がOFFなのでNPC Talkを開始できない。
- Phoneと`EventRunner`を同時にactiveにしない。
- pause / resume systemは作らない。

## 26. Focusとdispose

可能であれば、Phoneを開いたときにCloseまたはHomeのbuttonへfocusし、閉じたらrenderer canvasへfocusを戻してください。高度なfocus trap libraryは不要です。

`PhoneController` / `PhoneUI` / `PhoneProgressStore`がDOM Event Listener等を登録する場合は`dispose()`で解除してください。`Game.dispose()`から`PhoneController.dispose()`を呼びます。`dispose()`時に`localStorage`データを消してはいけません。

## 27. Game.tsとの接続

`Game.ts`は次の組み立てに留めてください。

- `PhoneContentRegistry`生成
- `PhoneProgressStore`生成
- `PhoneProgress`生成
- `PhoneUI`生成
- `PhoneController`生成
- `EventRunner`へ`PhoneProgress`を渡す

Messages / Album描画の詳細や、具体的なダミーMessage / Photoを`Game.ts`へ書かないでください。必要なら`createPhoneSubsystem(...)`のような小さなfactoryを別ファイルへ切り出して構いません。DI frameworkは不要です。

## 28. Phase 3互換性

Phase 4実装後も次を壊してはいけません。

- WASD移動、カメラ追従、Rapier衝突
- Pick / Carry / Place
- NPC Talk、Dialogue、NPC move、Speech、Wait
- PlacementTask、TIME UP、R Retry、CLEAR、Outro
- 通常探索への復帰

## 29. 完成条件

### Phone Core

- FでPhoneを開閉できる。
- Escapeで戻り、Homeでは閉じる。
- Phone表示中はPlayerが動かず、Interactionできない。
- 閉じると元の入力状態へ戻る。
- `EventRunner`実行中はPhoneを開けない。

### Home

- story dateとcurrent objectiveを表示できる。
- 未設定状態を安全に表示できる。

### Messages

- 解放済みMessageだけ表示される。
- 未解放Messageは表示されない。
- `threadId`構造を保持する。
- unknown Message IDを検出できる。

### Album

- 解放済みPhotoだけ表示される。
- demo画像を表示できる。
- `alt` / `caption` / `date`を扱える。
- unknown Photo IDを検出できる。

### Progress

- `unlockMessage` / `unlockPhoto`がidempotentである。
- `setStoryDate` / `setObjective`が動作する。
- `localStorage`へ保存し、reload後に復元する。
- 壊れたstorageでもゲームが起動する。

### EventRunner

- `set_date` / `set_objective` / `unlock_message` / `unlock_photo`が動作する。
- 4 Eventは即時完了する。
- unknown IDまたは不正dateは`EventRunner`のerrorになる。
- 既存5 Eventが従来どおり動く。

### Architecture / Build

- `EventRunner`がDOMや`localStorage`を操作していない。
- `PhoneUI`が`localStorage`を操作していない。
- `PhoneProgress`がPlayerを操作していない。
- `PhoneController`へ実キーコードを書いていない。
- `Game.ts`へMessage / Photo描画ロジックを書いていない。
- 実際の個人データをコミットしていない。
- React等を追加していない。
- `npm run build`が成功する。

## 30. 手動ブラウザテスト

### 起動直後

```text
WASD移動
↓
FでPhone open
↓
WASDを押しても動かない
↓
Messagesは空
↓
Albumは空
↓
Escapeで戻り、FまたはEscapeで閉じる
↓
再びWASDで動ける
```

### Event Sequence

```text
NPC Talk
↓
Phase 4 sequence開始
↓
実行中Fを押してもPhoneが開かない
↓
Dialogue → NPC move → Task
↓
TIME UP → R Retry → CLEAR
↓
sequence完了
```

### Phone Progress

Sequence完了後にPhoneを開き、Date、demo Message、demo Photoを確認してください。

### Persistence

reload後もDate、Message、Photoが残ることを確認してください。

### Storage Error

DevToolsで不正JSONを`localStorage`へ入れてreloadし、クラッシュせずsafe defaultへfallbackすることを確認してください。

## 31. 実装後の報告項目

- Branch名、Commit SHA
- 追加・変更ファイル一覧
- `PhoneController` / `PhoneProgress` / `PhoneProgressStore`の責務
- `PhoneContentRegistry` / `PhoneUI`の構造
- Phone開閉時の入力ロックと`EventRunner`との排他方法
- 追加した`GameEvent` 4種類
- Message / Photo解放処理
- `localStorage`保存形式とstorage破損時のfallback
- Phase 4 Demo Sequence全文
- 実データを入れていないことの確認
- `npm run build`結果
- 手動ブラウザテスト結果
- console error / warnの有無
- Phase 5へ残した課題

## 32. Phase 5へ進む際の注意点

Phase 4では完全なゲームSave / Loadを作らないことが重要です。現時点ではChapter、Scene、Map、Checkpointという安定した進行ID体系がないため、Player / NPC / Item / Task / Eventのどこまでを保存するか決められません。

Phase 5では、`SceneManager`、複数ステージ、ChapterまたはCheckpoint ID、正式なSave / Load境界を作る方向が自然です。

Phase 4の`PhoneProgressSnapshot`は、将来のSaveDataの一部分として取り込める設計にしてください。ただしPhase 4で将来のSaveData全体を定義しないでください。
