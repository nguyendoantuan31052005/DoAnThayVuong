import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  readFileSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const { createClient } = require('@libsql/client');

test(
  'Migration bổ sung giữ dữ liệu cũ và bản chụp điểm AI sau khi xóa lịch sử',
  async () => {
    const dir = mkdtempSync(
      join(tmpdir(), 'phishing-migration-'),
    );

    const oldDbPath = join(dir, 'old.db');

    const client = createClient({
      url: 'file:' + oldDbPath,
    });

    try {
      // =========================================================
      // 1. Tạo database theo migration ban đầu
      // =========================================================

      const initialMigration = readFileSync(
        'prisma/migrations/20261020000000_initial/migration.sql',
        'utf8',
      );

      await client.executeMultiple(
        'PRAGMA foreign_keys=ON;\n' + initialMigration,
      );

      // =========================================================
      // 2. Thêm dữ liệu cũ vào database
      // =========================================================

      // Lưu ý:
      // Migration ban đầu không có cột processingMs trong Scan,
      // nên không được chèn processingMs ở bước này.

      await client.execute(`
        INSERT INTO User(
          id,
          email,
          name,
          passwordHash
        )
        VALUES (
          'old-user',
          'old@example.com',
          'Nguoi dung cu',
          'old-password-hash'
        )
      `);

      await client.execute(`
        INSERT INTO Scan(
          id,
          userId,
          url,
          riskScore,
          riskLevel,
          reasons,
          modelVersion
        )
        VALUES (
          'old-scan',
          'old-user',
          'https://example.com',
          85.5,
          'DANGEROUS',
          'Test phishing',
          'random_forest-v1'
        )
      `);

      // =========================================================
      // 3. Chạy các migration bổ sung
      // =========================================================

      const designMigration = readFileSync(
        'prisma/migrations/20261020013000_design_support/migration.sql',
        'utf8',
      );

      const evidenceAuditMigration = readFileSync(
        'prisma/migrations/20261020013100_evidence_audit/migration.sql',
        'utf8',
      );

      await client.executeMultiple(
        designMigration +
          '\n' +
          evidenceAuditMigration,
      );

      // =========================================================
      // 4. Kiểm tra dữ liệu User cũ vẫn còn
      // =========================================================

      const userResult = await client.execute(`
        SELECT
          id,
          email,
          name
        FROM User
        WHERE id = 'old-user'
      `);

      assert.equal(
        userResult.rows.length,
        1,
        'User cũ phải được giữ lại',
      );

      assert.equal(
        String(userResult.rows[0].id),
        'old-user',
      );

      assert.equal(
        String(userResult.rows[0].email),
        'old@example.com',
      );

      // =========================================================
      // 5. Kiểm tra Scan cũ vẫn còn
      // =========================================================

      const scanResult = await client.execute(`
        SELECT
          id,
          userId,
          url,
          riskScore,
          riskLevel,
          reasons,
          modelVersion
        FROM Scan
        WHERE id = 'old-scan'
      `);

      assert.equal(
        scanResult.rows.length,
        1,
        'Scan cũ phải được giữ lại',
      );

      assert.equal(
        String(scanResult.rows[0].id),
        'old-scan',
      );

      assert.equal(
        String(scanResult.rows[0].userId),
        'old-user',
      );

      assert.equal(
        String(scanResult.rows[0].url),
        'https://example.com',
      );

      assert.equal(
        Number(scanResult.rows[0].riskScore),
        85.5,
      );

      assert.equal(
        String(scanResult.rows[0].riskLevel),
        'DANGEROUS',
      );

      assert.equal(
        String(scanResult.rows[0].modelVersion),
        'random_forest-v1',
      );

      // =========================================================
      // 6. Kiểm tra các cột snapshot AI trong Report
      // =========================================================

      const reportColumns = await client.execute(`
        PRAGMA table_info(Report)
      `);

      const reportColumnNames = reportColumns.rows.map(
        (row: any) => String(row.name),
      );

      assert.ok(
        reportColumnNames.includes('scanRiskScore'),
        'Report phải có cột scanRiskScore',
      );

      assert.ok(
        reportColumnNames.includes('scanModelVersion'),
        'Report phải có cột scanModelVersion',
      );

      // =========================================================
      // 7. Tạo Report liên kết với Scan
      // =========================================================

      await client.execute(`
        INSERT INTO Report(
          id,
          userId,
          url,
          description,
          reason,
          evidenceUrl,
          scanId,
          scanRiskScore,
          scanModelVersion,
          updatedAt
        )
        VALUES (
  'old-report',
  'old-user',
  'https://example.com',
  'Bao cao website nghi ngo',
  'OTHER',
  '',
  'old-scan',
  85.5,
  'random_forest-v1',
  CURRENT_TIMESTAMP
)
      `);

      // =========================================================
      // 8. Kiểm tra Report lưu snapshot AI
      // =========================================================

      const reportBeforeDelete = await client.execute(`
        SELECT
          id,
          userId,
          url,
          scanId,
          scanRiskScore,
          scanModelVersion
        FROM Report
        WHERE id = 'old-report'
      `);

      assert.equal(
        reportBeforeDelete.rows.length,
        1,
      );

      assert.equal(
        String(reportBeforeDelete.rows[0].scanId),
        'old-scan',
      );

      assert.equal(
        Number(
          reportBeforeDelete.rows[0].scanRiskScore,
        ),
        85.5,
      );

      assert.equal(
        String(
          reportBeforeDelete.rows[0].scanModelVersion,
        ),
        'random_forest-v1',
      );

      // =========================================================
      // 9. Xóa Scan
      // =========================================================

      await client.execute(`
        DELETE FROM Scan
        WHERE id = 'old-scan'
      `);

      // =========================================================
      // 10. Kiểm tra Report vẫn còn
      // =========================================================

      const reportAfterDelete = await client.execute(`
        SELECT
          id,
          userId,
          url,
          scanId,
          scanRiskScore,
          scanModelVersion
        FROM Report
        WHERE id = 'old-report'
      `);

      assert.equal(
        reportAfterDelete.rows.length,
        1,
        'Report phải còn sau khi Scan bị xóa',
      );

      // scanId phải trở thành NULL do onDelete: SetNull
      assert.equal(
        reportAfterDelete.rows[0].scanId,
        null,
        'scanId phải NULL sau khi Scan bị xóa',
      );

      // Snapshot AI phải được giữ nguyên
      assert.equal(
        Number(
          reportAfterDelete.rows[0].scanRiskScore,
        ),
        85.5,
        'scanRiskScore phải được giữ lại',
      );

      assert.equal(
        String(
          reportAfterDelete.rows[0].scanModelVersion,
        ),
        'random_forest-v1',
        'scanModelVersion phải được giữ lại',
      );

      // =========================================================
      // 11. Kiểm tra Scan đã thực sự bị xóa
      // =========================================================

      const deletedScan = await client.execute(`
        SELECT id
        FROM Scan
        WHERE id = 'old-scan'
      `);

      assert.equal(
        deletedScan.rows.length,
        0,
        'Scan phải bị xóa',
      );

      // =========================================================
      // 12. Kiểm tra Evidence tồn tại
      // =========================================================

      const evidenceTable = await client.execute(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'Evidence'
      `);

      assert.equal(
        evidenceTable.rows.length,
        1,
        'Bảng Evidence phải tồn tại',
      );

      // =========================================================
      // 13. Kiểm tra AuditLog tồn tại
      // =========================================================

      const auditLogTable = await client.execute(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = 'AuditLog'
      `);

      assert.equal(
        auditLogTable.rows.length,
        1,
        'Bảng AuditLog phải tồn tại',
      );
    } finally {
      // Đóng SQLite trước khi xóa database test.
      await client.close();

      // Windows đôi khi vẫn giữ file SQLite trong thời gian rất ngắn.
      // Retry để tránh lỗi EBUSY.
      for (let i = 0; i < 10; i++) {
        try {
          rmSync(dir, {
            recursive: true,
            force: true,
          });

          break;
        } catch (error: any) {
          if (error?.code !== 'EBUSY') {
            throw error;
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 100),
          );
        }
      }
    }
  },
);