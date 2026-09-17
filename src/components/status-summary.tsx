'use client'

import type { Field, StatusKey } from '@/lib/types'
import { ALL_STATUS_KEYS, STATUSES } from '@/lib/constants'

type Props = {
  fields: Field[]
  filter: StatusKey | 'all'
  onFilterChange: (key: StatusKey | 'all') => void
}

export function StatusSummary({ fields, filter, onFilterChange }: Props) {
  const counts = Object.fromEntries(ALL_STATUS_KEYS.map((key) => [key, 0])) as Record<StatusKey, number>
  for (const field of fields) {
    counts[field.status] += 1
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {STATUSES.map(s => {
        const count = counts[s.key]
        const active = filter === s.key
        return (
          <button
            key={s.key}
            onClick={() => onFilterChange(active ? 'all' : s.key)}
            className={`text-center py-2.5 px-1 rounded-xl shadow-sm transition-all ${
              active ? 'ring-2 scale-[1.04]' : 'bg-card'
            }`}
            style={active ? { background: s.color + '18', '--tw-ring-color': s.color } as React.CSSProperties : undefined}
          >
            <div className="text-xl font-bold" style={{ color: s.color }}>{count}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.emoji} {s.label}</div>
          </button>
        )
      })}
    </div>
  )
}
