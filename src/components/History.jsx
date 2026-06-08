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
  const [qty, setQty] = useState(sale.qty)
  const [unitPrice, setUnitPrice] = useState(sale.unitPrice)
  const [time, setTime] = useState(() => toLocalDateTimeInput(sale.time))

  const handleSave = () => {
    if (qty <= 0) return alert('수량은 1개 이상이어야 해요.')
    if (unitPrice <= 0) return alert('판매가를 확인해주세요.')
    updateSale(sale.id, {
      productId: sale.productId,
      productName: sale.productName,
      costPrice: sale.costPrice,
      qty: Number(qty),
      unitPrice: Number(unitPrice),
      totalPrice: Number(qty) * Number(unitPrice),
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
          <div>
            <label style={labelStyle}>판매 시간</label>
            <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ background: '#eef2ff', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b', fontSize: '14px' }}>수정 후 합계</span>
            <span style={{ fontWeight: '700', color: '#6366f1', fontSize: '16px' }}>
              {(Number(qty) * Number(unitPrice)).toLocaleString()}원
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
  const [sales, setSales] = useState(getSales)
  const [gachaSales, setGachaSales] = useState(getGachaSales)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [editSale, setEditSale] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'normal' | 'gacha'

  const today = new Date().toISOString().slice(0, 10)
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

    const bom = '﻿' // 엑셀 한글 깨짐 방지 BOM
    const csv = bom + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `판매내역_${startDate}_${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (sale) => {
    if (!confirm(`"${sale.productName}" 판매 기록을 취소할까요?\n재고 ${sale.qty}개가 복구돼요.`)) return
    deleteSale(sale.id)
    refresh()
  }

  const handleDeleteGacha = (gs) => {
    const names = gs.products.map(p => `${p.productName} ${p.qty}개`).join(', ')
    if (!confirm(`뽑기 판매(${gs.gradeName}) 기록을 취소할까요?\n재고 복구: ${names}`)) return
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

  // merge and tag: normal sales get type:'normal', gacha get type:'gacha'
  const filtered = [
    ...(typeFilter !== 'gacha' ? filteredNormal.map(s => ({ ...s, _type: 'normal' })) : []),
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
  const totalCount = filteredNormal.length + filteredGacha.length
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
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>판매 내역</h1>
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
          <Download size={15} /> CSV 내보내기
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

      {/* 판매 유형 필터 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'all', label: `전체 ${filteredNormal.length + filteredGacha.length}건` },
          { key: 'normal', label: `일반 ${filteredNormal.length}건` },
          { key: 'gacha', label: `뽑기 ${filteredGacha.length}건` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTypeFilter(key)} style={{
            flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '13px', fontWeight: '600',
            background: typeFilter === key ? '#6366f1' : '#fff',
            color: typeFilter === key ? '#fff' : '#475569',
            border: typeFilter === key ? '2px solid #6366f1' : '2px solid #e2e8f0',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* 합계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#6366f1', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{totalRevenue.toLocaleString()}원</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>일반 {filteredNormal.length}건 · 뽑기 {filteredGacha.length}건</div>
        </div>
        <div style={{ background: '#10b981', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>총 이익</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{totalProfit.toLocaleString()}원</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            이익률 {totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 날짜별 내역 */}
      {totalCount === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p>해당 기간에 판매 내역이 없어요</p>
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
                  {dayTotal.toLocaleString()}원
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
                              <span style={{ background: '#818cf8', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', padding: '1px 7px' }}>뽑기</span>
                              <span style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{s.gradeName}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{s.products.map(p => `${p.productName} ${p.qty}개`).join(', ')}
                            </div>
                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                              이익 {(s.gradePrice - s.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0)).toLocaleString()}원
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {s.gradePrice.toLocaleString()}원
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteGacha(s)}
                              style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Trash2 size={14} /> 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 일반 판매 행 */
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{s.productName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                              {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}{s.qty}개 × {s.unitPrice.toLocaleString()}원
                            </div>
                            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                              이익 {(s.totalPrice - s.costPrice * s.qty).toLocaleString()}원
                            </div>
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {s.totalPrice.toLocaleString()}원
                          </div>
                        </div>
                        {isOpen && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setEditSale(s)}
                              style={{ flex: 1, background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Edit2 size={14} /> 수정
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              style={{ flex: 1, background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '13px', fontWeight: '600' }}
                            >
                              <Trash2 size={14} /> 삭제
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
