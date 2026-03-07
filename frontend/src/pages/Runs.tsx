import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { Play, Plus, Minus, Loader2, ChevronUp, ChevronDown, Search, ArrowRight } from 'lucide-react'
import { fetchCrews, fetchRuns, startRun } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import RunTerminal from '@/components/RunTerminal'
import { formatDate, formatDuration } from '@/lib/utils'
import type { Run } from '@/types'

interface KVPair { key: string; value: string }

export default function Runs() {
  const qc = useQueryClient()
  const [selectedCrewId, setSelectedCrewId] = useState<string>('')
  const [kvPairs, setKvPairs] = useState<KVPair[]>([{ key: '', value: '' }])
  const [activeRunId, setActiveRunId] = useState<number | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data: crews = [] } = useQuery({ queryKey: ['crews'], queryFn: fetchCrews })
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => fetchRuns(),
    refetchInterval: 5000,
  })

  const executeMutation = useMutation({
    mutationFn: () => {
      const inputs = Object.fromEntries(
        kvPairs.filter((p) => p.key.trim()).map((p) => [p.key.trim(), p.value.trim()])
      )
      return startRun(parseInt(selectedCrewId), inputs)
    },
    onSuccess: (run) => {
      setActiveRunId(run.id)
      qc.invalidateQueries({ queryKey: ['runs'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success(`Run #${run.id} started`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const addKV = () => setKvPairs((prev) => [...prev, { key: '', value: '' }])
  const removeKV = (i: number) => setKvPairs((prev) => prev.filter((_, idx) => idx !== i))
  const updateKV = (i: number, field: 'key' | 'value', val: string) =>
    setKvPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)))

  const columns: ColumnDef<Run>[] = [
    { accessorKey: 'id', header: '#', size: 60 },
    {
      accessorKey: 'crew_name',
      header: 'Crew',
      cell: ({ row }) => row.original.crew_name ?? `Crew #${row.original.crew_id}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<string>()
        const v: Record<string, 'running' | 'completed' | 'failed' | 'pending'> = {
          running: 'running', completed: 'completed', failed: 'failed', pending: 'pending',
        }
        return (
          <Badge variant={v[s] ?? 'pending'}>
            {s === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
            {s}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Started',
      cell: ({ getValue }) => <span className="text-xs text-gray-400">{formatDate(getValue<string>())}</span>,
    },
    {
      id: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-xs text-gray-400">
          {formatDuration(row.original.started_at, row.original.completed_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-xs"
          onClick={() => setActiveRunId(row.original.id)}
        >
          Logs <ArrowRight className="w-3 h-3" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: runs,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const activeRun = runs.find((r) => r.id === activeRunId)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Runs</h1>
        <p className="text-sm text-gray-400 mt-1">Execute crews and view execution logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Execution panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-white">Execute Crew</h2>

            <div className="space-y-1.5">
              <Label>Select Crew</Label>
              <Select value={selectedCrewId} onValueChange={setSelectedCrewId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a crew..." />
                </SelectTrigger>
                <SelectContent>
                  {crews.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Inputs</Label>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" onClick={addKV}>
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              {kvPairs.map((pair, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="key"
                    value={pair.key}
                    onChange={(e) => updateKV(i, 'key', e.target.value)}
                    className="flex-1 text-xs h-8"
                  />
                  <Input
                    placeholder="value"
                    value={pair.value}
                    onChange={(e) => updateKV(i, 'value', e.target.value)}
                    className="flex-1 text-xs h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 hover:text-red-400"
                    onClick={() => removeKV(i)}
                    disabled={kvPairs.length === 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              className="w-full gap-2"
              disabled={!selectedCrewId || executeMutation.isPending}
              onClick={() => executeMutation.mutate()}
            >
              {executeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Execute
            </Button>
          </div>

          {/* Active run info */}
          {activeRun && (
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Run #{activeRun.id}</h3>
                <Badge
                  variant={activeRun.status as 'running' | 'completed' | 'failed' | 'pending'}
                >
                  {activeRun.status === 'running' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {activeRun.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Crew: {activeRun.crew_name}</p>
              {activeRun.result && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Result:</p>
                  <div className="bg-[#0a0c14] rounded-lg p-3 text-xs font-mono text-emerald-300 max-h-40 overflow-y-auto">
                    {activeRun.result}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Terminal */}
        <div className="lg:col-span-3 h-[500px]">
          <RunTerminal
            runId={activeRunId}
            isCompleted={activeRun?.status === 'completed' || activeRun?.status === 'failed'}
          />
        </div>
      </div>

      {/* Run history */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Run History</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input
              placeholder="Filter runs..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 w-48 h-8 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b border-border">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left text-xs font-medium text-gray-400 py-2 px-3 cursor-pointer select-none hover:text-gray-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3" />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3" />}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/50 hover:bg-white/2 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-2.5 px-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-gray-500">
                {table.getFilteredRowModel().rows.length} runs total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Prev
                </Button>
                <span className="text-xs text-gray-400">
                  Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
