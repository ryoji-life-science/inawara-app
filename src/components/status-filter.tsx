'use client'

import type { Field, StatusKey } from '@/lib/types'
import { ALL_STATUS_KEYS, STATUSES } from '@/lib/constants'

type Props = {
  filter: StatusKey | 'all'
  onFilterChange: (filter: StatusKey | 'all') => void
  fields: Field[]
}

export function StatusFilter({ filter, onFilterChange, fields }: Props) {
  const counts = Object.fromEntries(ALL_STATUS_KEYS.map((key) => [key, 0])) as Record<StatusKey, number>
  for (const field of fields) {
    counts[field.status] += 1
  }

  return (
    <div className="flex gap-1.5 px-3 py-2 overflow-x-auto bg-card border-b border-border shrink-0 scrollbar-hide">
      <button
        onClick={() => onFilterChange('all')}
        className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
          filter === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card border-border text-foreground'
        }`}
      >
        すべて
      </button>
      {STATUSES.map(s => {
        const count = counts[s.key]
        return (
          <button
            key={s.key}
            onClick={() => onFilterChange(s.key)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
              filter === s.key
                ? 'text-white border-transparent'
                : 'bg-card border-border text-foreground'
            }`}
            style={filter === s.key ? { background: s.color, borderColor: s.color } : undefined}
          >
            {s.emoji} {s.label} {count > 0 && `(${count})`}
          </button>
        )
      })}
    </div>
  )
}
