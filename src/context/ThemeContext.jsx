import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeContext } from './themeContextInstance';

const STORAGE_KEY = 'urbancab_theme';

/**
 * Get initial theme preference: 'light' | 'dark' | 'system'
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // LocalStorage might be disabled in private browsing
  }
  return 'system';
}

/**
 * Check if system prefers dark mode
 */
function getSystemPreference() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Compute resolved theme
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return systemPreference;
    }
    return theme;
  }, [theme, systemPreference]);

  // Apply theme class and data-theme to HTML root
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [resolvedTheme]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark' && newTheme !== 'system') return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Cycle toggle: light -> dark -> system -> light
  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      toggleTheme,
    }),
    [theme, setTheme, resolvedTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
