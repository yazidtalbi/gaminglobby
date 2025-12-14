'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  openItems: Set<string>
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

interface AccordionProps {
  children: React.ReactNode
  type?: 'single' | 'multiple'
  defaultValue?: string | string[]
  className?: string
}

export function Accordion({ children, type = 'single', defaultValue, className }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (defaultValue) {
      return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue])
    }
    return new Set()
  })

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (type === 'single') {
        next.clear()
        if (!prev.has(value)) {
          next.add(value)
        }
      } else {
        if (next.has(value)) {
          next.delete(value)
        } else {
          next.add(value)
        }
      }
      return next
    })
  }, [type])

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const AccordionItemContext = React.createContext<{ value: string } | undefined>(undefined)

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn('border border-slate-700/50 bg-slate-800/30 rounded-lg overflow-hidden', className)}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

export function AccordionTrigger({ children, className, ...props }: AccordionTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(AccordionContext)
  const itemContext = React.useContext(AccordionItemContext)
  if (!context) throw new Error('AccordionTrigger must be used within Accordion')
  if (!itemContext) throw new Error('AccordionTrigger must be used within AccordionItem')

  const isOpen = context.openItems.has(itemContext.value)

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemContext.value)}
      className={cn(
        'flex w-full items-center justify-between p-4 text-left font-title text-white transition-all hover:bg-slate-800/50',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')}
      />
    </button>
  )
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const context = React.useContext(AccordionContext)
  const itemContext = React.useContext(AccordionItemContext)
  if (!context) throw new Error('AccordionContent must be used within Accordion')
  if (!itemContext) throw new Error('AccordionContent must be used within AccordionItem')

  const isOpen = context.openItems.has(itemContext.value)

  if (!isOpen) return null

  return <div className={cn('p-4 pt-0 text-slate-300', className)}>{children}</div>
}
