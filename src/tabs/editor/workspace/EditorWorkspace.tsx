import { useState, useCallback } from 'react'
import type { VideoProject, TimelineData } from '../../../types'
import { ToolsPanel } from './ToolsPanel'
import { PreviewWindow } from './PreviewWindow'
import { AssetPanel } from './AssetPanel'
import { TimelinePanel } from './TimelinePanel'

interface EditorWorkspaceProps {
  project: VideoProject
}

export const EditorWorkspace = ({ project }: EditorWorkspaceProps) => {
  const [timeline, setTimeline] = useState<TimelineData>(project.timeline)

  const handleTimelineUpdate = useCallback((updated: TimelineData) => {
    setTimeline(updated)
    // In Phase 4B: persist to DB via projectService.updateTimeline()
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Middle section: Tools + Preview + Assets */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ToolsPanel />
        <PreviewWindow project={project} />
        <AssetPanel project={project} />
      </div>

      {/* Timeline at bottom */}
      <TimelinePanel
        timeline={timeline}
        onTimelineUpdate={handleTimelineUpdate}
      />
    </div>
  )
}
