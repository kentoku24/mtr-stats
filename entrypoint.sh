#!/bin/sh

# タイムゾーンをAsia/Tokyoに設定
export TZ='Asia/Tokyo'

TARGET_HOST=${TARGET_HOST:-"8.8.8.8"}
HOST_IP=$(hostname -i)

echo "mtr script started for $TARGET_HOST"

while true; do
    # 次の分の0秒になるまで待機
    while [ "$(date +%S)" != "00" ]; do
        echo "waiting $(date +%S) to be 00"
        sleep 0.2
    done
    
    # 現在時刻をISO8601形式でタイムゾーン付きで取得
    CURRENT_TIME=$(date '+%Y-%m-%dT%H:%M:%S%z')
    # 現在の日付を取得
    CURRENT_DATE=$(date '+%Y_%m_%d')
    OUTPUT_FILE="/logs/${CURRENT_DATE}__to_${TARGET_HOST}_from_${HOST_IP}.log"

    # Store the description in a variable
    DESCRIPTION="=== MTR Report from $HOST_IP at $CURRENT_TIME ==="
    
    # Modified jq command to add both time and description with compact output
    mtr -r -b -c 50 --json $TARGET_HOST | jq -c --arg time "$CURRENT_TIME" --arg desc "$DESCRIPTION" '.report.time = $time | .report.description = $desc' >> $OUTPUT_FILE
    
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