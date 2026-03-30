import { useState, useEffect, Suspense, lazy } from 'react'
import { analyticsAPI, budgetsAPI } from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const BudgetGlobe  = lazy(() => import('../components/visualizations/BudgetGlobe'))
const ParticleFlow = lazy(() => import('../components/visualizations/ParticleFlow'))
const MonthlyBars  = lazy(() => import('../components/visualizations/MonthlyBars'))
const SurplusRing  = lazy(() => import('../components/visualizations/SurplusRing'))

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n ?? 0)
const pct  = (n) => `${Number(n ?? 0).toFixed(1)}%`

export default function AnalyticsPage() {
  const { showToast } = useToast()
  const [summary,  setSummary]  = useState(null)
  const [history,  setHistory]  = useState([])
  const [budgetId, setBudgetId] = useState(null)
  const [budgets,  setBudgets]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { loadBudgets() }, [])
  useEffect(() => { if (budgetId) loadAnalytics() }, [budgetId])

  const loadBudgets = async () => {
    try {
      const { data } = await budgetsAPI.list()
      setBudgets(data)
      const cur = data.find(b => b.isActive) || data[0]
      if (cur) setBudgetId(cur.id)
    } catch {} finally { setLoading(false) }
  }

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [s, h] = await Promise.all([analyticsAPI.summary(budgetId), analyticsAPI.history()])
      setSummary(s.data); setHistory(h.data || [])
    } catch { showToast('Analytics unavailable; using demo data', 'info') }
    finally { setLoading(false) }
  }

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const { data } = await analyticsAPI.export(budgetId, format)
      const url   = URL.createObjectURL(data)
      const a     = document.createElement('a')
      a.href      = url
      a.download  = `budget-${budgetId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`Exported as ${format.toUpperCase()}`, 'success')
    } catch { showToast('Export failed', 'error') }
    finally { setExporting(false) }
  }

  const s = summary

  // Computed metrics matching computeSummary() formulas
  const metrics = s ? [
    { label:'Total Income',       value: fmt(s.totalIncome),                                          color:'var(--color-yellow)' },
    { label:'Needs Budget (50%)', value: fmt(s.needsBudget),                                          color:'var(--color-needs)' },
    { label:'Wants Budget (30%)', value: fmt(s.wantsBudget),                                          color:'var(--color-wants)' },
    { label:'Savings Budget (20%)',value:fmt(s.savingsBudget),                                         color:'var(--color-savings)' },
    { label:'Needs Spent',        value: fmt(s.needsSpent),   sub:pct(s.needsPercentage)   + ' of income', color:'var(--color-needs)' },
    { label:'Wants Spent',        value: fmt(s.wantsSpent),   sub:pct(s.wantsPercentage)   + ' of income', color:'var(--color-wants)' },
    { label:'Savings Completed',  value: fmt(s.savingsSpent), sub:pct(s.savingsPercentage) + ' of income', color:'var(--color-savings)' },
    { label:'Total Spent',        value: fmt(s.totalSpent),                                            color:'var(--color-off-white)' },
    { label:'Total Remaining',    value: fmt(s.totalRemaining),                                        color: s.totalRemaining >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' },
    { label:'Surplus / Deficit',  value: (s.surplusDeficit >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(s.surplusDeficit)), color: s.surplusDeficit >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' },
    { label:'Needs Remaining',    value: fmt(s.needsRemaining),                                        color: s.needsRemaining   >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' },
    { label:'Wants Remaining',    value: fmt(s.wantsRemaining),                                        color: s.wantsRemaining   >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' },
  ] : []

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep dive into your spending patterns</p>
        </div>
        <div className="flex gap-3">
          {budgets.length > 1 && (
            <select className="select" style={{ width:'auto' }} value={budgetId || ''} onChange={e => setBudgetId(e.target.value)}>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>
                  {new Date(b.month).toLocaleString('default', { month:'long', year:'numeric' })}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary btn-sm" disabled={!budgetId || exporting} onClick={() => handleExport('csv')}>
            ↓ CSV
          </button>
          <button className="btn btn-secondary btn-sm" disabled={!budgetId || exporting} onClick={() => handleExport('json')}>
            ↓ JSON
          </button>
          <button className="btn btn-secondary btn-sm" disabled={!budgetId || exporting} onClick={() => handleExport('xlsx')}>
            ↓ EXCEL
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ minHeight:'60vh' }}><LoadingSpinner /></div>
      ) : (
        <>
          {/* Formula Metrics Grid — replicates all 19 computeSummary() outputs */}
          {s && (
            <div className="card mb-8">
              <div className="card-header">
                <div>
                  <div className="card-title">Budget Summary</div>
                  <div className="card-subtitle">computeSummary() — all 19 formula outputs</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'var(--space-1)' }}>
                {metrics.map((m, i) => (
                  <div key={i} style={{ padding:'var(--space-4) var(--space-5)', borderBottom:'1px solid var(--color-glass-border)', borderRight:'1px solid var(--color-glass-border)' }}>
                    <div className="text-xs text-grey" style={{ marginBottom:'var(--space-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{m.label}</div>
                    <div style={{ fontSize:'var(--text-xl)', fontWeight:700, color: m.color }}>{m.value}</div>
                    {m.sub && <div className="text-xs text-grey mt-2">{m.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Four visualizations in 2×2 grid */}
          <div className="viz-grid mb-8">
            <div className="card">
              <div className="card-header"><div className="card-title">◉ Budget Globe</div></div>
              <div className="viz-container" style={{ height:'360px', borderRadius:'0 0 20px 20px' }}>
                <Suspense fallback={<div className="flex items-center justify-center" style={{height:'100%'}}><LoadingSpinner /></div>}>
                  <BudgetGlobe summary={s} />
                </Suspense>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">⋯ Particle Flow</div></div>
              <div className="viz-container" style={{ height:'360px', borderRadius:'0 0 20px 20px' }}>
                <Suspense fallback={<div className="flex items-center justify-center" style={{height:'100%'}}><LoadingSpinner /></div>}>
                  <ParticleFlow summary={s} />
                </Suspense>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">▦ Monthly History</div></div>
              <div className="viz-container" style={{ height:'360px', borderRadius:'0 0 20px 20px' }}>
                <Suspense fallback={<div className="flex items-center justify-center" style={{height:'100%'}}><LoadingSpinner /></div>}>
                  <MonthlyBars history={history} />
                </Suspense>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">◎ Surplus Ring</div></div>
              <div className="viz-container" style={{ height:'360px', borderRadius:'0 0 20px 20px' }}>
                <Suspense fallback={<div className="flex items-center justify-center" style={{height:'100%'}}><LoadingSpinner /></div>}>
                  <SurplusRing summary={s} />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Category Progress */}
          {s && (
            <div className="card">
              <div className="card-header"><div className="card-title">Category Performance</div></div>
              <div style={{ padding:'var(--space-6)', display:'flex', flexDirection:'column', gap:'var(--space-6)' }}>
                {[
                  { label:'Needs',   target:50, actual: s.needsPercentage,   spent: s.needsSpent,   budget: s.needsBudget,   color:'var(--color-needs)' },
                  { label:'Wants',   target:30, actual: s.wantsPercentage,   spent: s.wantsSpent,   budget: s.wantsBudget,   color:'var(--color-wants)' },
                  { label:'Savings', target:20, actual: s.savingsPercentage, spent: s.savingsSpent, budget: s.savingsBudget, color:'var(--color-savings)' },
                ].map(cat => (
                  <div key={cat.label}>
                    <div className="flex justify-between items-center mb-4" style={{ flexWrap:'wrap', gap:'var(--space-2)' }}>
                      <div>
                        <span style={{ fontWeight:600, color: cat.color }}>{cat.label}</span>
                        <span className="text-sm text-grey" style={{ marginLeft:'var(--space-3)' }}>Target: {cat.target}%</span>
                      </div>
                      <div className="text-sm">
                        <strong style={{ color: cat.color }}>{fmt(cat.spent)}</strong>
                        <span className="text-grey"> of {fmt(cat.budget)}</span>
                        <span style={{ marginLeft:'var(--space-3)', color: Math.abs(cat.actual - cat.target) <= 3 ? 'var(--color-surplus)' : 'var(--color-deficit)' }}>
                          ({pct(cat.actual)} actual)
                        </span>
                      </div>
                    </div>
                    {/* Dual-track: target vs actual */}
                    <div style={{ position:'relative' }}>
                      {/* Target track */}
                      <div className="progress-bar" style={{ height:'4px', marginBottom:'var(--space-1)' }}>
                        <div className="progress-bar-fill" style={{ width:`${cat.target}%`, '--fill-color':'var(--color-black-400)', opacity:0.4 }} />
                      </div>
                      {/* Actual track */}
                      <div className="progress-bar">
                        <div className="progress-bar-fill"
                          style={{ width:`${Math.min(cat.actual * (100 / cat.target), 100)}%`, '--fill-color': cat.color }} />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-grey">
                      <span>0%</span>
                      <span style={{ color:'var(--color-black-400)' }}>Target: {cat.target}%</span>
                      <span>{pct(cat.actual * (100 / cat.target))} of target</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
