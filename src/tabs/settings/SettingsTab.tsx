import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/app.store'
import { useToast } from '../../hooks/useToast'

interface SettingsRow {
  key: string
  value: string
}

export const SettingsTab = () => {
  const encoderInfo = useAppStore((s) => s.encoderInfo)
  const { toast } = useToast()

  const [youtubeKey, setYoutubeKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  
  const [showYoutubeKey, setShowYoutubeKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [ffmpegVersion, setFfmpegVersion] = useState<string>('Detecting...')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ytRows = (await window.veltrix.db.query(
          "SELECT value FROM settings WHERE key = 'youtube_api_key'"
        )) as SettingsRow[]
        
        const geminiRows = (await window.veltrix.db.query(
          "SELECT value FROM settings WHERE key = 'gemini_api_key'"
        )) as SettingsRow[]

        if (ytRows.length > 0) setYoutubeKey(ytRows[0].value)
        if (geminiRows.length > 0) setGeminiKey(geminiRows[0].value)
      } catch (err) {
        console.error('Failed to load settings:', err)
        toast('Failed to load settings from database', 'error')
      }
    }

    const loadFfmpeg = async () => {
      try {
        const v = await window.veltrix.ffmpeg.getVersion()
        setFfmpegVersion(v)
      } catch (err) {
        setFfmpegVersion('Unknown')
      }
    }

    loadSettings()
    loadFfmpeg()
  }, [toast])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await window.veltrix.db.run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('youtube_api_key', ?)",
        [youtubeKey]
      )
      await window.veltrix.db.run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('gemini_api_key', ?)",
        [geminiKey]
      )
      toast('API Keys saved successfully', 'success')
      
      // Reset show state for security
      setShowYoutubeKey(false)
      setShowGeminiKey(false)
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast('Failed to save settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Settings</h1>
        <p className="mb-8 text-sm text-text-secondary">
          Configure API keys required for Video Production features and view system info.
        </p>

        {/* API Keys Section */}
        <div className="mb-8 rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">
            API Configuration
          </h2>

          <div className="space-y-6">
            {/* YouTube API Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                YouTube Data API v3 Key
              </label>
              <div className="relative">
                <input
                  type={showYoutubeKey ? 'text' : 'password'}
                  value={youtubeKey}
                  onChange={(e) => setYoutubeKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-border bg-surface p-3 pr-12 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowYoutubeKey(!showYoutubeKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showYoutubeKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Get a free key at{' '}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  console.cloud.google.com
                </a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Google Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-lg border border-border bg-surface p-3 pr-12 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showGeminiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Get a free key at{' '}
                <a
                  href="https://aistudio.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  aistudio.google.com
                </a>
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save API Keys'}
              </button>
            </div>
          </div>
        </div>

        {/* System Info Section */}
        <div className="rounded-xl border border-border bg-surface-2 p-6">
          <h2 className="mb-6 text-lg font-semibold text-text-primary">
            Encoder Information
          </h2>

          <div className="space-y-4 rounded-lg bg-surface p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Status:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    encoderInfo ? 'bg-success' : 'bg-warning'
                  }`}
                />
                <span className="font-medium text-text-primary">
                  {encoderInfo ? 'Active' : 'Initializing...'}
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-text-secondary">Encoder:</span>
              <span className="font-medium text-text-primary">
                {encoderInfo
                  ? encoderInfo.isHardware
                    ? encoderInfo.gpu
                    : `CPU (${encoderInfo.encoder})`
                  : '...'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-text-secondary">FFmpeg Version:</span>
              <span className="font-medium text-text-primary">{ffmpegVersion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
