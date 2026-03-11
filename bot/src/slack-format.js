export function sanitizeThreadId(value) {
  return value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function buildThreadKey(channel, threadTs) {
  return `${channel}:${threadTs}`;
}

export function buildBranchName(prefix, threadTs) {
  return `${prefix}/${sanitizeThreadId(threadTs)}`;
}

export function stripBotMentions(text) {
  return text.replace(/<@[^>]+>/g, "").trim();
}

export function buildCodexPrompt({ repoName, branch, userId, requestText }) {
  return [
    `Slack request for repository ${repoName}.`,
    `Work only on branch ${branch}.`,
    "Implement the request directly in code when appropriate.",
    "Keep changes scoped. Avoid unrelated refactors.",
    "Leave a concise final summary of what changed and any risks.",
    "",
    `Slack user: ${userId}`,
    "Request:",
    requestText
  ].join("\n");
}

export function parseTaskReference(text) {
  const taskId = text.match(/task_[A-Za-z0-9_]+/)?.[0] || null;
  const taskUrl = text.match(/https:\/\/chatgpt\.com\/codex\/tasks\/[A-Za-z0-9_]+/)?.[0] || null;

  return { taskId, taskUrl };
}
