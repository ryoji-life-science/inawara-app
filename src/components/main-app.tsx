'use client'

import { useState, useCallback, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Field, StatusKey } from '@/lib/types'
import { setFieldHidden } from '@/actions/fields'
import { StatusSummary } from './status-summary'
import { FieldList } from './field-list'
import { FieldDetailModal } from './field-detail-modal'
import { FieldLogModal } from './field-log-modal'
import { FieldCreateDialog } from './field-create-dialog'
import { FieldSetup } from './field-setup'
import { Map as MapIcon, List, Settings, ChevronLeft } from 'lucide-react'

const FieldMap = dynamic(() => import('./field-map').then(m => m.FieldMap), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted animate-pulse" />,
})

type Tab = 'map' | 'list'

export function MainApp({ initialFields }: { initialFields: Field[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('map')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)
  const [logFieldId, setLogFieldId] = useState<number | null>(null)
  const [createPosition, setCreatePosition] = useState<{ lat: number; lng: number } | null>(null)
  const [listFilter, setListFilter] = useState<StatusKey | 'all'>('all')
  const [hiddenOverrides, setHiddenOverrides] = useState<Record<number, boolean>>({})
  const [, startTransition] = useTransition()

  // サーバーから最新データが届いたら、楽観的な上書きは不要になるためクリアする
  useEffect(() => {
    setHiddenOverrides({})
  }, [initialFields])

  const fields = useMemo(() => {
    if (Object.keys(hiddenOverrides).length === 0) return initialFields
    return initialFields.map((f) =>
      f.id in hiddenOverrides ? { ...f, hidden: hiddenOverrides[f.id] } : f
    )
  }, [initialFields, hiddenOverrides])

  const visibleFields = fields.filter((field) => !field.hidden)
  const completedCount = visibleFields.filter((field) => field.status === 'fertilize').length

  const selectedField = selectedFieldId
    ? fields.find((field) => field.id === selectedFieldId) ?? null
    : null

  const handleLongPress = useCallback((lat: number, lng: number) => {
    setSelectedFieldId(null)
    setCreatePosition({ lat, lng })
  }, [])

  const handleFieldClick = useCallback((id: number) => {
    setCreatePosition(null)
    setSelectedFieldId(id)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedFieldId(null)
  }, [])

  const handleCloseCreate = useCallback(() => {
    setCreatePosition(null)
  }, [])

  const handleToggleVisibility = useCallback((id: number) => {
    const field = fields.find((f) => f.id === id)
    const nextHidden = !(field?.hidden ?? false)

    // 即座に見た目を更新（楽観的UI）。実際のDB反映はバックグラウンドで待つ
    setHiddenOverrides((prev) => ({ ...prev, [id]: nextHidden }))

    startTransition(async () => {
      try {
        await setFieldHidden(id, nextHidden)
      } catch (e) {
        console.error(e)
        setHiddenOverrides((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      } finally {
        router.refresh()
      }
    })
  }, [fields, router])

  const handleMutate = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="flex flex-col h-full max-w-[430px] mx-auto relative overflow-hidden">
      {/* ヘッダー */}
      <header className="h-14 bg-green-600 text-white flex items-center justify-between px-4 shrink-0 z-50">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <span>🌾</span> 稲藁進捗管理
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-90">完了 {completedCount}/{visibleFields.length}</span>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="設定"
            className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {showSettings ? (
          /* 設定画面 */
          <>
            <div className="flex items-center gap-1 px-2 py-2 border-b border-border shrink-0">
              <button
                onClick={() => setShowSettings(false)}
                className="flex items-center text-sm text-primary px-1 py-1 active:opacity-60"
              >
                <ChevronLeft className="w-5 h-5" />
                戻る
              </button>
              <h2 className="flex-1 text-center text-base font-semibold pr-12">設定</h2>
            </div>
            <FieldSetup
              fields={fields}
              onMutate={handleMutate}
              onToggleVisibility={handleToggleVisibility}
            />
          </>
        ) : tab === 'map' ? (
          <div className="flex-1 min-h-0">
            <FieldMap
              fields={visibleFields}
              onFieldClick={handleFieldClick}
              onLongPress={handleLongPress}
            />
          </div>
        ) : tab === 'list' ? (
          /* 一覧タブ */
          <div className="flex-1 overflow-y-auto">
            <StatusSummary
              fields={visibleFields}
              filter={listFilter}
              onFilterChange={setListFilter}
            />
            <FieldList
              fields={fields}
              onFieldClick={(id) => setLogFieldId(id)}
              filter={listFilter}
            />
          </div>
        ) : null}
      </main>

      {/* 下部ナビゲーション */}
      {!showSettings && (
      <nav className="h-16 bg-card border-t border-border flex shrink-0 z-50">
        <button
          onClick={() => setTab('map')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
            tab === 'map' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <MapIcon className="w-6 h-6" />
          地図
        </button>
        <button
          onClick={() => setTab('list')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
            tab === 'list' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <List className="w-6 h-6" />
          一覧
        </button>
      </nav>
      )}

      {/* バージョン表示 */}
      <div className="bg-green-600 text-white px-4 py-1.5 text-[10px] text-right shrink-0">
        v0.3.0
      </div>

      {/* 詳細モーダル */}
      {selectedField && (
        <FieldDetailModal
          key={selectedField.id}
          field={selectedField}
          onClose={handleCloseDetail}
          onMutate={handleMutate}
          isHidden={selectedField.hidden}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      {/* ログモーダル（一覧タブ用） */}
      {logFieldId && (() => {
        const f = fields.find(f => f.id === logFieldId)
        return f ? <FieldLogModal key={f.id} field={f} onClose={() => setLogFieldId(null)} /> : null
      })()}

      {/* 新規圃場登録ダイアログ */}
      {createPosition && (
        <FieldCreateDialog
          lat={createPosition.lat}
          lng={createPosition.lng}
          onClose={handleCloseCreate}
          onMutate={handleMutate}
        />
      )}
    </div>
  )
}
