import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemePreference = 'light' | 'dark' | 'system';
type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'app_theme_preference';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: typeof lightColors;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
}

export const lightColors = {
  primary: '#0A1628',
  secondary: '#1a2a4a',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5',
  textPrimary: '#0A1628',
  textSecondary: '#444444',
  textLight: '#888888',
  border: '#E0E0E0',
  background: '#FFFFFF',
};

export const darkColors = {
  primary: '#4A90D9',
  secondary: '#2a3a5a',
  white: '#1E1E1E',
  black: '#FFFFFF',
  gray: '#2A2A2A',
  textPrimary: '#F0F0F0',
  textSecondary: '#AAAAAA',
  textLight: '#666666',
  border: '#333333',
  background: '#121212',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  themePreference: 'system',
  setThemePreference: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  // Load saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemePreferenceState(saved);
      }
    });
  }, []);

  // Save preference when it changes
  const setThemePreference = (pref: ThemePreference) => {
    setThemePreferenceState(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
  };

  // Resolve actual theme from preference
  const resolvedTheme: Theme =
    themePreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : themePreference;

  const isDark = resolvedTheme === 'dark';

  return (
    <ThemeContext.Provider value={{
      theme: resolvedTheme,
      isDark,
      colors: isDark ? darkColors : lightColors,
      themePreference,
      setThemePreference,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);