'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Field } from '@/lib/types'
import { getStatus, MAP_CENTER, MAP_DEFAULT_ZOOM } from '@/lib/constants'

export type PendingPin = { key: string; lat: number; lng: number }

type Props = {
  fields: Field[]
  pending: PendingPin[]
  selectedId: number | null
  addMode: boolean
  onSelect: (id: number) => void
  onMapClick: (lat: number, lng: number) => void
}

export function SetupMap({ fields, pending, selectedId, addMode, onSelect, onMapClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const addModeRef = useRef(addMode)
  const onMapClickRef = useRef(onMapClick)
  const onSelectRef = useRef(onSelect)

  useEffect(() => {
    addModeRef.current = addMode
    onMapClickRef.current = onMapClick
    onSelectRef.current = onSelect
  }, [addMode, onMapClick, onSelect])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: false }).setView(MAP_CENTER, MAP_DEFAULT_ZOOM)
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (addModeRef.current) onMapClickRef.current(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map

    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return
    layer.clearLayers()

    fields.forEach((field) => {
      const st = getStatus(field.status)
      const selected = field.id === selectedId
      const style = [
        `background:${field.hidden ? '#9E9E9E' : st.color}`,
        field.hidden ? 'opacity:0.45' : '',
        selected ? 'outline:3px solid #1565C0;outline-offset:2px' : '',
      ].join(';')
      const icon = L.divIcon({
        className: '',
        html: `<div class="custom-marker" style="${style}">${field.hidden ? '🚫' : st.emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker([field.latitude, field.longitude], { icon })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelectRef.current(field.id)
        })
        .addTo(layer)
    })

    pending.forEach((p) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-marker" style="background:#1565C0;opacity:0.6">＋</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      L.marker([p.lat, p.lng], { icon, interactive: false }).addTo(layer)
    })
  }, [fields, pending, selectedId])

  return <div ref={containerRef} className={`w-full h-full ${addMode ? 'cursor-crosshair' : ''}`} />
}
