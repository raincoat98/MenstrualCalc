import {useCycleStore} from '../store/cycleStore';
import {lightColors, darkColors, PINK, PINK_LIGHT, PINK_PALE} from '../theme';

export function useAppTheme() {
  const isDark = useCycleStore(s => s.isDarkMode);
  return {
    C: isDark ? darkColors : lightColors,
    isDark,
    PINK,
    PINK_LIGHT,
    PINK_PALE,
  };
}
