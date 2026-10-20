import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Link as LinkIcon,
  ShieldCheck,
  Search,
  Flag,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { ThemeButton } from "./theme";
import { api, errorMessage } from "./api";
import { useAuth } from "./auth";
import {
  Empty,
  Loading,
  Notice,
  PageHeading,
  Pager,
  RiskBadge,
  ScanResult,
  StatusBadge,
  date,
  statusLabels,
  useList,
} from "./components";
import type {
  AuthResult,
  Scan,
  Report,
  User,
  ReportStatus,
  Stats,
  AiStatus,
  Analytics,
} from "./types";

export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (auth.loading) return <Loading />;
  if (auth.user) return <Navigate to="/kiem-tra" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (
      register &&
      (password.length < 12 ||
        !/(?=.*\p{Lu})(?=.*\p{Ll})(?=.*\p{N})/u.test(password))
    ) {
      setError("Mật khẩu cần ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số.");
      return;
    }
    if (register && password !== confirmation) {
      setError("Hai mật khẩu chưa trùng khớp.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Mật khẩu quá dài. Hãy chọn mật khẩu ngắn hơn.");
      return;
    }
    setPending(true);
    try {
      const result = await api<AuthResult>(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: register ? { name, email, password } : { email, password },
        },
      );
      auth.accept(result);
      const from = location.state?.from;
      navigate(
        typeof from === "string" &&
          from.startsWith("/") &&
          !from.startsWith("//")
          ? from
          : "/kiem-tra",
        {
          replace: true,
          state:
            typeof location.state?.url === "string"
              ? { url: location.state.url }
              : undefined,
        },
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-theme">
        <ThemeButton />
      </div>
      <section className="auth-story">
        <Link to="/" className="brand">
          <ShieldCheck size={30} />
          <span>
            Phishing AI <strong>Detector</strong>
          </span>
        </Link>
        <div>
          <span className="story-badge">An tâm hơn trên không gian số</span>
          <h1>
            Hiểu rủi ro.
            <br />
            Chủ động phòng tránh.
          </h1>
          <p>
            Nhận diện đường dẫn đáng ngờ, hiểu rõ dấu hiệu rủi ro và chủ động
            bảo vệ thông tin của bạn.
          </p>
          <div className="story-symbol" aria-hidden="true">
            <ShieldCheck size={100} strokeWidth={1.2} />
          </div>
        </div>
        <small>Hệ thống phát hiện website phishing bằng AI</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="auth-mark">
            <ShieldCheck size={28} />
          </span>
          <h2>
            {register ? "Đồng hành cùng nghiên cứu" : "Chào mừng trở lại"}
          </h2>
          <p className="muted">
            {register
              ? "Bắt đầu kiểm tra và theo dõi những đường dẫn của bạn."
              : "Đăng nhập để kiểm tra URL và xem lịch sử của bạn."}
          </p>
          <Notice>{error}</Notice>
          <Notice success>
            {!register && (location.state?.message || auth.flash)}
          </Notice>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Họ và tên
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                required
                placeholder="ban@example.com"
              />
            </label>
            <label>
              Mật khẩu
              <input
                type="password"
                aria-label="Mật khẩu"
                autoComplete={register ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={register ? 12 : 1}
                maxLength={72}
                required
              />
              {register && (
                <small>Ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số.</small>
              )}
            </label>
            {register && (
              <label>
                Nhập lại mật khẩu
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  minLength={12}
                  maxLength={72}
                  required
                />
              </label>
            )}
            <button className="button primary" disabled={pending}>
              {pending ? "Đang xử lý…" : register ? "Đăng ký" : "Đăng nhập"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            <Link to="/kiem-tra">Tiếp tục quét không đăng nhập</Link>
          </p>
          <p className="auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link
              to={register ? "/dang-nhap" : "/dang-ky"}
              state={location.state}
            >
              {register ? "Đăng nhập" : "Đăng ký ngay"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
export function ScanPage() {
  const auth = useAuth();
  const location = useLocation();
  const [url, setUrl] = useState<string>(location.state?.url || "");
  const [result, setResult] = useState<Scan | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const recent = useList<Scan>("/scans", "", Boolean(auth.user));
  useEffect(() => { setResult(null); setError(""); controller.current?.abort(); setPending(false); }, [auth.user?.id]);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setError("");
    setMessage("");
    setResult(null);
    setPending(true);
    try {
      const scan = await api<Scan>(auth.user ? "/scans" : "/public/scans", {
        method: "POST",
        body: { url: url.trim() },
        signal: request.signal,
      });
      if (!request.signal.aborted) {
        setResult(scan);
        recent.refresh();
      }
    } catch (error) {
      if (!request.signal.aborted) setError(errorMessage(error));
    } finally {
      if (!request.signal.aborted) setPending(false);
    }
  }
  function cancel() {
    controller.current?.abort();
    setPending(false);
    setMessage(
      "Đã hủy chờ kết quả. Yêu cầu đã gửi vẫn có thể hoàn tất nếu dịch vụ xử lý xong trước khi hủy.",
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="KHÔNG GIAN NGƯỜI DÙNG / QUÉT URL"
        title={
          pending ? "Đang phân tích liên kết" : "Kiểm tra URL, hiểu rõ rủi ro."
        }
      >
        {auth.user ? `Xin chào ${auth.user.name}. ` : ""}Phân tích dấu hiệu lừa
        đảo trước khi bạn truy cập một liên kết.
      </PageHeading>
      <div className="scan-layout">
        <div>
          <section className="card scan-card">
            <h2>Bạn muốn kiểm tra liên kết nào?</h2>
            <p className="muted">
              Dán URL đầy đủ. Hệ thống chỉ phân tích, không tự mở trang web.
            </p>
            <form onSubmit={submit}>
              <label htmlFor="scan-url">URL cần phân tích</label>
              <div className="input-icon">
                <LinkIcon size={19} />
                <input
                  id="scan-url"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  maxLength={2048}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://library.example.org"
                  required
                  disabled={pending}
                />
              </div>
              <p className="fine-print">
                Ví dụ minh họa trên tên miền dành riêng cho tài liệu.
              </p>
              <div className="scan-buttons">
                <button
                  className="button primary"
                  disabled={pending || auth.loading}
                >
                  <Search size={18} />
                  {pending ? "Đang phân tích…" : "Phân tích URL"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={pending}
                  onClick={() => {
                    setUrl("");
                    setResult(null);
                    setError("");
                    setMessage("");
                  }}
                >
                  Xóa nội dung
                </button>
              </div>
            </form>
            <Notice>{error}</Notice>
            <Notice success>{message}</Notice>
            {pending && (
              <div className="analysis-progress">
                <Loading text="Đang ước tính với mô hình AI…" />
                <progress aria-label="Đang phân tích URL" />
                <p className="muted">Chưa có kết luận rủi ro ở bước này.</p>
                <button className="button secondary" onClick={cancel}>
                  Hủy phân tích
                </button>
              </div>
            )}
            <p className="fine-print">
              Kết quả do AI ước tính, không đảm bảo URL an toàn. Không nhập mật
              khẩu hoặc thông tin cá nhân vào liên kết đáng ngờ.
            </p>
          </section>
          {result && (
            <>
              <ScanResult scan={result} />
              <div className="result-actions">
                <button
                  className="button primary"
                  onClick={() => {
                    setResult(null);
                    setUrl("");
                    document.getElementById("scan-url")?.focus();
                  }}
                >
                  Quét URL khác
                </button>
                <Link
                  className="button secondary"
                  to={auth.user ? "/bao-cao" : "/dang-nhap"}
                  state={
                    auth.user
                      ? {
                          url: result.url,
                          scanId:
                            result.saved === false ? undefined : result.id,
                        }
                      : { from: "/bao-cao", url: result.url }
                  }
                >
                  <Flag size={17} />
                  Báo cáo URL này
                </Link>
              </div>
              {!auth.user && (
                <p className="fine-print">
                  Lần quét này không lưu lịch sử.{" "}
                  <Link to="/dang-nhap">Đăng nhập</Link> để lưu các lần quét
                  tiếp theo.
                </p>
              )}
            </>
          )}
        </div>
        <aside className="card risk-guide">
          <h2>Đọc kết quả đúng cách</h2>
          <div>
            <RiskBadge risk="SAFE" />
            <p>0–29 điểm · Vẫn cần kiểm tra nguồn</p>
          </div>
          <div>
            <RiskBadge risk="SUSPICIOUS" />
            <p>30–69 điểm · Xác minh thêm</p>
          </div>
          <div>
            <RiskBadge risk="DANGEROUS" />
            <p>70–100 điểm · Không nhập dữ liệu</p>
          </div>
          <p className="fine-print">
            Điểm số là ước tính từ mô hình, không phải xác suất đã hiệu chuẩn
            hoặc kết luận kiểm chứng.
          </p>
        </aside>
      </div>
      {auth.user && (
        <section className="card recent-scans">
          <div className="card-heading">
            <div>
              <h2>Lần quét gần đây</h2>
              <p className="fine-print">Các bản ghi đã lưu của bạn</p>
            </div>
            <Link to="/lich-su">Xem toàn bộ lịch sử →</Link>
          </div>
          <Notice>{recent.error}</Notice>
          {recent.loading ? (
            <Loading />
          ) : recent.data?.items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Tên miền / Mã quét</th>
                    <th>Thời gian</th>
                    <th>Điểm ước tính / Đánh giá AI</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.data.items.slice(0, 3).map((scan) => (
                    <tr key={scan.id}>
                      <td className="url-cell">
                        {new URL(scan.url).hostname}
                        <small>Mã quét: {scan.id.slice(0, 8)}</small>
                      </td>
                      <td className="nowrap">{date(scan.createdAt)}</td>
                      <td>
                        {scan.riskScore}/100 <RiskBadge risk={scan.riskLevel} />
                      </td>
                      <td>
                        <Link to="/lich-su" state={{ scanId: scan.id }}>
                          Xem chi tiết →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Chưa có lần quét nào">
              Kết quả phân tích thành công sẽ được lưu tại đây.
            </Empty>
          )}
        </section>
      )}
    </>
  );
}
export function HistoryPage({ admin = false }: { admin?: boolean }) {
  const [filters, setFilters] = useState("");
  const list = useList<Scan>(admin ? "/admin/scans" : "/scans", filters);
  const location = useLocation();
  const [selected, setSelected] = useState<Scan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  useEffect(() => {
    if (location.state?.scanId && list.data) {
      const record = list.data.items.find(
        (item) => item.id === location.state.scanId,
      );
      if (record) setSelected(record);
    }
  }, [location.state, list.data]);
  const [summary, setSummary] = useState<{
    total: number;
    dangerousScans: number;
    lastScan: { id: string; createdAt: string } | null;
  } | null>(null);
  useEffect(() => {
    if (admin) return;
    const controller = new AbortController();
    api<typeof summary>("/scans/summary", { signal: controller.signal })
      .then(setSummary)
      .catch(() => {});
    return () => controller.abort();
  }, [admin, list.data?.total]);
  async function remove(record: Scan) {
    if (!window.confirm("Xóa bản ghi lịch sử này?")) return;
    setBusy(record.id);
    setError("");
    try {
      await api("/scans/" + record.id, { method: "DELETE" });
      if (selected?.id === record.id) setSelected(null);
      list.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading title={admin ? "Lịch sử toàn hệ thống" : "Lịch sử quét URL"}>
        {admin
          ? "Theo dõi các lần phân tích URL của người dùng."
          : "Xem lại kết quả phân tích những đường dẫn bạn đã kiểm tra."}
      </PageHeading>
      <Notice>{error || list.error}</Notice>
      {!admin && summary && (
        <div className="stats-grid history-stats">
          <article className="card stat">
            <span>Tổng số lần quét</span>
            <strong>{summary.total}</strong>
          </article>
          <article className="card stat">
            <span>Ước tính nguy cơ cao</span>
            <strong>{summary.dangerousScans}</strong>
          </article>
          <article className="card stat">
            <span>Lần quét mới nhất</span>
            <strong className="last-scan-time">
              {summary.lastScan ? date(summary.lastScan.createdAt) : "Chưa có"}
            </strong>
          </article>
        </div>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>Danh sách lần quét</h2>
          <button
            className="button secondary"
            onClick={list.refresh}
            disabled={list.loading}
          >
            <RefreshCw size={16} />
            Tải lại
          </button>
        </div>
        <ListFilters
          kind="scans"
          onApply={(value) => {
            list.setPage(1);
            setFilters(value);
          }}
        />
        {list.loading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty title="Chưa có lịch sử kiểm tra">
            {list.error
              ? "Hãy thử tải lại dữ liệu."
              : "Những kết quả phân tích thành công sẽ xuất hiện tại đây."}
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Đường dẫn</th>
                  <th>Mức rủi ro</th>
                  <th>Điểm</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((scan) => (
                  <tr key={scan.id}>
                    <td className="url-cell">
                      {scan.url}
                      <small>Mã quét: {scan.id.slice(0, 8)}</small>
                      {admin && (
                        <small className="muted">
                          Người dùng: {scan.userId}
                        </small>
                      )}
                    </td>
                    <td>
                      <RiskBadge risk={scan.riskLevel} />
                    </td>
                    <td>
                      <strong>{scan.riskScore}</strong>
                      <span className="muted">/100</span>
                    </td>
                    <td className="nowrap">{date(scan.createdAt)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="text-button"
                          onClick={() => setSelected(scan)}
                        >
                          Chi tiết
                        </button>
                        {!admin && (
                          <button
                            className="icon-button danger-link"
                            aria-label={`Xóa lịch sử ${scan.url}`}
                            disabled={busy === scan.id}
                            onClick={() => remove(scan)}
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager data={list.data} onPage={list.setPage} />
      </section>
      {selected && (
        <div className="detail-section">
          <button className="text-button" onClick={() => setSelected(null)}>
            Đóng chi tiết
          </button>
          <ScanResult scan={selected} />
          <div className="result-actions">
            <Link
              className="button primary"
              to="/kiem-tra"
              state={{ url: selected.url }}
            >
              Phân tích lại URL
            </Link>
            <Link
              className="button secondary"
              to="/bao-cao"
              state={{
                url: selected.url,
                scanId: admin ? undefined : selected.id,
              }}
            >
              Báo cáo URL
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
function ReviewForm({
  report,
  onSaved,
}: {
  report: Report;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [note, setNote] = useState(report.adminNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setStatus(report.status);
    setNote(report.adminNote);
  }, [report]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/reports/" + report.id, {
        method: "PATCH",
        body: { status, adminNote: note },
      });
      onSaved();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-stack review-form" onSubmit={submit}>
      <label>
        Trạng thái
        <select
          aria-label="Trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ghi chú xử lý
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </label>
      <Notice>{error}</Notice>
      <button className="button primary" disabled={busy}>
        {busy ? "Đang lưu…" : "Lưu xử lý"}
      </button>
    </form>
  );
}
export function ReportsPage({ admin = false }: { admin?: boolean }) {
  const location = useLocation();
  const [url, setUrl] = useState<string>(location.state?.url || "");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [retryEvidence, setRetryEvidence] = useState<{
    id: string;
    file: File;
  } | null>(null);
  const [reason, setReason] = useState("LOGIN_IMPERSONATION");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState("");
  const list = useList<Report>(admin ? "/admin/reports" : "/reports", filters);
  const [selected, setSelected] = useState<Report | null>(null);
  async function upload(id: string, image: File) {
    const body = new FormData();
    body.append("file", image);
    await api("/reports/" + id + "/evidence", { method: "POST", body });
  }
  async function retryImage() {
    if (!retryEvidence) return;
    setPending(true);
    setError("");
    try {
      await upload(retryEvidence.id, retryEvidence.file);
      setRetryEvidence(null);
      setSuccess("Đã bổ sung ảnh bằng chứng.");
      list.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  async function download(report: Report) {
    setError("");
    try {
      const blob = await api<Blob>("/reports/" + report.id + "/evidence", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.evidence?.fileName || "bang-chung";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(errorMessage(error));
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (
      file &&
      (file.size > 5 * 1024 * 1024 ||
        !["image/png", "image/jpeg"].includes(file.type))
    ) {
      setError("Ảnh bằng chứng phải là PNG/JPG, tối đa 5 MB.");
      return;
    }
    setPending(true);
    try {
      const report = await api<Report>("/reports", {
        method: "POST",
        body: {
          url: url.trim(),
          description: description.trim(),
          reason,
          ...(evidenceUrl.trim() ? { evidenceUrl: evidenceUrl.trim() } : {}),
          ...(location.state?.scanId && location.state?.url === url.trim()
            ? { scanId: location.state.scanId }
            : {}),
        },
      });
      setSuccess("Đã gửi báo cáo. Quản trị viên sẽ xem xét thông tin của bạn.");
      setUrl("");
      setDescription("");
      setEvidenceUrl("");
      setFile(null);
      setFileKey((value) => value + 1);
      list.setPage(1);
      list.refresh();
      if (file) {
        try {
          await upload(report.id, file);
          setRetryEvidence(null);
          list.refresh();
        } catch {
          setRetryEvidence({ id: report.id, file });
          setError(
            "Báo cáo đã được tạo nhưng ảnh chưa tải lên thành công. Bạn có thể tải lại ảnh mà không tạo thêm báo cáo.",
          );
        }
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeading
        title={admin ? "Quản lý báo cáo URL" : "Báo cáo URL đáng ngờ"}
      >
        {admin
          ? "Xác minh và cập nhật trạng thái báo cáo do người dùng gửi."
          : "Chia sẻ dấu hiệu bạn phát hiện để quản trị viên kiểm tra."}
      </PageHeading>
      {!admin && (
        <section className="card">
          <h2>Gửi báo cáo mới</h2>
          <form className="form-stack" onSubmit={submit}>
            <label>
              Đường dẫn website
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                maxLength={2048}
                placeholder="https://example.com"
              />
            </label>
            <label>
              Lý do báo cáo
              <select
                aria-label="Lý do báo cáo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="LOGIN_IMPERSONATION">
                  Giả mạo trang đăng nhập
                </option>
                <option value="BRAND_IMPERSONATION">Giả mạo thương hiệu</option>
                <option value="DATA_THEFT">Đánh cắp thông tin</option>
                <option value="OTHER">Dấu hiệu khác</option>
              </select>
            </label>
            <label>
              Mô tả dấu hiệu đáng ngờ
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={12}
                maxLength={2000}
                rows={4}
                placeholder="Ví dụ: Website yêu cầu nhập mật khẩu nhưng tên miền không đúng…"
              />
            </label>
            <label>
              Liên kết bằng chứng (tùy chọn)
              <input
                type="url"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                maxLength={2048}
                placeholder="https://evidence.example.org"
              />
            </label>
            <label>
              Tải ảnh bằng chứng (tùy chọn)
              <input
                key={fileKey}
                type="file"
                accept="image/png,image/jpeg"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
              <small>PNG, JPG · Tối đa 5 MB</small>
            </label>
            <p className="fine-print">
              Không gửi mật khẩu, mã OTP hoặc thông tin cá nhân trong báo cáo và
              bằng chứng.
            </p>
            <Notice>{error}</Notice>
            <Notice success>{success}</Notice>
            <button className="button primary self-start" disabled={pending}>
              <Flag size={17} />
              {pending ? "Đang gửi…" : "Gửi báo cáo"}
            </button>
            <Link
              to={location.state?.scanId ? "/lich-su" : "/kiem-tra"}
              state={
                location.state?.scanId
                  ? { scanId: location.state.scanId }
                  : undefined
              }
            >
              Hủy và quay lại kết quả
            </Link>
          </form>
        </section>
      )}
      <Notice>{error || list.error}</Notice>
      {retryEvidence && (
        <button
          className="button secondary"
          onClick={retryImage}
          disabled={pending}
        >
          Tải lại ảnh bằng chứng
        </button>
      )}
      <section className="card">
        <div className="card-heading">
          <h2>{admin ? "Tất cả báo cáo" : "Báo cáo của bạn"}</h2>
          <button
            className="button secondary"
            onClick={list.refresh}
            disabled={list.loading}
          >
            <RefreshCw size={16} />
            Tải lại
          </button>
        </div>
        <ListFilters
          kind="reports"
          onApply={(value) => {
            list.setPage(1);
            setFilters(value);
          }}
        />
        {list.loading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty title="Chưa có báo cáo">
            Báo cáo được gửi sẽ xuất hiện tại đây.
          </Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Đường dẫn</th>
                  <th>Trạng thái</th>
                  <th>Ngày gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((report) => (
                  <tr key={report.id}>
                    <td className="url-cell">
                      {report.url}
                      <small>
                        Mã báo cáo: {report.id.slice(0, 8)}
                        {report.user ? ` · ${report.user.name}` : ""}
                      </small>
                      {report.scanRiskScore !== null && (
                        <small>Điểm AI: {report.scanRiskScore}/100</small>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="nowrap">{date(report.createdAt)}</td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => setSelected(report)}
                      >
                        {admin ? "Xử lý" : "Chi tiết"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager data={list.data} onPage={list.setPage} />
      </section>
      {selected && (
        <section className="card detail-section">
          <div className="card-heading">
            <h2>Chi tiết báo cáo</h2>
            <button className="text-button" onClick={() => setSelected(null)}>
              Đóng chi tiết
            </button>
          </div>
          <p className="url-text">{selected.url}</p>
          <StatusBadge status={selected.status} />
          {selected.evidence && (
            <div>
              <button
                className="button secondary"
                onClick={() => download(selected)}
              >
                Tải ảnh bằng chứng
              </button>
              <p className="fine-print">
                {selected.evidence.fileName} ·{" "}
                {Math.ceil(selected.evidence.size / 1024)} KB
              </p>
            </div>
          )}
          <h3>Mô tả</h3>
          <p className="preserve-text">{selected.description}</p>
          {selected.evidenceUrl && (
            <>
              <h3>Liên kết bằng chứng</h3>
              <p className="url-text">{selected.evidenceUrl}</p>
            </>
          )}
          {selected.scanRiskScore !== null && (
            <p>
              Điểm AI lúc báo cáo: {selected.scanRiskScore}/100 ·{" "}
              {selected.scanModelVersion}
            </p>
          )}
          {admin ? (
            <ReviewForm
              key={selected.id}
              report={selected}
              onSaved={() => {
                setSelected(null);
                list.refresh();
              }}
            />
          ) : (
            <>
              <h3>Phản hồi xử lý</h3>
              <p className="preserve-text">
                {selected.adminNote || "Chưa có phản hồi từ quản trị viên."}
              </p>
            </>
          )}
        </section>
      )}
    </>
  );
}
export function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(auth.user!.name);
  const [organization, setOrganization] = useState(
    auth.user!.organization || "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function profile(event: FormEvent) {
    event.preventDefault();
    setBusy("profile");
    setError("");
    setSuccess("");
    try {
      auth.update(
        await api<User>("/auth/me", {
          method: "PATCH",
          body: { name, organization },
        }),
      );
      setSuccess("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  async function password(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (
      newPassword.length < 12 ||
      !/(?=.*\p{Lu})(?=.*\p{Ll})(?=.*\p{N})/u.test(newPassword)
    ) {
      setError(
        "Mật khẩu mới cần ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số.",
      );
      return;
    }
    if (newPassword !== confirmation) {
      setError("Hai mật khẩu mới chưa trùng khớp.");
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Mật khẩu mới quá dài. Hãy chọn mật khẩu ngắn hơn.");
      return;
    }
    setBusy("password");
    try {
      await api("/auth/password", {
        method: "PATCH",
        body: { currentPassword, newPassword },
      });
      auth.clear("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
      navigate("/dang-nhap", {
        replace: true,
        state: { message: "Đã đổi mật khẩu. Vui lòng đăng nhập lại." },
      });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading title="Hồ sơ & tùy chọn">
        Cập nhật thông tin cá nhân và bảo vệ tài khoản.
      </PageHeading>
      <Notice>{error}</Notice>
      <Notice success>{success}</Notice>
      <div className="profile-theme card">
        <h2>Giao diện / Ngôn ngữ</h2>
        <p>Tiếng Việt · Tùy chọn sáng/tối được lưu trên trình duyệt này.</p>
        <ThemeButton />
      </div>
      <div className="two-columns">
        <section className="card">
          <h2>Thông tin cá nhân</h2>
          <form className="form-stack" onSubmit={profile}>
            <label>
              Email
              <input type="email" value={auth.user!.email} disabled />
            </label>
            <label>
              Họ và tên
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </label>
            <label>
              Đơn vị / trường đại học
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                maxLength={160}
              />
            </label>
            <p className="muted">
              Vai trò:{" "}
              {auth.user!.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
            </p>
            <button className="button primary self-start" disabled={!!busy}>
              {busy === "profile" ? "Đang lưu…" : "Lưu thông tin"}
            </button>
          </form>
        </section>
        <section className="card">
          <h2>Đổi mật khẩu</h2>
          <form className="form-stack" onSubmit={password}>
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                maxLength={72}
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                aria-label="Mật khẩu mới"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                maxLength={72}
              />
              <small>Ít nhất 12 ký tự, gồm chữ hoa, chữ thường và số.</small>
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
                minLength={12}
                maxLength={72}
              />
            </label>
            <p className="fine-print">
              Bạn sẽ cần đăng nhập lại trên các thiết bị sau khi đổi mật khẩu.
            </p>
            <button className="button primary self-start" disabled={!!busy}>
              {busy === "password" ? "Đang cập nhật…" : "Đổi mật khẩu"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
export function UsersPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState("");
  const list = useList<User>("/admin/users", filters);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function toggle(target: User) {
    if (
      !window.confirm(
        `${target.blocked ? "Mở khóa" : "Khóa"} tài khoản ${target.email}?`,
      )
    )
      return;
    setBusy(target.id);
    setError("");
    try {
      await api("/admin/users/" + target.id + "/block", {
        method: "PATCH",
        body: { blocked: !target.blocked },
      });
      list.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  async function role(target: User) {
    const next = target.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      !window.confirm(
        `Đổi vai trò ${target.email} thành ${next === "ADMIN" ? "quản trị viên" : "người dùng"}? Các phiên đăng nhập của tài khoản này sẽ bị thu hồi.`,
      )
    )
      return;
    setBusy(target.id);
    setError("");
    try {
      await api("/admin/users/" + target.id + "/role", {
        method: "PATCH",
        body: { role: next },
      });
      list.refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading title="Quản lý người dùng">
        Xem tài khoản và kiểm soát quyền truy cập hệ thống.
      </PageHeading>
      <Notice>{error || list.error}</Notice>
      <CreateUserForm onCreated={list.refresh} />
      <section className="card">
        <div className="card-heading">
          <h2>Tài khoản người dùng</h2>
          <button
            className="button secondary"
            onClick={list.refresh}
            disabled={list.loading}
          >
            <RefreshCw size={16} />
            Tải lại
          </button>
        </div>
        <ListFilters
          kind="users"
          onApply={(value) => {
            list.setPage(1);
            setFilters(value);
          }}
        />
        {list.loading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((target) => (
                  <tr key={target.id}>
                    <td>{target.name}</td>
                    <td>{target.email}</td>
                    <td>
                      {target.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}
                    </td>
                    <td>
                      <span
                        className={`badge ${target.blocked ? "risk-DANGEROUS" : "risk-SAFE"}`}
                      >
                        {target.blocked ? "Đã khóa" : "Hoạt động"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        disabled={target.id === user!.id || busy === target.id}
                        onClick={() => toggle(target)}
                      >
                        {busy === target.id
                          ? "Đang cập nhật…"
                          : target.blocked
                            ? "Mở khóa"
                            : "Khóa"}
                      </button>
                      <button
                        className="text-button"
                        disabled={target.id === user!.id || busy === target.id}
                        onClick={() => role(target)}
                      >
                        Đổi vai trò
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager data={list.data} onPage={list.setPage} />
      </section>
    </>
  );
}
export function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      api<Stats>("/admin/stats", { signal: controller.signal }),
      api<AiStatus>("/admin/ai/status", { signal: controller.signal }),
      api<Analytics>("/admin/analytics", { signal: controller.signal }),
    ])
      .then(([stats, ai, analytics]) => {
        setStats(stats);
        setAi(ai);
        setAnalytics(analytics);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <>
      <PageHeading eyebrow="TỔNG QUAN HỆ THỐNG" title="Tổng quan nghiên cứu">
        Theo dõi hoạt động phân tích và xử lý báo cáo.
      </PageHeading>
      <div className="toolbar">
        <button
          className="button secondary"
          onClick={() => setRevision((v) => v + 1)}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Cập nhật số liệu
        </button>
      </div>
      <Notice>{error}</Notice>
      {loading ? (
        <Loading />
      ) : (
        stats && (
          <>
            <div className="stats-grid">
              {[
                ["Người dùng", stats.users],
                ["Lượt kiểm tra", stats.scans],
                ["Lượt nguy hiểm", stats.dangerousScans],
                ["Báo cáo chờ", stats.pendingReports],
              ].map(([label, value]) => (
                <article className="card stat" key={label}>
                  <span>{label}</span>
                  <strong>{Number(value).toLocaleString("vi-VN")}</strong>
                </article>
              ))}
            </div>
            {analytics && <AnalyticsCharts analytics={analytics} />}
            <div className="two-columns">
              <section className="card">
                <h2>Xử lý báo cáo</h2>
                <p className="muted">
                  Đã xử lý: <strong>{stats.reviewedReports}</strong> báo cáo
                </p>
                <p>
                  Kiểm tra những đường dẫn đang chờ xác minh để phản hồi người
                  dùng.
                </p>
                <Link
                  to="/quan-tri/bao-cao"
                  className="button primary self-start"
                >
                  Quản lý báo cáo
                  <ArrowRight size={17} />
                </Link>
              </section>
              <section className="card">
                <h2>Hoạt động AI</h2>
                <p>
                  <span
                    className={`badge ${ai?.configured ? "risk-SAFE" : "risk-SUSPICIOUS"}`}
                  >
                    {ai?.configured
                      ? "Đã cấu hình kết nối"
                      : "Chưa cấu hình kết nối"}
                  </span>
                </p>
                <p className="fine-print">
                  Trạng thái cấu hình không xác nhận dịch vụ đang hoạt động. Các
                  phiên bản dưới đây lấy từ kết quả đã lưu.
                </p>
                {ai?.versions.length ? (
                  <ul className="model-list">
                    {ai.versions.map((version) => (
                      <li key={version.modelVersion}>
                        <strong>{version.modelVersion}</strong>
                        <span>{version.scans} lượt</span>
                        <small>
                          {version.lastSeenAt && date(version.lastSeenAt)}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Chưa ghi nhận kết quả từ mô hình.</p>
                )}
              </section>
            </div>
          </>
        )
      )}
    </>
  );
}

function ListFilters({
  kind,
  onApply,
}: {
  kind: "scans" | "reports" | "users";
  onApply: (value: string) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const [name, value] of data)
      if (typeof value === "string" && value.trim())
        query.set(name, value.trim());
    onApply(query.toString());
  }
  return (
    <form className="list-filters" onSubmit={submit}>
      <label>
        Tìm kiếm
        <input
          name="q"
          maxLength={200}
          placeholder={
            kind === "users"
              ? "Tên, email hoặc mã người dùng"
              : "Tên miền hoặc mã bản ghi"
          }
        />
      </label>
      {kind === "scans" && (
        <>
          <label>
            Mức rủi ro
            <select name="riskLevel" aria-label="Mức rủi ro">
              <option value="">Tất cả mức rủi ro</option>
              <option value="SAFE">Rủi ro thấp</option>
              <option value="SUSPICIOUS">Cần thận trọng</option>
              <option value="DANGEROUS">Nguy cơ cao</option>
            </select>
          </label>
          <label>
            Từ ngày
            <input type="date" name="from" />
          </label>
          <label>
            Đến ngày
            <input type="date" name="to" />
          </label>
        </>
      )}
      {kind === "reports" && (
        <label>
          Lọc trạng thái
          <select name="status" aria-label="Lọc trạng thái">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === "users" && (
        <>
          <label>
            Vai trò
            <select name="role" aria-label="Vai trò">
              <option value="">Tất cả vai trò</option>
              <option value="USER">Người dùng</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </label>
          <label>
            Lọc trạng thái
            <select name="blocked" aria-label="Lọc trạng thái">
              <option value="">Tất cả trạng thái</option>
              <option value="false">Hoạt động</option>
              <option value="true">Đã khóa</option>
            </select>
          </label>
        </>
      )}
      <button className="button secondary">Áp dụng</button>
      <button type="reset" className="text-button" onClick={() => onApply("")}>
        Xóa bộ lọc
      </button>
    </form>
  );
}
function AnalyticsCharts({ analytics }: { analytics: Analytics }) {
  const max = Math.max(1, ...analytics.days.map((day) => day.count));
  const total = analytics.distribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  return (
    <div className="two-columns">
      <section className="card">
        <h2>Lượt quét theo ngày</h2>
        <p className="fine-print">
          7 ngày gần nhất · Múi giờ {analytics.timezone}
        </p>
        <div
          className="daily-chart"
          role="img"
          aria-label={analytics.days
            .map((day) => `${day.date}: ${day.count} lượt`)
            .join("; ")}
        >
          {analytics.days.map((day) => (
            <div key={day.date}>
              <strong>{day.count}</strong>
              <span style={{ height: Math.max(2, (day.count / max) * 120) }} />
              <small>
                {day.date.slice(8)}/{day.date.slice(5, 7)}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Phân bố rủi ro ước tính</h2>
        <p className="fine-print">
          Không phải tỷ lệ phishing đã xác minh · {total} lượt trong 7 ngày
        </p>
        {(["SAFE", "SUSPICIOUS", "DANGEROUS"] as const).map((risk) => {
          const count =
            analytics.distribution.find((item) => item.riskLevel === risk)
              ?.count || 0;
          return (
            <div className="distribution" key={risk}>
              <div>
                <RiskBadge risk={risk} />
                <strong>
                  {count} lượt ·{" "}
                  {total ? ((count / total) * 100).toFixed(1) : 0}%
                </strong>
              </div>
              <div className="distribution-track">
                <span
                  className={`risk-${risk}`}
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api("/admin/users", {
        method: "POST",
        body: Object.fromEntries(data),
      });
      form.reset();
      setMessage("Đã tạo tài khoản. Hệ thống không tự gửi mật khẩu qua email.");
      onCreated();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="card">
      <summary>Thêm người dùng</summary>
      <form className="form-stack create-user-form" onSubmit={submit}>
        <label>
          Họ và tên
          <input name="name" required minLength={2} maxLength={100} />
        </label>
        <label>
          Email người dùng
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          Mật khẩu ban đầu
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={72}
          />
          <small>Ít nhất 12 ký tự, có chữ hoa, chữ thường và số.</small>
        </label>
        <label>
          Vai trò tài khoản
          <select name="role" aria-label="Vai trò tài khoản">
            <option value="USER">Người dùng</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </label>
        <Notice>{error}</Notice>
        <Notice success>{message}</Notice>
        <button className="button primary self-start" disabled={busy}>
          {busy ? "Đang tạo…" : "Tạo người dùng"}
        </button>
      </form>
    </details>
  );
}
export function AuditPage() {
  const list = useList<{
    id: string;
    actorId: string;
    action: string;
    targetId: string;
    details: unknown;
    createdAt: string;
  }>("/admin/audit-logs");
  const names: Record<string, string> = {
    EVIDENCE_UPLOAD: "Cập nhật bằng chứng",
    USER_CREATE: "Tạo tài khoản",
    USER_ROLE: "Đổi vai trò",
    USER_BLOCK: "Khóa / mở khóa",
    REPORT_REVIEW: "Kiểm duyệt báo cáo",
  };
  return (
    <>
      <PageHeading title="Nhật ký quản trị">
        Các thao tác với tài khoản và báo cáo được ghi nhận trong hệ thống.
      </PageHeading>
      <Notice>{list.error}</Notice>
      <section className="card">
        {list.loading ? (
          <Loading />
        ) : !list.data?.items.length ? (
          <Empty title="Chưa có thao tác quản trị" />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                  <th>Người thực hiện</th>
                  <th>Bản ghi</th>
                </tr>
              </thead>
              <tbody>
                {list.data.items.map((log) => (
                  <tr key={log.id}>
                    <td>{date(log.createdAt)}</td>
                    <td>{names[log.action] || log.action}</td>
                    <td className="url-cell">{log.actorId}</td>
                    <td className="url-cell">
                      {log.targetId}
                      <small>{JSON.stringify(log.details)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager data={list.data} onPage={list.setPage} />
      </section>
    </>
  );
}
