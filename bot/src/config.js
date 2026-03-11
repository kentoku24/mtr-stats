import path from "node:path";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseBoolean(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parseInteger(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Expected integer, received "${value}"`);
  }
  return parsed;
}

export function loadConfig() {
  const repoRoot = process.cwd();
  const socketMode = parseBoolean(process.env.SLACK_SOCKET_MODE, true);

  return {
    repoRoot,
    port: parseInteger(process.env.PORT, 3000),
    slackBotToken: requireEnv("SLACK_BOT_TOKEN"),
    slackSigningSecret: requireEnv("SLACK_SIGNING_SECRET"),
    slackAppToken: socketMode ? requireEnv("SLACK_APP_TOKEN") : undefined,
    socketMode,
    codexEnvId: requireEnv("CODEX_ENV_ID"),
    codexBaseBranch: process.env.CODEX_BASE_BRANCH || "main",
    codexBranchPrefix: process.env.CODEX_BRANCH_PREFIX || "codex/slack",
    codexTaskAttempts: parseInteger(process.env.CODEX_TASK_ATTEMPTS, 1),
    codexPollIntervalMs: parseInteger(process.env.CODEX_POLL_INTERVAL_MS, 15000),
    codexAutoApply: parseBoolean(process.env.CODEX_AUTO_APPLY, true),
    worktreeRoot: path.resolve(repoRoot, process.env.CODEX_WORKTREE_ROOT || ".codex-slack-worktrees"),
    stateFile: path.resolve(repoRoot, process.env.STATE_FILE || "bot/data/state.json")
  };
}
