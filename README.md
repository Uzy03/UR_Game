# Anniversary Game — Phase 15

交際1周年記念の短編3Dゲームに向けた、Webブラウザ用のゲーム基盤です。Phase 15では、NPC名・Objective・Task HUDを含むCampaign上の物語表示を、Git管理外のローカルJSONから差し替えられる状態までprivate content境界を完成させています。

## 実行

```bash
npm install
npm run dev
```

型チェックを含む本番ビルドは`npm run build`、Phase 15のブラウザ非依存検証は`npm run validate:phase15`、ビルド結果の確認は`npm run preview`で行えます。

## 操作

- `W` / `A` / `S` / `D`: 移動
- `E` / `Space`: 話す・会話を進める・アイテムを拾う／置く
- `R`: 時間切れ画面からタスクをリトライ
- `F`: 通常探索中にスマートフォンを開く／閉じる
- `Escape`: スマートフォン内で戻る。Homeでは閉じる
- `Sound On` / `Sound Off`: 画面右上のボタンでsession中のBGMとSEをMute

起動時のStart Menuで`New Game`を選ぶと、架空の`campaign-bedroom`から始まります。Phone Storyを起点にCafe、Park、Preparation Space、Viewpoint、Ending Roomを順に巡り、Placement、Reach、Processing、Assemblyを一つの物語として体験します。Campaignは6つの安全なCheckpointと段階的なMessage／Photo解放を持ちます。

任意の`public/private/campaign-story.json`が存在すると、ゲーム構造を変えずにCampaignのストーリー本文、NPC名、Objective、Task HUDを差し替えます。private写真は`/private/photos/`配下だけを許可します。設定方法と公開時の注意は[`docs/private-content.md`](docs/private-content.md)を参照してください。ファイルがなければ公開の架空ストーリーを使用し、存在するファイルが不正な場合は画面上の起動エラーで停止します。

各Segmentへ移る前には、架空の日付・タイトル・場所を持つTransition Cardが約2秒表示されます。表示は自動で完了し、skip用の新しい入力はありません。CSSだけで暗転するためThree.jsの描画パイプラインは変更していません。

New Gameのユーザー操作後にMain BGMが始まり、Transition CardとMemory解放には短いSE、Endingには専用BGMとchimeを使用します。ブラウザのautoplay制約で再生が拒否されてもゲームを停止せず、次の`pointerdown`または`keydown`までBGM要求を保持します。再生は共有Web Audio Contextを使い、短いBGM素材もサンプル精度で途切れにくくloopします。

`Continue`はPlayer座標やTask途中状態を復元せず、最後の安全なCheckpointが定義するScene・Phone進行・再開イベント列から再構築します。`Reset Progress`はGame SaveとPhone進行を初期化します。

通常Phone表示中は移動とInteractionが停止します。`EventRunner`実行中は通常Phoneを開けません。`phone_story` EventだけはEventRunner所有のStory Phoneを開き、カード上のHTMLボタンが押されるまで進行を待ちます。Story Phoneは`F`や`Escape`では閉じられません。

## ゲームループ

各フレームは次の順番で処理します。

1. 入力ソースを更新し、移動方向へ集約する
2. Phone入力を処理し、必要ならそのフレームからゲーム入力を止める
3. 現在SceneのNPCを更新する
4. プレイヤーがRapierへ移動要求を送る
5. 物理ワールドを進め、解決後の座標へ描画モデルを同期する
6. インタラクションとEventRunnerを更新する
7. EventRunnerから独立したAudio fadeを更新する
8. 追従カメラとNPC吹き出しを更新する
9. Three.jsで描画する

バックグラウンド復帰時の大きな移動を避けるため、1フレームの `deltaTime` には上限を設けています。

## 設計の境界

