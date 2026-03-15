const getTimestamp = (): string => {
  return new Date().toISOString()
}

const formatMessage = (level: string, message: string): string => {
  return `[Veltrix][${getTimestamp()}][${level}] ${message}`
}

export const logger = {
  log: (message: string, ...args: unknown[]): void => {
    console.log(formatMessage('INFO', message), ...args)
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(formatMessage('WARN', message), ...args)
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(formatMessage('ERROR', message), ...args)
  }
}
