import type { TimelineData, ExportSettings, TimelineClip, ExportCommand, InputFile } from '../types'

export function compileTimeline(
  timeline: TimelineData,
  settings: ExportSettings
): ExportCommand {
  const inputs: InputFile[] = []
  const filterParts: string[] = []
  let inputIndex = 0

  // ── Collect all unique media files ──────────────────────────

  // Map filePath → input index (avoid duplicate inputs)
  const fileInputMap = new Map<string, number>()

  function getOrAddInput(
    filePath: string,
    type: 'video' | 'audio' | 'image'
  ): number {
    if (fileInputMap.has(filePath)) {
      return fileInputMap.get(filePath)!
    }
    const idx = inputIndex++
    inputs.push({ index: idx, filePath, type })
    fileInputMap.set(filePath, idx)
    return idx
  }

  // ── Process video track ──────────────────────────────────────

  const videoTrack = timeline.tracks.find(t => t.type === 'video')
  const videoClips = videoTrack?.clips
    .filter(c => c.filePath)
    .sort((a, b) => a.startTime - b.startTime) ?? []

  const imageExts = ['jpg','jpeg','png','webp','gif']

  const videoSegments: string[] = []
  
  videoClips.forEach((clip, i) => {
    const ext = clip.filePath!.split('.').pop()?.toLowerCase() ?? ''
    const isImage = imageExts.includes(ext)
    const idx = getOrAddInput(
      clip.filePath!,
      isImage ? 'image' : 'video'
    )

    if (isImage) {
      // Image: loop for duration, scale to resolution
      const [w, h] = settings.resolution.split('x').map(Number)
      // Images added with -loop 1 -t duration flags
      // Mark as image input for special handling
      inputs[inputs.findIndex(inp => inp.index === idx)].type = 'image'
      
      // Scale and pad to target resolution (letterbox)
      filterParts.push(
        `[${idx}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
        `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,` +
        `setsar=1,fps=${settings.fps},` +
        `trim=duration=${clip.duration},` +
        `setpts=PTS-STARTPTS[v${i}]`
      )
    } else {
      // Video: trim and normalize
      const [w, h] = settings.resolution.split('x').map(Number)
      const trimStart = clip.trimIn
      const trimEnd = clip.trimIn + clip.duration
      
      filterParts.push(
        `[${idx}:v]trim=start=${trimStart.toFixed(3)}:` +
        `end=${trimEnd.toFixed(3)},` +
        `setpts=PTS-STARTPTS,` +
        `scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
        `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black,` +
        `setsar=1,fps=${settings.fps}[v${i}]`
      )
    }
    videoSegments.push(`[v${i}]`)
  })

  // Concatenate all video segments
  let videoOutput = '[vout]'
  if (videoSegments.length === 0) {
    // No video — generate black background
    const [w, h] = settings.resolution.split('x').map(Number)
    filterParts.push(
      `color=black:s=${w}x${h}:r=${settings.fps}:` +
      `d=${timeline.totalDuration}[vout]`
    )
  } else if (videoSegments.length === 1) {
    // Single clip — rename output
    filterParts.push(
      `${videoSegments[0]}copy[vout]`
    )
  } else {
    // Multiple clips — concat
    filterParts.push(
      `${videoSegments.join('')}concat=n=${videoSegments.length}` +
      `:v=1:a=0[vout]`
    )
  }

  // ── Process text clips (drawtext filter) ────────────────────

  const textTrack = timeline.tracks.find(t => t.type === 'text')
  const textClips = textTrack?.clips
    .sort((a, b) => a.startTime - b.startTime) ?? []

  let currentVideoLabel = 'vout'
  
  textClips.forEach((clip, i) => {
    const text = (clip.content || clip.name || 'Text')
      .replace(/'/g, "\\'")   // escape single quotes for FFmpeg
      .replace(/:/g, '\\:')  // escape colons
    
    const isTitle = clip.name?.toLowerCase().includes('title')
    const fontSize = isTitle ? 72 : 42
    const yExpr = isTitle 
      ? '(h/2)-(text_h/2)'  // center
      : 'h-text_h-60'       // bottom subtitle position

    const nextLabel = `vtxt${i}`
    
    filterParts.push(
      `[${currentVideoLabel}]drawtext=` +
      `text='${text}':` +
      `fontsize=${fontSize}:` +
      `fontcolor=white:` +
      `x=(w-text_w)/2:y=${yExpr}:` +
      `shadowcolor=black:shadowx=2:shadowy=2:` +
      `enable='between(t,${clip.startTime.toFixed(3)},` +
      `${(clip.startTime + clip.duration).toFixed(3)})'` +
      `[${nextLabel}]`
    )
    currentVideoLabel = nextLabel
  })

  // Final video label after text processing
  const finalVideoLabel = textClips.length > 0 
    ? `vtxt${textClips.length - 1}` 
    : 'vout'

  // ── Process audio tracks ─────────────────────────────────────

  const audioTrack = timeline.tracks.find(t => t.type === 'audio')
  const audioClips = audioTrack?.clips
    .filter(c => c.filePath)
    .sort((a, b) => a.startTime - b.startTime) ?? []

  // Also collect audio from video clips
  const videoAudioClips = videoClips.filter(c => {
    const ext = c.filePath!.split('.').pop()?.toLowerCase() ?? ''
    return !imageExts.includes(ext) // videos have audio, images don't
  })

  const audioSegments: string[] = []

  // Video clip audio streams
  videoAudioClips.forEach((clip, i) => {
    const idx = fileInputMap.get(clip.filePath!)!
    const trimStart = clip.trimIn
    const trimEnd = clip.trimIn + clip.duration

    filterParts.push(
      `[${idx}:a]atrim=start=${trimStart.toFixed(3)}:` +
      `end=${trimEnd.toFixed(3)},` +
      `asetpts=PTS-STARTPTS[va${i}]`
    )
    audioSegments.push(`[va${i}]`)
  })

  // Dedicated audio clips
  audioClips.forEach((clip, i) => {
    const idx = getOrAddInput(clip.filePath!, 'audio')
    const trimStart = clip.trimIn
    const trimEnd = clip.trimIn + clip.duration

    filterParts.push(
      `[${idx}:a]atrim=start=${trimStart.toFixed(3)}:` +
      `end=${trimEnd.toFixed(3)},` +
      `asetpts=PTS-STARTPTS[aa${i}]`
    )
    audioSegments.push(`[aa${i}]`)
  })

  let audioOutput = 'aout'
  if (audioSegments.length === 0) {
    // No audio — generate silence
    filterParts.push(
      `aevalsrc=0:d=${timeline.totalDuration}[aout]`
    )
  } else if (audioSegments.length === 1) {
    filterParts.push(`${audioSegments[0]}acopy[aout]`)
  } else {
    // Mix all audio streams
    filterParts.push(
      `${audioSegments.join('')}` +
      `amix=inputs=${audioSegments.length}:` +
      `duration=longest:dropout_transition=0[aout]`
    )
  }

  // ── Build output options ─────────────────────────────────────

  const qualityMap = {
    high:   { crf: '18', preset: 'slow'     },
    medium: { crf: '23', preset: 'medium'   },
    fast:   { crf: '28', preset: 'veryfast' },
  }
  const q = qualityMap[settings.quality]

  const outputOptions = [
    '-map', `[${finalVideoLabel}]`,
    '-map', '[aout]',
    '-c:v', 'libx264',   // encoder resolved at runtime in main process
    '-crf', q.crf,
    '-preset', q.preset,
    '-c:a', 'aac',
    '-b:a', '192k',
    '-movflags', '+faststart',
    '-y',  // overwrite output
  ]

  return {
    inputs,
    filterComplex: filterParts.join(';'),
    outputOptions,
    outputPath: settings.outputPath,
    totalDuration: timeline.totalDuration,
  }
}
