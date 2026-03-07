import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Crews from '@/pages/Crews'
import Agents from '@/pages/Agents'
import Tasks from '@/pages/Tasks'
import Runs from '@/pages/Runs'
import Traces from '@/pages/Traces'
import Tools from '@/pages/Tools'
import Settings from '@/pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="crews" element={<Crews />} />
            <Route path="agents" element={<Agents />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="runs" element={<Runs />} />
            <Route path="traces" element={<Traces />} />
            <Route path="tools" element={<Tools />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e2035',
            border: '1px solid #2a2d45',
            color: '#e2e8f0',
          },
        }}
      />
    </QueryClientProvider>
  )
}
