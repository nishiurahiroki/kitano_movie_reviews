# ルートとデータ（Routes & Data）

## ルート

- `/`
  - データ：films（全件） + reviews（公開済み）
  - 表示：films一覧、reviewがあるものだけリンク有効

- `/films/:slug/`
  - 静的生成対象：公開済みreviewsから生成
  - データ：review + film（参照）
  - 表示：review.body（リッチテキストHTML）をそのまま描画

## データ取得（ビルド時）

- ビルド時にmicroCMSから取得して静的HTMLを生成する
- 環境変数：MICROCMS_SERVICE_DOMAIN, MICROCMS_API_KEY

## リンク有効化ルール

- reviews（公開済み）の film.id 集合に含まれる film はリンク有効
- 含まれない film はリンク無効（「準備中」表示）
