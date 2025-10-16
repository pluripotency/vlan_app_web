# VLAN申請管理アプリのエージェント向けメモ

## 全体像
- フロントエンド: `front/` で構成された React + TypeScript + Vite の SPA。API ベースの画面を持ち、ユーザー・VLAN・申請の CRUD や管理操作を提供します。
- バックエンド: `back/` の Express + Drizzle ORM + PostgreSQL 構成。REST API とビルド済みフロントの静的配信をまとめて提供します。
- データベース: Docker Compose (`docker/postgres/`) で PostgreSQL 16 を起動。初回起動時にスキーマとサンプルデータを投入する init スクリプトと、アプリ起動時の Drizzle 側初期化処理を両方備えています。

## 主な起動コマンド
- `./start.sh`
  - フロント/バック両方で `npm run build` を実行し、ビルド済み成果物を生成。
  - `scripts/start_postgres.sh` を呼び出して Docker Compose で DB を起動。既定の接続情報は `postgres://vlan:vlanpass@localhost:5432/vlan_app`。
  - `back/` に移動して `npm run start` を実行。Express が `/api/*` を API として提供しつつ、`back/dist/` に配置されたフロントを静的配信します。
  - 実行後は `http://localhost:3001`（`PORT` を未設定の場合）でアクセス可能。Ctrl+C でバックエンドと DB を停止、もしくは `scripts/stop_postgres.sh` で DB のみ停止できます。

### 必要要件
- Node.js 20+（バック・フロントとも TypeScript/Esm 構成のため）
- npm（依存済みなので `npm install` は不要と想定）
- Docker / Docker Compose（`docker compose` もしくは `docker-compose` コマンドが利用できること）

### 環境変数
- `DATABASE_URL`（任意）: start.sh 実行時に未指定なら `postgres://vlan:vlanpass@localhost:5432/vlan_app` を使用。
- `PORT`（任意）: バックエンドの公開ポート。未指定なら 3001。

## ディレクトリ概要
- `front/`: Vite ベースの SPA。`npm run dev` で開発サーバー、`npm run build` で静的ビルド。
- `back/`: TypeScript で記述された Express API。`npm run dev`（tsx）、`npm run build`（tsc）、`npm run start`（ビルド済み実行）。`src/db/` 配下に Drizzle スキーマと初期化ロジック。
- `docker/postgres/`: PostgreSQL 用 Compose ファイルと `initdb/` のスキーマ・サンプルデータ SQL。
- `scripts/`: Postgres の起動停止スクリプト。
- `start.sh`: プロダクション相当の起動トグルスクリプト。

## API ハイライト（バックエンド）
- `GET /api/health`: ヘルスチェック。
- `GET /api/vlans`: VLAN 一覧取得。
- `GET /api/users` / `POST /api/users`: ユーザー一覧と作成。作成時に管理者権限付与可。
- `PATCH /api/users/:id/admin`: 管理者権限の付与・剥奪。acting admin の検証ロジックあり。
- `GET /api/requests`: リクエスト履歴＋関連情報を JOIN 済みで返却。
- `POST /api/requests`: リクエスト作成（オプションで代理作成者指定）。
- `PATCH /api/requests/:id`: 管理者による承認/却下。

## データベース初期データ
- VLAN: 10/20/30 を初期投入（Corporate LAN / Guest Network / Secure Lab）。
- ユーザー: Alice（管理者）、Bob（オペレータ）、Carol（ビューア）。
- リクエスト: Bob の VLAN10 承認済み、Carol の VLAN30 保留。
- initdb SQL とアプリ起動時の `ensureDatabase()` の両方で不足データを補います。

## 開発時のヒント
- フロントの API ベース URL は `VITE_API_BASE`（既定 `/api`）。別ホストでバックエンドを動かすときは `front/.env` 等で調整。
- モックなしで実行する場合は、`scripts/start_postgres.sh` で DB を単独起動後、`front/` と `back/` を個別に `npm run dev` しても良いです。
- 自動テストは未整備。変更後は lint / build（`npm run build`）と簡単な手動確認を推奨。

## トラブルシューティング
- Docker が起動していない場合、`start_postgres.sh` が失敗しバックエンドも停止します。Docker デーモンを起動し再実行してください。
- 既存コンテナが残っている場合は `docker compose -f docker/postgres/docker-compose.yml down` でクリーンアップ。
- `DATABASE_URL` を変更する場合、`.env` などでバックエンド起動前に設定するか、`start.sh` 実行時に環境変数を渡してください。
