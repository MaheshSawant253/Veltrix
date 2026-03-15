import { Film, Plus } from 'lucide-react'
import type { VideoProject } from '../../types'
import { ProjectCard } from './ProjectCard'

interface DraftsListProps {
  projects: VideoProject[]
  isLoading: boolean
  activeProjectId: string | null
  onSelect: (project: VideoProject) => void
  onDelete: (id: string) => void
  onCreateNew: () => void
}

export const DraftsList = ({
  projects,
  isLoading,
  activeProjectId,
  onSelect,
  onDelete,
  onCreateNew
}: DraftsListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg bg-surface-2"
          />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
          <Film size={24} className="text-text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">No drafts yet</p>
          <p className="mt-1 text-xs text-text-secondary">
            Create your first video project
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="mt-2 flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={14} />
          New Video
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-auto p-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={activeProjectId === project.id}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
