import { useState } from 'react'
import {
  Upload,
  Music,
  Type,
  Sparkles,
  CloudUpload,
  MessageSquare,
  Scissors,
  Palette,
  FileText,
  Bot
} from 'lucide-react'
import type { VideoProject } from '../../../types'

interface AssetPanelProps {
  project: VideoProject
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

export const AssetPanel = ({ project: _project }: AssetPanelProps) => {
  const [activeTab, setActiveTab] = useState<AssetTab>('media')

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
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent">
              <Upload size={16} />
              Import Media
            </button>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CloudUpload size={32} className="text-text-secondary/20" />
              <p className="text-[11px] text-text-secondary/50">
                Import video, images
              </p>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent">
              <Music size={16} />
              Import Audio
            </button>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Music size={32} className="text-text-secondary/20" />
              <p className="text-[11px] text-text-secondary/50">
                Import audio files
              </p>
            </div>
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
                    <p className="text-xs font-medium text-text-primary">
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-text-secondary/50">
                      {preset.desc}
                    </p>
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
                    <p className="text-xs font-medium text-text-primary">
                      {tool.label}
                    </p>
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
