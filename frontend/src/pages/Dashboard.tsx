import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '@/api/client'
import { Users, Bot, Play, TrendingUp, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDuration } from '@/lib/utils'
import type { Run } from '@/types'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: Run['status'] }) {
  const map: Record<string, 'running' | 'completed' | 'failed' | 'pending'> = {
    running: 'running', completed: 'completed', failed: 'failed', pending: 'pending',
  }
  return (
    <Badge variant={map[status] ?? 'pending'}>
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {status}
    </Badge>
  )
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Platform overview and recent activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Crews"
          value={stats?.total_crews ?? 0}
          sub={`${stats?.total_agents ?? 0} agents`}
          color="bg-accent/15 text-accent"
        />
        <StatCard
          icon={Play}
          label="Active Runs"
          value={stats?.active_runs ?? 0}
          sub="currently executing"
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={Bot}
          label="Total Agents"
          value={stats?.total_agents ?? 0}
          sub={`${stats?.total_tasks ?? 0} tasks`}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${stats?.success_rate ?? 0}%`}
          sub={`${stats?.completed_runs ?? 0} completed`}
          color="bg-emerald-500/15 text-emerald-400"
        />
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Executions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!stats?.recent_runs?.length ? (
            <div className="px-5 pb-5 text-sm text-gray-500">No runs yet. Go to Runs to execute a crew.</div>
          ) : (
            <div className="divide-y divide-border">
              {stats.recent_runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                      {run.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                      {run.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {run.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {run.status === 'pending' && <Clock className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {run.crew_name ?? `Crew #${run.crew_id}`}
                      </p>
                      <p className="text-xs text-gray-500">Run #{run.id} · {formatDate(run.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {formatDuration(run.started_at, run.completed_at)}
                    </span>
                    <StatusBadge status={run.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats?.completed_runs ?? 0}</p>
              <p className="text-xs text-gray-500">Completed runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats?.failed_runs ?? 0}</p>
              <p className="text-xs text-gray-500">Failed runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <p className="text-lg font-bold text-white">{stats?.total_tasks ?? 0}</p>
              <p className="text-xs text-gray-500">Total tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
