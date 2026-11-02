import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_SCANS, type ScanRecord } from '../data/mockScans';
import { RiskGauge } from '../components/RiskGauge';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const [urlInput, setUrlInput] = useState('https://library.example.org');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanRecord | null>(null);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^https?:\/\/.+/i.test(urlInput.trim())) {
      setError('Đường dẫn không hợp lệ. Nhập URL bắt đầu bằng http:// hoặc https://');
      return;
    }
    setError('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const isSuspicious = urlInput.toLowerCase().includes('verify') || urlInput.toLowerCase().includes('login');
      setCurrentResult(isSuspicious ? MOCK_SCANS['SC-1023'] : MOCK_SCANS['SC-1024']);
      setIsAnalyzing(false);
    }, 1800);
  };

  // 1. MÀN HÌNH ĐANG PHÂN TÍCH (Trang 5-8)
  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
            QUÉT URL / ĐANG PHÂN TÍCH
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Đang phân tích liên kết</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI đang tổng hợp các dấu hiệu để ước tính mức rủi ro. Vui lòng chờ trong giây lát.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Phân tích đang diễn ra</span>
              <span>Mã yêu cầu SC-1024 · 20/10/2026, 09:42</span>
            </div>

            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]">
                Đang xử lý · 3/4 bước
              </span>
              <h2 className="text-lg font-bold">Đang ước tính với mô hình AI...</h2>
              <p className="text-sm text-slate-500 break-all">{urlInput}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Tiến trình phân tích</span>
                <span className="text-[#2563EB] dark:text-[#60A5FA]">75%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-[#2563EB] dark:bg-[#60A5FA] rounded-full transition-all" />
              </div>
              <p className="text-xs text-slate-400">Thời gian thường gặp: 3–8 giây · Không tự truy cập URL</p>
            </div>

            <button
              onClick={() => setIsAnalyzing(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy phân tích
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm">Các bước phân tích</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div><p className="font-semibold">Chuẩn hóa URL</p><p className="text-slate-400">Hoàn tất · Kiểm tra cấu trúc</p></div>
              </li>
              <li className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div><p className="font-semibold">Trích xuất đặc trưng</p><p className="text-slate-400">Hoàn tất · 30 tín hiệu URL</p></div>
              </li>
              <li className="flex items-start gap-2.5 text-[#2563EB] dark:text-[#60A5FA]">
                <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
                <div><p className="font-semibold">Ước tính bằng AI</p><p className="text-slate-400">Đang xử lý · Model v1.4</p></div>
              </li>
              <li className="flex items-start gap-2.5 text-slate-400">
                <div className="w-4 h-4 rounded-full border border-slate-400 shrink-0 mt-0.5" />
                <div><p className="font-semibold">Tạo báo cáo giải thích</p><p className="text-slate-400">Đang chờ kết quả</p></div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 2. MÀN HÌNH KẾT QUẢ PHÂN TÍCH (Trang 9-16)
  if (currentResult) {
    const isHigh = currentResult.riskLevel === 'HIGH';
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
              QUÉT URL / KẾT QUẢ {currentResult.scanCode}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              {isHigh ? 'Phát hiện dấu hiệu lừa đảo' : 'URL có mức rủi ro thấp'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kết quả ước tính từ mô hình AI v1.4 · Dữ liệu minh họa cho nghiên cứu.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            Phân tích hoàn tất
          </span>
        </div>

        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs sm:text-sm ${
          isHigh
            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200'
            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">
              {isHigh ? 'Cảnh báo: không nhập thông tin cá nhân' : 'Rủi ro thấp không đồng nghĩa với an toàn'}
            </p>
            <p className="mt-0.5 opacity-90">
              {isHigh
                ? 'Kết quả do AI ước tính, không đảm bảo URL an toàn. Không đăng nhập, không cung cấp OTP và không tải tệp từ URL này.'
                : 'Kết quả do AI ước tính, không đảm bảo URL an toàn. Hãy xác minh tên miền và nguồn gửi trước khi truy cập.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <RiskGauge score={currentResult.riskScore} level={currentResult.riskLevel} />
            <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <p className="font-semibold text-sm mb-2">Thông tin lần quét</p>
              <p className="text-slate-500">{currentResult.scanCode} · {currentResult.scannedAt}</p>
              <p>Mô hình: <span className="font-medium">{currentResult.modelName}</span></p>
              <p>Thời gian xử lý: <span className="font-medium">{currentResult.processingTime}</span></p>
              <p className="text-slate-400 pt-1">Phạm vi: đặc trưng URL; không xác minh nội dung website.</p>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <p className="text-xs text-slate-400">URL đã phân tích</p>
              <p className="text-base sm:text-lg font-bold break-all mt-0.5">{currentResult.url}</p>
              <p className="text-xs text-slate-400 mt-1">Tên miền dành riêng cho ví dụ · Không phải URL nguy hại thực tế</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-base">Vì sao AI đưa ra ước tính này?</h3>
              <p className="text-xs text-slate-400">Các tín hiệu đóng góp vào đánh giá, không phải bằng chứng khẳng định.</p>
              <div className="space-y-3 pt-1">
                {currentResult.reasons.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setCurrentResult(null)}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-700"
              >
                Quét URL khác
              </button>
              <Link
                to={isHigh ? `/report?url=${encodeURIComponent(currentResult.url)}` : `/history`}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium"
              >
                {isHigh ? 'Báo cáo URL này' : 'Xem chi tiết lần quét'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. MÀN HÌNH NHẬP URL MẶC ĐỊNH (Trang 1-4)
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
            KHÔNG GIAN NGƯỜI DÙNG / QUÉT URL
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Kiểm tra URL, hiểu rõ rủi ro.</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Xin chào Minh. Phân tích dấu hiệu lừa đảo trước khi bạn truy cập một liên kết.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]">
          AI model v1.4 · Demo
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <h2 className="text-lg font-bold">Bạn muốn kiểm tra liên kết nào?</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dán URL đầy đủ. Hệ thống chỉ phân tích, không tự mở trang web.
          </p>

          <div>
            <label className="block text-xs font-semibold mb-1.5">URL cần phân tích</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://library.example.org"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-transparent focus:outline-none ${
                error
                  ? 'border-[#DC2626] focus:ring-2 focus:ring-red-500/20'
                  : 'border-slate-300 dark:border-slate-700 focus:border-[#2563EB]'
              }`}
            />
            {error ? (
              <p className="text-xs text-[#DC2626] mt-1.5">{error}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-1.5">
                Ví dụ minh họa trên tên miền dành riêng cho tài liệu. (Thử nhập "https://verify.example.com" để test cảnh báo đỏ)
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition"
            >
              Phân tích URL
            </button>
            <button
              type="button"
              onClick={() => { setUrlInput(''); setError(''); }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium"
            >
              Xóa nội dung
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            Mô hình: Random Forest · 30 tín hiệu URL · Bản demo nghiên cứu
          </p>
        </form>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="font-bold text-sm">Đọc kết quả đúng cách</h3>
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900">
            <p className="text-xs font-bold text-[#16A34A] dark:text-[#4ADE80]">Rủi ro thấp</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">0–29 điểm · Vẫn cần kiểm tra nguồn</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Cần thận trọng</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">30–69 điểm · Xác minh thêm</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900">
            <p className="text-xs font-bold text-[#DC2626] dark:text-red-400">Nguy cơ cao</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">70–100 điểm · Không nhập dữ liệu</p>
          </div>
        </div>
      </div>

      {/* Bảng Lần quét gần đây */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Lần quét gần đây</h3>
            <p className="text-xs text-slate-400">Các bản ghi minh họa của bạn · 20/10/2026</p>
          </div>
          <Link to="/history" className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
            Xem toàn bộ lịch sử
          </Link>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          {Object.values(MOCK_SCANS).map((item) => (
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
                  onClick={() => setCurrentResult(item)}
                  className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                >
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};