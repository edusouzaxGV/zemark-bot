import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Wrench, Trash2, Pencil, Loader2, Code2 } from 'lucide-react'
import { fetchTools, createTool, updateTool, deleteTool } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import type { Tool } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  python_code: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function Tools() {
  const qc = useQueryClient()
  const [editTool, setEditTool] = useState<Tool | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null)
  const [monacoCode, setMonacoCode] = useState('')

  const { data: tools = [], isLoading } = useQuery({ queryKey: ['tools'], queryFn: fetchTools })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', python_code: '' },
  })

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = { ...data, is_custom: true, python_code: monacoCode || data.python_code || null }
      return editTool
        ? updateTool(editTool.id, payload)
        : createTool(payload as Parameters<typeof createTool>[0])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] })
      toast.success(editTool ? 'Tool updated' : 'Tool created')
      setShowForm(false); setEditTool(null); reset(); setMonacoCode('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTool(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool deleted')
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openCreate = () => {
    setEditTool(null)
    reset({ name: '', description: '', python_code: '' })
    setMonacoCode('from crewai.tools import BaseTool\nfrom typing import Optional\n\nclass MyCustomTool(BaseTool):\n    name: str = "My Custom Tool"\n    description: str = "Describe what this tool does"\n\n    def _run(self, argument: str) -> str:\n        # Your implementation here\n        return f"Result: {argument}"\n')
    setShowForm(true)
  }

  const openEdit = (tool: Tool) => {
    setEditTool(tool)
    reset({ name: tool.name, description: tool.description ?? '', python_code: tool.python_code ?? '' })
    setMonacoCode(tool.python_code ?? '')
    setShowForm(true)
  }

  const builtinTools = tools.filter((t) => !t.is_custom)
  const customTools = tools.filter((t) => t.is_custom)

  // Lazy-load Monaco Editor
  const [MonacoEditor, setMonacoEditor] = useState<React.ComponentType<{
    height: string; language: string; value: string; onChange: (v: string | undefined) => void; theme: string;
    options: Record<string, unknown>
  }> | null>(null)

  const loadMonaco = async () => {
    if (!MonacoEditor) {
      const m = await import('@monaco-editor/react')
      setMonacoEditor(() => m.default)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tools Registry</h1>
          <p className="text-sm text-gray-400 mt-1">{tools.length} tools available</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Custom Tool
        </Button>
      </div>

      {/* Custom Tools */}
      {customTools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent" /> Custom Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTools.map((tool) => (
              <div key={tool.id} className="card hover:border-accent/30 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tool.name}</p>
                      <Badge variant="default" className="mt-0.5 text-xs">Custom</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tool)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-red-400"
                      onClick={() => setDeleteTarget(tool)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {tool.description && <p className="text-xs text-gray-400">{tool.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Built-in Tools */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-400" /> Built-in Tools
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {builtinTools.map((tool) => (
              <div key={tool.id} className="card hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-white truncate">{tool.name.replace('Tool', '')}</p>
                </div>
                {tool.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{tool.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (open) loadMonaco()
          if (!open) { setEditTool(null); reset(); setMonacoCode('') }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editTool ? 'Edit Custom Tool' : 'Create Custom Tool'}</DialogTitle>
            <DialogDescription>Define a custom CrewAI tool with Python code.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tool Name</Label>
                <Input {...register('name')} placeholder="e.g. MyCustomTool" />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input {...register('description')} placeholder="What this tool does..." />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Python Code</Label>
              <div className="rounded-lg overflow-hidden border border-border">
                {MonacoEditor ? (
                  <MonacoEditor
                    height="300px"
                    language="python"
                    value={monacoCode}
                    onChange={(v) => setMonacoCode(v ?? '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      tabSize: 4,
                      insertSpaces: true,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                    }}
                  />
                ) : (
                  <Textarea
                    value={monacoCode}
                    onChange={(e) => setMonacoCode(e.target.value)}
                    rows={12}
                    className="font-mono text-xs rounded-none"
                    placeholder="from crewai.tools import BaseTool..."
                  />
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editTool ? 'Save Changes' : 'Create Tool'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tool</DialogTitle>
            <DialogDescription>Delete <strong className="text-white">{deleteTarget?.name}</strong>? This cannot be undone.</DialogDescription>
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
