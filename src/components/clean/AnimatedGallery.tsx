'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedGalleryProps {
  children: ReactNode
  className?: string
}

export function AnimatedGallery({ children, className = '' }: AnimatedGalleryProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
