import { useState } from 'react'
import { getSales, deleteSale, updateSale, getProducts } from '../store'
import { CalendarDays, Trash2, Edit2, X, Check } from 'lucide-react'

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
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [editSale, setEditSale] = useState(null)

  const today = new Date().toISOString().slice(0, 10)
  const refresh = () => setSales(getSales())

  const handleDelete = (sale) => {
    if (!confirm(`"${sale.productName}" 판매 기록을 취소할까요?\n재고 ${sale.qty}개가 복구돼요.`)) return
    deleteSale(sale.id)
    refresh()
  }

  const filtered = sales.filter(s => {
    const d = toLocalDate(s.time)
    return d >= startDate && d <= endDate
  })

  const totalRevenue = filtered.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalProfit = filtered.reduce((sum, s) => sum + (s.totalPrice - s.costPrice * s.qty), 0)

  const grouped = {}
  filtered.forEach(s => {
    const d = toLocalDate(s.time)
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(s)
  })
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

      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>판매 내역</h1>

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
            { label: '오늘', fn: () => { setStartDate(today); setEndDate(today) } },
            { label: '이번 주', fn: () => {
              const d = new Date(); const day = d.getDay()
              const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
              setStartDate(mon.toISOString().slice(0, 10)); setEndDate(today)
            }},
            { label: '이번 달', fn: () => {
              const d = new Date()
              setStartDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`)
              setEndDate(today)
            }},
          ].map(btn => (
            <button key={btn.label} onClick={btn.fn} style={{
              background: '#f1f5f9', color: '#475569', borderRadius: '8px',
              padding: '6px 12px', fontSize: '13px', fontWeight: '500',
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* 합계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#6366f1', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>{totalRevenue.toLocaleString()}원</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{filtered.length}건</div>
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
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p>해당 기간에 판매 내역이 없어요</p>
        </div>
      ) : (
        sortedDates.map(date => {
          const daySales = grouped[date]
          const dayTotal = daySales.reduce((sum, s) => sum + s.totalPrice, 0)
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
                {daySales.map((s, i) => (
                  <div key={s.id} style={{
                    padding: '14px 16px',
                    borderBottom: i < daySales.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ textAlign: 'right', marginRight: '4px' }}>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                            {s.totalPrice.toLocaleString()}원
                          </div>
                        </div>
                        <button
                          onClick={() => setEditSale(s)}
                          style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '7px', display: 'flex' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '7px', display: 'flex' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
