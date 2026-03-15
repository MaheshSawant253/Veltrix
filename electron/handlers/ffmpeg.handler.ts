import { execFile } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'

interface EncoderResult {
  encoder: string
  gpu: string
  isHardware: boolean
}

const getFfmpegPath = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const staticPath = require('ffmpeg-static') as string | null

  if (staticPath && existsSync(staticPath)) {
    console.log(`[Veltrix] Found bundled ffmpeg at: ${staticPath}`)
    return staticPath
  }

  // Fallback 1: look in node_modules directly
  const fallback = join(__dirname, '../../node_modules/ffmpeg-static/ffmpeg.exe')
  if (existsSync(fallback)) {
    console.log(`[Veltrix] Found ffmpeg in node_modules directly: ${fallback}`)
    return fallback
  }

  // Fallback 2: System ffmpeg
  console.log('[Veltrix] Bundled ffmpeg not found or inaccessible, trying system ffmpeg...')
  return 'ffmpeg'
}

const testEncoder = (encoder: string): Promise<boolean> => {
  return new Promise((resolve) => {
    let binary = getFfmpegPath()
    const args = [
      '-f', 'lavfi',
      '-i', 'color=black:s=64x64:d=1',
      '-c:v', encoder,
      '-f', 'null',
      '-'
    ]

    execFile(binary, args, { timeout: 15000 }, (error) => {
      if (error) {
        // If bundled failed with spawn error, try system fallback immediately
        if (binary !== 'ffmpeg' && ((error as any).code === 'UNKNOWN' || (error as any).syscall === 'spawn')) {
          binary = 'ffmpeg'
          execFile(binary, args, { timeout: 15000 }, (err2) => {
            if (err2) {
              resolve(false)
            } else {
              resolve(true)
            }
          })
          return
        }

        resolve(false)
        return
      }
      resolve(true)
    })
  })
}

export const handleDetectEncoder = async (): Promise<EncoderResult> => {
  try {
    const encoders: { name: string; gpu: string; isHardware: boolean }[] = [
      { name: 'h264_qsv', gpu: 'Intel Quick Sync', isHardware: true },
      { name: 'libx264', gpu: 'CPU', isHardware: false }
    ]

    for (const enc of encoders) {
      const supported = await testEncoder(enc.name)
      if (supported) {
        return { encoder: enc.name, gpu: enc.gpu, isHardware: enc.isHardware }
      }
    }

    return { encoder: 'libx264', gpu: 'CPU', isHardware: false }
  } catch (error) {
    console.error('[Veltrix] handleDetectEncoder fatal error:', error)
    return { encoder: 'libx264', gpu: 'CPU', isHardware: false }
  }
}

export const handleGetVersion = async (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const binary = getFfmpegPath()
      execFile(binary, ['-version'], { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve('unknown')
          return
        }
        const versionMatch = stdout.match(/ffmpeg version (\S+)/)
        resolve(versionMatch ? versionMatch[1] : 'unknown')
      })
    } catch (error) {
      console.error('[Veltrix] FFmpeg version check failed:', error)
      resolve('unknown')
    }
  })
}
