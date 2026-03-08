import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default api

// --- Types ---
export interface Agent {
  id: number
  name: string
  role: string
  goal: string
  backstory: string
  llm_model: string
  allow_delegation: boolean
  verbose: boolean
  max_iter: number
  max_rpm: number | null
  tools: string[]
  workspace: string
  created_at: string
  updated_at: string
}

export interface Crew {
  id: number
  name: string
  description: string | null
  process_type: string
  workspace: string
  created_at: string
  updated_at: string
  agents: Agent[]
}

export interface Task {
  id: number
  description: string
  expected_output: string
  agent_id: number | null
  crew_id: number | null
  context_task_ids: number[]
  output_file: string | null
  human_input: boolean
  order: number
  created_at: string
  agent: Agent | null
}

export interface RunStep {
  id: number
  agent_name: string | null
  step_type: string
  content: string
  tool_name: string | null
  tool_input: string | null
  timestamp: string
}

export interface Run {
  id: number
  crew_id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  inputs: Record<string, unknown>
  result: string | null
  error: string | null
  token_usage: Record<string, unknown> | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  crew: Crew | null
  steps: RunStep[]
}

export interface Tool {
  id: number
  name: string
  description: string
  tool_type: string
  python_code: string | null
  created_at: string
}

export interface DashboardStats {
  total_crews: number
  total_agents: number
  total_runs: number
  active_runs: number
  success_rate: number
  recent_runs: Run[]
}

// --- API functions ---
export const agentsApi = {
  list: (workspace?: string) => api.get<Agent[]>('/agents', { params: workspace ? { workspace } : {} }).then(r => r.data),
  get: (id: number) => api.get<Agent>(`/agents/${id}`).then(r => r.data),
  create: (data: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) => api.post<Agent>('/agents', data).then(r => r.data),
  update: (id: number, data: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) => api.put<Agent>(`/agents/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/agents/${id}`),
}

export const crewsApi = {
  list: (workspace?: string) => api.get<Crew[]>('/crews', { params: workspace ? { workspace } : {} }).then(r => r.data),
  get: (id: number) => api.get<Crew>(`/crews/${id}`).then(r => r.data),
  create: (data: Omit<Crew, 'id' | 'created_at' | 'updated_at' | 'agents'> & { agent_ids: number[] }) => api.post<Crew>('/crews', data).then(r => r.data),
  update: (id: number, data: Omit<Crew, 'id' | 'created_at' | 'updated_at' | 'agents'> & { agent_ids: number[] }) => api.put<Crew>(`/crews/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/crews/${id}`),
}

export const tasksApi = {
  list: (crew_id?: number) => api.get<Task[]>('/tasks', { params: crew_id ? { crew_id } : {} }).then(r => r.data),
  get: (id: number) => api.get<Task>(`/tasks/${id}`).then(r => r.data),
  create: (data: Omit<Task, 'id' | 'created_at' | 'agent'>) => api.post<Task>('/tasks', data).then(r => r.data),
  update: (id: number, data: Omit<Task, 'id' | 'created_at' | 'agent'>) => api.put<Task>(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
}

export const runsApi = {
  list: (crew_id?: number) => api.get<Run[]>('/runs', { params: crew_id ? { crew_id } : {} }).then(r => r.data),
  get: (id: number) => api.get<Run>(`/runs/${id}`).then(r => r.data),
  execute: (crew_id: number, inputs: Record<string, string>) => api.post<Run>('/runs/execute', { crew_id, inputs }).then(r => r.data),
}

export const toolsApi = {
  list: () => api.get<Tool[]>('/tools').then(r => r.data),
  create: (data: Omit<Tool, 'id' | 'created_at'>) => api.post<Tool>('/tools', data).then(r => r.data),
  update: (id: number, data: Omit<Tool, 'id' | 'created_at'>) => api.put<Tool>(`/tools/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/tools/${id}`),
}

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then(r => r.data),
}
