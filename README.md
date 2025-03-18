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

## Docker Swarmでのデプロイ

### 基本的なデプロイ
1. Docker Swarmを初期化：
```bash
docker swarm init
```

2. 他のRaspberry PiをSwarmに参加させる：
```bash
# マネージャーノードで表示されたコマンドを各Raspberry Piで実行
docker swarm join --token <TOKEN> <MANAGER-IP>:2377
```

3. Raspberry Piにノードラベルをつける（オプション）：
```bash
docker node update --label-add raspi=1 <NODE-ID-1>
docker node update --label-add raspi=2 <NODE-ID-2>
docker node update --label-add raspi=3 <NODE-ID-3>
```

4. スタックをデプロイ：
```bash
docker stack deploy -c docker-compose.yml mtr-stats
```

### 特定のノードでの実行

ノードラベルを使用して特定のRaspberry Piで実行するには、docker-compose.ymlに以下の設定を追加します：

```yaml
deploy:
  placement:
    constraints:
      - node.labels.raspi == 1  # 特定のラベルを持つノードで実行
```

### デプロイ状態の確認

```bash
# サービスの状態確認
docker service ls

# タスクの分布確認
docker service ps mtr-stats_mtr
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。