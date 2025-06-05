# MTR Statistics Collector

このプロジェクトは、MTR（My TraceRoute）を使用して定期的にネットワークの統計情報を収集するDockerコンテナを提供します。1分ごとにMTRの測定を実行し、結果をログファイルに保存します。

## 機能

- 1分ごとのMTR統計情報の収集
- 指定したターゲットホストへの到達性と遅延の測定
- 測定結果のログファイルへの自動保存
- Docker環境での簡単な実行

## 必要条件

- Docker
- Docker Compose

## 使用方法

1. リポジトリをクローン：
```bash
git clone https://github.com/[username]/mtr-stats.git
cd mtr-stats
```

2. Docker Composeで起動：
```bash
docker compose up -d
```

### 設定のカスタマイズ

`docker-compose.yml`の環境変数で監視対象のホストを変更できます：

```yaml
environment:
  - TARGET_HOST=8.8.8.8  # デフォルトはGoogle DNS
```

## ログの保存場所

**MTR Collector:**
MTRの測定結果は、メインのMTR収集サービス（ルートの `docker-compose.yml` で定義）により `logs/mtr_stats.txt` に保存される想定です。

**Ping Statistics Collector:**
Pingの測定結果は、`ping_stats` サービスにより、デフォルトではコンテナ内の `/app/logs/dt=<YYYYMMDD>/<hostname>.log` に保存されます。このパスは `LOG_BASE_PATH` 環境変数で設定可能です。`ping_stats/docker-compose.yml` を使用する場合、ホストの `ping_stats/logs` ディレクトリにマウントされます。

## プロジェクト構成

主要なファイルとディレクトリの構成は以下の通りです。

- `docker-compose.yml`: メインのMTR収集サービスおよび関連サービスを起動するためのDocker Compose設定。
- `entrypoint.sh`: メインのMTR収集コンテナの起動時に実行されるスクリプト。
- `process_mtr_json.sh`: MTRのJSON形式の出力データを処理・集約するためのシェルスクリプト。`original` または `datadog` フォーマットで出力可能。
- `reduce.py`: `process_mtr_json.sh` からの出力をさらに集約するためのPythonスクリプト（想定）。
- `logs/`: MTR収集サービスからのログが保存されるディレクトリ（ホスト側）。
- `ping_stats/`: Ping Statistics Collector関連のファイル群。
    - `Dockerfile`: Ping Statistics CollectorサービスのDockerイメージをビルドするための定義ファイル。
    - `docker-compose.yml`: Ping Statistics Collectorサービスおよび関連サービス（例: rsync）を起動するためのDocker Compose設定。
    - `ping_wrapper.py`: 指定されたIPアドレスに対して定期的にpingを実行し、結果をログに記録するPythonスクリプト。
        - ログのベースディレクトリは `LOG_BASE_PATH` 環境変数（デフォルト: `/app/logs`）で設定可能。
    - `repeat_every_second.sh`: `ping_wrapper.py` を定期実行するための補助スクリプト。
    - `test_ping_wrapper.py`: `ping_wrapper.py` のユニットテスト。
    - `logs/`: Ping Statistics Collectorのログが保存されるディレクトリ（ホスト側、`ping_stats/docker-compose.yml` 使用時）。
- `docker_compose_ping.yml`: `ping_stats` のDockerイメージを単独で実行するためのDocker Compose設定（ルートディレクトリから利用）。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## MTRデータ処理 (旧: 2025/03/19時点の使い方)

収集されたMTRのJSONデータを処理する場合：
`./yyyymmdd_raw/` ディレクトリ以下に処理したいMTRのJSONログファイル（1行1JSONオブジェクト形式を想定）を配置します。
以下のコマンドで集約処理を実行します。

```bash
cat ./yyyymmdd_raw/* | sh process_mtr_json.sh <format_type> | python reduce.py > yyyymmdd_all.log
```
ここで `<format_type>` は `"original"` または `"datadog"` のいずれかを指定します。

## Ping Statistics Collector (`ping_stats`)

`ping_stats` ディレクトリには、指定されたIPアドレスに対して定期的にpingを実行し、その遅延を記録するユーティリティが含まれています。

### 主な機能
- `ping_wrapper.py`:
    - 指定されたターゲットIPに定期的にpingを実行します。
    - 測定された遅延（ミリ秒単位）やエラー情報をログファイルに記録します。
    - ログファイルのベースディレクトリは `LOG_BASE_PATH` 環境変数で設定可能です（コンテナ内でのデフォルトは `/app/logs`）。
- `repeat_every_second.sh`: `ping_wrapper.py` を1秒ごとに実行するためのシェルスクリプトです。

### Dockerでの実行
`ping_stats` サービスはDockerコンテナとして実行することを前提としています。

1.  **Dockerfile:**
    `ping_stats/Dockerfile` が、このサービスのDockerイメージをビルドするための主要な定義ファイルです。

2.  **Docker Composeでの実行:**
    `ping_stats` ディレクトリ内で以下のコマンドを実行することで、ping収集サービス（および設定されていればrsyncサービス）を起動できます。
    ```bash
    cd ping_stats
    docker compose up -d
    ```
    - ターゲットIPアドレスやホスト名は `ping_stats/docker-compose.yml` 内の `command` で設定できます。
    - デフォルトでは、コンテナは `CMD ["8.8.8.8", "default_host"]` で定義された引数（ターゲットIP `8.8.8.8`、ホスト名 `default_host`）で `ping_wrapper.py` を実行します。

3.  **ルートディレクトリからの単独実行:**
    ルートディレクトリにある `docker_compose_ping.yml` を使用して、ping収集コンテナを単独で起動することも可能です。
    ```bash
    docker compose -f docker_compose_ping.yml up -d
    ```
    この場合も、必要に応じて `docker_compose_ping.yml` 内で `command` をオーバーライドしてターゲットIPやホスト名を変更できます。