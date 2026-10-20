-- Bổ sung trường theo thiết kế, giữ nguyên toàn bộ dữ liệu đang có.
ALTER TABLE "User" ADD COLUMN "organization" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Scan" ADD COLUMN "processingMs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Report" ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "Report" ADD COLUMN "evidenceUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Report" ADD COLUMN "scanId" TEXT REFERENCES "Scan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD COLUMN "scanRiskScore" REAL;
ALTER TABLE "Report" ADD COLUMN "scanModelVersion" TEXT;
