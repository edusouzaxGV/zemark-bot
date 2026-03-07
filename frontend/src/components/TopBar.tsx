import { Sun, Moon, Key, Play } from 'lucide-react'
import { useUIStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '@/api/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function TopBar() {
  const { theme, toggleTheme } = useUIStore()
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchStats,
    refetchInterval: 5000,
  })

  const activeRuns = stats?.active_runs ?? 0

  return (
    <header className="h-16 border-b border-border bg-sidebar/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        {activeRuns > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs font-medium text-amber-400">
              {activeRuns} run{activeRuns !== 1 ? 's' : ''} active
            </span>
          </div>
        )}
        {activeRuns === 0 && (
          <div className="flex items-center gap-2 text-gray-500">
            <Play className="w-3.5 h-3.5" />
            <span className="text-xs">No active runs</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => (window.location.href = '/settings')}>
          <Key className="w-3.5 h-3.5" />
          API Keys
        </Button>
      </div>
    </header>
  )
}
