import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_SCANS, type ScanRecord } from '../data/mockScans';
import { RiskGauge } from '../components/RiskGauge';
import { ArrowLeft, Search } from 'lucide-react';

const EXTRA_HISTORY: ScanRecord[] = [
  MOCK_SCANS['SC-1024'],
  MOCK_SCANS['SC-1023'],
  {
    ...MOCK_SCANS['SC-1024'],
    scanCode: 'SC-1022',
    url: 'https://portal.example.org',
    domain: 'portal.example.org',
    scannedAt: '19/10/2026 16:20',
    riskScore: 18,
    riskLevel: 'LOW',
  },
];

export const HistoryPage: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<ScanRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredList = EXTRA_HISTORY.filter((item) => {
    const matchText =
      item.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scanCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || item.riskLevel === riskFilter;
    return matchText && matchRisk;
  });

  // MÀN HÌNH CHI TIẾT LẦN QUÉT (Trang 29-32)
  if (selectedRecord) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
              LỊCH SỬ / {selectedRecord.scanCode}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">Chi tiết lần quét</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bản ghi {selectedRecord.scanCode} · Nguyễn Minh · {selectedRecord.scannedAt}
            </p>
          </div>
          <button
            onClick={() => setSelectedRecord(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Về lịch sử
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <RiskGauge score={selectedRecord.riskScore} level={selectedRecord.riskLevel} />
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <p className="font-bold text-sm">Siêu dữ liệu</p>
              <p>Mô hình: <span className="font-medium">{selectedRecord.modelName}</span></p>
              <p>Xử lý: <span className="font-medium">{selectedRecord.processingTime}</span></p>
              <p>Đặc trưng: <span className="font-medium">30 tín hiệu URL</span></p>
              <p>Nguồn: <span className="font-medium">Người dùng nhập URL</span></p>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">URL đã phân tích</p>
                <p className="text-base sm:text-lg font-bold break-all">{selectedRecord.url}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                selectedRecord.riskLevel === 'HIGH'
                  ? 'bg-red-50 text-[#DC2626] dark:bg-red-950/50 dark:text-red-400'
                  : 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/50 dark:text-[#4ADE80]'
              }`}>
                {selectedRecord.riskLevel === 'HIGH' ? 'Nguy cơ cao' : 'Rủi ro thấp'} · {selectedRecord.riskScore}/100
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-base">Tín hiệu quan sát được</h3>
              <p className="text-xs text-slate-400">Một số đặc trưng dùng trong mô hình. Không xác minh nội dung website.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-semibold">Độ dài URL: </span>{selectedRecord.observedSignals.urlLength}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-semibold">Giao thức: </span>{selectedRecord.observedSignals.protocol}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-semibold">Ký tự @ / địa chỉ IP: </span>{selectedRecord.observedSignals.ipOrAt}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-semibold">Từ khóa nhạy cảm: </span>{selectedRecord.observedSignals.sensitiveWords}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Giải thích và giới hạn</h3>
              <p>
                AI ước tính dựa trên cấu trúc URL và tín hiệu tương đồng với tập phishing nghiên cứu. Điểm số không có nghĩa URL chắc chắn an toàn hay độc hại.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/" className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs sm:text-sm font-semibold">
                Phân tích lại URL
              </Link>
              <Link
                to={`/report?url=${encodeURIComponent(selectedRecord.url)}&code=${selectedRecord.scanCode}`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium"
              >
                Báo cáo URL
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH DANH SÁCH LỊCH SỬ (Trang 25-28)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
            NGƯỜI DÙNG / LỊCH SỬ
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Lịch sử quét URL</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Xem lại các ước tính AI và lý do đánh giá trong từng lần phân tích.
          </p>
        </div>
        <Link to="/" className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-semibold">
          Quét URL mới
        </Link>
      </div>

      {/* 3 thẻ KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
          <p className="text-2xl font-bold">24</p>
          <p className="text-xs font-semibold mt-1">Tổng số lần quét</p>
          <p className="text-xs text-slate-400">Bản ghi minh họa trong tháng 10</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
          <p className="text-2xl font-bold text-[#DC2626] dark:text-red-400">6</p>
          <p className="text-xs font-semibold mt-1">Nguy cơ cao</p>
          <p className="text-xs text-slate-400">Điểm ước tính từ 70 trở lên</p>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
          <p className="text-2xl font-bold">09:42</p>
          <p className="text-xs font-semibold mt-1">Lần quét mới nhất</p>
          <p className="text-xs text-slate-400">20/10/2026 · SC-1024</p>
        </div>
      </div>

      {/* Bộ lọc & Danh sách */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tên miền hoặc mã quét..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm"
            />
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B] text-sm"
          >
            <option value="ALL">Tất cả mức rủi ro</option>
            <option value="LOW">Rủi ro thấp (0–29)</option>
            <option value="MEDIUM">Cần thận trọng (30–69)</option>
            <option value="HIGH">Nguy cơ cao (70–100)</option>
          </select>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {filteredList.map((item) => (
            <div key={item.scanCode} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{item.domain}</p>
                <p className="text-xs text-slate-400">{item.scanCode} · {item.scannedAt}</p>
              </div>
              <div className="flex items-center justify-between sm:gap-6">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  item.riskLevel === 'HIGH'
                    ? 'bg-red-50 text-[#DC2626] dark:bg-red-950/50 dark:text-red-400'
                    : 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/50 dark:text-[#4ADE80]'
                }`}>
                  {item.riskScore}/100 · {item.riskLevel === 'HIGH' ? 'Nguy cơ cao' : 'Rủi ro thấp'}
                </span>
                <button
                  onClick={() => setSelectedRecord(item)}
                  className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
          <span>Hiển thị 1–{filteredList.length} / 24 bản ghi minh họa · Trang 1</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">← Trước</button>
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">Sau →</button>
          </div>
        </div>
      </div>
    </div>
  );
};