'use client'

import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'outline-red'
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  bgColor?: string
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  bgColor,
}: AnimatedButtonProps) {
  const getHoverColor = () => {
    if (bgColor) {
      if (bgColor.includes('purple')) return '#9333ea'
      if (bgColor.includes('emerald')) return '#10b981'
      return bgColor
    }
    if (variant === 'primary') return '#ece8e1'
    if (variant === 'outline-red') return '#ef4444'
    return '#06b6d4'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`animated-button ${variant} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="animated-button-label">
        <span 
          className="animated-button-hover-effect" 
          style={{ backgroundColor: getHoverColor() }}
        />
        <span className="animated-button-label-text">
          {children}
        </span>
      </div>
    </button>
  )
}
