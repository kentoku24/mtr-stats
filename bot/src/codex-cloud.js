import { runCommand } from "./command.js";
import { parseTaskReference } from "./slack-format.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listTasks({ cwd, envId, limit = 20 }) {
  const args = ["cloud", "list", "--json", "--limit", String(limit)];
  if (envId) {
    args.push("--env", envId);
  }

  const { stdout } = await runCommand("codex", args, { cwd });
  return JSON.parse(stdout);
}

export async function submitTask({ cwd, envId, branch, prompt, attempts }) {
  const before = await listTasks({ cwd, envId, limit: 20 });
  const beforeIds = new Set(before.tasks.map((task) => task.id));

  const { stdout, stderr } = await runCommand(
    "codex",
    ["cloud", "exec", "--env", envId, "--branch", branch, "--attempts", String(attempts), prompt],
    { cwd, timeout: 120_000 }
  );

  const parsed = parseTaskReference(`${stdout}\n${stderr}`);
  if (parsed.taskId) {
    return parsed;
  }

  const after = await listTasks({ cwd, envId, limit: 20 });
  const createdTask = after.tasks.find((task) => !beforeIds.has(task.id));
  if (createdTask) {
    return {
      taskId: createdTask.id,
      taskUrl: createdTask.url
    };
  }

  throw new Error("Codex task submission succeeded but task id could not be determined.");
}

export async function findTask({ cwd, envId, taskId }) {
  const list = await listTasks({ cwd, envId, limit: 20 });
  return list.tasks.find((task) => task.id === taskId) || null;
}

export async function waitForTask({ cwd, envId, taskId, pollIntervalMs }) {
  const terminal = new Set(["ready", "failed", "canceled", "cancelled", "error"]);

  for (;;) {
    const task = await findTask({ cwd, envId, taskId });
    if (task && terminal.has(task.status)) {
      return task;
    }
    await sleep(pollIntervalMs);
  }
}

export async function applyTask({ cwd, taskId }) {
  return runCommand("codex", ["cloud", "apply", taskId], { cwd, timeout: 120_000 });
}
