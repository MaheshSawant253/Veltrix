import type { VeltrixApi } from '../electron/preload'

declare global {
  interface Window {
    veltrix: VeltrixApi
  }
}
