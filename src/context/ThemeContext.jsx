import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const THEMES = [
  { id: 'dark',     label: 'Dark',     preview: ['#1a1a1a', '#242424', '#f0f0f0'] },
  { id: 'light',    label: 'Light',    preview: ['#ffffff', '#f5f5f4', '#1a1a1a'] },
  { id: 'midnight', label: 'Midnight', preview: ['#0a0f1e', '#111827', '#e2e8f0'] },
  { id: 'forest',   label: 'Forest',   preview: ['#0d1a12', '#132019', '#d4edda'] },
  { id: 'amber',    label: 'Amber',    preview: ['#1a1200', '#241a00', '#fef3c7'] },
  { id: 'rose',     label: 'Rose',     preview: ['#fff5f7', '#ffe4e8', '#1a0a0e'] },
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark')

  // Carica tema salvato all'avvio
  useEffect(() => {
    const saved = localStorage.getItem('sensei-theme') || 'dark'
    applyTheme(saved)
  }, [])

  const applyTheme = (themeId) => {
    // Rimuove tutte le classi tema precedenti
    const root = document.getElementById('root')
    THEMES.forEach(t => root.classList.remove(`theme-${t.id}`))
    // Applica la nuova classe tema
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