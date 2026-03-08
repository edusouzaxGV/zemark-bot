import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate, duration } from '@/lib/utils'
import { Network, Users, Play, TrendingUp } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: dashboardApi.stats, refetchInterval: 5000 })

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!data) return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your AI Agents Management Platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Crews" value={data.total_crews} icon={Network} color="bg-purple-500/20 text-purple-400" />
        <StatCard label="Total Agents" value={data.total_agents} icon={Users} color="bg-blue-500/20 text-blue-400" />
        <StatCard label="Total Runs" value={data.total_runs} icon={Play} color="bg-green-500/20 text-green-400" />
        <StatCard label="Success Rate" value={`${data.success_rate}%`} icon={TrendingUp} color="bg-yellow-500/20 text-yellow-400" />
      </div>

      {/* Recent runs */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Recent Runs</h2>
        </div>
        {data.recent_runs.length === 0 ? (
          <p className="p-5 text-muted-foreground text-sm">No runs yet. Go to Crews and execute one!</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="px-5 py-2.5 text-left font-medium">ID</th>
                <th className="px-5 py-2.5 text-left font-medium">Crew</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium">Duration</th>
                <th className="px-5 py-2.5 text-left font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_runs.map((run) => (
                <tr key={run.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{run.id}</td>
                  <td className="px-5 py-3">{run.crew?.name ?? `Crew ${run.crew_id}`}</td>
                  <td className="px-5 py-3"><StatusBadge status={run.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{duration(run.started_at, run.finished_at)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(run.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
