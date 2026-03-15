import { useEffect, useState } from 'react'
import type { Channel } from '../../types'
import { channelService } from '../../services/channel.service'

interface ChannelSelectorProps {
  selectedChannelId: string | null
  onSelect: (channelId: string) => void
}

export const ChannelSelector = ({ selectedChannelId, onSelect }: ChannelSelectorProps) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const all = await channelService.getAll()
        setChannels(all.filter((c) => c.youtubeChannelId.length > 0))
      } catch (err) {
        console.error('Failed to load channels:', err)
      }
    }
    load()
  }, [])

  const selected = channels.find((c) => c.id === selectedChannelId)

  if (channels.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-text-secondary">
        <span className="text-warning">⚠</span>
        Add a YouTube Channel ID to your channel in the Channels tab
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: 280 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-text-primary transition-colors hover:border-accent/50"
      >
        <span className="truncate">
          {selected ? `${selected.name} ${selected.handle ? `(${selected.handle})` : ''}` : 'Select a channel...'}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-surface-2 py-1 shadow-xl">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                onSelect(ch.id)
                setIsOpen(false)
              }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-accent/10 ${
                ch.id === selectedChannelId ? 'bg-accent/15 text-accent' : 'text-text-primary'
              }`}
            >
              <span className="truncate font-medium">{ch.name}</span>
              {ch.handle && (
                <span className="truncate text-xs text-text-secondary">{ch.handle}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
