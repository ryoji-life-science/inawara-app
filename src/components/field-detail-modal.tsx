'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import type { Field, StatusKey } from '@/lib/types'
import { STATUSES, getStatusIndex } from '@/lib/constants'
import { updateFieldStatus, updateField, deleteField } from '@/actions/fields'
import { Check, Trash2, Eye, EyeOff } from 'lucide-react'

type Props = {
  field: Field
  onClose: () => void
  onMutate: () => void
  isHidden: boolean
  onToggleVisibility: (id: number) => void
}

export function FieldDetailModal({ field, onClose, onMutate, isHidden, onToggleVisibility }: Props) {
  const [reporter, setReporter] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }
    return window.localStorage.getItem('inawara_reporter') || ''
  })
  const [memo, setMemo] = useState(field.memo)
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const currentIdx = getStatusIndex(field.status)
  const normalizedMemo = memo.trim()
  const hasMemoChanged = normalizedMemo !== field.memo.trim()

  function persistReporter() {
    const normalizedReporter = reporter.trim()
    if (typeof window !== 'undefined') {
      if (normalizedReporter) {
        window.localStorage.setItem('inawara_reporter', normalizedReporter)
      } else {
        window.localStorage.removeItem('inawara_reporter')
      }
    }
    return normalizedReporter
  }

  function handleStatusClick(statusKey: StatusKey) {
    const normalizedReporter = persistReporter()
    setError(null)
    startTransition(async () => {
      try {
        await updateFieldStatus(field.id, statusKey, normalizedReporter, normalizedMemo)
        onMutate()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '更新に失敗しました')
      }
    })
  }

  function handleAdvance() {
    if (currentIdx < STATUSES.length - 1) {
      handleStatusClick(STATUSES[currentIdx + 1].key)
    }
  }

  function handleSaveMemo() {
    persistReporter()

    if (!hasMemoChanged) {
      onClose()
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await updateField(field.id, { memo: normalizedMemo })
        onMutate()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '保存に失敗しました')
      }
    })
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (isPending || !panelRef.current) return
    const deltaY = e.touches[0].clientY - touchStartY.current
    if (deltaY > 60 && panelRef.current.scrollTop === 0) {
      handleSaveMemo()
    }
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      try {
        await deleteField(field.id)
        onMutate()
        onClose()
      } catch (e) {
        setError(e instanceof Error ? e.message : '削除に失敗しました')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[200] flex items-end justify-center"
      onClick={(e) => {
        if (e.target !== e.currentTarget || isPending) return
        handleSaveMemo()
      }}
    >
      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="bg-card rounded-t-2xl w-full max-w-[430px] max-h-[85vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-300"
      >
        {/* ハンドル */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        {/* タイトル */}
        <h2 className="text-xl font-bold">{field.name}</h2>
        <p className="text-sm text-muted-foreground mb-4">👤 {field.farmer}</p>

        {/* ステータスタイムライン */}
        <div className="relative pl-7">
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
          {STATUSES.map((s, i) => {
            const isCompleted = i < currentIdx
            const isCurrent = i === currentIdx
            let dateText = ''
            if (isCurrent && field.updated_at) {
              const d = new Date(field.updated_at)
              dateText = d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
              if (field.reporter) dateText = field.reporter + ' · ' + dateText
            }

            return (
              <div
                key={s.key}
                onClick={() => handleStatusClick(s.key)}
                className="relative py-2.5 flex items-center gap-3 cursor-pointer"
              >
                <div
                  className={`absolute -left-7 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                    isCompleted
                      ? 'bg-primary'
                      : isCurrent
                      ? 'bg-primary/80 shadow-[0_0_0_4px_rgba(76,175,80,0.2)]'
                      : 'bg-border'
                  }`}
                >
                  {(isCompleted || isCurrent) && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <span
                  className={`text-[15px] flex-1 ${
                    isCurrent
                      ? 'text-primary font-bold'
                      : isCompleted
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.emoji} {s.label}
                </span>
                {dateText && (
                  <span className="text-[11px] text-muted-foreground">{dateText}</span>
                )}
              </div>
            )
          })}
        </div>

        {/* メモ */}
        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
          <label className="block text-xs text-muted-foreground mb-1.5">📝 メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="備考があれば入力..."
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary resize-y min-h-[60px] bg-card"
          />
        </div>

        {/* 記録者 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-xl">
          <label className="block text-xs text-muted-foreground mb-1.5">記録者</label>
          <input
            type="text"
            value={reporter}
            onChange={(e) => setReporter(e.target.value)}
            placeholder="名前を入力"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-card"
          />
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* アクション */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={handleSaveMemo}
            disabled={isPending}
            className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-muted text-foreground disabled:opacity-50"
          >
            閉じる
          </button>
          {currentIdx < STATUSES.length - 1 ? (
            <button
              onClick={handleAdvance}
              disabled={isPending}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground disabled:opacity-50"
            >
              → {STATUSES[currentIdx + 1].emoji} {STATUSES[currentIdx + 1].label} へ
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-[#1565C0] text-white"
            >
              ✅ 完了済み
            </button>
          )}
        </div>

        {/* 地図表示切り替え */}
        <button
          onClick={() => onToggleVisibility(field.id)}
          className={`mt-3 w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5 ${
            isHidden
              ? 'bg-primary/10 text-primary font-semibold'
              : 'bg-muted/50 text-muted-foreground'
          }`}
        >
          {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {isHidden ? '地図に表示する' : '地図から非表示にする'}
        </button>

        {/* 削除 */}
        <div className="mt-3">
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm bg-muted text-foreground"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red-50 text-red-700 font-semibold disabled:opacity-50"
              >
                本当に削除する
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2.5 rounded-xl text-sm text-red-500 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              この圃場を削除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
