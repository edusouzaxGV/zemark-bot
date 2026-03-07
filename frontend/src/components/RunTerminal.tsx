import { useEffect, useRef, useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Copy, Check, Terminal } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { WsMessage, RunStep } from '@/types'

interface TerminalLine {
  id: string
  agent: string
  type: 'thought' | 'tool_call' | 'result' | 'error' | 'status' | 'system'
  content: string
  tool?: string
  timestamp: string
}

function parseMsgToLine(msg: WsMessage, idx: number): TerminalLine | null {
  if (msg.type === 'step') {
    const d = msg.data
    return {
      id: `step-${d.id ?? idx}`,
      agent: d.agent || 'SYSTEM',
      type: d.step_type as TerminalLine['type'],
      content: d.content,
      tool: d.tool_name ?? undefined,
      timestamp: d.timestamp,
    }
  }
  if (msg.type === 'status') {
    return {
      id: `status-${idx}`,
      agent: 'SYSTEM',
      type: 'system',
      content: `Run status: ${msg.data.status}`,
      timestamp: new Date().toISOString(),
    }
  }
  if (msg.type === 'complete') {
    return {
      id: `complete-${idx}`,
      agent: 'SYSTEM',
      type: 'result',
      content: '✓ Execution completed successfully',
      timestamp: new Date().toISOString(),
    }
  }
  if (msg.type === 'error') {
    return {
      id: `error-${idx}`,
      agent: 'SYSTEM',
      type: 'error',
      content: `✗ Error: ${msg.data.error}`,
      timestamp: new Date().toISOString(),
    }
  }
  return null
}

function stepToLine(step: RunStep): TerminalLine {
  return {
    id: `step-${step.id}`,
    agent: step.agent_name || 'SYSTEM',
    type: step.step_type as TerminalLine['type'],
    content: step.content,
    tool: step.tool_name ?? undefined,
    timestamp: step.timestamp,
  }
}

interface RunTerminalProps {
  runId: number | null
  initialSteps?: RunStep[]
  isCompleted?: boolean
}

export default function RunTerminal({ runId, initialSteps = [], isCompleted = false }: RunTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(() =>
    initialSteps.map(stepToLine)
  )
  const [copied, setCopied] = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const counterRef = useRef(0)

  const connect = useCallback(() => {
    if (!runId || isCompleted) return
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/runs/${runId}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        counterRef.current++
        const line = parseMsgToLine(msg, counterRef.current)
        if (line) {
          setLines((prev) => {
            // Avoid duplicates
            if (prev.some((l) => l.id === line.id)) return prev
            return [...prev, line]
          })
        }
      } catch {
        // ignore parse errors
      }
    }

    return ws
  }, [runId, isCompleted])

  useEffect(() => {
    const ws = connect()
    return () => {
      ws?.close()
    }
  }, [connect])

  useEffect(() => {
    setLines(initialSteps.map(stepToLine))
  }, [initialSteps])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const handleCopy = () => {
    const text = lines.map((l) => `[${l.agent}] ${l.content}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLineClass = (type: TerminalLine['type']) => {
    switch (type) {
      case 'thought': return 'text-indigo-300'
      case 'tool_call': return 'text-amber-300'
      case 'result': return 'text-emerald-300'
      case 'error': return 'text-red-300'
      default: return 'text-gray-500'
    }
  }

  const getPrefix = (line: TerminalLine) => {
    switch (line.type) {
      case 'thought': return '💭'
      case 'tool_call': return `🔧 [${line.tool ?? 'tool'}]`
      case 'result': return '✓'
      case 'error': return '✗'
      default: return '·'
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0c14] rounded-xl border border-border overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#0f1117]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-mono text-gray-400">execution log</span>
          {runId && (
            <span className="text-xs font-mono text-gray-600">· run #{runId}</span>
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1 ml-2 text-xs',
              connected ? 'text-emerald-400' : 'text-gray-600'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600')} />
            {connected ? 'live' : 'offline'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 gap-1 text-xs">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Terminal body */}
      <ScrollArea className="flex-1">
        <div className="p-4 font-mono text-xs space-y-1 min-h-full">
          {lines.length === 0 ? (
            <p className="text-gray-600 italic">Waiting for agent output...</p>
          ) : (
            lines.map((line) => (
              <div key={line.id} className={cn('leading-relaxed', getLineClass(line.type))}>
                <span className="text-gray-600 mr-2 select-none">
                  {new Date(line.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-gray-500 mr-1.5 font-medium">[{line.agent}]</span>
                <span className="mr-1.5">{getPrefix(line)}</span>
                <span>{line.content}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
