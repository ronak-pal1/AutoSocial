import { create } from 'zustand';

type Theme = 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Always enforce clean white theme as requested
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('autosocial_theme', 'light');
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }

  return {
    theme: 'light',
    setTheme: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('autosocial_theme', 'light');
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
      }
      set({ theme: 'light' });
    },
    toggleTheme: () => {
      // White theme only
      set({ theme: 'light' });
    }
  };
});

