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

export function handleGetMediaDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    // We already require exec & existsSync, let's use ffmpeg-static
    let binaryPath: string
    try {
      binaryPath = require('ffmpeg-static') as string
    } catch {
      binaryPath = 'ffmpeg'
    }

    if (!binaryPath || !existsSync(binaryPath)) {
      resolve(0)
      return
    }

    // ffprobe-style: use ffmpeg -i to read duration from stderr
    // Quote both binary and path for Windows spaces
    const cmd = `"${binaryPath}" -i "${filePath}"`

    // Note using child_process.exec instead of execFile for this
    import('child_process').then(({ exec }) => {
      exec(cmd, { timeout: 10000 }, (_error, _stdout, stderr) => {
        // FFmpeg always writes file info to stderr
        // Duration line looks like: "  Duration: 00:01:23.45,"
        const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)

        if (!match) {
          resolve(0)
          return
        }

        const hours = parseInt(match[1], 10)
        const minutes = parseInt(match[2], 10)
        const seconds = parseFloat(match[3])
        const total = hours * 3600 + minutes * 60 + seconds

        resolve(Math.round(total * 100) / 100) // round to 2dp
      })
    })
  })
}

export const handleFileExists = (filePath: string): Promise<boolean> => {
  return Promise.resolve(existsSync(filePath))
}
