# quiz-app

世界の文化をテーマにした、ブラウザで動く4択クイズアプリ（全5問）。HTML / CSS / JavaScript のみで、ビルドや依存パッケージはない。

## コマンド

- 実行: `index.html` をブラウザで直接開く（サーバー不要）
- 構文チェック: `node --check script.js`
- テスト: 自動テストは未整備。動作確認はブラウザで1周プレイして行う

## アーキテクチャ

- `index.html`: 出題画面 `#quiz-screen` と結果画面 `#result-screen` の2つの section。`.hidden` クラスの付け外しで切り替える
- `script.js`: 問題データは先頭の定数 `QUESTIONS`（`question` / `choices` / `answer`（choices の添字）/ `explanation`）。進行状態はモジュール変数 `currentIndex` と `score` だけ
- 流れ: `startQuiz` → `showQuestion` → `selectAnswer`（判定・フィードバック表示）→ `goNext` → 最後に `showResult`。「もう一度挑戦する」は `startQuiz` を呼び直して状態をリセットする
- `style.css`: 色はすべて `:root` の CSS 変数で管理する

## 規約

- 問題を追加・変更するときは `QUESTIONS` の配列だけを編集する。4択・`answer` は 0〜3
- 問題文・選択肢・解説はオリジナルの文章で書き、事実関係を確認してから載せる
- 画面に出す文字列は `textContent` で入れる（`innerHTML` に問題データを流さない）
- 効果音ファイルは `sounds/` に置く。外部素材を使うときは、ライセンスを確認したうえで画面下部の `.credit` にクレジットを載せる（OtoLogic は CC BY 4.0 で「OtoLogic」の表記が必須）。音量ははっきり聞き取れて、驚かない程度にする（OtoLogic 素材は小さめに収録されているので、volume は上限の 1 でよい）

## デザイン

- シンプルで見やすい青系デザインを守る。新しい色は `:root` の変数として追加してから使う
- 正解は緑（`--correct`）、不正解は赤（`--wrong`）。それ以外の配色は青系に統一する
- スマートフォン幅でも崩れないこと（`.container` の最大幅 640px・左右余白 16px）

## 言語

- 返答・対話・コード内コメント・コミットメッセージは **すべて日本語** で記述する。
- 識別子（変数名・関数名・クラス名）とファイル名は英語のままにする。

## セキュリティ

- `.env` および認証情報を含むファイルは **絶対にコミットしない**。
  `.gitignore` に入っていることを確認し、無ければ追加する。
- 秘密情報は値をこのファイルにも書かない。変数名だけを書き、値は `.env.example` に
  プレースホルダとして置く。
- API キー・トークン・パスワードをソースにハードコードしない。

## GitHubリポジトリ

https://github.com/Yumie-MISHIMA/quiz-app
