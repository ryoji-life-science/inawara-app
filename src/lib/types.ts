export type StatusKey = 'not_started' | 'harvest' | 'raise' | 'gather' | 'roll' | 'burn' | 'fertilize'

export type StatusDef = {
  key: StatusKey
  label: string
  color: string
  emoji: string
  progress: number
}

export type Field = {
  id: number
  name: string
  farmer: string
  latitude: number
  longitude: number
  status: StatusKey
  memo: string
  reporter: string
  updated_at: string
  memo_updated_at: string | null
  created_at: string
}

export type CreateFieldInput = {
  name: string
  farmer: string
  latitude: number
  longitude: number
}

export type UpdateFieldInput = {
  name?: string
  farmer?: string
  memo?: string
}
