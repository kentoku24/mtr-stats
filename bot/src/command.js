import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function runCommand(command, args, options = {}) {
  const { cwd, timeout = 300_000 } = options;
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024
    });

    return {
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim()
    };
  } catch (error) {
    const stdout = error.stdout?.trim() || "";
    const stderr = error.stderr?.trim() || "";
    const message = [
      `Command failed: ${command} ${args.join(" ")}`,
      stdout && `stdout:\n${stdout}`,
      stderr && `stderr:\n${stderr}`
    ]
      .filter(Boolean)
      .join("\n\n");

    const wrapped = new Error(message);
    wrapped.cause = error;
    wrapped.stdout = stdout;
    wrapped.stderr = stderr;
    throw wrapped;
  }
}
