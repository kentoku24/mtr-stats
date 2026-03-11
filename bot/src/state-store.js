import fs from "node:fs/promises";
import path from "node:path";

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return { threads: {} };
    }
    throw error;
  }
}

export class StateStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async getState() {
    return readJson(this.filePath);
  }

  async getThread(threadKey) {
    const state = await this.getState();
    return state.threads[threadKey] || null;
  }

  async upsertThread(threadKey, updater) {
    const state = await this.getState();
    const current = state.threads[threadKey] || {};
    const next = updater(current);
    state.threads[threadKey] = {
      ...current,
      ...next,
      updatedAt: new Date().toISOString()
    };

    await ensureParentDir(this.filePath);
    const tempFile = `${this.filePath}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(state, null, 2));
    await fs.rename(tempFile, this.filePath);
    return state.threads[threadKey];
  }
}
