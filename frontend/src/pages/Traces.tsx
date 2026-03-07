import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel,
  getPaginationRowModel, flexRender, type ColumnDef, type SortingState,
} from '@tanstack/react-table'
import { fetchRuns, fetchRunSteps } from '@/api/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Activity, ChevronUp, ChevronDown, Search } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/utils'
import type { RunStep } from '@/types'

const STEP_COLORS: Record<string, string> = {
  thought: 'text-indigo-400',
  tool_call: 'text-amber-400',
  result: 'text-emerald-400',
  error: 'text-red-400',
  status: 'text-gray-400',
  system: 'text-gray-500',
}

export default function Traces() {
  const [selectedRunId, setSelectedRunId] = useState<string>('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const { data: runs = [] } = useQuery({ queryKey: ['runs'], queryFn: () => fetchRuns(0, 100) })
  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['run-steps', selectedRunId],
    queryFn: () => fetchRunSteps(parseInt(selectedRunId)),
    enabled: !!selectedRunId,
  })

  const selectedRun = runs.find((r) => r.id.toString() === selectedRunId)

  const columns: ColumnDef<RunStep>[] = [
    {
      id: 'time',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-gray-500">
          {new Date(row.original.timestamp).toLocaleTimeString()}
        </span>
      ),
      size: 90,
    },
    {
      accessorKey: 'agent_name',
      header: 'Agent',
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-white">{getValue<string>() ?? 'SYSTEM'}</span>
      ),
    },
    {
      accessorKey: 'step_type',
      header: 'Type',
      cell: ({ getValue }) => {
        const t = getValue<string>()
        return (
          <span className={`text-xs font-mono font-medium ${STEP_COLORS[t] ?? 'text-gray-400'}`}>
            {t}
          </span>
        )
      },
    },
    {
      accessorKey: 'content',
      header: 'Content',
      cell: ({ getValue }) => (
        <span className="text-xs text-gray-300 line-clamp-2">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'tool_name',
      header: 'Tool',
      cell: ({ getValue }) => {
        const t = getValue<string | null>()
        return t ? <Badge variant="secondary" className="text-xs">{t}</Badge> : null
      },
    },
    {
      accessorKey: 'duration_ms',
      header: 'Duration',
      cell: ({ getValue }) => {
        const ms = getValue<number | null>()
        return ms ? <span className="text-xs text-gray-500">{ms}ms</span> : null
      },
    },
  ]

  const table = useReactTable({
    data: steps,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  // Agent step counts
  const agentCounts = steps.reduce<Record<string, number>>((acc, step) => {
    const name = step.agent_name ?? 'SYSTEM'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  const stepTypeCounts = steps.reduce<Record<string, number>>((acc, step) => {
    acc[step.step_type] = (acc[step.step_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Traces</h1>
        <p className="text-sm text-gray-400 mt-1">Detailed execution timeline and agent step analysis</p>
      </div>

      {/* Run selector */}
      <div className="card">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-64">
            <Select value={selectedRunId} onValueChange={setSelectedRunId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a run to trace..." />
              </SelectTrigger>
              <SelectContent>
                {runs.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    #{r.id} — {r.crew_name ?? `Crew #${r.crew_id}`} ({r.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRun && (
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Started: {formatDate(selectedRun.started_at)}</span>
              <span>Duration: {formatDuration(selectedRun.started_at, selectedRun.completed_at)}</span>
              <Badge
                variant={selectedRun.status as 'running' | 'completed' | 'failed' | 'pending'}
              >
                {selectedRun.status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {selectedRunId && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-xs text-gray-500">Total Steps</p>
              <p className="text-2xl font-bold text-white mt-1">{steps.length}</p>
            </div>
            {Object.entries(stepTypeCounts).map(([type, count]) => (
              <div key={type} className="card">
                <p className={`text-xs ${STEP_COLORS[type] ?? 'text-gray-400'}`}>{type}</p>
                <p className="text-2xl font-bold text-white mt-1">{count}</p>
              </div>
            ))}
          </div>

          {/* Agent breakdown */}
          {Object.keys(agentCounts).length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Agent Activity
              </h3>
              <div className="space-y-2">
                {Object.entries(agentCounts).map(([agent, count]) => {
                  const pct = Math.round((count / steps.length) * 100)
                  return (
                    <div key={agent} className="flex items-center gap-3">
                      <span className="text-xs text-gray-300 w-32 truncate">{agent}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{count} steps</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Steps table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Execution Steps</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <Input
                  placeholder="Filter steps..."
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
                        <tr key={row.id} className="border-b border-border/50 hover:bg-white/2">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="py-2 px-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-gray-500">{steps.length} steps total</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
                    <span className="text-xs text-gray-400">
                      Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {!selectedRunId && (
        <div className="text-center py-16 text-gray-500">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Select a run above to view its execution trace</p>
        </div>
      )}
    </div>
  )
}
