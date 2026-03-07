import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        default: 'bg-accent/20 text-accent border-accent/30',
        running: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        failed: 'bg-red-500/20 text-red-400 border-red-500/30',
        pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        sequential: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        hierarchical: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        parallel: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        secondary: 'bg-white/10 text-gray-300 border-white/10',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
