import axios from 'axios'
import type { Agent, Crew, Task, Run, RunStep, Tool, DashboardStats } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'An error occurred'
    return Promise.reject(new Error(msg))
  }
)

// Dashboard
export const fetchStats = () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data)

// Agents
export const fetchAgents = () => api.get<Agent[]>('/agents').then((r) => r.data)
export const fetchAgent = (id: number) => api.get<Agent>(`/agents/${id}`).then((r) => r.data)
export const createAgent = (data: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) =>
  api.post<Agent>('/agents', data).then((r) => r.data)
export const updateAgent = (id: number, data: Partial<Agent>) =>
  api.put<Agent>(`/agents/${id}`, data).then((r) => r.data)
export const deleteAgent = (id: number) => api.delete(`/agents/${id}`)

// Crews
export const fetchCrews = () => api.get<Crew[]>('/crews').then((r) => r.data)
export const fetchCrew = (id: number) => api.get<Crew>(`/crews/${id}`).then((r) => r.data)
export const createCrew = (data: Pick<Crew, 'name' | 'description' | 'process_type'>) =>
  api.post<Crew>('/crews', data).then((r) => r.data)
export const updateCrew = (id: number, data: Partial<Crew>) =>
  api.put<Crew>(`/crews/${id}`, data).then((r) => r.data)
export const deleteCrew = (id: number) => api.delete(`/crews/${id}`)
export const assignCrewAgents = (crewId: number, agentIds: number[]) =>
  api.post<Crew>(`/crews/${crewId}/agents`, { agent_ids: agentIds }).then((r) => r.data)
export const fetchCrewAgents = (crewId: number) =>
  api.get<Agent[]>(`/crews/${crewId}/agents`).then((r) => r.data)

// Tasks
export const fetchTasks = (crewId?: number) =>
  api.get<Task[]>('/tasks', { params: crewId ? { crew_id: crewId } : {} }).then((r) => r.data)
export const createTask = (data: Omit<Task, 'id' | 'created_at' | 'agent_name' | 'crew_name'>) =>
  api.post<Task>('/tasks', data).then((r) => r.data)
export const updateTask = (id: number, data: Partial<Task>) =>
  api.put<Task>(`/tasks/${id}`, data).then((r) => r.data)
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`)

// Runs
export const fetchRuns = (skip = 0, limit = 50) =>
  api.get<Run[]>('/runs', { params: { skip, limit } }).then((r) => r.data)
export const fetchRun = (id: number) => api.get<Run>(`/runs/${id}`).then((r) => r.data)
export const startRun = (crewId: number, inputs: Record<string, string>) =>
  api.post<Run>('/runs', { crew_id: crewId, inputs }).then((r) => r.data)
export const fetchRunSteps = (runId: number) =>
  api.get<RunStep[]>(`/runs/${runId}/steps`).then((r) => r.data)
export const fetchRunResult = (runId: number) =>
  api.get(`/runs/${runId}/result`).then((r) => r.data)

// Tools
export const fetchTools = () => api.get<Tool[]>('/tools').then((r) => r.data)
export const createTool = (data: Omit<Tool, 'id' | 'created_at'>) =>
  api.post<Tool>('/tools', data).then((r) => r.data)
export const updateTool = (id: number, data: Partial<Tool>) =>
  api.put<Tool>(`/tools/${id}`, data).then((r) => r.data)
export const deleteTool = (id: number) => api.delete(`/tools/${id}`)

export default api
