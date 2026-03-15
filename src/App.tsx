import { useEffect } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { useAppStore } from './store/app.store'

const App = () => {
  const encoderInfo = useAppStore((s) => s.encoderInfo)
  const setEncoderInfo = useAppStore((s) => s.setEncoderInfo)

  useEffect(() => {
    // Guard: skip if already detected
    if (encoderInfo !== null) return

    const detect = async () => {
      try {
        const info = await window.veltrix.ffmpeg.detectEncoder()
        setEncoderInfo(info)
      } catch (err) {
        console.error('Encoder detection failed:', err)
        // Set safe fallback so we never block the app
        setEncoderInfo({ encoder: 'libx264', gpu: 'CPU', isHardware: false })
      }
    }

    detect()
  }, []) // Empty dependency array — runs once only

  return <MainLayout />
}

export default App
