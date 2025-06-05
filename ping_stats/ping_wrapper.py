import sys
import subprocess
import datetime
import platform
import os

def get_now():
    # UTCのISO 8601形式（ミリ秒付き）
    now = datetime.datetime.now(datetime.timezone.utc)
    return now

def run_ping(target_ip):
    # macOSとLinuxで-Wの単位が異なるため分岐
    if platform.system() == 'Darwin':
        # macOS: -Wはミリ秒
        cmd = ['ping', '-c', '5', '-i', '0.01', '-W', '300', target_ip]
    else:
        # Linux: -Wは秒（小数可）
        cmd = ['ping', '-c', '5', '-i', '0.01', '-W', '0.3', target_ip]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
        if result.returncode != 0:
            # Ping command executed but indicated an error (e.g., host unreachable, but not a timeout)
            return "execution_error"
        # 出力からtime=xxx msを抽出
        for line in result.stdout.splitlines():
            if 'time=' in line:
                # 例: time=23.456 ms
                try:
                    ms = float(line.split('time=')[1].split(' ')[0])
                    return ms
                except (ValueError, IndexError):
                    # Failed to parse the time value
                    return "parsing_error"
        # 'time=' not found in output
        return "parsing_error"
    except subprocess.TimeoutExpired:
        return "timeout_error"
    except Exception:
        # Catch-all for any other unexpected errors during subprocess execution or otherwise
        return "unknown_error"

def format_time(dt):
    # 2025-05-22T12:34:56.789Z の形式
    return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    if len(argv) < 2:
        print('Usage: ping_wrapper.py <target_ip> <hostname>', file=sys.stderr)
        sys.exit(1)
    target_ip = argv[0]
    hostname = argv[1]
    now = get_now()
    ms_or_error = run_ping(target_ip) # Renamed to reflect it can be error string
    # ログディレクトリ作成
    log_date = now.strftime('%Y%m%d')
    # Fetch LOG_BASE_PATH from environment variables, default to /app/logs
    log_base_path = os.getenv('LOG_BASE_PATH', '/app/logs')
    log_dir = f"{log_base_path}/dt={log_date}/"
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"{hostname}.log")

    # Process the result from run_ping
    # Existing tests expect 'null' for errors or high latency.
    # The improved run_ping gives more specific errors, but main will normalize to 'null' for logging.
    if isinstance(ms_or_error, float) and ms_or_error <= 500:
        log_line = f"{format_time(now)} {ms_or_error:.3f}"
    else:
        # This covers:
        # - ms_or_error being a float > 500
        # - ms_or_error being "execution_error"
        # - ms_or_error being "timeout_error"
        # - ms_or_error being "parsing_error"
        # - ms_or_error being "unknown_error"
        log_line = f"{format_time(now)} null"
    print(log_line)
    with open(log_path, 'a') as f:
        f.write(log_line + '\n')

if __name__ == '__main__':
    main()
