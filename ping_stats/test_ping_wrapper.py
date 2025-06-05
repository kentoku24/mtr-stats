import re
import sys
import io
import datetime
import pytest
from unittest import mock

# テスト対象のモジュール名は仮にping_wrapper.pyとする
def run_script_with_mocked_ping(mocked_ping_result, mocked_now):
    import ping_wrapper
    with mock.patch('ping_wrapper.run_ping', return_value=mocked_ping_result):
        with mock.patch('ping_wrapper.get_now', return_value=mocked_now):
            buf = io.StringIO()
            sys.stdout = buf
            # pingコマンドの呼び出し内容を確認するため、host名を8.8.8.8に
            # -c 5 で呼び出すことを想定
            # Corrected: Pass two arguments to main
            ping_wrapper.main(['8.8.8.8', 'test_host'])
            sys.stdout = sys.__stdout__
            return buf.getvalue().strip()

def test_success():
    # 23msで成功
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    # Updated: run_ping mock returns float
    output = run_script_with_mocked_ping(23.0, now)
    # Regex should match the formatted float (e.g., 23.000)
    assert re.match(r"2025-05-22T12:34:56.789Z 23.000", output)

def test_failure_timeout():
    # 応答なし
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    # Updated: run_ping mock returns "timeout_error"
    output = run_script_with_mocked_ping("timeout_error", now)
    assert re.match(r"2025-05-22T12:34:56.789Z null", output)

def test_failure_over_500ms():
    # 600msで失敗
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    # Updated: run_ping mock returns float
    output = run_script_with_mocked_ping(600.0, now)
    assert re.match(r"2025-05-22T12:34:56.789Z null", output)

# --- Unit tests for run_ping ---
import platform
import subprocess # For TimeoutExpired
import ping_wrapper # Import the module directly to test run_ping

class TestRunPing:
    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run')
    def test_run_ping_success_linux(self, mock_subprocess_run, mock_platform_system):
        mock_result = mock.MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.\n64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=5.123 ms\n\n--- 1.1.1.1 ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss, time 0ms\nrtt min/avg/max/mdev = 5.123/5.123/5.123/0.000 ms"
        mock_subprocess_run.return_value = mock_result

        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == 5.123
        mock_subprocess_run.assert_called_once()
        # Check if the Linux -W parameter (seconds) is used
        assert '-W' in mock_subprocess_run.call_args[0][0]
        assert mock_subprocess_run.call_args[0][0][mock_subprocess_run.call_args[0][0].index('-W') + 1] == '0.3'

    @mock.patch('platform.system', return_value='Darwin')
    @mock.patch('subprocess.run')
    def test_run_ping_success_macos(self, mock_subprocess_run, mock_platform_system):
        mock_result = mock.MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "PING 1.1.1.1 (1.1.1.1): 56 data bytes\n64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=10.456 ms\n\n--- 1.1.1.1 ping statistics ---\n1 packets transmitted, 1 packets received, 0.0% packet loss\nround-trip min/avg/max/stddev = 10.456/10.456/10.456/0.000 ms"
        mock_subprocess_run.return_value = mock_result

        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == 10.456
        mock_subprocess_run.assert_called_once()
        # Check if the macOS -W parameter (milliseconds) is used
        assert '-W' in mock_subprocess_run.call_args[0][0]
        assert mock_subprocess_run.call_args[0][0][mock_subprocess_run.call_args[0][0].index('-W') + 1] == '300'

    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run')
    def test_run_ping_execution_error(self, mock_subprocess_run, mock_platform_system):
        mock_result = mock.MagicMock()
        mock_result.returncode = 1
        mock_result.stdout = "ping: connect: Network is unreachable"
        mock_subprocess_run.return_value = mock_result

        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == "execution_error"

    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run', side_effect=subprocess.TimeoutExpired(cmd=['ping'], timeout=2))
    def test_run_ping_timeout_error(self, mock_subprocess_run, mock_platform_system):
        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == "timeout_error"

    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run')
    def test_run_ping_parsing_error_no_time(self, mock_subprocess_run, mock_platform_system):
        mock_result = mock.MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "some other output without time="
        mock_subprocess_run.return_value = mock_result

        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == "parsing_error"

    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run')
    def test_run_ping_parsing_error_bad_float(self, mock_subprocess_run, mock_platform_system):
        mock_result = mock.MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=abc ms"
        mock_subprocess_run.return_value = mock_result

        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == "parsing_error"

    @mock.patch('platform.system', return_value='Linux')
    @mock.patch('subprocess.run', side_effect=Exception("Unexpected subprocess error"))
    def test_run_ping_unknown_error(self, mock_subprocess_run, mock_platform_system):
        result = ping_wrapper.run_ping('1.1.1.1')
        assert result == "unknown_error"
