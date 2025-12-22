'use client'

import { motion } from 'framer-motion'

interface AnimatedGameCoverProps {
  children: React.ReactNode
  index: number
  className?: string
}

export function AnimatedGameCover({ children, index, className = '' }: AnimatedGameCoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: 'easeOut' 
      }}
      whileHover={{ scale: 1.05 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
