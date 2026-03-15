import { dialog } from 'electron'
import { existsSync, statSync } from 'fs'
import { basename, extname } from 'path'
import { execFile } from 'child_process'

interface MediaFileInfo {
  filePath: string
  fileName: string
  fileType: 'video' | 'audio' | 'image'
  fileSize: number
  extension: string
}

const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'mkv', 'webm']
const AUDIO_EXTS = ['mp3', 'wav', 'aac', 'm4a', 'ogg']
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

function detectFileType(ext: string): 'video' | 'audio' | 'image' {
  if (VIDEO_EXTS.includes(ext)) return 'video'
  if (AUDIO_EXTS.includes(ext)) return 'audio'
  return 'image'
}

export const handleOpenMediaDialog = async (): Promise<MediaFileInfo[]> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Media', extensions: [...VIDEO_EXTS, ...AUDIO_EXTS, ...IMAGE_EXTS] },
      { name: 'Video', extensions: VIDEO_EXTS },
      { name: 'Audio', extensions: AUDIO_EXTS },
      { name: 'Image', extensions: IMAGE_EXTS }
    ],
    title: 'Import Media Files'
  })

  if (result.canceled || result.filePaths.length === 0) return []

  return result.filePaths.map((filePath) => {
    const ext = extname(filePath).slice(1).toLowerCase()
    const stat = statSync(filePath)
    return {
      filePath,
      fileName: basename(filePath),
      fileType: detectFileType(ext),
      fileSize: stat.size,
      extension: ext
    }
  })
}

export const handleGetMediaDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    try {
      // Use ffmpeg-static or system ffmpeg
      let binaryPath: string
      try {
        binaryPath = require('ffmpeg-static') as string
      } catch {
        binaryPath = 'ffmpeg'
      }

      if (!binaryPath || !existsSync(binaryPath)) {
        binaryPath = 'ffmpeg'
      }

      execFile(
        binaryPath,
        ['-i', filePath, '-f', 'null', '-'],
        { timeout: 10000, windowsHide: true },
        (_error, _stdout, stderr) => {
          // ffmpeg writes info to stderr
          const output = stderr || ''
          const match = output.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/)
          if (match) {
            const hours = parseInt(match[1], 10)
            const minutes = parseInt(match[2], 10)
            const seconds = parseInt(match[3], 10)
            const centiseconds = parseInt(match[4], 10)
            resolve(hours * 3600 + minutes * 60 + seconds + centiseconds / 100)
          } else {
            resolve(0)
          }
        }
      )
    } catch {
      resolve(0)
    }
  })
}

export const handleFileExists = (filePath: string): Promise<boolean> => {
  return Promise.resolve(existsSync(filePath))
}
