import { useCallback } from 'react'
import { useAppStore } from '../store/app.store'

export const useToast = () => {
  const addToast = useAppStore((s) => s.addToast)
  const removeToast = useAppStore((s) => s.removeToast)

  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      addToast({ message, type })
    },
    [addToast]
  )

  return { toast, removeToast }
}
