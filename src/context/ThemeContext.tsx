import { createContext, useContext, useEffect } from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  /** No-op — Nexus is light-theme only. Kept so existing call sites don't need to change. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

/** Nexus is light-theme only. This provider exists purely so components that
 * read `useTheme()` keep working without every call site needing an update. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("nexus-theme");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
