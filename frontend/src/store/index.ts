import { create } from 'zustand'

interface AppStore {
  activeRunId: number | null
  setActiveRunId: (id: number | null) => void
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeRunId: null,
  setActiveRunId: (id) => set({ activeRunId: id }),
  theme: 'dark',
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    return { theme: next }
  }),
}))
