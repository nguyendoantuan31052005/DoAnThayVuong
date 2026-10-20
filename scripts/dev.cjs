const { spawn, spawnSync } = require("node:child_process");
const { join } = require("node:path");
if (!process.env.npm_execpath) throw new Error("Hãy chạy bằng npm run dev");
const children = ["backend", "frontend"].map((project) =>
  spawn(
    process.execPath,
    [process.env.npm_execpath, "--prefix", project, "run", "dev"],
    {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
      detached: process.platform !== "win32",
    },
  ),
);
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      if (process.platform === "win32")
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      else process.kill(-child.pid, "SIGTERM");
    } catch {
      /* Child already stopped. */
    }
  }
}
for (const child of children) {
  child.on("exit", (code) => stop(code || 0));
  child.on("error", () => stop(1));
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
