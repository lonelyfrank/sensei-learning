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

  // Shortcut per toast di completamento sentiero
  const toastComplete = useCallback((courseName) => {
    addToast({
      title: 'Sentiero completato!',
      message: courseName,
      icon: '🎉',
      color: '#1D9E75',
      duration: 4000,
    })
  }, [addToast])

  return { toasts, addToast, removeToast, toastComplete }
}