'use client'

import { useEffect, useRef, useState } from 'react'
import { CRTFilterWebGL } from '@/lib/CRTFilter'

interface CRTCoverImageProps {
  src: string
  alt: string
  className?: string
}

export function CRTCoverImage({ src, alt, className = '' }: CRTCoverImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const crtFilterRef = useRef<CRTFilterWebGL | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !src) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Wait for container to have dimensions
    const initCRT = () => {
      // Get container dimensions
      const containerWidth = container.clientWidth || 256
      const containerHeight = container.clientHeight || (containerWidth * 1.5) // 2/3 aspect ratio

      if (containerWidth === 0 || containerHeight === 0) {
        // Retry if container doesn't have dimensions yet
        setTimeout(initCRT, 100)
        return
      }

      // Load the image through proxy to avoid CORS issues
      const img = new Image()
      
      // Use proxy API for external images
      const imageUrl = src.startsWith('http') 
        ? `/api/image-proxy?url=${encodeURIComponent(src)}`
        : src

      img.onload = () => {
        // Set canvas dimensions - use higher resolution for better quality
        const scale = 2 // Use 2x for retina displays
        canvas.width = containerWidth * scale
        canvas.height = containerHeight * scale

        // Draw image to canvas, scaling to fit
        const imgAspect = img.width / img.height
        const canvasAspect = canvas.width / canvas.height

        let drawWidth = canvas.width
        let drawHeight = canvas.height
        let drawX = 0
        let drawY = 0

        if (imgAspect > canvasAspect) {
          // Image is wider - fit to height
          drawHeight = canvas.height
          drawWidth = drawHeight * imgAspect
          drawX = (canvas.width - drawWidth) / 2
        } else {
          // Image is taller - fit to width
          drawWidth = canvas.width
          drawHeight = drawWidth / imgAspect
          drawY = (canvas.height - drawHeight) / 2
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

        // Apply CRT filter
        try {
          const config = {
            barrelDistortion: 0.001,
            curvature: 0.002,
            chromaticAberration: 0.0005,
            staticNoise: 0.001,
            horizontalTearing: 0.00012,
            glowBloom: 0.001,
            verticalJitter: 0.001,
            retraceLines: true,
            scanlineIntensity: 1.2, // Increased for bigger/more visible lines
            scanlineFrequency: 400.0, // Lower value = bigger/thicker lines (default is 800.0)
            dotMask: false,
            brightness: 0.9,
            contrast: 1.0,
            desaturation: 0.2,
            flicker: 0.01,
            signalLoss: 0.05,
            timeScale: 0.5, // Slower animation (0.5 = half speed)
          }

          const crtFilter = new CRTFilterWebGL(canvas, config)
          crtFilterRef.current = crtFilter
          
          // The CRTFilter will replace the canvas, so we need to update the style
          // of the new canvas that gets created
          const updateCanvasStyle = () => {
            const glCanvas = container.querySelector('canvas')
            if (glCanvas) {
              glCanvas.style.width = '100%'
              glCanvas.style.height = '100%'
              glCanvas.style.objectFit = 'cover'
              crtFilter.start()
              setIsLoading(false)
            } else {
              // Retry if canvas not replaced yet
              setTimeout(updateCanvasStyle, 10)
            }
          }
          
          updateCanvasStyle()
        } catch (error) {
          console.error('Failed to apply CRT filter:', error)
          setIsLoading(false)
        }
      }

      img.onerror = () => {
        console.error('Failed to load image:', imageUrl)
        setIsLoading(false)
      }

      img.src = imageUrl
    }

    // Use ResizeObserver to wait for container dimensions
    const resizeObserver = new ResizeObserver(() => {
      initCRT()
      resizeObserver.disconnect()
    })

    resizeObserver.observe(container)

    // Fallback: try immediately
    initCRT()

    // Cleanup
    return () => {
      resizeObserver.disconnect()
      if (crtFilterRef.current) {
        try {
          crtFilterRef.current.stop()
        } catch (error) {
          // Ignore cleanup errors
        }
        crtFilterRef.current = null
      }
    }
  }, [src])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ 
          display: isLoading ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/50 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
}

