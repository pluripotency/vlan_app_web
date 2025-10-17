# VLAN管理アプリケーションについて

このリポジトリは、VLAN（Virtual LAN）に関する申請フローを管理するフルスタックアプリケーションです。主な特徴は以下の通りです。

- フロントエンド: `front/` ディレクトリにある React + TypeScript + Vite 構成のシングルページアプリ。ユーザー、VLAN、リクエストの一覧表示や作成フォーム、管理者権限の付与・剥奪、リクエスト承認／却下の操作が行えます。
- バックエンド: `back/` ディレクトリに API を提供するサーバー実装を想定しています（詳細は別途ドキュメントを参照してください）。
- Docker サポート: `docker/` ディレクトリに開発・実行環境のコンテナ構成が用意されています。

アプリケーションは VLAN 申請のライフサイクルを可視化し、管理者が承認プロセスを円滑に進められるように設計されています。

## サンプルデータの更新

Docker 初期化用のサンプルデータ (`docker/postgres/dev/initdb/02-example-data.sql`) は、`docker/postgres/dev/tsv/` 以下の TSV ファイルから生成されます。内容を更新したい場合は TSV を編集し、次のコマンドで SQL を再生成してください。

```bash
node docker/postgres/dev/generate-sample-data.js
```

生成された SQL は `ON CONFLICT` 付きで既存データとの重複を避けるようになっています。
