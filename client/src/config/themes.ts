/**
 * Theme Configuration for FarmKonnect
 * Defines 8 color themes with CSS variable values
 */

export type ThemeName = 'default' | 'blue' | 'green' | 'orange' | 'red' | 'rose' | 'violet' | 'yellow';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  default: {
    name: 'default',
    label: 'Default',
    colors: {
      primary: '240 10% 3.9%',
      primaryForeground: '0 0% 100%',
      secondary: '240 4.8% 95.9%',
      secondaryForeground: '240 5.9% 10%',
      accent: '240 5.9% 10%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '240 4.8% 95.9%',
      mutedForeground: '240 3.8% 46.1%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 10% 3.9%',
    },
  },
  blue: {
    name: 'blue',
    label: 'Blue',
    colors: {
      primary: '217.2 91.2% 59.8%',
      primaryForeground: '0 0% 100%',
      secondary: '217.2 32.6% 17.5%',
      secondaryForeground: '0 0% 100%',
      accent: '217.2 91.2% 59.8%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '0 0% 100%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '217.2 91.2% 59.8%',
    },
  },
  green: {
    name: 'green',
    label: 'Green',
    colors: {
      primary: '142.4 71.8% 29.2%',
      primaryForeground: '0 0% 100%',
      secondary: '142.4 71.8% 29.2%',
      secondaryForeground: '0 0% 100%',
      accent: '142.4 71.8% 29.2%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '142.4 71.8% 29.2%',
      mutedForeground: '0 0% 100%',
      border: '142.4 71.8% 29.2%',
      input: '142.4 71.8% 29.2%',
      ring: '142.4 71.8% 29.2%',
    },
  },
  orange: {
    name: 'orange',
    label: 'Orange',
    colors: {
      primary: '24.6 95% 53.1%',
      primaryForeground: '0 0% 100%',
      secondary: '24.6 95% 53.1%',
      secondaryForeground: '0 0% 100%',
      accent: '24.6 95% 53.1%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '24.6 95% 53.1%',
      mutedForeground: '0 0% 100%',
      border: '24.6 95% 53.1%',
      input: '24.6 95% 53.1%',
      ring: '24.6 95% 53.1%',
    },
  },
  red: {
    name: 'red',
    label: 'Red',
    colors: {
      primary: '0 84.2% 60.2%',
      primaryForeground: '0 0% 100%',
      secondary: '0 84.2% 60.2%',
      secondaryForeground: '0 0% 100%',
      accent: '0 84.2% 60.2%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '0 84.2% 60.2%',
      mutedForeground: '0 0% 100%',
      border: '0 84.2% 60.2%',
      input: '0 84.2% 60.2%',
      ring: '0 84.2% 60.2%',
    },
  },
  rose: {
    name: 'rose',
    label: 'Rose',
    colors: {
      primary: '346.8 77.2% 49.8%',
      primaryForeground: '0 0% 100%',
      secondary: '346.8 77.2% 49.8%',
      secondaryForeground: '0 0% 100%',
      accent: '346.8 77.2% 49.8%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '346.8 77.2% 49.8%',
      mutedForeground: '0 0% 100%',
      border: '346.8 77.2% 49.8%',
      input: '346.8 77.2% 49.8%',
      ring: '346.8 77.2% 49.8%',
    },
  },
  violet: {
    name: 'violet',
    label: 'Violet',
    colors: {
      primary: '262.1 80% 50.6%',
      primaryForeground: '0 0% 100%',
      secondary: '262.1 80% 50.6%',
      secondaryForeground: '0 0% 100%',
      accent: '262.1 80% 50.6%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '262.1 80% 50.6%',
      mutedForeground: '0 0% 100%',
      border: '262.1 80% 50.6%',
      input: '262.1 80% 50.6%',
      ring: '262.1 80% 50.6%',
    },
  },
  yellow: {
    name: 'yellow',
    label: 'Yellow',
    colors: {
      primary: '47.9 95.8% 53.1%',
      primaryForeground: '0 0% 100%',
      secondary: '47.9 95.8% 53.1%',
      secondaryForeground: '0 0% 100%',
      accent: '47.9 95.8% 53.1%',
      accentForeground: '0 0% 100%',
      destructive: '0 84.2% 60.2%',
      destructiveForeground: '0 0% 100%',
      muted: '47.9 95.8% 53.1%',
      mutedForeground: '0 0% 100%',
      border: '47.9 95.8% 53.1%',
      input: '47.9 95.8% 53.1%',
      ring: '47.9 95.8% 53.1%',
    },
  },
};

export const themeList: ThemeConfig[] = Object.values(themes);

export function getTheme(name: ThemeName): ThemeConfig {
  return themes[name] || themes.default;
}

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  const colors = theme.colors;

  // Apply CSS variables
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.accentForeground);
  root.style.setProperty('--destructive', colors.destructive);
  root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--muted-foreground', colors.mutedForeground);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.input);
  root.style.setProperty('--ring', colors.ring);

  // Save to localStorage
  localStorage.setItem('theme-name', theme.name);

  // Force DOM repaint by triggering a reflow
  // This ensures CSS variables are immediately applied
  void root.offsetHeight;
}

export function getSavedTheme(): ThemeName {
  const saved = localStorage.getItem('theme-name');
  return (saved as ThemeName) || 'default';
}

/**
 * Detect system theme preference (light/dark mode)
 * Returns 'light' or 'dark' based on OS preference
 */
export function getSystemThemePreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  // Check if user has set a preference in localStorage
  const savedMode = localStorage.getItem('theme-mode');
  if (savedMode === 'light' || savedMode === 'dark') {
    return savedMode;
  }
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Set theme mode preference (light/dark)
 */
export function setThemeMode(mode: 'light' | 'dark') {
  localStorage.setItem('theme-mode', mode);
  
  // Update document class
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Initialize theme mode on app load
 */
export function initializeThemeMode() {
  const mode = getSystemThemePreference();
  setThemeMode(mode);
}

/**
 * Listen for system theme changes
 */
export function subscribeToSystemThemeChanges(callback: (mode: 'light' | 'dark') => void) {
  if (typeof window === 'undefined') return;
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', (e) => {
      const mode = e.matches ? 'dark' : 'light';
      // Only apply if user hasn't manually set a preference
      if (!localStorage.getItem('theme-mode')) {
        callback(mode);
      }
    });
  }
  // Fallback for older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener((e) => {
      const mode = e.matches ? 'dark' : 'light';
      if (!localStorage.getItem('theme-mode')) {
        callback(mode);
      }
    });
  }
}
