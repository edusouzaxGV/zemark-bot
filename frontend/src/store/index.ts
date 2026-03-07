import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  activeRunIds: number[]
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setTheme: (t: 'dark' | 'light') => void
  toggleTheme: () => void
  addActiveRun: (id: number) => void
  removeActiveRun: (id: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      activeRunIds: [],
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', next === 'dark')
          return { theme: next }
        }),
      addActiveRun: (id) =>
        set((s) => ({ activeRunIds: [...new Set([...s.activeRunIds, id])] })),
      removeActiveRun: (id) =>
        set((s) => ({ activeRunIds: s.activeRunIds.filter((r) => r !== id) })),
    }),
    { name: 'crewai-ui' }
  )
)
