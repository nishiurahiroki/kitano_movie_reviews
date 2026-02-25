# Kitano Movie Reviews - SPEC

## Goal

北野武監督作品のレビューを静かに読める体験で提供する。
レビューは筆者の文章が主役であり、サイトはそれを邪魔しない。

## Non-Goal

- メタ情報の充実（評価、タグ、点数）は扱わない
- 会員機能、コメント、SNS機能は持たない
- 画像主体のUIにしない（権利・ノイズ回避）

## Key UX Principles

- 静謐・間・余白。UIをしゃべらせない
- 文章はスマホでも疲れず読める（可読性最優先）
- ページは速い（極力ゼロJS、軽いCSS）

## Content Model (microCMS)

- films: 全作品マスター（slug/title/releaseDate）
- reviews: 公開済みレビュー（film参照 + リッチテキスト本文HTML）

## Functional Requirements

FR1. トップページは films を全件表示する  
FR2. reviews が存在する films のみリンクを有効にする  
FR3. 作品ページは公開済み review のみ静的生成される  
FR4. 作品ページのSEO titleは `{作品名} - 徒然レビュー` 形式  
FR5. microCMS更新でリポジトリ更新なしに反映できる（=再ビルド経由）
FR6. 作品ページのレビュー本文は、microCMSのリッチテキストHTMLをエスケープせず描画する

## Non-Functional Requirements

NFR1. Lighthouse: Performance 90+ を目標（画像・JS最小）
NFR2. JSは原則ゼロ（必要な時だけislands）
NFR3. アクセシビリティ：見出し構造、コントラスト、フォーカス可視化

## Edge Cases

- review本文が空/未設定 → 作品ページは生成しない
- releaseDateが YYYY のみでも壊れない
