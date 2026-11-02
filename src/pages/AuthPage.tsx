import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const AuthPage: React.FC<{ mode?: 'login' | 'register' }> = ({ mode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC]">
      {/* Cột trái giới thiệu (Trang 17-18, 21-22) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0F172A] text-white">
        <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          ĐỀ TÀI NGHIÊN CỨU KHOA HỌC
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Hiểu rủi ro.<br />Chủ động phòng tránh.</h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ứng dụng trí tuệ nhân tạo để nhận diện dấu hiệu lừa đảo từ URL, minh bạch từng ước tính.
          </p>
          <ShieldCheck className="w-12 h-12 text-blue-400 my-4" />
          <ul className="text-xs text-slate-300 space-y-1.5">
            <li>• Lưu lịch sử và xem giải thích kết quả.</li>
            <li>• Đóng góp URL đáng ngờ cho nghiên cứu.</li>
          </ul>
        </div>
        <p className="text-xs text-slate-400">Phishing AI Detector © 2026 · Bản demo nghiên cứu</p>
      </div>

      {/* Cột phải Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-4 text-sm">
          <p className="text-xs font-semibold uppercase text-[#2563EB] dark:text-[#60A5FA]">
            {isRegister ? 'TẠO TÀI KHOẢN NGƯỜI DÙNG' : 'TÀI KHOẢN NGƯỜI DÙNG'}
          </p>
          <h2 className="text-2xl font-bold">
            {isRegister ? 'Đồng hành cùng nghiên cứu' : 'Chào mừng trở lại'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Lưu các lần quét và đóng góp báo cáo URL đáng ngờ.'
              : 'Đăng nhập để xem lịch sử quét và theo dõi các báo cáo của bạn.'}
          </p>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold mb-1">Họ và tên</label>
              <input
                type="text"
                defaultValue="Nguyễn Minh"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1">Địa chỉ email</label>
            <input
              type="email"
              defaultValue="minh@example.org"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Mật khẩu</label>
            <input
              type="password"
              defaultValue="password123456"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
            {isRegister && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số · Độ mạnh mật khẩu: Tốt
              </p>
            )}
          </div>

          <button type="submit" className="w-full py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold">
            {isRegister ? 'Tạo tài khoản' : 'Đăng nhập và xem lịch sử'}
          </button>

          <div className="flex items-center justify-between text-xs pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#2563EB] dark:text-[#60A5FA] font-semibold"
            >
              {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
            <Link to="/" className="text-slate-500 hover:underline">
              Tiếp tục quét không đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};