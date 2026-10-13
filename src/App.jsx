import React, { useState } from 'react'
import { AppProvider } from './contexts/AppContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import TradeLog from './pages/TradeLog'
import AddTrade from './pages/AddTrade'
import Profile from './pages/Profile'

const PAGES = {
  dashboard: Dashboard,
  log:       TradeLog,
  add:       AddTrade,
  profile:   Profile,
}

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  log:       'Trade Log',
  add:       'Add Trade',
  profile:   'Profile',
}

function Topbar({ tab }) {
  return (
    <div style={{
      height: 'var(--topbar-h)',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 8,
      flexShrink: 0,
    }}>
      <div style={{ width: 4, height: 16, background: 'var(--green)', borderRadius: 2 }} />
      <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>
        {PAGE_TITLES[tab]?.toUpperCase()}
      </span>
      {/* right side: live indicator */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease infinite' }} />
        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1.5 }}>LOCAL</span>
      </div>
    </div>
  )
}

function AppInner() {
  const [tab, setTab] = useState('dashboard')
  const Page = PAGES[tab]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar tab={tab} />
        <div style={{ flex: 1, overflow: 'hidden' }} key={tab}>
          <Page />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
