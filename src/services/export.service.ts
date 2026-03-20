import { v4 as uuidv4 } from 'uuid'
import { compileTimeline } from './timeline-compiler'
import type { 
  VideoProject, TimelineData, ExportSettings, 
  EncoderInfo 
} from '../types'

export const exportService = {
  async startExport(
    project: VideoProject,
    timeline: TimelineData,
    settings: ExportSettings,
    encoderInfo: EncoderInfo
  ): Promise<{ success: boolean; outputPath?: string; error?: string; jobId?: string }> {
    const jobId = uuidv4()
    const command = compileTimeline(timeline, settings)
    
    // Send progress via IPC, but await the final encoding result!
    const result = await window.veltrix.export.start({
      jobId,
      command,
      encoderInfo: {
        encoder: encoderInfo.encoder,
        isHardware: encoderInfo.isHardware
      }
    })

    return { ...result, jobId }
  },

  cancelExport(jobId: string): Promise<boolean> {
    return window.veltrix.export.cancel(jobId)
  },

  async getDefaultOutputPath(title: string): Promise<string> {
    return window.veltrix.export.getDefaultPath(title)
  },
}
