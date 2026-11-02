import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Sun, Moon, LayoutDashboard, Users, Flag, ArrowLeft } from 'lucide-react';

type AdminTab = 'overview' | 'users' | 'reports';

const DAILY_SCANS = [
  { date: '14/10', count: 142 },
  { date: '15/10', count: 158 },
  { date: '16/10', count: 167 },
  { date: '17/10', count: 189 },
  { date: '18/10', count: 181 },
  { date: '19/10', count: 210 },
  { date: '20/10', count: 237 },
];

export const AdminPortal: React.FC = () => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  // State quản lý người dùng (Trang 45-48)
  const [users, setUsers] = useState([
    { code: 'USR-024', name: 'Nguyễn Minh', email: 'minh@example.org', role: 'Người dùng', status: 'ACTIVE', joined: '01/10/2026' },
    { code: 'USR-022', name: 'Phạm Đức Huy', email: 'huy@example.net', role: 'Người dùng', status: 'LOCKED', joined: '28/09/2026' },
    { code: 'ADM-001', name: 'Trần Minh Anh', email: 'admin@example.org', role: 'Quản trị viên', status: 'ACTIVE', joined: '01/09/2026' },
  ]);
  const [selectedUser, setSelectedUser] = useState(users[0]);
  const [showLockModal, setShowLockModal] = useState(false);

  // State quản lý báo cáo (Trang 49-52)
  const [reports, setReports] = useState([
    { code: 'RP-208', domain: 'verify.example.com', url: 'https://verify.example.com', sender: 'Nguyễn Minh', score: 92, status: 'Chờ duyệt', date: '20/10/2026, 09:38', scanCode: 'SC-1023' },
    { code: 'RP-205', domain: 'login.example.org', url: 'https://login.example.org', sender: 'Đỗ Bảo Ngọc', score: 89, status: 'Đã xác minh', date: '19/10/2026, 14:20', scanCode: 'SC-1019' },
    { code: 'RP-204', domain: 'help.example.net', url: 'https://help.example.net', sender: 'Nguyễn Minh', score: 21, status: 'Đã từ chối', date: '18/10/2026, 11:05', scanCode: 'SC-1015' },
  ]);
  const [selectedReport, setSelectedReport] = useState(reports[0]);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggleUserLock = () => {
    const updated = users.map((u) =>
      u.code === selectedUser.code ? { ...u, status: u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' } : u
    );
    setUsers(updated);
    setSelectedUser(updated.find((u) => u.code === selectedUser.code)!);
    setShowLockModal(false);
  };

  const handleReviewReport = (newStatus: 'Đã xác minh' | 'Đã từ chối') => {
    const updated = reports.map((r) =>
      r.code === selectedReport.code ? { ...r, status: newStatus } : r
    );
    setReports(updated);
    setSelectedReport({ ...selectedReport, status: newStatus });
    setAdminNote('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* SIDEBAR TRÁI TRÊN DESKTOP / TOPBAR TRÊN MOBILE */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#2563EB] dark:text-[#60A5FA]">
              <ShieldAlert className="w-6 h-6" />
              <span>Phishing AI Detector</span>
            </div>
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
            >
              {dark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">QUẢN TRỊ VIÊN</p>
            <nav className="flex lg:flex-col gap-1.5">
              <button
                onClick={() => setTab('overview')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  tab === 'overview'
                    ? 'bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Tổng quan
              </button>
              <button
                onClick={() => setTab('users')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  tab === 'users'
                    ? 'bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users className="w-4 h-4" /> Người dùng
              </button>
              <button
                onClick={() => setTab('reports')}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                  tab === 'reports'
                    ? 'bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Flag className="w-4 h-4" /> Báo cáo URL
              </button>
            </nav>
          </div>
        </div>

        <div className="hidden lg:block pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
          <p className="text-slate-400">Môi trường nghiên cứu · Dữ liệu demo</p>
          <p className="font-semibold">Trần Minh Anh · Quản trị viên</p>
          <div className="flex gap-3 pt-1">
            <Link to="/" className="flex items-center gap-1 text-[#2563EB] dark:text-[#60A5FA] font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" /> Về ứng dụng
            </Link>
            <Link to="/login" className="text-slate-400 hover:underline">Đăng xuất</Link>
          </div>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* TAB 1: TỔNG QUAN (Trang 41-44) */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-[#2563EB] dark:text-[#60A5FA]">
                  QUẢN TRỊ / PHÂN TÍCH HỆ THỐNG
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1">Tổng quan nghiên cứu</h1>
                <p className="text-xs text-slate-500">Theo dõi hoạt động phân tích và báo cáo cần kiểm duyệt · 14–20/10/2026</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-bold">1.284</p>
                <p className="text-xs font-semibold mt-1">Lượt quét URL</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">7 ngày · +12,4% so với kỳ trước</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-bold text-[#DC2626] dark:text-red-400">326</p>
                <p className="text-xs font-semibold mt-1">Ước tính nguy cơ cao</p>
                <p className="text-[11px] text-slate-400 mt-0.5">25,4% tổng lượt quét</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-bold">248</p>
                <p className="text-xs font-semibold mt-1">Người dùng</p>
                <p className="text-[11px] text-slate-400 mt-0.5">232 hoạt động · 16 bị khóa</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800">
                <p className="text-2xl font-bold text-amber-500">18</p>
                <p className="text-xs font-semibold mt-1">Báo cáo chờ duyệt</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Trong 64 báo cáo minh họa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Biểu đồ cột Lượt quét theo ngày (Trang 41, 43) */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="font-bold text-base">Lượt quét theo ngày</h3>
                  <p className="text-xs text-slate-400">Tổng 1.284 lượt · 14–20/10/2026</p>
                </div>
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200 dark:border-slate-800">
                  {DAILY_SCANS.map((item) => (
                    <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        style={{ height: `${(item.count / 250) * 140}px` }}
                        className="w-full max-w-[42px] bg-[#2563EB] dark:bg-[#60A5FA] rounded-t-lg transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 px-2">
                  {DAILY_SCANS.map((item) => (
                    <div key={item.date} className="text-center flex-1">
                      <p className="font-bold text-slate-700 dark:text-slate-200">{item.count}</p>
                      <p>{item.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Biểu đồ Donut Phân bố rủi ro (Trang 41, 43) */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between">
                <div className="w-full">
                  <h3 className="font-bold text-base">Phân bố rủi ro ước tính</h3>
                  <p className="text-xs text-slate-400">Không phải tỷ lệ phishing đã xác minh</p>
                </div>

                <div
                  className="w-40 h-40 rounded-full flex items-center justify-center my-4"
                  style={{
                    background: 'conic-gradient(#16A34A 0% 59.2%, #D97706 59.2% 74.6%, #DC2626 74.6% 100%)',
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-white dark:bg-[#1E293B] flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">1.284</span>
                    <span className="text-[11px] text-slate-400">lượt quét</span>
                  </div>
                </div>

                <div className="w-full space-y-1.5 text-xs">
                  <p className="text-[#16A34A] dark:text-[#4ADE80] font-semibold">● Rủi ro thấp: 760 · 59,2%</p>
                  <p className="text-amber-600 dark:text-amber-400 font-semibold">● Cần thận trọng: 198 · 15,4%</p>
                  <p className="text-[#DC2626] dark:text-red-400 font-semibold">● Nguy cơ cao: 326 · 25,4%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ NGƯỜI DÙNG (Trang 45-48) */}
        {tab === 'users' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase text-[#2563EB] dark:text-[#60A5FA]">QUẢN TRỊ / TÀI KHOẢN</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Quản lý người dùng</h1>
              <p className="text-xs text-slate-500">248 tài khoản minh họa · 232 hoạt động · 16 đã khóa.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-base">Danh sách người dùng</h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {users.map((u) => (
                    <div key={u.code} className="py-3.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{u.email}</p>
                        <p className="text-xs text-slate-400">{u.code} · {u.name} · Tham gia {u.joined}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/50 dark:text-[#4ADE80]'
                            : 'bg-red-50 text-[#DC2626] dark:bg-red-950/50 dark:text-red-400'
                        }`}>
                          {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                        >
                          Quản lý →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <h3 className="font-bold text-sm">Thao tác với {selectedUser.code} · {selectedUser.name}</h3>
                <p className="text-slate-500">Email: {selectedUser.email}</p>
                <p className="text-slate-500">Vai trò hiện tại: <span className="font-semibold">{selectedUser.role}</span></p>
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={() => setShowLockModal(true)}
                    className="w-full py-2.5 rounded-xl bg-red-50 text-[#DC2626] dark:bg-red-950/50 dark:text-red-400 font-semibold"
                  >
                    {selectedUser.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  </button>
                </div>
                <p className="text-slate-400 pt-2">
                  Chỉ quản trị viên được phân quyền mới có thể đổi vai trò hoặc khóa tài khoản. Thao tác cần xác nhận và được ghi lại.
                </p>
              </div>
            </div>

            {/* Modal xác nhận khóa (Trang 53-54) */}
            {showLockModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="max-w-sm w-full p-6 rounded-2xl bg-white dark:bg-[#1E293B] space-y-4 text-sm">
                  <h3 className="font-bold text-base">Khóa tài khoản này?</h3>
                  <p className="text-xs text-slate-500">
                    {selectedUser.name} sẽ không thể đăng nhập cho đến khi được mở khóa. Thao tác được ghi vào nhật ký quản trị.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowLockModal(false)} className="px-4 py-2 rounded-xl border text-xs">
                      Hủy bỏ
                    </button>
                    <button onClick={toggleUserLock} className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-semibold">
                      Xác nhận
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KIỂM DUYỆT BÁO CÁO URL (Trang 49-52) */}
        {tab === 'reports' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase text-[#2563EB] dark:text-[#60A5FA]">QUẢN TRỊ / KIỂM DUYỆT BÁO CÁO</p>
              <h1 className="text-2xl sm:text-3xl font-bold mt-1">Quản lý báo cáo URL</h1>
              <p className="text-xs text-slate-500">64 báo cáo minh họa · 18 chờ duyệt · 38 đã xác minh · 8 đã từ chối.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold text-base">Danh sách báo cáo</h3>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {reports.map((r) => (
                    <div key={r.code} className="py-3.5 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{r.domain}</p>
                        <p className="text-xs text-slate-400">{r.code} · Người gửi: {r.sender}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800">
                          {r.score}/100 · {r.status}
                        </span>
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA] hover:underline"
                        >
                          Kiểm duyệt →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                <h3 className="font-bold text-sm">Kiểm duyệt báo cáo {selectedReport.code}</h3>
                <p className="text-slate-400">{selectedReport.sender} · {selectedReport.date} · Liên quan {selectedReport.scanCode}</p>
                <p className="font-bold text-sm break-all">{selectedReport.url}</p>
                <p className="text-slate-500">
                  Liên kết được gửi qua email yêu cầu xác minh tài khoản gấp. Bằng chứng: bang-chung-demo.png (248 KB).
                </p>
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  AI ước tính: {selectedReport.score}/100 · Trạng thái: {selectedReport.status}
                </p>

                <div>
                  <label className="block font-semibold mb-1">Ghi chú kiểm duyệt</label>
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Nhập nhận xét và căn cứ xác minh..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleReviewReport('Đã xác minh')}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold"
                  >
                    Xác minh báo cáo
                  </button>
                  <button
                    onClick={() => handleReviewReport('Đã từ chối')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};