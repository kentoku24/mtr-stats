import sys
import subprocess
import datetime
import platform

def get_now():
    # UTCのISO 8601形式（ミリ秒付き）
    now = datetime.datetime.now(datetime.timezone.utc)
    return now

def run_ping(host):
    # macOSとLinuxで-Wの単位が異なるため分岐
    if platform.system() == 'Darwin':
        # macOS: -Wはミリ秒
        cmd = ['ping', '-c', '5', '-i', '0.01', '-W', '300', host]
    else:
        # Linux: -Wは秒（小数可）
        cmd = ['ping', '-c', '5', '-i', '0.01', '-W', '0.3', host]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
        if result.returncode != 0:
            return None
        # 出力からtime=xxx msを抽出
        for line in result.stdout.splitlines():
            if 'time=' in line:
                # 例: time=23.456 ms
                try:
                    ms = float(line.split('time=')[1].split(' ')[0])
                    return ms
                except Exception:
                    return None
        return None
    except Exception:
        return None

def format_time(dt):
    # 2025-05-22T12:34:56.789Z の形式
    return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    if not argv:
        print('Usage: ping_wrapper.py <host>', file=sys.stderr)
        sys.exit(1)
    host = argv[0]
    now = get_now()
    ms = run_ping(host)
    if ms is not None and ms <= 500:
        # 小数点以下3桁で出力
        print(f"{format_time(now)} {ms:.3f}")
    else:
        print(f"{format_time(now)} null")

if __name__ == '__main__':
    main()
