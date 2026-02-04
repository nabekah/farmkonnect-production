import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeName, getTheme, applyTheme, getSavedTheme } from '@/config/themes';

interface ThemeColorContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = getSavedTheme();
    setCurrentTheme(savedTheme);
    applyTheme(getTheme(savedTheme));
    setIsLoaded(true);
  }, []);

  const handleSetTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    applyTheme(getTheme(theme));
  };

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <ThemeColorContext.Provider value={{ currentTheme, setTheme: handleSetTheme }}>
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
