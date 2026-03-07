import { useState } from 'react'
import { toast } from 'sonner'
import { Key, Eye, EyeOff, Save, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ApiKeyField {
  key: string
  label: string
  placeholder: string
  envVar: string
  link?: string
}

const API_KEYS: ApiKeyField[] = [
  { key: 'openai', label: 'OpenAI API Key', placeholder: 'sk-...', envVar: 'OPENAI_API_KEY', link: 'https://platform.openai.com/api-keys' },
  { key: 'anthropic', label: 'Anthropic API Key', placeholder: 'sk-ant-...', envVar: 'ANTHROPIC_API_KEY', link: 'https://console.anthropic.com/settings/keys' },
  { key: 'google', label: 'Google AI API Key', placeholder: 'AIza...', envVar: 'GOOGLE_API_KEY', link: 'https://aistudio.google.com/app/apikey' },
  { key: 'serper', label: 'Serper Dev API Key', placeholder: '...', envVar: 'SERPER_API_KEY', link: 'https://serper.dev' },
  { key: 'browserbase', label: 'Browserbase API Key', placeholder: '...', envVar: 'BROWSERBASE_API_KEY' },
  { key: 'exa', label: 'EXA API Key', placeholder: '...', envVar: 'EXA_API_KEY', link: 'https://dashboard.exa.ai/api-keys' },
]

export default function Settings() {
  const [keys, setKeys] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState<Record<string, boolean>>({})

  const toggleVisible = (k: string) => setVisible((prev) => ({ ...prev, [k]: !prev[k] }))

  const handleSave = () => {
    // In a real app, these would be sent to the backend to update the .env file
    // For now, show instructions
    const envLines = API_KEYS
      .filter((f) => keys[f.key])
      .map((f) => `${f.envVar}=${keys[f.key]}`)
      .join('\n')

    if (envLines) {
      navigator.clipboard.writeText(envLines).then(() => {
        toast.success('API keys copied to clipboard. Paste them into your .env file and restart the backend.')
      })
    } else {
      toast.info('Enter at least one API key to save.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure API keys and platform preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-4 h-4 text-accent" />
            API Keys
          </CardTitle>
          <CardDescription>
            Add your API keys to enable LLM providers and tools. Keys are stored in the{' '}
            <code className="text-accent bg-accent/10 px-1 rounded">.env</code> file on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {API_KEYS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{field.label}</Label>
                {field.link && (
                  <a
                    href={field.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Input
                  type={visible[field.key] ? 'text' : 'password'}
                  placeholder={field.placeholder}
                  value={keys[field.key] ?? ''}
                  onChange={(e) => setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  onClick={() => toggleVisible(field.key)}
                >
                  {visible[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 font-mono">{field.envVar}</p>
            </div>
          ))}

          <Separator />

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-xs text-amber-300">
            <p className="font-semibold mb-1">Important</p>
            <p>
              After saving, copy the keys to your{' '}
              <code className="bg-amber-500/20 px-1 rounded">.env</code> file and restart the backend server for
              changes to take effect. Keys entered here are not persisted automatically.
            </p>
          </div>

          <Button onClick={handleSave} className="gap-2 w-full">
            <Save className="w-4 h-4" />
            Copy to Clipboard (.env format)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Platform Version</span>
            <span className="text-white font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Backend</span>
            <span className="text-white">FastAPI + SQLAlchemy</span>
          </div>
          <div className="flex justify-between">
            <span>AI Framework</span>
            <span className="text-white">CrewAI 0.67.1</span>
          </div>
          <div className="flex justify-between">
            <span>Database</span>
            <span className="text-white">SQLite</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
