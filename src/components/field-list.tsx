'use client'

import type { Field } from '@/lib/types'
import { getStatus, getStatusIndex } from '@/lib/constants'
import { Eye, EyeOff } from 'lucide-react'

type Props = {
  fields: Field[]
  onFieldClick: (id: number) => void
  hiddenFieldIds: Set<number>
  onToggleVisibility: (id: number) => void
}

export function FieldList({ fields, onFieldClick, hiddenFieldIds, onToggleVisibility }: Props) {
  const sorted = [...fields].sort((a, b) => {
    const ia = getStatusIndex(a.status)
    const ib = getStatusIndex(b.status)
    if (ia !== ib) return ia - ib
    return a.id - b.id
  })

  return (
    <div className="px-3 pb-3">
      {sorted.map(field => {
        const st = getStatus(field.status)
        const dateStr = field.updated_at
          ? new Date(field.updated_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
          : '--'
        const isHidden = hiddenFieldIds.has(field.id)
        return (
          <div
            key={field.id}
            className="bg-card rounded-xl p-3.5 mb-2 shadow-sm flex items-center gap-3"
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleVisibility(field.id)
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isHidden ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
              }`}
            >
              {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <div
              onClick={() => onFieldClick(field.id)}
              className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ background: st.color + '20' }}
              >
                {st.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold">{field.name}</div>
                <div className="text-xs text-muted-foreground mb-1">{field.farmer}</div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${st.progress}%`, background: st.color }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                  style={{ background: st.color }}
                >
                  {st.label}
                </span>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {field.reporter ? `${field.reporter} ` : ''}{dateStr}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
