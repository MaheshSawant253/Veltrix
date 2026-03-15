import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'

let db: Database.Database | null = null

const getDbPath = (): string => {
  return join(app.getPath('userData'), 'veltrix.db')
}

const getSchemaPath = (): string => {
  // In dev, schema.sql is at project root; in prod, it's bundled alongside main
  if (app.isPackaged) {
    return join(__dirname, '../../db/schema.sql')
  }
  return join(__dirname, '../../db/schema.sql')
}

export const initDatabase = (): void => {
  try {
    const dbPath = getDbPath()
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    const schemaPath = getSchemaPath()
    const schema = readFileSync(schemaPath, 'utf-8')
    db.exec(schema)

    // Add columns introduced in Phase 2 (individual try/catch to skip if already exists)
    try { db.exec('ALTER TABLE channels ADD COLUMN description TEXT DEFAULT ""') } catch { /* Column already exists, skip */ }
    try { db.exec('ALTER TABLE channels ADD COLUMN editing_style TEXT DEFAULT "Educational"') } catch { /* Column already exists, skip */ }
    try { db.exec('ALTER TABLE channels ADD COLUMN tone_of_voice TEXT DEFAULT "Professional"') } catch { /* Column already exists, skip */ }
    try { db.exec('ALTER TABLE channels ADD COLUMN target_audience TEXT DEFAULT ""') } catch { /* Column already exists, skip */ }
    try { db.exec('ALTER TABLE channels ADD COLUMN upload_frequency TEXT DEFAULT "Weekly"') } catch { /* Column already exists, skip */ }

    console.log(`[Veltrix] Database initialized at: ${dbPath}`)
  } catch (error) {
    console.error('[Veltrix] Database initialization failed:', error)
  }
}

export const handleDbQuery = (sql: string, params?: unknown[]): unknown[] => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  } catch (error) {
    console.error('[Veltrix] Database query error:', error)
    return []
  }
}

export const handleDbRun = (
  sql: string,
  params?: unknown[]
): { changes: number; lastInsertRowid: number | bigint } => {
  try {
    if (!db) throw new Error('Database not initialized')
    const stmt = db.prepare(sql)
    const result = params ? stmt.run(...params) : stmt.run()
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid }
  } catch (error) {
    console.error('[Veltrix] Database run error:', error)
    return { changes: 0, lastInsertRowid: 0 }
  }
}
