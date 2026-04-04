import { useState, useEffect, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, budgetsAPI } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/layout/LoadingSpinner'

// Lazy-load Three.js visualizations to keep initial bundle small
const BudgetGlobe  = lazy(() => import('../components/visualizations/BudgetGlobe'))
const ParticleFlow = lazy(() => import('../components/visualizations/ParticleFlow'))
const MonthlyBars  = lazy(() => import('../components/visualizations/MonthlyBars'))
const SurplusRing  = lazy(() => import('../components/visualizations/SurplusRing'))

// ─── computeSummary formula replication (client fallback) ───
// The real computation runs server-side; this is UI sugar only.
function buildLocalSummary(budget) {
  if (!budget) return null
  const inc = Number(budget.totalIncome) || 0
  
  // Use custom percentages if available, otherwise fallback to 50/30/20
  let needsPct = 50, wantsPct = 30, savingsPct = 20
  
  if (budget.customNeedsPercentage) {
    needsPct = budget.customNeedsPercentage
    wantsPct = budget.customWantsPercentage
    savingsPct = budget.customSavingsPercentage
  }
  
  const needsBudget   = inc * (needsPct / 100)
  const wantsBudget   = inc * (wantsPct / 100)
  const savingsBudget = inc * (savingsPct / 100)
  const needsSpent    = budget.needsSpent   || 0
  const wantsSpent    = budget.wantsSpent   || 0
  const savingsSpent  = budget.savingsSpent || 0
  const totalSpent    = needsSpent + wantsSpent + savingsSpent
  const totalRemaining= inc - totalSpent
  return {
    totalIncome:      inc,
    needsBudget, wantsBudget, savingsBudget,
    needsSpent, wantsSpent, savingsSpent,
    needsRemaining:   needsBudget   - needsSpent,
    wantsRemaining:   wantsBudget   - wantsSpent,
    savingsRemaining: savingsBudget - savingsSpent,
    totalSpent, totalRemaining,
    surplusDeficit:   totalRemaining,
    needsPercentage:   inc ? (needsSpent   / inc) * 100 : 0,
    wantsPercentage:   inc ? (wantsSpent   / inc) * 100 : 0,
    savingsPercentage: inc ? (savingsSpent / inc) * 100 : 0,
    ruleName: 'Custom Rule',
    rulePercentages: { needsPct, wantsPct, savingsPct }
  }
}

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 }).format(n ?? 0)
const pct  = (n) => `${Number(n ?? 0).toFixed(1)}%`

