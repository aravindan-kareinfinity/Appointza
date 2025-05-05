import React, { createContext, useContext, useEffect, useState } from 'react';
import { DefaultColor, ThemeType } from '../styles/default-color.style';
import { Theme } from '../models/theme.model';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  colors: DefaultColor.instance.colors,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const defaultColor = DefaultColor.instance;
  const [colors, setColors] = useState<Theme>(defaultColor.colors);

  useEffect(() => {
    defaultColor.switchTheme(theme);
    setColors(defaultColor.colors);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}; 