# kitano_movie_reviews

北野武監督作品のレビューを、静かに読める体験で提供。

- Hosting: Cloudflare Pages
- Generator: Astro (static-first / minimal JS)
- Content: microCMS

## What it does

- トップページに北野武作品を一覧表示（`films`）
- レビューが公開されている作品のみリンクが有効（`reviews`）
- 作品ページのSEO titleは `{作品名} - 徒然レビュー` 形式
- レビュー本文は microCMS のリッチテキストHTMLを装飾込みで表示

## Requirements

- Node.js (LTS recommended)
- pnpm
- microCMS `SERVICE_DOMAIN` and `API_KEY`
- `PUBLIC_SITE_URL` (例: `https://example.com`)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```
