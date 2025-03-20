#!/bin/sh

# タイムゾーンをAsia/Tokyoに設定
export TZ='Asia/Tokyo'

TARGET_HOST=${TARGET_HOST:-"8.8.8.8"}
HOST_IP=$(hostname -i)

while true; do
    # 次の分の0秒になるまで待機
    while [ "$(date +%S)" != "00" ]; do
        sleep 0.2
    done
    echo "mtr script started for $TARGET_HOST" >&2
    # 現在時刻をISO8601形式でタイムゾーン付きで取得
    CURRENT_TIME=$(date '+%Y-%m-%dT%H:%M:%S%z')
    # 現在の日付を取得
    CURRENT_DATE=$(date '+%Y_%m_%d')
    # Create date-based directory format yyyymmdd
    DATE_DIR=$(date '+%Y%m%d')
    DIR_PATH="/logs/dt=${DATE_DIR}"
    # Create directory if it doesn't exist
    mkdir -p "${DIR_PATH}"
    OUTPUT_FILE="${DIR_PATH}/to_${TARGET_HOST}_from_${HOST_IP}.log"
    
    # Store MTR output in a variable and process it using transform_mtr_json.sh
    RAW_MTR_OUTPUT=$(mtr -r -b -c 5 --json $TARGET_HOST | sh /transform_mtr_json.sh "$CURRENT_TIME" "$HOST_IP")
    
    # Append to output file
    echo "$RAW_MTR_OUTPUT" >> $OUTPUT_FILE
    
    # Process and display stats
    #echo "$RAW_MTR_OUTPUT" | sh /extract_for_datadog.sh #rawでも読めるかもなので一回無効化
    echo "$RAW_MTR_OUTPUT"

    # 少し待機して次のループに入る（59秒後）
    current_seconds=$(date +%-S)    
    # 次の分の0秒までの待ち時間を計算
    sleep_seconds=0
    if [ "$current_seconds" -le 58 ]; then
        sleep_seconds=$((58 - current_seconds))
    fi
    echo "waiting $sleep_seconds seconds to next minute" >&2
    # 次の分の0秒まで待機
    sleep "$sleep_seconds"

done