FROM python:3.11-slim

WORKDIR /app

# ping_stats ディレクトリ内の .py, .sh ファイルを明示的にコピー
COPY ping_wrapper.py repeat_every_second.sh test_ping_wrapper.py /app/ping_stats/

# logs ディレクトリを作成（マウント用）
RUN mkdir -p /app/logs

# 必要なパッケージをバージョン固定でインストール
RUN apt-get update \
    && apt-get install -y iputils-ping=3:20221126-1+deb12u1 \
    && rm -rf /var/lib/apt/lists/*

# repeat_every_second.sh で ping_wrapper.py を定期実行（引数はdocker-composeから渡す）
ENTRYPOINT ["bash", "/app/ping_stats/repeat_every_second.sh", "python", "/app/ping_stats/ping_wrapper.py"]
CMD ["8.8.8.8", "mymachine"]