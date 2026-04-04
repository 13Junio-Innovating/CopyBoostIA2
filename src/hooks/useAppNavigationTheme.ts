import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { palette } from '../utils/palette';

export function useAppNavigationTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const base = isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.brand,
      background: isDark ? palette.bgDark : palette.bgLight,
      card: isDark ? palette.cardDark : palette.cardLight,
      text: isDark ? palette.textDark : palette.textLight,
      border: isDark ? palette.borderDark : palette.borderLight,
      notification: palette.brand,
    },
  };
}

