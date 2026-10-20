const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
for (const project of ["backend", "frontend"]) {
  const child = spawnSync(
    process.execPath,
    [join(__dirname, "../backend/scripts/build-docker.cjs")],
    {
      cwd: join(__dirname, "..", project),
      stdio: "inherit",
      env: { ...process.env, DOCKER_IMAGE: `phishing-${project}:local` },
    },
  );
  if (child.status !== 0) process.exit(child.status || 1);
}
