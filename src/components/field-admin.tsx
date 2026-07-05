'use client'

import { useState, useTransition } from 'react'
import type { Field } from '@/lib/types'
import { DISTRICTS } from '@/lib/constants'
import { updateField } from '@/actions/fields'
import { Check, Pencil } from 'lucide-react'

type Props = {
  fields: Field[]
  onMutate: () => void
}

export function FieldAdmin({ fields, onMutate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingDistrict, setEditingDistrict] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startEdit(field: Field) {
    setEditingId(field.id)
    setEditingName(field.name)
    setEditingDistrict(field.farmer)
    setError(null)
  }

  function handleSave(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await updateField(id, { name: editingName, farmer: editingDistrict })
        onMutate()
        setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました')
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <p className="text-xs text-muted-foreground px-4 pt-4 pb-2">鉛筆アイコンをタップして編集できます</p>

      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <div className="divide-y divide-border">
        {fields.map((field) => (
          <div key={field.id} className="flex items-start gap-3 px-4 py-3">
            <span className="w-7 text-xs text-muted-foreground text-right shrink-0 pt-1">{field.id}</span>

            {editingId === field.id ? (
              <>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder="圃場名"
                    className="border border-primary rounded-lg px-3 py-1.5 text-sm outline-none bg-card w-full"
                  />
                  <select
                    value={editingDistrict}
                    onChange={(e) => setEditingDistrict(e.target.value)}
                    className="border border-border rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary bg-card w-full"
                  >
                    <option value="">地区名を選択</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleSave(field.id)}
                  disabled={isPending || !editingName.trim()}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50 mt-0.5"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{field.name}</span>
                  {field.farmer && (
                    <span className="text-xs text-muted-foreground">📍 {field.farmer}</span>
                  )}
                </div>
                <button
                  onClick={() => startEdit(field)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted mt-0.5"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
