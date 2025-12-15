'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from './Toast'
import { NotificationProvider } from './NotificationProvider'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { ReactNode } from 'react'

function ServiceWorkerRegistration() {
  useServiceWorker()
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <ServiceWorkerRegistration />
          {children}
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

