export const THEME_STORAGE_KEY = 'theme'
export const THEME_TRANSITION_MS = 500

export type Theme = 'light' | 'dark'

export type ThemeTransitionOrigin = {
  x: number
  y: number
}

const THEME_SURFACE: Record<Theme, string> = {
  light: '#fff',
  dark: '#16171d',
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

function startViewTransition(update: () => void): boolean {
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> }
  }

  if (!doc.startViewTransition) {
    return false
  }

  doc.startViewTransition(update)
  return true
}

function runCircleRevealFallback(
  theme: Theme,
  update: () => void,
): void {
  const overlay = document.createElement('div')
  overlay.className = 'theme-transition-overlay'
  overlay.style.background = THEME_SURFACE[theme]
  document.body.appendChild(overlay)

  const finish = () => {
    update()
    overlay.remove()
  }

  requestAnimationFrame(() => {
    overlay.classList.add('theme-transition-overlay--active')
  })

  overlay.addEventListener('transitionend', finish, { once: true })
  window.setTimeout(finish, THEME_TRANSITION_MS + 100)
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

  if (startViewTransition(update)) {
    return
  }

  runCircleRevealFallback(theme, update)
}

export function initTheme(): Theme {
  const theme = resolveTheme()
  applyTheme(theme)
  return theme
}
