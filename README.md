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

MTRの測定結果は`logs/mtr_stats.txt`に保存されます。各測定には以下の情報が含まれます：

- タイムスタンプ
- ホスト情報
- パケットロス率
- レイテンシー統計（最小、平均、最大、標準偏差）

## プロジェクト構成

- `Dockerfile`: コンテナイメージのビルド定義
- `docker-compose.yml`: Docker Compose設定
- `entrypoint.sh`: コンテナ起動時の実行スクリプト
- `logs/`: 測定結果の保存ディレクトリ

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。


## 2025/03/19時点の使い方

./yyyymmdd_raw/ ディレクトリ以下に全ログファイルをいれる
cat ./yyyymmdd_raw/* | sh extract_mtr_stats.sh | python reduce.py > yyyymmdd_all.log