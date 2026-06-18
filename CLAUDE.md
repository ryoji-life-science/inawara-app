@AGENTS.md

# 稲わら圃場管理アプリ (inawara-app)

稲わら作業の進捗を地図上で管理するモバイル向けWebアプリ。海士町（島根県）の圃場が対象。

## 技術スタック

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Leaflet（地図表示）
- Turso（libSQL、データベース）
- Vercel（デプロイ、GitHubへのpushで自動デプロイ）

## 開発コマンド

```bash
npm run dev   # 開発サーバー起動 (localhost:3000)
npm run build # 本番ビルド
npm run lint  # ESLint
```

## 環境変数 (.env.local)

```
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=eyJ...
```

## プロジェクト構成

- `src/app/page.tsx` — サーバーコンポーネント。DBからデータ取得しMainAppに渡す
- `src/components/main-app.tsx` — メインのクライアントコンポーネント。タブ切替・フィルター・モーダル管理
- `src/components/field-map.tsx` — Leaflet地図。マーカー表示、長押しで新規圃場登録
- `src/components/field-list.tsx` — 一覧タブのカード型リスト
- `src/components/field-detail-modal.tsx` — 圃場の詳細・編集モーダル
- `src/components/field-create-dialog.tsx` — 新規圃場登録ダイアログ
- `src/components/status-filter.tsx` — ステータスフィルターバー
- `src/components/status-summary.tsx` — ステータス集計表示
- `src/actions/fields.ts` — Server Actions（CRUD操作）
- `src/lib/db.ts` — Turso DB接続（サーバー専用）
- `src/lib/types.ts` — 型定義（Field, StatusKey等）
- `src/lib/constants.ts` — ステータス定義、地図の中心座標

## ステータスの流れ

未着手 → 稲刈り → わら起こし → わらよせ → 巻き取り → 燃やす → 施肥（完了）

## 注意事項

- UIはモバイル前提（max-width: 430px）
- 日本語でコミットメッセージを書くこと
- このリポジトリは共同編集。mainブランチに直接pushでVercelにデプロイされる
