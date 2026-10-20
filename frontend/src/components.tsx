import { useEffect, useState, type ReactNode } from "react";
import {
  LoaderCircle,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, errorMessage } from "./api";
import type { Page, Risk, Scan, ReportStatus } from "./types";
export const riskLabels: Record<Risk, string> = {
  SAFE: "Rủi ro thấp",
  SUSPICIOUS: "Cần thận trọng",
  DANGEROUS: "Nguy cơ cao",
};
export const statusLabels: Record<ReportStatus, string> = {
  PENDING: "Chờ duyệt",
  REVIEWING: "Đang xác minh",
  CONFIRMED: "Đã xác minh",
  REJECTED: "Đã từ chối",
};
export function date(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
export function Loading({ text = "Đang tải dữ liệu…" }: { text?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      {text}
    </div>
  );
}
export function Notice({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return children ? (
    <div
      className={`notice ${success ? "success" : "error"}`}
      role={success ? "status" : "alert"}
    >
      {children}
    </div>
  ) : null;
}
export function Empty({
  title = "Chưa có dữ liệu",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <ShieldCheck size={36} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function RiskBadge({ risk }: { risk: Risk }) {
  return <span className={`badge risk-${risk}`}>{riskLabels[risk]}</span>;
}
export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`badge status-${status}`}>{statusLabels[status]}</span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-heading">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  );
}
export function useList<T>(path: string, filters = "", enabled = true) {
  const [data, setData] = useState<Page<T> | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<Page<T>>(
      `${path}?page=${page}&pageSize=10${filters ? "&" + filters : ""}`,
      { signal: controller.signal },
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        if (page > Math.max(1, result.totalPages))
          setPage(Math.max(1, result.totalPages));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, page, revision, filters, enabled]);
  return {
    data,
    page,
    setPage,
    loading,
    error,
    refresh: () => setRevision((v) => v + 1),
  };
}
export function Pager({
  data,
  onPage,
}: {
  data: Page<unknown> | null;
  onPage: (page: number) => void;
}) {
  if (!data || !data.total) return null;
  return (
    <nav className="pager" aria-label="Phân trang">
      <span>
        {data.total} bản ghi · Trang {data.page}/{data.totalPages}
      </span>
      <div>
        <button
          className="button secondary icon-button"
          aria-label="Trang trước"
          disabled={data.page <= 1}
          onClick={() => onPage(data.page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <button
          className="button secondary icon-button"
          aria-label="Trang sau"
          disabled={data.page >= data.totalPages}
          onClick={() => onPage(data.page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
export function ScanResult({ scan }: { scan: Scan }) {
  const Icon =
    scan.riskLevel === "SAFE"
      ? ShieldCheck
      : scan.riskLevel === "DANGEROUS"
        ? ShieldAlert
        : AlertTriangle;
  return (
    <section
      className={`card result risk-${scan.riskLevel}`}
      aria-label="Kết quả phân tích"
    >
      <div className="result-heading">
        <span className="result-icon">
          <Icon size={30} />
        </span>
        <div>
          <p className="eyebrow">KẾT QUẢ PHÂN TÍCH</p>
          <h2>{riskLabels[scan.riskLevel]}</h2>
        </div>
        <strong className="score">
          {scan.riskScore}
          <small>/100</small>
        </strong>
      </div>
      <div
        className="score-track"
        role="meter"
        aria-label="Điểm rủi ro"
        aria-valuenow={scan.riskScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${scan.riskScore}%` }} />
      </div>
      <p className="url-text">{scan.url}</p>
      <div className="result-disclaimer">
        <strong>
          {scan.riskLevel === "SAFE"
            ? "Rủi ro thấp không đồng nghĩa với an toàn"
            : scan.riskLevel === "DANGEROUS"
              ? "Không nhập mật khẩu, mã OTP hoặc thông tin cá nhân"
              : "Hãy xác minh thêm trước khi truy cập"}
        </strong>
        <p>Kết quả do AI ước tính, không đảm bảo URL an toàn.</p>
      </div>
      <h3>Vì sao AI đưa ra ước tính này?</h3>
      <p className="fine-print">
        Các tín hiệu đóng góp vào đánh giá, không phải bằng chứng khẳng định.
      </p>
      {scan.reasons.length ? (
        <ul className="reasons">
          {scan.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Mô hình chưa cung cấp thêm dấu hiệu.</p>
      )}
      <p className="fine-print">
        Mã quét: {scan.id} · Mô hình: {scan.modelVersion} · Xử lý:{" "}
        {scan.processingMs
          ? `${(scan.processingMs / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 2 })} giây`
          : "Chưa ghi nhận"}{" "}
        · Kiểm tra lúc {date(scan.createdAt)} · Kết quả phân tích là thông tin
        hỗ trợ, không bảo đảm website an toàn tuyệt đối.
      </p>
    </section>
  );
}
