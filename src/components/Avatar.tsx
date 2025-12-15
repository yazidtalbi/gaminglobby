'use client'

import { useState } from 'react'

interface AvatarProps {
  src: string | null | undefined
  alt: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  username?: string
  showBorder?: boolean
  borderColor?: 'default' | 'pro' | 'founder'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}

const borderColorClasses = {
  default: 'border-slate-600',
  pro: 'border-yellow-400',
  founder: 'border-purple-400',
}

export function Avatar({ 
  src, 
  alt, 
  className = '', 
  size = 'md',
  username,
  showBorder = false,
  borderColor = 'default'
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const sizeClass = sizeClasses[size]
  const borderClass = showBorder ? `border-2 ${borderColorClasses[borderColor]}` : ''
  const displayInitial = username ? username.charAt(0).toUpperCase() : alt.charAt(0).toUpperCase()

  // If no src or image error, show fallback
  const showFallback = !src || imageError

  return (
    <div className={`${sizeClass} ${borderClass} rounded-full overflow-hidden bg-slate-700 flex items-center justify-center relative ${className}`}>
      {showFallback ? (
        <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <span className={`text-slate-100 font-title font-semibold ${
            size === 'sm' ? 'text-xs' : 
            size === 'md' ? 'text-sm' : 
            size === 'lg' ? 'text-lg' : 
            'text-xl'
          }`}>
            {displayInitial}
          </span>
        </div>
      ) : (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className={`text-slate-100 font-title font-semibold ${
                size === 'sm' ? 'text-xs' : 
                size === 'md' ? 'text-sm' : 
                size === 'lg' ? 'text-lg' : 
                'text-xl'
              }`}>
                {displayInitial}
              </span>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${imageLoaded ? 'relative z-10' : 'absolute inset-0 opacity-0'}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}
    </div>
  )
}
