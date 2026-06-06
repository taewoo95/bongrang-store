import { useState } from 'react'
import { getProducts, getCategories, addSale, deductStock } from '../store'
import { ShoppingCart, Check, Plus, Minus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function SaleInput({ onDone }) {
  const [products] = useState(getProducts)
  const [categories] = useState(getCategories)
  const [cart, setCart] = useState([]) // [{ product, qty, unitPrice }]
  const [done, setDone] = useState(false)
  const [expandProduct, setExpandProduct] = useState(true)
  const [activeCat, setActiveCat] = useState('all')

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(c => c.product.id === product.id)
      if (exists) {
        return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return [...prev, { product, qty: 1, unitPrice: product.sellPrice }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(c => c.product.id !== productId))
  }

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c
      const newQty = c.qty + delta
      return newQty <= 0 ? null : { ...c, qty: newQty }
    }).filter(Boolean))
  }

  const updatePrice = (productId, price) => {
    setCart(prev => prev.map(c =>
      c.product.id === productId ? { ...c, unitPrice: Number(price) || 0 } : c
    ))
  }

  const totalAmount = cart.reduce((sum, c) => sum + c.unitPrice * c.qty, 0)
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0)

  const ProductButton = ({ p }) => {
    const inCart = cart.find(c => c.product.id === p.id)
    return (
      <button
        onClick={() => addToCart(p)}
        style={{
          background: inCart ? '#eef2ff' : '#fff',
          border: inCart ? '2px solid #6366f1' : '2px solid #e2e8f0',
          borderRadius: '12px', padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{p.name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>재고 {p.stock}개</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {inCart && (
            <span style={{ background: '#6366f1', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '700' }}>
              {inCart.qty}개
            </span>
          )}
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#6366f1' }}>{p.sellPrice.toLocaleString()}원</span>
          <div style={{
            width: '28px', height: '28px', background: inCart ? '#6366f1' : '#f1f5f9',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={16} color={inCart ? '#fff' : '#94a3b8'} />
          </div>
        </div>
      </button>
    )
  }

  const handleSell = () => {
    if (cart.length === 0) return alert('판매할 상품을 담아주세요.')
    for (const c of cart) {
      if (c.product.stock < c.qty) {
        return alert(`"${c.product.name}" 재고가 부족해요.\n현재 재고: ${c.product.stock}개, 판매 수량: ${c.qty}개`)
      }
      if (c.unitPrice <= 0) {
        return alert(`"${c.product.name}"의 판매가를 확인해주세요.`)
      }
    }

    const saleTime = new Date().toISOString()
    cart.forEach(c => {
      addSale({
        productId: c.product.id,
        productName: c.product.name,
        qty: c.qty,
        unitPrice: c.unitPrice,
        totalPrice: c.unitPrice * c.qty,
        costPrice: c.product.costPrice,
        time: saleTime,
      })
      deductStock(c.product.id, c.qty)
    })
    setDone(true)
  }

  if (done) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <Check size={40} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>판매 완료!</h2>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {cart.map(c => (
            <div key={c.product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '14px', color: '#475569' }}>{c.product.name} × {c.qty}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{(c.unitPrice * c.qty).toLocaleString()}원</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: '700' }}>합계</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>{totalAmount.toLocaleString()}원</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => { setCart([]); setDone(false) }}
            style={{ background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}
          >
            추가 판매 입력
          </button>
          <button
            onClick={onDone}
            style={{ background: '#f1f5f9', color: '#475569', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}
          >
            내역 보기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700' }}>판매 입력</h1>

      {/* 장바구니 */}
      {cart.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          <div style={{ padding: '14px 16px', background: '#eef2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#4338ca' }}>
              🛒 담은 상품 {cart.length}종 · {totalItems}개
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#6366f1' }}>
              {totalAmount.toLocaleString()}원
            </span>
          </div>
          {cart.map((c, i) => (
            <div key={c.product.id} style={{
              padding: '14px 16px',
              borderBottom: i < cart.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{c.product.name}</span>
                <button onClick={() => removeFromCart(c.product.id)} style={{ background: 'none', color: '#cbd5e1', padding: '4px' }}>
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* 수량 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '6px 10px', border: '1px solid #e2e8f0' }}>
                  <button onClick={() => updateQty(c.product.id, -1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}>
                    <Minus size={15} />
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{c.qty}</span>
                  <button onClick={() => updateQty(c.product.id, 1)} style={{ background: 'none', color: '#94a3b8', display: 'flex' }}>
                    <Plus size={15} />
                  </button>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>×</span>
                {/* 단가 */}
                <input
                  type="number"
                  value={c.unitPrice}
                  onChange={e => updatePrice(c.product.id, e.target.value)}
                  style={{
                    flex: 1, padding: '8px 10px', border: '1px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '14px', background: '#f8fafc', outline: 'none', textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>원</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366f1', minWidth: '70px', textAlign: 'right' }}>
                  = {(c.unitPrice * c.qty).toLocaleString()}원
                </span>
              </div>
            </div>
          ))}
          <div style={{ padding: '14px 16px' }}>
            <button
              onClick={handleSell}
              style={{
                width: '100%', background: '#6366f1', color: '#fff', borderRadius: '12px',
                padding: '16px', fontSize: '16px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}
            >
              <ShoppingCart size={20} />
              {cart.length}종 {totalItems}개 · {totalAmount.toLocaleString()}원 판매 완료
            </button>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      <div>
        <button
          onClick={() => setExpandProduct(v => !v)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', padding: '4px 0', marginBottom: '10px',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }}>상품 선택</span>
          {expandProduct ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
        </button>

        {expandProduct && (
          products.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
              등록된 상품이 없어요. 먼저 상품 탭에서 추가해주세요.
            </div>
          ) : (
            <>
              {/* 카테고리 필터 탭 */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '10px' }}>
                {[{ id: 'all', name: '전체' }, ...categories, { id: 'none', name: '미분류' }].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    style={{
                      padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
                      background: activeCat === c.id ? '#6366f1' : '#fff',
                      color: activeCat === c.id ? '#fff' : '#64748b',
                      border: activeCat === c.id ? 'none' : '1px solid #e2e8f0',
                      boxShadow: activeCat === c.id ? '0 2px 6px rgba(99,102,241,0.3)' : 'none',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* 카테고리별 상품 표시 */}
              {activeCat === 'all' ? (
                // 전체: 카테고리 섹션으로 그룹핑
                (() => {
                  const sections = [
                    ...categories.map(c => ({ cat: c, items: products.filter(p => p.categoryId === c.id) })),
                    { cat: { id: 'none', name: '미분류' }, items: products.filter(p => !p.categoryId) },
                  ].filter(s => s.items.length > 0)

                  return sections.length === 0 ? null : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {sections.map(({ cat, items }) => (
                        <div key={cat.id}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginBottom: '6px', paddingLeft: '2px' }}>
                            {cat.name} <span style={{ color: '#94a3b8', fontWeight: '400' }}>({items.length})</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(p => <ProductButton key={p.id} p={p} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()
              ) : (
                // 특정 카테고리 필터
                (() => {
                  const filtered = activeCat === 'none'
                    ? products.filter(p => !p.categoryId)
                    : products.filter(p => p.categoryId === activeCat)
                  return filtered.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      이 카테고리에 상품이 없어요
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filtered.map(p => <ProductButton key={p.id} p={p} />)}
                    </div>
                  )
                })()
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
