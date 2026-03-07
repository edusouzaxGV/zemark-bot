import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Search, Loader2 } from 'lucide-react'
import { fetchAgents, fetchTools, createAgent, updateAgent, deleteAgent } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import AgentCard from '@/components/AgentCard'
import type { Agent } from '@/types'

const LLM_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-opus-4', label: 'Claude Opus 4' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
  { value: 'llama3', label: 'Llama 3 (Ollama)' },
]

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  role: z.string().min(1, 'Role required'),
  goal: z.string().min(1, 'Goal required'),
  backstory: z.string().min(1, 'Backstory required'),
  llm_model: z.string(),
  allow_delegation: z.boolean(),
  verbose: z.boolean(),
  max_iter: z.number().int().min(1).max(100),
  max_rpm: z.number().int().min(1).nullable().optional(),
  tools: z.array(z.string()),
})
type FormData = z.infer<typeof schema>

export default function Agents() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null)

  const { data: agents = [], isLoading } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })
  const { data: tools = [] } = useQuery({ queryKey: ['tools'], queryFn: fetchTools })

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', role: '', goal: '', backstory: '',
      llm_model: 'gpt-4o', allow_delegation: false, verbose: true,
      max_iter: 25, max_rpm: null, tools: [],
    },
  })
  const selectedTools = watch('tools')

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editAgent ? updateAgent(editAgent.id, data) : createAgent(data as Parameters<typeof createAgent>[0]),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      toast.success(editAgent ? 'Agent updated' : 'Agent created')
      setShowForm(false)
      setEditAgent(null)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAgent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted')
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditAgent(null)
    reset({
      name: '', role: '', goal: '', backstory: '',
      llm_model: 'gpt-4o', allow_delegation: false, verbose: true,
      max_iter: 25, max_rpm: null, tools: [],
    })
    setShowForm(true)
  }

  const openEdit = (agent: Agent) => {
    setEditAgent(agent)
    reset({
      name: agent.name, role: agent.role, goal: agent.goal, backstory: agent.backstory,
      llm_model: agent.llm_model, allow_delegation: agent.allow_delegation,
      verbose: agent.verbose, max_iter: agent.max_iter,
      max_rpm: agent.max_rpm ?? null, tools: agent.tools,
    })
    setShowForm(true)
  }

  const toggleTool = (name: string) => {
    const current = selectedTools
    setValue('tools', current.includes(name) ? current.filter((t) => t !== name) : [...current, name])
  }

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-gray-400 mt-1">{agents.length} agents configured</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Agent
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              {search ? 'No agents match your search.' : 'No agents yet. Create one to get started.'}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditAgent(null); reset() } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editAgent ? 'Edit Agent' : 'Create Agent'}</DialogTitle>
            <DialogDescription>Configure this agent's role, capabilities, and LLM model.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g. ANALYST" />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Input id="role" {...register('role')} placeholder="e.g. Data Analyst" />
                {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal">Goal</Label>
              <Textarea id="goal" {...register('goal')} rows={2} placeholder="What this agent strives to achieve..." />
              {errors.goal && <p className="text-xs text-red-400">{errors.goal.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="backstory">Backstory</Label>
              <Textarea id="backstory" {...register('backstory')} rows={3} placeholder="Background and expertise of this agent..." />
              {errors.backstory && <p className="text-xs text-red-400">{errors.backstory.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>LLM Model</Label>
                <Controller
                  name="llm_model"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LLM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_iter">Max Iterations</Label>
                <Input id="max_iter" type="number" {...register('max_iter', { valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max_rpm">Max RPM</Label>
                <Input id="max_rpm" type="number" placeholder="unlimited" {...register('max_rpm', { valueAsNumber: true, setValueAs: v => v === '' ? null : Number(v) })} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Controller
                name="allow_delegation"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-gray-300">Allow Delegation</span>
                  </label>
                )}
              />
              <Controller
                name="verbose"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                    <span className="text-sm text-gray-300">Verbose</span>
                  </label>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 bg-[#1a1d2e] rounded-lg border border-border">
                {tools.map((tool) => {
                  const selected = selectedTools.includes(tool.name)
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleTool(tool.name)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        selected
                          ? 'bg-accent/20 border-accent/40 text-accent'
                          : 'bg-white/5 border-border text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {tool.name.replace('Tool', '')}
                    </button>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editAgent ? 'Save Changes' : 'Create Agent'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong className="text-white">{deleteTarget?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
