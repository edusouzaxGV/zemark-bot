import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { Dashboard } from '@/pages/Dashboard'
import { Crews } from '@/pages/Crews'
import { Agents } from '@/pages/Agents'
import { Tasks } from '@/pages/Tasks'
import { Runs } from '@/pages/Runs'
import { Traces } from '@/pages/Traces'
import { Tools } from '@/pages/Tools'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crews" element={<Crews />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/runs" element={<Runs />} />
              <Route path="/traces" element={<Traces />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
