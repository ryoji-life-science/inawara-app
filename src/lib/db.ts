import 'server-only'

import { createClient, type Client } from '@libsql/client'

let _db: Client | null = null
let _initPromise: Promise<void> | null = null

function getDb(): Client {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL
    if (!url) {
      throw new Error(
        'TURSO_DATABASE_URL が設定されていません。.env.local を確認してください。'
      )
    }
    _db = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return _db
}

export const db = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getDb()
    const value = Reflect.get(client, prop, client)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export async function initDb() {
  if (_initPromise) {
    return _initPromise
  }

  _initPromise = (async () => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS fields (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        farmer TEXT NOT NULL DEFAULT '',
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_started',
        memo TEXT NOT NULL DEFAULT '',
        reporter TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
    await db.execute(`ALTER TABLE fields ADD COLUMN memo_updated_at TEXT`).catch(() => {})
    await db.execute(`ALTER TABLE fields ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0`).catch(() => {})
    await db.execute(`
      CREATE TABLE IF NOT EXISTS field_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        field_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        reporter TEXT NOT NULL DEFAULT '',
        changed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)
  })()

  try {
    await _initPromise
  } catch (error) {
    _initPromise = null
    throw error
  }
}
