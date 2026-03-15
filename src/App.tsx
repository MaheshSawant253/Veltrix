import { useEffect, useRef } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { useAppStore } from './store/app.store'
import { logger } from './utils/logger'

const App = () => {
  const setEncoderInfo = useAppStore((s) => s.setEncoderInfo)
  const encoderInfo = useAppStore((s) => s.encoderInfo)
  const hasDetected = useRef(false)

  useEffect(() => {
    if (hasDetected.current || encoderInfo) return
    hasDetected.current = true

    const detectEncoder = async () => {
      try {
        logger.log('Detecting encoder...')
        const result = await window.veltrix.ffmpeg.detectEncoder()
        setEncoderInfo(result)
        logger.log('Encoder detected:', JSON.stringify(result))
      } catch (error) {
        logger.error('Encoder detection failed:', error)
      }
    }

    detectEncoder()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <MainLayout />
}

export default App
