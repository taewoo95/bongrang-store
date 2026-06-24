/*
 * History.jsx 수정 이력
 * ─────────────────────────────────────────────
 * 2026-06-06 판매 내역 수정 시 productId 누락으로 목록 삭제 및 재고 오동작 버그 수정
 * 2026-06-06 수정 모달 시간 입력 timezone 버그 수정 (UTC 문자열 → 로컬 시간 변환)
 * 2026-06-06 날짜 필터 및 그룹핑 로컬 날짜 기준으로 교정 (UTC 날짜 비교 오류 해결)
 * 2026-06-06 뽑기 판매 내역 통합 표시 (뽑기 배지, 등수명, 매출 = 등수 가격)
 * 2026-06-07 기간별 판매 내역 CSV 내보내기 추가 (일반+뽑기 통합)
 */
import { useState } from 'react'
import { getSales, deleteSale, updateSale, getProducts, getGachaSales, deleteGachaSale } from '../store'
import { CalendarDays, Trash2, Edit2, X, Check, Download } from 'lucide-react'
import { useLang } from '../LangContext'

function toDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function toLocalDate(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toLocalDateTimeInput(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function EditModal({ sale, onClose, onSaved }) {
  const products = getProducts()
  const [editMode, setEditMode] = useState('unit') // 'unit' | 'total'
  const [qty, setQty] = useState(sale.qty)
  const [unitPrice, setUnitPrice] = useState(sale.unitPrice)
  const [totalPriceInput, setTotalPriceInput] = useState(sale.totalPrice)
  const [time, setTime] = useState(() => toLocalDateTimeInput(sale.time))

  const computedTotal = editMode === 'unit' ? Number(qty) * Number(unitPrice) : Number(totalPriceInput)

  const handleSave = () => {
    if (qty <= 0) return alert('수량은 1개 이상이어야 해요.')
    if (editMode === 'unit') {
      if (unitPrice <= 0) return alert('판매가를 확인해주세요.')
    } else {
      if (totalPriceInput <= 0) return alert('전체 금액을 확인해주세요.')
    }
    const finalTotal = editMode === 'unit' ? Number(qty) * Number(unitPrice) : Number(totalPriceInput)
    const finalUnitPrice = editMode === 'unit' ? Number(unitPrice) : finalTotal / Number(qty)
    updateSale(sale.id, {
      productId: sale.productId,
      productName: sale.productName,
      costPrice: sale.costPrice,
      qty: Number(qty),
      unitPrice: finalUnitPrice,
      totalPrice: finalTotal,
      time: new Date(time).toISOString(),
    })
    onSaved()
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '12px', border: '1px solid #e2e8f0',
    borderRadius: '10px', fontSize: '15px', outline: 'none', background: '#f8fafc',
  }
  const labelStyle = { fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'block' }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px',
        width: '100%', maxWidth: '480px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700' }}>판매 내역 수정</h3>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}><X size={22} /></button>
        </div>

        <div style={{ background: '#f1f5f9', borderRadius: '10px', padding: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{sale.productName}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>수정 방식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'unit', label: '단가 수정' },
                { key: 'total', label: '전체금액 수정' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setEditMode(opt.key)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                    background: editMode === opt.key ? '#6366f1' : '#f1f5f9',
                    color: editMode === opt.key ? '#fff' : '#64748b',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {editMode === 'unit' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>수량 (개)</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} min="1" />
              </div>
              <div>
                <label style={labelStyle}>단가 (원)</label>
                <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} style={inputStyle} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>수량 (개)</label>
                <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} min="1" />
              </div>
              <div>
                <label style={labelStyle}>전체 금액 (원)</label>
                <input type="number" value={totalPriceInput} onChange={e => setTotalPriceInput(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>판매 시간</label>
            <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>수정 후 합계</span>
            <span style={{ fontWeight: '700', color: '#6366f1', fontSize: '16px' }}>
              {(computedTotal || 0).toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handleSave}
            style={{
              background: '#6366f1', color: '#fff', borderRadius: '12px',
              padding: '16px', fontSize: '15px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Check size={18} /> 수정 완료
          </button>
        </div>
      </div>
    </div>
  )
}

export default function History() {
  const { t, fmt } = useLang()
  const [sales, setSales] = useState(getSales)
  const [gachaSales, setGachaSales] = useState(getGachaSales)
  const [startDate, setStartDate] = useState(() => toLocalDate(new Date().toISOString()))
  const [endDate, setEndDate] = useState(() => toLocalDate(new Date().toISOString()))
  const [editSale, setEditSale] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'normal' | 'gacha'

  const today = toLocalDate(new Date().toISOString())
  const firstOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`
  const refresh = () => { setSales(getSales()); setGachaSales(getGachaSales()) }

  const handleExportCSV = () => {
    const rows = [
      ['날짜', '시간', '구분', '상품명', '수량', '단가(원)', '합계(원)', '원가(원)', '이익(원)'],
    ]
    // 일반 판매
    filteredNormal.forEach(s => {
      const d = new Date(s.time)
      const profit = s.totalPrice - s.costPrice * s.qty
      rows.push([
        toLocalDate(s.time),
        d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        '일반',
        s.productName,
        s.qty,
        s.unitPrice,
        s.totalPrice,
        s.costPrice * s.qty,
        profit,
      ])
    })
    // 뽑기 판매
    filteredGacha.forEach(gs => {
      const d = new Date(gs.time)
      const cost = gs.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0)
      const productNames = gs.products.map(p => `${p.productName}×${p.qty}`).join(' / ')
      rows.push([
        toLocalDate(gs.time),
        d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        `뽑기(${gs.gradeName})`,
        productNames,
        gs.products.reduce((a, p) => a + p.qty, 0),
        '-',
        gs.gradePrice,
        cost,
        gs.gradePrice - cost,
      ])
    })
    // 날짜+시간 오름차순 정렬
    rows.sort((a, b) => {
      if (a[0] === '날짜') return -1
      return `${a[0]} ${a[1]}`.localeCompare(`${b[0]} ${b[1]}`)
    })

    // CSV 인젝션 방지: =, +, @, - 로 시작하는 값에 작은따옴표 접두사 추가
    const safeCSV = (v) => {
      const s = String(v)
      return /^[=+@-]/.test(s) ? `'${s}` : s
    }
    const bom = '﻿' // 엑셀 한글 깨짐 방지 BOM
    const csv = bom + rows.map(r => r.map(v => `"${safeCSV(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 파일명에 날짜 외 특수문자 제거
    const safeDate = (d) => d.replace(/[^0-9-]/g, '')
    a.download = `판매내역_${safeDate(startDate)}_${safeDate(endDate)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 다이얼로그 텍스트 개행 인젝션 방지
  const safeName = (s) => String(s).replace(/[\n\r\t]/g, ' ').slice(0, 60)

  const handleDelete = (sale) => {
    if (!confirm(t('hist_cancel_confirm', safeName(sale.productName), sale.qty))) return
    deleteSale(sale.id)
    refresh()
  }

  const handleDeleteGacha = (gs) => {
    const names = gs.products.map(p => `${safeName(p.productName)} ${p.qty}${t('pcs')}`).join(', ')
    if (!confirm(t('hist_cancel_gacha_confirm', safeName(gs.gradeName), names))) return
    deleteGachaSale(gs.id)
    refresh()
  }

  const filteredNormal = sales.filter(s => {
    const d = toLocalDate(s.time)
    return d >= startDate && d <= endDate
  })
  const filteredGacha = gachaSales.filter(s => {
    const d = toLocalDate(s.time)
    return d >= startDate && d <= endDate
  })

  // 일반 판매: 같은 결제 건(동일 시각)끼리 하나의 거래로 그룹화
  const normalGroupsMap = {}
  filteredNormal.forEach(s => {
    if (!normalGroupsMap[s.time]) normalGroupsMap[s.time] = []
    normalGroupsMap[s.time].push(s)
  })
  const normalEntries = Object.values(normalGroupsMap).map(items => {
    if (items.length === 1) return { ...items[0], _type: 'normal' }
    return {
      _type: 'group',
      id: `group-${items[0].time}`,
      time: items[0].time,
      items,
      totalPrice: items.reduce((a, s) => a + s.totalPrice, 0),
      totalQty: items.reduce((a, s) => a + s.qty, 0),
    }
  })

  // merge and tag: normal sales get type:'normal'/'group', gacha get type:'gacha'
  const filtered = [
    ...(typeFilter !== 'gacha' ? normalEntries : []),
    ...(typeFilter !== 'normal' ? filteredGacha.map(s => ({ ...s, _type: 'gacha' })) : []),
  ].sort((a, b) => new Date(b.time) - new Date(a.time))

  const totalRevenue = filteredNormal.reduce((sum, s) => sum + s.totalPrice, 0)
    + filteredGacha.reduce((sum, s) => sum + s.gradePrice, 0)
  const totalProfit = filteredNormal.reduce((sum, s) => sum + (s.totalPrice - s.costPrice * s.qty), 0)
    + filteredGacha.reduce((sum, gs) => sum + gs.gradePrice - gs.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0), 0)

  const grouped = {}
  filtered.forEach(s => {
    const d = toLocalDate(s.time)
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })
  const totalCount = normalEntries.length + filteredGacha.length
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  const inputStyle = {
    padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', background: '#fff', outline: 'none', flex: 1,
  }

  return (
    <div style={{ padding: '20px' }}>
      {editSale && (
        <EditModal
          sale={editSale}
          onClose={() => setEditSale(null)}
          onSaved={refresh}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{t('hist_title')}</h1>
        <button
          onClick={handleExportCSV}
          disabled={totalCount === 0}
          style={{
            background: totalCount > 0 ? '#10b981' : '#e2e8f0',
            color: totalCount > 0 ? '#fff' : '#94a3b8',
            borderRadius: '10px', padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '14px', fontWeight: '600',
            cursor: totalCount > 0 ? 'pointer' : 'default',
          }}
        >
          <Download size={15} /> {t('hist_export')}
        </button>
      </div>

      {/* 날짜 필터 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <CalendarDays size={16} color="#6366f1" />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>기간 설정</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            { label: '오늘', fn: () => { setStartDate(today); setEndDate(today) }, active: startDate === today && endDate === today },
            { label: '이번 주', fn: () => {
              const d = new Date(); const day = d.getDay()
              const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
              setStartDate(mon.toISOString().slice(0, 10)); setEndDate(today)
            }, active: endDate === today && startDate !== today && startDate !== firstOfMonth },
            { label: '이번 달', fn: () => {
              const d = new Date()
              setStartDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`)
              setEndDate(today)
            }, active: startDate === firstOfMonth && endDate === today },
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn} style={{
              background: btn.active ? '#6366f1' : '#f1f5f9',
              color: btn.active ? '#fff' : '#475569',
              borderRadius: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: btn.active ? '700' : '500',
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 합계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#6366f1', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>{t('hist_total_revenue')}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{fmt(totalRevenue)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{t('hist_regular')} {normalEntries.length} · {t('hist_gacha')} {filteredGacha.length}</div>
        </div>
        <div style={{ background: '#10b981', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>{t('hist_total_profit')}</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{fmt(totalProfit)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {t('dash_margin', totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0)}
          </div>
        </div>
      </div>

      {/* 날짜별 내역 */}
      {/* 목록 헤더 — 필터 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
        {[
          { key: 'all', label: t('hist_filter_all') },
          { key: 'gacha', label: t('hist_filter_gacha') },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTypeFilter(key)} style={{
            padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
            background: typeFilter === key ? '#6366f1' : '#fff',
            color: typeFilter === key ? '#fff' : '#475569',
            border: typeFilter === key ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
          }}>
            {label}
          </button>
        ))}
      </div>

      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p>{t('hist_no_sales')}</p>
        </div>
      ) : (
        sortedDates.map(date => {
          const daySales = grouped[date]
          const dayTotal = daySales.reduce((sum, s) => sum + (s._type === 'gacha' ? s.gradePrice : s.totalPrice), 0)
          return (
            <div key={date} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                  {toDate(daySales[0].time)}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>
                  {fmt(dayTotal)}
                </span>
              </div>
              <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                {daySales.map((s, i) => {
                  const isOpen = expandedId === s.id
                  return (
                  <div key={s.id} style={{
                    padding: '14px 16px',
                    borderBottom: i < daySales.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                  }} onClick={() => setExpandedId(isOpen ? null : s.id)}>
                    {s._type === 'gacha' ? (
                      /* 뽑기 판매 행 */
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ background: '#818cf8', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', padding: '1px 7px' }}>{t('hist_gacha')}</span>
                              <span style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{s.gradeName}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{s.products.map(p => `${p.productName} ${p.qty}${t('pcs')}`).join(', ')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                              {t('anal_profit')} {fmt(s.gradePrice - s.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0))}
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {fmt(s.gradePrice)}
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteGacha(s)}
                              style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Trash2 size={14} /> {t('hist_cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : s._type === 'group' ? (
                      /* 한 결제 건에 여러 상품이 포함된 거래 행 */
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              <span style={{ background: '#6366f1', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', padding: '1px 7px' }}>{s.items.length}{t('pcs')}</span>
                              <span style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>
                                {s.items[0].productName} {t('hist_and_more', s.items.length - 1)}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{s.totalQty}{t('pcs')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                              {t('anal_profit')} {fmt(s.items.reduce((a, it) => a + (it.totalPrice - it.costPrice * it.qty), 0))}
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {fmt(s.totalPrice)}
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                            {s.items.map(it => (
                              <div key={it.id} style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{it.productName}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                      {it.qty}{t('pcs')} × {fmt(it.unitPrice)}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{fmt(it.totalPrice)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                  <button
                                    onClick={() => setEditSale(it)}
                                    style={{ flex: 1, background: '#eef2ff', color: '#475569', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: '600' }}
                                  >
                                    <Edit2 size={12} /> {t('edit')}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(it)}
                                    style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', fontWeight: '600' }}
                                  >
                                    <Trash2 size={12} /> {t('hist_cancel')}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 일반 판매 행 (단일 상품) */
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{s.productName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                              {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{s.qty}{t('pcs')} × {fmt(s.unitPrice)}
                            </div>
                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                              {t('anal_profit')} {fmt(s.totalPrice - s.costPrice * s.qty)}
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {fmt(s.totalPrice)}
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setEditSale(s)}
                              style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Edit2 size={14} /> {t('edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Trash2 size={14} /> {t('hist_cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
