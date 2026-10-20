const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const cli = process.env.npm_execpath;
if (!cli) throw new Error("Hãy chạy bằng npm run setup");
for (const args of [
  ["--prefix", "backend", "ci"],
  ["--prefix", "frontend", "ci"],
  ["--prefix", "backend", "run", "setup"],
]) {
  const child = spawnSync(process.execPath, [cli, ...args], {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  });
  if (child.status !== 0) process.exit(child.status || 1);
}
console.log("Đã cài backend và frontend. Chạy npm run dev để phát triển.");
