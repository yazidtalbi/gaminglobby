'use client'

import { ReactNode } from 'react'

interface CornerBracketButtonProps {
  children: ReactNode
  onClick?: () => void
  active?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function CornerBracketButton({
  children,
  onClick,
  active = false,
  variant = 'secondary',
  className = '',
  disabled = false,
  type = 'button',
}: CornerBracketButtonProps) {
  const baseClasses = 'relative px-4 py-2 font-medium uppercase tracking-wider text-sm transition-colors border'
  
  const variantClasses = {
    primary: active
      ? 'bg-cyan-500 text-white border-cyan-500'
      : 'bg-transparent text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10',
    secondary: active
      ? 'bg-slate-800 text-cyan-400 border-cyan-500/30'
      : 'bg-transparent text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Corner brackets */}
      <span className="absolute top-[-1px] left-[-1px] w-2 h-2 border-t border-l border-current" />
      <span className="absolute top-[-1px] right-[-1px] w-2 h-2 border-t border-r border-current" />
      <span className="absolute bottom-[-1px] left-[-1px] w-2 h-2 border-b border-l border-current" />
      <span className="absolute bottom-[-1px] right-[-1px] w-2 h-2 border-b border-r border-current" />
      
      {children}
    </button>
  )
}

