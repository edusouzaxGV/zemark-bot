import { useQuery } from '@tanstack/react-query'
import { runsApi, type Run } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { duration, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const STEP_COLORS: Record<string, string> = {
  thought: 'bg-yellow-500/20 text-yellow-400 border-l-yellow-500',
  action: 'bg-blue-500/20 text-blue-400 border-l-blue-500',
  tool_call: 'bg-orange-500/20 text-orange-400 border-l-orange-500',
  tool_result: 'bg-green-500/20 text-green-400 border-l-green-500',
  final_answer: 'bg-purple-500/20 text-purple-400 border-l-purple-500',
  error: 'bg-red-500/20 text-red-400 border-l-red-500',
  agent_start: 'bg-cyan-500/20 text-cyan-400 border-l-cyan-500',
  status: 'bg-gray-500/20 text-gray-400 border-l-gray-500',
}

function TracePanel({ run }: { run: Run }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <span className="font-mono text-xs text-muted-foreground">#{run.id}</span>
        <span className="font-medium text-sm">{run.crew?.name ?? `Crew ${run.crew_id}`}</span>
        <StatusBadge status={run.status} />
        <span className="text-xs text-muted-foreground ml-auto">{duration(run.started_at, run.finished_at)} · {formatDate(run.created_at)}</span>
      </div>
      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {run.steps.length === 0 ? (
          <p className="text-muted-foreground text-xs">No steps recorded.</p>
        ) : (
          run.steps.map(step => (
            <div key={step.id} className={cn('border-l-2 pl-3 py-1 rounded-r text-xs', STEP_COLORS[step.step_type] ?? STEP_COLORS.status)}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium uppercase tracking-wider text-xs opacity-70">{step.step_type}</span>
                {step.agent_name && <span className="font-medium">[{step.agent_name}]</span>}
                {step.tool_name && <span className="opacity-70">→ {step.tool_name}</span>}
                <span className="ml-auto opacity-50">{new Date(step.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="line-clamp-2 opacity-90">{step.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function Traces() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list(),
    refetchInterval: 5000,
  })

  const [filter, setFilter] = useState<string>('all')
  const statuses = ['all', 'running', 'completed', 'failed', 'pending']
  const filtered = filter === 'all' ? runs : runs.filter(r => r.status === filter)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Traces</h1>
        <p className="text-muted-foreground text-sm mt-1">Execution timeline and step-by-step agent traces</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 text-xs rounded-md capitalize transition-colors', filter === s ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground')}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">No runs found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(run => <TracePanel key={run.id} run={run} />)}
        </div>
      )}
    </div>
  )
}
