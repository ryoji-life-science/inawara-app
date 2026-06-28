'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Field, StatusKey } from '@/lib/types'
import { getStatus, getStatusIndex } from '@/lib/constants'
import { StatusFilter } from './status-filter'
import { StatusSummary } from './status-summary'
import { FieldList } from './field-list'
import { FieldDetailModal } from './field-detail-modal'
import { FieldCreateDialog } from './field-create-dialog'
import { Map as MapIcon, List } from 'lucide-react'

const FieldMap = dynamic(() => import('./field-map').then(m => m.FieldMap), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted animate-pulse" />,
})

type Tab = 'map' | 'list'
type ViewMode = 'map' | 'split' | 'text'

export function MainApp({ initialFields }: { initialFields: Field[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('map')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [filter, setFilter] = useState<StatusKey | 'all'>('all')
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null)
  const [createPosition, setCreatePosition] = useState<{ lat: number; lng: number } | null>(null)
  const [hiddenFieldIds, setHiddenFieldIds] = useState<Set<number>>(new Set())

  const filteredFields =
    filter === 'all' ? initialFields : initialFields.filter((field) => field.status === filter)
  const textListFields = [...filteredFields].sort(
    (a, b) => getStatusIndex(a.status) - getStatusIndex(b.status) || a.id - b.id
  )

  const completedCount = initialFields.filter((field) => field.status === 'fertilize').length

  const selectedField = selectedFieldId
    ? initialFields.find((field) => field.id === selectedFieldId) ?? null
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
    setHiddenFieldIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleMutate = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <div className="flex flex-col h-full max-w-[430px] mx-auto relative overflow-hidden">
      {/* ヘッダー */}
      <header className="h-14 bg-red-600 text-white flex items-center justify-between px-4 shrink-0 z-50">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <span>🌾</span> 稲藁進捗管理
        </h1>
        <span className="text-xs opacity-90">完了 {completedCount}/{initialFields.length}</span>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {tab === 'map' ? (
          <>
            {/* ビュー切り替え */}
            <div className="flex bg-muted rounded-lg p-0.5 mx-3 my-2 shrink-0">
              {(['split', 'map', 'text'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode
                      ? 'bg-card text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {mode === 'split' ? '両方' : mode === 'map' ? '地図' : '一覧'}
                </button>
              ))}
            </div>

            {/* フィルター */}
            <StatusFilter
              filter={filter}
              onFilterChange={setFilter}
              fields={initialFields}
            />

            {/* 地図 + テキストリスト */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {viewMode !== 'text' && (
                <div className={viewMode === 'split' ? 'flex-1 min-h-0' : 'flex-1'}>
                  <FieldMap
                    fields={filteredFields.filter(f => !hiddenFieldIds.has(f.id))}
                    onFieldClick={handleFieldClick}
                    onLongPress={handleLongPress}
                  />
                </div>
              )}
              {viewMode !== 'map' && (
                <div className={`overflow-y-auto border-t border-border ${viewMode === 'split' ? 'max-h-[40%]' : 'flex-1'}`}>
                  {textListFields.map(field => {
                      const st = getStatus(field.status)
                      return (
                        <div
                          key={field.id}
                          onClick={() => handleFieldClick(field.id)}
                          className="flex items-center px-3.5 py-2.5 border-b border-muted gap-2 cursor-pointer text-sm active:bg-muted/50"
                        >
                          <span className="w-5 text-right text-xs text-muted-foreground shrink-0">{field.id}</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: st.color }} />
                          <span className="flex-1 font-medium truncate">{field.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{field.farmer}</span>
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg text-white shrink-0"
                            style={{ background: st.color }}
                          >
                            {st.label}
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* 一覧タブ */
          <div className="flex-1 overflow-y-auto">
            <StatusSummary fields={initialFields} />
            <FieldList
              fields={initialFields}
              onFieldClick={handleFieldClick}
              hiddenFieldIds={hiddenFieldIds}
              onToggleVisibility={handleToggleVisibility}
            />
          </div>
        )}
      </main>

      {/* 下部ナビゲーション */}
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

      {/* 詳細モーダル */}
      {selectedField && (
        <FieldDetailModal
          key={selectedField.id}
          field={selectedField}
          onClose={handleCloseDetail}
          onMutate={handleMutate}
          isHidden={hiddenFieldIds.has(selectedField.id)}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

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
