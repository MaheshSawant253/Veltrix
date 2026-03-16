import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { initDatabase, handleDbQuery, handleDbRun } from './handlers/db.handler'
import { handleDetectEncoder, handleGetVersion } from './handlers/ffmpeg.handler'
import {
  handleOpenMediaDialog,
  handleGetMediaDuration,
  handleFileExists
} from './handlers/file.handler'
import { 
  handleStartExport, 
  handleCancelExport,
  handleGetDefaultOutputPath 
} from './handlers/export.handler'

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#0f0f0f',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required' // ensure media never gets blocked
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const registerIpcHandlers = (): void => {
  // Database handlers
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) =>
    handleDbQuery(sql, params)
  )
  ipcMain.handle('db:run', (_event, sql: string, params?: unknown[]) =>
    handleDbRun(sql, params)
  )

  // FFmpeg handlers
  ipcMain.handle('ffmpeg:detectEncoder', () => handleDetectEncoder())
  ipcMain.handle('ffmpeg:getVersion', () => handleGetVersion())

  // File handlers
  ipcMain.handle('file:openMediaDialog', () => handleOpenMediaDialog())
  ipcMain.handle('file:getMediaDuration', (_event, path: string) =>
    handleGetMediaDuration(path)
  )
  ipcMain.handle('file:exists', (_event, path: string) =>
    handleFileExists(path)
  )

  // App handlers
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getPlatform', () => process.platform)

  // Export handlers
  ipcMain.handle('export:getDefaultPath', (_, title: string) =>
    handleGetDefaultOutputPath(title)
  )

  ipcMain.handle('export:start', async (event, params) => {
    return handleStartExport(params, (progressEvent) => {
      // Send progress events back to renderer
      event.sender.send('export:progress', progressEvent)
    })
  })

  ipcMain.handle('export:cancel', (_, jobId: string) =>
    handleCancelExport(jobId)
  )

  ipcMain.handle('export:openFolder', (_, folderPath: string) => {
    const { shell } = require('electron')
    shell.openPath(folderPath)
  })

  ipcMain.handle('dialog:showSaveDialog', async () => {
    const result = await dialog.showSaveDialog({
      title: 'Export Video',
      defaultPath: 'output.mp4',
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }]
    })
    return result.canceled ? null : result.filePath
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
