# Booking Assistant Demo

[VAPI](https://vapi.ai/)、[Hono](https://hono.dev/)、[Cloudflare Workers](https://workers.cloudflare.com/) で構築した音声予約アシスタントのデモです。

## 概要

このアプリケーションは Cloudflare Workers 上で動作する **VAPI Server URL**（Webhook）です。音声 AI アシスタントからのレストラン予約リクエストを処理します。

サーバーは 2 つのツール関数を提供します。

- `checkAvailability` — 指定した日時に空きテーブルがあるか確認します。
- `makeReservation` — テーブルを予約し、予約 ID を返します。

予約データはデモ用に **インメモリ** で保持されます。

## 前提条件

- Node.js v18+
- npm
- [VAPI](https://vapi.ai/) アカウント
- [Cloudflare](https://www.cloudflare.com/) アカウント
- Cloudflare で管理しているドメイン（`0xkaz.com`）

## セットアップ

```bash
# 1. 依存関係をインストール
npm install

# 2. ローカル開発用のシークレットを設定
cp .dev.vars.example .dev.vars
# .dev.vars を編集し、ローカルでトークン検証を試したい場合は設定してください。

# 3. ローカル開発サーバーを起動
npm run dev
```

デフォルトでは `http://localhost:8787` で起動します。

## デプロイ

### 1. シークレットトークンを設定

```bash
npx wrangler secret put VAPI_SECRET_TOKEN
```

VAPI ダッシュボードで設定したシークレットトークンを入力してください。この値はリポジトリには**コミットしません**。

### 2. Cloudflare Workers にデプロイ

```bash
npm run deploy
```

`wrangler.toml` で設定した通り、`https://booking-assitant-demo.0xkaz.com` でサービスが公開されます。

## VAPI ダッシュボードでの設定

### 1. アシスタントを作成または編集

VAPI ダッシュボードで、接続したいアシスタントを開きます。

### 2. Server URL を設定

アシスタント設定の **Server URL** に以下を入力します。

```
https://booking-assitant-demo.0xkaz.com/vapi/webhook
```

### 3. Secret Token を有効化（推奨）

Server URL 設定で **Secret Token** を生成し、Wrangler 経由で設定します。

```bash
npx wrangler secret put VAPI_SECRET_TOKEN
```

サーバーは `Authorization: Bearer <token>` ヘッダーがないリクエストを拒否します。

### 4. ツール関数を登録

アシスタントの **Tools**（Functions）セクションに以下の関数を追加します。

#### `checkAvailability`

| パラメータ  | 型     | 必須 | 説明                       |
|-------------|--------|------|----------------------------|
| `date`      | string | はい | ISO 日付（YYYY-MM-DD）     |
| `time`      | string | はい | 24 時間表記（HH:mm）       |
| `partySize` | number | はい | 来店人数                   |

**モデルへの説明文：**
> 指定された日時にレストランの空きテーブルがあるか確認します。予約を試みる前に必ず呼び出してください。

#### `makeReservation`

| パラメータ  | 型     | 必須 | 説明                       |
|-------------|--------|------|----------------------------|
| `date`      | string | はい | ISO 日付（YYYY-MM-DD）     |
| `time`      | string | はい | 24 時間表記（HH:mm）       |
| `partySize` | number | はい | 来店人数                   |
| `name`      | string | はい | 予約者名                   |
| `phone`     | string | いいえ | 連絡先電話番号           |

**モデルへの説明文：**
> レストランを予約します。checkAvailability で空きを確認した後にのみ呼び出してください。

## API エンドポイント

| メソッド | パス                | 説明                              |
|----------|---------------------|-----------------------------------|
| GET      | `/health`           | ヘルスチェック                    |
| GET      | `/reservations`     | インメモリの予約一覧を取得        |
| POST     | `/vapi/webhook`     | VAPI Server URL（ツール呼び出し） |

## プロジェクト構成

```
src/
├── index.ts              # Hono アプリのエントリーポイント
├── middleware/
│   └── auth.ts           # VAPI Bearer トークン検証
├── routes/
│   └── vapi.ts           # Webhook ルートハンドラ
├── services/
│   └── reservation.ts    # インメモリ予約ロジック
├── types/
│   ├── bindings.ts       # Cloudflare Workers 環境変数の型
│   └── vapi.ts           # VAPI ペイロードの型定義
```

## スクリプト

| スクリプト      | 説明                                    |
|-----------------|-----------------------------------------|
| `npm run dev`   | Wrangler でローカル開発サーバーを起動   |
| `npm run deploy`| Cloudflare Workers にデプロイ           |
| `npm run types` | Wrangler から TypeScript 型を生成       |

## 注意事項

- **インメモリ保存:** Cloudflare Workers ではグローバル変数は単一の isolate 内でのみ保持されます。本番環境では [Cloudflare KV](https://developers.cloudflare.com/kv/)、[D1](https://developers.cloudflare.com/d1/)、または [Durable Objects](https://developers.cloudflare.com/durable-objects/) などの永続ストレージに置き換えてください。
- **カスタムドメイン:** カスタムドメインは `wrangler.toml` で設定しています。デプロイ前にドメインが Cloudflare で有効かつプロキシ状態になっていることを確認してください。

## ライセンス

MIT
