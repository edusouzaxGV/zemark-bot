import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crewsApi, agentsApi, type Crew } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { Plus, Pencil, Trash2, X, Network, Play } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

function CrewModal({ crew, onClose }: { crew?: Crew; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() })
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      name: crew?.name ?? '',
      description: crew?.description ?? '',
      process_type: crew?.process_type ?? 'sequential',
      workspace: crew?.workspace ?? 'default',
      agent_ids: crew?.agents.map(a => a.id) ?? [],
    },
  })
  const selectedIds = watch('agent_ids') as number[]

  const mutation = useMutation({
    mutationFn: (data: any) => crew ? crewsApi.update(crew.id, data) : crewsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crews'] }); onClose() },
  })

  const toggleAgent = (id: number) => {
    const curr = selectedIds || []
    setValue('agent_ids', curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id])
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{crew ? 'Edit Crew' : 'New Crew'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-5 space-y-4">
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Name</span>
            <input {...register('name', { required: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea {...register('description')} rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Process Type</span>
              <select {...register('process_type')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="sequential">Sequential</option>
                <option value="hierarchical">Hierarchical</option>
                <option value="parallel">Parallel</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Workspace</span>
              <input {...register('workspace')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Agents ({selectedIds?.length ?? 0} selected)</span>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {agents.map(a => (
                <label key={a.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${selectedIds?.includes(a.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-accent border border-transparent'}`}>
                  <input type="checkbox" checked={selectedIds?.includes(a.id) ?? false} onChange={() => toggleAgent(a.id)} className="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.workspace}</span>
                </label>
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

export function Crews() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Crew | null>(null)
  const { data: crews = [], isLoading } = useQuery({ queryKey: ['crews'], queryFn: () => crewsApi.list() })

  const deleteMut = useMutation({
    mutationFn: crewsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crews'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crews</h1>
          <p className="text-muted-foreground text-sm mt-1">{crews.length} crews configured</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Crew
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : crews.length === 0 ? (
        <p className="text-muted-foreground">No crews yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-4">
          {crews.map(crew => (
            <div key={crew.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{crew.name}</h3>
                      <StatusBadge status={crew.process_type} />
                      <span className="text-xs text-muted-foreground">{crew.workspace}</span>
                    </div>
                    {crew.description && <p className="text-xs text-muted-foreground mt-1">{crew.description}</p>}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {crew.agents.map(a => (
                        <span key={a.id} className="text-xs bg-accent px-2 py-0.5 rounded-full text-muted-foreground">{a.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => navigate(`/runs?crew=${crew.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 transition-colors">
                    <Play className="w-3 h-3" /> Run
                  </button>
                  <button onClick={() => setModal(crew)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMut.mutate(crew.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <CrewModal crew={modal !== 'new' ? modal : undefined} onClose={() => setModal(null)} />}
    </div>
  )
}
