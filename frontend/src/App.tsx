import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ShieldCheck,
  Link as LinkIcon,
  History,
  Flag,
  User,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { api, errorMessage } from "./api";
import { useAuth } from "./auth";
import { ThemeButton } from "./theme";
import { Loading, Notice, PageHeading } from "./components";
import {
  AuthPage,
  ScanPage,
  HistoryPage,
  ReportsPage,
  ProfilePage,
  UsersPage,
  DashboardPage,
  AuditPage,
} from "./pages";
const userLinks = [
  { to: "/kiem-tra", label: "Quét URL", icon: LinkIcon },
  { to: "/lich-su", label: "Lịch sử", icon: History },
  { to: "/bao-cao", label: "Báo cáo URL", icon: Flag },
];
const adminLinks = [
  { to: "/quan-tri", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/quan-tri/nguoi-dung", label: "Người dùng", icon: Users },
  { to: "/quan-tri/bao-cao", label: "Báo cáo URL", icon: Flag },
  { to: "/quan-tri/lich-su", label: "Lịch sử hệ thống", icon: History },
  { to: "/quan-tri/nhat-ky", label: "Nhật ký quản trị", icon: History },
];
function RequireAuth({ admin = false }: { admin?: boolean }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loading text="Đang kiểm tra phiên đăng nhập…" />;
  if (auth.restoreError)
    return (
      <section className="card">
        <Notice>{auth.restoreError}</Notice>
        <button className="button primary" onClick={auth.retry}>
          Thử lại kết nối
        </button>
        <button className="text-button" onClick={() => auth.clear()}>
          Quay về đăng nhập
        </button>
      </section>
    );
  if (!auth.user)
    return (
      <Navigate to="/dang-nhap" replace state={{ from: location.pathname }} />
    );
  if (admin && auth.user.role !== "ADMIN")
    return (
      <section>
        <PageHeading title="Bạn không có quyền truy cập">
          Trang này chỉ dành cho quản trị viên.
        </PageHeading>
        <Link to="/kiem-tra" className="button primary">
          Về trang quét URL
        </Link>
      </section>
    );
  return <Outlet />;
}
function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const adminArea =
    location.pathname.startsWith("/quan-tri") && auth.user?.role === "ADMIN";
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const title =
    [...userLinks, ...adminLinks].find((link) => link.to === location.pathname)
      ?.label || "Phishing AI Detector";
  useEffect(() => {
    document.title = `${title} — Phishing AI Detector`;
  }, [title]);
  async function logout() {
    setPending(true);
    setError("");
    try {
      await api("/auth/logout", { method: "POST" });
      auth.clear();
      navigate("/dang-nhap", { replace: true });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <div
      className={`app-shell figma-layout ${adminArea ? "admin-layout" : ""}`}
    >
      <a className="skip-link" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <header className="site-header">
        <Link to="/kiem-tra" className="brand">
          <ShieldCheck size={27} />
          <span>
            Phishing AI <strong>Detector</strong>
          </span>
        </Link>
        {!adminArea && (
          <nav className="user-nav" aria-label="Điều hướng chính">
            {userLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="header-account">
          <ThemeButton />
          {auth.user ? (
            <>
              <Link
                className="account-link"
                to="/tai-khoan"
                aria-label="Tài khoản"
              >
                <span className="avatar">
                  {auth.user.name.trim().slice(0, 1).toLocaleUpperCase("vi")}
                </span>
                <span>
                  <strong>{auth.user.name}</strong>
                </span>
              </Link>
              {auth.user.role === "ADMIN" && (
                <Link
                  to={adminArea ? "/kiem-tra" : "/quan-tri"}
                  className="header-admin-link"
                >
                  {adminArea ? "Về ứng dụng" : "Quản trị"}
                </Link>
              )}
              <button
                className="icon-button"
                onClick={logout}
                aria-label="Đăng xuất"
                disabled={pending}
              >
                <LogOut size={19} />
              </button>
            </>
          ) : (
            <Link to="/dang-nhap" className="button primary">
              Đăng nhập
            </Link>
          )}
          {adminArea && (
            <button
              className="icon-button mobile-menu"
              aria-label="Mở menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <Menu />
            </button>
          )}
        </div>
      </header>
      {adminArea && (
        <>
          {open && (
            <button
              className="nav-overlay"
              aria-label="Đóng menu"
              onClick={() => setOpen(false)}
            />
          )}
          <aside className={`sidebar ${open ? "is-open" : ""}`}>
            <div className="sidebar-brand">
              <strong>KHÔNG GIAN QUẢN TRỊ</strong>
              <button
                className="mobile-close icon-button"
                aria-label="Đóng menu"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>
            <nav aria-label="Điều hướng quản trị">
              {adminLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end>
                  <Icon size={19} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <Link to="/kiem-tra">← Về ứng dụng</Link>
            </div>
          </aside>
        </>
      )}
      <div className="workspace">
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Notice>{error}</Notice>
          <Outlet />
        </main>
        <footer className="footer">
          Phishing AI Detector · Nghiên cứu phát hiện phishing · AI chỉ đưa ra
          ước tính
        </footer>
      </div>
    </div>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/dang-nhap" element={<AuthPage key="login" />} />
      <Route path="/dang-ky" element={<AuthPage key="register" register />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/kiem-tra" replace />} />
        <Route path="/kiem-tra" element={<ScanPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/lich-su" element={<HistoryPage />} />
          <Route path="/bao-cao" element={<ReportsPage />} />
          <Route path="/tai-khoan" element={<ProfilePage />} />
          <Route element={<RequireAuth admin />}>
            <Route path="/quan-tri" element={<DashboardPage />} />
            <Route path="/quan-tri/nguoi-dung" element={<UsersPage />} />
            <Route path="/quan-tri/bao-cao" element={<ReportsPage admin />} />
            <Route path="/quan-tri/lich-su" element={<HistoryPage admin />} />
            <Route path="/quan-tri/nhat-ky" element={<AuditPage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <>
              <PageHeading title="Không tìm thấy trang">
                Đường dẫn bạn mở không tồn tại.
              </PageHeading>
              <Link to="/kiem-tra" className="button primary">
                Về trang quét URL
              </Link>
            </>
          }
        />
      </Route>
    </Routes>
  );
}
