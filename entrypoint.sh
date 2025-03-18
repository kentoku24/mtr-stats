#!/bin/sh

# デフォルトのターゲットホスト
TARGET_HOST=${TARGET_HOST:-"8.8.8.8"}

# タイムゾーンをAsia/Tokyoに設定
export TZ=Asia/Tokyo

# 現在の日付を取得
CURRENT_DATE=$(date '+%Y_%m_%d')
# ローカルホストIPを取得
HOST_IP=$(hostname -i)
# 出力ファイル名を設定
OUTPUT_FILE="/logs/${CURRENT_DATE}__${HOST_IP}_${TARGET_HOST}.log"

echo "mtr script started for $TARGET_HOST"

while true; do
    # 次の分の0秒になるまで待機
    while [ "$(date +%S)" != "00" ]; do
        echo "waiting $(date +%S) to be 00"
        sleep 0.2
    done
    
    # 現在時刻をISO8601形式でタイムゾーン付きで取得
    CURRENT_TIME=$(date '+%Y-%m-%dT%H:%M:%S%z')
    # タイムスタンプとローカルホストIPを追加
    echo "=== MTR Report from $HOST_IP at $CURRENT_TIME ===" >> $OUTPUT_FILE
    
    # mtrコマンドを実行し、jqでtimeキーを追加
    mtr -r -c 10 --json $TARGET_HOST | jq --arg time "$CURRENT_TIME" '.report.time = $time' >> $OUTPUT_FILE
    echo "" >> $OUTPUT_FILE
    
    # 少し待機して次のループに入る（59秒後）
    # 現在の秒を取得
    current_seconds=$(date +%S)
    
    # 次の分の0秒までの待ち時間を計算
    sleep_seconds=$((58 - current_seconds))
    
    # 負の値になった場合は0に設定
    if [ $sleep_seconds -lt 0 ]; then
        sleep_seconds=0
    fi
    
    echo "waiting $sleep_seconds seconds to next minute"
    # 次の分の0秒まで待機
    sleep $sleep_seconds
done