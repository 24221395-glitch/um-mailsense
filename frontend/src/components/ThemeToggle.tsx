import { useState } from 'react'
import { MoonIcon, SunIcon } from './icons'

type Theme = 'dark' | 'light'
const KEY = 'mailsense.theme'

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Round sun/moon button. Light is the default theme. */
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(current)

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    if (next === 'dark') document.documentElement.dataset.theme = 'dark'
    else delete document.documentElement.dataset.theme
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* storage blocked: theme resets next visit */
    }
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-accent shadow-sm hover:border-accent hover:bg-accent-soft ${className}`}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
