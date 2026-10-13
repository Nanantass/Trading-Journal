/**
 * Calculate RR Ratio from entry, tp, sl, direction
 * Returns null if insufficient data
 */
export function calcRR(entry, tp, sl, direction) {
  const e  = parseFloat(entry)
  const t  = parseFloat(tp)
  const s  = parseFloat(sl)
  const dir = direction === 'SHORT' ? -1 : 1

  if (!e || !t || !s || isNaN(e) || isNaN(t) || isNaN(s)) return null
  if (e === 0) return null

  const reward = dir * (t - e)
  const risk   = dir * (e - s)

  if (risk <= 0 || reward < 0) return null
  return parseFloat((reward / risk).toFixed(2))
}

/**
 * Calculate PnL USDT from entry, exit, size, leverage, direction
 * size = margin/collateral in USDT
 * PnL = size * leverage * priceDelta% = size * (exit - entry) / entry * leverage * dir
 * Returns { pnl, pnlPercent } or null
 */
export function calcPnL(entry, exit, size, leverage, direction) {
  const e   = parseFloat(entry)
  const x   = parseFloat(exit)
  const s   = parseFloat(size)
  const lev = parseFloat(leverage) || 1
  const dir = direction === 'SHORT' ? -1 : 1

  if (!e || !x || isNaN(e) || isNaN(x) || e === 0) return null

  const priceDelta = (x - e) / e        // % move in price
  const pnlPercent = priceDelta * lev * dir * 100
  const pnl        = s ? parseFloat((s * priceDelta * lev * dir).toFixed(4)) : null

  return {
    pnl,
    pnlPercent: parseFloat(pnlPercent.toFixed(2)),
  }
}
