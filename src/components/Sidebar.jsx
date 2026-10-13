import React from 'react'
import { useApp } from '../contexts/AppContext'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import {
  LayoutDashboard, BookOpen, PlusCircle, User, TrendingUp, TrendingDown,
  Activity, Zap
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { id: 'log',       label: 'Trade Log',  Icon: BookOpen },
  { id: 'add',       label: 'Add Trade',  Icon: PlusCircle },
  { id: 'profile',   label: 'Profile',    Icon: User },
]

function ScoreArc({ score }) {
  const pct   = score / 10
  const R     = 38
  const circ  = 2 * Math.PI * R
  const arc   = circ * 0.75
  const dash  = arc * pct
  const color = score >= 7 ? '#00c076' : score >= 5 ? '#f5c842' : '#f0444a'

  return (
    <svg width="96" height="72" viewBox="0 0 96 72">
      <circle cx="48" cy="56" r={R} fill="none"
        stroke="#1a1a30" strokeWidth="6"
        strokeDasharray={`${arc} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform="rotate(-225 48 56)"
      />
      <circle cx="48" cy="56" r={R} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform="rotate(-225 48 56)"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray .6s ease' }}
      />
      <text x="48" y="58" textAnchor="middle"
        fontFamily="'Share Tech Mono'" fontSize="18" fontWeight="700" fill={color}>{score}</text>
      <text x="48" y="70" textAnchor="middle"
        fontFamily="'Rajdhani'" fontSize="8" fontWeight="700" letterSpacing="2" fill="#444468">/10</text>
    </svg>
  )
}

export default function Sidebar({ tab, setTab }) {
  const { stats, trades, capital } = useApp()

  // Mini equity data
  const closed = [...trades.filter(t => t.status === 'CLOSED')].reverse()
  let running = 0
  const equityData = closed.map((t, i) => {
    running += t.pnl || 0
    return { i, v: running }
  })
  const isPos = (equityData[equityData.length - 1]?.v ?? 0) >= 0

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        height: 'var(--topbar-h)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
        flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: 'linear-gradient(135deg, #00c076 0%, #3d9eff 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 14, color: '#000',
          flexShrink: 0,
        }}>R</div>
        <div>
          <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, letterSpacing: 2, lineHeight: 1.1 }}>ROTHSCHILD'S</div>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 8, letterSpacing: 3, color: 'var(--text3)', fontWeight: 700 }}>TERMINAL</div>
        </div>
      </div>

      {/* Score gauge */}
      <div style={{
        padding: '20px 18px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}>
        <div className="label" style={{ marginBottom: 6 }}>Performance Score</div>
        <ScoreArc score={stats.overallScore} />
        <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: '#00c076' }}>{stats.winRate.toFixed(0)}%</div>
            <div className="label" style={{ fontSize: 8 }}>WIN RATE</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: '#3d9eff' }}>{stats.pf.toFixed(2)}x</div>
            <div className="label" style={{ fontSize: 8 }}>PF</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: stats.streak >= 0 ? '#00c076' : '#f0444a' }}>
              {stats.streak > 0 ? `+${stats.streak}` : stats.streak}
            </div>
            <div className="label" style={{ fontSize: 8 }}>STREAK</div>
          </div>
        </div>
      </div>

      {/* Mini equity curve */}
      {equityData.length > 1 && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="label" style={{ fontSize: 8 }}>Equity Curve</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: isPos ? '#00c076' : '#f0444a' }}>
              {isPos ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={48}>
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="sb-eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={isPos ? '#00c076' : '#f0444a'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPos ? '#00c076' : '#f0444a'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={isPos ? '#00c076' : '#f0444a'}
                strokeWidth={1.5} fill="url(#sb-eq)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Balance */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
        <div className="label" style={{ marginBottom: 6 }}>Account</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Initial</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}>${capital.toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Balance</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#00c076' }}>${stats.currentBalance.toFixed(4)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Growth</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: stats.growth >= 0 ? '#00c076' : '#f0444a' }}>
              {stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              background: active ? 'var(--green-bg)' : 'transparent',
              border: `1px solid ${active ? 'var(--green-glow)' : 'transparent'}`,
              color: active ? '#00c076' : 'var(--text2)',
              textAlign: 'left',
              fontSize: 13, fontWeight: active ? 700 : 500,
              letterSpacing: active ? 0.5 : 0,
            }}>
              <Icon size={15} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{label.toUpperCase()}</span>
              {active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#00c076' }} />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--ff-display)', letterSpacing: 1.5, textAlign: 'center' }}>
          ROTHSCHILD'S TERMINAL v1.0 · LOCAL
        </div>
      </div>
    </aside>
  )
}
