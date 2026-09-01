# Private Campaign Content

Phase 15では、公開リポジトリに置く架空Campaignと、各PCだけに置く任意のローカルストーリーを同じゲーム構造で実行できます。非公開ファイルがなければ、従来の架空Campaignがそのまま起動します。

## ローカル設定

リポジトリのルートで次を実行し、架空の雛形をコピーします。

```bash
mkdir -p public/private/photos
cp examples/campaign-story.example.json public/private/campaign-story.json
cp public/campaign/memory-*.svg public/private/photos/
cp public/campaign/ending.svg public/private/photos/
```

上記では動作確認用として公開の架空イラストをprivate領域へコピーします。`public/private/campaign-story.json`の文章を編集し、本番では対応する写真へ置き換えてください。写真の`src`は`/private/photos/example.jpg`のようなパスに限定されます。外部URL、public Campaign画像、`data:` URL、`javascript:` URL、親ディレクトリ参照、encoded traversalは受け付けません。

`public/private/`は`.gitignore`対象です。`git add -f`で強制追加しないでください。設定後は`git status --ignored --short public/private`で、先頭が`!!`になっていることを確認できます。

## 読み込みルール

- `/private/campaign-story.json`が404: 公開の架空Campaignで起動
- ファイルが存在し、形式が正しい: ローカルの文章・日付・写真を使用
- ファイルが存在するがJSONまたは内容が不正: 明示的な起動エラーで停止
- 403や500など404以外の取得失敗: 明示的な起動エラーで停止

NPC表示名、Objective、Task HUD label、日付、会話、Phoneカード・メッセージ・写真、Transition Card、Ending文面が差し替え対象です。Scene、Task、Checkpoint、Event順序、ID、座標、成功条件、時間、Audio Cueは公開コードに固定されています。

## 本番コンテンツの作成順

1. 例示JSONをprivate領域へコピー
2. companion表示名を設定
3. 6 Segmentの日付を設定
4. Transition、Dialogue、Phoneの文章を設定
5. ObjectiveとTask HUD labelを設定
6. 写真を`public/private/photos/`へ配置
7. caption、alt、dateを設定
8. Reset Progressから通しプレイ

実写真は巨大な原本を避け、必要に応じてJPG・PNG・WebPへ縮小してください。写真には撮影位置などのEXIF情報が残ることがあります。Phase 15は画像変換やEXIF削除を自動化しないため、使用前にユーザー自身で確認してください。

通しプレイでは次を記録し、後続のpacing調整に使用します。

```text
Prologue:      __ min
Meeting:       __ min
Outing:        __ min
Preparation:   __ min
Journey:       __ min
Ending:        __ min
Total:         __ min

Retry回数:
長く感じた部分:
短すぎた部分:
分かりにくかったTask:
長すぎたDialogue:
```

## セキュリティ上の注意

`.gitignore`はGitへの誤追加を防ぐだけで、配信したファイルを暗号化しません。Viteの`public/`に置いたファイルは、ゲームを実行するブラウザへそのまま配信されます。

- 個人情報入りの`dist/`を公開ホスティングへアップロードしない
- 公開リポジトリへ`public/private/`や個人写真を強制追加しない
- APIキー、パスワード、認証情報はストーリーJSONへ書かない
- 共有する前に`git status`と`git diff --cached`を確認する

実データを含む版はローカルまたはアクセス制限された配布先だけで扱ってください。
