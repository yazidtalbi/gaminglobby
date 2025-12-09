'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from './Toast'
import { NotificationProvider } from './NotificationProvider'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

