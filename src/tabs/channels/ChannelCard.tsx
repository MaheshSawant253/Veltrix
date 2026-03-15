import type { Channel } from '../../types'

interface ChannelCardProps {
  channel: Channel
  isSelected: boolean
  onSelect: (channel: Channel) => void
}

export const ChannelCard = ({ channel, isSelected, onSelect }: ChannelCardProps) => {
  return (
    <button
      onClick={() => onSelect(channel)}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer ${
        isSelected
          ? 'border-accent bg-[#1e1e2e]'
          : 'border-border bg-surface-2 hover:bg-[#222222]'
      }`}
    >
      {/* Color avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: channel.brandingConfig.primaryColor }}
      >
        {channel.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {channel.name}
        </p>
        {channel.handle && (
          <p className="truncate text-xs text-text-secondary">
            {channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}
          </p>
        )}
      </div>

      {/* Niche badge */}
      {channel.niche && (
        <span className="shrink-0 rounded-full bg-[#222] px-2 py-0.5 text-[10px] text-text-secondary">
          {channel.niche}
        </span>
      )}
    </button>
  )
}
