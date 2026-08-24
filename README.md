# Anniversary Game — Phase 3

交際1周年記念の短編3Dゲームに向けた、Webブラウザ用のゲーム基盤です。Phase 3ではPhase 2までの移動・インタラクション・NPC・会話・タスクを維持しながら、データで並べたイベントを順番に実行する`EventRunner`を追加しています。

## 実行

```bash
npm install
npm run dev
```

型チェックを含む本番ビルドは `npm run build`、ビルド結果の確認は `npm run preview` で行えます。

## 操作

- `W` / `A` / `S` / `D`: 移動
- `E` / `Space`: 話す・会話を進める・アイテムを拾う／置く
- `R`: 時間切れ画面からタスクをリトライ

開始地点の正面にいるNPCへ話しかけると、`dialogue → move_npc → speech → wait → task → speech → wait → dialogue`のイベント列が始まります。タスクは「3個のアイテムを緑のカウンターへ運ぶ」45秒のPlacementTaskです。

## ゲームループ

各フレームは次の順番で処理します。

1. 入力ソースを更新し、移動方向へ集約する
2. プレイヤーがRapierへ移動要求を送る
3. 物理ワールドを進める
4. 解決後の座標へ描画モデルを同期する
5. インタラクション、会話、タスク、NPCを更新する
6. 追従カメラとNPC吹き出しを更新する
7. Three.jsで描画する

バックグラウンド復帰時の大きな移動を避けるため、1フレームの `deltaTime` には上限を設けています。

## 設計の境界

- `Game`: 初期化、ライフサイクル、ゲームループ、リサイズ
- `KeyboardInput`: DOMのキーボードイベントを方向入力へ変換
- `InputManager`: 複数の入力ソースを統合し、長さ1以内へ正規化
- `PhysicsWorld`: Rapierの初期化、静的コライダー、物理ステップ
- `KinematicCharacter`: RapierのCharacter Controllerによる補正移動
- `PlayerController`: 抽象化された移動入力を物理移動と向きへ反映
- `InteractionSystem`: プレイヤー前方の操作対象選択、Action入力、ハイライト、操作ヒント
- `CarrySystem`: 1個だけの保持状態と安全な床ドロップ
- `PickableItem`: 種類に依存しない持ち運び可能アイテム
- `PlacePoint`: 空き・配置済み状態と、台への配置・再取得
- `FollowCamera`: プレイヤーとは独立したスムーズ追従
- `Stage`: ダミーステージの表示物と対応する静的コライダーを構築
- `NPCController`: NPCの表示、Interactable対応、直線移動と向き制御
- `DialogueManager`: データで渡された会話の現在行と終了を管理
- `TaskManager`: 実行中タスクと完了通知を管理
- `PlacementTask`: アイテムIDとPlacePoint IDで設定できる配置成功条件
- `CountdownTimer`: ゲームループのdeltaTimeで制限時間を管理
- `EventRunner`: データで定義したイベントをゲームループ上で開始・待機・完了し、cancel/error cleanupも管理
- `EventTypes`: `dialogue` / `move_npc` / `task` / `speech` / `wait`のDiscriminated Union
- `TaskEventBinding`: Task開始前のゲーム世界リセットをEventRunnerから分離
- `Phase2DemoController`: Phase 2の参考実装として残しているが、Phase 3の実行経路では使用しない
- `DialogueUI` / `TaskHUD` / `ResultOverlay` / `SpeechBubble`: DOM表示だけを担当

Phase 3のイベント内容は`src/content/demo/phase3DemoSequence.ts`にあり、順序やセリフを変えてもEventRunner本体を修正する必要はありません。長時間のPromise chainや`setTimeout`は使わず、NPC到着・Dialogue完了・Task結果・wait時間を毎フレームの状態として待ちます。

入力ソースやゲームループの境界を保ち、キーコードは`KeyboardInput`のみに閉じ込めています。アイテムは操作性を優先してDynamicRigidBodyにせず、床・保持・PlacePointへの配置状態を明示的に切り替えています。

## 公開前のセキュリティ

APIキーや認証情報はソースへ直接書かず、ローカルの `.env` または `private/` に置いてください。これらは `.gitignore` の対象です。

個人向けコンテンツは [`config/personal-content.example.json`](config/personal-content.example.json) を雛形とし、実データを `private/personal-content.json` として管理します。`private/` の実データをpublicビルドへimport・コピーしてはいけません。

Viteの `VITE_` 環境変数やTypeScriptの変数は、秘密情報の保管場所ではありません。ビルド後のJavaScriptへ値が埋め込まれます。個人写真、実名、メッセージなどをゲーム本体へ組み込む場合、ブラウザへ配信されたファイルは閲覧・取得できる前提で、公開可能な内容だけを使用してください。個人版が必要な場合は、公開版と分離してローカルでビルドし、生成物を公開リポジトリへ追加しないでください。
