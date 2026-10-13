import React, { useState } from 'react'
import { useApp } from '../contexts/AppContext'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line,
} from 'recharts'
import { Edit2, Check, TrendingUp, TrendingDown, Award, Target, Zap, Activity } from 'lucide-react'

const G = '#00c076', R = '#f0444a', B = '#3d9eff', P = '#7b61ff', Y = '#f5c842'

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmt = (n, d = 2) => (n >= 0 ? '+' : '') + n.toFixed(d)
const fmtPrice = (p) => {
  if (!p) return '-'
  const n = parseFloat(p)
  if (n >= 1000)  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 1)     return n.toFixed(4)
  return n.toFixed(6)
}

/* ─── stat tile ────────────────────────────────────────────── */
function Tile({ label, value, sub, color, size = 22 }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
      <div className="label" style={{ marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: 'var(--ff-mono)', fontSize: size, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

/* ─── radar ────────────────────────────────────────────────── */
function RadarPanel({ scores }) {
  const data = [
    { s: 'Win Rate',    v: scores.winRate },
    { s: 'RR Ratio',   v: scores.rrRatio },
    { s: 'Momentum',   v: scores.momentum },
    { s: 'Discipline', v: scores.discipline },
    { s: 'Net Profit', v: scores.netProfit },
    { s: 'Consistency',v: scores.consistency },
  ]
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', height: '100%' }}>
      <div className="label" style={{ marginBottom: 6 }}>Performance Radar</div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.05)" />
          <PolarAngleAxis dataKey="s" tick={{ fill: '#444468', fontSize: 9, fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: 1 }} />
          <Radar dataKey="v" stroke={G} fill={G} fillOpacity={0.12} strokeWidth={1.5} dot={{ fill: G, r: 2 }} />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {data.map(d => (
          <div key={d.s} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 8px', textAlign: 'center' }}>
            <div className="label" style={{ fontSize: 7, marginBottom: 3 }}>{d.s.toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, color: d.v >= 7 ? G : d.v >= 4 ? Y : R }}>{d.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── equity curve ─────────────────────────────────────────── */
function EquityPanel({ trades }) {
  const closed = [...trades.filter(t => t.status === 'CLOSED')].reverse()
  let running = 0
  const data = closed.map((t, i) => {
    running += t.pnl || 0
    return { i: i + 1, pnl: parseFloat(running.toFixed(4)), label: t.pair }
  })
  const isPos = (data[data.length - 1]?.pnl ?? 0) >= 0

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: isPos ? G : R }}>
          {payload[0].value >= 0 ? '+' : ''}${payload[0].value.toFixed(4)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>Trade #{payload[0].payload.i} · {payload[0].payload.label}</div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="label">Equity Curve</div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: isPos ? G : R }}>
          {data.length} trades recorded
        </div>
      </div>
      {data.length < 2 ? (
        <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>Not enough trades to show curve</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="eq-d" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={isPos ? G : R} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isPos ? G : R} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" hide />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="pnl" stroke={isPos ? G : R} strokeWidth={1.5} fill="url(#eq-d)" dot={false} activeDot={{ r: 4, fill: isPos ? G : R }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* ─── PnL calendar ─────────────────────────────────────────── */
function CalendarPanel({ trades }) {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const dim   = new Date(year, month + 1, 0).getDate()
  const first = new Date(year, month, 1).getDay()
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  const dayPnl = {}
  trades.filter(t => t.status === 'CLOSED').forEach(t => {
    const d = new Date(t.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const k = d.getDate()
      dayPnl[k] = (dayPnl[k] || 0) + (t.pnl || 0)
    }
  })

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="label">{MONTHS[month]} {year}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>PnL per day</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:8, color:'var(--text3)', fontFamily:'var(--ff-display)', fontWeight:700, letterSpacing:0.5, paddingBottom:3 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: dim }).map((_, i) => {
          const day = i + 1
          const pnl = dayPnl[day]
          const isToday = day === now.getDate()
          return (
            <div key={day} style={{
              aspectRatio: '1', borderRadius: 5, position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: pnl > 0 ? `rgba(0,192,118,${Math.min(0.5, Math.abs(pnl) / 30 + 0.1)})` :
                          pnl < 0 ? `rgba(240,68,74,${Math.min(0.5, Math.abs(pnl) / 30 + 0.1)})` : 'var(--bg-card2)',
              border: isToday ? `1px solid ${G}` : '1px solid transparent',
            }}>
              <span style={{ fontSize: 10, color: isToday ? G : 'var(--text2)', fontFamily: 'var(--ff-mono)', lineHeight: 1 }}>{day}</span>
              {pnl != null && (
                <span style={{ fontSize: 7, color: pnl > 0 ? G : R, lineHeight: 1, marginTop: 1 }}>
                  {pnl > 0 ? '+' : ''}{pnl.toFixed(1)}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── pair ranking ─────────────────────────────────────────── */
function PairRankingPanel({ ranking }) {
  const max = Math.max(...ranking.map(r => Math.abs(r.pnl)), 1)
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="label">P&L Ranking</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>by pair · {ranking.length} contracts</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1, marginBottom: 8, padding: '0 2px' }}>
        <span>CONTRACTS</span><span>P&L (USDT)</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ranking.map(r => (
          <div key={r.pair}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div>
                <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13 }}>{r.pair}</span>
                <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 8 }}>{r.trades}T · {r.winRate.toFixed(0)}%WR</span>
              </div>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: r.pnl >= 0 ? G : R }}>
                {r.pnl >= 0 ? '+' : ''}{r.pnl.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--bg-input)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: r.pnl >= 0 ? G : R, width: `${(Math.abs(r.pnl) / max) * 100}%`, transition: 'width .5s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── circles row ──────────────────────────────────────────── */
function CircleGroup({ stats }) {
  const items = [
    { value: stats.totalTrades, label: 'Trades',   color: P },
    { value: `${stats.winRate.toFixed(0)}%`, label: 'Win Rate', color: Y },
    { value: stats.wins, label: 'Wins', color: G },
    { value: stats.losses, label: 'Losses', color: R },
  ]
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
      {items.map(({ value, label, color }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            border: `2px solid ${color}`,
            background: `${color}11`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 6px',
          }}>
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 22, color }}>{value}</span>
          </div>
          <div className="label" style={{ fontSize: 8 }}>{label}</div>
        </div>
      ))}
    </div>
  )
}

/* ─── recent trades table ──────────────────────────────────── */
function RecentTrades({ trades }) {
  const recent = trades.slice(0, 8)
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div className="label">Recent Trades</div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>last {recent.length}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Pair','Dir','Entry','Exit','Size','Lev','PnL','PnL%','Strategy','Date'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 9, letterSpacing: 1.5, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((t, i) => {
              const pos = (t.pnl || 0) >= 0
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13 }}>{t.pair}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <span style={{ background: t.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)', color: t.direction === 'LONG' ? G : R, padding: '2px 7px', borderRadius: 3, fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>{t.direction}</span>
                  </td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{fmtPrice(t.entryPrice)}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text2)' }}>{t.exitPrice ? fmtPrice(t.exitPrice) : '-'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{t.size ? `$${t.size}` : '-'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text2)' }}>{t.leverage ? `${t.leverage}x` : '-'}</td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 12, fontWeight: 700, color: pos ? G : R }}>
                    {pos ? '+' : ''}{(t.pnl || 0).toFixed(4)}
                  </td>
                  <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: pos ? G : R }}>
                    {pos ? '+' : ''}{(t.pnlPercent || 0).toFixed(2)}%
                  </td>
                  <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--text2)' }}>{t.strategy || '-'}</td>
                  <td style={{ padding: '9px 12px', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {recent.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No trades yet — add your first trade</div>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { stats, capital, setCapital, trades } = useApp()
  const [editCap, setEditCap] = useState(false)
  const [capVal, setCapVal] = useState('')

  const saveCap = () => {
    const v = parseFloat(capVal)
    if (!isNaN(v) && v > 0) setCapital(v)
    setEditCap(false)
  }

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Row 1: KPI tiles ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {/* Initial capital editable */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div className="label" style={{ marginBottom: 7 }}>Initial Capital</div>
          {editCap ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input value={capVal} onChange={e => setCapVal(e.target.value)} autoFocus
                onKeyDown={e => e.key === 'Enter' && saveCap()}
                style={{ width: '100%', padding: '3px 7px', fontSize: 12 }} placeholder={capital.toFixed(4)} />
              <button onClick={saveCap} style={{ background: G, color: '#000', borderRadius: 4, padding: '3px 7px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 10 }}>OK</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 16, lineHeight: 1 }}>${capital.toFixed(4)}</span>
              <button onClick={() => { setCapVal(capital.toFixed(4)); setEditCap(true) }}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '2px 6px', borderRadius: 3, fontSize: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>
                EDIT
              </button>
            </div>
          )}
        </div>
        <Tile label="Current Balance"  value={`$${stats.currentBalance.toFixed(4)}`} color={G} />
        <Tile label="Net PnL"          value={`${fmt(stats.totalPnl, 4)} USDT`} color={stats.totalPnl >= 0 ? G : R} />
        <Tile label="Growth"           value={`${fmt(stats.growth)}%`} color={stats.growth >= 0 ? G : R} />
        <Tile label="Profit Factor"    value={`${stats.pf.toFixed(2)}x`} color={stats.pf >= 1 ? G : R} sub={`Avg Win $${stats.avgWin.toFixed(2)} / Avg Loss $${stats.avgLoss.toFixed(2)}`} />
        <Tile label="Best Win"         value={`+$${stats.bestWin.toFixed(2)}`} color={G} sub={`Worst: $${stats.worstLoss.toFixed(2)}`} />
      </div>

      {/* ── Row 2: Circles + Streak ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <div className="label" style={{ marginBottom: 14 }}>Overview</div>
          <CircleGroup stats={stats} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 16 }}>
            {[
              { l: 'Streak',   v: stats.streak > 0 ? `${stats.streak} Wins` : `${Math.abs(stats.streak)} Loss`, c: stats.streak >= 0 ? G : R },
              { l: '3x Combo', v: Math.abs(stats.streak) >= 3 ? 'YES' : 'NO', c: Math.abs(stats.streak) >= 3 ? G : 'var(--text3)' },
              { l: 'W / L',    v: `${stats.wins} / ${stats.losses}` },
              { l: 'Avg RR',   v: trades.length > 0 ? `${(trades.filter(t=>t.rrRatio).reduce((s,t)=>s+(t.rrRatio||0),0)/Math.max(1,trades.filter(t=>t.rrRatio).length)).toFixed(2)}R` : '-', c: B },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px' }}>
                <div className="label" style={{ marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: c || 'var(--text)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { l: 'Avg Win',  v: `+$${stats.avgWin.toFixed(4)}`, c: G },
            { l: 'Avg Loss', v: `-$${stats.avgLoss.toFixed(4)}`, c: R },
            { l: 'Total',    v: `${stats.totalTrades} Trades` },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', minWidth: 140 }}>
              <div className="label" style={{ marginBottom: 5 }}>{l}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 15, color: c || 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 3: Radar + Equity + Calendar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 260px', gap: 10, minHeight: 380 }}>
        <RadarPanel scores={stats.radarScores} />
        <EquityPanel trades={trades} />
        <CalendarPanel trades={trades} />
      </div>

      {/* ── Row 4: Pair ranking + Recent Trades ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 10 }}>
        {stats.pairRanking.length > 0 && <PairRankingPanel ranking={stats.pairRanking} />}
        <RecentTrades trades={trades} />
      </div>
    </div>
  )
}
