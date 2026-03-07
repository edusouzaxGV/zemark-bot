import { Bot, Pencil, Trash2, ToggleRight, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Agent } from '@/types'

const LLM_LABELS: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-3.5-turbo': 'GPT-3.5',
  'claude-sonnet-4-5': 'Claude Sonnet',
  'claude-opus-4': 'Claude Opus',
  'claude-haiku-4-5': 'Claude Haiku',
  'gemini-pro': 'Gemini Pro',
  'llama3': 'Llama 3',
}

interface AgentCardProps {
  agent: Agent
  onEdit: (agent: Agent) => void
  onDelete: (agent: Agent) => void
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <div className="card flex flex-col gap-4 hover:border-accent/30 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{agent.role}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(agent)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:text-red-400"
            onClick={() => onDelete(agent)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Goal */}
      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{agent.goal}</p>

      {/* Tools */}
      {agent.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {agent.tools.slice(0, 4).map((tool) => (
            <span
              key={tool}
              className="text-xs px-2 py-0.5 bg-white/5 border border-border rounded-md text-gray-400"
            >
              {tool.replace('Tool', '')}
            </span>
          ))}
          {agent.tools.length > 4 && (
            <span className="text-xs px-2 py-0.5 bg-white/5 border border-border rounded-md text-gray-500">
              +{agent.tools.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Cpu className="w-3 h-3" />
          <span>{LLM_LABELS[agent.llm_model] ?? agent.llm_model}</span>
        </div>
        <div className="flex items-center gap-2">
          {agent.allow_delegation && (
            <div className="flex items-center gap-1 text-xs text-indigo-400">
              <ToggleRight className="w-3 h-3" />
              <span>Delegates</span>
            </div>
          )}
          <span className="text-xs text-gray-600">iter:{agent.max_iter}</span>
        </div>
      </div>
    </div>
  )
}
