import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi, type Tool } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { Plus, Pencil, Trash2, X, Wrench } from 'lucide-react'
import { useForm } from 'react-hook-form'

function ToolModal({ tool, onClose }: { tool?: Tool; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch } = useForm({
    defaultValues: tool ?? { name: '', description: '', tool_type: 'builtin', python_code: '' },
  })
  const toolType = watch('tool_type')

  const mutation = useMutation({
    mutationFn: (data: any) => tool ? toolsApi.update(tool.id, data) : toolsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tools'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{tool ? 'Edit Tool' : 'New Tool'}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Name</span>
              <input {...register('name', { required: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Type</span>
              <select {...register('tool_type')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="builtin">Builtin</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea {...register('description', { required: true })} rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          {toolType === 'custom' && (
            <label className="space-y-1 block">
              <span className="text-xs text-muted-foreground">Python Code</span>
              <textarea {...register('python_code')} rows={8}
                className="w-full bg-black/40 border border-border rounded-md px-3 py-2 text-sm font-mono"
                placeholder="def run(self, **kwargs):\n    # Your tool logic here\n    return 'result'" />
            </label>
          )}
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

export function Tools() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Tool | null>(null)
  const { data: tools = [], isLoading } = useQuery({ queryKey: ['tools'], queryFn: toolsApi.list })

  const deleteMut = useMutation({
    mutationFn: toolsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tools'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tools Registry</h1>
          <p className="text-muted-foreground text-sm mt-1">{tools.length} tools available</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Tool
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <div key={tool.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tool.name}</p>
                    <StatusBadge status={tool.tool_type} />
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(tool)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMut.mutate(tool.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
              {tool.python_code && (
                <div className="mt-2 bg-black/40 rounded p-2">
                  <code className="text-xs text-green-400 font-mono line-clamp-2">{tool.python_code}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && <ToolModal tool={modal !== 'new' ? modal : undefined} onClose={() => setModal(null)} />}
    </div>
  )
}
