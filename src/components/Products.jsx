import { useState } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct } from '../store'
import { Plus, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react'

const EMPTY_FORM = { name: '', costPrice: '', sellPrice: '', stock: '', lowStockAlert: '5' }

export default function Products() {
  const [products, setProducts] = useState(getProducts)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)

  const refresh = () => setProducts(getProducts())

  const handleSubmit = () => {
    if (!form.name || !form.sellPrice) return alert('상품명과 판매가는 필수입니다.')
    const data = {
      name: form.name,
      costPrice: Number(form.costPrice) || 0,
      sellPrice: Number(form.sellPrice),
      stock: Number(form.stock) || 0,
      lowStockAlert: Number(form.lowStockAlert) || 0,
    }
    if (editId) {
      updateProduct(editId, data)
    } else {
      addProduct(data)
    }
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    refresh()
  }

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      costPrice: String(p.costPrice),
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
      lowStockAlert: String(p.lowStockAlert),
    })
    setEditId(p.id)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (!confirm('정말 삭제할까요?')) return
    deleteProduct(id)
    refresh()
  }

  const inputStyle = {
    width: '100%', padding: '12px', border: '1px solid #e2e8f0',
    borderRadius: '10px', fontSize: '15px', outline: 'none',
    background: '#f8fafc',
  }
  const labelStyle = { fontSize: '13px', color: '#64748b', marginBottom: '6px', display: 'block' }

  return (
    <div style={{ padding: '20px', paddingBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>상품 관리</h1>
        <button
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }}
          style={{
            background: '#6366f1', color: '#fff', borderRadius: '10px',
            padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '14px', fontWeight: '600',
          }}
        >
          <Plus size={16} /> 추가
        </button>
      </div>

      {/* 상품 추가/수정 폼 */}
      {showForm && (
        <div style={{
          background: '#fff', borderRadius: '16px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{editId ? '상품 수정' : '새 상품 추가'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', color: '#94a3b8' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>상품명 *</label>
              <input style={inputStyle} placeholder="예: 고양이 키링" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>원가 (원)</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.costPrice}
                  onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>판매가 (원) *</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.sellPrice}
                  onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>현재 재고 (개)</label>
                <input style={inputStyle} type="number" placeholder="0" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>부족 알림 기준 (개)</label>
                <input style={inputStyle} type="number" placeholder="5" value={form.lowStockAlert}
                  onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              style={{
                background: '#6366f1', color: '#fff', borderRadius: '10px',
                padding: '14px', fontSize: '15px', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              <Check size={18} /> {editId ? '수정 완료' : '추가 완료'}
            </button>
          </div>
        </div>
      )}

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: '15px' }}>등록된 상품이 없어요</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>위의 추가 버튼을 눌러 상품을 등록해보세요</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {products.map(p => (
            <div key={p.id} style={{
              background: '#fff', borderRadius: '14px', padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              borderLeft: p.stock <= p.lowStockAlert && p.lowStockAlert > 0 ? '3px solid #ef4444' : '3px solid transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{p.name}</span>
                    {p.stock <= p.lowStockAlert && p.lowStockAlert > 0 && (
                      <AlertTriangle size={14} color="#ef4444" />
                    )}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>원가: <b style={{ color: '#1e293b' }}>{p.costPrice.toLocaleString()}원</b></span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>판매가: <b style={{ color: '#6366f1' }}>{p.sellPrice.toLocaleString()}원</b></span>
                  </div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>재고: <b style={{ color: p.stock <= p.lowStockAlert && p.lowStockAlert > 0 ? '#ef4444' : '#1e293b' }}>{p.stock}개</b></span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>알림: <b>{p.lowStockAlert}개 이하</b></span>
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#10b981' }}>
                      마진: {p.sellPrice - p.costPrice > 0 ? `${(p.sellPrice - p.costPrice).toLocaleString()}원 (${Math.round((p.sellPrice - p.costPrice) / p.sellPrice * 100)}%)` : '-'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                  <button onClick={() => handleEdit(p)} style={{
                    background: '#f1f5f9', color: '#475569', borderRadius: '8px',
                    padding: '8px', display: 'flex', alignItems: 'center'
                  }}>
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} style={{
                    background: '#fee2e2', color: '#ef4444', borderRadius: '8px',
                    padding: '8px', display: 'flex', alignItems: 'center'
                  }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
