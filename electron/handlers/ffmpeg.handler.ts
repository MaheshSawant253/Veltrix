import { execFile } from 'child_process'
import { existsSync } from 'fs'
import ffmpegPath from 'ffmpeg-static'

interface EncoderResult {
  encoder: string
  gpu: string
  isHardware: boolean
}

const testEncoder = (encoder: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Verify binary exists before attempting spawn
    const binaryPath = ffmpegPath as string
    if (!binaryPath || !existsSync(binaryPath)) {
      resolve(false)
      return
    }

    const args = [
      '-f', 'lavfi',
      '-i', 'color=black:s=64x64:d=1',
      '-c:v', encoder,
      '-f', 'null',
      '-'
    ]

    execFile(
      binaryPath,
      args,
      {
        timeout: 10000,
        windowsHide: true
        // shell: false is important — do NOT use shell: true
        // as it breaks path resolution on Windows
      },
      (error) => {
        resolve(!error)
      }
    )
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

    // All encoders failed — return safe default
    return { encoder: 'libx264', gpu: 'CPU', isHardware: false }
  } catch (error) {
    console.error('[Veltrix] Encoder detection failed:', error)
    return { encoder: 'libx264', gpu: 'CPU', isHardware: false }
  }
}

export const handleGetVersion = async (): Promise<string> => {
  return new Promise((resolve) => {
    const binaryPath = ffmpegPath as string
    if (!binaryPath || !existsSync(binaryPath)) {
      resolve('FFmpeg not found')
      return
    }

    execFile(
      binaryPath,
      ['-version'],
      { timeout: 5000, windowsHide: true },
      (error, stdout) => {
        if (error) {
          resolve('FFmpeg version unknown')
          return
        }
        // Extract just first line: "ffmpeg version X.X.X ..."
        const firstLine = stdout.split('\n')[0] ?? 'Unknown'
        resolve(firstLine)
      }
    )
  })
}
