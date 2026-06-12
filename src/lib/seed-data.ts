import type { StatusKey } from './types'

export type SeedField = {
  name: string
  farmer: string
  latitude: number
  longitude: number
  status: StatusKey
  reporter: string
  updated_at: string
  memo: string
}

const raw: { name: string; farmer: string; lat: number; lng: number; status: StatusKey; reporter: string; updated_at: string; memo: string }[] = [
  { name: '菱浦 北区画', farmer: '山田太郎', lat: 36.0920, lng: 133.0950, status: 'roll', reporter: '佐藤', updated_at: '2026-02-12', memo: '' },
  { name: '菱浦 南区画', farmer: '山田太郎', lat: 36.0900, lng: 133.0940, status: 'gather', reporter: '田中', updated_at: '2026-02-11', memo: '' },
  { name: '海士 東区画', farmer: '鈴木一郎', lat: 36.0840, lng: 133.0870, status: 'fertilize', reporter: '佐藤', updated_at: '2026-02-10', memo: '' },
  { name: '海士 西区画', farmer: '鈴木一郎', lat: 36.0835, lng: 133.0830, status: 'burn', reporter: '山本', updated_at: '2026-02-11', memo: '' },
  { name: '福井 A', farmer: '田中次郎', lat: 36.0870, lng: 133.0780, status: 'harvest', reporter: '田中', updated_at: '2026-02-09', memo: '' },
  { name: '福井 B', farmer: '田中次郎', lat: 36.0860, lng: 133.0760, status: 'harvest', reporter: '佐藤', updated_at: '2026-02-09', memo: '' },
  { name: '崎 上段', farmer: '佐藤三郎', lat: 36.0810, lng: 133.0920, status: 'raise', reporter: '山本', updated_at: '2026-02-08', memo: '' },
  { name: '崎 下段', farmer: '佐藤三郎', lat: 36.0800, lng: 133.0930, status: 'gather', reporter: '佐藤', updated_at: '2026-02-10', memo: '' },
  { name: '知々井 上', farmer: '高橋四郎', lat: 36.0950, lng: 133.0850, status: 'not_started', reporter: '', updated_at: '2026-02-01', memo: '' },
  { name: '知々井 下', farmer: '高橋四郎', lat: 36.0945, lng: 133.0870, status: 'not_started', reporter: '', updated_at: '2026-02-01', memo: '' },
  { name: '御波 大', farmer: '伊藤五郎', lat: 36.0770, lng: 133.0850, status: 'roll', reporter: '田中', updated_at: '2026-02-12', memo: '' },
  { name: '御波 小', farmer: '伊藤五郎', lat: 36.0760, lng: 133.0840, status: 'burn', reporter: '田中', updated_at: '2026-02-11', memo: '' },
  { name: '豊田 A', farmer: '渡辺六郎', lat: 36.0880, lng: 133.0900, status: 'gather', reporter: '山本', updated_at: '2026-02-10', memo: '' },
  { name: '豊田 B', farmer: '渡辺六郎', lat: 36.0890, lng: 133.0910, status: 'raise', reporter: '佐藤', updated_at: '2026-02-09', memo: '' },
  { name: '宇受賀', farmer: '中村七郎', lat: 36.0930, lng: 133.0800, status: 'fertilize', reporter: '佐藤', updated_at: '2026-02-08', memo: '' },
  { name: '保々見', farmer: '中村七郎', lat: 36.0910, lng: 133.0770, status: 'roll', reporter: '山本', updated_at: '2026-02-12', memo: '' },
  { name: '東地区', farmer: '小林八郎', lat: 36.0850, lng: 133.0960, status: 'harvest', reporter: '田中', updated_at: '2026-02-07', memo: '' },
  { name: '西地区', farmer: '小林八郎', lat: 36.0855, lng: 133.0800, status: 'raise', reporter: '佐藤', updated_at: '2026-02-08', memo: '' },
  { name: '中里', farmer: '加藤九郎', lat: 36.0865, lng: 133.0880, status: 'burn', reporter: '山本', updated_at: '2026-02-11', memo: '' },
  { name: '太井', farmer: '吉田十郎', lat: 36.0825, lng: 133.0810, status: 'gather', reporter: '田中', updated_at: '2026-02-10', memo: '' },
]

export const DEFAULT_FIELDS: SeedField[] = raw.map(f => ({
  name: f.name,
  farmer: f.farmer,
  latitude: f.lat,
  longitude: f.lng,
  status: f.status,
  reporter: f.reporter,
  updated_at: f.updated_at,
  memo: f.memo,
}))
