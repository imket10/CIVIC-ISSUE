'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'

const Dialog = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean }
>(({ className, children, open, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 flex items-center justify-center p-4',
      open ? 'block' : 'hidden',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Dialog.displayName = 'Dialog'

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <div
      ref={ref}
      className={cn(
        'relative w-full max-w-lg bg-white rounded-xl shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  </>
))
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
DialogTitle.displayName = 'DialogTitle'

export { Dialog, DialogContent, DialogHeader, DialogTitle }