- `Game`: 初期化、ライフサイクル、ゲームループ、リサイズ
- `KeyboardInput`: DOMのキーボードイベントを方向入力へ変換
- `InputManager`: 複数の入力ソースを統合し、長さ1以内へ正規化
- `PhysicsWorld`: Rapierの初期化、静的コライダー、物理ステップ、Scene所有Bodyの削除ハンドル
- `KinematicCharacter`: RapierのCharacter Controllerによる補正移動
- `PlayerController`: 抽象化された移動入力を物理移動と向きへ反映
- `InteractionSystem`: プレイヤー前方の操作対象選択、Action入力、ハイライト、操作ヒント
- `CarrySystem`: 1個だけの保持状態、安全な床ドロップ、現在Sceneへの再binding
- `PickableItem`: 加工状態とactive状態を独立して持つ、種類に依存しない持ち運び可能アイテム
- `PlacePoint`: 空き・配置済み状態と、台への配置・再取得
- `ProcessingStation`: 1個のItemの配置、deltaTime加工、進捗表示、加工済みItemの再取得
- `AssemblyStation`: 2個の入力Item、deltaTime組立、入力の無効化、完成Itemの有効化と再取得
- `FollowCamera`: プレイヤーとは独立したスムーズ追従
- `Stage`: Scene定義から表示物と静的コライダーを構築し、所有Resourceを破棄
- `SceneContentRegistry`: Scene定義のID解決と静的検証
- `SceneRuntime`: 1つのSceneに属するStage・NPC・Task Bindingの実体とcleanup
- `SceneManager`: Scene Runtimeの同期生成・交換・破棄とglobal systemの再binding
- `NPCController`: NPCの表示、Interactable対応、直線移動、向き制御、明示的なcleanup
- `DialogueManager`: データで渡された会話の現在行と終了を管理
- `TaskManager`: 実行中タスクと完了通知を管理
- `PlacementTask`: アイテムIDとPlacePoint IDで設定できる配置成功条件
- `ReachZoneTask`: Playerと目的地のXZ距離を判定し、時間制限なしの到着目標とScene-local Markerを管理
- `ProcessingTask`: 対象Stationの更新、指定Itemの加工完了判定、制限時間を管理
- `AssemblyTask`: 対象AssemblyStationの更新、Combine完了判定、制限時間を管理
- `CountdownTimer`: ゲームループのdeltaTimeで制限時間を管理
- `EventRunner`: データで定義したイベントをゲームループ上で開始・待機・完了し、Story PhoneとTransition Cardを含むcancel/error cleanupも管理
- `EventTypes`: 会話・Task・Phone・Scene切替・Checkpoint保存・Transition Card・Audio Cueを表すDiscriminated Union
- `TransitionActions`: EventRunnerとDOM表示を分離するpresentation境界
- `AudioContentRegistry`: Audio ID、種別、local source、volume、loopの静的定義を検証・解決
- `AudioManager`: BGM/SFX channel、deltaTime crossfade、autoplay unlock、session-only Mute、disposeを管理
- `BrowserAudioMediaFactory`: local音源をdecodeして共有Web Audio Context上でsample-accurate loop・one-shot再生するbrowser境界
- `AudioActions`: EventRunnerをHTMLAudioElementから分離するAudio境界
- `TaskEventBinding`: Task開始前のゲーム世界準備をEventRunnerから分離
- `ReachZoneTaskEventBinding`: 到着Task開始前の一時UI・Interaction選択解除を担当し、PlayerやCarryを巻き戻さない
- `ProcessingTaskEventBinding`: Retry時にCarry・Station・Item・PlacePoint・Playerをraw開始状態へ戻す
- `AssemblyTaskEventBinding`: Retry時に入力Itemをactive、完成Itemをinactiveへ戻し、StationとPlayerを初期化
- `Phase2DemoController`: Phase 2の参考実装として残しているが、Phase 3の実行経路では使用しない
- `DialogueUI` / `TaskHUD` / `ResultOverlay` / `SpeechBubble`: DOM表示だけを担当
- `PhoneContentRegistry`: Message / Photo / Threadの静的定義とID検証
- `PhoneProgress`: 日付・目的・解放済みIDだけを管理し、変更時に保存
- `PhoneProgressStore`: バージョン付きPhone進行データだけを`localStorage`へ保存・復元
- `PhoneController`: 通常Phoneの入力状態保存・復元、Story Phoneとの排他、Story Card完了通知
- `PhoneUI`: Home / Messages / Album / Story CardのDOM表示だけを担当
- `CheckpointRegistry`: Checkpoint IDからScene・Phone状態・再開Sequenceを解決し、起動時に参照を検証
- `GameSaveStore`: `checkpointId`だけを持つGame Save v1の保存・検証・削除
- `GameProgressController`: New Game / Continue / Resetと安全な復元順序を調停
- `StartMenu`: 保存状況に応じたNew Game / Continue / ResetのDOM表示
- `TransitionOverlay`: data-drivenな日付・タイトル・任意subtitleをfull-screen HTML/CSSで表示
- `AudioMuteButton`: Audio状態やSaveを持たず、Mute切替をHTML buttonとして表示
- `CampaignStoryDefinition`: NPC名・Objective・Task labelを含む、差し替え可能な物語表示だけを表す
- `CampaignStoryValidation`: Story JSONを実行時検証し、外部URL・encoded traversal・不完全なデータを拒否
- `loadCampaignStory`: 固定ローカルパスの取得、404時の架空フォールバック、invalid時のfail-closed
- `createCampaignScenes`: Story由来のNPC名とTask labelを、固定Scene geometry・Task条件へ注入

