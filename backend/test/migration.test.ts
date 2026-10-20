import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const { createClient } = require('@libsql/client');
test('Migration bổ sung giữ dữ liệu cũ và bản chụp điểm AI sau khi xóa lịch sử', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'phishing-migration-'));
  const client = createClient({ url: 'file:' + join(dir, 'old.db') });
  try {
    await client.executeMultiple('PRAGMA foreign_keys=ON;\n' + readFileSync('prisma/migrations/20261020000000_initial/migration.sql', 'utf8'));
    await client.execute("INSERT INTO User(id,email,name,passwordHash) VALUES ('old-user','old@example.com','Người dùng cũ','fixture-hash')");
    await client.execute("INSERT INTO Session(id,userId,expiresAt) VALUES ('old-session','old-user','2099-01-01')");
    await client.execute("INSERT INTO Scan(id,userId,url,riskScore,riskLevel,reasons,modelVersion) VALUES ('old-scan','old-user','https://example.com/',85,'DANGEROUS','[]','old-model')");
    await client.execute("INSERT INTO Report(id,userId,url,description,updatedAt) VALUES ('old-report','old-user','https://example.com/','Báo cáo cũ',CURRENT_TIMESTAMP)");
    await client.executeMultiple(readFileSync('prisma/migrations/20261020013000_design_support/migration.sql', 'utf8'));
    await client.executeMultiple(readFileSync('prisma/migrations/20261020013100_evidence_audit/migration.sql', 'utf8'));
    for (const table of ['User','Session','Scan','Report']) assert.equal(Number((await client.execute(`SELECT COUNT(*) AS n FROM "${table}"`)).rows[0].n), 1);
    assert.equal((await client.execute("SELECT organization FROM User WHERE id='old-user'")).rows[0].organization, '');
    await client.execute("UPDATE Report SET scanId='old-scan',scanRiskScore=85,scanModelVersion='old-model' WHERE id='old-report'");
    await client.execute("DELETE FROM Scan WHERE id='old-scan'");
    const report = (await client.execute("SELECT scanId,scanRiskScore FROM Report WHERE id='old-report'")).rows[0];
    assert.equal(report.scanId, null); assert.equal(Number(report.scanRiskScore), 85);
  } finally { client.close(); rmSync(dir, { recursive: true, force: true }); }
});
