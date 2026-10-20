import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { intConfig } from './config';

export interface Prediction { riskScore: number; riskLevel: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS'; reasons: string[]; modelVersion: string; }
export function riskLevel(score: number): Prediction['riskLevel'] { return score < 30 ? 'SAFE' : score < 70 ? 'SUSPICIOUS' : 'DANGEROUS'; }
export function validatePrediction(data: unknown): Prediction {
  if (!data || typeof data !== 'object') throw new Error('Invalid AI response');
  const value = data as Record<string, unknown>;
  if (typeof value.riskScore !== 'number' || !Number.isFinite(value.riskScore) || value.riskScore < 0 || value.riskScore > 100 || !Array.isArray(value.reasons) || value.reasons.length > 30 || !value.reasons.every((r: unknown) => typeof r === 'string' && r.trim().length > 0 && r.length <= 1000) || typeof value.modelVersion !== 'string' || !value.modelVersion.trim() || value.modelVersion.length > 100) throw new Error('Invalid AI response');
  return { riskScore: value.riskScore, riskLevel: riskLevel(value.riskScore), reasons: value.reasons, modelVersion: value.modelVersion };
}
@Injectable()
export class AiService {
  async predict(url: string): Promise<Prediction> {
    const endpoint = process.env.AI_API_URL;
    if (!endpoint) throw new ServiceUnavailableException('Chưa cấu hình dịch vụ AI');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.AI_API_TOKEN ? { Authorization: `Bearer ${process.env.AI_API_TOKEN}` } : {}) },
        body: JSON.stringify({ url }), signal: AbortSignal.timeout(intConfig('AI_TIMEOUT_MS', 10000, 100, 60000)), redirect: 'error',
      });
      if (!response.ok || !response.body || !response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
        await response.body?.cancel(); throw new Error('Invalid upstream response');
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 65536) throw new Error('AI response too large');
          chunks.push(value);
        }
      } finally { await reader.cancel(); }
      return validatePrediction(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch { throw new ServiceUnavailableException('Dịch vụ AI không khả dụng hoặc trả dữ liệu không hợp lệ'); }
  }
}
