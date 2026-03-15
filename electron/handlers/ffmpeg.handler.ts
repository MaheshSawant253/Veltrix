import { exec } from 'child_process'
import { existsSync } from 'fs'
import ffmpegPath from 'ffmpeg-static'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EncoderInfo {
  encoder: string
  gpu: string
  isHardware: boolean
  ffmpegPath: string
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getBinaryPath(): string | null {
  const raw = ffmpegPath as string
  if (!raw || !existsSync(raw)) return null
  return raw
}

// ─── Handlers (called from main.ts via IPC) ───────────────────────────────────

/**
 * Detect best available encoder.
 * Does NOT run a test encode — just checks binary existence.
 * Real encoder validation happens at first render attempt.
 */
export async function handleDetectEncoder(): Promise<EncoderInfo> {
  const binaryPath = getBinaryPath()

  if (!binaryPath) {
    return {
      encoder: 'libx264',
      gpu: 'CPU',
      isHardware: false,
      ffmpegPath: ''
    }
  }

  // On Intel iGPU: QSV requires Intel Media SDK runtime.
  // We detect it by checking for the runtime DLL, not by test-spawning.
  const qsvAvailable = checkQSVRuntime()

  if (qsvAvailable) {
    return {
      encoder: 'h264_qsv',
      gpu: 'Intel Quick Sync',
      isHardware: true,
      ffmpegPath: binaryPath
    }
  }

  // Default: CPU libx264 — always available
  return {
    encoder: 'libx264',
    gpu: 'CPU',
    isHardware: false,
    ffmpegPath: binaryPath
  }
}

/**
 * Check if Intel Quick Sync runtime DLLs are present on Windows.
 * No process spawn needed — just filesystem check.
 */
function checkQSVRuntime(): boolean {
  if (process.platform !== 'win32') return false

  const qsvDlls = [
    'C:\\Windows\\System32\\mfx_dispatch.dll',
    'C:\\Windows\\System32\\libmfx64-gen.dll',
    'C:\\Windows\\SysWOW64\\mfx_dispatch.dll',
  ]

  return qsvDlls.some(dll => existsSync(dll))
}

/**
 * Get FFmpeg version string.
 * Only called when user explicitly opens Settings tab — not at startup.
 */
export function handleGetVersion(): Promise<string> {
  return new Promise((resolve) => {
    const binaryPath = getBinaryPath()

    if (!binaryPath) {
      resolve('FFmpeg not found')
      return
    }

    // Quote path to handle spaces on Windows
    const cmd = `"${binaryPath}" -version`

    exec(cmd, { timeout: 8000 }, (error, stdout) => {
      if (error) {
        resolve('FFmpeg version unknown')
        return
      }
      resolve(stdout.split('\n')[0] ?? 'Unknown')
    })
  })
}