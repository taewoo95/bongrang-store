/*
 * SaleInput.jsx 수정 이력
 * ─────────────────────────────────────────────
 * 2026-06-06 상품 목록 카테고리 필터 탭 추가, 카테고리 섹션별 그룹핑
 * 2026-06-06 상품 목록 이름 가나다순 정렬
 * 2026-06-06 QR 스캔 버튼 추가
 * 2026-06-06 판매 완료 버튼 하단 고정, 장바구니 펼치기/접기
 * 2026-06-06 뽑기 판매 모드 추가 — 등수 설정, 상품 선택, 재고·분석 연동
 */
import { useState } from 'react'
import { getProducts, getCategories, getGachaGrades, addGachaGrade, deleteGachaGrade, updateGachaGrade, addSale, addGachaSale, deductStock } from '../store'
import { ShoppingCart, Check, Plus, Minus, Trash2, ChevronDown, ChevronUp, ScanLine, Gift, Settings, X, Edit2 } from 'lucide-react'
import { QRScanModal } from './QRModal'

// ── 뽑기 등수 관리 모달 ─────────────────────────────────────────
function GradeSettingsModal({ onClose }) {
  const [grades, setGrades] = useState(getGachaGrades)
  const [form, setForm] = useState({ name: '', allowance: '', price: '' })
  const [editId, setEditId] = useState(null)

  const refresh = () => setGrades(getGachaGrades())

  const handleSave = () => {
    if (!form.name || !form.allowance || !form.price) return alert('모두 입력해주세요.')
    try {
      if (editId) {
        updateGachaGrade(editId, { name: form.name, allowance: Number(form.allowance), price: Number(form.price) })
        setEditId(null)
      } else {
        addGachaGrade(form)
      }
      setForm({ name: '', allowance: '', price: '' })
      refresh()
    } catch (e) { alert(e.message) }
  }

  const handleEdit = (g) => {
    setForm({ name: g.name, allowance: String(g.allowance), price: String(g.price) })
    setEditId(g.id)
  }

  const handleDelete = (id) => {
    if (!confirm('이 등수를 삭제할까요?')) return
    deleteGachaGrade(id); refresh()
  }

  const inp = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', outline: 'none', width: '100%' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700' }}>뽑기 등수 설정</h3>
          <button onClick={onClose} style={{ background: 'none', color: '#94a3b8' }}><X size={22} /></button>
        </div>

        {/* 추가/수정 폼 */}
        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input style={inp} placeholder="등수 이름 (예: 1등, 2등)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={inp} type="number" placeholder="선택 가능 개수" value={form.allowance} onChange={e => setForm(f => ({ ...f, allowance: e.target.value }))} />
            <input style={inp} type="number" placeholder="뽑기 가격 (원)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <button onClick={handleSave} style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '11px', fontWeight: '700', fontSize: '14px' }}>
            {editId ? '수정 완료' : '+ 등수 추가'}
          </button>
          {editId && <button onClick={() => { setEditId(null); setForm({ name: '', allowance: '', price: '' }) }} style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '10px', padding: '10px', fontWeight: '600', fontSize: '14px' }}>취소</button>}
        </div>

        {/* 등수 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {grades.length === 0 && <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '12px' }}>등수를 추가해주세요</p>}
          {grades.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{g.name}</span>
                <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '8px' }}>{g.allowance}개 선택 · {g.price.toLocaleString()}원</span>
              </div>
              <button onClick={() => handleEdit(g)} style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '6px', display: 'flex' }}><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(g.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '6px', display: 'flex' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 공통 상품 선택 UI (컴포넌트 외부 정의 — 내부 정의 시 매 렌더마다 remount) ──
function ProductButton({ p, isGacha, cart, gachaCart, gachaRemaining, onAdd, onAddGacha }) {
  const inCart = isGacha ? gachaCart.find(c => c.product.id === p.id) : cart.find(c => c.product.id === p.id)
  const outOfStock = p.stock <= 0
  const disabled = outOfStock || (isGacha && gachaRemaining <= 0 && !inCart)
  return (
    <button
      onClick={() => { if (disabled) return; isGacha ? onAddGacha(p) : onAdd(p) }}
      disabled={disabled}
      style={{
        background: outOfStock ? '#f8fafc' : inCart ? '#eef2ff' : '#fff',
        border: outOfStock ? '2px solid #f1f5f9' : inCart ? '2px solid #6366f1' : '2px solid #e2e8f0',
        borderRadius: '12px', padding: '14px 16px', textAlign: 'left',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: outOfStock ? '#94a3b8' : '#1e293b' }}>{p.name}</div>
        <div style={{ fontSize: '12px', color: outOfStock ? '#ef4444' : '#94a3b8', marginTop: '2px', fontWeight: outOfStock ? '600' : '400' }}>
          {outOfStock ? '재고 없음' : `재고 ${p.stock}개`}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {inCart && <span style={{ background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>{inCart.qty}개</span>}
        {!isGacha && <span style={{ fontSize: '15px', fontWeight: '700', color: '#6366f1' }}>{p.sellPrice.toLocaleString()}원</span>}
        <div style={{ width: '28px', height: '28px', background: inCart ? '#6366f1' : '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} color={inCart ? '#fff' : '#94a3b8'} />
        </div>
      </div>
    </button>
  )
}

function ProductList({ isGacha, products, categories, activeCat, setActiveCat, cart, gachaCart, gachaRemaining, onAdd, onAddGacha }) {
  if (products.length === 0) {
    return <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>등록된 상품이 없어요.</div>
  }
  const validCatIds = new Set(categories.map(c => c.id))
  const btnProps = { isGacha, cart, gachaCart, gachaRemaining, onAdd, onAddGacha }
  return (
    <>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[{ id: 'all', name: '전체' }, ...categories, { id: 'none', name: '미분류' }].map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
            background: activeCat === c.id ? '#6366f1' : '#fff', color: activeCat === c.id ? '#fff' : '#64748b',
            border: activeCat === c.id ? 'none' : '1px solid #e2e8f0',
          }}>{c.name}</button>
        ))}
      </div>
      {activeCat === 'all' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[...categories.map(c => ({ cat: c, items: products.filter(p => p.categoryId === c.id) })),
            { cat: { id: 'none', name: '미분류' }, items: products.filter(p => !p.categoryId || !validCatIds.has(p.categoryId)) }]
            .filter(s => s.items.length > 0)
            .map(({ cat, items }) => (
              <div key={cat.id}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginBottom: '6px' }}>{cat.name} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({items.length})</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{items.map(p => <ProductButton key={p.id} p={p} {...btnProps} />)}</div>
              </div>
            ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(activeCat === 'none'
            ? products.filter(p => !p.categoryId || !validCatIds.has(p.categoryId))
            : products.filter(p => p.categoryId === activeCat))
            .map(p => <ProductButton key={p.id} p={p} {...btnProps} />)}
        </div>
      )}
    </>
  )
}

// ── 메인 컴포넌트 ───────────────────────────────────────────────
export default function SaleInput({ onDone }) {
  const [products] = useState(() => getProducts().sort((a, b) => a.name.localeCompare(b.name, 'ko')))
  const [categories] = useState(getCategories)
  const [saleMode, setSaleMode] = useState('normal') // 'normal' | 'gacha'

  // 일반 판매 상태
  const [cart, setCart] = useState([])
  const [done, setDone] = useState(false)
  const [doneData, setDoneData] = useState(null) // 완료 화면용 스냅샷
  const [expandProduct, setExpandProduct] = useState(true)
  const [activeCat, setActiveCat] = useState('all')
  const [showScanner, setShowScanner] = useState(false)
  const [cartExpanded, setCartExpanded] = useState(false)

  // 뽑기 판매 상태
  const [grades, setGrades] = useState(getGachaGrades)
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [gachaCart, setGachaCart] = useState([]) // [{product, qty}]
  const [showGradeSettings, setShowGradeSettings] = useState(false)
  const [gachaDone, setGachaDone] = useState(false)
  const [gachaDoneData, setGachaDoneData] = useState(null)

  const refreshGrades = () => setGrades(getGachaGrades())

  // ── 일반 판매 로직 ─────────────────────────────────────────
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(c => c.product.id === product.id)
      if (exists) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product, qty: 1, unitPrice: product.sellPrice }]
    })
  }
  const removeFromCart = (productId) => setCart(prev => prev.filter(c => c.product.id !== productId))
  const updateQty = (productId, delta) => setCart(prev => prev.map(c => {
    if (c.product.id !== productId) return c
    const newQty = c.qty + delta
    return newQty <= 0 ? null : { ...c, qty: newQty }
  }).filter(Boolean))
  const updatePrice = (productId, price) => setCart(prev => prev.map(c => c.product.id === productId ? { ...c, unitPrice: Number(price) || 0 } : c))

  const handleQRScanned = (productId) => {
    const product = products.find(p => p.id === productId)
    if (!product) return null
    addToCart(product)
    return product.name
  }

  const totalAmount = cart.reduce((sum, c) => sum + c.unitPrice * c.qty, 0)
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0)

  const handleSell = () => {
    if (cart.length === 0) return alert('판매할 상품을 담아주세요.')
    for (const c of cart) {
      if (c.product.stock < c.qty) return alert(`"${c.product.name}" 재고가 부족해요.\n현재 재고: ${c.product.stock}개, 판매 수량: ${c.qty}개`)
      if (c.unitPrice <= 0) return alert(`"${c.product.name}"의 판매가를 확인해주세요.`)
    }
    const saleTime = new Date().toISOString()
    cart.forEach(c => {
      addSale({ productId: c.product.id, productName: c.product.name, qty: c.qty, unitPrice: c.unitPrice, totalPrice: c.unitPrice * c.qty, costPrice: c.product.costPrice, time: saleTime })
      deductStock(c.product.id, c.qty)
    })
    setDoneData({ cart: [...cart], totalAmount })
    setDone(true)
  }

  // ── 뽑기 판매 로직 ─────────────────────────────────────────
  const gachaTotalSelected = gachaCart.reduce((s, c) => s + c.qty, 0)
  const gachaRemaining = selectedGrade ? selectedGrade.allowance - gachaTotalSelected : 0

  const addToGachaCart = (product) => {
    if (gachaRemaining <= 0) return
    setGachaCart(prev => {
      const exists = prev.find(c => c.product.id === product.id)
      if (exists) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product, qty: 1 }]
    })
  }
  const removeFromGachaCart = (productId) => setGachaCart(prev => prev.filter(c => c.product.id !== productId))
  const updateGachaQty = (productId, delta) => setGachaCart(prev => prev.map(c => {
    if (c.product.id !== productId) return c
    const newQty = c.qty + delta
    return newQty <= 0 ? null : { ...c, qty: newQty }
  }).filter(Boolean))

  const handleGachaSell = () => {
    if (!selectedGrade) return alert('등수를 선택해주세요.')
    if (gachaCart.length === 0) return alert('상품을 선택해주세요.')
    for (const c of gachaCart) {
      if (c.product.stock < c.qty) return alert(`"${c.product.name}" 재고가 부족해요.`)
    }
    const saleData = {
      gradeName: selectedGrade.name,
      gradePrice: selectedGrade.price,
      products: gachaCart.map(c => ({ productId: c.product.id, productName: c.product.name, qty: c.qty, costPrice: c.product.costPrice }))
    }
    addGachaSale(saleData)
    setGachaDoneData({ ...saleData, cart: [...gachaCart] })
    setGachaDone(true)
  }


  // ── 완료 화면 ───────────────────────────────────────────────
  if (done && doneData) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={40} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>판매 완료!</h2>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {doneData.cart.map(c => (
            <div key={c.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#475569' }}>{c.product.name} × {c.qty}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{(c.unitPrice * c.qty).toLocaleString()}원</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700' }}>합계</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>{doneData.totalAmount.toLocaleString()}원</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => { setCart([]); setDone(false); setDoneData(null) }} style={{ background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}>추가 판매 입력</button>
          <button onClick={onDone} style={{ background: '#f1f5f9', color: '#475569', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}>내역 보기</button>
        </div>
      </div>
    )
  }

  if (gachaDone && gachaDoneData) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#ede9fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Gift size={40} color="#6366f1" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>뽑기 완료!</h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>{gachaDoneData.gradeName} · {gachaDoneData.gradePrice.toLocaleString()}원</p>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {gachaDoneData.cart.map(c => (
            <div key={c.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#475569' }}>{c.product.name} × {c.qty}</span>
              <span style={{ fontSize: '13px', background: '#ede9fe', color: '#6366f1', borderRadius: '20px', padding: '2px 10px', fontWeight: '600' }}>뽑기</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700' }}>뽑기 가격</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>{gachaDoneData.gradePrice.toLocaleString()}원</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => { setGachaCart([]); setSelectedGrade(null); setGachaDone(false); setGachaDoneData(null) }} style={{ background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}>추가 뽑기 입력</button>
          <button onClick={onDone} style={{ background: '#f1f5f9', color: '#475569', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}>내역 보기</button>
        </div>
      </div>
    )
  }

  // ── 메인 화면 ───────────────────────────────────────────────
  return (
    <div style={{ padding: '20px', paddingBottom: (saleMode === 'normal' ? cart.length : gachaCart.length) > 0 ? 'calc(110px + env(safe-area-inset-bottom))' : 'calc(20px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showScanner && <QRScanModal cart={cart} onScanned={handleQRScanned} onClose={() => setShowScanner(false)} />}
      {showGradeSettings && <GradeSettingsModal onClose={() => { setShowGradeSettings(false); refreshGrades() }} />}

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>판매 입력</h1>
        {saleMode === 'normal' && (
          <button onClick={() => setShowScanner(true)} style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
            <ScanLine size={16} /> QR 스캔
          </button>
        )}
      </div>

      {/* 모드 전환 탭 */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', gap: '4px' }}>
        {[{ id: 'normal', label: '일반 판매', icon: <ShoppingCart size={15} /> }, { id: 'gacha', label: '뽑기 판매', icon: <Gift size={15} /> }].map(m => (
          <button key={m.id} onClick={() => setSaleMode(m.id)} style={{
            flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            background: saleMode === m.id ? '#fff' : 'transparent',
            color: saleMode === m.id ? '#6366f1' : '#94a3b8',
            boxShadow: saleMode === m.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.15s',
          }}>
            {m.icon}{m.label}
          </button>
        ))}
      </div>

      {/* ── 일반 판매 ── */}
      {saleMode === 'normal' && (
        <>
          {cart.length > 0 && (
            <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ padding: '14px 16px', background: '#eef2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#4338ca' }}>🛒 {cart.length}종 · {totalItems}개</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1' }}>{totalAmount.toLocaleString()}원</span>
              </div>
              {cart.map((c, i) => (
                <div key={c.product.id} style={{ padding: '14px 16px', borderBottom: i < cart.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{c.product.name}</span>
                    <button onClick={() => removeFromCart(c.product.id)} style={{ background: 'none', color: '#cbd5e1', padding: '4px' }}><Trash2 size={15} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '6px 10px', border: '1px solid #e2e8f0' }}>
                      <button onClick={() => updateQty(c.product.id, -1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}><Minus size={15} /></button>
                      <span style={{ fontSize: '16px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{c.qty}</span>
                      <button onClick={() => updateQty(c.product.id, 1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}><Plus size={15} /></button>
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>×</span>
                    <input type="number" value={c.unitPrice} onChange={e => updatePrice(c.product.id, e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', outline: 'none', textAlign: 'right' }} />
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>원</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1', minWidth: '70px', textAlign: 'right' }}>= {(c.unitPrice * c.qty).toLocaleString()}원</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <button onClick={() => setExpandProduct(v => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', padding: '4px 0', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }}>상품 선택</span>
              {expandProduct ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
            </button>
            {expandProduct && <ProductList isGacha={false} products={products} categories={categories} activeCat={activeCat} setActiveCat={setActiveCat} cart={cart} gachaCart={gachaCart} gachaRemaining={gachaRemaining} onAdd={addToCart} onAddGacha={addToGachaCart} />}
          </div>
        </>
      )}

      {/* ── 뽑기 판매 ── */}
      {saleMode === 'gacha' && (
        <>
          {/* 등수 선택 */}
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#475569' }}>뽑기 등수 선택</span>
              <button onClick={() => setShowGradeSettings(true)} style={{ background: '#f1f5f9', color: '#6366f1', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Settings size={13} /> 등수 설정
              </button>
            </div>
            {grades.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '8px' }}>등수를 먼저 설정해주세요</p>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {grades.map(g => (
                  <button key={g.id} onClick={() => { setSelectedGrade(g); setGachaCart([]); setActiveCat('all') }} style={{
                    padding: '10px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                    background: selectedGrade?.id === g.id ? '#6366f1' : '#f1f5f9',
                    color: selectedGrade?.id === g.id ? '#fff' : '#475569',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                  }}>
                    <span>{g.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: '400', opacity: 0.8 }}>{g.allowance}개 · {g.price.toLocaleString()}원</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 등수 상품 담기 */}
          {selectedGrade && (
            <>
              {/* 선택 현황 바 */}
              <div style={{ background: gachaRemaining === 0 ? '#ede9fe' : '#eef2ff', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#4338ca' }}>🎁 {selectedGrade.name}</span>
                  <span style={{ fontSize: '13px', color: '#6366f1', marginLeft: '8px' }}>{gachaTotalSelected}/{selectedGrade.allowance}개 선택</span>
                </div>
                {gachaRemaining > 0
                  ? <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: '600' }}>{gachaRemaining}개 더 선택 가능</span>
                  : <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '700' }}>✓ 선택 완료</span>}
              </div>

              {/* 담은 목록 */}
              {gachaCart.length > 0 && (
                <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
                  {gachaCart.map((c, i) => (
                    <div key={c.product.id} style={{ padding: '12px 16px', borderBottom: i < gachaCart.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{c.product.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', borderRadius: '8px', padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                        <button onClick={() => updateGachaQty(c.product.id, -1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}><Minus size={13} /></button>
                        <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>{c.qty}</span>
                        <button onClick={() => gachaRemaining > 0 && updateGachaQty(c.product.id, 1)} style={{ background: 'none', color: gachaRemaining > 0 ? '#94a3b8' : '#e2e8f0', display: 'flex' }}><Plus size={13} /></button>
                      </div>
                      <button onClick={() => removeFromGachaCart(c.product.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '6px', padding: '5px', display: 'flex' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* 상품 목록 */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#475569', marginBottom: '10px' }}>상품 선택 {gachaRemaining <= 0 && <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '12px' }}>(선택 완료 — 더 담으려면 수량 조절)</span>}</div>
                <ProductList isGacha={true} products={products} categories={categories} activeCat={activeCat} setActiveCat={setActiveCat} cart={cart} gachaCart={gachaCart} gachaRemaining={gachaRemaining} onAdd={addToCart} onAddGacha={addToGachaCart} />
              </div>
            </>
          )}
        </>
      )}

      {/* 하단 고정 바 — 일반 */}
      {saleMode === 'normal' && cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', zIndex: 50 }}>
          {cartExpanded && (
            <div style={{ borderBottom: '1px solid #e2e8f0', maxHeight: '40vh', overflowY: 'auto' }}>
              {cart.map((c, i) => (
                <div key={c.product.id} style={{ padding: '12px 20px', borderBottom: i < cart.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', flex: 1 }}>{c.product.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', borderRadius: '8px', padding: '4px 8px' }}>
                      <button onClick={() => updateQty(c.product.id, -1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}><Minus size={13} /></button>
                      <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{c.qty}</span>
                      <button onClick={() => updateQty(c.product.id, 1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}><Plus size={13} /></button>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', minWidth: '64px', textAlign: 'right' }}>{(c.unitPrice * c.qty).toLocaleString()}원</span>
                    <button onClick={() => removeFromCart(c.product.id)} style={{ background: 'none', color: '#cbd5e1', display: 'flex', padding: '2px' }}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setCartExpanded(v => !v)} style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <ChevronUp size={16} color="#6366f1" style={{ transform: cartExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1' }}>{totalItems}개</span>
            </button>
            <button onClick={handleSell} style={{ flex: 1, background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ShoppingCart size={18} />{totalAmount.toLocaleString()}원 판매 완료
            </button>
          </div>
        </div>
      )}

      {/* 하단 고정 바 — 뽑기 */}
      {saleMode === 'gacha' && selectedGrade && gachaCart.length > 0 && (
        <div style={{ position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom))', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', zIndex: 50, padding: '12px 16px' }}>
          <button onClick={handleGachaSell} style={{ width: '100%', background: gachaRemaining === 0 ? '#6366f1' : '#8b5cf6', color: '#fff', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Gift size={18} />
            {selectedGrade.name} 뽑기 완료 — {selectedGrade.price.toLocaleString()}원
            {gachaRemaining > 0 && <span style={{ fontSize: '12px', opacity: 0.8 }}>({gachaRemaining}개 남음)</span>}
          </button>
        </div>
      )}
    </div>
  )
}
