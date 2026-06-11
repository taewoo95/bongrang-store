import { useState, useRef, useEffect } from 'react'
import { getProducts, getSales, getGachaSales, exportBackup, importBackup } from '../store'
import { AlertTriangle, TrendingUp, ShoppingBag, Package, Download, Upload, FilePlus, Smartphone, RefreshCw } from 'lucide-react'
import { useLang } from '../LangContext'

export default function Dashboard({ onNavigate }) {
  const { lang, setLang, t, fmt } = useLang()
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
      const date = new Date(result.exportedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ko-KR')
      setRestoreMsg(t('dash_restore_ok', result.products, result.sales, date))
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

  const dateStr = new Date().toLocaleDateString(
    lang === 'en' ? 'en-US' : 'ko-KR',
    { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
  )

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{t('dash_title')}</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{dateStr}</p>
        </div>
        {/* 언어 선택 버튼 */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          <button
            onClick={() => setLang('ko')}
            style={{
              padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              background: lang === 'ko' ? '#6366f1' : '#f1f5f9',
              color: lang === 'ko' ? '#fff' : '#64748b',
              border: 'none', cursor: 'pointer',
            }}
          >🇰🇷 한국어</button>
          <button
            onClick={() => setLang('en')}
            style={{
              padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
              background: lang === 'en' ? '#6366f1' : '#f1f5f9',
              color: lang === 'en' ? '#fff' : '#64748b',
              border: 'none', cursor: 'pointer',
            }}
          >🇺🇸 English</button>
        </div>
      </div>

      {/* 오늘 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={card({ background: '#6366f1' })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingBag size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{t('dash_today_revenue')}</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>
            {fmt(todayRevenue)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {t('dash_today_sales_count', todaySales.length + todayGacha.length)}
          </div>
        </div>

        <div style={card({ background: '#10b981' })}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{t('dash_today_profit')}</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>
            {fmt(todayProfit)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {t('dash_margin', todayRevenue > 0 ? Math.round(todayProfit / todayRevenue * 100) : 0)}
          </div>
        </div>
      </div>

      {/* 재고 부족 알림 */}
      {lowStock.length > 0 && (
        <div style={{ ...card(), border: '1px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              {t('dash_low_stock', lowStock.length)}
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
                {p.stock}{t('dash_left')}
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
          {t('dash_go_sale')}
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
          {t('dash_go_products')}
        </button>
      </div>

      {/* 백업 / 복원 */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{t('dash_backup_title')}</h3>
          <button
            onClick={handleForceUpdate}
            disabled={updating}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: '600' }}
          >
            <RefreshCw size={13} style={{ animation: updating ? 'spin 1s linear infinite' : 'none' }} />
            {updating ? t('dash_updating') : t('dash_update')}
          </button>
        </div>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        {restoreMsg && (
          <div style={{ background: restoreMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#1e293b' }}>
            {restoreMsg}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <button
            onClick={() => exportBackup({ newFile: false }).catch(() => {})}
            style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: '12px', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: '#4338ca', cursor: 'pointer' }}
          >
            <Download size={20} color="#6366f1" />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{t('dash_backup_save')}</span>
          </button>

          <button
            onClick={() => exportBackup({ newFile: true }).catch(() => {})}
            style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: '#475569', cursor: 'pointer' }}
          >
            <FilePlus size={20} color="#94a3b8" />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{t('dash_backup_date')}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '12px', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: '#166534', cursor: 'pointer' }}
          >
            <Upload size={20} color="#10b981" />
            <span style={{ fontSize: '12px', fontWeight: '600' }}>{t('dash_restore')}</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', textAlign: 'center' }}>
          {t('dash_backup_tip')}
        </p>
      </div>

      {/* 최근 판매 내역 */}
      <div style={card()}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
          {t('dash_recent')}
        </h3>
        {sales.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
            {t('dash_no_sales')}
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
                  {new Date(s.time).toLocaleString(lang === 'en' ? 'en-US' : 'ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{s.qty}{t('pcs')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#6366f1' }}>
                  {fmt(s.totalPrice)}
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
                <div style={{ fontSize: '15px', fontWeight: '700' }}>{t('dash_install')}</div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>{t('dash_install_sub')}</div>
              </div>
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Smartphone size={20} color="#6366f1" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{t('dash_install_ios')}</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
                {t('dash_install_ios_guide')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
