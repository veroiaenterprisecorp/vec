export type ThemeMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'vec_theme_mode';

/**
 * Get the initial theme mode.
 * Default is STRICTLY 'dark' to preserve the original Vec Sigma dark luxe design.
 */
export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Local storage access error fallback
  }
  return 'dark';
}

/**
 * Applies the theme to the document root (<html class="light" data-theme="...">).
 * Dark Mode has no .light class, ensuring 100% preservation of original styles.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'light') {
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Local storage write error fallback
  }

  window.dispatchEvent(new CustomEvent('vec-theme-changed', { detail: { theme } }));
}

/**
 * Helper to toggle between dark and light modes.
 */
export function toggleTheme(currentTheme: ThemeMode): ThemeMode {
  const nextTheme: ThemeMode = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  return nextTheme;
}
