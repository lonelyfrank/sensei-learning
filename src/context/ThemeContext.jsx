import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Temi di sistema — chiaro e scuro
export const THEMES_SYSTEM = [
  { id: 'light',    label: 'Light',    preview: ['#ffffff', '#f5f5f4', '#1a1a1a'] },
  { id: 'dark',     label: 'Dark',     preview: ['#1a1a1a', '#242424', '#f0f0f0'] },
]

// Temi personalizzati
export const THEMES_CUSTOM = [
  { id: 'midnight', label: 'Midnight', preview: ['#0a0f1e', '#111827', '#e2e8f0'] },
  { id: 'nord',     label: 'Nord',     preview: ['#2e3440', '#3b4252', '#eceff4'] },
  { id: 'obsidian', label: 'Obsidian', preview: ['#0a0a0f', '#111118', '#c9c9e0'] },
  { id: 'ocean',    label: 'Ocean',    preview: ['#0a1628', '#0d1f3c', '#cce5ff'] },
  { id: 'forest',   label: 'Forest',   preview: ['#0d1a12', '#132019', '#d4edda'] },
  { id: 'amber',    label: 'Amber',    preview: ['#1a1200', '#241a00', '#fef3c7'] },
  { id: 'paper',    label: 'Paper',    preview: ['#f5f0e8', '#ede8df', '#2c2416'] },
  { id: 'sakura',   label: 'Sakura',   preview: ['#fff0f5', '#ffe4ef', '#4a1228'] },
  { id: 'rose',     label: 'Rose',     preview: ['#fff5f7', '#ffe4e8', '#1a0a0e'] },
]

// Tutti i temi combinati
export const THEMES = [...THEMES_SYSTEM, ...THEMES_CUSTOM]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('sensei-theme') || 'dark'
    applyTheme(saved)
  }, [])

  const applyTheme = (themeId) => {
    const root = document.getElementById('root')
    THEMES.forEach(t => root.classList.remove(`theme-${t.id}`))
    root.classList.add(`theme-${themeId}`)
    setTheme(themeId)
    localStorage.setItem('sensei-theme', themeId)
  }

  return (
    <ThemeContext.Provider value={{ theme, applyTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}