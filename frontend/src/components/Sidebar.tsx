import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Bot, CheckSquare, Play, Activity, Wrench, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/crews', icon: Users, label: 'Crews' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/runs', icon: Play, label: 'Runs' },
  { to: '/traces', icon: Activity, label: 'Traces' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-border transition-all duration-300 shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border min-h-[64px]">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white whitespace-nowrap">CrewAI</p>
            <p className="text-xs text-gray-500 whitespace-nowrap">Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                    isActive
                      ? 'bg-accent/15 text-white border border-accent/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'w-4 h-4 shrink-0 transition-colors',
                        isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'
                      )}
                    />
                    {!sidebarCollapsed && <span className="whitespace-nowrap">{label}</span>}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
