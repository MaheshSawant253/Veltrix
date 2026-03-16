import { exec } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { ChildProcess } from 'child_process'
import ffmpegPath from 'ffmpeg-static'
import type { ExportCommand, ExportProgressEvent } from '../../src/types'

// Track active export process for cancellation
let activeExportProcess: ChildProcess | null = null
let activeJobId: string | null = null

export interface ExportStartParams {
  jobId: string
  command: ExportCommand
  encoderInfo: { encoder: string; isHardware: boolean }
}

export async function handleStartExport(
  params: ExportStartParams,
  onProgress: (event: ExportProgressEvent) => void
): Promise<{ success: boolean; outputPath?: string; error?: string }> {

  const { jobId, command, encoderInfo } = params
  const binary = ffmpegPath as string

  if (!binary || !existsSync(binary)) {
    return { success: false, error: 'FFmpeg binary not found' }
  }

  // Ensure output directory exists
  const outDir = dirname(command.outputPath)
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true })
  }

  // Build input arguments
  // Images need special flags: -loop 1 -framerate fps -t duration
  const inputArgs: string[] = []
  
  command.inputs.forEach(input => {
    if (input.type === 'image') {
      inputArgs.push('-loop', '1')
      inputArgs.push('-framerate', '30')
    }
    inputArgs.push('-i', `"${input.filePath}"`)
  })

  // Replace encoder placeholder in outputOptions
  const outputOptions = [...command.outputOptions]
  const encoderIdx = outputOptions.indexOf('libx264')
  if (encoderIdx !== -1 && encoderInfo.isHardware) {
    outputOptions[encoderIdx] = encoderInfo.encoder
    // QSV uses different quality params
    if (encoderInfo.encoder === 'h264_qsv') {
      const crfIdx = outputOptions.indexOf('-crf')
      if (crfIdx !== -1) {
        outputOptions[crfIdx] = '-global_quality'
      }
    }
  }

  // Build full FFmpeg command
  const filterArg = command.filterComplex 
    ? `-filter_complex "${command.filterComplex}"` 
    : ''

  const fullCmd = [
    `"${binary}"`,
    inputArgs.join(' '),
    filterArg,
    outputOptions.join(' '),
    `"${command.outputPath}"`,
    '-progress pipe:1',  // send progress to stdout
  ].filter(Boolean).join(' ')

  return new Promise((resolve) => {
    const startTime = Date.now()
    activeJobId = jobId

    activeExportProcess = exec(
      fullCmd,
      { maxBuffer: 1024 * 1024 * 10 },
      (error, _stdout, _stderr) => {
        activeExportProcess = null
        activeJobId = null

        if (error) {
          if (error.killed) {
            resolve({ success: false, error: 'Export cancelled' })
          } else {
            resolve({ 
              success: false, 
              error: error.message.slice(0, 500) 
            })
          }
        } else {
          resolve({ 
            success: true, 
            outputPath: command.outputPath 
          })
        }
      }
    )

    // Parse FFmpeg progress from stdout (-progress pipe:1)
    activeExportProcess.stdout?.on('data', (data: string) => {
      const lines = data.toString().split('\n')
      const timeVal = lines
        .find(l => l.startsWith('out_time_ms='))
        ?.split('=')?.[1]

      if (timeVal && command.totalDuration > 0) {
        const currentSeconds = parseInt(timeVal, 10) / 1_000_000
        const progress = Math.min(
          99,  // never reach 100 until process exits
          Math.round((currentSeconds / command.totalDuration) * 100)
        )
        const elapsed = (Date.now() - startTime) / 1000
        const remaining = progress > 0
          ? (elapsed / progress) * (100 - progress)
          : undefined

        onProgress({
          jobId,
          progress,
          currentStep: `Encoding... ${formatTime(currentSeconds)} / ${formatTime(command.totalDuration)}`,
          timeElapsed: elapsed,
          timeRemaining: remaining,
        })
      }
    })

    // Log stderr for debugging (not for progress)
    activeExportProcess.stderr?.on('data', (_data: string) => {
      // Intentionally not parsing stderr for progress
      // -progress pipe:1 sends structured progress to stdout
    })
  })
}

export function handleCancelExport(jobId: string): boolean {
  if (activeJobId === jobId && activeExportProcess) {
    activeExportProcess.kill('SIGTERM')
    activeExportProcess = null
    activeJobId = null
    return true
  }
  return false
}

export async function handleGetDefaultOutputPath(
  projectTitle: string
): Promise<string> {
  const { app } = await import('electron')
  const docs = app.getPath('documents')
  const safe = projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const timestamp = new Date().toISOString().slice(0,10)
  return `${docs}\\Veltrix\\exports\\${safe}_${timestamp}.mp4`
}

// Helper
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2,'0')}`
}
