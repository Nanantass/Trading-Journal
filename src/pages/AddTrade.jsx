import React, { useState, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { parseTradeScreenshot, fileToBase64 } from '../utils/aiParser'
import { calcRR, calcPnL } from '../utils/tradeCalc'
import { Upload, Cpu, Check, X, Plus, ChevronDown, AlertCircle } from 'lucide-react'

const G = '#00c076', R = '#f0444a', B = '#3d9eff'

const INIT = {
  pair: '', direction: 'LONG',
  entryPrice: '', exitPrice: '', size: '', leverage: '',
  pnl: '', pnlPercent: '', pnlSide: 'WIN',   // pnlSide: 'WIN' | 'LOSS'
  rrRatio: '', tp: '', sl: '', liqPrice: '',
  status: 'CLOSED', strategy: 'Myself',
  notes: '', tags: '',
  date: new Date().toISOString().slice(0, 16),
  duration: '', fees: '',
}

function Label({ children, required }) {
  return (
    <div style={{ display: 'flex', gap: 3, marginBottom: 5 }}>
      <span className="label">{children}</span>
      {required && <span style={{ color: R, fontSize: 9 }}>*</span>}
    </div>
  )
}

// Standalone component defined OUTSIDE AddTrade so it never re-mounts on state change
function Inp({ value, onChange, placeholder, type = 'text', style = {}, ...rest }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '8px 11px', fontSize: 12, ...style }} {...rest} />
  )
}

