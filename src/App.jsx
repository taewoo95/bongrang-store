import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import SaleInput from './components/SaleInput'
import History from './components/History'
import Analysis from './components/Analysis'
import { Home, Package, ShoppingCart, CalendarDays, BarChart2 } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: '홈', icon: Home },
  { id: 'products', label: '상품', icon: Package },
  { id: 'sale', label: '판매', icon: ShoppingCart },
  { id: 'history', label: '내역', icon: CalendarDays },
  { id: 'analysis', label: '분석', icon: BarChart2 },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' }}>
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'products' && <Products />}
        {tab === 'sale' && <SaleInput onDone={() => setTab('history')} />}
        {tab === 'history' && <History />}
        {tab === 'analysis' && <Analysis />}
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        height: 'env(safe-area-inset-bottom)',
        background: '#000', zIndex: 99,
      }} />
      <nav style={{
        position: 'fixed', bottom: 'env(safe-area-inset-bottom)', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        background: '#fff', borderTop: '1px solid #e2e8f0',
        display: 'flex', zIndex: 100,
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, padding: '10px 0', background: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: tab === id ? '#6366f1' : '#94a3b8',
              fontSize: '11px', fontWeight: tab === id ? '600' : '400',
              borderTop: tab === id ? '2px solid #6366f1' : '2px solid transparent',
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
