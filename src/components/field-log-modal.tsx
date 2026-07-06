'use client'

import { useState, useRef, useCallback, useEffect, useTransition } from 'react'
import type { Field, StatusHistory } from '@/lib/types'
import { getStatus } from '@/lib/constants'
import { getFieldHistory } from '@/actions/fields'
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
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [, startTransition] = useTransition()
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartScrollTop = useRef<number>(0)

  useEffect(() => {
    startTransition(async () => {
      const data = await getFieldHistory(field.id)
      setHistory(data)
    })
  }, [field.id])

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

        {/* 現在のステータス */}
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

        {/* ステータス更新履歴 */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">ステータス更新履歴（最新5件）</p>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">履歴はありません</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
              {history.slice(0, 5).map((h) => {
                const hst = getStatus(h.status)
                return (
                  <div key={h.id} className="relative py-2.5 flex items-center gap-3">
                    <div
                      className="absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10 text-[10px]"
                      style={{ background: hst.color }}
                    >
                      <span>{hst.emoji}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{hst.label}</span>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(h.changed_at)}</p>
                        {h.reporter && (
                          <p className="text-[11px] text-muted-foreground">{h.reporter}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 記録者 */}
        <div className="bg-muted/50 rounded-xl p-4 mb-3">
          <p className="text-xs text-muted-foreground mb-1">記録者</p>
          <p className="text-sm font-medium">{field.reporter || '---'}</p>
        </div>

        {/* メモ */}
        <div className="bg-muted/50 rounded-xl p-4 mb-5">
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
