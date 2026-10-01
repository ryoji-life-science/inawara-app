'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import type { Field } from '@/lib/types'
import { DISTRICTS, DISTRICT_NUMBER_BASE } from '@/lib/constants'
import { createField, updateField, deleteField } from '@/actions/fields'
import type { PendingPin } from './setup-map'
import { Eye, EyeOff, Trash2, X, Undo2, Plus } from 'lucide-react'

const SetupMap = dynamic(() => import('./setup-map').then((m) => m.SetupMap), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted animate-pulse" />,
})

type Props = {
  fields: Field[]
  onMutate: () => void
  onToggleVisibility: (id: number) => void
}

type Pending = PendingPin & { name: string }

function nextName(district: string, fields: Field[], unsynced: Pending[]): string {
  const base = DISTRICT_NUMBER_BASE[district]
  const names = [...fields.map((f) => f.name), ...unsynced.map((p) => p.name)]
  if (base === undefined) {
    const n = names.filter((x) => x.startsWith('新規')).length + 1
    return `新規${n}`
  }
  let max = base
  for (const name of names) {
    if (!/^\d{4}$/.test(name)) continue
    const num = Number(name)
    if (num > base && num <= base + 999 && num > max) max = num
  }
  return String(max + 1).padStart(4, '0')
}

export function FieldSetup({ fields, onMutate, onToggleVisibility }: Props) {
  const [addMode, setAddMode] = useState(false)
  const [district, setDistrict] = useState<string>(DISTRICTS[0])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null)
  const [pending, setPending] = useState<Pending[]>([])
  const [addedIds, setAddedIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const unsynced = pending.filter((p) => !fields.some((f) => f.name === p.name))
  const selectedField = selectedId ? fields.find((f) => f.id === selectedId) ?? null : null

  const draftName = nextName(district, fields, unsynced)

  function handleMapClick(lat: number, lng: number) {
    setDraft({ lat, lng })
  }

  async function handleConfirmAdd() {
    if (!draft) return
    const { lat, lng } = draft
    setDraft(null)
    const name = draftName
    const pin: Pending = { key: `${name}-${Date.now()}`, name, lat, lng }
    setPending((prev) => [...prev, pin])
    setError(null)
    try {
      const id = await createField({ name, farmer: district, latitude: lat, longitude: lng })
      setAddedIds((prev) => [...prev, id])
      onMutate()
    } catch (e) {
      setPending((prev) => prev.filter((p) => p.key !== pin.key))
      setError(e instanceof Error ? e.message : '追加に失敗しました')
    }
  }

  async function handleUndo() {
    const id = addedIds[addedIds.length - 1]
    if (!id) return
    setError(null)
    try {
      await deleteField(id)
      setAddedIds((prev) => prev.slice(0, -1))
      if (selectedId === id) setSelectedId(null)
      onMutate()
    } catch (e) {
      setError(e instanceof Error ? e.message : '取り消しに失敗しました')
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-3 py-2 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddMode((v) => !v); setSelectedId(null); setDraft(null) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold ${
              addMode ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" />
            {addMode ? '追加モード中' : '地点を追加'}
          </button>
          {addMode && (
            <>
              <select
                value={district}
                onChange={(e) => { setDistrict(e.target.value) }}
                className="border border-border rounded-lg px-2 py-2 text-sm bg-card flex-1 min-w-0"
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                onClick={handleUndo}
                disabled={addedIds.length === 0}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-muted disabled:opacity-40"
              >
                <Undo2 className="w-4 h-4" />
                戻す
              </button>
            </>
          )}
        </div>
        {addMode && (
          <p className="text-xs text-blue-700 mt-1.5">
            地図をタップして位置を決め、「追加」で確定します（地区：{district}、名称は自動採番）
          </p>
        )}
        {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
      </div>

      <div className="flex-1 min-h-0 relative">
        <SetupMap
          fields={fields}
          pending={unsynced}
          draft={draft}
          onDraftMove={(lat, lng) => setDraft({ lat, lng })}
          selectedId={selectedId}
          addMode={addMode}
          onSelect={setSelectedId}
          onMapClick={handleMapClick}
        />
        {addMode && draft && (
          <div className="absolute bottom-3 left-3 right-3 z-[1100] bg-card border border-border rounded-xl shadow-lg p-3 flex items-center gap-2">
            <div className="flex-1 min-w-0 text-sm">
              <span className="font-semibold">{draftName}</span>
              <span className="text-xs text-muted-foreground ml-2">{district}</span>
              <p className="text-[11px] text-muted-foreground">ピンはドラッグで微調整できます</p>
            </div>
            <button
              onClick={() => setDraft(null)}
              className="px-3 py-2.5 rounded-lg text-sm bg-muted"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirmAdd}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground"
            >
              追加
            </button>
          </div>
        )}
        {selectedField && (
          <SelectedPanel
            key={selectedField.id}
            field={selectedField}
            onClose={() => setSelectedId(null)}
            onMutate={onMutate}
            onToggleVisibility={onToggleVisibility}
            onDeleted={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}

function SelectedPanel({
  field,
  onClose,
  onMutate,
  onToggleVisibility,
  onDeleted,
}: {
  field: Field
  onClose: () => void
  onMutate: () => void
  onToggleVisibility: (id: number) => void
  onDeleted: () => void
}) {
  const [name, setName] = useState(field.name)
  const [district, setDistrict] = useState(field.farmer)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const changed = name.trim() !== field.name || district !== field.farmer

  function handleSave() {
    setError(null)
    startTransition(async () => {
      try {
        await updateField(field.id, { name, farmer: district })
        onMutate()
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました')
      }
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteField(field.id)
        onMutate()
        onDeleted()
      } catch (e) {
        setError(e instanceof Error ? e.message : '削除に失敗しました')
      }
    })
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1100] bg-card border-t border-border rounded-t-2xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">地点を編集</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="地点名"
          className="flex-1 min-w-0 border border-border rounded-lg px-3 py-2 text-sm bg-card outline-none focus:border-primary"
        />
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="border border-border rounded-lg px-2 py-2 text-sm bg-card"
        >
          <option value="">地区なし</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={isPending || !changed || !name.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40"
        >
          保存
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onToggleVisibility(field.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm bg-muted"
        >
          {field.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {field.hidden ? '表示する' : '非表示にする'}
        </button>
        {confirmDelete ? (
          <>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-2.5 rounded-lg text-sm bg-muted"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-red-50 text-red-700 disabled:opacity-50"
            >
              本当に削除
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm text-red-500 border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            削除
          </button>
        )}
      </div>
    </div>
  )
}