export default function DashboardPage() {
  const { user }      = useAuth()
  const { showToast } = useToast()
  const navigate      = useNavigate()

  const [budget,   setBudget]   = useState(null)
  const [summary,  setSummary]  = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [activeViz, setActiveViz] = useState('globe')   // globe | flow | bars | ring
  const [filterCat, setFilterCat] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const { data: budgets } = await budgetsAPI.list()
      const current = budgets.find(b => b.isActive) || budgets[0]
      if (!current) { setLoading(false); return }
      setBudget(current)

      const [summaryRes, historyRes] = await Promise.all([
        analyticsAPI.summary(current.id),
        analyticsAPI.history(),
      ])
      setSummary(summaryRes.data)
      setHistory(historyRes.data || [])
    } catch {
      // Use local fallback summary from budget data
      setSummary(buildLocalSummary(budget))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center" style={{ minHeight:'60vh' }}>
      <LoadingSpinner text="Loading your budget..." />
    </div>
  )

  const s = summary

  const STATS = [
    { label:'Monthly Income',  value: fmt(s?.totalIncome),     sub:'Total budget',          accent:'var(--color-yellow)',  badge:null },
    { label:'Total Spent',     value: fmt(s?.totalSpent),      sub:`${pct((s?.totalSpent||0)/(s?.totalIncome||1)*100)} of income`, accent:'var(--color-wants)',   badge:null },
    { label:'Remaining',       value: fmt(s?.totalRemaining),  sub:'Left this month',       accent: s?.totalRemaining >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)', badge: s?.totalRemaining >= 0 ? { type:'positive', text:'▲ On Track' } : { type:'negative', text:'▼ Over Budget' } },
    { label:'Savings',         value: fmt(s?.savingsSpent),    sub:`Goal: ${fmt(s?.savingsBudget)}`, accent:'var(--color-savings)', badge:null },
  ]

  const VIZ_TABS = [
    { key:'globe', label:'Allocation Globe', icon:'◉' },
    { key:'flow',  label:'Particle Flow',    icon:'⋯' },
    { key:'bars',  label:'Monthly History',  icon:'▦' },
    { key:'ring',  label:'Surplus Ring',     icon:'◎' },
  ]

  const CATEGORY_ROWS = [
    { label:'Needs',   key:'needs',   budget: s?.needsBudget,   spent: s?.needsSpent,   remain: s?.needsRemaining,  pctUsed:(s?.needsSpent||0)/(s?.needsBudget||1)*100,   color:'var(--color-needs)',   badge:'badge-need' },
    { label:'Wants',   key:'wants',   budget: s?.wantsBudget,   spent: s?.wantsSpent,   remain: s?.wantsRemaining,  pctUsed:(s?.wantsSpent||0)/(s?.wantsBudget||1)*100,   color:'var(--color-wants)',   badge:'badge-want' },
    { label:'Savings', key:'savings', budget: s?.savingsBudget, spent: s?.savingsSpent, remain: s?.savingsRemaining, pctUsed:(s?.savingsSpent||0)/(s?.savingsBudget||1)*100, color:'var(--color-savings)', badge:'badge-savings' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
            <span className="text-yellow">{user?.firstName || 'there'}</span> 👋
          </h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        {!budget && (
          <button className="btn btn-primary" onClick={() => navigate('/budgets')}>
            + Create Budget
          </button>
        )}
      </div>

      {!s ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No budget yet</div>
          <p className="empty-state-text">Create your first monthly budget to start tracking your 50/30/20 allocations.</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/budgets')}>Create Budget →</button>
        </div>
      ) : (
        <>
          {/* ─── Stats Grid ─────────────────────────────── */}
          <div className="stats-grid">
            {STATS.map((st, i) => (
              <div
                key={i}
                className="stat-card animate-slide-up"
                style={{ '--accent-color': st.accent, animationDelay: `${i * 0.08}s` }}
              >
                <div className="stat-label">{st.label}</div>
                <div className="stat-value" style={{ color: st.accent }}>{st.value}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="stat-sub">{st.sub}</span>
                  {st.badge && <span className={`stat-badge ${st.badge.type}`}>{st.badge.text}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Category Breakdown ─────────────────────── */}
          <div className="card mb-8">
            <div className="card-header">
              <div>
                <div className="card-title">Budget Breakdown</div>
                <div className="card-subtitle">50% Needs · 30% Wants · 20% Savings</div>
              </div>
            </div>
            <div style={{ padding:'var(--space-6)', display:'flex', flexDirection:'column', gap:'var(--space-6)' }}>
              {CATEGORY_ROWS.map(cat => (
                <div key={cat.key}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${cat.badge}`}>{cat.label}</span>
                      <span className="text-sm text-grey">Budget: {fmt(cat.budget)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>Spent: <strong style={{ color: cat.color }}>{fmt(cat.spent)}</strong></span>
                      <span style={{ color: cat.remain >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' }}>
                        {cat.remain >= 0 ? '▲' : '▼'} {fmt(Math.abs(cat.remain))} left
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(cat.pctUsed, 100)}%`,
                        '--fill-color': cat.pctUsed > 100 ? 'var(--color-deficit)' : cat.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-grey">
                    <span>{pct(cat.pctUsed)} used</span>
                    <span>{pct(100 - Math.min(cat.pctUsed, 100))} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Visualization Section ──────────────────── */}
          <div className="card mb-8">
            <div className="card-header">
              <div>
                <div className="card-title">3D Visualizations</div>
                <div className="card-subtitle">Interactive budget analytics powered by Three.js</div>
              </div>
              <div className="flex gap-2" style={{ flexWrap:'wrap' }}>
                {VIZ_TABS.map(v => (
                  <button
                    key={v.key}
                    className={`btn btn-sm ${activeViz === v.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveViz(v.key)}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="viz-container" style={{ height:'440px', borderRadius:'0 0 20px 20px' }}>
              <Suspense fallback={
                <div className="flex items-center justify-center" style={{ height:'100%' }}>
                  <LoadingSpinner text="Loading 3D scene..." />
                </div>
              }>
                {activeViz === 'globe' && <BudgetGlobe  summary={s} onCategoryClick={setFilterCat} />}
                {activeViz === 'flow'  && <ParticleFlow summary={s} />}
                {activeViz === 'bars'  && <MonthlyBars  history={history} />}
                {activeViz === 'ring'  && <SurplusRing  summary={s} />}
              </Suspense>
            </div>
          </div>

          {/* ─── Surplus/Deficit Banner ─────────────────── */}
          <div
            className="card card-p animate-slide-up"
            style={{
              border: `1px solid ${s.surplusDeficit >= 0 ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
              background: s.surplusDeficit >= 0 ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)',
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--space-4)',
            }}
          >
            <div>
              <div className="text-sm text-grey">Monthly {s.surplusDeficit >= 0 ? 'Surplus' : 'Deficit'}</div>
              <div
                className="text-3xl font-bold"
                style={{ color: s.surplusDeficit >= 0 ? 'var(--color-surplus)' : 'var(--color-deficit)' }}
              >
                {s.surplusDeficit >= 0 ? '▲' : '▼'} {fmt(Math.abs(s.surplusDeficit))}
              </div>
            </div>
            <div className="text-sm text-grey" style={{ maxWidth:'320px' }}>
              {s.surplusDeficit >= 0
                ? `Great work! You have ${fmt(s.surplusDeficit)} surplus this month. Consider moving it to savings.`
                : `You're ${fmt(Math.abs(s.surplusDeficit))} over budget. Review your wants spending to get back on track.`}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
