import { createContext, useContext, useEffect, useState } from "react";

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

const DARK_MODE_KEY = "farmkonnect-dark-mode";

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));

    // Apply to document
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      root.style.setProperty("--background", "#0f172a");
      root.style.setProperty("--foreground", "#f1f5f9");
      root.style.setProperty("--card", "#1e293b");
      root.style.setProperty("--card-foreground", "#f1f5f9");
      root.style.setProperty("--primary", "#3b82f6");
      root.style.setProperty("--primary-foreground", "#0f172a");
      root.style.setProperty("--secondary", "#10b981");
      root.style.setProperty("--secondary-foreground", "#0f172a");
      root.style.setProperty("--accent", "#f59e0b");
      root.style.setProperty("--accent-foreground", "#0f172a");
      root.style.setProperty("--muted", "#64748b");
      root.style.setProperty("--muted-foreground", "#cbd5e1");
      root.style.setProperty("--border", "#334155");
    } else {
      root.classList.remove("dark");
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--foreground", "#0f172a");
      root.style.setProperty("--card", "#f8fafc");
      root.style.setProperty("--card-foreground", "#0f172a");
      root.style.setProperty("--primary", "#3b82f6");
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--secondary", "#10b981");
      root.style.setProperty("--secondary-foreground", "#ffffff");
      root.style.setProperty("--accent", "#f59e0b");
      root.style.setProperty("--accent-foreground", "#ffffff");
      root.style.setProperty("--muted", "#e2e8f0");
      root.style.setProperty("--muted-foreground", "#64748b");
      root.style.setProperty("--border", "#e2e8f0");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}
