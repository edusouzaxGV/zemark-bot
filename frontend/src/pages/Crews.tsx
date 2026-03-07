import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Users, Pencil, Trash2, Loader2, GitBranch, CheckSquare } from 'lucide-react'
import { fetchCrews, fetchAgents, createCrew, updateCrew, deleteCrew, assignCrewAgents } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import type { Crew, Agent } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  process_type: z.enum(['sequential', 'hierarchical', 'parallel']),
  agent_ids: z.array(z.number()),
})
type FormData = z.infer<typeof schema>

export default function Crews() {
  const qc = useQueryClient()
  const [editCrew, setEditCrew] = useState<Crew | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Crew | null>(null)

  const { data: crews = [], isLoading } = useQuery({ queryKey: ['crews'], queryFn: fetchCrews })
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: fetchAgents })

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', process_type: 'sequential', agent_ids: [] },
  })
  const selectedAgentIds = watch('agent_ids')

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const crewData = { name: data.name, description: data.description ?? null, process_type: data.process_type }
      const crew = editCrew
        ? await updateCrew(editCrew.id, crewData)
        : await createCrew(crewData)
      if (data.agent_ids.length > 0) {
        await assignCrewAgents(crew.id, data.agent_ids)
      }
      return crew
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crews'] })
      toast.success(editCrew ? 'Crew updated' : 'Crew created')
      setShowForm(false); setEditCrew(null); reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCrew(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crews'] })
      toast.success('Crew deleted')
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditCrew(null)
    reset({ name: '', description: '', process_type: 'sequential', agent_ids: [] })
    setShowForm(true)
  }

  const openEdit = (crew: Crew) => {
    setEditCrew(crew)
    reset({ name: crew.name, description: crew.description ?? '', process_type: crew.process_type, agent_ids: [] })
    setShowForm(true)
  }

  const toggleAgent = (id: number) => {
    const curr = selectedAgentIds
    setValue('agent_ids', curr.includes(id) ? curr.filter((i) => i !== id) : [...curr, id])
  }

  const processColors: Record<string, string> = {
    sequential: 'sequential', hierarchical: 'hierarchical', parallel: 'parallel',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Crews</h1>
          <p className="text-sm text-gray-400 mt-1">{crews.length} crews configured</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Crew
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crews.map((crew) => (
            <div key={crew.id} className="card hover:border-accent/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{crew.name}</h3>
                    <Badge variant={processColors[crew.process_type] as 'sequential'} className="mt-1">
                      {crew.process_type}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(crew)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-400"
                    onClick={() => setDeleteTarget(crew)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {crew.description && (
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{crew.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  <span>{crew.agent_count} agents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3 h-3" />
                  <span>{crew.task_count} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  <span>{crew.process_type}</span>
                </div>
              </div>
            </div>
          ))}
          {crews.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              No crews yet. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditCrew(null); reset() } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editCrew ? 'Edit Crew' : 'Create Crew'}</DialogTitle>
            <DialogDescription>Configure the crew's name, process type, and assign agents.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Name</Label>
              <Input id="cname" {...register('name')} placeholder="e.g. Research Crew" />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea id="cdesc" {...register('description')} rows={2} placeholder="What this crew does..." />
            </div>

            <div className="space-y-1.5">
              <Label>Process Type</Label>
              <Controller
                name="process_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential — agents run one after another</SelectItem>
                      <SelectItem value="hierarchical">Hierarchical — manager delegates to agents</SelectItem>
                      <SelectItem value="parallel">Parallel — agents run simultaneously</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign Agents</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-[#1a1d2e] rounded-lg border border-border">
                {agents.map((agent) => {
                  const selected = selectedAgentIds.includes(agent.id)
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => toggleAgent(agent.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                        selected
                          ? 'bg-accent/15 border-accent/30 text-white'
                          : 'bg-white/3 border-border text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${selected ? 'bg-accent' : 'bg-gray-600'}`} />
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium truncate">{agent.name}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.role}</p>
                      </div>
                    </button>
                  )
                })}
                {agents.length === 0 && (
                  <p className="col-span-2 text-xs text-gray-500 text-center py-2">No agents available. Create agents first.</p>
                )}
              </div>
              {selectedAgentIds.length > 0 && (
                <p className="text-xs text-gray-500">{selectedAgentIds.length} agent(s) selected</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editCrew ? 'Save Changes' : 'Create Crew'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Crew</DialogTitle>
            <DialogDescription>
              Delete <strong className="text-white">{deleteTarget?.name}</strong>? This cannot be undone.
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
