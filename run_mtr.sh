#!/bin/sh

# Usage function to display how to use the script
usage() {
  echo "Usage: $0 TARGET_HOST HOST_IP CURRENT_TIME DIR_PATH"
  echo ""
  echo "Arguments:"
  echo "  TARGET_HOST  - The destination IP address or hostname to run MTR against (e.g., 8.8.8.8 or example.com)"
  echo "  HOST_IP      - The source IP address where MTR is running from (e.g., 172.22.0.3)"
  echo "  CURRENT_TIME - Timestamp for the MTR test, typically in YYYY_MM_DD format (e.g., 2025_04_06)"
  echo "  DIR_PATH     - Directory path where the log file will be saved (e.g., /logs)"
  echo ""
  echo "Example: $0 8.8.8.8 172.22.0.3 2025_04_06 /logs"
  exit 1
}

# If no arguments provided or help requested, show usage
if [ $# -ne 4 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  usage
fi

# 引数を受け取る
TARGET_HOST=$1
HOST_IP=$2
CURRENT_TIME=$3
DIR_PATH=$4

# 出力ファイル名を設定
OUTPUT_FILE="${DIR_PATH}/to_${TARGET_HOST}_from_${HOST_IP}.log"

# MTRを実行して結果を整形
RAW_MTR_OUTPUT=$(mtr -r -b -c 5 --json $TARGET_HOST | sh transform_mtr_json.sh "$CURRENT_TIME" "$HOST_IP")

# ログファイルに出力
echo "$RAW_MTR_OUTPUT" >> $OUTPUT_FILE

# 標準出力に結果を返す
echo "$RAW_MTR_OUTPUT"