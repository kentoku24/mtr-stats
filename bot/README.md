# Slack Codex Cloud Bot

Slack のメンションやスレッド返信を受けて、`codex cloud exec` で Codex Cloud task を起動し、完了後に `codex cloud apply` でローカル worktree に差分を反映する Bot です。

## 前提

- `codex` CLI が使えること
- Codex Cloud 環境が作成済みで、`CODEX_ENV_ID` が分かっていること
- Slack App に以下が設定されていること
  - Bot Token (`xoxb-...`)
  - Signing Secret
  - App-Level Token (`xapp-...`) を使う場合は Socket Mode を有効化
- Slack App Event Subscriptions
  - `app_mention`
  - `message.channels` または利用チャネルに応じた `message.*`

## セットアップ

```bash
cd bot
cp .env.example .env
npm install
npm start
```

`.env` の主要項目:

- `CODEX_ENV_ID`: `codex cloud exec --env <ENV_ID>` に渡す環境 ID
- `CODEX_BASE_BRANCH`: Slack スレッド用 branch を切る元ブランチ
- `CODEX_BRANCH_PREFIX`: 生成する branch の prefix
- `CODEX_WORKTREE_ROOT`: thread ごとの worktree を置くディレクトリ
- `CODEX_AUTO_APPLY`: `true` のとき task 完了後に `codex cloud apply` を実行

## 動作

1. Slack で Bot をメンションすると、そのメッセージを親にして thread を開始
2. Bot が thread ごとの branch / worktree を作成
3. `codex cloud exec --env ... --branch ...` を実行
4. 完了までポーリング
5. task が `ready` なら `codex cloud apply` を実行し、Slack thread に branch / worktree / diff 状況を返す

同じ Slack thread に対する返信は、同じ branch / worktree に継続して流れます。

## 注意点

- キューは直列実行です。複数 request を安全側で 1 本ずつ処理します。
- worktree は `.codex-slack-worktrees/` 配下に残ります。
- Codex Cloud 側の branch 状態を使って継続する前提です。ローカルの未コミット差分だけを次の Cloud task に見せたい運用には向きません。
- `codex cloud list --json` の最新 20 件をポーリング対象にしています。
