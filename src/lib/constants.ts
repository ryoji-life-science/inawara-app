import type { StatusDef, StatusKey } from './types'

export const STATUSES: StatusDef[] = [
  { key: 'not_started', label: '未着手', color: '#9E9E9E', emoji: '⏳', progress: 0 },
  { key: 'harvest', label: '稲刈り', color: '#FF8F00', emoji: '🌾', progress: 17 },
  { key: 'raise', label: 'わら起こし', color: '#F57C00', emoji: '🔄', progress: 33 },
  { key: 'gather', label: 'わらよせ', color: '#AFB42B', emoji: '🧹', progress: 50 },
  { key: 'roll', label: '巻き取り', color: '#689F38', emoji: '🎍', progress: 67 },
  { key: 'burn', label: '燃やす', color: '#D84315', emoji: '🔥', progress: 83 },
  { key: 'fertilize', label: '施肥', color: '#1565C0', emoji: '🧪', progress: 100 },
]

export const STATUS_MAP = Object.fromEntries(
  STATUSES.map(s => [s.key, s])
) as Record<StatusKey, StatusDef>

export function getStatus(key: StatusKey): StatusDef {
  return STATUS_MAP[key] ?? STATUSES[0]
}

export function getStatusIndex(key: StatusKey): number {
  return STATUSES.findIndex(s => s.key === key)
}

export const ALL_STATUS_KEYS: StatusKey[] = STATUSES.map(s => s.key)

export const MAP_CENTER: [number, number] = [36.0860, 133.0870]
export const MAP_DEFAULT_ZOOM = 14
