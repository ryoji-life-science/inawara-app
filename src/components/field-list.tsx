'use client'

import type { Field } from '@/lib/types'
import { getStatus } from '@/lib/constants'

type Props = {
  fields: Field[]
  onFieldClick: (id: number) => void
  hiddenFieldIds: Set<number>
}

export function FieldList({ fields, onFieldClick, hiddenFieldIds }: Props) {
  const sorted = [...fields]
    .filter((f) => !hiddenFieldIds.has(f.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

  return (
    <div className="px-3 pb-3">
      {sorted.map(field => {
        const st = getStatus(field.status)
        const dateStr = field.updated_at
          ? new Date(field.updated_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
          : '--'
        return (
          <div
            key={field.id}
            onClick={() => onFieldClick(field.id)}
            className="bg-card rounded-xl p-3.5 mb-2 shadow-sm flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-lg shrink-0"
              style={{ background: st.color + '20' }}
            >
              {st.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold">{field.name}</div>
              <div className="text-sm text-muted-foreground mb-1">{field.farmer}</div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${st.progress}%`, background: st.color }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span
                className="text-sm font-semibold px-2 py-1 rounded-lg text-white"
                style={{ background: st.color }}
              >
                {st.label}
              </span>
              <div className="text-xs text-muted-foreground mt-1">
                {field.reporter ? `${field.reporter} ` : ''}{dateStr}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
