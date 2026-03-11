import fs from "node:fs/promises";
import path from "node:path";
import { runCommand } from "./command.js";

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function branchExists(repoRoot, branch) {
  try {
    await runCommand("git", ["show-ref", "--verify", `refs/heads/${branch}`], { cwd: repoRoot });
    return true;
  } catch {
    return false;
  }
}

export async function ensureWorktree({ repoRoot, worktreeRoot, branch, baseBranch, worktreeId }) {
  const worktreePath = path.join(worktreeRoot, worktreeId);
  await fs.mkdir(worktreeRoot, { recursive: true });

  if (await pathExists(path.join(worktreePath, ".git"))) {
    return worktreePath;
  }

  if (await pathExists(worktreePath)) {
    throw new Error(`Worktree path exists but is not a git worktree: ${worktreePath}`);
  }

  const exists = await branchExists(repoRoot, branch);
  const args = exists
    ? ["worktree", "add", worktreePath, branch]
    : ["worktree", "add", worktreePath, "-b", branch, baseBranch];

  await runCommand("git", args, { cwd: repoRoot });
  return worktreePath;
}

export async function summarizeWorktree(worktreePath) {
  const [{ stdout: status }, { stdout: diffStat }] = await Promise.all([
    runCommand("git", ["status", "--short"], { cwd: worktreePath }),
    runCommand("git", ["diff", "--shortstat"], { cwd: worktreePath })
  ]);

  return {
    status,
    diffStat
  };
}
