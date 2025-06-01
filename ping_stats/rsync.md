# rsyncログ同期コンテナ仕様書

## 概要
`logs/`ディレクトリ配下の全ファイル・ディレクトリを、指定したリモートサーバ上のディレクトリにrsyncで1分ごとに一方向同期する専用コンテナを作成する。

## 要件
- ソース: `/app/logs/`（ローカルコンテナ内）
- 宛先: 任意のリモートサーバ（例: `user@remotehost:/path/to/dir/`）
- 同期方式: rsyncによる一方向同期（ローカル→リモート）
- 同期間隔: 1分ごと（cronまたはループsleep）
- SSH鍵認証対応（秘密鍵をマウントして利用）
- ログ出力: 標準出力にrsyncの結果を出力
- Dockerイメージ: 軽量なLinuxベース（例: debian:slim, alpine等）
- 設定値（環境変数で指定可能）
  - RSYNC_TARGET（例: `user@remotehost:/path/to/dir/`）
  - RSYNC_OPTIONS（例: `-avz --delete` など）
  - RSYNC_SSH_KEY_PATH（例: `/app/id_rsa`）
  - SYNC_INTERVAL（秒, デフォルト60）

## 実装ファイル一覧
- `rsync_entrypoint.sh`: rsyncを1分ごとに実行するシェルスクリプト
- `Dockerfile`: 上記スクリプトとrsync, sshクライアントを含む
- `rsync.md`: 本仕様書

## 使い方例
- SSH秘密鍵を`/app/id_rsa`としてマウント
- `docker run -v ./logs:/app/logs -v ~/.ssh/id_rsa:/app/id_rsa:ro -e RSYNC_TARGET=user@remotehost:/path/to/dir/ ...`

## 注意事項
- 一方向同期のため、リモート側のファイルがローカルに戻ることはない
- SSH鍵のパーミッションに注意（`chmod 600`）
- リモート側のパーミッション・空き容量に注意
