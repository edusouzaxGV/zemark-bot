import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, agentsApi, crewsApi, type Task } from '@/api/client'
import { Plus, Pencil, Trash2, X, ListTodo } from 'lucide-react'
import { useForm } from 'react-hook-form'

function TaskModal({ task, onClose }: { task?: Task; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: () => agentsApi.list() })
  const { data: crews = [] } = useQuery({ queryKey: ['crews'], queryFn: () => crewsApi.list() })
  const { register, handleSubmit } = useForm({
    defaultValues: task ?? {
      description: '', expected_output: '', agent_id: null, crew_id: null,
      context_task_ids: [], output_file: null, human_input: false, order: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) => task ? tasksApi.update(task.id, data) : tasksApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, agent_id: d.agent_id ? Number(d.agent_id) : null, crew_id: d.crew_id ? Number(d.crew_id) : null }))} className="p-5 space-y-4">
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Description</span>
            <textarea {...register('description', { required: true })} rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-muted-foreground">Expected Output</span>
            <textarea {...register('expected_output', { required: true })} rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Assigned Agent</span>
              <select {...register('agent_id')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="">None</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Crew</span>
              <select {...register('crew_id')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="">None</option>
                {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Output File (optional)</span>
              <input {...register('output_file')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" placeholder="output.txt" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Order</span>
              <input type="number" {...register('order', { valueAsNumber: true })} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('human_input')} className="rounded" />
            Requires Human Input
          </label>
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

export function Tasks() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'new' | Task | null>(null)
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list() })

  const deleteMut = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks.length} tasks defined</p>
        </div>
        <button onClick={() => setModal('new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {tasks.length === 0 ? (
            <p className="p-5 text-muted-foreground text-sm">No tasks yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="px-5 py-3 text-left font-medium">#</th>
                  <th className="px-5 py-3 text-left font-medium">Description</th>
                  <th className="px-5 py-3 text-left font-medium">Agent</th>
                  <th className="px-5 py-3 text-left font-medium">Expected Output</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors group">
                    <td className="px-5 py-3 text-muted-foreground">{task.order}</td>
                    <td className="px-5 py-3 max-w-xs">
                      <div className="flex items-center gap-2">
                        <ListTodo className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="truncate">{task.description}</p>
                      </div>
                      {task.human_input && <span className="text-xs text-yellow-500">⚠ Human input required</span>}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{task.agent?.name ?? '—'}</td>
                    <td className="px-5 py-3 max-w-xs text-muted-foreground text-xs truncate">{task.expected_output}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(task)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMut.mutate(task.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal && <TaskModal task={modal !== 'new' ? modal : undefined} onClose={() => setModal(null)} />}
    </div>
  )
}