CampaignのScene、Phone content、Transition Card、Audio content、canonical Event Sequence、Checkpointは`src/content/campaign/`に分離しています。`campaignContent.ts`は検証済みStoryを固定のCampaign構造へ注入し、旧Phase 6〜10データと合わせてRegistryへ渡す薄いfactoryです。runtime managerではありません。CheckpointのresumeSequenceはcanonical segment列のsuffixから生成するため、Story本文・Transition Card・Audio CueをCheckpointごとに複製しません。

Campaign専用の`Chapter`、`CampaignManager`、新しいTaskは追加していません。Phase 15でもGameEventの種類は増やしていません。`SceneManager`、`SceneDefinition`、Task、PhoneControllerはStory loaderを知らず、旧Phase 6〜12のScene・Phone content・Checkpointもv1 Save互換のため登録を維持しています。

`localStorage`ではGame Saveの`ur-game:save:v1`とPhone進行の`ur-game:phone-progress:v1`を分離しています。Phase 15でも両schemaはv1のままです。current BGM、再生位置、Mute、volume、unlock状態は保存せず、Checkpointのcanonical resume sequenceが適切なBGM Cueを再指定します。

入力ソースやゲームループの境界を保ち、キーコードは`KeyboardInput`のみに閉じ込めています。アイテムは操作性を優先してDynamicRigidBodyにせず、床・保持・PlacePointへの配置状態を明示的に切り替えています。

## Placeholder Audio

`public/audio/`の5つのWAVは、Phase 13用に[`scripts/generate-placeholder-audio.mjs`](scripts/generate-placeholder-audio.mjs)から決定的に生成したオリジナルplaceholderです。外部音源、市販曲、録音、学習済み楽曲、ライセンス不明素材は使用していません。

```bash
npm run generate:audio
```

で同じ構成のmono 16-bit PCM WAVを再生成できます。BGMは8秒の小音量loop、SEは0.85〜1.7秒です。本番用の楽曲へ置換する際も、public repositoryで再配布可能な権利を確認してください。

## 公開前のセキュリティ

APIキーや認証情報はソースやStory JSONへ直接書かず、用途に応じた安全なローカル保管を使用してください。`.env`、`private/`、`public/private/`は`.gitignore`の対象です。

個人向けCampaignは[`examples/campaign-story.example.json`](examples/campaign-story.example.json)を雛形とし、実データを`public/private/campaign-story.json`、写真を`public/private/photos/`で管理します。これらを`git add -f`で公開リポジトリへ追加してはいけません。

Viteの`public/`、`VITE_`環境変数、TypeScriptの変数は、秘密情報を隠す場所ではありません。ブラウザへ配信されたファイルは閲覧・取得できる前提です。個人版はローカルまたはアクセス制限された配布先だけで扱い、個人データを含む生成物を公開しないでください。詳しくは[`docs/private-content.md`](docs/private-content.md)を参照してください。
