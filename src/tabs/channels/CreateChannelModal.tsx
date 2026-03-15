import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import type { Channel, BrandingConfig } from '../../types'

type ChannelFormData = Omit<Channel, 'id' | 'createdAt' | 'updatedAt'>

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ChannelFormData) => Promise<void>
  editChannel?: Channel | null
}

const NICHE_SUGGESTIONS = [
  'Technology', 'Gaming', 'Finance', 'Health & Fitness',
  'Education', 'Entertainment', 'Food', 'Travel',
  'Beauty & Fashion', 'Business', 'Science', 'Sports',
  'Music', 'DIY & Crafts', 'News'
]

const EDITING_STYLES: Channel['editingStyle'][] = [
  'Fast-paced', 'Cinematic', 'Educational', 'Vlog', 'Documentary'
]

const TONE_OPTIONS: Channel['toneOfVoice'][] = [
  'Educational', 'Entertaining', 'Inspirational', 'Conversational', 'Professional'
]

const FREQUENCY_OPTIONS: Channel['uploadFrequency'][] = [
  'Daily', '3x per week', 'Weekly', 'Bi-weekly', 'Monthly'
]

const FONT_STYLES: BrandingConfig['fontStyle'][] = [
  'Modern', 'Classic', 'Playful', 'Bold'
]

const VIDEO_STYLES: BrandingConfig['videoStyle'][] = [
  'Talking Head', 'Screen Record', 'Cinematic', 'Animation', 'Mixed'
]

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#ffffff', '#a1a1aa'
]

const defaultFormData: ChannelFormData = {
  name: '',
  handle: '',
  description: '',
  niche: '',
  editingStyle: 'Educational',
  toneOfVoice: 'Professional',
  targetAudience: '',
  uploadFrequency: 'Weekly',
  brandingConfig: {
    primaryColor: '#6366f1',
    fontStyle: 'Modern',
    videoStyle: 'Mixed'
  },
  youtubeChannelId: ''
}

const channelToFormData = (ch: Channel): ChannelFormData => ({
  name: ch.name,
  handle: ch.handle,
  description: ch.description,
  niche: ch.niche,
  editingStyle: ch.editingStyle,
  toneOfVoice: ch.toneOfVoice,
  targetAudience: ch.targetAudience,
  uploadFrequency: ch.uploadFrequency,
  brandingConfig: { ...ch.brandingConfig },
  youtubeChannelId: ch.youtubeChannelId
})

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

