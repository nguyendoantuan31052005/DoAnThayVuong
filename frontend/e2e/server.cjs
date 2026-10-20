// Only for browser tests: isolated database, fixture accounts and fixture AI. Never run as a real model service.
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { execFileSync } = require("node:child_process");
const { createServer } = require("node:http");
const { randomBytes } = require("node:crypto");
const backend = resolve("../backend");
const dir = mkdtempSync(join(tmpdir(), "phishing-browser-"));
Object.assign(process.env, {
  DATABASE_URL: `file:${join(dir, "browser.db")}`,
  JWT_SECRET: randomBytes(32).toString("hex"),
  NODE_ENV: "test",
  PORT: "3015",
  FRONTEND_ORIGIN: "http://127.0.0.1:5175",
  HTTP_RATE_LIMIT: "1000",
});
delete process.env.AI_API_TOKEN;
const ai = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    const { url } = JSON.parse(body);
    res.setHeader("Content-Type", "application/json");
    if (url.includes("unavailable.example")) {
      res.writeHead(503);
      res.end("{}");
      return;
    }
    res.end(
      JSON.stringify({
        riskScore: url.includes("safe.example") ? 10 : 85,
        reasons: [
          "Dấu hiệu trong kịch bản kiểm thử trình duyệt — không phải dự đoán AI thật",
        ],
        modelVersion: "browser-test-fixture",
      }),
    );
  });
});
let app, db;
async function start() {
  execFileSync(
    process.execPath,
    [join(backend, "node_modules/prisma/build/index.js"), "migrate", "deploy"],
    { cwd: backend, env: process.env, stdio: "pipe" },
  );
  const { createDb } = require(join(backend, "dist/database"));
  const { hash } = require(join(backend, "node_modules/bcryptjs"));
  db = createDb();
  for (const account of [
    {
      email: "admin-browser@example.com",
      name: "Quản trị kiểm thử",
      role: "ADMIN",
      password: "browser-admin-fixture123",
    },
    {
      email: "managed-browser@example.com",
      name: "Tài khoản kiểm thử quản lý",
      role: "USER",
      password: "managed-browser-fixture123",
    },
  ]) {
    const { password, ...data } = account;
    await db.user.create({
      data: { ...data, passwordHash: await hash(password, 12) },
    });
  }
  await new Promise((resolve) => ai.listen(0, "127.0.0.1", resolve));
  process.env.AI_API_URL = `http://127.0.0.1:${ai.address().port}/predict`;
  const { bootstrap } = require(join(backend, "dist/main"));
  app = await bootstrap(3015);
}
async function stop() {
  await app?.close();
  await db?.$disconnect();
  ai.closeAllConnections();
  ai.close();
  rmSync(dir, { recursive: true, force: true });
}
process.once("SIGTERM", () => stop().finally(() => process.exit(0)));
process.once("SIGINT", () => stop().finally(() => process.exit(0)));
start().catch(async () => {
  console.error("Không thể khởi động backend kiểm thử trình duyệt.");
  await stop();
  process.exit(1);
});
