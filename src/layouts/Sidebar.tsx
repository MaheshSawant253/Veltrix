import { useState } from 'react'
import { useAppStore } from '../store/app.store'
import {
  Clapperboard,
  Video,
  Scissors,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

type TabId = 'channels' | 'production' | 'editor' | 'settings'

interface NavItem {
  id: TabId
  label: string
  icon: typeof Clapperboard
}

const navItems: NavItem[] = [
  { id: 'channels', label: 'YouTube Channels', icon: Clapperboard },
  { id: 'production', label: 'Video Production', icon: Video },
  { id: 'editor', label: 'Video Editor', icon: Scissors },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { activeTab, setActiveTab, encoderInfo } = useAppStore()

  return (
    <aside
      className="flex flex-col border-r border-border bg-surface transition-all duration-200"
      style={{ width: collapsed ? 56 : 220 }}
    >
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          V
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-text-primary">Veltrix</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer: Encoder status + version */}
      <div className="border-t border-border p-3">
        {encoderInfo && !collapsed && (
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                encoderInfo.isHardware ? 'bg-success' : 'bg-warning'
              }`}
            />
            <span className="truncate text-xs text-text-secondary">
              Encoder: {encoderInfo.isHardware ? encoderInfo.gpu : `CPU (${encoderInfo.encoder})`}
            </span>
          </div>
        )}
        {encoderInfo && collapsed && (
          <div className="mb-2 flex justify-center">
            <span
              className={`h-2 w-2 rounded-full ${
                encoderInfo.isHardware ? 'bg-success' : 'bg-warning'
              }`}
              title={`Encoder: ${encoderInfo.isHardware ? encoderInfo.gpu : `CPU (${encoderInfo.encoder})`}`}
            />
          </div>
        )}
        {!collapsed && (
          <span className="text-[10px] text-text-secondary/50">v1.0.0</span>
        )}
      </div>
    </aside>
  )
}