export const CreateChannelModal = ({
  isOpen,
  onClose,
  onSave,
  editChannel
}: CreateChannelModalProps) => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ChannelFormData>({ ...defaultFormData })
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showNicheSuggestions, setShowNicheSuggestions] = useState(false)

  // Reset form state whenever modal opens or editChannel changes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setNameError('')
      setSaveError('')
      setSaving(false)
      setFormData(editChannel ? channelToFormData(editChannel) : { ...defaultFormData })
    }
  }, [isOpen, editChannel])

  if (!isOpen) return null

  const updateField = <K extends keyof ChannelFormData>(
    key: K,
    value: ChannelFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateBranding = <K extends keyof BrandingConfig>(
    key: K,
    value: BrandingConfig[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      brandingConfig: { ...prev.brandingConfig, [key]: value }
    }))
  }

  const validateStep1 = (): boolean => {
    if (!formData.name || formData.name.trim().length < 2) {
      setNameError('Channel name must be at least 2 characters')
      return false
    }
    setNameError('')
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    setStep((s) => Math.min(s + 1, 3))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError('')
      const data = { ...formData }
      if (data.handle && !data.handle.startsWith('@')) {
        data.handle = `@${data.handle}`
      }
      await onSave(data)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save channel')
    } finally {
      setSaving(false)
    }
  }

  const filteredSuggestions = NICHE_SUGGESTIONS.filter((n) =>
    n.toLowerCase().includes(formData.niche.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="relative flex max-h-[80vh] w-[560px] flex-col rounded-2xl border border-border bg-surface-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {editChannel ? 'Edit Channel' : 'Create Channel'}
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2, 3].map((s) => (
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
              {s < 3 && (
                <div
                  className={`h-px w-8 ${
                    s < step ? 'bg-accent/40' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-text-secondary">
            {step === 1 ? 'Channel Basics' : step === 2 ? 'Content Strategy' : 'Channel Branding'}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <FieldLabel>Channel Name *</FieldLabel>
                <input
                  value={formData.name}
                  onChange={(e) => {
                    updateField('name', e.target.value)
                    if (nameError) setNameError('')
                  }}
                  placeholder="e.g. Tech Insights"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
                {nameError && (
                  <p className="mt-1 text-xs text-danger">{nameError}</p>
                )}
              </div>
              <div>
                <FieldLabel>Handle</FieldLabel>
                <input
                  value={formData.handle}
                  onChange={(e) => updateField('handle', e.target.value)}
                  placeholder="@yourhandle"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="What is this channel about?"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>
              <div>
                <FieldLabel>YouTube Channel ID</FieldLabel>
                <input
                  value={formData.youtubeChannelId}
                  onChange={(e) => updateField('youtubeChannelId', e.target.value)}
                  placeholder="UCxxxxxxxx"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
                <p className="mt-1 text-[10px] text-text-secondary/50">
                  Find this in YouTube Studio → Settings → Channel → Basic Info
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="relative">
                <FieldLabel>Niche</FieldLabel>
                <input
                  value={formData.niche}
                  onChange={(e) => {
                    updateField('niche', e.target.value)
                    setShowNicheSuggestions(true)
                  }}
                  onFocus={() => setShowNicheSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowNicheSuggestions(false), 150)}
                  placeholder="e.g. Technology"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
                {showNicheSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg">
                    {filteredSuggestions.map((niche) => (
                      <button
                        key={niche}
                        type="button"
                        onMouseDown={() => {
                          updateField('niche', niche)
                          setShowNicheSuggestions(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-2"
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>Editing Style</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {EDITING_STYLES.map((style) => (
                    <PillButton
                      key={style}
                      label={style}
                      selected={formData.editingStyle === style}
                      onClick={() => updateField('editingStyle', style)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Tone of Voice</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <PillButton
                      key={tone}
                      label={tone}
                      selected={formData.toneOfVoice === tone}
                      onClick={() => updateField('toneOfVoice', tone)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Target Audience</FieldLabel>
                <input
                  value={formData.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  placeholder="e.g. 18-35 tech enthusiasts"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 outline-none focus:border-accent"
                />
              </div>

              <div>
                <FieldLabel>Upload Frequency</FieldLabel>
                <select
                  value={formData.uploadFrequency}
                  onChange={(e) =>
                    updateField('uploadFrequency', e.target.value as Channel['uploadFrequency'])
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <FieldLabel>Primary Color</FieldLabel>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateBranding('primaryColor', color)}
                      className={`relative flex h-9 w-full items-center justify-center rounded-lg border-2 transition-colors ${
                        formData.brandingConfig.primaryColor === color
                          ? 'border-white'
                          : 'border-transparent hover:border-white/30'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.brandingConfig.primaryColor === color && (
                        <Check
                          size={14}
                          className={color === '#ffffff' ? 'text-black' : 'text-white'}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Font Style</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {FONT_STYLES.map((style) => (
                    <PillButton
                      key={style}
                      label={style}
                      selected={formData.brandingConfig.fontStyle === style}
                      onClick={() => updateBranding('fontStyle', style)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Video Style</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_STYLES.map((style) => (
                    <PillButton
                      key={style}
                      label={style}
                      selected={formData.brandingConfig.videoStyle === style}
                      onClick={() => updateBranding('videoStyle', style)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <FieldLabel>Preview</FieldLabel>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      backgroundColor: formData.brandingConfig.primaryColor
                    }}
                  >
                    {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {formData.name || 'Channel Name'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {formData.handle
                        ? formData.handle.startsWith('@')
                          ? formData.handle
                          : `@${formData.handle}`
                        : '@handle'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div>
            {saveError && (
              <p className="text-xs text-danger">{saveError}</p>
            )}
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
                onClick={handleBack}
                className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editChannel
                    ? 'Save Changes'
                    : 'Create Channel'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
