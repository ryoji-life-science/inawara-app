'use client'

import type { Field } from '@/lib/types'
import type { StatusKey } from '@/lib/types'
import { ALL_STATUS_KEYS, STATUSES } from '@/lib/constants'

export function StatusSummary({ fields }: { fields: Field[] }) {
  const counts = Object.fromEntries(ALL_STATUS_KEYS.map((key) => [key, 0])) as Record<StatusKey, number>
  for (const field of fields) {
    counts[field.status] += 1
  }

  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {STATUSES.map(s => {
        const count = counts[s.key]
        return (
          <div key={s.key} className="text-center py-2.5 px-1 bg-card rounded-xl shadow-sm">
            <div className="text-xl font-bold" style={{ color: s.color }}>{count}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.emoji} {s.label}</div>
          </div>
        )
      })}
    </div>
  )
}
