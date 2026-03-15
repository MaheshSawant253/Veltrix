import { create } from 'zustand'
import type { EncoderInfo } from '../types'

type TabId = 'channels' | 'production' | 'editor' | 'settings'

interface AppState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  encoderInfo: EncoderInfo | null
  setEncoderInfo: (info: EncoderInfo) => void
  dbReady: boolean
  setDbReady: (ready: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'channels',
  setActiveTab: (tab) => set({ activeTab: tab }),
  encoderInfo: null,
  setEncoderInfo: (info) => set({ encoderInfo: info }),
  dbReady: false,
  setDbReady: (ready) => set({ dbReady: ready })
}))
