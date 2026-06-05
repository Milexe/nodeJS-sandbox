import { useCallback, useState } from 'react'
import {
  applyThemeWithTransition,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeTransitionOrigin,
} from '../theme'

function readActiveTheme(): Theme {
  const attr = document.documentElement.dataset.theme
  if (attr === 'light' || attr === 'dark') {
    return attr
  }
  return resolveTheme()
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readActiveTheme)

  const setTheme = useCallback(
    (next: Theme, origin?: ThemeTransitionOrigin) => {
      localStorage.setItem(THEME_STORAGE_KEY, next)
      applyThemeWithTransition(next, origin)
      setThemeState(next)
    },
    [],
  )

  const toggle = useCallback(
    (origin?: ThemeTransitionOrigin) => {
      setTheme(theme === 'dark' ? 'light' : 'dark', origin)
    },
    [setTheme, theme],
  )

  return { theme, setTheme, toggle }
}
