import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Moon, Sun } from "lucide-react";
type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("phishing.theme") === "dark"
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("phishing.theme", theme);
    } catch {
      /* Theme still works without persistent storage. */
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#0B1220" : "#F8FAFC");
  }, [theme]);
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle: () =>
          setTheme((value) => (value === "light" ? "dark" : "light")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeButton() {
  const { theme, toggle } = useContext(ThemeContext);
  const Icon = theme === "light" ? Sun : Moon;
  return (
    <button
      className="theme-button button secondary"
      onClick={toggle}
      aria-label={
        theme === "light"
          ? "Chuyển sang giao diện tối"
          : "Chuyển sang giao diện sáng"
      }
    >
      <Icon size={17} />
      <span>{theme === "light" ? "Sáng" : "Tối"}</span>
    </button>
  );
}
