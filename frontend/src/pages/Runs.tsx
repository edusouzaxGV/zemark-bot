import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { runsApi, crewsApi, type Run } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { RunTerminal } from '@/components/RunTerminal'
import { formatDate, duration } from '@/lib/utils'
import { Play, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

function ExecuteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const defaultCrew = params.get('crew') ? Number(params.get('crew')) : undefined
  const { data: crews = [] } = useQuery({ queryKey: ['crews'], queryFn: () => crewsApi.list() })
  const [crewId, setCrewId] = useState<number>(defaultCrew ?? 0)
  const [inputs, setInputs] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }])
  const [runId, setRunId] = useState<number | null>(null)

  const executeMut = useMutation({
    mutationFn: () => {
      const inp = Object.fromEntries(inputs.filter(i => i.key).map(i => [i.key, i.value]))
      return runsApi.execute(crewId, inp)
    },
    onSuccess: (run) => {
      setRunId(run.id)
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const addInput = () => setInputs(p => [...p, { key: '', value: '' }])
  const setInput = (i: number, field: 'key' | 'value', val: string) =>
    setInputs(p => p.map((x, j) => j === i ? { ...x, [field]: val } : x))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold">Execute Crew</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-4">
          {!runId ? (
            <>
              <label className="space-y-1 block">
                <span className="text-xs text-muted-foreground">Select Crew</span>
                <select value={crewId} onChange={e => setCrewId(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  <option value={0}>— Choose crew —</option>
                  {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Inputs (key-value pairs)</span>
                  <button onClick={addInput} className="text-xs text-primary hover:underline">+ Add</button>
                </div>
                {inputs.map((inp, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={inp.key} onChange={e => setInput(i, 'key', e.target.value)}
                      placeholder="key" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
                    <input value={inp.value} onChange={e => setInput(i, 'value', e.target.value)}
                      placeholder="value" className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors">Cancel</button>
                <button onClick={() => executeMut.mutate()} disabled={!crewId || executeMut.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
                  <Play className="w-3.5 h-3.5" /> {executeMut.isPending ? 'Launching...' : 'Execute'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Live Execution — Run #{runId}</p>
                <button onClick={onClose} className="text-xs text-primary hover:underline">Close</button>
              </div>
              <RunTerminal runId={runId} onComplete={() => qc.invalidateQueries({ queryKey: ['runs'] })} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RunRow({ run }: { run: Run }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">#{run.id}</td>
        <td className="px-5 py-3">{run.crew?.name ?? `Crew ${run.crew_id}`}</td>
        <td className="px-5 py-3"><StatusBadge status={run.status} /></td>
        <td className="px-5 py-3 text-muted-foreground text-xs">{duration(run.started_at, run.finished_at)}</td>
        <td className="px-5 py-3 text-muted-foreground text-xs">{run.steps.length} steps</td>
        <td className="px-5 py-3 text-muted-foreground text-xs">{formatDate(run.created_at)}</td>
        <td className="px-5 py-3 text-right text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-5 py-4 bg-black/20">
            {run.result ? (
              <div className="text-sm prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{run.result}</ReactMarkdown>
              </div>
            ) : run.error ? (
              <p className="text-red-400 text-xs font-mono">{run.error}</p>
            ) : (
              <RunTerminal runId={run.id} />
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function Runs() {
  const [params] = useSearchParams()
  const [showExecute, setShowExecute] = useState(!!params.get('crew'))
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => runsApi.list(),
    refetchInterval: 3000,
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Runs</h1>
          <p className="text-muted-foreground text-sm mt-1">{runs.length} total runs</p>
        </div>
        <button onClick={() => setShowExecute(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-500 transition-colors">
          <Play className="w-4 h-4" /> Execute Crew
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <p className="p-5 text-muted-foreground">Loading...</p>
        ) : runs.length === 0 ? (
          <p className="p-5 text-muted-foreground text-sm">No runs yet. Execute a crew to see results here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="px-5 py-3 text-left font-medium">ID</th>
                <th className="px-5 py-3 text-left font-medium">Crew</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Duration</th>
                <th className="px-5 py-3 text-left font-medium">Steps</th>
                <th className="px-5 py-3 text-left font-medium">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map(run => <RunRow key={run.id} run={run} />)}
            </tbody>
          </table>
        )}
      </div>

      {showExecute && <ExecuteModal onClose={() => setShowExecute(false)} />}
    </div>
  )
}
