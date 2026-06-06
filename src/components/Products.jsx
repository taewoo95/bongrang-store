import { useState } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory, deleteCategory, reorderCategories } from '../store'
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Tag, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react'

const EMPTY_FORM = { name: '', categoryId: '', costPrice: '', sellPrice: '', stock: '', lowStockAlert: '5' }

export default function Products() {
  const sortedProducts = () => getProducts().sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const [products, setProducts] = useState(sortedProducts)
  const [categories, setCategories] = useState(getCategories)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [showCatPanel, setShowCatPanel] = useState(false)
  const [activeCat, setActiveCat] = useState('all') // 'all' | categoryId | 'none'
  const [collapsedCats, setCollapsedCats] = useState({})

  const refresh = () => { setProducts(sortedProducts()); setCategories(getCategories()) }

  const handleSubmit = () => {
    if (!form.name || !form.sellPrice) return alert('상품명과 판매가는 필수입니다.')
    const data = {
      name: form.name,
      categoryId: form.categoryId || null,
      costPrice: Number(form.costPrice) || 0,
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock) || 0,
      lowStockAlert: Number(form.lowStockAlert) || 0,
    }
    if (editId) updateProduct(editId, data)
    else addProduct(data)
    setShowForm(false); setEditId(null); setForm(EMPTY_FORM); refresh()
  }

  const handleEdit = (p) => {
    setForm({ name: p.name, categoryId: p.categoryId || '', costPrice: String(p.costPrice), sellPrice: String(p.sellPrice), stock: String(p.stock), lowStockAlert: String(p.lowStockAlert) })
    setEditId(p.id); setShowForm(true)
  }

  const handleDelete = (id) => {
    if (!confirm('정말 삭제할까요?')) return
    deleteProduct(id); refresh()
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    try { addCategory(newCatName.trim()); setNewCatName(''); refresh() }
    catch (e) { alert(e.message) }
  }

  const handleDeleteCategory = (id) => {
    if (!confirm('카테고리를 삭제하면 소속 상품의 카테고리가 해제돼요. 계속할까요?')) return
    deleteCategory(id); refresh()
  }

  const handleMoveCategory = (idx, dir) => {
    const next = [...categories]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    reorderCategories(next)
    setCategories(next)
  }

  const toggleCollapse = (id) => setCollapsedCats(prev => ({ ...prev, [id]: !prev[id] }))

  // 필터링된 상품
  const filteredProducts = activeCat === 'all' ? products
    : activeCat === 'none' ? products.filter(p => !p.categoryId)
    : products.filter(p => p.categoryId === activeCat)

  // 카테고리별 그룹 (전체 보기일 때)
  const grouped = {}
  if (activeCat === 'all') {
    categories.forEach(c => { grouped[c.id] = { cat: c, items: products.filter(p => p.categoryId === c.id) } })
    const uncategorized = products.filter(p => !p.categoryId)
    if (uncategorized.length > 0) grouped['none'] = { cat: { id: 'none', name: '미분류' }, items: uncategorized }
  }

  const inputStyle = { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', outline: 'none', background: '#f8fafc' }
  const labelStyle = { fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'block' }

  const ProductCard = ({ p }) => (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '14px 16px',
      borderLeft: p.stock <= p.lowStockAlert && p.lowStockAlert > 0 ? '3px solid #ef4444' : '3px solid transparent',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
            {p.stock <= p.lowStockAlert && p.lowStockAlert > 0 && <AlertTriangle size={13} color="#ef4444" />}
          </div>
          <div style={{ marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>원가: <b style={{ color: '#1e293b' }}>{p.costPrice.toLocaleString()}원</b></span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>판매가: <b style={{ color: '#6366f1' }}>{p.sellPrice.toLocaleString()}원</b></span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>재고: <b style={{ color: p.stock <= p.lowStockAlert && p.lowStockAlert > 0 ? '#ef4444' : '#1e293b' }}>{p.stock}개</b></span>
            <span style={{ fontSize: '12px', color: '#10b981' }}>마진: {p.sellPrice - p.costPrice > 0 ? `${(p.sellPrice - p.costPrice).toLocaleString()}원 (${Math.round((p.sellPrice - p.costPrice) / p.sellPrice * 100)}%)` : '-'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
          <button onClick={() => handleEdit(p)} style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><Edit2 size={14} /></button>
          <button onClick={() => handleDelete(p.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>상품 관리</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }}
          style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}
        >
          <Plus size={16} /> 상품 추가
        </button>
      </div>

      {/* 카테고리 관리 */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <button
          onClick={() => setShowCatPanel(v => !v)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={15} color="#6366f1" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>카테고리 관리</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '20px', padding: '2px 8px' }}>{categories.length}개</span>
          </div>
          {showCatPanel ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </button>

        {showCatPanel && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 카테고리 추가 입력 */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                placeholder="새 카테고리명 입력"
                style={{ ...inputStyle, padding: '10px 12px', fontSize: '14px' }}
              />
              <button onClick={handleAddCategory} style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> 추가
              </button>
            </div>

            {/* 카테고리 목록 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {categories.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8' }}>카테고리를 추가해보세요</span>}
              {categories.map((c, idx) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', borderRadius: '10px', padding: '8px 10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button onClick={() => handleMoveCategory(idx, -1)} disabled={idx === 0} style={{ background: 'none', color: idx === 0 ? '#e2e8f0' : '#94a3b8', padding: '1px', display: 'flex', cursor: idx === 0 ? 'default' : 'pointer' }}>
                      <ArrowUp size={12} />
                    </button>
                    <button onClick={() => handleMoveCategory(idx, 1)} disabled={idx === categories.length - 1} style={{ background: 'none', color: idx === categories.length - 1 ? '#e2e8f0' : '#94a3b8', padding: '1px', display: 'flex', cursor: idx === categories.length - 1 ? 'default' : 'pointer' }}>
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600', flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8', background: '#e2e8f0', borderRadius: '20px', padding: '2px 8px' }}>
                    {products.filter(p => p.categoryId === c.id).length}개
                  </span>
                  <button onClick={() => handleDeleteCategory(c.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '6px', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 상품 추가/수정 폼 */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{editId ? '상품 수정' : '새 상품 추가'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', color: '#94a3b8' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>상품명 *</label>
              <input style={inputStyle} placeholder="예: 고양이 키링" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select style={{ ...inputStyle, color: form.categoryId ? '#1e293b' : '#94a3b8' }} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">카테고리 없음</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>원가 (원)</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>판매가 (원) *</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>현재 재고 (개)</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>부족 알림 기준 (개)</label>
                <input style={inputStyle} type="number" placeholder="5" value={form.lowStockAlert} onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} />
              </div>
            </div>
            <button onClick={handleSubmit} style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Check size={18} /> {editId ? '수정 완료' : '추가 완료'}
            </button>
          </div>
        </div>
      )}

      {/* 카테고리 필터 탭 */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[{ id: 'all', name: '전체' }, ...categories, { id: 'none', name: '미분류' }].map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
            background: activeCat === c.id ? '#6366f1' : '#fff',
            color: activeCat === c.id ? '#fff' : '#64748b',
            border: activeCat === c.id ? 'none' : '1px solid #e2e8f0',
            boxShadow: activeCat === c.id ? '0 2px 6px rgba(99,102,241,0.3)' : 'none',
          }}>
            {c.name}
          </button>
        ))}
      </div>

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: '15px' }}>등록된 상품이 없어요</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>위의 상품 추가 버튼을 눌러주세요</p>
        </div>
      ) : activeCat === 'all' ? (
        // 카테고리별 그룹 표시
        Object.values(grouped).map(({ cat, items }) => (
          items.length === 0 ? null :
          <div key={cat.id}>
            <button onClick={() => toggleCollapse(cat.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', padding: '4px 0', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }}>{cat.name}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '20px', padding: '2px 8px' }}>{items.length}개</span>
              </div>
              {collapsedCats[cat.id] ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronUp size={16} color="#94a3b8" />}
            </button>
            {!collapsedCats[cat.id] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                {items.map(p => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        ))
      ) : (
        // 필터 보기
        filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <p>이 카테고리에 상품이 없어요</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProducts.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        )
      )}
    </div>
  )
}
