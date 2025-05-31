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
            ping_wrapper.main(['8.8.8.8'])
            sys.stdout = sys.__stdout__
            return buf.getvalue().strip()

def test_success():
    # 23msで成功
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    output = run_script_with_mocked_ping(23, now)
    assert re.match(r"2025-05-22T12:34:56.789Z 23", output)

def test_failure_timeout():
    # 応答なし
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    output = run_script_with_mocked_ping(None, now)
    assert re.match(r"2025-05-22T12:34:56.789Z null", output)

def test_failure_over_500ms():
    # 600msで失敗
    now = datetime.datetime(2025, 5, 22, 12, 34, 56, 789000, tzinfo=datetime.timezone.utc)
    output = run_script_with_mocked_ping(600, now)
    assert re.match(r"2025-05-22T12:34:56.789Z null", output)
