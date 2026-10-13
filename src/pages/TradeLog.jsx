import React, { useState, useMemo, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { Search, Trash2, ChevronDown, ChevronUp, X, Edit2, Upload, Check, AlertCircle } from 'lucide-react'

const G = '#00c076', R = '#f0444a', B = '#3d9eff', Y = '#f5c842'

const fmtPrice = (p) => {
  if (p == null || p === '') return '-'
  const n = parseFloat(p)
  if (isNaN(n)) return '-'
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 1)    return n.toFixed(4)
  return n.toFixed(6)
}

/* ─────────────────────────────────────────────────────── EDIT MODAL
   FIX: All <input> elements are rendered inline directly in JSX — no inner
   component definitions — so React never unmounts/remounts them on state
   change, which was causing focus loss after every keystroke.
   Auto-calc: RR from entry+tp+sl+direction only.
   PnL %: dihitung otomatis dari entry+exit+leverage+direction (WIN/LOSS ikut otomatis).
   PnL USDT: user inputs positive value, sign follows WIN/LOSS.
*/
import { calcRR, calcPnL } from '../utils/tradeCalc'

function EditModal({ trade, onClose, onSave, strategies, addStrategy }) {
  const existingPnl = trade.pnl || null
  const [form, setForm] = useState({
    pair:        trade.pair || '',
    direction:   trade.direction || 'LONG',
    entryPrice:  trade.entryPrice?.toString() || '',
    exitPrice:   trade.exitPrice?.toString()  || '',
    size:        trade.size?.toString()       || '',
    leverage:    trade.leverage?.toString()   || '',
    // Store absolute value; pnlSide controls the sign
    pnl:         existingPnl != null ? Math.abs(existingPnl).toString() : '',
    pnlPercent:  trade.pnlPercent != null ? Math.abs(trade.pnlPercent).toString() : '',
    pnlSide:     existingPnl != null ? (existingPnl >= 0 ? 'WIN' : 'LOSS') : 'WIN',
    rrRatio:     trade.rrRatio?.toString()    || '',
    sl:          trade.sl?.toString()         || '',
    tp:          trade.tp?.toString()         || '',
    liqPrice:    trade.liqPrice?.toString()   || '',
    status:      trade.status || 'CLOSED',
    strategy:    trade.strategy || 'Myself',
    notes:       trade.notes || '',
    tags:        (trade.tags || []).join(', '),
    date:        trade.date ? new Date(trade.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    duration:    trade.duration || '',
    fees:        trade.fees?.toString() || '',
  })
  const [newStrat, setNewStrat]         = useState('')
  const [showAddStrat, setShowAddStrat] = useState(false)

  // Simple setter for plain fields
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  // Setters that also recompute RR
  const setWithRR = (key, val) => setForm(f => {
    const next = { ...f, [key]: val }
    const rr = calcRR(next.entryPrice, next.tp, next.sl, next.direction)
    if (rr !== null) next.rrRatio = rr.toString()
    return next
  })

  // PnL: strip "-" so user always types positive
  const setPnl    = v => set('pnl',        v.replace('-', ''))
  const setPnlPct = v => set('pnlPercent', v.replace('-', ''))

  // PnL % otomatis selama Entry dan Exit terisi; kalau tidak, pakai input manual
  const calc       = calcPnL(form.entryPrice, form.exitPrice, form.size, form.leverage, form.direction)
  const pctAuto    = calc !== null
  const pnlSide    = pctAuto ? (calc.pnlPercent >= 0 ? 'WIN' : 'LOSS') : form.pnlSide
  const pctDisplay = pctAuto ? Math.abs(calc.pnlPercent).toString() : form.pnlPercent

  // Compute signed PnL for saving
  const signedPnl    = form.pnl ? (pnlSide === 'LOSS' ? -Math.abs(parseFloat(form.pnl)) : Math.abs(parseFloat(form.pnl))) : null
  const signedPnlPct = pctAuto
    ? calc.pnlPercent
    : (form.pnlPercent ? (form.pnlSide === 'LOSS' ? -Math.abs(parseFloat(form.pnlPercent)) : Math.abs(parseFloat(form.pnlPercent))) : null)

  const handleSave = () => {
    if (!form.pair.trim()) { alert('Pair is required'); return }
    onSave(trade.id, {
      pair:       form.pair.toUpperCase(),
      direction:  form.direction,
      entryPrice: parseFloat(form.entryPrice) || null,
      exitPrice:  parseFloat(form.exitPrice)  || null,
      size:       parseFloat(form.size)       || null,
      leverage:   parseFloat(form.leverage)   || null,
      pnl:        signedPnl,
      pnlPercent: signedPnlPct,
      rrRatio:    parseFloat(form.rrRatio)    || null,
      sl:         parseFloat(form.sl)         || null,
      tp:         parseFloat(form.tp)         || null,
      liqPrice:   parseFloat(form.liqPrice)   || null,
      status:     form.status,
      strategy:   form.strategy,
      notes:      form.notes,
      tags:       form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      date:       new Date(form.date).toISOString(),
      duration:   form.duration,
      fees:       parseFloat(form.fees) || null,
    })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border2)',
        borderRadius: 14, width: '100%', maxWidth: 660,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'fadeUp .2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Edit2 size={14} color={B} />
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>EDIT TRADE</span>
            <span style={{ fontFamily: 'var(--ff-display)', fontSize: 13, color: 'var(--text2)' }}>{trade.pair}</span>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '4px 8px', lineHeight: 0 }}><X size={14} /></button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row 1: Pair + Direction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Pair *</div>
              <input type="text" value={form.pair} onChange={e => set('pair', e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Direction</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['LONG', 'SHORT'].map(d => (
                  <button key={d} onClick={() => setWithRR('direction', d)} style={{
                    flex: 1, padding: '7px 0',
                    background: form.direction === d ? (d === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--bg-input)',
                    border: `1.5px solid ${form.direction === d ? (d === 'LONG' ? G : R) : 'var(--border)'}`,
                    color: form.direction === d ? (d === 'LONG' ? G : R) : 'var(--text3)',
                    borderRadius: 6, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 2,
                  }}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Strategy + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Strategy</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={form.strategy} onChange={e => set('strategy', e.target.value)}
                  style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}>
                  {strategies.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => setShowAddStrat(!showAddStrat)}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border2)', color: 'var(--text2)', borderRadius: 6, padding: '0 10px', fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>
                  + ADD
                </button>
              </div>
              {showAddStrat && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input value={newStrat} onChange={e => setNewStrat(e.target.value)}
                    placeholder="New strategy name..." type="text"
                    style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newStrat.trim()) {
                        addStrategy(newStrat.trim()); set('strategy', newStrat.trim()); setNewStrat(''); setShowAddStrat(false)
                      }
                    }} />
                  <button onClick={() => {
                    if (newStrat.trim()) { addStrategy(newStrat.trim()); set('strategy', newStrat.trim()); setNewStrat(''); setShowAddStrat(false) }
                  }} style={{ background: G, color: '#000', borderRadius: 6, padding: '6px 12px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11 }}>OK</button>
                </div>
              )}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Status</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['CLOSED', 'OPEN'].map(s => (
                  <button key={s} onClick={() => set('status', s)} style={{
                    flex: 1, padding: '7px 0',
                    background: form.status === s ? 'var(--blue-bg)' : 'var(--bg-input)',
                    border: `1.5px solid ${form.status === s ? B : 'var(--border)'}`,
                    color: form.status === s ? B : 'var(--text3)',
                    borderRadius: 6, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Entry / Exit / Size / Leverage */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px' }}>
            <div className="label" style={{ marginBottom: 10 }}>Price & Size</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Entry Price</div>
                <input type="number" value={form.entryPrice} onChange={e => setWithRR('entryPrice', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Exit Price</div>
                <input type="number" value={form.exitPrice} onChange={e => set('exitPrice', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Size (USDT)</div>
                <input type="number" value={form.size} onChange={e => set('size', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Leverage</div>
                <input type="number" value={form.leverage} onChange={e => set('leverage', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
            </div>
          </div>

          {/* Row 4: PnL with WIN/LOSS toggle */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="label">PnL & Result</div>
              {/* WIN / LOSS toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 6, padding: 2, gap: 2 }}>
                {['WIN', 'LOSS'].map(side => (
                  <button key={side} onClick={() => { if (!pctAuto) set('pnlSide', side) }} disabled={pctAuto} style={{
                    padding: '3px 14px', borderRadius: 4,
                    background: pnlSide === side ? (side === 'WIN' ? G : R) : 'transparent',
                    color: pnlSide === side ? '#000' : 'var(--text3)',
                    fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 10, letterSpacing: 1.5,
                    transition: 'all .15s',
                    cursor: pctAuto ? 'not-allowed' : 'pointer',
                    opacity: pctAuto && pnlSide !== side ? 0.5 : 1,
                  }}>{side}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>PnL (USDT)</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: pnlSide === 'WIN' ? G : R, pointerEvents: 'none', zIndex: 1 }}>
                    {pnlSide === 'WIN' ? '+' : '-'}
                  </div>
                  <input type="number" value={form.pnl} onChange={e => setPnl(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', paddingLeft: 20, fontSize: 12, color: pnlSide === 'WIN' ? G : R, fontWeight: 700 }} />
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>PnL % {pctAuto && <span style={{ color: 'var(--text3)', fontSize: 8, fontFamily: 'var(--ff-body)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>auto</span>}</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: pnlSide === 'WIN' ? G : R, pointerEvents: 'none', zIndex: 1 }}>
                    {pnlSide === 'WIN' ? '+' : '-'}
                  </div>
                  <input type="number" value={pctDisplay} onChange={e => setPnlPct(e.target.value)} readOnly={pctAuto}
                    style={{ width: '100%', padding: '7px 10px', paddingLeft: 20, fontSize: 12, color: pnlSide === 'WIN' ? G : R, fontWeight: pctAuto ? 700 : 400, cursor: pctAuto ? 'default' : 'text' }} />
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Fees (USDT)</div>
                <input type="number" value={form.fees} onChange={e => set('fees', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Duration</div>
                <input type="text" value={form.duration} onChange={e => set('duration', e.target.value)}
                  placeholder="e.g. 2h 30m"
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
            </div>
          </div>

          {/* Row 5: TP / SL / Liq / RR (auto) */}
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px' }}>
            <div className="label" style={{ marginBottom: 10 }}>Risk Fields — RR auto dari Entry + TP + SL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Take Profit</div>
                <input type="number" value={form.tp} onChange={e => setWithRR('tp', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, color: form.tp ? G : 'var(--text)' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Stop Loss</div>
                <input type="number" value={form.sl} onChange={e => setWithRR('sl', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, color: form.sl ? R : 'var(--text)' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Liq. Price</div>
                <input type="number" value={form.liqPrice} onChange={e => set('liqPrice', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, color: form.liqPrice ? '#ff9500' : 'var(--text)' }} />
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>RR Ratio <span style={{ color: 'var(--text3)', fontSize: 8, fontFamily: 'var(--ff-body)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>auto</span></div>
                <input type="number" value={form.rrRatio} onChange={e => set('rrRatio', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, color: B, fontWeight: 700 }} />
              </div>
            </div>
          </div>

          {/* Row 6: Date + Notes + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12 }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Date & Time</div>
              <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              <div style={{ marginTop: 10 }}>
                <div className="label" style={{ marginBottom: 5 }}>Tags (comma separated)</div>
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="breakout, signal..."
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12 }} />
              </div>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Notes</div>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Trade rationale, lessons learned..."
                rows={4} style={{ width: '100%', padding: '7px 10px', fontSize: 12, resize: 'none', lineHeight: 1.6 }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '11px', background: 'var(--bg-input)',
              border: '1px solid var(--border)', color: 'var(--text2)',
              borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
            }}>CANCEL</button>
            <button onClick={handleSave} style={{
              flex: 3, padding: '11px', background: G, color: '#000',
              borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, letterSpacing: 2,
              boxShadow: '0 0 20px rgba(0,192,118,0.2)',
            }}>SAVE CHANGES</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────── DETAIL MODAL */
function DetailModal({ trade, onClose, onDelete, onEdit }) {
  if (!trade) return null
  const pos = (trade.pnl || 0) >= 0
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border2)',
        borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
        animation: 'fadeUp .2s ease',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 18 }}>{trade.pair}</span>
            <span style={{ background: trade.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)', color: trade.direction === 'LONG' ? G : R, padding: '2px 9px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>{trade.direction}</span>
            {trade.leverage && <span style={{ color: 'var(--text3)', fontFamily: 'var(--ff-mono)', fontSize: 12 }}>{trade.leverage}x</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { onClose(); onEdit(trade) }} style={{
              background: 'var(--blue-bg)', border: `1px solid ${B}30`, color: B,
              borderRadius: 6, padding: '5px 12px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, letterSpacing: 1,
              display: 'flex', alignItems: 'center', gap: 5,
            }}><Edit2 size={12} /> EDIT</button>
            <button onClick={onClose} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '5px 8px', lineHeight: 0 }}><X size={14} /></button>
          </div>
        </div>

        <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 32, color: pos ? G : R, fontWeight: 700 }}>
            {pos ? '+' : ''}{(trade.pnl || 0).toFixed(4)} USDT
          </div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 16, color: pos ? G : R, opacity: 0.7 }}>
            {pos ? '+' : ''}{(trade.pnlPercent || 0).toFixed(2)}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            {new Date(trade.date).toLocaleString()} · {trade.strategy || 'Manual'}
          </div>
        </div>

        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { l: 'Entry Price', v: fmtPrice(trade.entryPrice) },
            { l: 'Exit Price',  v: fmtPrice(trade.exitPrice) },
            { l: 'Size',        v: trade.size ? `$${trade.size}` : '-' },
            { l: 'Leverage',    v: trade.leverage ? `${trade.leverage}x` : '-' },
            { l: 'Take Profit', v: fmtPrice(trade.tp), c: G },
            { l: 'Stop Loss',   v: fmtPrice(trade.sl), c: R },
            { l: 'Liq. Price',  v: fmtPrice(trade.liqPrice), c: '#ff9500' },
            { l: 'RR Ratio',    v: trade.rrRatio ? `${trade.rrRatio}R` : '-', c: B },
            { l: 'Duration',    v: trade.duration || '-' },
            { l: 'Fees',        v: trade.fees != null ? `$${trade.fees.toFixed(4)}` : '-', c: R },
            { l: 'Status',      v: trade.status },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div className="label" style={{ marginBottom: 4 }}>{l}</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: c || 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>

        {trade.notes && (
          <div style={{ padding: '0 20px 14px' }}>
            <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
              <div className="label" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>{trade.notes}</div>
            </div>
          </div>
        )}
        {trade.tags?.length > 0 && (
          <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trade.tags.map(tag => (
              <span key={tag} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text3)', padding: '3px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--ff-display)', letterSpacing: 1 }}>#{tag}</span>
            ))}
          </div>
        )}

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
          <button onClick={() => { onEdit(trade); onClose() }} style={{
            flex: 2, padding: '10px', background: 'var(--blue-bg)',
            border: `1px solid ${B}40`, color: B,
            borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}><Edit2 size={13} /> EDIT TRADE</button>
          <button onClick={() => { onDelete(trade.id); onClose() }} style={{
            flex: 1, padding: '10px', background: 'rgba(240,68,74,0.08)',
            border: '1px solid rgba(240,68,74,0.3)', color: R,
            borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
          }}>DELETE</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────── IMPORT MODAL */
function ImportModal({ onClose, onImport }) {
  const [mode, setMode]         = useState('merge')   // 'merge' | 'replace'
  const [status, setStatus]     = useState(null)      // null | {added,skipped} | {error}
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview]   = useState(null)      // parsed JSON preview
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file || file.type !== 'application/json') {
      setStatus({ error: 'Please select a valid JSON file' }); return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        setPreview(data)
        setStatus(null)
      } catch {
        setStatus({ error: 'Invalid JSON file — could not parse' })
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (!preview) return
    const result = onImport(preview, mode)
    setStatus(result)
    if (!result.error) {
      setTimeout(onClose, 2000)
    }
  }

  const tradeCount = preview ? (Array.isArray(preview) ? preview.length : (preview.trades?.length || 0)) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border2)',
        borderRadius: 14, width: '100%', maxWidth: 480,
        animation: 'fadeUp .2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={14} color={B} />
            <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>IMPORT TRADES</span>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '4px 8px', lineHeight: 0 }}><X size={14} /></button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Drop zone */}
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? G : preview ? G : 'var(--border2)'}`,
              borderRadius: 10, padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
              background: preview ? 'rgba(0,192,118,0.06)' : dragOver ? 'rgba(0,192,118,0.04)' : 'var(--bg-input)',
              transition: 'all .2s', marginBottom: 16,
            }}
          >
            {preview ? (
              <div>
                <Check size={24} color={G} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 14, color: G, letterSpacing: 1, marginBottom: 4 }}>{tradeCount} TRADES READY</div>
                {preview.exportedAt && (
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Exported {new Date(preview.exportedAt).toLocaleString()}
                  </div>
                )}
                {preview.capital && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                    Capital: ${preview.capital?.toFixed(4)} · Strategies: {(preview.strategies || []).join(', ')}
                  </div>
                )}
                <button onClick={e => { e.stopPropagation(); setPreview(null); setStatus(null) }}
                  style={{ marginTop: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: 5, padding: '4px 12px', fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>
                  CHANGE FILE
                </button>
              </div>
            ) : (
              <>
                <Upload size={24} color={dragOver ? G : 'var(--text3)'} style={{ margin: '0 auto 10px' }} />
                <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4 }}>Drop JSON file here</div>
                <div style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 12 }}>or click to browse · rothschilds-trades-*.json</div>
                <div style={{ background: 'var(--bg-card2)', border: `1px solid ${B}`, color: B, display: 'inline-block', padding: '6px 16px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1.5 }}>CHOOSE FILE</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />

          {/* Mode selector */}
          <div style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>Import Mode</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { k: 'merge',   l: 'Merge',   sub: 'Add new trades, skip duplicates' },
                { k: 'replace', l: 'Replace',  sub: 'Overwrite ALL existing data' },
              ].map(({ k, l, sub }) => (
                <button key={k} onClick={() => setMode(k)} style={{
                  flex: 1, padding: '10px 12px', textAlign: 'left',
                  background: mode === k ? (k === 'replace' ? 'rgba(240,68,74,0.08)' : 'var(--green-bg)') : 'var(--bg-input)',
                  border: `1.5px solid ${mode === k ? (k === 'replace' ? R : G) : 'var(--border)'}`,
                  color: mode === k ? (k === 'replace' ? R : G) : 'var(--text3)',
                  borderRadius: 8,
                }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, fontFamily: 'var(--ff-body)' }}>{sub}</div>
                </button>
              ))}
            </div>
            {mode === 'replace' && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(240,68,74,0.08)', border: '1px solid rgba(240,68,74,0.2)', borderRadius: 6, fontSize: 11, color: R }}>
                Warning: This will permanently delete all current trades and replace them with the imported data.
              </div>
            )}
          </div>

          {/* Status feedback */}
          {status && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              background: status.error ? 'rgba(240,68,74,0.08)' : 'var(--green-bg)',
              border: `1px solid ${status.error ? 'rgba(240,68,74,0.3)' : 'rgba(0,192,118,0.3)'}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {status.error
                ? <><AlertCircle size={14} color={R} /><span style={{ color: R, fontSize: 12 }}>{status.error}</span></>
                : <><Check size={14} color={G} /><span style={{ color: G, fontSize: 12, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>IMPORTED {status.added} TRADES · {status.skipped} SKIPPED</span></>
              }
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>CANCEL</button>
            <button onClick={handleImport} disabled={!preview} style={{
              flex: 2, padding: '11px', borderRadius: 8,
              background: preview ? G : 'var(--bg-input)',
              color: preview ? '#000' : 'var(--text3)',
              border: 'none',
              fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, letterSpacing: 2,
              cursor: preview ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}>IMPORT {tradeCount > 0 ? `(${tradeCount})` : ''}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────── MAIN */
export default function TradeLog() {
  const { trades, deleteTrade, updateTrade, importTrades, stats, strategies, addStrategy } = useApp()
  const [search, setSearch]       = useState('')
  const [dir, setDir]             = useState('ALL')
  const [strat, setStrat]         = useState('ALL')
  const [detail, setDetail]       = useState(null)
  const [editTrade, setEditTrade] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [sortKey, setSortKey]     = useState('date')
  const [sortAsc, setSortAsc]     = useState(false)

  const stratOptions = useMemo(() => {
    const s = new Set(trades.map(t => t.strategy).filter(Boolean))
    return ['ALL', ...s]
  }, [trades])

  const filtered = useMemo(() => {
    let list = trades.filter(t => {
      if (search && !t.pair?.toLowerCase().includes(search.toLowerCase())) return false
      if (dir   !== 'ALL' && t.direction !== dir)   return false
      if (strat !== 'ALL' && t.strategy  !== strat) return false
      return true
    })
    list = [...list].sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (sortKey === 'date') { va = new Date(va); vb = new Date(vb) }
      if (va < vb) return sortAsc ? -1 :  1
      if (va > vb) return sortAsc ?  1 : -1
      return 0
    })
    return list
  }, [trades, search, dir, strat, sortKey, sortAsc])

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const SortIcon = ({ k }) => sortKey === k
    ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)
    : null

  const COLS = [
    { k: 'pair',       l: 'PAIR' },
    { k: 'direction',  l: 'DIR' },
    { k: 'status',     l: 'STATUS' },
    { k: 'entryPrice', l: 'ENTRY' },
    { k: 'exitPrice',  l: 'EXIT' },
    { k: 'size',       l: 'SIZE' },
    { k: 'leverage',   l: 'LEV' },
    { k: 'tp',         l: 'TP' },
    { k: 'sl',         l: 'SL' },
    { k: 'liqPrice',   l: 'LIQ' },
    { k: 'rrRatio',    l: 'RR' },
    { k: 'pnl',        l: 'PnL (USDT)' },
    { k: 'pnlPercent', l: 'PnL %' },
    { k: 'fees',       l: 'FEES' },
    { k: 'strategy',   l: 'STRATEGY' },
    { k: 'date',       l: 'DATE' },
  ]

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { l: 'Total',    v: stats.totalTrades },
          { l: 'Wins',     v: stats.wins,    c: G },
          { l: 'Losses',   v: stats.losses,  c: R },
          { l: 'Win Rate', v: `${stats.winRate.toFixed(1)}%`, c: stats.winRate >= 50 ? G : R },
          { l: 'Net PnL',  v: `${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(4)}`, c: stats.totalPnl >= 0 ? G : R },
          { l: 'PF',       v: `${stats.pf.toFixed(2)}x`, c: stats.pf >= 1 ? G : R },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
            <div className="label" style={{ marginBottom: 4 }}>{l}</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 16, color: c || 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filters + Import */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pair..."
            style={{ width: '100%', paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8 }} />
        </div>

        <div style={{ display: 'flex', gap: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {['ALL', 'LONG', 'SHORT'].map(d => (
            <button key={d} onClick={() => setDir(d)} style={{
              padding: '7px 14px',
              background: dir === d ? (d === 'LONG' ? 'var(--green-bg)' : d === 'SHORT' ? 'var(--red-bg)' : 'var(--blue-bg)') : 'transparent',
              color: dir === d ? (d === 'LONG' ? G : d === 'SHORT' ? R : B) : 'var(--text3)',
              fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, letterSpacing: 1,
            }}>{d}</button>
          ))}
        </div>

        <select value={strat} onChange={e => setStrat(e.target.value)} style={{ padding: '7px 12px', minWidth: 140 }}>
          {stratOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Import button */}
        <button onClick={() => setShowImport(true)} style={{
          background: 'var(--blue-bg)', border: `1px solid ${B}40`,
          color: B, borderRadius: 8, padding: '8px 14px',
          fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, letterSpacing: 1,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Upload size={13} /> IMPORT
        </button>

        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>
          {filtered.length} / {trades.length} trades
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', flex: 1 }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 310px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card2)', zIndex: 5 }}>
              <tr style={{ borderBottom: '1px solid var(--border2)' }}>
                {COLS.map(({ k, l }) => (
                  <th key={k} onClick={() => toggleSort(k)} style={{
                    padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 9,
                    letterSpacing: 1.5, color: sortKey === k ? G : 'var(--text3)',
                    userSelect: 'none', whiteSpace: 'nowrap',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>{l} <SortIcon k={k} /></span>
                  </th>
                ))}
                <th style={{ padding: '10px 12px', width: 64 }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const pos = (t.pnl || 0) >= 0
                return (
                  <tr key={t.id}
                    onClick={() => setDetail(t)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)',
                      cursor: 'pointer', transition: 'background .1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)'}
                  >
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13 }}>{t.pair}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{ background: t.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)', color: t.direction === 'LONG' ? G : R, padding: '2px 7px', borderRadius: 3, fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>{t.direction}</span>
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {(() => {
                        const isOpen = (t.status || 'CLOSED').toUpperCase() === 'OPEN'
                        return (
                          <span style={{
                            background: isOpen ? `${Y}1a` : 'var(--bg-input)',
                            color: isOpen ? Y : 'var(--text3)',
                            border: `1px solid ${isOpen ? `${Y}40` : 'var(--border)'}`,
                            padding: '2px 7px', borderRadius: 3, fontSize: 10,
                            fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1,
                          }}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{fmtPrice(t.entryPrice)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text2)' }}>{t.exitPrice ? fmtPrice(t.exitPrice) : '-'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{t.size ? `$${t.size}` : '-'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--text2)' }}>{t.leverage ? `${t.leverage}x` : '-'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: G }}>{fmtPrice(t.tp)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: R }}>{fmtPrice(t.sl)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: '#ff9500' }}>{fmtPrice(t.liqPrice)}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: B }}>{t.rrRatio ? `${t.rrRatio}R` : '-'}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: pos ? G : R }}>
                      {pos ? '+' : ''}{(t.pnl || 0).toFixed(4)}
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: pos ? G : R }}>
                      {pos ? '+' : ''}{(t.pnlPercent || 0).toFixed(2)}%
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--ff-mono)', fontSize: 11, color: R }}>{t.fees != null ? `$${t.fees.toFixed(4)}` : '-'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 11, color: 'var(--text2)' }}>{t.strategy || '-'}</td>
                    <td style={{ padding: '9px 12px', fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding: '9px 8px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditTrade(t)}
                          style={{ background: 'none', border: '1px solid transparent', color: 'var(--text3)', borderRadius: 5, padding: '3px 5px', lineHeight: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = B; e.currentTarget.style.color = B }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => deleteTrade(t.id)}
                          style={{ background: 'none', border: '1px solid transparent', color: 'var(--text3)', borderRadius: 5, padding: '3px 5px', lineHeight: 0 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = R; e.currentTarget.style.color = R }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text3)' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>NO TRADES FOUND</div>
              <div style={{ fontSize: 12 }}>Adjust filters or import your trade history</div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {detail && (
        <DetailModal
          trade={detail}
          onClose={() => setDetail(null)}
          onDelete={deleteTrade}
          onEdit={(t) => { setDetail(null); setEditTrade(t) }}
        />
      )}
      {editTrade && (
        <EditModal
          trade={editTrade}
          onClose={() => setEditTrade(null)}
          onSave={updateTrade}
          strategies={strategies}
          addStrategy={addStrategy}
        />
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={importTrades}
        />
      )}
    </div>
  )
}
