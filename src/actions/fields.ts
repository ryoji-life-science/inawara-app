'use server'

import { db, initDb } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { ALL_STATUS_KEYS } from '@/lib/constants'
import { DEFAULT_FIELDS } from '@/lib/seed-data'
import type { Field, StatusKey, CreateFieldInput, UpdateFieldInput } from '@/lib/types'

const MAX_NAME_LENGTH = 120
const MAX_FARMER_LENGTH = 120
const MAX_REPORTER_LENGTH = 80
const MAX_MEMO_LENGTH = 2000

async function ensureTable() {
  await initDb()
}

function normalizeStatus(value: unknown): StatusKey {
  if (typeof value === 'string' && ALL_STATUS_KEYS.includes(value as StatusKey)) {
    return value as StatusKey
  }
  return 'not_started'
}

function normalizeFieldId(id: number): number {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('無効な圃場IDです。')
  }
  return id
}

function normalizeRequiredText(
  value: unknown,
  label: string,
  maxLength: number
): string {
  if (typeof value !== 'string') {
    throw new Error(`${label}が不正です。`)
  }

  const normalized = value.trim()
  if (!normalized) {
    throw new Error(`${label}は必須です。`)
  }
  if (normalized.length > maxLength) {
    throw new Error(`${label}は${maxLength}文字以内で入力してください。`)
  }

  return normalized
}

function normalizeOptionalText(
  value: unknown,
  label: string,
  maxLength: number
): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value !== 'string') {
    throw new Error(`${label}が不正です。`)
  }

  const normalized = value.trim()
  if (normalized.length > maxLength) {
    throw new Error(`${label}は${maxLength}文字以内で入力してください。`)
  }

  return normalized
}

function normalizeCoordinate(
  value: unknown,
  label: '緯度' | '経度',
  min: number,
  max: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label}が不正です。`)
  }
  if (value < min || value > max) {
    throw new Error(`${label}が範囲外です。`)
  }
  return value
}

function normalizeOptionalMemo(value: unknown): string | null {
  if (value === undefined) {
    return null
  }
  return normalizeOptionalText(value, 'メモ', MAX_MEMO_LENGTH)
}

function readNumber(row: Record<string, unknown>, key: string, label: string): number {
  const value = row[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  throw new Error(`${label}の形式が不正です。`)
}

function readString(row: Record<string, unknown>, key: string, label: string): string {
  const value = row[key]
  if (typeof value === 'string') {
    return value
  }
  throw new Error(`${label}の形式が不正です。`)
}

function toField(row: Record<string, unknown>): Field {
  return {
    id: normalizeFieldId(readNumber(row, 'id', '圃場ID')),
    name: readString(row, 'name', '圃場名'),
    farmer: readString(row, 'farmer', '農家名'),
    latitude: normalizeCoordinate(readNumber(row, 'latitude', '緯度'), '緯度', -90, 90),
    longitude: normalizeCoordinate(readNumber(row, 'longitude', '経度'), '経度', -180, 180),
    status: normalizeStatus(row.status),
    memo: readString(row, 'memo', 'メモ'),
    reporter: readString(row, 'reporter', '記録者'),
    updated_at: readString(row, 'updated_at', '更新日時'),
    created_at: readString(row, 'created_at', '作成日時'),
  }
}

export async function getFields(): Promise<Field[]> {
  await ensureTable()
  const result = await db.execute(
    'SELECT id, name, farmer, latitude, longitude, status, memo, reporter, updated_at, created_at FROM fields ORDER BY id ASC'
  )
  return result.rows.map((row) => toField(row as Record<string, unknown>))
}

export async function createField(data: CreateFieldInput): Promise<void> {
  const name = normalizeRequiredText(data.name, '圃場名', MAX_NAME_LENGTH)
  const farmer = normalizeOptionalText(data.farmer, '農家名', MAX_FARMER_LENGTH)
  const latitude = normalizeCoordinate(data.latitude, '緯度', -90, 90)
  const longitude = normalizeCoordinate(data.longitude, '経度', -180, 180)

  await ensureTable()
  await db.execute({
    sql: 'INSERT INTO fields (name, farmer, latitude, longitude) VALUES (?, ?, ?, ?)',
    args: [name, farmer, latitude, longitude],
  })
  revalidatePath('/')
}

export async function updateFieldStatus(
  id: number,
  status: StatusKey,
  reporter: string,
  memo?: string
): Promise<void> {
  const normalizedId = normalizeFieldId(id)
  const normalizedStatus = normalizeStatus(status)
  const normalizedReporter = normalizeOptionalText(reporter, '記録者', MAX_REPORTER_LENGTH)
  const normalizedMemo = normalizeOptionalMemo(memo)
  await ensureTable()
  await db.execute({
    sql: 'UPDATE fields SET status = ?, reporter = ?, memo = COALESCE(?, memo), updated_at = datetime(\'now\') WHERE id = ?',
    args: [normalizedStatus, normalizedReporter, normalizedMemo, normalizedId],
  })
  revalidatePath('/')
}

export async function updateField(id: number, data: UpdateFieldInput): Promise<void> {
  const normalizedId = normalizeFieldId(id)
  await ensureTable()
  const updates: { sql: string; value: string }[] = []

  if (data.name !== undefined) {
    updates.push({
      sql: 'name = ?',
      value: normalizeRequiredText(data.name, '圃場名', MAX_NAME_LENGTH),
    })
  }
  if (data.farmer !== undefined) {
    updates.push({
      sql: 'farmer = ?',
      value: normalizeOptionalText(data.farmer, '農家名', MAX_FARMER_LENGTH),
    })
  }
  if (data.memo !== undefined) {
    updates.push({
      sql: 'memo = ?',
      value: normalizeOptionalText(data.memo, 'メモ', MAX_MEMO_LENGTH),
    })
  }

  if (updates.length === 0) return

  await db.execute({
    sql: `UPDATE fields SET ${updates.map((update) => update.sql).join(', ')}, updated_at = datetime('now') WHERE id = ?`,
    args: [...updates.map((update) => update.value), normalizedId],
  })
  revalidatePath('/')
}

export async function deleteField(id: number): Promise<void> {
  const normalizedId = normalizeFieldId(id)
  await ensureTable()
  await db.execute({
    sql: 'DELETE FROM fields WHERE id = ?',
    args: [normalizedId],
  })
  revalidatePath('/')
}

let _seeded = false

export async function seedDefaultFields(): Promise<void> {
  if (_seeded) return
  await ensureTable()
  const result = await db.execute('SELECT COUNT(*) as count FROM fields')
  const count = readNumber(result.rows[0] as Record<string, unknown>, 'count', '圃場件数')
  if (count > 0) {
    _seeded = true
    return
  }

  for (const f of DEFAULT_FIELDS) {
    await db.execute({
      sql: 'INSERT INTO fields (name, farmer, latitude, longitude, status, reporter, updated_at, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [f.name, f.farmer, f.latitude, f.longitude, f.status, f.reporter, f.updated_at, f.memo],
    })
  }
  _seeded = true
}
