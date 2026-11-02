import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert, Sun, Moon } from 'lucide-react';

export const UserLayout: React.FC = () => {
  const [dark, setDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const navItems = [
    { path: '/', label: 'Quét URL' },
    { path: '/history', label: 'Lịch sử' },
    { path: '/report', label: 'Báo cáo URL' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-[#2563EB] dark:text-[#60A5FA]">
            <ShieldAlert className="w-6 h-6" />
            <span>Phishing AI Detector</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-[#2563EB] dark:bg-slate-800 dark:text-[#60A5FA]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800"
            >
              <span className="hidden sm:inline">Nguyễn Minh</span>
              <span className="sm:hidden">NM</span>
            </Link>
            <button
              onClick={() => setDark(!dark)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
            >
              {dark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{dark ? 'Tối' : 'Sáng'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
        Dữ liệu minh họa · Đề tài nghiên cứu khoa học © 2026 · AI chỉ đưa ra ước tính
      </footer>
    </div>
  );
};