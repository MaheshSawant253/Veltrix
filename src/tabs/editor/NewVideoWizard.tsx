import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import type { NewVideoFormData, Channel } from '../../types'
import { channelService } from '../../services/channel.service'

interface NewVideoWizardProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: NewVideoFormData) => Promise<void>
  initialData?: Partial<NewVideoFormData> | null
}

const STYLES: NewVideoFormData['style'][] = [
  'Fast-paced', 'Cinematic', 'Educational', 'Vlog', 'Documentary'
]

const ASPECT_RATIOS: { value: NewVideoFormData['aspectRatio']; label: string; icon: string }[] = [
  { value: '16:9', label: '16:9', icon: '🖥️' },
  { value: '9:16', label: '9:16', icon: '📱' },
  { value: '1:1', label: '1:1', icon: '⬜' }
]

const RESOLUTIONS: { value: NewVideoFormData['resolution']; label: string }[] = [
  { value: '1280x720', label: '720p' },
  { value: '1920x1080', label: '1080p' },
  { value: '3840x2160', label: '4K' }
]

const FPS_OPTIONS: NewVideoFormData['fps'][] = [24, 30, 60]

const defaultForm: NewVideoFormData = {
  title: '',
  description: '',
  niche: '',
  style: 'Educational',
  targetAudience: '',
  aspectRatio: '16:9',
  resolution: '1920x1080',
  fps: 30,
  channelId: undefined,
  scriptIdea: ''
}

const PillButton = ({
  label,
  selected,
  onClick
}: {
  label: string
  selected: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      selected
        ? 'border-accent bg-accent/20 text-accent'
        : 'border-[#333] bg-[#222] text-text-secondary hover:border-[#444]'
    }`}
  >
    {label}
  </button>
)

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
    {children}
  </label>
)

export const NewVideoWizard = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: NewVideoWizardProps) => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<NewVideoFormData>({ ...defaultForm })
  const [channels, setChannels] = useState<Channel[]>([])
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setNameError('')
      setSaveError('')
      setSaving(false)
      setForm(initialData ? { ...defaultForm, ...initialData } : { ...defaultForm })

      channelService.getAll().then(setChannels).catch(() => setChannels([]))
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const update = <K extends keyof NewVideoFormData>(
    key: K,
    value: NewVideoFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateStep1 = (): boolean => {
    if (!form.title || form.title.trim().length < 2) {
      setNameError('Title must be at least 2 characters')
      return false
    }
    setNameError('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    setStep(2)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError('')
      await onSubmit(form)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="relative flex max-h-[80vh] w-[600px] flex-col rounded-2xl border border-border bg-surface-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">New Video</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  s === step
                    ? 'bg-accent text-white'
                    : s < step
                      ? 'bg-accent/20 text-accent'
                      : 'bg-[#222] text-text-secondary'
                }`}
              >
                {s < step ? <Check size={12} /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`h-px w-8 ${
                    s < step ? 'bg-accent/40' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-text-secondary">
            {step === 1 ? 'Video Details' : 'Production Settings'}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Title *</FieldLabel>
                <input
                  value={form.title}
                  onChange={(e) => {
                    update('title', e.target.value)
                    if (nameError) setNameError('')
                  }}
                  placeholder="e.g. 10 Reasons Why AI Will Change Everything"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
                {nameError && (
                  <p className="mt-1 text-xs text-danger">{nameError}</p>
                )}
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={3}
                  placeholder="Brief description of the video"
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>Script Idea or Outline</FieldLabel>
                <textarea
                  value={form.scriptIdea || ''}
                  onChange={(e) => update('scriptIdea', e.target.value)}
                  rows={4}
                  placeholder="Describe your video idea, outline, or paste a script..."
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>Niche</FieldLabel>
                <input
                  value={form.niche}
                  onChange={(e) => update('niche', e.target.value)}
                  placeholder="e.g. Technology"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>Channel</FieldLabel>
                <select
                  value={form.channelId || ''}
                  onChange={(e) => update('channelId', e.target.value || undefined)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="">No channel</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} {ch.handle ? `(${ch.handle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>Style</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <PillButton
                      key={s}
                      label={s}
                      selected={form.style === s}
                      onClick={() => update('style', s)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Target Audience</FieldLabel>
                <input
                  value={form.targetAudience}
                  onChange={(e) => update('targetAudience', e.target.value)}
                  placeholder="e.g. 18-35 tech enthusiasts"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>Aspect Ratio</FieldLabel>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map((ar) => (
                    <PillButton
                      key={ar.value}
                      label={`${ar.icon} ${ar.label}`}
                      selected={form.aspectRatio === ar.value}
                      onClick={() => update('aspectRatio', ar.value)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Resolution</FieldLabel>
                <div className="flex gap-2">
                  {RESOLUTIONS.map((r) => (
                    <PillButton
                      key={r.value}
                      label={r.label}
                      selected={form.resolution === r.value}
                      onClick={() => update('resolution', r.value)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Frame Rate</FieldLabel>
                <div className="flex gap-2">
                  {FPS_OPTIONS.map((f) => (
                    <PillButton
                      key={f}
                      label={`${f}fps`}
                      selected={form.fps === f}
                      onClick={() => update('fps', f)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <FieldLabel>Preview</FieldLabel>
                <div className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-text-primary">
                  {form.title || 'Untitled'} · {RESOLUTIONS.find((r) => r.value === form.resolution)?.label || '1080p'} · {form.fps}fps · {form.aspectRatio}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {saveError && <p className="text-xs text-danger">{saveError}</p>}
          </div>
          <div className="flex gap-2">
            {step === 1 && (
              <button
                onClick={onClose}
                className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface"
              >
                Cancel
              </button>
            )}
            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            {step < 2 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
