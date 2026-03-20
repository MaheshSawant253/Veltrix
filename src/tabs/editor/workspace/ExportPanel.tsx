import React, { useState, useEffect } from 'react'
import type { VideoProject, TimelineData, ExportSettings, ExportJob, EncoderInfo, ExportProgressEvent } from '../../../types'
import { exportService } from '../../../services/export.service'

interface ExportPanelProps {
  project: VideoProject
  timeline: TimelineData
  encoderInfo: EncoderInfo
  onClose: () => void
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ project, timeline, encoderInfo, onClose }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    outputPath: '',
    resolution: project.settings.resolution,
    fps: project.settings.fps,
    quality: 'medium',
    format: 'mp4'
  })
  const [job, setJob] = useState<(Partial<ExportJob> & { timeRemaining?: number }) | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    exportService.getDefaultOutputPath(project.title).then(path => {
      setSettings(s => ({ ...s, outputPath: path }))
    })
  }, [project.title])

  const handleBrowse = async () => {
    const path = await window.veltrix.dialog.showSaveDialog()
    if (path) {
      setSettings(s => ({ ...s, outputPath: path }))
    }
  }

  const handleStart = async () => {
    if (!settings.outputPath) {
      setErrorMsg('Please select an output path.')
      return
    }
    setErrorMsg('')
    setIsExporting(true)
    setJob({ status: 'running', progress: 0, currentStep: 'Starting export...' })

    const cleanup = window.veltrix.export.onProgress((e: unknown) => {
      const event = e as ExportProgressEvent
      setJob(prev => ({ 
        ...prev, 
        progress: event.progress, 
        currentStep: event.currentStep,
        timeRemaining: event.timeRemaining,
        id: event.jobId
      }))
      if (event.progress >= 99) {
          // It's completing, wait for IPC response to finally close it
      }
    })

    try {
      const result = await exportService.startExport(project, timeline, settings, encoderInfo)

      if (result.success) {
        setJob({ status: 'completed', progress: 100, currentStep: 'Done!' })
      } else {
        setJob({ status: 'failed', errorMessage: result.error })
        setErrorMsg(result.error || 'Export failed.')
      }
    } catch (e: any) {
      setJob({ status: 'failed', errorMessage: e.message })
      setErrorMsg(e.message)
    } finally {
      cleanup()
      setIsExporting(false)
    }
  }

  const handleCancel = async () => {
    if (job?.id) {
      await exportService.cancelExport(job.id)
      setJob({ status: 'cancelled', currentStep: 'Cancelled by user.' })
    }
    setIsExporting(false)
  }

  const handleOpenFolder = () => {
    // get dir path
    const path = settings.outputPath
    if (path) {
      const dir = path.substring(0, Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/')))
      window.veltrix.export.openFolder(dir)
    }
  }

  const estimatedMinutes = Math.max(1, Math.ceil((timeline.totalDuration / 60) * (settings.quality === 'fast' ? 1 : settings.quality === 'medium' ? 2 : 4)))

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 520, backgroundColor: '#1e1e1e', borderRadius: 8,
        border: '1px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #333' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>Export Video</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Output Path */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: '#aaa' }}>Output File</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                value={settings.outputPath} 
                readOnly 
                style={{ flex: 1, padding: '8px 12px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: 4, fontSize: 13 }} 
              />
              <button 
                onClick={handleBrowse}
                disabled={isExporting}
                style={{ padding: '0 16px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: 4, cursor: isExporting ? 'default' : 'pointer' }}
              >
                Browse...
              </button>
            </div>
          </div>

          {!isExporting && job?.status !== 'completed' && job?.status !== 'failed' && (
            <>
              {/* Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px 8px', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#aaa' }}>Resolution</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['720p', '1080p', '4K'].map(res => {
                    const valueMap: Record<string, ExportSettings['resolution']> = { '720p': '1280x720', '1080p': '1920x1080', '4K': '3840x2160' }
                    const val = valueMap[res]
                    return (
                      <button 
                        key={res} 
                        onClick={() => setSettings(s => ({ ...s, resolution: val }))}
                        style={{
                          padding: '6px 12px', borderRadius: 4, border: '1px solid #333',
                          backgroundColor: settings.resolution === val ? '#6366f1' : '#111',
                          color: '#fff', cursor: 'pointer'
                        }}
                      >{res}</button>
                    )
                  })}
                </div>

                <span style={{ color: '#aaa' }}>Frame Rate</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[24, 30, 60].map(fps => (
                    <button 
                      key={fps} 
                      onClick={() => setSettings(s => ({ ...s, fps: fps as 24|30|60 }))}
                      style={{
                        padding: '6px 12px', borderRadius: 4, border: '1px solid #333',
                        backgroundColor: settings.fps === fps ? '#6366f1' : '#111',
                        color: '#fff', cursor: 'pointer'
                      }}
                    >{fps}</button>
                  ))}
                </div>

                <span style={{ color: '#aaa' }}>Quality</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Fast', 'Medium', 'High'].map(q => {
                    const val = q.toLowerCase() as ExportSettings['quality']
                    return (
                      <button 
                        key={q} 
                        onClick={() => setSettings(s => ({ ...s, quality: val }))}
                        style={{
                          padding: '6px 12px', borderRadius: 4, border: '1px solid #333',
                          backgroundColor: settings.quality === val ? '#6366f1' : '#111',
                          color: '#fff', cursor: 'pointer'
                        }}
                      >{q}</button>
                    )
                  })}
                </div>
              </div>

              <div style={{ padding: 16, backgroundColor: '#111', borderRadius: 6, border: '1px solid #222', fontSize: 13, color: '#aaa' }}>
                <div style={{ marginBottom: 4 }}>Encoder: <b>{encoderInfo.encoder}</b> ({encoderInfo.isHardware ? 'Hardware' : 'Software'})</div>
                <div>Est. time: <b>~{estimatedMinutes} min</b></div>
              </div>
            </>
          )}

          {isExporting && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ width: '100%', height: 8, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${job?.progress || 0}%`, backgroundColor: '#6366f1', transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#aaa', marginBottom: 4 }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>{job?.currentStep || 'Starting...'}</span>
                <span>{job?.progress || 0}%</span>
              </div>
              {job?.timeRemaining !== undefined && job?.timeRemaining > 0 && (
                <div style={{ fontSize: 12, color: '#888' }}>
                  Time remaining: ~{Math.ceil(job.timeRemaining)} seconds
                </div>
              )}
            </div>
          )}

          {job?.status === 'completed' && (
            <div style={{ padding: 20, textAlign: 'center', backgroundColor: '#112211', borderRadius: 6, border: '1px solid #224422' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ color: '#4ade80', fontWeight: 500, marginBottom: 16 }}>Export complete!</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={handleOpenFolder} style={{ padding: '8px 16px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: 4, cursor: 'pointer' }}>Open in Explorer</button>
                <button onClick={onClose} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )}

          {job?.status === 'failed' && (
            <div style={{ padding: 20, textAlign: 'center', backgroundColor: '#221111', borderRadius: 6, border: '1px solid #442222' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>❌</div>
              <div style={{ color: '#f87171', fontWeight: 500, marginBottom: 8 }}>Export failed!</div>
              <div style={{ fontSize: 12, color: '#ffaaaa', marginBottom: 16 }}>{errorMsg || job.errorMessage}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setJob(null)} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Try Again</button>
                <button onClick={onClose} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {!job || (job.status !== 'completed' && job.status !== 'failed') ? (
          <div style={{ padding: 16, borderTop: '1px solid #333', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#151515' }}>
            {isExporting ? (
              <button onClick={handleCancel} style={{ padding: '8px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                Cancel
              </button>
            ) : (
              <>
                <button onClick={onClose} style={{ padding: '8px 24px', backgroundColor: 'transparent', color: '#aaa', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                  Cancel
                </button>
                <button onClick={handleStart} style={{ padding: '8px 24px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                  Start Export
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
