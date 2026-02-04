import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, getTheme, applyTheme, getSavedTheme, initializeThemeMode, subscribeToSystemThemeChanges, setThemeMode } from '@/config/themes';

interface ThemeColorContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme and initialize theme mode on mount
  useEffect(() => {
    // Initialize theme mode (light/dark) from system preference or saved preference
    const initialMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    if (initialMode) {
      setThemeModeState(initialMode);
    } else {
      initializeThemeMode();
      const mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      setThemeModeState(mode);
    }
    
    // Load and apply saved color theme
    const savedTheme = getSavedTheme();
    setCurrentTheme(savedTheme);
    applyTheme(getTheme(savedTheme));
    
    // Subscribe to system theme changes
    subscribeToSystemThemeChanges((mode) => {
      setThemeModeState(mode);
    });
    
    setIsLoaded(true);
  }, []);

  const handleSetTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(getTheme(theme));
    // Force a small delay to ensure DOM updates are processed
    // This helps ensure the theme change is visually reflected immediately
    setTimeout(() => {
      // Trigger a small repaint by accessing offsetHeight
      void document.documentElement.offsetHeight;
    }, 0);
  };

  if (!isLoaded) {
    return <>{children}</>;
  }

  const handleSetThemeModeState = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
    setThemeMode(mode);
  };

  return (
    <ThemeColorContext.Provider value={{ currentTheme, setTheme: handleSetTheme, themeMode, setThemeMode: handleSetThemeModeState }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (!context) {
    throw new Error('useThemeColor must be used within ThemeColorProvider');
  }
  return context;
}
