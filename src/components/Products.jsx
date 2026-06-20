/*
 * Products.jsx 수정 이력
 * ─────────────────────────────────────────────
 * 2026-06-06 카테고리 추가 입력창 항상 표시 (토글 버튼 제거)
 * 2026-06-06 카테고리 삭제 버튼 시각적으로 명확하게 개선 (빨간 아이콘)
 * 2026-06-06 카테고리 순서 변경 버튼 추가 (↑ ↓)
 * 2026-06-06 카테고리 관리 패널 접기/펼치기 토글 추가 (기본 접힘 상태)
 * 2026-06-06 상품 목록 이름 가나다순 정렬
 * 2026-06-06 각 상품 카드에 QR 코드 보기 버튼 추가
 * 2026-06-07 상품 추가/수정 폼을 하단 슬라이드업 모달로 변경 (수정 버튼 누르면 바로 표시)
 */
import { useState, useRef, useEffect } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory, deleteCategory, reorderCategories } from '../store'
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Tag, ChevronDown, ChevronUp, GripVertical, QrCode } from 'lucide-react'
import { QRViewModal } from './QRModal'
import { useLang } from '../LangContext'

const EMPTY_FORM = { name: '', categoryId: '', costPrice: '', sellPrice: '', stock: '', lowStockAlert: '5' }

