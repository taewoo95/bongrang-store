/*
 * Analysis.jsx 수정 이력
 * ─────────────────────────────────────────────
 * 2026-06-06 상품 랭킹, 전체 요약 최초 추가
 * 2026-06-06 판매 없는 상품 접기/펼치기로 변경
 * 2026-06-06 전체 레이아웃 재구성, 카테고리별 매출 비중·시간대별 판매 분포 추가
 * 2026-06-06 뽑기 판매 데이터를 전체 상품 분석에 통합 (별도 섹션 제거)
 */
import { useState } from 'react'
import { getSales, getProducts, getCategories, getGachaSales } from '../store'
import { TrendingUp, Award, AlertCircle, ChevronDown, ChevronUp, Clock, Tag } from 'lucide-react'

const SORT_OPTIONS = [
  { key: 'revenue', label: '매출순' },
  { key: 'qty', label: '판매량순' },
  { key: 'profit', label: '이익순' },
  { key: 'profitRate', label: '이익률순' },
]

const TIME_SLOTS = [
  { label: '새벽', range: '0~6시', hours: [0,1,2,3,4,5], color: '#818cf8' },
  { label: '오전', range: '6~12시', hours: [6,7,8,9,10,11], color: '#34d399' },
  { label: '오후', range: '12~18시', hours: [12,13,14,15,16,17], color: '#f59e0b' },
  { label: '저녁', range: '18~24시', hours: [18,19,20,21,22,23], color: '#f472b6' },
]

function toLocalDate(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
}

const medal = i => ['🥇','🥈','🥉'][i] ?? `${i+1}`

