import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

const DEFAULT_STRATEGIES = ['Myself', 'NeuroBro']

const DEMO_TRADES = [
  {
    id: '1',
    pair: 'HYPEUSDT',
    direction: 'LONG',
    entryPrice: 18.42,
    exitPrice: 22.15,
    size: 100,
    leverage: 10,
    pnl: 37.30,
    pnlPercent: 20.25,
    rrRatio: 2.1,
    sl: 17.80,
    tp: 22.50,
    liqPrice: 16.58,
    status: 'CLOSED',
    strategy: 'Myself',
    notes: 'Breakout play on HYPE, volume confirmed, took partial at 20.80',
    date: '2026-06-15T09:30:00Z',
    duration: '4h 20m',
    tags: ['breakout', 'volume'],
    fees: 0.21,
  },
  {
    id: '2',
    pair: 'BTCUSDT',
    direction: 'LONG',
    entryPrice: 103200,
    exitPrice: 105800,
    size: 200,
    leverage: 5,
    pnl: 25.19,
    pnlPercent: 2.52,
    rrRatio: 1.8,
    sl: 102000,
    tp: 106000,
    liqPrice: 82560,
    status: 'CLOSED',
    strategy: 'NeuroBro',
    notes: 'Signal from NeuroBro, followed plan perfectly',
    date: '2026-06-14T14:15:00Z',
    duration: '2h 05m',
    tags: ['signal', 'trend'],
    fees: 0.30,
  },
  {
    id: '3',
    pair: 'SOLUSDT',
    direction: 'SHORT',
    entryPrice: 162.50,
    exitPrice: 168.90,
    size: 80,
    leverage: 8,
    pnl: -10.38,
    pnlPercent: -12.97,
    rrRatio: 0.5,
    sl: 168.00,
    tp: 155.00,
    liqPrice: 182.81,
    status: 'CLOSED',
    strategy: 'Myself',
    notes: 'Tried to short the local top, got stopped out, market was stronger',
    date: '2026-06-13T11:00:00Z',
    duration: '45m',
    tags: ['failed', 'counter-trend'],
    fees: 0.15,
  },
  {
    id: '4',
    pair: 'INUSDT',
    direction: 'LONG',
    entryPrice: 0.04821,
    exitPrice: 0.05671,
    size: 150,
    leverage: 15,
    pnl: 14.49,
    pnlPercent: 17.63,
    rrRatio: 2.5,
    sl: 0.04600,
    tp: 0.05800,
    liqPrice: 0.04178,
    status: 'CLOSED',
    strategy: 'NeuroBro',
    notes: 'Low cap gem, NeuroBro signal, great RR',
    date: '2026-06-12T08:45:00Z',
    duration: '6h 10m',
    tags: ['altcoin', 'signal'],
    fees: 0.08,
  },
  {
    id: '5',
    pair: 'NEARUSDT',
    direction: 'SHORT',
    entryPrice: 4.82,
    exitPrice: 5.20,
    size: 60,
    leverage: 6,
    pnl: -3.60,
    pnlPercent: -6.0,
    rrRatio: 0.7,
    sl: 5.10,
    tp: 4.20,
    liqPrice: 5.61,
    status: 'CLOSED',
    strategy: 'Myself',
    notes: 'Bad entry, should have waited for confirmation',
    date: '2026-06-10T16:30:00Z',
    duration: '1h 15m',
    tags: ['failed', 'premature'],
    fees: 0.09,
  },
]

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_trades')
      return saved ? JSON.parse(saved) : DEMO_TRADES
    } catch { return DEMO_TRADES }
  })

  const [capital, setCapital] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_capital')
      return saved ? parseFloat(saved) : 6.0000
    } catch { return 6.0000 }
  })

  const [strategies, setStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('rt_strategies')
      return saved ? JSON.parse(saved) : DEFAULT_STRATEGIES
    } catch { return DEFAULT_STRATEGIES }
  })

  useEffect(() => {
    if (user) localStorage.setItem('rt_user', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    localStorage.setItem('rt_trades', JSON.stringify(trades))
  }, [trades])

  useEffect(() => {
    localStorage.setItem('rt_capital', capital.toString())
  }, [capital])

  useEffect(() => {
    localStorage.setItem('rt_strategies', JSON.stringify(strategies))
  }, [strategies])

  const addTrade = (trade) => {
    const newTrade = {
      ...trade,
      id: Date.now().toString(),
      date: trade.date || new Date().toISOString(),
    }
    setTrades(prev => [newTrade, ...prev])
    return newTrade
  }

  const updateTrade = (id, updates) => {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const deleteTrade = (id) => {
    setTrades(prev => prev.filter(t => t.id !== id))
  }

  const addStrategy = (name) => {
    if (!strategies.includes(name)) {
      setStrategies(prev => [...prev, name])
    }
  }

  // Import from exported JSON — merge by id (skip duplicates), optionally override capital + strategies
  const importTrades = (json, mode = 'merge') => {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json
      const incoming = Array.isArray(data) ? data : (data.trades || [])

      if (mode === 'replace') {
        setTrades(incoming)
        if (data.capital) setCapital(data.capital)
        if (data.strategies) setStrategies(data.strategies)
        if (data.user) setUser(data.user)
        return { added: incoming.length, skipped: 0 }
      }

      // merge — skip existing ids
      setTrades(prev => {
        const existingIds = new Set(prev.map(t => t.id))
        const toAdd = incoming.filter(t => !existingIds.has(t.id))
        return [...toAdd, ...prev]
      })
      // merge strategies
      if (data.strategies) {
        setStrategies(prev => {
          const merged = new Set([...prev, ...data.strategies])
          return [...merged]
        })
      }
      // update capital only if not already customised (still default)
      if (data.capital && capital === 6.0) setCapital(data.capital)

      const existingIds = new Set(trades.map(t => t.id))
      const added = incoming.filter(t => !existingIds.has(t.id)).length
      const skipped = incoming.length - added
      return { added, skipped }
    } catch (e) {
      console.error('Import failed:', e)
      return { error: e.message }
    }
  }

  const stats = React.useMemo(() => {
    const closed = trades.filter(t => t.status === 'CLOSED')
    const totalPnl = closed.reduce((s, t) => s + (t.pnl || 0), 0)
    const wins = closed.filter(t => t.pnl > 0)
    const losses = closed.filter(t => t.pnl <= 0)
    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0
    const pf = avgLoss > 0 ? avgWin / avgLoss : 0
    const bestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0
    const worstLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0
    const currentBalance = capital + totalPnl
    const growth = capital > 0 ? ((currentBalance - capital) / capital) * 100 : 0

    // Streak
    let streak = 0
    for (let i = 0; i < closed.length; i++) {
      if (i === 0) { streak = closed[i].pnl > 0 ? 1 : -1; continue }
      if (closed[i].pnl > 0 && streak > 0) streak++
      else if (closed[i].pnl <= 0 && streak < 0) streak--
      else break
    }

    // By pair
    const byPair = {}
    closed.forEach(t => {
      if (!byPair[t.pair]) byPair[t.pair] = { pnl: 0, trades: 0, wins: 0 }
      byPair[t.pair].pnl += t.pnl || 0
      byPair[t.pair].trades++
      if (t.pnl > 0) byPair[t.pair].wins++
    })

    const pairRanking = Object.entries(byPair)
      .map(([pair, d]) => ({ pair, ...d, winRate: d.trades > 0 ? (d.wins / d.trades) * 100 : 0 }))
      .sort((a, b) => b.pnl - a.pnl)

    // Radar scores
    const winRateScore = Math.min(10, (winRate / 100) * 10)
    const rrScore = closed.length > 0 ? Math.min(10, (closed.reduce((s, t) => s + (t.rrRatio || 0), 0) / closed.length) * 3) : 0
    const momentumScore = streak > 0 ? Math.min(10, streak * 2) : Math.max(0, 5 + streak)
    const disciplineScore = Math.min(10, pf * 3)
    const netProfitScore = totalPnl >= 0 ? 10 : Math.max(0, 5 + totalPnl / 10)
    const consistencyScore = closed.length > 0 ? Math.min(10, (winRate / 100) * rrScore * 1.5) : 0

    return {
      totalTrades: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalPnl,
      avgWin,
      avgLoss,
      pf,
      bestWin,
      worstLoss,
      currentBalance,
      growth,
      streak,
      pairRanking,
      radarScores: {
        winRate: parseFloat(winRateScore.toFixed(1)),
        rrRatio: parseFloat(rrScore.toFixed(1)),
        momentum: parseFloat(momentumScore.toFixed(1)),
        discipline: parseFloat(disciplineScore.toFixed(1)),
        netProfit: parseFloat(netProfitScore.toFixed(1)),
        consistency: parseFloat(consistencyScore.toFixed(1)),
      },
      overallScore: parseFloat(((winRateScore + rrScore + momentumScore + disciplineScore + netProfitScore + consistencyScore) / 6).toFixed(1)),
    }
  }, [trades, capital])

  return (
    <AppContext.Provider value={{
      user, setUser,
      trades, addTrade, updateTrade, deleteTrade, importTrades,
      capital, setCapital,
      strategies, addStrategy,
      stats,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