export default function Products() {
  const { t, fmt } = useLang()
  const sortedProducts = () => getProducts().sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  const [products, setProducts] = useState(sortedProducts)
  const [categories, setCategories] = useState(getCategories)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [showCatPanel, setShowCatPanel] = useState(false)
  const [showDragHint, setShowDragHint] = useState(false)
  const hintDelayTimer = useRef(null)
  const hintHideTimer  = useRef(null)
  const [activeCat, setActiveCat] = useState('all') // 'all' | categoryId | 'none'
  const [collapsedCats, setCollapsedCats] = useState({})
  const [qrProduct, setQrProduct] = useState(null)

  const refresh = () => { setProducts(sortedProducts()); setCategories(getCategories()) }

  // 모달이 열려있는 동안 배경 스크롤 위치를 고정하고, 닫히면 원래 위치로 복원
  // (실제 스크롤 컨테이너는 body가 아니라 App.jsx의 .app-scroll div — 모달을 열 때
  //  모바일 브라우저가 렌더링과 동시에 이 컨테이너를 맨 위로 스크롤시켜버리는 경우가 있어,
  //  useEffect(렌더링 이후)에서 위치를 저장하면 이미 스크롤이 튄 뒤(0)를 저장하게 됨.
  //  그래서 버튼 클릭 시점(openForm)에 미리, 즉 스크롤이 튀기 전에 위치를 저장해둔다.
  //  또한 overflow:hidden만으로는 모달 내부 스크롤이 끝에 닿았을 때 그 스크롤이
  //  부모 컨테이너로 그대로 이어지는 "스크롤 체이닝" 현상을 막지 못해, 모달 내부에
  //  overscrollBehavior: 'contain'을 함께 적용한다)
  const savedScrollTop = useRef(0)
  // 버튼 클릭(onClick) 시점에는 이미 번년저가 포커스 이동 때문에 스크롤을 옥겨놓은
  // 듷일 수 있어, 그보다 먼저 발생하는 포인터/타시 시작 시점에 미리 캐처해둔다
  const captureScroll = () => {
    const container = document.querySelector('.app-scroll')
    if (container) savedScrollTop.current = container.scrollTop
  }
  const openForm = () => {
    captureScroll()
    setShowForm(true)
  }
  useEffect(() => {
    const container = document.querySelector('.app-scroll')
    if (!container) return

    if (showForm) {
      container.scrollTop = savedScrollTop.current
      const prevOverflow = container.style.overflow
      container.style.overflow = 'hidden'
      return () => {
        container.style.overflow = prevOverflow
        // 모달이 닫힌 직후 키보드가 접히며 한 번 더 스크롤이 튀는 경우가 있어 여러 차례 복원
        const restore = () => { container.scrollTop = savedScrollTop.current }
        restore()
        requestAnimationFrame(restore)
        setTimeout(restore, 100)
        setTimeout(restore, 350)
      }
    }
  }, [showForm])

  const handleSubmit = () => {
    if (!form.name || !form.sellPrice) return alert(t('prod_form_required'))
    const categoryId = form.categoryId || null
    const duplicate = products.find(p =>
      p.name.trim() === form.name.trim() &&
      p.categoryId === categoryId &&
      p.id !== editId
    )
    if (duplicate) {
      const catName = categoryId ? categories.find(c => c.id === categoryId)?.name : t('prod_uncategorized')
      return alert(t('prod_form_duplicate', form.name, catName))
    }
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
    setEditId(p.id); openForm()
  }

  const handleDelete = (id) => {
    if (!confirm(t('confirm_delete'))) return
    deleteProduct(id); refresh()
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    try { addCategory(newCatName.trim()); setNewCatName(''); refresh() }
    catch (e) { alert(e.message) }
  }

  const handleDeleteCategory = (id) => {
    if (!confirm(t('prod_cat_delete_confirm'))) return
    deleteCategory(id); refresh()
  }

  // 드래그 상태 — 실시간 순서 미리보기
  const [draggingId, setDraggingId] = useState(null)
  const [liveOrder, setLiveOrder] = useState(null)
  const displayed = liveOrder ?? categories

  // ref — 네이티브 이벤트 핸들러에서 최신 state 접근용
  const draggingIdRef  = useRef(null)
  const liveOrderRef   = useRef(null)
  const categoriesRef  = useRef(categories)
  const longPressTimer = useRef(null)
  const touchStartPos  = useRef(null)
  const listRef        = useRef(null)
  draggingIdRef.current  = draggingId
  liveOrderRef.current   = liveOrder
  categoriesRef.current  = categories

  // ── 터치 드래그: passive:false 네이티브 이벤트로 등록 ─────
  // (React 합성 이벤트는 passive:true라 preventDefault 불가 → iOS 롱프레스 touchend 차단 불가)
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const resetDrag = () => {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
      clearTimeout(hintDelayTimer.current)
      hintDelayTimer.current = null
      setShowDragHint(false)
      if (liveOrderRef.current && draggingIdRef.current) {
        reorderCategories(liveOrderRef.current)
        setCategories([...liveOrderRef.current])
      }
      draggingIdRef.current = null
      liveOrderRef.current  = null
      touchStartPos.current = null
      setDraggingId(null)
      setLiveOrder(null)
    }

    const onStart = (e) => {
      const grip = e.target.closest('[data-grip]')
      if (!grip) {
        // 그립 외 영역 홀드 시 안내 팝업
        const row = e.target.closest('[data-catid]')
        if (!row) return
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        hintDelayTimer.current = setTimeout(() => {
          hintDelayTimer.current = null
          setShowDragHint(true)
          clearTimeout(hintHideTimer.current)
          hintHideTimer.current = setTimeout(() => setShowDragHint(false), 1000)
        }, 500)
        return
      }
      const row = grip.closest('[data-catid]')
      if (!row) return
      e.preventDefault() // iOS 롱프레스 contextmenu / touchend 방지
      const id = row.dataset.catid
      touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null
        if (navigator.vibrate) navigator.vibrate(25)
        draggingIdRef.current = id
        liveOrderRef.current  = [...categoriesRef.current]
        setDraggingId(id)
        setLiveOrder([...categoriesRef.current])
      }, 500)
    }

    const onMove = (e) => {
      const dx = e.touches[0].clientX - (touchStartPos.current?.x ?? 0)
      const dy = e.touches[0].clientY - (touchStartPos.current?.y ?? 0)
      // 힌트 지연 대기 중 손가락이 움직이면 취소
      if (hintDelayTimer.current) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          clearTimeout(hintDelayTimer.current)
          hintDelayTimer.current = null
        }
        return
      }
      // 롱프레스 대기 중 손가락이 많이 움직이면 취소 (스크롤 허용)
      if (longPressTimer.current) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        return
      }
      if (!draggingIdRef.current) return
      e.preventDefault() // 드래그 중 스크롤 차단
      const touch = e.touches[0]
      const rows = list.querySelectorAll('[data-catid]')
      let hoverIdx = null
      rows.forEach((row, i) => {
        const r = row.getBoundingClientRect()
        if (touch.clientY >= r.top && touch.clientY < r.bottom) hoverIdx = i
      })
      if (hoverIdx === null) return
      const base = liveOrderRef.current ?? categoriesRef.current
      const fromIdx = base.findIndex(c => c.id === draggingIdRef.current)
      if (fromIdx === hoverIdx) return
      const arr = [...base]
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(hoverIdx, 0, moved)
      liveOrderRef.current = arr
      setLiveOrder([...arr])
    }

    list.addEventListener('touchstart',  onStart,    { passive: false })
    list.addEventListener('touchmove',   onMove,     { passive: false })
    list.addEventListener('touchend',    resetDrag)
    list.addEventListener('touchcancel', resetDrag)
    return () => {
      list.removeEventListener('touchstart',  onStart)
      list.removeEventListener('touchmove',   onMove)
      list.removeEventListener('touchend',    resetDrag)
      list.removeEventListener('touchcancel', resetDrag)
    }
  }, [showCatPanel]) // showCatPanel 변경 시 재실행 — 패널 오픈 후 listRef.current가 세팅됨

  // ── 마우스/데스크톱 드래그 ──────────────────────────────────
  const mouseDragId = useRef(null)
  const handleDragStart = (id) => { mouseDragId.current = id; setDraggingId(id); setLiveOrder([...categories]) }
  const handleDragEnter = (id) => {
    if (!mouseDragId.current || mouseDragId.current === id) return
    setLiveOrder(prev => {
      const arr = [...(prev ?? categories)]
      const from = arr.findIndex(c => c.id === mouseDragId.current)
      const to   = arr.findIndex(c => c.id === id)
      if (from === -1 || to === -1) return prev
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      return arr
    })
  }
  const handleDragEnd = () => {
    if (liveOrder) { reorderCategories(liveOrder); setCategories(liveOrder) }
    setLiveOrder(null); setDraggingId(null); mouseDragId.current = null
  }

  const toggleCollapse = (id) => setCollapsedCats(prev => ({ ...prev, [id]: !prev[id] }))

  // 필터링된 상품
  const validCatIds = new Set(categories.map(c => c.id))
  const filteredProducts = activeCat === 'all' ? products
    : activeCat === 'none' ? products.filter(p => !p.categoryId || !validCatIds.has(p.categoryId))
    : products.filter(p => p.categoryId === activeCat)

  // 카테고리별 그룹 (전체 보기일 때)
  const grouped = {}
  if (activeCat === 'all') {
    categories.forEach(c => { grouped[c.id] = { cat: c, items: products.filter(p => p.categoryId === c.id) } })
    const uncategorized = products.filter(p => !p.categoryId || !validCatIds.has(p.categoryId))
    if (uncategorized.length > 0) grouped['none'] = { cat: { id: 'none', name: t('prod_uncategorized') }, items: uncategorized }
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
            <span style={{ fontSize: '12px', color: '#64748b' }}>{t('prod_cost')}: <b style={{ color: '#1e293b' }}>{fmt(p.costPrice)}</b></span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{t('prod_price')}: <b style={{ color: '#6366f1' }}>{fmt(p.sellPrice)}</b></span>
          </div>
          <div style={{ marginTop: '4px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{t('prod_stock')}: <b style={{ color: p.stock <= p.lowStockAlert && p.lowStockAlert > 0 ? '#ef4444' : '#1e293b' }}>{p.stock}{t('pcs')}</b></span>
            <span style={{ fontSize: '12px', color: '#10b981' }}>Margin: {p.sellPrice - p.costPrice > 0 ? `${fmt(p.sellPrice - p.costPrice)} (${Math.round((p.sellPrice - p.costPrice) / p.sellPrice * 100)}%)` : '-'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
          <button onClick={() => setQrProduct(p)} style={{ background: '#f1f5f9', color: '#6366f1', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><QrCode size={14} /></button>
          <button onPointerDown={captureScroll} onClick={() => handleEdit(p)} style={{ background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><Edit2 size={14} /></button>
          <button onClick={() => handleDelete(p.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '8px', padding: '7px', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {qrProduct && <QRViewModal product={qrProduct} onClose={() => setQrProduct(null)} />}

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>{t('prod_title')}</h1>
        <button
          onPointerDown={captureScroll}
          onClick={() => { setForm(EMPTY_FORM); setEditId(null); openForm() }}
          style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}
        >
          <Plus size={16} /> {t('prod_add')}
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
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>{t('prod_cat_mgmt')}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '20px', padding: '2px 8px' }}>{categories.length}{t('pcs')}</span>
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
                placeholder={t('prod_cat_name')}
                style={{ ...inputStyle, padding: '10px 12px', fontSize: '14px' }}
              />
              <button onClick={handleAddCategory} style={{ background: '#6366f1', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> {t('add')}
              </button>
            </div>

            {/* 드래그 안내 팝업 */}
            {showDragHint && (
              <div style={{ background: 'rgba(0,0,0,0.72)', color: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', textAlign: 'center', marginBottom: '4px', pointerEvents: 'none' }}>
                ☰ {t('prod_cat_hint')}
              </div>
            )}

            {/* 카테고리 목록 — 그립 핸들 0.5초 홀드로 순서 변경 */}
            <div
              ref={listRef}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {categories.length === 0 && <span style={{ fontSize: '13px', color: '#94a3b8' }}>카테고리를 추가해보세요</span>}
              {displayed.map((c) => {
                const isGrabbed = draggingId === c.id
                return (
                  <div
                    key={c.id}
                    data-catid={c.id}
                    draggable
                    onDragStart={() => handleDragStart(c.id)}
                    onDragEnter={() => handleDragEnter(c.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: isGrabbed ? '#eef2ff' : '#f8fafc',
                      borderRadius: '10px', padding: '10px 10px',
                      border: isGrabbed ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      boxShadow: isGrabbed ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
                      transform: isGrabbed ? 'scale(1.02)' : 'scale(1)',
                      opacity: isGrabbed ? 0.9 : 1,
                      transition: 'transform 0.1s, box-shadow 0.1s, border 0.1s',
                    }}
                  >
                    {/* 그립 핸들 — 0.5초 홀드로 드래그 시작 */}
                    <div
                      data-grip="1"
                      style={{
                        display: 'flex', alignItems: 'center', padding: '6px 8px 6px 2px',
                        flexShrink: 0, cursor: 'grab', touchAction: 'none',
                      }}
                    >
                      <GripVertical size={20} color={isGrabbed ? '#6366f1' : '#94a3b8'} />
                    </div>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600', flex: 1 }}>{c.name}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', background: '#e2e8f0', borderRadius: '20px', padding: '2px 8px' }}>
                      {products.filter(p => p.categoryId === c.id).length}{t('pcs')}
                    </span>
                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: '#fee2e2', color: '#ef4444', borderRadius: '6px', padding: '4px 6px', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 상품 추가/수정 — 하단 슬라이드업 모달 */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', touchAction: 'none' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) } }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{editId ? t('prod_edit_title') : t('prod_add_title')}</h3>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }} style={{ background: 'none', color: '#94a3b8' }}><X size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>{t('prod_form_name')} *</label>
                <input style={inputStyle} placeholder={t('prod_form_name')} value={form.name} maxLength={50} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>{t('prod_form_category')}</label>
                <select style={{ ...inputStyle, color: form.categoryId ? '#1e293b' : '#94a3b8' }} value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">{t('prod_uncategorized')}</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>{t('prod_form_cost')}</label>
                  <input style={inputStyle} type="number" placeholder="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>{t('prod_form_price')} *</label>
                  <input style={inputStyle} type="number" placeholder="0" value={form.sellPrice} onChange={e => setForm(f => ({ ...f, sellPrice: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>{t('prod_form_stock')}</label>
                  <input style={inputStyle} type="number" placeholder="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>{t('prod_form_alert')}</label>
                  <input style={inputStyle} type="number" placeholder="5" value={form.lowStockAlert} onChange={e => setForm(f => ({ ...f, lowStockAlert: e.target.value }))} />
                </div>
              </div>
              <button onClick={handleSubmit} style={{ background: '#6366f1', color: '#fff', borderRadius: '12px', padding: '16px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Check size={18} /> {editId ? t('edit') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 필터 탭 */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {[{ id: 'all', name: t('all') }, ...categories, { id: 'none', name: t('prod_uncategorized') }].map(c => {
          const count = c.id === 'all' ? products.length
            : c.id === 'none' ? products.filter(p => !p.categoryId).length
            : products.filter(p => p.categoryId === c.id).length
          const isActive = activeCat === c.id
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
              background: isActive ? '#6366f1' : '#fff',
              color: isActive ? '#fff' : '#64748b',
              border: isActive ? 'none' : '1px solid #e2e8f0',
              boxShadow: isActive ? '0 2px 6px rgba(99,102,241,0.3)' : 'none',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              {c.name}
              <span style={{
                fontSize: '11px', fontWeight: '700',
                background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: isActive ? '#fff' : '#94a3b8',
                borderRadius: '20px', padding: '1px 6px',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 상품 목록 */}
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <p style={{ fontSize: '15px' }}>{t('prod_no_items')}</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>{t('prod_no_items_sub')}</p>
        </div>
      ) : activeCat === 'all' ? (
        // 카테고리별 그룹 표시
        Object.values(grouped).map(({ cat, items }) => (
          items.length === 0 ? null :
          <div key={cat.id}>
            <button onClick={() => toggleCollapse(cat.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', padding: '4px 0', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#475569' }}>{cat.name}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '20px', padding: '2px 8px' }}>{items.length}{t('pcs')}</span>
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
