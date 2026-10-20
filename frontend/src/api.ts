const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
let accessToken: string | null = null;
try {
  accessToken = sessionStorage.getItem("phishing.session");
} catch {
  /* Allow an in-memory session when storage is unavailable. */
}
export function hasToken() {
  return Boolean(accessToken);
}
export function setToken(value: string | null) {
  accessToken = value;
  try {
    if (value) sessionStorage.setItem("phishing.session", value);
    else sessionStorage.removeItem("phishing.session");
  } catch {
    /* Keep the in-memory session. */
  }
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    responseType?: "blob";
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method || "GET",
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(options.body !== undefined
        ? {
            body:
              options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body),
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "Không thể kết nối hệ thống. Kiểm tra kết nối và thử lại.",
      0,
    );
  }
  if (response.ok && options.responseType === "blob")
    return (await response.blob()) as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (
      response.status === 401 &&
      accessToken &&
      !["/auth/login", "/auth/register"].includes(path)
    )
      window.dispatchEvent(new Event("auth-expired"));
    const message =
      response.status === 503
        ? "Dịch vụ phân tích hiện chưa sẵn sàng. Vui lòng thử lại sau."
        : response.status === 429
          ? "Bạn thao tác quá nhiều lần. Vui lòng chờ một phút rồi thử lại."
          : response.status >= 500
            ? "Hệ thống đang gặp sự cố. Vui lòng thử lại sau."
            : Array.isArray(data?.message)
              ? data.message.join(". ")
              : data?.message || "Không thể hoàn thành yêu cầu.";
    throw new ApiError(message, response.status);
  }
  return data as T;
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra. Vui lòng thử lại.";
}
