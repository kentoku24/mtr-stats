import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBranchName,
  buildCodexPrompt,
  parseTaskReference,
  stripBotMentions
} from "../src/slack-format.js";

test("buildBranchName converts thread ts to a git-safe branch", () => {
  assert.equal(buildBranchName("codex/slack", "1741692312.001200"), "codex/slack/1741692312-001200");
});

test("stripBotMentions removes slack mention tokens", () => {
  assert.equal(stripBotMentions("<@U123> please fix tests"), "please fix tests");
});

test("parseTaskReference extracts both id and url", () => {
  const parsed = parseTaskReference(
    "Created task task_abc123\nhttps://chatgpt.com/codex/tasks/task_abc123"
  );

  assert.deepEqual(parsed, {
    taskId: "task_abc123",
    taskUrl: "https://chatgpt.com/codex/tasks/task_abc123"
  });
});

test("buildCodexPrompt preserves branch and request", () => {
  const prompt = buildCodexPrompt({
    repoName: "mtr-stats",
    branch: "codex/slack/1741692312-001200",
    userId: "U123",
    requestText: "Add a Slack bot."
  });

  assert.match(prompt, /Work only on branch codex\/slack\/1741692312-001200/);
  assert.match(prompt, /Add a Slack bot\./);
});
