import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  Upload,
  Music,
  Type,
  Sparkles,
  CloudUpload,
  Plus,
  Film,
  Image,
  FileText,
  Bot,
  MessageSquare,
  Scissors,
  Palette,
  Loader2
} from 'lucide-react'
import type { VideoProject, MediaAsset } from '../../../types'

interface AssetPanelProps {
  project: VideoProject
  onAssetsUpdate: (assets: MediaAsset[]) => void
  onAddToTimeline: (asset: MediaAsset) => void
}

type AssetTab = 'media' | 'audio' | 'text' | 'ai'

const tabs: { id: AssetTab; label: string; icon: typeof Upload }[] = [
  { id: 'media', label: 'Media', icon: Upload },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'ai', label: 'AI', icon: Sparkles }
]

const textPresets = [
  { label: 'Title', desc: 'Large heading text' },
  { label: 'Subtitle', desc: 'Medium sized text' },
  { label: 'Caption', desc: 'Small caption text' },
  { label: 'Lower Third', desc: 'Name/title overlay' }
]

const aiTools = [
  { icon: Bot, label: 'Generate Script', badge: 'Coming soon' },
  { icon: MessageSquare, label: 'Auto Subtitles', badge: 'Coming soon' },
  { icon: Scissors, label: 'Smart Cut', badge: 'Coming soon' },
  { icon: Palette, label: 'Color Grade', badge: 'Coming soon' },
  { icon: Music, label: 'Music Suggest', badge: 'Coming soon' }
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const fileTypeIcon = (type: string) => {
  if (type === 'video') return <Film size={14} className="text-indigo-400" />
  if (type === 'audio') return <Music size={14} className="text-green-400" />
  return <Image size={14} className="text-amber-400" />
}

const VideoThumbnail = ({ filePath }: { filePath: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasThumbnail, setHasThumbnail] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/')
    video.src = fileUrl
    video.currentTime = 0.5

    const handleSeeked = () => {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, 56, 40)
        setHasThumbnail(true)
      }
    }
    video.addEventListener('seeked', handleSeeked, { once: true })
    return () => video.removeEventListener('seeked', handleSeeked)
  }, [filePath])

  return (
    <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-[#1a1a1a]">
      <video ref={videoRef} className="hidden" muted preload="metadata" />
      <canvas ref={canvasRef} width={56} height={40} className={hasThumbnail ? '' : 'hidden'} />
      {!hasThumbnail && (
        <div className="flex h-full w-full items-center justify-center">
          <Film size={14} className="text-text-secondary/30" />
        </div>
      )}
    </div>
  )
}

export const AssetPanel = ({
  project,
  onAssetsUpdate,
  onAddToTimeline
}: AssetPanelProps) => {
  const [activeTab, setActiveTab] = useState<AssetTab>('media')
  const [isImporting, setIsImporting] = useState(false)

  const handleImportMedia = async () => {
    setIsImporting(true)
    try {
      const files = await window.veltrix.file.openMediaDialog()
      if (files.length === 0) return

      const newAssets: MediaAsset[] = []
      for (const file of files) {
        // Skip duplicates
        if (project.assets.some((a) => a.filePath === file.filePath)) continue

        let duration = 0
        if (file.fileType === 'video' || file.fileType === 'audio') {
          duration = await window.veltrix.file.getMediaDuration(file.filePath)
        }

        newAssets.push({
          id: uuidv4(),
          filePath: file.filePath,
          fileName: file.fileName,
          fileType: file.fileType,
          fileSize: file.fileSize,
          duration,
          extension: file.extension,
          addedAt: new Date().toISOString()
        })
      }

      onAssetsUpdate([...project.assets, ...newAssets])
    } catch (err) {
      console.error('Import failed:', err)
    } finally {
      setIsImporting(false)
    }
  }

  const mediaAssets = project.assets.filter((a) => a.fileType === 'video' || a.fileType === 'image')
  const audioAssets = project.assets.filter((a) => a.fileType === 'audio')

  return (
    <div className="flex w-[260px] shrink-0 flex-col border-l border-border bg-surface">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'media' && (
          <div className="space-y-2">
            <button
              onClick={handleImportMedia}
              disabled={isImporting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isImporting ? 'Importing...' : 'Import Media'}
            </button>

            {mediaAssets.length === 0 && !isImporting && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CloudUpload size={28} className="text-text-secondary/20" />
                <p className="text-[11px] text-text-secondary/50">Import video, images</p>
              </div>
            )}

            {mediaAssets.map((asset) => (
              <div
                key={asset.id}
                className="group flex items-center gap-2 rounded-lg bg-surface-2 p-2 transition-colors hover:bg-[#222]"
              >
                {asset.fileType === 'video' ? (
                  <VideoThumbnail filePath={asset.filePath} />
                ) : (
                  <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-[#1a1a1a]">
                    {fileTypeIcon(asset.fileType)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-text-primary">{asset.fileName}</p>
                  <p className="text-[10px] text-text-secondary/60">
                    {formatDuration(asset.duration)} · {formatFileSize(asset.fileSize)}
                  </p>
                </div>
                <button
                  onClick={() => onAddToTimeline(asset)}
                  className="hidden shrink-0 rounded bg-accent/20 p-1 text-accent transition-colors hover:bg-accent/40 group-hover:block"
                  title="Add to Timeline"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-2">
            <button
              onClick={handleImportMedia}
              disabled={isImporting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Music size={14} />}
              {isImporting ? 'Importing...' : 'Import Audio'}
            </button>

            {audioAssets.length === 0 && !isImporting && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Music size={28} className="text-text-secondary/20" />
                <p className="text-[11px] text-text-secondary/50">Import audio files</p>
              </div>
            )}

            {audioAssets.map((asset) => (
              <div
                key={asset.id}
                className="group flex items-center gap-2 rounded-lg bg-surface-2 p-2 transition-colors hover:bg-[#222]"
              >
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-[#1a1a1a]">
                  <Music size={14} className="text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-text-primary">{asset.fileName}</p>
                  <p className="text-[10px] text-text-secondary/60">
                    {formatDuration(asset.duration)} · {formatFileSize(asset.fileSize)}
                  </p>
                </div>
                <button
                  onClick={() => onAddToTimeline(asset)}
                  className="hidden shrink-0 rounded bg-accent/20 p-1 text-accent transition-colors hover:bg-accent/40 group-hover:block"
                  title="Add to Timeline"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-2">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent">
              <Type size={14} />
              Add Text
            </button>
            <div className="mt-3 space-y-1">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-secondary/50">
                Presets
              </p>
              {textPresets.map((preset) => (
                <button
                  key={preset.label}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <FileText size={14} className="shrink-0 text-text-secondary" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{preset.label}</p>
                    <p className="text-[10px] text-text-secondary/50">{preset.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-1">
            {aiTools.map((tool) => {
              const Icon = tool.icon
              return (
                <div
                  key={tool.label}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 opacity-60"
                >
                  <Icon size={16} className="shrink-0 text-accent" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">{tool.label}</p>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[9px] text-text-secondary">
                    {tool.badge}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
