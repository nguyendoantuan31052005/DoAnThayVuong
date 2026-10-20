const { execFileSync, spawnSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");
const dir = mkdtempSync(join(tmpdir(), "phishing-stack-"));
const dockerConfig = process.env.DOCKER_CONFIG || join(dir, "docker");
const name = "phishing-stack-" + randomBytes(5).toString("hex");
const apiName = name + "-backend",
  webName = name + "-frontend",
  volume = name + "-data";
function docker(...args) {
  return execFileSync("docker", ["--config", dockerConfig, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
function ensure(value, message) {
  if (!value) throw new Error(message);
}
async function wait(url) {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error("Dịch vụ chưa sẵn sàng");
}
async function main() {
  try {
    const envFile = join(dir, "runtime.env");
    writeFileSync(
      envFile,
      `JWT_SECRET=${randomBytes(32).toString("hex")}\nTRUST_PROXY_HOPS=1\n`,
      { mode: 0o600 },
    );
    docker("network", "create", name);
    docker(
      "run",
      "-d",
      "--name",
      apiName,
      "--network",
      name,
      "--network-alias",
      "backend",
      "--env-file",
      envFile,
      "-p",
      "127.0.0.1::3000",
      "-v",
      volume + ":/data",
      "phishing-backend:local",
    );
    const apiPort = docker(
      "inspect",
      "--format",
      '{{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}',
      apiName,
    );
    await wait(`http://127.0.0.1:${apiPort}/api/health`);
    docker(
      "run",
      "-d",
      "--name",
      webName,
      "--network",
      name,
      "-p",
      "127.0.0.1::8080",
      "phishing-frontend:local",
    );
    const webPort = docker(
      "inspect",
      "--format",
      '{{(index (index .NetworkSettings.Ports "8080/tcp") 0).HostPort}}',
      webName,
    );
    const base = `http://127.0.0.1:${webPort}`;
    await wait(base + "/api/health");
    const index = await fetch(base + "/lich-su");
    ensure(
      index.ok && (await index.text()).includes('id="root"'),
      "SPA không mở được đường dẫn trực tiếp",
    );
    ensure(
      index.headers
        .get("content-security-policy")
        ?.includes("script-src 'self'"),
      "Thiếu CSP của frontend",
    );
    const response = await fetch(base + "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Kiểm thử tích hợp Docker",
        email: "stack@example.com",
        password: "Aa1-" + randomBytes(16).toString("hex"),
      }),
    });
    ensure(response.status === 201, "Đăng ký qua Nginx thất bại");
    const { accessToken } = await response.json();
    const headers = { Authorization: "Bearer " + accessToken };
    ensure(
      (await fetch(base + "/api/auth/me", { headers })).status === 200,
      "JWT không hoạt động qua proxy",
    );
    docker("restart", apiName);
    await wait(base + "/api/health");
    ensure(
      (await fetch(base + "/api/auth/me", { headers })).status === 200,
      "Dữ liệu/phiên không tồn tại sau restart",
    );
    ensure(
      (await fetch(base + "/api/auth/logout", { method: "POST", headers }))
        .status === 200,
      "Đăng xuất thất bại",
    );
    ensure(
      (await fetch(base + "/api/auth/me", { headers })).status === 401,
      "Token đã thu hồi vẫn dùng được",
    );
    console.log(
      "ĐẠT: React/Nginx → NestJS → SQLite, định tuyến SPA, CSP, đăng ký, JWT, restart và đăng xuất.",
    );
  } catch (error) {
    for (const container of [apiName, webName]) {
      try {
        const logs = spawnSync(
          "docker",
          ["--config", dockerConfig, "logs", "--tail", "25", container],
          { encoding: "utf8" },
        );
        console.error(logs.stdout + logs.stderr);
      } catch {}
    }
    throw error;
  } finally {
    for (const container of [webName, apiName]) {
      try {
        docker("rm", "-f", container);
      } catch {}
    }
    try {
      docker("volume", "rm", volume);
    } catch {}
    try {
      docker("network", "rm", name);
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
