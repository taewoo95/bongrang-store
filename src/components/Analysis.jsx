import { useState } from 'react'
import { getSales, getProducts } from '../store'
import { TrendingUp, Award, Package, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

const SORT_OPTIONS = [
  { key: 'revenue', label: '매출순' },
  { key: 'qty', label: '판매량순' },
  { key: 'profit', label: '이익순' },
  { key: 'profitRate', label: '이익률순' },
]

export default function Analysis() {
  const sales = getSales()
  const products = getProducts()
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 7) + '-01'
  const [startDate, setStartDate] = useState(firstOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [sortKey, setSortKey] = useState('revenue')
  const [showNeverSold, setShowNeverSold] = useState(false)

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
    .map(([name, d]) => ({
      name, ...d,
      profit: d.revenue - d.cost,
      profitRate: d.revenue > 0 ? Math.round((d.revenue - d.cost) / d.revenue * 100) : 0
    }))
    .sort((a, b) => b[sortKey] - a[sortKey])

  const maxRevenue = productList.length > 0 ? productList[0].revenue : 1

  // 전체 요약
  const top3Revenue = [...productList].sort((a, b) => b.revenue - a.revenue).slice(0, 3)
  const top3Profit = [...productList].sort((a, b) => b.profitRate - a.profitRate).slice(0, 3)
  const soldNames = new Set(filtered.map(s => s.productName))
  const neverSold = products.filter(p => !soldNames.has(p.name))

  const inputStyle = {
    padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px',
    fontSize: '14px', background: '#fff', outline: 'none', flex: 1,
  }

  const medal = (i) => ['🥇', '🥈', '🥉'][i] || `${i + 1}`

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700' }}>이익 분석</h1>

      {/* 기간 설정 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: '총 매출', value: `${totalRevenue.toLocaleString()}원`, sub: `${filtered.length}건 판매`, bg: '#6366f1' },
          { label: '총 원가', value: `${totalCost.toLocaleString()}원`, sub: '매입 비용 합계', bg: '#f59e0b' },
          { label: '총 이익', value: `${totalProfit.toLocaleString()}원`, sub: undefined, bg: totalProfit >= 0 ? '#10b981' : '#ef4444' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '14px', padding: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>{c.value}</div>
            {c.sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{c.sub}</div>}
          </div>
        ))}
        <div style={{ background: totalProfit >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>이익률</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>{profitRate}%</div>
        </div>
      </div>

      {/* 전체 요약 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Award size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>전체 요약</h3>
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>데이터가 없어요</p>
        ) : (
          <>
            {/* TOP 3 매출 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>🏆 매출 TOP 3</p>
              {top3Revenue.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '10px', marginBottom: '6px',
                  background: i === 0 ? '#fefce8' : '#f8fafc',
                }}>
                  <span style={{ fontSize: '14px' }}>{medal(i)} {p.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>{p.revenue.toLocaleString()}원</span>
                </div>
              ))}
            </div>

            {/* TOP 3 이익률 */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>💰 이익률 TOP 3</p>
              {top3Profit.map((p, i) => (
                <div key={p.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderRadius: '10px', marginBottom: '6px',
                  background: i === 0 ? '#f0fdf4' : '#f8fafc',
                }}>
                  <span style={{ fontSize: '14px' }}>{medal(i)} {p.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{p.profitRate}%</span>
                </div>
              ))}
            </div>

            {/* 안 팔린 상품 */}
            {neverSold.length > 0 && (
              <div>
                <button
                  onClick={() => setShowNeverSold(v => !v)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', padding: '4px 0' }}
                >
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} color="#f59e0b" />
                    이 기간 판매 없는 상품
                    <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '20px', padding: '1px 8px', fontSize: '12px', fontWeight: '700' }}>
                      {neverSold.length}
                    </span>
                  </span>
                  {showNeverSold ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                </button>
                {showNeverSold && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {neverSold.map(p => (
                      <span key={p.id} style={{
                        background: '#fef3c7', color: '#92400e', borderRadius: '20px',
                        padding: '4px 12px', fontSize: '13px',
                      }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 상품 랭킹 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#6366f1" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>상품 랭킹</h3>
          </div>
          {/* 정렬 선택 */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setSortKey(opt.key)} style={{
                padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: sortKey === opt.key ? '#6366f1' : '#f1f5f9',
                color: sortKey === opt.key ? '#fff' : '#64748b',
                border: 'none', cursor: 'pointer',
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {productList.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>데이터가 없어요</p>
        ) : (
          productList.map((p, i) => (
            <div key={p.name} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{medal(i)}</span>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>{p.qty}개 판매</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>{p.revenue.toLocaleString()}원</div>
                  <div style={{ fontSize: '12px', color: '#10b981' }}>이익 {p.profitRate}%</div>
                </div>
              </div>
              <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '6px',
                  background: i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : i === 2 ? '#a78bfa' : '#c4b5fd',
                  width: `${Math.round(p.revenue / maxRevenue * 100)}%`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '5px' }}>
                <span style={{ color: '#64748b' }}>원가 {p.cost.toLocaleString()}원</span>
                <span style={{ color: p.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  이익 {p.profit.toLocaleString()}원
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
