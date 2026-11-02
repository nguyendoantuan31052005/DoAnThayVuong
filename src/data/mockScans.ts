export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ScanRecord {
  scanCode: string;
  url: string;
  domain: string;
  scannedAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
  modelName: string;
  processingTime: string;
  reasons: { title: string; description: string }[];
  observedSignals: {
    urlLength: string;
    protocol: string;
    ipOrAt: string;
    sensitiveWords: string;
  };
}

export const MOCK_SCANS: Record<string, ScanRecord> = {
  'SC-1024': {
    scanCode: 'SC-1024',
    url: 'https://library.example.org',
    domain: 'library.example.org',
    scannedAt: '20/10/2026 09:42',
    riskScore: 12,
    riskLevel: 'LOW',
    modelName: 'Random Forest v1.4',
    processingTime: '2,8 giây',
    reasons: [
      {
        title: 'Cấu trúc URL đơn giản',
        description: 'Không phát hiện địa chỉ IP, ký tự @ hay chuỗi mã hóa bất thường trong URL.',
      },
      {
        title: 'Ít từ khóa gây hiểu nhầm',
        description: 'Không phát hiện tổ hợp từ khóa thường gặp trong tập dữ liệu phishing minh họa.',
      },
      {
        title: 'Kết nối dùng giao thức HTTPS',
        description: 'Có HTTPS trong URL. HTTPS không xác nhận tính đáng tin cậy của website.',
      },
    ],
    observedSignals: {
      urlLength: '27 ký tự - cấu trúc ngắn, đơn giản.',
      protocol: 'HTTPS - không bảo đảm độ tin cậy.',
      ipOrAt: 'Không phát hiện.',
      sensitiveWords: 'Không phát hiện theo bộ từ khóa nghiên cứu.',
    },
  },
  'SC-1023': {
    scanCode: 'SC-1023',
    url: 'https://verify.example.com',
    domain: 'verify.example.com',
    scannedAt: '20/10/2026 09:35',
    riskScore: 92,
    riskLevel: 'HIGH',
    modelName: 'Random Forest v1.4',
    processingTime: '3,1 giây',
    reasons: [
      {
        title: 'Ngôn ngữ thúc giục xác minh',
        description: 'Tên miền "verify" gợi hành vi xác minh tài khoản. Đây là tín hiệu ngữ nghĩa, không phải bằng chứng độc lập.',
      },
      {
        title: 'Mẫu URL tương tự tập phishing',
        description: 'Tổ hợp đặc trưng gần các mẫu rủi ro cao trong bộ dữ liệu nghiên cứu.',
      },
      {
        title: 'Nhiều tín hiệu bất thường kết hợp',
        description: 'Mô hình tổng hợp tín hiệu từ cấu trúc và từ khóa để đưa ra mức 92/100.',
      },
    ],
    observedSignals: {
      urlLength: '26 ký tự - chứa tiền tố nhạy cảm.',
      protocol: 'HTTPS - chứng chỉ tên miền phụ.',
      ipOrAt: 'Không phát hiện.',
      sensitiveWords: 'Phát hiện từ khóa "verify".',
    },
  },
};