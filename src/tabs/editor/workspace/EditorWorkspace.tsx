import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import debounce from 'lodash/debounce'
import type { VideoProject, TimelineData, MediaAsset, TimelineClip } from '../../../types'
import { projectService } from '../../../services/project.service'
import { useToast } from '../../../hooks/useToast'
import { ToolsPanel } from './ToolsPanel'
import { PreviewWindow } from './PreviewWindow'
import { AssetPanel } from './AssetPanel'
import { TimelinePanel } from './TimelinePanel'

interface EditorWorkspaceProps {
  project: VideoProject
}

export const EditorWorkspace = ({ project }: EditorWorkspaceProps) => {
  const [timeline, setTimeline] = useState<TimelineData>(project.timeline)
  const [assets, setAssets] = useState<MediaAsset[]>(project.assets ?? [])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { toast } = useToast()

  // Debounced save timeline to DB
  const debouncedSaveTimeline = useMemo(
    () =>
      debounce((tl: TimelineData) => {
        projectService.updateTimeline(project.id, tl).catch(() => {
          toast('Failed to save timeline', 'error')
        })
      }, 1000),
    [project.id, toast]
  )

  // Cleanup debounced save on unmount
  useEffect(() => {
    return () => {
      debouncedSaveTimeline.cancel()
    }
  }, [debouncedSaveTimeline])

  // Simple playback timer — advances currentTime at ~30fps
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          const maxDur = timeline.totalDuration
          if (maxDur <= 0) return prev
          const next = prev + 1 / 30
          if (next >= maxDur) {
            setIsPlaying(false)
            return maxDur
          }
          return next
        })
      }, 1000 / 30)
      playIntervalRef.current = interval
      return () => clearInterval(interval)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
  }, [isPlaying, timeline.totalDuration])

  const handleTimelineUpdate = useCallback(
    (updated: TimelineData) => {
      setTimeline(updated)
      debouncedSaveTimeline(updated)
    },
    [debouncedSaveTimeline]
  )

  const handleAssetsUpdate = useCallback(
    (newAssets: MediaAsset[]) => {
      setAssets(newAssets)
      // Update project object for child components
      project.assets = newAssets
      projectService.updateAssets(project.id, newAssets).catch(() => {
        toast('Failed to save assets', 'error')
      })
    },
    [project, toast]
  )

  const handleAddToTimeline = useCallback(
    (asset: MediaAsset) => {
      const trackType = asset.fileType === 'image' ? 'video' : asset.fileType
      const trackClipType = asset.fileType === 'image' ? 'video' : asset.fileType

      const trackIdx = timeline.tracks.findIndex((t) => t.type === trackType)
      if (trackIdx === -1) return

      const track = timeline.tracks[trackIdx]
      // Place at end of last clip on this track
      let startTime = 0
      for (const c of track.clips) {
        startTime = Math.max(startTime, c.startTime + c.duration)
      }

      const newClip: TimelineClip = {
        id: uuidv4(),
        type: trackClipType as TimelineClip['type'],
        trackIndex: trackIdx,
        startTime,
        duration: asset.duration > 0 ? asset.duration : 5,
        trimIn: 0,
        trimOut: 0,
        filePath: asset.filePath,
        name: asset.fileName,
        color: undefined
      }

      const updatedTracks = [...timeline.tracks]
      updatedTracks[trackIdx] = {
        ...track,
        clips: [...track.clips, newClip]
      }

      // Recalculate totalDuration
      let maxEnd = 0
      for (const t of updatedTracks) {
        for (const c of t.clips) {
          maxEnd = Math.max(maxEnd, c.startTime + c.duration)
        }
      }

      const updated: TimelineData = {
        ...timeline,
        tracks: updatedTracks,
        totalDuration: maxEnd
      }

      handleTimelineUpdate(updated)
      toast(`Added "${asset.fileName}" to timeline`, 'success')
    },
    [timeline, handleTimelineUpdate, toast]
  )

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, time))
  }, [])

  // Build project with current assets for child components
  const projectWithAssets = useMemo(
    () => ({ ...project, assets, timeline }),
    [project, assets, timeline]
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Middle section: Tools + Preview + Assets */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ToolsPanel />
        <PreviewWindow
          project={projectWithAssets}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          duration={timeline.totalDuration}
        />
        <AssetPanel
          project={projectWithAssets}
          onAssetsUpdate={handleAssetsUpdate}
          onAddToTimeline={handleAddToTimeline}
        />
      </div>

      {/* Timeline at bottom */}
      <TimelinePanel
        timeline={timeline}
        onTimelineUpdate={handleTimelineUpdate}
        currentTime={currentTime}
        onSeek={handleSeek}
      />
    </div>
  )
}
