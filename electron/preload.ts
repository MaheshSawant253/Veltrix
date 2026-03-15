import { contextBridge, ipcRenderer } from 'electron'

interface MediaFileInfo {
  filePath: string
  fileName: string
  fileType: 'video' | 'audio' | 'image'
  fileSize: number
  extension: string
}

const veltrixApi = {
  db: {
    query: (sql: string, params?: unknown[]): Promise<unknown[]> =>
      ipcRenderer.invoke('db:query', sql, params),
    run: (sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number | bigint }> =>
      ipcRenderer.invoke('db:run', sql, params)
  },
  ffmpeg: {
    detectEncoder: (): Promise<{ encoder: string; gpu: string; isHardware: boolean }> =>
      ipcRenderer.invoke('ffmpeg:detectEncoder'),
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke('ffmpeg:getVersion')
  },
  file: {
    openMediaDialog: (): Promise<MediaFileInfo[]> =>
      ipcRenderer.invoke('file:openMediaDialog'),
    getMediaDuration: (filePath: string): Promise<number> =>
      ipcRenderer.invoke('file:getMediaDuration', filePath),
    fileExists: (filePath: string): Promise<boolean> =>
      ipcRenderer.invoke('file:exists', filePath)
  },
  app: {
    getVersion: (): Promise<string> =>
      ipcRenderer.invoke('app:getVersion'),
    getPlatform: (): Promise<string> =>
      ipcRenderer.invoke('app:getPlatform')
  }
}

contextBridge.exposeInMainWorld('veltrix', veltrixApi)

export type VeltrixApi = typeof veltrixApi
