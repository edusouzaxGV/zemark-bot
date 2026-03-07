import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    className={cn(
      'flex h-9 w-full rounded-lg border border-border bg-[#1a1d2e] px-3 py-1 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-accent transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
