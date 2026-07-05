'use client'

import { useState, useTransition } from 'react'
import type { Field } from '@/lib/types'
import { updateField } from '@/actions/fields'
import { Check, Pencil } from 'lucide-react'

type Props = {
  fields: Field[]
  onMutate: () => void
}

export function FieldAdmin({ fields, onMutate }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startEdit(field: Field) {
    setEditingId(field.id)
    setEditingName(field.name)
    setError(null)
  }

  function handleSave(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await updateField(id, { name: editingName })
        onMutate()
        setEditingId(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました')
      }
    })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <p className="text-xs text-muted-foreground px-4 pt-4 pb-2">圃場名をタップして編集できます</p>

      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <div className="divide-y divide-border">
        {fields.map((field) => (
          <div key={field.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-7 text-xs text-muted-foreground text-right shrink-0">{field.id}</span>

            {editingId === field.id ? (
              <>
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave(field.id)}
                  className="flex-1 border border-primary rounded-lg px-3 py-1.5 text-sm outline-none bg-card"
                />
                <button
                  onClick={() => handleSave(field.id)}
                  disabled={isPending || !editingName.trim()}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{field.name}</span>
                <button
                  onClick={() => startEdit(field)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
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
