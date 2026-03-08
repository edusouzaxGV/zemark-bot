import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi, toolsApi, type Agent } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { Plus, Pencil, Trash2, X, Bot } from 'lucide-react'
import { useForm } from 'react-hook-form'

const LLM_OPTIONS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5', 'gpt-4o', 'gpt-4o-mini', 'gemini-pro', 'llama3']
const WORKSPACES = ['ZEMARK', 'CASSIO', 'DUDU', 'default']

function AgentModal({ agent, onClose }: { agent?: Agent; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: tools = [] } = useQuery({ queryKey: ['tools'], queryFn: toolsApi.list })
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: agent ?? {
      name: '', role: '', goal: '', backstory: '', llm_model: 'claude-sonnet-4-6',
      allow_delegation: false, verbose: true, max_iter: 25, max_rpm: null,
      tools: [], workspace: 'default',
    },
  })
  const selectedTools = watch('tools') as string[]

  const mutation = useMutation({
    mutationFn: (data: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) =>
      agent ? agentsApi.update(agent.id, data) : agentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agents'] }); onClose() },
  })

  const toggleTool = (name: string) => {
    const curr = selectedTools || []
    setValue('tools', curr.includes(name) ? curr.filter(t => t !== name) : [...curr, name])
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{agent ? 'Edit Agent' : 'New Agent'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d as any))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Name</span>
              <input {...register('name', { required: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Workspace</span>
              <select {...register('workspace')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {WORKSPACES.map(w => <option key={w}>{w}</option>)}
              </select>
            </label>
          </div>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Role</span>
            <input {...register('role', { required: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Goal</span>
            <textarea {...register('goal', { required: true })} rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Backstory</span>
            <textarea {...register('backstory', { required: true })} rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">LLM Model</span>
              <select {...register('llm_model')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                {LLM_OPTIONS.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Max Iterations</span>
              <input type="number" {...register('max_iter', { valueAsNumber: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('allow_delegation')} className="rounded" />
              Allow Delegation
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('verbose')} className="rounded" />
              Verbose
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Tools</span>
            <div className="flex flex-wrap gap-2">
              {tools.map(t => (
                <button key={t.name} type="button" onClick={() => toggleTool(t.name)}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${selectedTools?.includes(t.name) ? 'bg-primary/20 text-primary border-primary/40' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-sm rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Agents() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Agent | null>(null)
  const { data: agents = [], isLoading } = useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() })

  const deleteMut = useMutation({
    mutationFn: agentsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agents'] }),
  })

  const byWorkspace = agents.reduce<Record<string, Agent[]>>((acc, a) => {
    ;(acc[a.workspace] ??= []).push(a)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agents</h1>
          <p className="text-muted-foreground text-sm mt-1">{agents.length} agents across {Object.keys(byWorkspace).length} workspaces</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Agent
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        Object.entries(byWorkspace).map(([workspace, agts]) => (
          <div key={workspace}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{workspace}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agts.map(agent => (
                <div key={agent.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(agent)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteMut.mutate(agent.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.goal}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">{agent.llm_model}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {agent.tools.slice(0, 2).map(t => (
                        <span key={t} className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">{t.replace('Tool', '')}</span>
                      ))}
                      {agent.tools.length > 2 && <span className="text-xs text-muted-foreground">+{agent.tools.length - 2}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {modal && (
        <AgentModal
          agent={modal !== 'new' ? modal : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
