require('dotenv/config');
const { writeFileSync, mkdirSync } = require('node:fs');
const { createApplication } = require('../dist/main');
async function main() {
  const { app, document } = await createApplication();
  try {
    mkdirSync('docs', { recursive: true });
    writeFileSync('docs/openapi.json', JSON.stringify(document, null, 2) + '\n');
    console.log(`Exported OpenAPI: ${Object.keys(document.paths).length} paths`);
  } finally { await app.close(); }
}
main().catch(() => { console.error('OpenAPI export failed; check configuration.'); process.exitCode = 1; });
