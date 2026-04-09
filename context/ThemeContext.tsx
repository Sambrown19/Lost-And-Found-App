import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
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
  toggleTheme: () => {},
  colors: lightColors,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('userTheme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      } else {
        // No saved preference, follow system
        setTheme(systemScheme === 'dark' ? 'dark' : 'light');
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('userTheme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      colors: theme === 'dark' ? darkColors : lightColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);