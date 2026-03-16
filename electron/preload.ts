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
  },
  export: {
    getDefaultPath: (title: string): Promise<string> => 
      ipcRenderer.invoke('export:getDefaultPath', title),
      
    start: (params: unknown): Promise<{ success: boolean; outputPath?: string; error?: string }> => 
      ipcRenderer.invoke('export:start', params),
      
    cancel: (jobId: string): Promise<boolean> => 
      ipcRenderer.invoke('export:cancel', jobId),
      
    openFolder: (path: string): Promise<void> => 
      ipcRenderer.invoke('export:openFolder', path),
      
    onProgress: (callback: (event: unknown) => void) => {
      ipcRenderer.on('export:progress', (_, event) => callback(event))
      // Return cleanup function
      return () => ipcRenderer.removeAllListeners('export:progress')
    },
  },
  dialog: {
    showSaveDialog: (): Promise<string | null> => 
      ipcRenderer.invoke('dialog:showSaveDialog'),
  }
}

contextBridge.exposeInMainWorld('veltrix', veltrixApi)

export type VeltrixApi = typeof veltrixApi
