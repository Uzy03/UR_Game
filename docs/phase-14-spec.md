# Phase 14 — Private Story Content Foundation

## 目的

公開可能な架空Campaignを常に保持しながら、Git管理外のローカルファイルから個人向けストーリー本文を注入できる基盤を追加する。

## 境界

- `CampaignStoryDefinition`: 差し替え可能な文章・日付・写真パスの型
- `parseCampaignStoryDefinition`: 必須項目、日付、会話、ローカル写真パスの実行時検証
- `loadCampaignStory`: 固定パスからの取得、404フォールバック、invalid時のfail-closed
- `FICTIONAL_CAMPAIGN_STORY`: 公開リポジトリで常に動く架空データ
- Campaign factory群: Storyを固定のPhone、Transition、Sequence、Checkpoint構造へ注入

## 固定するもの

Scene、Task、Checkpoint、Event順序、公開ID、座標、時間、Audio Cue、Save v1、Phone Progress v1は変更しない。Story JSONから新しいEventやTaskを作成できる仕組みは導入しない。

## 非対象

実際の思い出データ、個人写真、暗号化、認証、CMS、オンライン同期、schema migration、ゲーム進行の変更はPhase 14では実装しない。
