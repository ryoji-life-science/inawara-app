'use client'

import { useState, useRef, useCallback } from 'react'
import type { Field } from '@/lib/types'
import { getStatus } from '@/lib/constants'
import { X } from 'lucide-react'

type Props = {
  field: Field
  onClose: () => void
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '---'
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function FieldLogModal({ field, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartScrollTop = useRef<number>(0)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => onClose(), 280)
  }, [onClose])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
    touchStartScrollTop.current = panelRef.current?.scrollTop ?? 0
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    if (touchStartScrollTop.current === 0 && deltaY > 50) handleClose()
    touchStartY.current = null
  }

  const st = getStatus(field.status)

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`bg-card rounded-t-2xl w-full max-w-[430px] max-h-[85vh] overflow-y-auto p-5 ${
          isClosing
            ? 'animate-out slide-out-to-bottom duration-[280ms]'
            : 'animate-in slide-in-from-bottom duration-300'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold">{field.name}</h2>
            {field.farmer && (
              <p className="text-sm text-muted-foreground mt-0.5">📍 {field.farmer}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ステータス */}
        <div className="bg-muted/50 rounded-xl p-4 mb-3">
          <p className="text-xs text-muted-foreground mb-2">現在のステータス</p>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold px-3 py-1 rounded-lg text-white"
              style={{ background: st.color }}
            >
              {st.emoji} {st.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            変更日：{formatDate(field.updated_at)}
          </p>
        </div>

        {/* 記録者 */}
        <div className="bg-muted/50 rounded-xl p-4 mb-3">
          <p className="text-xs text-muted-foreground mb-1">記録者</p>
          <p className="text-sm font-medium">{field.reporter || '---'}</p>
        </div>

        {/* メモ */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">メモ</p>
          <p className="text-sm whitespace-pre-wrap">{field.memo || '---'}</p>
          <p className="text-xs text-muted-foreground mt-2">
            記入日：{formatDate(field.memo_updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
