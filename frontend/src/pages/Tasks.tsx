import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, CheckSquare, Pencil, Trash2, Loader2, FileOutput } from 'lucide-react'
import { fetchTasks, fetchAgents, fetchCrews, createTask, updateTask, deleteTask } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import type { Task } from '@/types'

const schema = z.object({
  description: z.string().min(1, 'Description required'),
  expected_output: z.string().min(1, 'Expected output required'),
  agent_id: z.number().nullable().optional(),
  crew_id: z.number().nullable().optional(),
  output_file: z.string().optional(),
  human_input: z.boolean(),
  order_index: z.number().int(),
  context_task_ids: z.array(z.number()),
})
type FormData = z.infer<typeof schema>

export default function Tasks() {
  const qc = useQueryClient()
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ['tasks'], queryFn: () => fetchTasks() })
  const { data: agents = [] } = useQuery({ queryKey: ['agents'], queryFn: () => import('@/api/client').then(m => m.fetchAgents()) })
  const { data: crews = [] } = useQuery({ queryKey: ['crews'], queryFn: () => import('@/api/client').then(m => m.fetchCrews()) })

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '', expected_output: '', agent_id: null, crew_id: null,
      output_file: '', human_input: false, order_index: 0, context_task_ids: [],
    },
  })
  const selectedContextIds = watch('context_task_ids')

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        agent_id: data.agent_id ?? null,
        crew_id: data.crew_id ?? null,
        output_file: data.output_file || null,
      }
      return editTask ? updateTask(editTask.id, payload) : createTask(payload as Parameters<typeof createTask>[0])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(editTask ? 'Task updated' : 'Task created')
      setShowForm(false); setEditTask(null); reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditTask(null)
    reset({ description: '', expected_output: '', agent_id: null, crew_id: null, output_file: '', human_input: false, order_index: tasks.length, context_task_ids: [] })
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    reset({
      description: task.description, expected_output: task.expected_output,
      agent_id: task.agent_id, crew_id: task.crew_id, output_file: task.output_file ?? '',
      human_input: task.human_input, order_index: task.order_index,
      context_task_ids: task.context_task_ids,
    })
    setShowForm(true)
  }

  const toggleContext = (id: number) => {
    const curr = selectedContextIds
    setValue('context_task_ids', curr.includes(id) ? curr.filter((i) => i !== id) : [...curr, id])
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-sm text-gray-400 mt-1">{tasks.length} tasks defined</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, idx) => (
            <div key={task.id} className="card hover:border-accent/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-mono text-emerald-400">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-2">{task.description}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">→ {task.expected_output}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {task.agent_name && (
                        <Badge variant="secondary" className="text-xs">{task.agent_name}</Badge>
                      )}
                      {task.crew_name && (
                        <Badge variant="secondary" className="text-xs">{task.crew_name}</Badge>
                      )}
                      {task.human_input && (
                        <Badge variant="secondary" className="text-xs">Human Input</Badge>
                      )}
                      {task.output_file && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FileOutput className="w-3 h-3" />
                          <span>{task.output_file}</span>
                        </div>
                      )}
                      {task.context_task_ids.length > 0 && (
                        <span className="text-xs text-gray-500">deps: {task.context_task_ids.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-red-400"
                    onClick={() => setDeleteTarget(task)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              No tasks yet. Create tasks and assign them to agents.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditTask(null); reset() } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
            <DialogDescription>Define what this task should do and what it should produce.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...register('description')} rows={3} placeholder="Describe what the agent should do..." />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Expected Output</Label>
              <Textarea {...register('expected_output')} rows={2} placeholder="Describe the expected result..." />
              {errors.expected_output && <p className="text-xs text-red-400">{errors.expected_output.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assign to Agent</Label>
                <Controller
                  name="agent_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v))}
                    >
                      <SelectTrigger><SelectValue placeholder="No agent" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No agent</SelectItem>
                        {agents.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>{a.name} — {a.role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Crew</Label>
                <Controller
                  name="crew_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.toString() ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? null : parseInt(v))}
                    >
                      <SelectTrigger><SelectValue placeholder="No crew" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No crew</SelectItem>
                        {crews.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Output File (optional)</Label>
                <Input {...register('output_file')} placeholder="e.g. report.md" />
              </div>
              <div className="space-y-1.5">
                <Label>Order Index</Label>
                <Input type="number" {...register('order_index', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Context Tasks (dependencies)</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-[#1a1d2e] rounded-lg border border-border max-h-32 overflow-y-auto">
                {tasks
                  .filter((t) => !editTask || t.id !== editTask.id)
                  .map((t) => {
                    const selected = selectedContextIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleContext(t.id)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-colors text-left ${
                          selected
                            ? 'bg-accent/20 border-accent/40 text-accent'
                            : 'bg-white/5 border-border text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        #{t.id}: {t.description.slice(0, 40)}…
                      </button>
                    )
                  })}
                {tasks.length === 0 && <p className="text-xs text-gray-500">No other tasks available</p>}
              </div>
            </div>

            <Controller
              name="human_input"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                  <span className="text-sm text-gray-300">Requires Human Input</span>
                </label>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editTask ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>Delete this task? This cannot be undone.</DialogDescription>
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