export default function Analysis() {
  const sales = getSales()
  const gachaSales = getGachaSales()
  const products = getProducts()
  const categories = getCategories()
  const today = toLocalDate(new Date().toISOString())
  const firstOfMonth = today.slice(0, 7) + '-01'

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [sortKey, setSortKey] = useState('revenue')
  const [showNeverSold, setShowNeverSold] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null) // 시간대 드릴다운
  const [showAllProducts, setShowAllProducts] = useState(false)

  const filtered = sales.filter(s => {
    const d = toLocalDate(s.time)
    return d >= startDate && d <= endDate
  })
  const filteredGacha = gachaSales.filter(s => {
    const d = toLocalDate(s.time)
    return d >= startDate && d <= endDate
  })

  // ── 요약 지표 (뽑기 포함) ─────────────────
  const gachaTotalRevenue = filteredGacha.reduce((s, x) => s + x.gradePrice, 0)
  const gachaTotalCost    = filteredGacha.reduce((s, x) => s + x.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0), 0)
  const totalRevenue = filtered.reduce((s, x) => s + x.totalPrice, 0) + gachaTotalRevenue
  const totalCost    = filtered.reduce((s, x) => s + x.costPrice * x.qty, 0) + gachaTotalCost
  const totalProfit  = totalRevenue - totalCost
  const profitRate   = totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 100) : 0

  // ── 상품별 집계 (뽑기 포함) ───────────────
  const byProduct = {}
  filtered.forEach(s => {
    if (!byProduct[s.productName]) byProduct[s.productName] = { revenue: 0, cost: 0, qty: 0 }
    byProduct[s.productName].revenue += s.totalPrice
    byProduct[s.productName].cost    += s.costPrice * s.qty
    byProduct[s.productName].qty     += s.qty
  })
  // 뽑기 판매: 각 상품의 원가·수량 반영, 매출은 등수 가격을 상품 원가 비율로 분배
  filteredGacha.forEach(gs => {
    const totalCostInGacha = gs.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0)
    gs.products.forEach(p => {
      if (!byProduct[p.productName]) byProduct[p.productName] = { revenue: 0, cost: 0, qty: 0 }
      byProduct[p.productName].qty  += p.qty
      byProduct[p.productName].cost += (p.costPrice || 0) * p.qty
      // 매출 배분: 뽑기 가격 × (해당 상품 원가 비율), 원가 합이 0이면 균등 배분
      const share = totalCostInGacha > 0
        ? gs.gradePrice * ((p.costPrice || 0) * p.qty / totalCostInGacha)
        : gs.gradePrice / gs.products.length
      byProduct[p.productName].revenue += share
    })
  })
  const productList = Object.entries(byProduct)
    .map(([name, d]) => ({ name, ...d, profit: d.revenue - d.cost, profitRate: d.revenue > 0 ? Math.round((d.revenue - d.cost) / d.revenue * 100) : 0 }))
    .sort((a, b) => b[sortKey] - a[sortKey])
  const maxRevenue = productList[0]?.revenue || 1

  // ── 카테고리별 매출 비중 (뽑기 포함) ────────
  const byCat = {}
  filtered.forEach(s => {
    const product = products.find(p => p.id === s.productId)
    const catId = product?.categoryId ?? 'none'
    const catName = catId === 'none' ? '미분류' : (categories.find(c => c.id === catId)?.name ?? '미분류')
    if (!byCat[catName]) byCat[catName] = { revenue: 0, qty: 0 }
    byCat[catName].revenue += s.totalPrice
    byCat[catName].qty     += s.qty
  })
  filteredGacha.forEach(gs => {
    const totalCostInGacha = gs.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0)
    gs.products.forEach(p => {
      const product = products.find(pr => pr.id === p.productId)
      const catId = product?.categoryId ?? 'none'
      const catName = catId === 'none' ? '미분류' : (categories.find(c => c.id === catId)?.name ?? '미분류')
      if (!byCat[catName]) byCat[catName] = { revenue: 0, qty: 0 }
      byCat[catName].qty += p.qty
      const share = totalCostInGacha > 0
        ? gs.gradePrice * ((p.costPrice || 0) * p.qty / totalCostInGacha)
        : gs.gradePrice / gs.products.length
      byCat[catName].revenue += share
    })
  })
  const catList = Object.entries(byCat)
    .map(([name, d]) => ({ name, ...d, pct: totalRevenue > 0 ? Math.round(d.revenue / totalRevenue * 100) : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
  const CAT_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

  // ── 시간대별 집계 (뽑기 포함) ─────────────
  const timeSlotData = TIME_SLOTS.map(slot => {
    const items = filtered.filter(s => slot.hours.includes(new Date(s.time).getHours()))
    const gachaItems = filteredGacha.filter(s => slot.hours.includes(new Date(s.time).getHours()))
    return {
      ...slot,
      revenue: items.reduce((s,x) => s + x.totalPrice, 0) + gachaItems.reduce((s,x) => s + x.gradePrice, 0),
      count: items.length + gachaItems.length,
    }
  })
  const maxSlotRevenue = Math.max(...timeSlotData.map(s => s.revenue), 1)

  // ── 판매 없는 상품 (뽑기 포함) ────────────
  const soldNames = new Set([
    ...filtered.map(s => s.productName),
    ...filteredGacha.flatMap(gs => gs.products.map(p => p.productName)),
  ])
  const neverSold = products.filter(p => !soldNames.has(p.name))
  const top3Revenue = [...productList].sort((a,b) => b.revenue - a.revenue).slice(0, 3)
  const top3Profit  = [...productList].sort((a,b) => b.profitRate - a.profitRate).slice(0, 3)

  const inputStyle = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: '#fff', outline: 'none', flex: 1 }
  const card = (bg, label, value, sub) => (
    <div style={{ background: bg, borderRadius: '14px', padding: '16px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  const Section = ({ icon, title, children }) => (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        {icon}
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{title}</h3>
      </div>
      {children}
    </div>
  )

  const noData = <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>데이터가 없어요</p>

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
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { label: '오늘', fn: () => { setStartDate(today); setEndDate(today) }, active: startDate === today && endDate === today },
            { label: '이번 달', fn: () => { setStartDate(firstOfMonth); setEndDate(today) }, active: startDate === firstOfMonth && endDate === today },
            { label: '저번 달', fn: () => {
              const d = new Date(); d.setMonth(d.getMonth()-1)
              const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0')
              const last = new Date(y, d.getMonth()+1, 0).getDate()
              setStartDate(`${y}-${m}-01`); setEndDate(`${y}-${m}-${last}`)
            }, active: false },
            { label: '올해 전체', fn: () => { setStartDate(`${new Date().getFullYear()}-01-01`); setEndDate(today) }, active: startDate === `${new Date().getFullYear()}-01-01` && endDate === today },
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

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {card('#6366f1', '총 매출', `${totalRevenue.toLocaleString()}원`, `일반 ${filtered.length}건 · 뽑기 ${filteredGacha.length}건`)}
        {card('#f59e0b', '총 원가', `${totalCost.toLocaleString()}원`, '매입 비용 합계')}
        {card(totalProfit >= 0 ? '#10b981' : '#ef4444', '총 이익', `${totalProfit.toLocaleString()}원`, `이익률 ${profitRate}%`)}
        <div style={{ background: totalProfit >= 0 ? '#d1fae5' : '#fee2e2', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>이익률</div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>{profitRate}%</div>
        </div>
      </div>

      {/* 카테고리별 매출 비중 */}
      <Section icon={<Tag size={17} color="#6366f1" />} title="카테고리별 매출 비중">
        {catList.length === 0 ? noData : catList.map((c, i) => (
          <div key={c.name} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{c.name}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.qty}개</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{c.revenue.toLocaleString()}원</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>{c.pct}%</span>
              </div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '6px', background: CAT_COLORS[i % CAT_COLORS.length], width: `${c.pct}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        ))}
      </Section>

      {/* 시간대별 판매 분포 */}
      <Section icon={<Clock size={17} color="#6366f1" />} title="시간대별 판매 분포">
        {filtered.length === 0 && filteredGacha.length === 0 ? noData : (
          <>
            {/* 4구간 막대 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: selectedSlot ? '14px' : '0' }}>
              {timeSlotData.map(slot => (
                <button
                  key={slot.label}
                  onClick={() => setSelectedSlot(selectedSlot?.label === slot.label ? null : slot)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    background: 'none', padding: 0,
                    opacity: selectedSlot && selectedSlot.label !== slot.label ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ width: '100%', height: '100px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', padding: '0 6px 6px', border: selectedSlot?.label === slot.label ? `2px solid ${slot.color}` : '2px solid transparent' }}>
                    <div style={{
                      width: '100%', borderRadius: '6px', background: slot.color,
                      height: `${Math.round(slot.revenue / maxSlotRevenue * 84)}px`,
                      minHeight: slot.revenue > 0 ? '6px' : '0',
                      transition: 'height 0.4s', opacity: slot.revenue > 0 ? 1 : 0.2,
                    }} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{slot.label}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{slot.range}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: slot.revenue > 0 ? slot.color : '#cbd5e1' }}>{slot.count}건</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{slot.revenue > 0 ? `${slot.revenue.toLocaleString()}원` : '-'}</div>
                </button>
              ))}
            </div>

            {/* 1시간 단위 드릴다운 */}
            {selectedSlot && (() => {
              const hourlyData = selectedSlot.hours.map(h => {
                const items = filtered.filter(s => new Date(s.time).getHours() === h)
                const gItems = filteredGacha.filter(s => new Date(s.time).getHours() === h)
                return {
                  h,
                  revenue: items.reduce((s,x) => s+x.totalPrice, 0) + gItems.reduce((s,x) => s+x.gradePrice, 0),
                  count: items.length + gItems.length,
                }
              })
              const maxH = Math.max(...hourlyData.map(d => d.revenue), 1)
              return (
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '12px' }}>
                    {selectedSlot.label} 시간별 상세 ({selectedSlot.range})
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px' }}>
                    {hourlyData.map(({ h, revenue, count }) => (
                      <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '10px', color: selectedSlot.color, fontWeight: '600' }}>{count > 0 ? count : ''}</div>
                        <div style={{
                          width: '100%', borderRadius: '4px', background: selectedSlot.color,
                          height: `${Math.round(revenue / maxH * 52)}px`,
                          minHeight: revenue > 0 ? '4px' : '2px',
                          opacity: revenue > 0 ? 1 : 0.15,
                          transition: 'height 0.3s',
                        }} />
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{h}시</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </Section>

      {/* 상품 랭킹 */}
      <Section icon={<TrendingUp size={17} color="#6366f1" />} title="상품 랭킹">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.key} onClick={() => setSortKey(opt.key)} style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              background: sortKey === opt.key ? '#6366f1' : '#f1f5f9',
              color: sortKey === opt.key ? '#fff' : '#64748b',
            }}>
              {opt.label}
            </button>
          ))}
        </div>
        {productList.length === 0 ? noData : (showAllProducts ? productList : productList.slice(0, 10)).map((p, i) => (
          <div key={p.name} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>{medal(i)}</span>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>{p.qty}개</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>{p.revenue.toLocaleString()}원</div>
                <div style={{ fontSize: '12px', color: '#10b981' }}>이익률 {p.profitRate}%</div>
              </div>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '7px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '6px',
                background: i === 0 ? '#6366f1' : i === 1 ? '#8b5cf6' : i === 2 ? '#a78bfa' : '#c4b5fd',
                width: `${Math.round(p.revenue / maxRevenue * 100)}%`,
                transition: 'width 0.4s',
              }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', marginTop: '4px' }}>
              <span style={{ color: '#64748b' }}>원가 {p.cost.toLocaleString()}원</span>
              <span style={{ color: p.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>이익 {p.profit.toLocaleString()}원</span>
            </div>
          </div>
        ))}
        {productList.length > 10 && (
          <button
            onClick={() => setShowAllProducts(v => !v)}
            style={{ width: '100%', marginTop: '4px', padding: '10px', background: '#f8fafc', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {showAllProducts ? <><ChevronUp size={15} /> 접기</> : <><ChevronDown size={15} /> {productList.length - 10}개 더 보기</>}
          </button>
        )}
      </Section>

      {/* 전체 요약 */}
      <Section icon={<Award size={17} color="#f59e0b" />} title="기간 요약">
        {filtered.length === 0 && filteredGacha.length === 0 ? noData : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏆 매출 TOP 3</p>
              {top3Revenue.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '10px', marginBottom: '5px', background: i === 0 ? '#eef2ff' : '#f8fafc' }}>
                  <span style={{ fontSize: '14px' }}>{medal(i)} {p.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1' }}>{p.revenue.toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: neverSold.length > 0 ? '16px' : 0 }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 이익률 TOP 3</p>
              {top3Profit.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '10px', marginBottom: '5px', background: i === 0 ? '#f0fdf4' : '#f8fafc' }}>
                  <span style={{ fontSize: '14px' }}>{medal(i)} {p.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#10b981' }}>{p.profitRate}%</span>
                </div>
              ))}
            </div>
            {neverSold.length > 0 && (
              <div>
                <button onClick={() => setShowNeverSold(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', padding: '4px 0' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} color="#f59e0b" />
                    판매 없는 상품
                    <span style={{ background: '#fef3c7', color: '#92400e', borderRadius: '20px', padding: '1px 8px', fontSize: '12px', fontWeight: '700' }}>{neverSold.length}</span>
                  </span>
                  {showNeverSold ? <ChevronUp size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#94a3b8" />}
                </button>
                {showNeverSold && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {neverSold.map(p => (
                      <span key={p.id} style={{ background: '#fef3c7', color: '#92400e', borderRadius: '20px', padding: '4px 12px', fontSize: '13px' }}>{p.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Section>
    </div>
  )
}
