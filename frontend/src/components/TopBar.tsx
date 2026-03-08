import { Sun, Moon, Circle } from 'lucide-react'
import { useAppStore } from '@/store'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/client'

export function TopBar() {
  const { theme, toggleTheme } = useAppStore()
  const { data } = useQuery({ queryKey: ['stats'], queryFn: dashboardApi.stats, refetchInterval: 5000 })

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur sticky top-0 z-10">
      <div />
      <div className="flex items-center gap-4">
        {(data?.active_runs ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Circle className="w-2 h-2 fill-green-400 animate-pulse" />
            {data!.active_runs} active run{data!.active_runs !== 1 ? 's' : ''}
          </div>
        )}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
