import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
export type ColorTheme = "blue" | "green" | "orange" | "red" | "rose" | "violet" | "yellow" | "default";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
  defaultColorTheme?: ColorTheme;
}

const COLOR_THEMES: Record<ColorTheme, Record<string, string>> = {
  blue: { primary: "#3b82f6", secondary: "#1e40af", accent: "#0ea5e9" },
  green: { primary: "#10b981", secondary: "#047857", accent: "#34d399" },
  orange: { primary: "#f97316", secondary: "#c2410c", accent: "#fb923c" },
  red: { primary: "#ef4444", secondary: "#b91c1c", accent: "#f87171" },
  rose: { primary: "#f43f5e", secondary: "#be123c", accent: "#fb7185" },
  violet: { primary: "#a855f7", secondary: "#6d28d9", accent: "#c084fc" },
  yellow: { primary: "#eab308", secondary: "#a16207", accent: "#facc15" },
  default: { primary: "#6366f1", secondary: "#4f46e5", accent: "#818cf8" },
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
  defaultColorTheme = "default",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const stored = localStorage.getItem("colorTheme");
    return (stored as ColorTheme) || defaultColorTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color theme CSS variables
    const colors = COLOR_THEMES[colorTheme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
    localStorage.setItem("colorTheme", colorTheme);
  }, [theme, switchable, colorTheme]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable, colorTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "rose", label: "Rose" },
  { value: "violet", label: "Violet" },
  { value: "yellow", label: "Yellow" },
];

export function getColorThemeColors(theme: ColorTheme): Record<string, string> {
  return COLOR_THEMES[theme];
}
