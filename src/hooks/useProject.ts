import { useState, useEffect, useCallback } from 'react'
import { projectService } from '../services/project.service'
import type { VideoProject, NewVideoFormData } from '../types'

export const useProject = () => {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<VideoProject | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await projectService.getAll()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createProject = useCallback(
    async (data: NewVideoFormData): Promise<VideoProject> => {
      const created = await projectService.create(data)
      await fetchProjects()
      setActiveProject(created)
      return created
    },
    [fetchProjects]
  )

  const deleteProject = useCallback(
    async (id: string) => {
      await projectService.delete(id)
      if (activeProject?.id === id) {
        setActiveProject(null)
      }
      await fetchProjects()
    },
    [fetchProjects, activeProject]
  )

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    activeProject,
    setActiveProject,
    fetchProjects,
    createProject,
    deleteProject
  }
}
