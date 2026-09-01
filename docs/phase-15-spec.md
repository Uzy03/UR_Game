# Phase 15 — Production Narrative Surface & Private Campaign Authoring

## 目的

Phase 14のprivate Story境界を、実際の記念ゲーム内容をローカルだけで作成できる状態まで完成させる。新しいgameplayは追加せず、Campaign中のユーザー可視narrativeをStoryから供給する。

## Narrative Surface Audit

Story側へ移すもの:

- Campaign NPC display name
- Objective text 9件
- Task HUD label 7件
- 既存の日付、Dialogue、Phone、Photo、Transition、Ending prose

Engine側へ残すもの:

- Pick up、Place、Process、Combine、Retry、CLEAR、TIME UPなどの汎用UI
- Scene／Task／NPC／Objective／Checkpoint／Audio等のID
- Scene geometry、座標、Task条件、duration、radius、Event順序

## セキュリティ境界

private JSONの写真は`/private/photos/`配下だけを許可する。external URL、public Campaign path、literal／encoded traversal、query、fragmentは拒否する。公開の`FICTIONAL_CAMPAIGN_STORY`は従来の`/campaign/`画像を使用できる。

404 fallback、invalid fail-closed、`Accept: application/json`、Save v1、Phone Progress v1、canonical resume suffixを維持する。

## 非対象

新しいEvent・Task・Scene機能、Story editor、CMS、暗号化、画像処理、EXIF削除、Audio差し替え、pacing調整、Save v2は実装しない。実名・実日付・実メッセージ・実写真は公開リポジトリへ追加しない。
