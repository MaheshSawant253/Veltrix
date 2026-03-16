import { useState, useEffect } from 'react'
import { Plus, Film, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../../store/app.store'
import { useProject } from '../../hooks/useProject'
import { useToast } from '../../hooks/useToast'
import { DraftsList } from './DraftsList'
import { NewVideoWizard } from './NewVideoWizard'
import { EditorWorkspace } from './workspace/EditorWorkspace'
import { ExportPanel } from './workspace/ExportPanel'
import type { NewVideoFormData } from '../../types'

export const EditorTab = () => {
  const pendingVideoIdea = useAppStore((s) => s.pendingVideoIdea)
  const setPendingVideoIdea = useAppStore((s) => s.setPendingVideoIdea)
  const { toast } = useToast()

  const {
    projects,
    isLoading,
    activeProject,
    setActiveProject,
    createProject,
    deleteProject
  } = useProject()

  const { encoderInfo } = useAppStore()

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardInitial, setWizardInitial] = useState<Partial<NewVideoFormData> | null>(null)
  const [showExportPanel, setShowExportPanel] = useState(false)

  // Auto-open wizard if pendingVideoIdea exists
  useEffect(() => {
    if (pendingVideoIdea) {
      setWizardInitial({
        title: pendingVideoIdea.title,
        description: pendingVideoIdea.description,
        scriptIdea: pendingVideoIdea.outline.join('\n')
      })
      setWizardOpen(true)
      setPendingVideoIdea(null)
    }
  }, [pendingVideoIdea, setPendingVideoIdea])

  const handleCreate = async (data: NewVideoFormData) => {
    const created = await createProject(data)
    toast('Project created', 'success')
    setActiveProject(created)
  }

  const handleDelete = async (id: string) => {
    await deleteProject(id)
    toast('Project deleted', 'info')
  }

  const openWizard = () => {
    setWizardInitial(null)
    setWizardOpen(true)
  }

  // VIEW B — Active project
  if (activeProject) {
    return (
      <div className="flex h-full flex-col">
        {/* Thin top bar */}
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
          <button
            onClick={() => setActiveProject(null)}
            className="flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft size={14} />
            Back to Drafts
          </button>
          <span className="text-xs font-medium text-text-primary">
            {activeProject.title}
          </span>
          <button 
            onClick={() => setShowExportPanel(true)}
            style={{
              background: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            ↓ Export
          </button>
        </div>

        <EditorWorkspace project={activeProject} />

        {showExportPanel && activeProject.timeline && encoderInfo && (
          <ExportPanel
            project={activeProject}
            timeline={activeProject.timeline}
            encoderInfo={encoderInfo}
            onClose={() => setShowExportPanel(false)}
          />
        )}
      </div>
    )
  }

  // VIEW A — Drafts list
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-text-primary">
          Video Editor
        </h1>
        <button
          onClick={openWizard}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus size={16} />
          New Video
        </button>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Drafts */}
        <div className="w-80 shrink-0 overflow-auto border-r border-border">
          <DraftsList
            projects={projects}
            isLoading={isLoading}
            activeProjectId={null}
            onSelect={setActiveProject}
            onDelete={handleDelete}
            onCreateNew={openWizard}
          />
        </div>

        {/* Right: Empty state */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Film size={40} className="mx-auto mb-3 text-text-secondary/30" />
            <p className="mb-4 text-sm text-text-secondary">
              Select a draft or create a new video
            </p>
            <button
              onClick={openWizard}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover mx-auto"
            >
              <Plus size={14} />
              Create New Video
            </button>
          </div>
        </div>
      </div>

      {/* Wizard modal */}
      <NewVideoWizard
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false)
          setWizardInitial(null)
        }}
        onSubmit={handleCreate}
        initialData={wizardInitial}
      />
    </div>
  )
}
