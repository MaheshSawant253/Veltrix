import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { VideoProject } from '../../types'

interface ProjectCardProps {
  project: VideoProject
  isSelected: boolean
  onSelect: (project: VideoProject) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  draft: { color: '#a1a1aa', bg: '#a1a1aa20', label: 'Draft' },
  in_progress: { color: '#f59e0b', bg: '#f59e0b20', label: 'In Progress' },
  ready: { color: '#22c55e', bg: '#22c55e20', label: 'Ready' },
  exported: { color: '#3b82f6', bg: '#3b82f620', label: 'Exported' }
}

const resLabels: Record<string, string> = {
  '1920x1080': '1080p',
  '1280x720': '720p',
  '3840x2160': '4K'
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const ProjectCard = ({
  project,
  isSelected,
  onSelect,
  onDelete
}: ProjectCardProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const status = statusConfig[project.status] || statusConfig.draft

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(project.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div
      onClick={() => onSelect(project)}
      className={`group relative cursor-pointer rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-accent bg-[#1e1e2e]'
          : 'border-border bg-surface-2 hover:bg-[#222]'
      }`}
    >
      {/* Status + Delete */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          <span
            className="text-[10px] font-medium"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-1.5 py-0.5 text-[10px] text-text-secondary hover:bg-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="rounded bg-danger px-1.5 py-0.5 text-[10px] text-white"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="hidden text-text-secondary/50 transition-colors hover:text-danger group-hover:block"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Title */}
      <p className="mb-1.5 truncate text-sm font-medium text-text-primary">
        {project.title}
      </p>

      {/* Tags */}
      <div className="mb-2 flex flex-wrap gap-1">
        {project.niche && (
          <span className="rounded-full bg-[#222] px-2 py-0.5 text-[10px] text-text-secondary">
            {project.niche}
          </span>
        )}
        {project.style && (
          <span className="rounded-full bg-[#222] px-2 py-0.5 text-[10px] text-text-secondary">
            {project.style}
          </span>
        )}
        <span className="rounded-full bg-[#222] px-2 py-0.5 text-[10px] text-text-secondary">
          {resLabels[project.settings.resolution] || '1080p'}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-secondary/60">
        <span>{relativeTime(project.updatedAt)}</span>
        <span>{formatDuration(project.settings.duration)}</span>
      </div>
    </div>
  )
}
