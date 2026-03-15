import { create } from 'zustand'
import type { EncoderInfo, Toast, VideoIdea } from '../types'

type TabId = 'channels' | 'production' | 'editor' | 'settings'

interface AppState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  encoderInfo: EncoderInfo | null
  setEncoderInfo: (info: EncoderInfo) => void
  dbReady: boolean
  setDbReady: (ready: boolean) => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  pendingVideoIdea: VideoIdea | null
  setPendingVideoIdea: (idea: VideoIdea | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'channels',
  setActiveTab: (tab) => set({ activeTab: tab }),
  encoderInfo: null,
  setEncoderInfo: (info) => set({ encoderInfo: info }),
  dbReady: false,
  setDbReady: (ready) => set({ dbReady: ready }),
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-2),
        { ...toast, id: crypto.randomUUID() }
      ]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),
  pendingVideoIdea: null,
  setPendingVideoIdea: (idea) => set({ pendingVideoIdea: idea })
}))
