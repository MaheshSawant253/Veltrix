import { useState } from 'react'
import {
  MousePointer2,
  Scissors,
  MoveHorizontal,
  Type,
  Music,
  Sparkles
} from 'lucide-react'

type Tool = 'select' | 'cut' | 'slip' | 'text' | 'audio' | 'ai'

const tools: { id: Tool; icon: typeof MousePointer2; label: string; isSpecial?: boolean }[] = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'cut', icon: Scissors, label: 'Razor Cut' },
  { id: 'slip', icon: MoveHorizontal, label: 'Slip Tool' },
  { id: 'text', icon: Type, label: 'Text Tool' },
  { id: 'audio', icon: Music, label: 'Audio Tool' }
]

const specialTool = { id: 'ai' as Tool, icon: Sparkles, label: 'AI Tools' }

export const ToolsPanel = () => {
  const [activeTool, setActiveTool] = useState<Tool>('select')

  return (
    <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-surface py-2">
      {tools.map((tool) => {
        const Icon = tool.icon
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setActiveTool(tool.id)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              activeTool === tool.id
                ? 'bg-accent/20 text-accent'
                : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
            }`}
          >
            <Icon size={16} />
          </button>
        )
      })}

      <div className="my-1 h-px w-6 bg-border" />

      <button
        title={specialTool.label}
        onClick={() => setActiveTool('ai')}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          activeTool === 'ai'
            ? 'bg-accent/20 text-accent'
            : 'text-accent/70 hover:bg-accent/10 hover:text-accent'
        }`}
      >
        <Sparkles size={16} />
      </button>
    </div>
  )
}
