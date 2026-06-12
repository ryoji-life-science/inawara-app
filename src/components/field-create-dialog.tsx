'use client'

import { useState, useTransition } from 'react'
import { createField } from '@/actions/fields'
import { MapPin } from 'lucide-react'

type Props = {
  lat: number
  lng: number
  onClose: () => void
  onMutate: () => void
}

export function FieldCreateDialog({ lat, lng, onClose, onMutate }: Props) {
  const [name, setName] = useState('')
  const [farmer, setFarmer] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        await createField({
          name: name.trim(),
          farmer: farmer.trim(),
          latitude: lat,
          longitude: lng,
        })
        onMutate()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '登録に失敗しました')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card rounded-t-2xl w-full max-w-[430px] p-5 animate-in slide-in-from-bottom duration-300">
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">新しい圃場を登録</h2>
        </div>

        <div className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg px-3 py-2">
          📍 座標: {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs text-muted-foreground mb-1.5">圃場名 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 菱浦 北区画"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-card"
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs text-muted-foreground mb-1.5">農家名</label>
            <input
              type="text"
              value={farmer}
              onChange={(e) => setFarmer(e.target.value)}
              placeholder="例: 山田太郎"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-card"
            />
          </div>

          {error && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-muted text-foreground"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground disabled:opacity-50"
            >
              登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