export default function AddTrade() {
  const { addTrade, strategies, addStrategy } = useApp()
  const [form, setForm]         = useState(INIT)
  const [loading, setLoading]   = useState(false)
  const [aiState, setAiState]   = useState(null)
  const [preview, setPreview]   = useState(null)
  const [success, setSuccess]   = useState(false)
  const [stratModal, setStratModal] = useState(false)
  const [newStrat, setNewStrat]     = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const fileRef = useRef()

  const set = k => v => setForm(f => ({ ...f, [k]: v }))

  // TP/SL setter with auto-RR recalculation
  const setTP = v => setForm(f => {
    const rr = calcRR(f.entryPrice, v, f.sl, f.direction)
    return { ...f, tp: v, ...(rr !== null ? { rrRatio: rr.toString() } : {}) }
  })
  const setSL = v => setForm(f => {
    const rr = calcRR(f.entryPrice, f.tp, v, f.direction)
    return { ...f, sl: v, ...(rr !== null ? { rrRatio: rr.toString() } : {}) }
  })
  const setEntry = v => setForm(f => {
    const rr = calcRR(v, f.tp, f.sl, f.direction)
    return { ...f, entryPrice: v, ...(rr !== null ? { rrRatio: rr.toString() } : {}) }
  })
  const setDirection = v => setForm(f => {
    const rr = calcRR(f.entryPrice, f.tp, f.sl, v)
    return { ...f, direction: v, ...(rr !== null ? { rrRatio: rr.toString() } : {}) }
  })

  // PnL input: strip any "-" the user might type; sign is controlled by pnlSide toggle
  const setPnl    = v => set('pnl')(v.replace('-', ''))
  const setPnlPct = v => set('pnlPercent')(v.replace('-', ''))

  // PnL % dihitung otomatis dari Entry + Exit + Leverage + Direction.
  // Selama Entry dan Exit terisi, hasilnya (termasuk tanda +/-) mengikuti hitungan sistem
  // dan WIN/LOSS ikut otomatis. Jika Exit kosong (mis. trade masih OPEN), input manual dipakai.
  const calc        = calcPnL(form.entryPrice, form.exitPrice, form.size, form.leverage, form.direction)
  const pctAuto     = calc !== null
  const pnlSide     = pctAuto ? (calc.pnlPercent >= 0 ? 'WIN' : 'LOSS') : form.pnlSide
  const pctDisplay  = pctAuto ? Math.abs(calc.pnlPercent).toString() : form.pnlPercent

  // Compute the actual signed PnL for saving
  const signedPnl    = form.pnl ? (pnlSide === 'LOSS' ? -Math.abs(parseFloat(form.pnl)) : Math.abs(parseFloat(form.pnl))) : null
  const signedPnlPct = pctAuto
    ? calc.pnlPercent
    : (form.pnlPercent ? (form.pnlSide === 'LOSS' ? -Math.abs(parseFloat(form.pnlPercent)) : Math.abs(parseFloat(form.pnlPercent))) : null)

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    setAiState('parsing')
    try {
      const b64    = await fileToBase64(file)
      const parsed = await parseTradeScreenshot(b64, file.type)
      // Determine pnlSide from parsed pnl sign
      const parsedPnlSide = parsed.pnl != null ? (parsed.pnl >= 0 ? 'WIN' : 'LOSS') : 'WIN'
      setForm(f => {
        const tp = parsed.tp?.toString() || f.tp
        const sl = parsed.sl?.toString() || f.sl
        const entry = parsed.entryPrice?.toString() || f.entryPrice
        const dir = parsed.direction || f.direction
        const rr = calcRR(entry, tp, sl, dir)
        return {
          ...f,
          pair:       parsed.pair        || f.pair,
          direction:  dir,
          entryPrice: entry,
          exitPrice:  parsed.exitPrice?.toString()  || f.exitPrice,
          size:       parsed.size?.toString()       || f.size,
          leverage:   parsed.leverage?.toString()   || f.leverage,
          pnl:        parsed.pnl != null ? Math.abs(parsed.pnl).toString() : f.pnl,
          pnlPercent: parsed.pnlPercent != null ? Math.abs(parsed.pnlPercent).toString() : f.pnlPercent,
          pnlSide:    parsedPnlSide,
          rrRatio:    rr != null ? rr.toString() : (parsed.rrRatio?.toString() || f.rrRatio),
          sl, tp,
          liqPrice:   parsed.liqPrice?.toString()   || f.liqPrice,
          status:     parsed.status   || f.status,
          notes:      parsed.notes    || f.notes,
          date:       parsed.date ? new Date(parsed.date).toISOString().slice(0, 16) : f.date,
          duration:   parsed.duration || f.duration,
          fees:       parsed.fees?.toString() || f.fees,
        }
      })
      setAiState('done')
    } catch (e) {
      setAiState('error')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!form.pair.trim())  { alert('Pair is required'); return }
    if (!form.entryPrice)   { alert('Entry price is required'); return }
    addTrade({
      pair:        form.pair.toUpperCase(),
      direction:   form.direction,
      entryPrice:  parseFloat(form.entryPrice)  || null,
      exitPrice:   parseFloat(form.exitPrice)   || null,
      size:        parseFloat(form.size)        || null,
      leverage:    parseFloat(form.leverage)    || null,
      pnl:         signedPnl,
      pnlPercent:  signedPnlPct,
      rrRatio:     parseFloat(form.rrRatio)     || null,
      sl:          parseFloat(form.sl)          || null,
      tp:          parseFloat(form.tp)          || null,
      liqPrice:    parseFloat(form.liqPrice)    || null,
      status:      form.status,
      strategy:    form.strategy,
      notes:       form.notes,
      tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      date:        new Date(form.date).toISOString(),
      duration:    form.duration,
      fees:        parseFloat(form.fees) || null,
    })
    setSuccess(true)
    setTimeout(() => { setForm(INIT); setPreview(null); setAiState(null); setSuccess(false) }, 1800)
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, animation: 'fadeUp .3s ease' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--green-bg)', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(0,192,118,0.3)' }}>
          <Check size={32} color={G} />
        </div>
        <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 20, color: G, letterSpacing: 3 }}>TRADE SAVED</div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Form will reset in a moment</div>
      </div>
    )
  }

  const isWin = pnlSide === 'WIN'

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto', display: 'flex', gap: 20 }}>

      {/* ── Left: AI Upload Panel ── */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Cpu size={14} color={B} />
            <div className="label" style={{ color: B }}>AI Screenshot Parser</div>
          </div>
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !preview && fileRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? G : aiState === 'done' ? G : aiState === 'error' ? R : 'var(--border2)'}`,
              borderRadius: 10, padding: '20px', textAlign: 'center',
              background: dragOver ? 'var(--green-bg)' : aiState === 'done' ? 'var(--green-bg)' : 'var(--bg-input)',
              cursor: preview ? 'default' : 'pointer',
              transition: 'all .2s', position: 'relative', minHeight: 160,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, objectFit: 'contain' }} />
                <button onClick={e => { e.stopPropagation(); setPreview(null); setAiState(null) }}
                  style={{ position: 'absolute', top: 6, right: 6, background: R, border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={11} />
                </button>
                {aiState === 'parsing' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,15,0.8)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, border: `2px solid ${G}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                    <span style={{ color: G, fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 2 }}>AI PARSING...</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <Upload size={24} color={dragOver ? G : 'var(--text3)'} style={{ marginBottom: 8 }} />
                <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 3 }}>Drop screenshot here</div>
                <div style={{ color: 'var(--text3)', fontSize: 10, marginBottom: 10 }}>or click to browse</div>
                <div style={{ background: 'var(--bg-card)', border: `1px solid ${B}`, color: B, padding: '5px 14px', borderRadius: 5, fontSize: 10, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1.5 }}>CHOOSE FILE</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {aiState === 'done' && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--green-bg)', borderRadius: 6, border: `1px solid ${G}30` }}>
              <Check size={13} color={G} />
              <span style={{ color: G, fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>FIELDS AUTO-FILLED</span>
            </div>
          )}
          {aiState === 'error' && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 6, border: `1px solid ${R}30` }}>
              <AlertCircle size={13} color={R} />
              <span style={{ color: R, fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 700, letterSpacing: 1 }}>PARSE FAILED — FILL MANUALLY</span>
            </div>
          )}
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-card2)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <div className="label" style={{ marginBottom: 5 }}>Tips</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.8 }}>
              · PnL %: auto dari Entry + Exit + Leverage<br />
              · PnL USDT: input positif, WIN/LOSS ikut otomatis<br />
              · RR auto-hitung dari Entry + TP + SL<br />
              · API key diperlukan untuk AI parsing
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Pair + Direction */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label required>Pair</Label>
              <Inp value={form.pair} onChange={set('pair')} placeholder="e.g. BTCUSDT"
                style={{ textTransform: 'uppercase', fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 14, letterSpacing: 1 }} />
            </div>
            <div>
              <Label required>Direction</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['LONG', 'SHORT'].map(d => (
                  <button key={d} onClick={() => setDirection(d)} style={{
                    flex: 1, padding: '8px 0',
                    background: form.direction === d ? (d === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--bg-input)',
                    border: `1.5px solid ${form.direction === d ? (d === 'LONG' ? G : R) : 'var(--border)'}`,
                    color: form.direction === d ? (d === 'LONG' ? G : R) : 'var(--text3)',
                    borderRadius: 6, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 13, letterSpacing: 2,
                  }}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strategy + Status */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Strategy</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <select value={form.strategy} onChange={e => set('strategy')(e.target.value)}
                    style={{ width: '100%', padding: '8px 11px', fontSize: 12, paddingRight: 28, appearance: 'none' }}>
                    {strategies.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                </div>
                <button onClick={() => setStratModal(true)} style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border2)', color: 'var(--text2)',
                  borderRadius: 6, padding: '0 11px', display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 10, letterSpacing: 1,
                }}><Plus size={12} /> ADD</button>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['CLOSED', 'OPEN'].map(s => (
                  <button key={s} onClick={() => set('status')(s)} style={{
                    flex: 1, padding: '8px 0',
                    background: form.status === s ? 'var(--blue-bg)' : 'var(--bg-input)',
                    border: `1.5px solid ${form.status === s ? B : 'var(--border)'}`,
                    color: form.status === s ? B : 'var(--text3)',
                    borderRadius: 6, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
                  }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Entry / Exit / Size / Leverage */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div className="label" style={{ marginBottom: 12 }}>Trade Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <div>
              <Label required>Entry Price</Label>
              <Inp value={form.entryPrice} onChange={setEntry} placeholder="0.00" type="number" />
            </div>
            <div>
              <Label>Exit Price</Label>
              <Inp value={form.exitPrice} onChange={set('exitPrice')} placeholder="0.00" type="number" />
            </div>
            <div>
              <Label>Size (USDT)</Label>
              <Inp value={form.size} onChange={set('size')} placeholder="0.00" type="number" />
            </div>
            <div>
              <Label>Leverage</Label>
              <Inp value={form.leverage} onChange={set('leverage')} placeholder="1" type="number" />
            </div>
          </div>
        </div>

        {/* PnL — WIN/LOSS toggle, no need to type "-" */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="label">PnL & Result</div>
            {/* WIN / LOSS pill toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 6, padding: 2, gap: 2 }}>
              {['WIN', 'LOSS'].map(side => (
                <button key={side} onClick={() => { if (!pctAuto) set('pnlSide')(side) }} disabled={pctAuto} style={{
                  padding: '4px 16px', borderRadius: 4,
                  background: pnlSide === side ? (side === 'WIN' ? G : R) : 'transparent',
                  color: pnlSide === side ? '#000' : 'var(--text3)',
                  fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5,
                  transition: 'all .15s',
                  cursor: pctAuto ? 'not-allowed' : 'pointer',
                  opacity: pctAuto && pnlSide !== side ? 0.5 : 1,
                }}>{side}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <Label>PnL (USDT)</Label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700,
                  color: isWin ? G : R, pointerEvents: 'none', zIndex: 1,
                }}>{isWin ? '+' : '-'}</div>
                <Inp value={form.pnl} onChange={setPnl} placeholder="0.00" type="number"
                  style={{ paddingLeft: 22, color: isWin ? G : R, fontWeight: 700 }} />
              </div>
            </div>
            <div>
              <Label>PnL % {pctAuto && <span style={{ color: 'var(--text3)', fontSize: 8, fontFamily: 'var(--ff-body)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>auto</span>}</Label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700,
                  color: isWin ? G : R, pointerEvents: 'none', zIndex: 1,
                }}>{isWin ? '+' : '-'}</div>
                <Inp value={pctDisplay} onChange={setPnlPct} placeholder="0.00" type="number"
                  readOnly={pctAuto}
                  style={{ paddingLeft: 22, color: isWin ? G : R, fontWeight: pctAuto ? 700 : 400, cursor: pctAuto ? 'default' : 'text' }} />
              </div>
            </div>
            <div>
              <Label>Fees (USDT)</Label>
              <Inp value={form.fees} onChange={set('fees')} placeholder="0.00" type="number" />
            </div>
          </div>
        </div>

        {/* Risk Fields — RR auto from Entry + TP + SL */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div className="label" style={{ marginBottom: 12 }}>Risk Fields</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            <div>
              <Label>Take Profit</Label>
              <Inp value={form.tp} onChange={setTP} placeholder="0.00" type="number"
                style={{ color: form.tp ? G : 'var(--text)' }} />
            </div>
            <div>
              <Label>Stop Loss</Label>
              <Inp value={form.sl} onChange={setSL} placeholder="0.00" type="number"
                style={{ color: form.sl ? R : 'var(--text)' }} />
            </div>
            <div>
              <Label>Liq. Price</Label>
              <Inp value={form.liqPrice} onChange={set('liqPrice')} placeholder="0.00" type="number"
                style={{ color: form.liqPrice ? '#ff9500' : 'var(--text)' }} />
            </div>
            <div>
              <Label>RR Ratio <span style={{ color: 'var(--text3)', fontSize: 8, fontFamily: 'var(--ff-body)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>auto</span></Label>
              <Inp value={form.rrRatio} onChange={set('rrRatio')} placeholder="—" type="number"
                style={{ color: B, fontWeight: 700 }} />
            </div>
            <div>
              <Label>Duration</Label>
              <Inp value={form.duration} onChange={set('duration')} placeholder="e.g. 2h 30m" />
            </div>
          </div>
        </div>

        {/* Notes + Date + Tags */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12 }}>
            <div>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={e => set('notes')(e.target.value)}
                placeholder="Trade rationale, market context, lessons learned..."
                rows={3} style={{ width: '100%', padding: '8px 11px', fontSize: 12, resize: 'none', lineHeight: 1.6 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <Label>Date & Time</Label>
                <Inp value={form.date} onChange={set('date')} type="datetime-local" />
              </div>
              <div>
                <Label>Tags</Label>
                <Inp value={form.tags} onChange={set('tags')} placeholder="breakout, signal..." />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} style={{
          width: '100%', padding: '13px',
          background: G, color: '#000',
          borderRadius: 10, fontFamily: 'var(--ff-display)', fontWeight: 700,
          fontSize: 15, letterSpacing: 3,
          boxShadow: '0 0 24px rgba(0,192,118,0.25)',
          transition: 'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#00e88a'; e.currentTarget.style.boxShadow = '0 0 32px rgba(0,192,118,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = G; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,192,118,0.25)' }}>
          SAVE TRADE
        </button>
      </div>

      {/* Strategy Modal */}
      {stratModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setStratModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border2)', borderRadius: 14, padding: 24, width: 380, animation: 'fadeUp .2s ease' }}>
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 16, letterSpacing: 1.5, marginBottom: 16 }}>ADD STRATEGY</div>
            <div style={{ marginBottom: 14 }}>
              <div className="label" style={{ marginBottom: 6 }}>Name</div>
              <Inp value={newStrat} onChange={setNewStrat} placeholder="e.g. ICT Concepts, SMC..." autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newStrat.trim()) {
                    addStrategy(newStrat.trim()); set('strategy')(newStrat.trim()); setNewStrat(''); setStratModal(false)
                  }
                }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Existing</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {strategies.map(s => (
                  <span key={s} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'var(--ff-display)', fontWeight: 600, letterSpacing: 1 }}>{s}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStratModal(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>CANCEL</button>
              <button onClick={() => {
                if (!newStrat.trim()) return
                addStrategy(newStrat.trim()); set('strategy')(newStrat.trim()); setNewStrat(''); setStratModal(false)
              }} style={{ flex: 2, padding: '10px', background: G, color: '#000', borderRadius: 8, fontFamily: 'var(--ff-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>ADD STRATEGY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
