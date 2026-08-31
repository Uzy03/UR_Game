# Private Campaign Content

Phase 14では、公開リポジトリに置く架空Campaignと、各PCだけに置く任意のローカルストーリーを同じゲーム構造で実行できます。非公開ファイルがなければ、従来の架空Campaignがそのまま起動します。

## ローカル設定

リポジトリのルートで次を実行し、架空の雛形をコピーします。

```bash
mkdir -p public/private/photos
cp examples/campaign-story.example.json public/private/campaign-story.json
```

コピー直後は公開の架空イラストを参照するため、そのまま形式を確認できます。`public/private/campaign-story.json`の文章を編集し、実際に使う写真を`public/private/photos/`へ置いてください。写真の`src`は`/private/photos/example.jpg`のようなローカル絶対パスにします。外部URL、`data:` URL、`javascript:` URL、親ディレクトリ参照は受け付けません。

`public/private/`は`.gitignore`対象です。`git add -f`で強制追加しないでください。設定後は`git status --ignored --short public/private`で、先頭が`!!`になっていることを確認できます。

## 読み込みルール

- `/private/campaign-story.json`が404: 公開の架空Campaignで起動
- ファイルが存在し、形式が正しい: ローカルの文章・日付・写真を使用
- ファイルが存在するがJSONまたは内容が不正: 明示的な起動エラーで停止
- 403や500など404以外の取得失敗: 明示的な起動エラーで停止

日付、会話、Phoneカード・メッセージ・写真、Transition Card、Ending文面だけが差し替え対象です。Scene、Task、Checkpoint、Event順序、ID、座標、時間、Audio Cueは公開コードに固定されています。

## セキュリティ上の注意

`.gitignore`はGitへの誤追加を防ぐだけで、配信したファイルを暗号化しません。Viteの`public/`に置いたファイルは、ゲームを実行するブラウザへそのまま配信されます。

- 個人情報入りの`dist/`を公開ホスティングへアップロードしない
- 公開リポジトリへ`public/private/`や個人写真を強制追加しない
- APIキー、パスワード、認証情報はストーリーJSONへ書かない
- 共有する前に`git status`と`git diff --cached`を確認する

実データを含む版はローカルまたはアクセス制限された配布先だけで扱ってください。
