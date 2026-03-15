import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { Toast as ToastType } from '../types'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info
}

const colorMap = {
  success: 'border-success/40 bg-success/10',
  error: 'border-danger/40 bg-danger/10',
  info: 'border-accent/40 bg-accent/10'
}

const iconColorMap = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-accent'
}

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const Icon = iconMap[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 animate-in ${colorMap[toast.type]}`}
      style={{ minWidth: 280, maxWidth: 400 }}
    >
      <Icon size={18} className={`shrink-0 ${iconColorMap[toast.type]}`} />
      <span className="flex-1 text-sm text-text-primary">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-text-secondary hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}
