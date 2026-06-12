'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import L from 'leaflet'
import type { Field } from '@/lib/types'
import { getStatus } from '@/lib/constants'
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants'
import { X, Check } from 'lucide-react'

type Props = {
  fields: Field[]
  onFieldClick: (id: number) => void
  onLongPress: (lat: number, lng: number) => void
}

export function FieldMap({ fields, onFieldClick, onLongPress }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStateRef = useRef<{
    pointerId: number
    latlng: L.LatLng
    point: { x: number; y: number }
  } | null>(null)
  const suppressClickUntilRef = useRef(0)
  const tempMarkerRef = useRef<L.Marker | null>(null)
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null)

  // 地図の初期化
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: false })
      .setView(MAP_CENTER, MAP_DEFAULT_ZOOM)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return () => {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove()
        tempMarkerRef.current = null
      }
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ResizeObserverで地図サイズを追従
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize()
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  // 仮ピンを表示
  const showTempMarker = useCallback((lat: number, lng: number) => {
    const map = mapRef.current
    if (!map) return

    if (tempMarkerRef.current) {
      map.removeLayer(tempMarkerRef.current)
      tempMarkerRef.current = null
    }

    const icon = L.divIcon({
      className: '',
      html: '<div class="temp-marker-pin"></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })

    const marker = L.marker([lat, lng], {
      icon,
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      setPendingPin({ lat: pos.lat, lng: pos.lng })
    })

    tempMarkerRef.current = marker
    setPendingPin({ lat, lng })
  }, [])

  const confirmPin = useCallback(() => {
    if (!pendingPin) return
    const finalLat = tempMarkerRef.current
      ? tempMarkerRef.current.getLatLng().lat
      : pendingPin.lat
    const finalLng = tempMarkerRef.current
      ? tempMarkerRef.current.getLatLng().lng
      : pendingPin.lng

    if (tempMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempMarkerRef.current)
      tempMarkerRef.current = null
    }
    setPendingPin(null)
    onLongPress(finalLat, finalLng)
  }, [pendingPin, onLongPress])

  const cancelPin = useCallback(() => {
    if (tempMarkerRef.current && mapRef.current) {
      mapRef.current.removeLayer(tempMarkerRef.current)
      tempMarkerRef.current = null
    }
    setPendingPin(null)
  }, [])

  // 長押しハンドラー
  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    pressStateRef.current = null
  }, [])

  useEffect(() => {
    const mapInstance = mapRef.current
    if (!mapInstance) return

    const container = mapInstance.getContainer()
    const LONG_PRESS_DURATION = 600
    const MOVE_THRESHOLD_SQUARED = 100
    const CLICK_SUPPRESSION_MS = 750

    function isInteractiveTarget(target: EventTarget | null): boolean {
      return target instanceof Element && Boolean(
        target.closest('.leaflet-marker-icon, .leaflet-control, .leaflet-popup, button, a, input, textarea, select, label')
      )
    }

    function startPress(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (isInteractiveTarget(event.target)) return

      const point = mapInstance!.mouseEventToContainerPoint(event)
      const latlng = mapInstance!.containerPointToLatLng(point)
      clearLongPress()
      pressStateRef.current = {
        pointerId: event.pointerId,
        latlng,
        point: { x: point.x, y: point.y },
      }

      longPressTimerRef.current = setTimeout(() => {
        const state = pressStateRef.current
        if (!state || state.pointerId !== event.pointerId) return
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESSION_MS
        showTempMarker(state.latlng.lat, state.latlng.lng)
        clearLongPress()
      }, LONG_PRESS_DURATION)
    }

    function onPointerDown(event: PointerEvent) {
      startPress(event)
    }

    function onPointerEnd(event: PointerEvent) {
      if (!pressStateRef.current || pressStateRef.current.pointerId === event.pointerId) {
        clearLongPress()
      }
    }

    function onPointerMove(event: PointerEvent) {
      const state = pressStateRef.current
      if (!state || state.pointerId !== event.pointerId) return

      const point = mapInstance!.mouseEventToContainerPoint(event)
      const dx = point.x - state.point.x
      const dy = point.y - state.point.y
      if (dx * dx + dy * dy > MOVE_THRESHOLD_SQUARED) {
        clearLongPress()
      }
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', onPointerEnd)
    container.addEventListener('pointercancel', onPointerEnd)
    container.addEventListener('pointerleave', onPointerEnd)
    mapInstance.on('dragstart', clearLongPress)
    mapInstance.on('zoomstart', clearLongPress)
    mapInstance.on('movestart', clearLongPress)
    mapInstance.on('contextmenu', clearLongPress)

    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', onPointerEnd)
      container.removeEventListener('pointercancel', onPointerEnd)
      container.removeEventListener('pointerleave', onPointerEnd)
      mapInstance.off('dragstart', clearLongPress)
      mapInstance.off('zoomstart', clearLongPress)
      mapInstance.off('movestart', clearLongPress)
      mapInstance.off('contextmenu', clearLongPress)
      clearLongPress()
    }
  }, [showTempMarker, clearLongPress])

  // マーカーの更新
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    fields.forEach(field => {
      const st = getStatus(field.status)
      const icon = L.divIcon({
        className: '',
        html: `<div class="custom-marker" style="background:${st.color}">${st.emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([field.latitude, field.longitude], { icon }).addTo(map)

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e)
        if (Date.now() < suppressClickUntilRef.current) {
          return
        }
        onFieldClick(field.id)
      })

      markersRef.current.push(marker)
    })
  }, [fields, onFieldClick])

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {pendingPin && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-card rounded-xl shadow-lg px-3 py-2.5 border border-border whitespace-nowrap">
          <button
            onClick={cancelPin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-medium"
          >
            <X className="w-4 h-4 shrink-0" />
            キャンセル
          </button>
          <button
            onClick={confirmPin}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            <Check className="w-4 h-4 shrink-0" />
            ここに登録
          </button>
        </div>
      )}
    </div>
  )
}
