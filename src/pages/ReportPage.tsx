import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Upload } from 'lucide-react';

export const ReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get('url') || 'https://verify.example.com');
  const [reason, setReason] = useState('Giả mạo trang đăng nhập');
  const [description, setDescription] = useState(
    'Liên kết được gửi qua email yêu cầu xác minh tài khoản gấp. Trang đích đề nghị cung cấp mật khẩu và mã OTP.'
  );
  const [evidenceUrl, setEvidenceUrl] = useState('https://evidence.example.org/RP-208');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
          NGƯỜI DÙNG / ĐÓNG GÓP BÁO CÁO
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-1">Báo cáo URL đáng ngờ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Giúp nhóm nghiên cứu xem xét dấu hiệu lừa đảo. Báo cáo sẽ được quản trị viên kiểm duyệt.
        </p>
      </div>

      {submitted && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Đã gửi báo cáo</p>
            <p>Báo cáo RP-208 đang chờ kiểm duyệt thủ công.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-sm"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-base">Thông tin báo cáo</h2>
            <span className="text-xs text-slate-400">Các trường có dấu * là bắt buộc</span>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">URL đáng ngờ *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Lý do báo cáo *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B]"
            >
              <option>Giả mạo trang đăng nhập</option>
              <option>Yêu cầu cung cấp mã OTP / Ngân hàng</option>
              <option>Phát tán tệp đính kèm độc hại</option>
              <option>Báo cáo AI nhận diện nhầm (False Positive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Mô tả dấu hiệu *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Liên kết bằng chứng (tùy chọn)</label>
            <input
              type="text"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Upload className="w-4 h-4 text-[#2563EB]" />
              <div>
                <p className="font-semibold">Tải ảnh bằng chứng (PNG, JPG tối đa 5 MB)</p>
                <p className="text-slate-400">Đã đính kèm: bang-chung-demo.png · 248 KB</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold">
              Gửi báo cáo
            </button>
            <Link to="/" className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium">
              Hủy và quay lại kết quả
            </Link>
          </div>
        </form>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm">Sau khi gửi báo cáo</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="font-bold text-[#2563EB] dark:text-[#60A5FA]">01 · Tiếp nhận</p>
              <p className="text-slate-500 mt-0.5">Báo cáo có mã RP để theo dõi.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="font-bold text-[#2563EB] dark:text-[#60A5FA]">02 · Kiểm duyệt thủ công</p>
              <p className="text-slate-500 mt-0.5">Quản trị viên xem URL và bằng chứng.</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <p className="font-bold text-[#2563EB] dark:text-[#60A5FA]">03 · Cập nhật trạng thái</p>
              <p className="text-slate-500 mt-0.5">Theo dõi kết quả trong tài khoản.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};