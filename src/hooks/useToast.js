import { useState, useCallback } from 'react'

/* Hook per gestire il sistema toast */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toastComplete = useCallback((courseName) => {
    addToast({ title: 'Sentiero completato!', message: courseName, icon: '🎉', color: '#1D9E75', duration: 4000 })
  }, [addToast])

  const toastError = useCallback((title, message) => {
    addToast({ title, message, icon: '⚠️', color: '#E24B4A', duration: 4000 })
  }, [addToast])

  const toastSuccess = useCallback((title, message) => {
    addToast({ title, message, icon: '✓', color: '#1D9E75', duration: 3000 })
  }, [addToast])

  return { toasts, addToast, removeToast, toastComplete, toastError, toastSuccess }
}