import "dotenv/config";

import { App } from "@slack/bolt";
import path from "node:path";
import { loadConfig } from "./config.js";
import { StateStore } from "./state-store.js";
import {
  buildBranchName,
  buildCodexPrompt,
  buildThreadKey,
  sanitizeThreadId,
  stripBotMentions
} from "./slack-format.js";
import { ensureWorktree, summarizeWorktree } from "./worktree-manager.js";
import { applyTask, submitTask, waitForTask } from "./codex-cloud.js";

class SerialQueue {
  constructor() {
    this.running = false;
    this.pending = [];
  }

  add(task) {
    this.pending.push(task);
    void this.drain();
  }

  async drain() {
    if (this.running) {
      return;
    }
    this.running = true;

    while (this.pending.length > 0) {
      const task = this.pending.shift();
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    }

    this.running = false;
  }
}

function truncate(text, maxLength = 2800) {
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
}

async function postThreadMessage(app, channel, threadTs, text) {
  await app.client.chat.postMessage({
    channel,
    thread_ts: threadTs,
    text: truncate(text)
  });
}

async function main() {
  const config = loadConfig();
  const store = new StateStore(config.stateFile);
  const queue = new SerialQueue();
  const repoName = path.basename(config.repoRoot);

  const app = new App({
    token: config.slackBotToken,
    signingSecret: config.slackSigningSecret,
    socketMode: config.socketMode,
    appToken: config.slackAppToken
  });

  const auth = await app.client.auth.test({ token: config.slackBotToken });
  const botUserId = auth.user_id;

  async function enqueueSlackTask({ channel, threadTs, userId, requestText }) {
    const threadKey = buildThreadKey(channel, threadTs);

    queue.add(async () => {
      const branch = buildBranchName(config.codexBranchPrefix, threadTs);
      const worktreeId = sanitizeThreadId(threadTs);
      const worktreePath = await ensureWorktree({
        repoRoot: config.repoRoot,
        worktreeRoot: config.worktreeRoot,
        branch,
        baseBranch: config.codexBaseBranch,
        worktreeId
      });

      await store.upsertThread(threadKey, () => ({
        channel,
        threadTs,
        branch,
        worktreePath,
        status: "submitting"
      }));

      await postThreadMessage(
        app,
        channel,
        threadTs,
        [
          "Codex Cloud task を投入します。",
          `branch: \`${branch}\``,
          `worktree: \`${worktreePath}\``
        ].join("\n")
      );

      const prompt = buildCodexPrompt({
        repoName,
        branch,
        userId,
        requestText
      });

      const submission = await submitTask({
        cwd: worktreePath,
        envId: config.codexEnvId,
        branch,
        prompt,
        attempts: config.codexTaskAttempts
      });

      await store.upsertThread(threadKey, () => ({
        latestTaskId: submission.taskId,
        latestTaskUrl: submission.taskUrl,
        latestRequestText: requestText,
        status: "running"
      }));

      await postThreadMessage(
        app,
        channel,
        threadTs,
        [
          "Codex Cloud で実行を開始しました。",
          submission.taskId && `task: \`${submission.taskId}\``,
          submission.taskUrl && `url: ${submission.taskUrl}`
        ]
          .filter(Boolean)
          .join("\n")
      );

      const task = await waitForTask({
        cwd: worktreePath,
        envId: config.codexEnvId,
        taskId: submission.taskId,
        pollIntervalMs: config.codexPollIntervalMs
      });

      await store.upsertThread(threadKey, () => ({
        latestTaskId: task.id,
        latestTaskUrl: task.url,
        status: task.status
      }));

      if (task.status !== "ready") {
        await postThreadMessage(
          app,
          channel,
          threadTs,
          [
            `Codex task ended with status: ${task.status}`,
            task.url && `url: ${task.url}`
          ]
            .filter(Boolean)
            .join("\n")
        );
        return;
      }

      let applyMessage = "remote task finished";
      if (config.codexAutoApply && (task.summary?.files_changed || 0) > 0) {
        const applied = await applyTask({ cwd: worktreePath, taskId: task.id });
        applyMessage = applied.stdout || applyMessage;
      }

      const summary = await summarizeWorktree(worktreePath);
      await store.upsertThread(threadKey, () => ({
        status: "ready",
        lastAppliedAt: new Date().toISOString()
      }));

      await postThreadMessage(
        app,
        channel,
        threadTs,
        [
          "Codex task completed.",
          task.url && `url: ${task.url}`,
          `branch: \`${branch}\``,
          `worktree: \`${worktreePath}\``,
          `remote summary: ${task.summary?.files_changed || 0} files, +${task.summary?.lines_added || 0} / -${task.summary?.lines_removed || 0}`,
          config.codexAutoApply ? `apply: ${applyMessage}` : "apply: skipped by config",
          summary.diffStat && `diff: ${summary.diffStat}`,
          summary.status && `git status:\n\`\`\`\n${truncate(summary.status, 1200)}\n\`\`\``
        ]
          .filter(Boolean)
          .join("\n")
      );
    });
  }

  app.event("app_mention", async ({ event }) => {
    const requestText = stripBotMentions(event.text);
    if (!requestText) {
      return;
    }

    const threadTs = event.thread_ts || event.ts;
    await enqueueSlackTask({
      channel: event.channel,
      threadTs,
      userId: event.user,
      requestText
    });
  });

  app.message(async ({ message }) => {
    if (!("thread_ts" in message) || !message.thread_ts) {
      return;
    }
    if (!("user" in message) || !message.user || message.user === botUserId) {
      return;
    }
    if (!("text" in message) || !message.text) {
      return;
    }
    if (message.text.includes(`<@${botUserId}>`)) {
      return;
    }

    const threadKey = buildThreadKey(message.channel, message.thread_ts);
    const threadState = await store.getThread(threadKey);
    if (!threadState) {
      return;
    }

    await enqueueSlackTask({
      channel: message.channel,
      threadTs: message.thread_ts,
      userId: message.user,
      requestText: message.text.trim()
    });
  });

  if (config.socketMode) {
    await app.start();
    console.log("Slack Codex Cloud bot started in socket mode.");
    return;
  }

  await app.start(config.port);
  console.log(`Slack Codex Cloud bot started on port ${config.port}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
