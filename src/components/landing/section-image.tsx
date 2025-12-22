// /src/components/landing/section-image.tsx
'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type ImageVariant = 'hero' | 'wide' | 'card' | 'mini' | 'blur-bg'

interface SectionImageProps {
  src: string
  alt: string
  variant?: ImageVariant
  badge?: string
  aspect?: string
  priority?: boolean
  className?: string
  containerClassName?: string
  glowColor?: 'cyan' | 'indigo' | 'violet' | 'purple'
}

const variantStyles: Record<ImageVariant, { container: string; image: string }> = {
  hero: {
    container: 'relative w-full aspect-[4/3] lg:aspect-[16/10]',
    image: 'object-cover rounded-2xl',
  },
  wide: {
    container: 'relative w-full aspect-[21/9]',
    image: 'object-cover rounded-xl',
  },
  card: {
    container: 'relative w-full aspect-video',
    image: 'object-cover rounded-t-lg',
  },
  mini: {
    container: 'relative w-full aspect-[16/9] max-h-32',
    image: 'object-cover rounded-lg',
  },
  'blur-bg': {
    container: 'absolute inset-0 -z-10',
    image: 'object-cover',
  },
}

const glowColors = {
  cyan: 'shadow-cyan-500/20 ring-cyan-500/30',
  indigo: 'shadow-indigo-500/20 ring-indigo-500/30',
  violet: 'shadow-violet-500/20 ring-violet-500/30',
  purple: 'shadow-purple-500/20 ring-purple-500/30',
}

export function SectionImage({
  src,
  alt,
  variant = 'card',
  badge,
  aspect,
  priority = false,
  className,
  containerClassName,
  glowColor = 'cyan',
}: SectionImageProps) {
  const styles = variantStyles[variant]
  const isBlurBg = variant === 'blur-bg'
  const isDecorative = alt === ''

  return (
    <div
      className={cn(
        styles.container,
        aspect,
        !isBlurBg && 'overflow-hidden',
        !isBlurBg && 'border border-slate-700/50',
        !isBlurBg && 'shadow-lg ring-1',
        !isBlurBg && glowColors[glowColor],
        !isBlurBg && 'rounded-xl lg:rounded-2xl',
        containerClassName
      )}
    >
      {/* Gradient overlay for non-blur variants */}
      {!isBlurBg && (
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none rounded-xl lg:rounded-2xl" />
      )}

      {/* Blur overlay for blur-bg variant */}
      {isBlurBg && (
        <>
          <div className="absolute inset-0 z-10 bg-slate-950/80 pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 pointer-events-none" />
        </>
      )}

      <Image
        src={src}
        alt={isDecorative ? '' : alt}
        fill
        priority={priority}
        className={cn(
          styles.image,
          isBlurBg && 'opacity-[0.12] blur-sm',
          className
        )}
        sizes={
          variant === 'hero'
            ? '(max-width: 768px) 100vw, 50vw'
            : variant === 'wide'
            ? '100vw'
            : variant === 'mini'
            ? '(max-width: 768px) 100vw, 25vw'
            : '(max-width: 768px) 100vw, 50vw'
        }
        aria-hidden={isDecorative}
      />

      {/* Badge */}
      {badge && !isBlurBg && (
        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 text-xs font-semibold text-white bg-cyan-500 rounded-full shadow-lg">
          {badge}
        </div>
      )}

      {/* Subtle glow ring effect (non-blur only) */}
      {!isBlurBg && (
        <div 
          className={cn(
            'absolute -inset-px rounded-xl lg:rounded-2xl pointer-events-none',
            'bg-gradient-to-br opacity-50',
            glowColor === 'cyan' && 'from-cyan-500/10 to-transparent',
            glowColor === 'indigo' && 'from-indigo-500/10 to-transparent',
            glowColor === 'violet' && 'from-violet-500/10 to-transparent',
            glowColor === 'purple' && 'from-purple-500/10 to-transparent'
          )}
        />
      )}
    </div>
  )
}
