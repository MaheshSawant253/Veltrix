import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase, handleDbQuery, handleDbRun } from './handlers/db.handler'
import { handleDetectEncoder, handleGetVersion } from './handlers/ffmpeg.handler'
import {
  handleOpenMediaDialog,
  handleGetMediaDuration,
  handleFileExists
} from './handlers/file.handler'

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
      webSecurity: false
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
