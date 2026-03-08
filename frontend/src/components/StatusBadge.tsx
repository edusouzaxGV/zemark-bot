import { cn } from '@/lib/utils'

const STATUS = {
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  sequential: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  hierarchical: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  parallel: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  builtin: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  custom: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS[status as keyof typeof STATUS] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', cls)}>
      {status}
    </span>
  )
}
