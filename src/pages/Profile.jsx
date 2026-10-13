import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import { Download, Trash2, ChevronRight, BarChart2, Shield } from 'lucide-react'

const G = '#00c076', R = '#f0444a', B = '#3d9eff'

export default function Profile() {
  const { user, setUser, trades, capital, strategies, stats } = useApp()
  const [editName, setEditName]   = useState(false)
  const [name, setName]           = useState(user?.name || '')
  const [confirmReset, setConfirm] = useState(false)

  const saveName = () => { setUser(u => ({ ...(u || {}), name })); setEditName(false) }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), user, capital, strategies, trades }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rothschilds-trades-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }

  const reset = () => {
    if (confirmReset) { localStorage.clear(); window.location.reload() }
    else { setConfirm(true); setTimeout(() => setConfirm(false), 3000) }
  }

  const displayName = user?.name || 'Trader'

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, maxWidth: 1100 }}>

        {/* ── Left: User card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 24px', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00c076 0%, #3d9eff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 32, color: '#000',
              boxShadow: '0 0 30px rgba(0,192,118,0.2)',
            }}>
              {displayName[0]?.toUpperCase() || 'T'}
            </div>
            {editName ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  style={{ padding: '6px 12px', fontSize: 13, textAlign: 'center', maxWidth: 200 }}
                  placeholder="Your name" />
                <button onClick={saveName} style={{ background: G, color: '#000', borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11 }}>SAVE</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>{displayName}</div>
                <button onClick={() => { setName(user?.name || ''); setEditName(true) }}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>
                  EDIT NAME
                </button>
              </>
            )}
            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              {[
                { v: stats.totalTrades, l: 'TRADES' },
                { v: `${stats.winRate.toFixed(0)}%`, l: 'WIN RATE', c: stats.winRate >= 50 ? G : R },
                { v: `${stats.overallScore}/10`, l: 'SCORE', c: stats.overallScore >= 7 ? G : '#f5c842' },
              ].map(({ v, l, c }) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 18, color: c || 'var(--text)' }}>{v}</div>
                  <div className="label" style={{ fontSize: 8, marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="label">Data & Account</div>
            </div>
            <button onClick={exportJSON} style={{ width: '100%', padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', cursor: 'pointer', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <Download size={15} color={B} />
              <span style={{ fontSize: 13, flex: 1, textAlign: 'left' }}>Export Trades (JSON)</span>
              <ChevronRight size={13} color="var(--text3)" />
            </button>
            <button onClick={reset} style={{ width: '100%', padding: '13px 16px', background: confirmReset ? 'rgba(240,68,74,0.06)' : 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 12, color: confirmReset ? R : 'var(--text)', cursor: 'pointer', transition: 'all .3s' }}>
              <Trash2 size={15} color={R} />
              <span style={{ fontSize: 13, flex: 1, textAlign: 'left' }}>{confirmReset ? 'Click again to confirm reset' : 'Reset All Data'}</span>
              <ChevronRight size={13} color="var(--text3)" />
            </button>
          </div>
        </div>

        {/* ── Right: Stats + Strategies ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Account stats */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="label">Full Stats Breakdown</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { l: 'Initial Capital',  v: `$${capital.toFixed(4)}` },
                { l: 'Current Balance',  v: `$${stats.currentBalance.toFixed(4)}`, c: stats.currentBalance >= capital ? G : R },
                { l: 'Net PnL',          v: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(4)}`, c: stats.totalPnl >= 0 ? G : R },
                { l: 'Total Return',     v: `${stats.growth >= 0 ? '+' : ''}${stats.growth.toFixed(2)}%`, c: stats.growth >= 0 ? G : R },
                { l: 'Profit Factor',    v: `${stats.pf.toFixed(2)}x`, c: stats.pf >= 1 ? G : R },
                { l: 'Avg Win',          v: `+$${stats.avgWin.toFixed(4)}`, c: G },
                { l: 'Avg Loss',         v: `$${stats.avgLoss.toFixed(4)}`, c: R },
                { l: 'Best Trade',       v: `+$${stats.bestWin.toFixed(2)}`, c: G },
                { l: 'Worst Trade',      v: `$${stats.worstLoss.toFixed(2)}`, c: R },
                { l: 'Total Trades',     v: stats.totalTrades },
                { l: 'Wins',             v: stats.wins, c: G },
                { l: 'Losses',           v: stats.losses, c: R },
                { l: 'Win Rate',         v: `${stats.winRate.toFixed(2)}%`, c: stats.winRate >= 50 ? G : R },
                { l: 'Current Streak',   v: stats.streak > 0 ? `${stats.streak} wins` : `${Math.abs(stats.streak)} losses`, c: stats.streak >= 0 ? G : R },
              ].map(({ l, v, c }, i) => (
                <div key={l} style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{l}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: c || 'var(--text)', fontWeight: 700 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategies breakdown */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div className="label">Strategy Breakdown</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Strategy', 'Trades', 'Win Rate', 'Net PnL'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 9, letterSpacing: 1.5, color: 'var(--text3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strategies.map(s => {
                  const st  = trades.filter(t => t.strategy === s && t.status === 'CLOSED')
                  const pnl = st.reduce((sum, t) => sum + (t.pnl || 0), 0)
                  const wr  = st.length > 0 ? (st.filter(t => t.pnl > 0).length / st.length) * 100 : 0
                  return (
                    <tr key={s} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13 }}>{s}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--text2)' }}>{st.length}</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--ff-mono)', fontSize: 12, color: wr >= 50 ? G : R }}>{wr.toFixed(1)}%</td>
                      <td style={{ padding: '11px 16px', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: pnl >= 0 ? G : R }}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* App info */}
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, letterSpacing: 3, color: 'var(--text3)' }}>ROTHSCHILD'S TERMINAL · v1.0 · LOCAL STORAGE</div>
          </div>
        </div>
      </div>
    </div>
  )
}
