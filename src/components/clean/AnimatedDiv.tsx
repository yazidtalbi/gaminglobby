'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedDivProps {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function AnimatedDiv({ 
  children, 
  className = '', 
  delay = 0,
  stagger = 0,
  direction = 'up'
}: AnimatedDivProps) {
  const directionMap = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
