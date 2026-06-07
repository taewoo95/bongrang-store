import { useState, useRef, useEffect } from 'react'
import { getProducts, getSales, getGachaSales, exportBackup, importBackup } from '../store'
import { AlertTriangle, TrendingUp, ShoppingBag, Package, Download, Upload, FilePlus, Smartphone, RefreshCw } from 'lucide-react'

export default function Dashboard({ onNavigate }) {
  const [restoreMsg, setRestoreMsg] = useState(null)
  const fileInputRef = useRef(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches
  )
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setIsInstalled(true); setInstallPrompt(null) }
  }

  const handleForceUpdate = async () => {
    setUpdating(true)
    try {
      // 모든 서비스워커 캐시 삭제 후 재시작
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    } finally {
      window.location.reload()
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const result = await importBackup(file)
      const date = new Date(result.exportedAt).toLocaleDateString('ko-KR')
      setRestoreMsg(`✅ 복원 완료! 상품 ${result.products}개, 판매내역 ${result.sales}건 (백업일: ${date})`)
      setTimeout(() => { setRestoreMsg(null); window.location.reload() }, 2000)
    } catch (err) {
      setRestoreMsg(`❌ ${err.message}`)
      setTimeout(() => setRestoreMsg(null), 3000)
    }
    e.target.value = ''
  }
  const products = getProducts()
  const sales = getSales()
  const gachaSales = getGachaSales()

  const today = new Date().toDateString()
  const todaySales = sales.filter(s => new Date(s.time).toDateString() === today)
  const todayGacha = gachaSales.filter(s => new Date(s.time).toDateString() === today)
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0)
    + todayGacha.reduce((sum, s) => sum + s.gradePrice, 0)
  const todayProfit = todaySales.reduce((sum, s) => sum + (s.totalPrice - s.costPrice * s.qty), 0)
    + todayGacha.reduce((sum, s) => sum + s.gradePrice - s.products.reduce((a, p) => a + (p.costPrice || 0) * p.qty, 0), 0)

  const lowStock = products.filter(p => p.stock <= p.lowStockAlert && p.lowStockAlert > 0)

  const card = (style) => ({
    background: '#fff', borderRadius: '16px', padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)', ...style
  })

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>재고관리</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* 오늘 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={card({ background: '#6366f1' })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingBag size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>오늘 매출</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>
            {todayRevenue.toLocaleString()}원
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {todaySales.length + todayGacha.length}건 판매
          </div>
        </div>

        <div style={card({ background: '#10b981' })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>오늘 이익</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>
            {todayProfit.toLocaleString()}원
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            이익률 {todayRevenue > 0 ? Math.round(todayProfit / todayRevenue * 100) : 0}%
          </div>
        </div>
      </div>

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <div style={{ ...card(), border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              재고 부족 알림 ({lowStock.length}개 상품)
            </span>
          </div>
          {lowStock.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid #fde68a'
            }}>
              <span style={{ fontSize: '14px', color: '#78350f' }}>{p.name}</span>
              <span style={{
                fontSize: '13px', fontWeight: '600', color: '#ef4444',
                background: '#fee2e2', padding: '2px 8px', borderRadius: '20px'
              }}>
                {p.stock}개 남음
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 빠른 이동 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={() => onNavigate('sale')}
          style={{
            ...card(), border: '2px solid #6366f1', color: '#6366f1',
            fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '16px'
          }}
        >
          <ShoppingBag size={18} />
          판매 입력
        </button>
        <button
          onClick={() => onNavigate('products')}
          style={{
            ...card(), border: '2px solid #e2e8f0', color: '#475569',
            fontSize: '15px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '16px'
          }}
        >
          <Package size={18} />
          상품 관리
        </button>
      </div>

      {/* 백업 / 복원 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>데이터 백업 / 복원</h3>
          <button
            onClick={handleForceUpdate}
            disabled={updating}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '600' }}
          >
            <RefreshCw size={13} style={{ animation: updating ? 'spin 1s linear infinite' : 'none' }} />
            {updating ? '업데이트 중…' : '앱 업데이트'}
          </button>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        {restoreMsg && (
          <div style={{ background: restoreMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#1e293b' }}>
            {restoreMsg}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* 덮어쓰기 저장 */}
          <button
            onClick={() => exportBackup({ newFile: false })}
            style={{
              background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: '12px',
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px',
              color: '#4338ca', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Download size={18} color="#6366f1" />
            <div>
              <div>백업 저장</div>
              <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: '400', marginTop: '1px' }}>재고관리_백업.json 으로 덮어쓰기</div>
            </div>
          </button>

          {/* 날짜별 새 파일 */}
          <button
            onClick={() => exportBackup({ newFile: true })}
            style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px',
              color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <FilePlus size={18} color="#94a3b8" />
            <div>
              <div>날짜별 저장</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '400', marginTop: '1px' }}>재고관리_백업_{new Date().toISOString().slice(0,10)}.json</div>
            </div>
          </button>

          {/* 복원 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px',
              padding: '13px 16px', display: 'flex', alignItems: 'center', gap: '10px',
              color: '#166534', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Upload size={18} color="#10b981" />
            <div>
              <div>복원 (불러오기)</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '400', marginTop: '1px' }}>저장된 백업 파일에서 복원</div>
            </div>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', textAlign: 'center' }}>
          백업 파일을 카카오톡·메모앱 등에 저장해두세요
        </p>
      </div>

      {/* 최근 판매 내역 */}
      <div style={card()}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
          최근 판매 내역
        </h3>
        {sales.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
            아직 판매 기록이 없어요
          </p>
        ) : (
          sales.slice(0, 5).map(s => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid #f1f5f9'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>{s.productName}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  {new Date(s.time).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{s.qty}개
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
                  {s.totalPrice.toLocaleString()}원
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 홈 화면에 추가 */}
      {!isInstalled && (installPrompt || /iphone|ipad|ipod/i.test(navigator.userAgent)) && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {installPrompt ? (
            <button
              onClick={handleInstall}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
              }}
            >
              <Smartphone size={22} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>홈 화면에 앱 추가</div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>아이콘으로 바로 실행 · 오프라인 지원</div>
              </div>
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Smartphone size={20} color="#6366f1" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>홈 화면에 앱 추가 (iOS)</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                Safari 하단 <b>공유 버튼 →</b> <b>"홈 화면에 추가"</b> 를 탭하면 앱처럼 설치돼요.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
