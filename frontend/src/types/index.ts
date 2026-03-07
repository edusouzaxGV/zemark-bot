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
  created_at: string
  updated_at: string
}

export interface Crew {
  id: number
  name: string
  description: string | null
  process_type: 'sequential' | 'hierarchical' | 'parallel'
  created_at: string
  updated_at: string
  agent_count: number
  task_count: number
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
  order_index: number
  created_at: string
  agent_name: string | null
  crew_name: string | null
}

export interface Run {
  id: number
  crew_id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  inputs: Record<string, string>
  result: string | null
  error: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  token_usage: Record<string, number>
  crew_name: string | null
}

export interface RunStep {
  id: number
  run_id: number
  agent_name: string | null
  step_type: 'thought' | 'tool_call' | 'result' | 'error' | 'status'
  content: string
  tool_name: string | null
  tool_input: string | null
  tool_output: string | null
  timestamp: string
  duration_ms: number | null
}

export interface Tool {
  id: number
  name: string
  description: string | null
  is_custom: boolean
  python_code: string | null
  created_at: string
}

export interface DashboardStats {
  total_crews: number
  total_agents: number
  total_tasks: number
  total_runs: number
  active_runs: number
  completed_runs: number
  failed_runs: number
  success_rate: number
  recent_runs: Run[]
}

// WebSocket message types
export type WsMessage =
  | { type: 'step'; data: Omit<RunStep, 'run_id'> & { agent: string } }
  | { type: 'status'; data: { status: string } }
  | { type: 'complete'; data: { result: string; token_usage: Record<string, number> } }
  | { type: 'error'; data: { error: string } }
