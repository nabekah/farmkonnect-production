import { useEffect, useState } from "react";
import {
  getCurrentTheme,
  getCurrentColorTheme,
  setTheme,
  setColorTheme,
  toggleTheme,
  onThemeChange,
  type Theme,
  type ColorTheme,
} from "@/services/themeService";

interface UseUnifiedThemeReturn {
  theme: Theme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme: () => Theme;
  isDarkMode: boolean;
}

/**
 * Unified theme hook that manages both light/dark and color themes
 * Ensures theme changes are synchronized across the entire app
 */
export function useUnifiedTheme(): UseUnifiedThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => getCurrentTheme());
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => getCurrentColorTheme());

  useEffect(() => {
    // Listen for theme changes from other tabs/windows or components
    const unsubscribe = onThemeChange((type, value) => {
      if (type === "theme") {
        setThemeState(value as Theme);
      } else if (type === "colorTheme") {
        setColorThemeState(value as ColorTheme);
      }
    });

    return unsubscribe;
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  const handleSetColorTheme = (newColorTheme: ColorTheme) => {
    setColorTheme(newColorTheme);
    setColorThemeState(newColorTheme);
  };

  const handleToggleTheme = (): Theme => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
    return newTheme;
  };

  return {
    theme,
    colorTheme,
    setTheme: handleSetTheme,
    setColorTheme: handleSetColorTheme,
    toggleTheme: handleToggleTheme,
    isDarkMode: theme === "dark",
  };
}
