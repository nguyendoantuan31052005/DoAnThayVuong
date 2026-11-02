import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [fullName, setFullName] = useState('Nguyễn Minh');
  const [department, setDepartment] = useState('Khoa Công nghệ thông tin');
  const [saveHistory, setSaveHistory] = useState(true);
  const [notifyReport, setNotifyReport] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-[#60A5FA]">
            NGƯỜI DÙNG / TÀI KHOẢN
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Hồ sơ & tùy chọn</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            USR-024 · Nguyễn Minh · Đã xác minh email · 24 lần quét, 3 báo cáo minh họa.
          </p>
        </div>
        <Link
          to="/admin/dashboard"
          className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:opacity-90"
        >
          Chuyển sang Không gian Quản trị →
        </Link>
      </div>

      {savedToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4" /> Đã lưu thay đổi hồ sơ thành công.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-sm"
        >
          <div>
            <h2 className="font-bold text-base">Thông tin cá nhân</h2>
            <p className="text-xs text-slate-400">Tham gia 01/10/2026 · Tài khoản nghiên cứu minh họa</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Email đã xác minh</label>
              <input
                type="email"
                disabled
                value="minh@example.org"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Đơn vị / trường đại học</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold text-xs sm:text-sm">
            Lưu thay đổi
          </button>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#2563EB]" /> Bảo mật tài khoản
            </h3>
            <p className="text-xs text-slate-500">
              Xác thực hai bước: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Đang bật</span> · Phiên gần nhất: 20/10/2026, 08:55 · Demo
            </p>
            <div className="flex gap-3 pt-1">
              <button type="button" className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold">
                Đổi mật khẩu
              </button>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-red-50 text-[#DC2626] dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold"
              >
                Đăng xuất
              </Link>
            </div>
          </div>
        </form>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
          <h3 className="font-bold text-sm">Tùy chọn ứng dụng</h3>
          <div>
            <label className="block font-semibold mb-1">Giao diện / Ngôn ngữ</label>
            <select className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B]">
              <option>Sáng / Tối (Theo thanh Header) · Tiếng Việt</option>
            </select>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={saveHistory}
              onChange={(e) => setSaveHistory(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="font-semibold">Lưu lịch sử quét</p>
              <p className="text-slate-400">Lưu các lần quét trong tài khoản.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyReport}
              onChange={(e) => setNotifyReport(e.target.checked)}
              className="mt-0.5 rounded"
            />
            <div>
              <p className="font-semibold">Thông báo báo cáo</p>
              <p className="text-slate-400">Nhận kết quả kiểm duyệt.</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};