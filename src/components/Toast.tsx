'use client'

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react'
import { X, Bell, UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react'

export type ToastType = 'info' | 'success' | 'error' | 'invite' | 'join'

interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
  imageUrl?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const duration = toast.duration ?? 5000
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons = {
    info: <Bell className="w-5 h-5 text-blue-400" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    invite: <UserPlus className="w-5 h-5 text-purple-400" />,
    join: <Users className="w-5 h-5 text-cyan-400" />,
  }

  const colors = {
    info: 'border-blue-500/30 bg-blue-500/10',
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    invite: 'border-purple-500/30 bg-purple-500/10',
    join: 'border-cyan-500/30 bg-cyan-500/10',
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        animate-in slide-in-from-right-full duration-300
        ${colors[toast.type]}
      `}
    >
      {toast.imageUrl ? (
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
          <img
            src={toast.imageUrl}
            alt="Game"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{toast.title}</p>
        <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick()
              onRemove(toast.id)
            }}
            className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

