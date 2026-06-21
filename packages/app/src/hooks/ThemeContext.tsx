import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemeId } from '@ethervault/core';
import { getThemeById, migrateThemeColor, THEME_DEFINITIONS, type ThemeDefinition } from '../themes';

const STORAGE_KEY = 'ethervault_active_theme';
const LEGACY_COLOR_KEY = 'ethervault_theme_color';

interface ThemeContextValue {
  activeTheme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themeDefinition: ThemeDefinition;
  allThemes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Apply theme to DOM by setting CSS data attribute and cleaning up legacy attrs.
 */
function applyThemeToDOM(themeId: ThemeId) {
  const html = document.documentElement;

  // Set new theme attribute
  if (themeId === 'default') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', themeId);
  }

  // Clean up legacy theme-color attribute
  html.removeAttribute('data-theme-color');
}

/**
 * Read initial theme from storage, with migration from old themeColor.
 */
function getInitialTheme(): ThemeId {
  // Check for new theme key first
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme && THEME_DEFINITIONS.some(t => t.id === savedTheme)) {
    return savedTheme as ThemeId;
  }

  // Migrate from legacy themeColor
  const legacyColor = localStorage.getItem(LEGACY_COLOR_KEY);
  if (legacyColor) {
    const migrated = migrateThemeColor(legacyColor);
    // Persist migration
    localStorage.setItem(STORAGE_KEY, migrated);
    localStorage.removeItem(LEGACY_COLOR_KEY);
    return migrated;
  }

  return 'default';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTheme, setActiveThemeState] = useState<ThemeId>(getInitialTheme);

  const setTheme = useCallback((id: ThemeId) => {
    setActiveThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyThemeToDOM(id);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    applyThemeToDOM(activeTheme);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const themeDefinition = getThemeById(activeTheme);

  return (
    <ThemeContext.Provider value={{
      activeTheme,
      setTheme,
      themeDefinition,
      allThemes: THEME_DEFINITIONS,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access the current theme context.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
