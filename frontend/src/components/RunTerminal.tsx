import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface StreamEvent {
  type: string
  agent: string | null
  content: string
  tool: string | null
  tool_input: string | null
  timestamp: string
}

interface Props {
  runId: number
  onComplete?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  thought: '💭 Thought',
  action: '⚡ Action',
  tool_call: '🔧 Tool Call',
  tool_result: '✅ Tool Result',
  final_answer: '🎯 Final Answer',
  error: '❌ Error',
  status: '📡 Status',
  agent_start: '🤖 Agent',
}

export function RunTerminal({ runId, onComplete }: Props) {
  const [events, setEvents] = useState<StreamEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}://${host}/api/runs/${runId}/stream`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onmessage = (e) => {
      const data: StreamEvent = JSON.parse(e.data)
      setEvents((prev) => [...prev, data])
      if (data.type === 'status' && (data.content === 'completed' || data.content === 'Run failed')) {
        setDone(true)
        onComplete?.()
      }
    }
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    return () => ws.close()
  }, [runId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  return (
    <div className="terminal">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
        <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-400 animate-pulse' : 'bg-gray-500')} />
        <span className="text-xs text-gray-400">{connected ? 'Connected' : 'Disconnected'} — Run #{runId}</span>
        {done && <span className="ml-auto text-xs text-green-400">✓ Done</span>}
      </div>

      {events.length === 0 && (
        <p className="text-gray-500 text-xs italic">Waiting for execution events...</p>
      )}

      {events.map((ev, i) => (
        <div key={i} className={cn('mb-2', ev.type)}>
          <div className="flex items-start gap-2">
            <span className="text-gray-600 text-xs shrink-0">{new Date(ev.timestamp).toLocaleTimeString()}</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-400 text-xs mr-2">
                {TYPE_LABELS[ev.type] ?? ev.type}
                {ev.agent && <span className="ml-1 text-cyan-500">[{ev.agent}]</span>}
                {ev.tool && <span className="ml-1 text-orange-500">{ev.tool}</span>}
              </span>
              {ev.type === 'final_answer' ? (
                <div className="mt-1 text-purple-400 prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{ev.content}</ReactMarkdown>
                </div>
              ) : (
                <span className={ev.type}>{ev.content}</span>
              )}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
