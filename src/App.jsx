import { useState } from 'react'
import { LangProvider, useLang } from './LangContext'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import SaleInput from './components/SaleInput'
import History from './components/History'
import Analysis from './components/Analysis'
import { Home, Package, ShoppingCart, CalendarDays, BarChart2 } from 'lucide-react'

function AppInner() {
  const [tab, setTab] = useState('dashboard')
  const { t } = useLang()

  const TABS = [
    { id: 'dashboard', labelKey: 'tab_home',     icon: Home },
    { id: 'products',  labelKey: 'tab_items',    icon: Package },
    { id: 'sale',      labelKey: 'tab_sale',     icon: ShoppingCart },
    { id: 'history',   labelKey: 'tab_history',  icon: CalendarDays },
    { id: 'analysis',  labelKey: 'tab_analysis', icon: BarChart2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'products'  && <Products />}
        {tab === 'sale'      && <SaleInput onDone={() => setTab('history')} />}
        {tab === 'history'   && <History />}
        {tab === 'analysis'  && <Analysis />}
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
        display: 'flex', zIndex: 100, height: '56px',
      }}>
        {TABS.map(({ id, labelKey, icon: Icon }) => (
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
            {t(labelKey)}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  )
}
