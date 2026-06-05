import { useState } from 'react'
import { getSales } from '../store'
import { CalendarDays, TrendingUp } from 'lucide-react'

function toDate(iso) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

export default function History() {
  const sales = getSales()
  const today = new Date().toISOString().slice(0, 10)
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)

  const filtered = sales.filter(s => {
    const d = s.time.slice(0, 10)
    return d >= startDate && d <= endDate
  })

  const totalRevenue = filtered.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalProfit = filtered.reduce((sum, s) => sum + (s.totalPrice - s.costPrice * s.qty), 0)

  // 날짜별 그룹
  const grouped = {}
  filtered.forEach(s => {
    const d = s.time.slice(0, 10)
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
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>판매 내역</h1>

      {/* 날짜 필터 */}
      <div style={{
        background: '#fff', borderRadius: '14px', padding: '16px',
        marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)'
      }}>
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
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{s.productName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                        {new Date(s.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{s.qty}개 × {s.unitPrice.toLocaleString()}원
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                        {s.totalPrice.toLocaleString()}원
                      </div>
                      <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>
                        이익 {(s.totalPrice - s.costPrice * s.qty).toLocaleString()}원
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
