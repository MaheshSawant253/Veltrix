import { useEffect, useRef } from 'react'

interface TimelineRulerProps {
  duration: number
  zoom: number
}

export const TimelineRuler = ({ duration, zoom }: TimelineRulerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const observer = new ResizeObserver(() => {
      drawRuler()
    })
    observer.observe(container)

    function drawRuler() {
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = 32 * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = '32px'

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      const totalSeconds = Math.max(duration, 120)
      const pxPerSecond = (rect.width / totalSeconds) * zoom

      ctx.fillStyle = '#111111'
      ctx.fillRect(0, 0, rect.width, 32)

      for (let s = 0; s <= totalSeconds; s++) {
        const x = s * pxPerSecond
        if (x > rect.width) break

        if (s % 10 === 0) {
          // Major tick + label
          ctx.strokeStyle = '#555'
          ctx.beginPath()
          ctx.moveTo(x, 16)
          ctx.lineTo(x, 32)
          ctx.stroke()

          ctx.fillStyle = '#777'
          ctx.font = '10px monospace'
          const mins = Math.floor(s / 60)
          const secs = s % 60
          ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, x + 3, 13)
        } else if (s % 5 === 0) {
          // Medium tick
          ctx.strokeStyle = '#555'
          ctx.beginPath()
          ctx.moveTo(x, 22)
          ctx.lineTo(x, 32)
          ctx.stroke()
        } else {
          // Minor tick
          ctx.strokeStyle = '#3a3a3a'
          ctx.beginPath()
          ctx.moveTo(x, 26)
          ctx.lineTo(x, 32)
          ctx.stroke()
        }
      }
    }

    drawRuler()
    return () => observer.disconnect()
  }, [duration, zoom])

  return (
    <div ref={containerRef} className="h-8 w-full shrink-0 bg-[#111]">
      <canvas ref={canvasRef} />
    </div>
  )
}
