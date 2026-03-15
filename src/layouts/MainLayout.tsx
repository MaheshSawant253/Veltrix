import { Sidebar } from './Sidebar'
import { useAppStore } from '../store/app.store'
import { ChannelsTab } from '../tabs/channels/ChannelsTab'
import { ProductionTab } from '../tabs/production/ProductionTab'
import { EditorTab } from '../tabs/editor/EditorTab'
import { SettingsTab } from '../tabs/settings/SettingsTab'
import { ToastContainer } from '../components/ToastContainer'

const tabComponents = {
  channels: ChannelsTab,
  production: ProductionTab,
  editor: EditorTab,
  settings: SettingsTab
} as const

export const MainLayout = () => {
  const activeTab = useAppStore((s) => s.activeTab)
  const ActiveComponent = tabComponents[activeTab]

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <ActiveComponent />
        </main>
      </div>
      <ToastContainer />
    </>
  )
}
