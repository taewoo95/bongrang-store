import { useState } from 'react'
import { getSales } from '../store'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export default function Analysis() {
  const sales = getSales()
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)

  const filtered = sales.filter(s => {
    const d = s.time.slice(0, 10)
    return d >= startDate && d <= endDate
  })

  const totalRevenue = filtered.reduce((sum, s) => sum + s.totalPrice, 0)
  const totalCost = filtered.reduce((sum, s) => sum + s.costPrice * s.qty, 0)
  const totalProfit = totalRevenue - totalCost
  const profitRate = totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0

  // 상품별 집계
  const byProduct = {}
  filtered.forEach(s => {
    if (!byProduct[s.productName]) {
      byProduct[s.productName] = { revenue: 0, cost: 0, qty: 0, count: 0 }
    }
    byProduct[s.productName].revenue += s.totalPrice
    byProduct[s.productName].cost += s.costPrice * s.qty
    byProduct[s.productName].qty += s.qty
    byProduct[s.productName].count += 1
  })
  const productList = Object.entries(byProduct)
    .map(([name, d]) => ({ name, ...d, profit: d.revenue - d.cost, profitRate: d.revenue > 0 ? Math.round((d.revenue - d.cost) / d.revenue * 100) : 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  const maxRevenue = productList.length > 0 ? productList[0].revenue : 1

  const inputStyle = {
    padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', background: '#fff', outline: 'none', flex: 1,
  }

  const statCard = (label, value, sub, color = '#1e293b') => (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>이익 분석</h1>

      {/* 기간 설정 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          <span style={{ color: '#94a3b8' }}>~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: '이번 달', fn: () => { setStartDate(firstOfMonth); setEndDate(today) } },
            { label: '저번 달', fn: () => {
              const d = new Date(); d.setMonth(d.getMonth() - 1)
              const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0')
              const last = new Date(y, d.getMonth()+1, 0).getDate()
              setStartDate(`${y}-${m}-01`); setEndDate(`${y}-${m}-${last}`)
            }},
            { label: '올해 전체', fn: () => {
              setStartDate(`${new Date().getFullYear()}-01-01`); setEndDate(today)
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

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {statCard('총 매출', `${totalRevenue.toLocaleString()}원`, `${filtered.length}건 판매`, '#6366f1')}
        {statCard('총 원가', `${totalCost.toLocaleString()}원`, '매입 비용 합계', '#f59e0b')}
        {statCard('총 이익', `${totalProfit.toLocaleString()}원`, undefined, totalProfit >= 0 ? '#10b981' : '#ef4444')}
        <div style={{ background: totalProfit >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>이익률</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {profitRate}%
          </div>
        </div>
      </div>

      {/* 상품별 분석 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>
          상품별 매출 분석
        </h3>
        {productList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>데이터가 없어요</p>
        ) : (
          productList.map((p, i) => (
            <div key={p.name} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{p.qty}개 판매</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>{p.revenue.toLocaleString()}원</span>
                </div>
              </div>
              {/* 바 차트 */}
              <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '8px', marginBottom: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '6px', background: '#6366f1',
                  width: `${Math.round(p.revenue / maxRevenue * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>원가 {p.cost.toLocaleString()}원</span>
                <span style={{ color: p.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  이익 {p.profit.toLocaleString()}원 ({p.profitRate}%)
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
