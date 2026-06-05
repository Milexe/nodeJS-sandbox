export const THEME_STORAGE_KEY = 'theme'
export const THEME_TRANSITION_MS = 500

export type Theme = 'light' | 'dark'

export type ThemeTransitionOrigin = {
  x: number
  y: number
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function getStoredTheme(): Theme | null {
  const value = localStorage.getItem(THEME_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function setTransitionOrigin(origin: ThemeTransitionOrigin): void {
  const root = document.documentElement
  root.style.setProperty('--theme-transition-x', `${origin.x}px`)
  root.style.setProperty('--theme-transition-y', `${origin.y}px`)
}

function startThemeTransition(update: () => void): void {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  if (doc.startViewTransition) {
    doc.startViewTransition(update)
    return
  }

  update()
}

export function applyThemeWithTransition(
  theme: Theme,
  origin?: ThemeTransitionOrigin,
): void {
  const update = () => applyTheme(theme)

  if (!origin || prefersReducedMotion()) {
    update()
    return
  }

  setTransitionOrigin(origin)
  startThemeTransition(update)
}

export function initTheme(): Theme {
  const theme = resolveTheme()
  applyTheme(theme)
  return theme
}
