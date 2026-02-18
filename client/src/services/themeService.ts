/**
 * Unified Theme Service
 * Manages theme persistence, synchronization, and application across the entire app
 */

export type Theme = "light" | "dark";
export type ColorTheme = "blue" | "green" | "orange" | "red" | "rose" | "violet" | "yellow" | "default";

const THEME_STORAGE_KEY = "farmkonnect-theme";
const COLOR_THEME_STORAGE_KEY = "farmkonnect-color-theme";
const DARK_MODE_STORAGE_KEY = "farmkonnect-dark-mode";

// Color theme definitions
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

// Dark mode CSS variables
const DARK_MODE_VARS = {
  "--background": "#0f172a",
  "--foreground": "#f1f5f9",
  "--card": "#1e293b",
  "--card-foreground": "#f1f5f9",
  "--primary": "#3b82f6",
  "--primary-foreground": "#0f172a",
  "--secondary": "#10b981",
  "--secondary-foreground": "#0f172a",
  "--accent": "#f59e0b",
  "--accent-foreground": "#0f172a",
  "--muted": "#64748b",
  "--muted-foreground": "#cbd5e1",
  "--border": "#334155",
  "--input": "#1e293b",
  "--ring": "#3b82f6",
  "--sidebar": "#0f172a",
  "--sidebar-foreground": "#f1f5f9",
  "--sidebar-accent": "#1e293b",
  "--sidebar-accent-foreground": "#f1f5f9",
  "--sidebar-border": "#334155",
};

const LIGHT_MODE_VARS = {
  "--background": "#ffffff",
  "--foreground": "#0f172a",
  "--card": "#f8fafc",
  "--card-foreground": "#0f172a",
  "--primary": "#3b82f6",
  "--primary-foreground": "#ffffff",
  "--secondary": "#10b981",
  "--secondary-foreground": "#ffffff",
  "--accent": "#f59e0b",
  "--accent-foreground": "#ffffff",
  "--muted": "#e2e8f0",
  "--muted-foreground": "#64748b",
  "--border": "#e2e8f0",
  "--input": "#f8fafc",
  "--ring": "#3b82f6",
  "--sidebar": "#f8fafc",
  "--sidebar-foreground": "#0f172a",
  "--sidebar-accent": "#e2e8f0",
  "--sidebar-accent-foreground": "#0f172a",
  "--sidebar-border": "#e2e8f0",
};

/**
 * Get the current theme from storage or system preference
 */
export function getCurrentTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  // Check system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

/**
 * Get the current color theme from storage
 */
export function getCurrentColorTheme(): ColorTheme {
  const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  if (stored && isValidColorTheme(stored)) {
    return stored as ColorTheme;
  }
  return "default";
}

/**
 * Check if a string is a valid color theme
 */
function isValidColorTheme(theme: string): theme is ColorTheme {
  return theme in COLOR_THEMES;
}

/**
 * Set the theme and persist it
 */
export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(theme === "dark"));
  applyTheme(theme);
  dispatchThemeChangeEvent(theme, "theme");
}

/**
 * Set the color theme and persist it
 */
export function setColorTheme(colorTheme: ColorTheme): void {
  localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  applyColorTheme(colorTheme);
  dispatchThemeChangeEvent(colorTheme, "colorTheme");
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
    Object.entries(DARK_MODE_VARS).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  } else {
    root.classList.remove("dark");
    Object.entries(LIGHT_MODE_VARS).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

/**
 * Apply color theme to the document
 */
export function applyColorTheme(colorTheme: ColorTheme): void {
  const root = document.documentElement;
  const colors = COLOR_THEMES[colorTheme];

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
}

/**
 * Initialize theme on app load
 */
export function initializeTheme(): void {
  const theme = getCurrentTheme();
  const colorTheme = getCurrentColorTheme();

  applyTheme(theme);
  applyColorTheme(colorTheme);
}

/**
 * Listen for theme changes
 */
export function onThemeChange(callback: (type: "theme" | "colorTheme", value: string) => void): () => void {
  const handleThemeChange = (event: CustomEvent) => {
    callback(event.detail.type, event.detail.value);
  };

  window.addEventListener("themechange", handleThemeChange as EventListener);

  return () => {
    window.removeEventListener("themechange", handleThemeChange as EventListener);
  };
}

/**
 * Dispatch theme change event
 */
function dispatchThemeChangeEvent(value: string, type: "theme" | "colorTheme"): void {
  window.dispatchEvent(
    new CustomEvent("themechange", {
      detail: { value, type },
    })
  );
}

/**
 * Get all available color themes
 */
export function getAvailableColorThemes(): { value: ColorTheme; label: string }[] {
  return [
    { value: "default", label: "Default" },
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "orange", label: "Orange" },
    { value: "red", label: "Red" },
    { value: "rose", label: "Rose" },
    { value: "violet", label: "Violet" },
    { value: "yellow", label: "Yellow" },
  ];
}

/**
 * Get color theme colors
 */
export function getColorThemeColors(theme: ColorTheme): Record<string, string> {
  return COLOR_THEMES[theme];
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme(): Theme {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
  return newTheme;
}
