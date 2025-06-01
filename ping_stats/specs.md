# pingコマンドラッパー仕様・実装ドキュメント

## 概要
本ツールは、指定したホストに対してpingコマンドを実行し、応答時間が500ms以下であれば「成功」、500msを超える場合や応答がない場合は「失敗」と判定します。結果は指定フォーマットで標準出力およびログファイルに出力します。

## 実装ファイル一覧
- `ping_wrapper.py`: ping実行・判定・出力のメインロジック（Python）
- `repeat_every_second.sh`: ping_wrapper.pyを1秒ごとに定期実行するシェルスクリプト
- `Dockerfile`, `docker-compose.yml`: Docker環境での実行用
- `test_ping_wrapper.py`: 単体テスト

## 出力フォーマット

```
{リクエスト開始時刻} {成功時はms(小数第3位まで)} 失敗時はnull
```

- リクエスト開始時刻: ISO 8601形式（例: 2025-05-22T12:34:56.789Z、UTC）
- ms: 成功時は応答時間（小数点第3位まで, ms単位）、失敗時は null

## 仕様詳細

### 入力
- 対象ホスト（IPアドレスまたはホスト名）
- ホスト名（ログファイル名用）

### 処理フロー
1. 現在時刻（UTC, ISO 8601形式, ミリ秒付き）を取得
2. pingコマンドを1回実行（5パケット, インターバル0.01秒, タイムアウト0.3秒）
   - OSによりコマンドオプションが異なる（macOS: `-W 300`[ms], Linux: `-W 0.3`[秒]）
3. ping応答から最初の応答時間（ms）を抽出
   - 応答がなければ失敗
   - 応答時間が500ms以下なら成功、超えていれば失敗
4. 結果を指定フォーマットで標準出力・ログファイル（`logs/dt=YYYYMMDD/<hostname>.log`）に出力

### 出力例

- 成功時:
  ```
  2025-05-22T12:34:56.789Z 23.123
  ```
- 失敗時:
  ```
  2025-05-22T12:34:56.789Z null
  ```

## エラー処理
- pingコマンドが失敗した場合（タイムアウト、到達不可等）は「失敗」とし、msはnullとする
- 例外発生時もnull出力

## ログ出力仕様
- 日付ごとに `logs/dt=YYYYMMDD/` ディレクトリを自動生成
- ホスト名ごとにログファイルを分割（例: `logs/dt=20250601/myhost.log`）
- 1行1レコードで追記

## 定期実行
- `repeat_every_second.sh` で1秒ごとに `ping_wrapper.py` を実行可能
- Dockerfile/composeで自動実行例あり

## Dockerによる実行例

### Dockerfile（抜粋）
```
FROM python:3.11-slim
WORKDIR /app
COPY *.py *.sh ./ping_stats/
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["bash", "ping_stats/repeat_every_second.sh", "python", "ping_stats/ping_wrapper.py"]
CMD ["8.8.8.8", "mymachine"]
```

### docker-compose.yml（抜粋）
```
services:
  ping:
    build: .
    volumes:
      - ./logs:/app/logs
    working_dir: /app/ping_stats
    command: ["8.8.8.8", "myhost"]
```

## テスト
- `test_ping_wrapper.py` にて、成功・失敗（タイムアウト・閾値超過）パターンのテストを実装

## 拡張性
- 閾値やping回数、インターバル等はスクリプト修正で変更可能
- 関数化されており、将来的な拡張も容易
