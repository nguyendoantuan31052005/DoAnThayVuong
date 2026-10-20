import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, hasToken, setToken } from "./api";
import type { AuthResult, User } from "./types";
interface Session {
  user: User | null;
  loading: boolean;
  accept: (result: AuthResult) => void;
  clear: (message?: string) => void;
  flash: string;
  update: (user: User) => void;
  retry: () => void;
  restoreError: string;
}
const AuthContext = createContext<Session | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [flash, setFlash] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken());
  const [restoreError, setRestoreError] = useState("");
  const [revision, setRevision] = useState(0);
  function clear(message = "") {
    setFlash(message);
    setToken(null);
    setUser(null);
    setLoading(false);
    setRestoreError("");
  }
  useEffect(() => {
    const expired = () =>
      clear(
        "Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.",
      );
    window.addEventListener("auth-expired", expired);
    return () => window.removeEventListener("auth-expired", expired);
  }, []);
  useEffect(() => {
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setRestoreError("");
    api<User>("/auth/me", { signal: controller.signal })
      .then(setUser)
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.status === 401) clear();
        else
          setRestoreError(
            "Chưa thể khôi phục phiên đăng nhập. Vui lòng kiểm tra kết nối và thử lại.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        flash,
        restoreError,
        retry: () => setRevision((v) => v + 1),
        accept: (result) => {
          setFlash("");
          setToken(result.accessToken);
          setUser(result.user);
          setRestoreError("");
        },
        clear,
        update: setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Thiếu AuthProvider");
  return value;
}
