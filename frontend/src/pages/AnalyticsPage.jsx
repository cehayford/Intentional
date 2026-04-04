import { useState, useEffect } from 'react'
import { analyticsAPI, budgetsAPI } from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/layout/LoadingSpinner'
import './AnalyticsPage.css'

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n ?? 0)
const pct  = (n) => `${Number(n ?? 0).toFixed(1)}%`

export default function AnalyticsPage() {
  const { showToast } = useToast()
  const [summary, setSummary]  = useState(null)
  const [history, setHistory]  = useState([])
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

  // Simple key metrics
  const keyMetrics = s ? [
    { label:'Total Income', value: fmt(s.totalIncome), color: '#6366f1' },
    { label:'Total Spent', value: fmt(s.totalSpent), color: '#64748b' },
    { label:'Remaining', value: fmt(s.totalRemaining), color: s.totalRemaining >= 0 ? '#10b981' : '#ef4444' },
    { label:'Savings Rate', value: pct(s.savingsPercentage), color: '#10b981' },
  ] : []

  // Category breakdown
  const categories = s ? [
    { 
      name: 'Needs', 
      budget: s.needsBudget, 
      spent: s.needsSpent, 
      remaining: s.needsRemaining,
      percentage: s.needsPercentage,
      color: '#3b82f6'
    },
    { 
      name: 'Wants', 
      budget: s.wantsBudget, 
      spent: s.wantsSpent, 
      remaining: s.wantsRemaining,
      percentage: s.wantsPercentage,
      color: '#f59e0b'
    },
    { 
      name: 'Savings', 
      budget: s.savingsBudget, 
      spent: s.savingsSpent, 
      remaining: s.savingsRemaining,
      percentage: s.savingsPercentage,
      color: '#10b981'
    }
  ] : []

  return (
    <div className="analytics-page" style={{
      padding: 'clamp(1rem, 4vw, 2rem)'
    }}>
      <div className="page-header" style={{
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
        gap: 'clamp(0.75rem, 2vw, 1.5rem)',
        marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
      }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)'
          }}>Budget Analytics</h1>
          <p className="page-subtitle" style={{
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            marginTop: 'clamp(0.25rem, 1vw, 0.5rem)'
          }}>Track your spending and savings</p>
        </div>
        <div className="header-actions" style={{
          display: 'flex',
          flexDirection: window.innerWidth < 480 ? 'column' : 'row',
          gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
          alignItems: window.innerWidth < 480 ? 'stretch' : 'center'
        }}>
          {budgets.length > 1 && (
            <select className="select" value={budgetId || ''} onChange={e => setBudgetId(e.target.value)} style={{
              padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              minWidth: 'clamp(150px, 30vw, 200px)'
            }}>
              {budgets.map(b => (
                <option key={b.id} value={b.id}>
                  {new Date(b.month).toLocaleString('default', { month:'long', year:'numeric' })}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary" disabled={!budgetId || exporting} onClick={() => handleExport('csv')} style={{
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(1rem, 2vw, 1.5rem)',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            whiteSpace: 'nowrap'
          }}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'clamp(200px, 40vh, 300px)'
        }}><LoadingSpinner /></div>
      ) : (
        <>
          {/* Key Metrics */}
          {s && (
            <div className="metrics-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: 'clamp(0.75rem, 2vw, 1rem)',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
            }}>
              {keyMetrics.map((metric, i) => (
                <div key={i} className="metric-card" style={{
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  borderRadius: 'clamp(8px, 1.5vw, 12px)',
                  background: 'var(--color-black-800)',
                  border: '1px solid var(--color-black-600)'
                }}>
                  <div className="metric-label" style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    marginBottom: 'clamp(0.5rem, 1vw, 0.75rem)'
                  }}>{metric.label}</div>
                  <div className="metric-value" style={{ 
                    color: metric.color,
                    fontSize: 'clamp(1.125rem, 4vw, 1.5rem)',
                    fontWeight: '600'
                  }}>{metric.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Category Breakdown */}
          {s && (
            <div className="category-section">
              <h2>Category Breakdown</h2>
              <div className="category-grid">
                {categories.map((cat, i) => (
                  <div key={i} className="category-card">
                    <div className="category-header" style={{ color: cat.color }}>
                      <h3>{cat.name}</h3>
                      <div className="category-percentage">{pct(cat.percentage)}</div>
                    </div>
                    <div className="category-details">
                      <div className="category-row">
                        <span>Budget:</span>
                        <span>{fmt(cat.budget)}</span>
                      </div>
                      <div className="category-row">
                        <span>Spent:</span>
                        <span>{fmt(cat.spent)}</span>
                      </div>
                      <div className="category-row">
                        <span>Remaining:</span>
                        <span style={{ color: cat.remaining >= 0 ? '#10b981' : '#ef4444' }}>
                          {fmt(cat.remaining)}
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${Math.min((cat.spent / cat.budget) * 100, 100)}%`,
                          backgroundColor: cat.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly History */}
          {history.length > 0 && (
            <div className="history-section">
              <h2>Monthly History</h2>
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Income</th>
                      <th>Spent</th>
                      <th>Saved</th>
                      <th>Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item, i) => (
                      <tr key={i}>
                        <td>{new Date(item.month).toLocaleString('default', { month:'short', year:'numeric' })}</td>
                        <td>{fmt(item.totalIncome)}</td>
                        <td>{fmt(item.totalSpent)}</td>
                        <td style={{ color: item.totalRemaining >= 0 ? '#10b981' : '#ef4444' }}>
                          {fmt(item.totalRemaining)}
                        </td>
                        <td>{pct(item.savingsPercentage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Budget Insights */}
          {s && (
            <div className="insights-section">
              <h2>Budget Insights</h2>
              <div className="insights-grid">
                <div className="insight-card">
                  <h3>Spending Analysis</h3>
                  <p>You've spent {pct((s.totalSpent / s.totalIncome) * 100)} of your income.</p>
                  {s.totalRemaining >= 0 ? (
                    <p className="positive">You're on track with a surplus of {fmt(s.totalRemaining)}</p>
                  ) : (
                    <p className="negative">You've overspent by {fmt(Math.abs(s.totalRemaining))}</p>
                  )}
                </div>
                
                <div className="insight-card">
                  <h3>Category Performance</h3>
                  {categories.map(cat => {
                    const isOverBudget = cat.spent > cat.budget
                    return (
                      <div key={cat.name} className="category-insight">
                        <span style={{ color: cat.color }}>{cat.name}:</span>
                        <span className={isOverBudget ? 'negative' : 'positive'}>
                          {isOverBudget ? 'Over budget' : 'On track'}
                        </span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="insight-card">
                  <h3>Savings Goal</h3>
                  <p>Your savings rate is {pct(s.savingsPercentage)}.</p>
                  {s.savingsPercentage >= 20 ? (
                    <p className="positive">Great job! You're meeting the 20% savings goal.</p>
                  ) : (
                    <p className="neutral">Consider increasing savings to reach 20% goal.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
