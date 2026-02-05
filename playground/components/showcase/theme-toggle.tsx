'use client'

import { useState, useEffect } from 'react'
import { IconSun, IconMoon } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

/**
 * Theme toggle button for switching between light and dark modes.
 * Uses CSS class toggle instead of next-themes for simplicity.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const newDark = !dark
    setDark(newDark)
    document.documentElement.classList.toggle('dark', newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {dark ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
    </Button>
  )
}
