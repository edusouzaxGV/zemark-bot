export function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your AMP Platform</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-sm">API Keys</h2>
        <div className="space-y-3">
          {['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'SERPER_API_KEY', 'NVIDIA_API_KEY'].map(key => (
            <label key={key} className="space-y-1 block">
              <span className="text-xs text-muted-foreground">{key}</span>
              <input
                type="password"
                placeholder="Set via environment variable"
                disabled
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">API keys are configured via environment variables on the backend. Edit your <code className="bg-accent px-1 rounded">.env</code> file.</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-5 space-y-2">
        <h2 className="font-semibold text-sm">About</h2>
        <p className="text-xs text-muted-foreground">AMP — AI Agents Management Platform v1.0.0</p>
        <p className="text-xs text-muted-foreground">Workspaces: ZEMARK · CASSIO · DUDU</p>
        <p className="text-xs text-muted-foreground">Powered by CrewAI + FastAPI + React</p>
      </div>
    </div>
  )
}
