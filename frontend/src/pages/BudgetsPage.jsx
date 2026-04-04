import { useState, useEffect } from 'react'
import { budgetsAPI, incomeAPI } from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n ?? 0)

export default function BudgetsPage() {
  const { showToast } = useToast()
  const [budgets,  setBudgets]  = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [incomeModal, setIncomeModal] = useState(false)
  const [incomeForm, setIncomeForm] = useState({ sourceName:'', amount:'' })
  const [creating,  setCreating]  = useState(false)
  const [customPercentages, setCustomPercentages] = useState(null)
  const [newBudget, setNewBudget] = useState({
    month: new Date().toISOString().slice(0,7),
    initialIncome: '',
    initialSource: 'Salary',
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await budgetsAPI.list()
      setBudgets(data)
      setSelected(data.find(b => b.isActive) || data[0] || null)
    } catch { showToast('Failed to load budgets', 'error') }
    finally { setLoading(false) }
  }

  const handleCreate = async (e) => {
    e.preventDefault(); setCreating(true)
    try {
      const createData = {
        month: `${newBudget.month}-01`,
        initialIncome: Number(newBudget.initialIncome),
        initialSource: newBudget.initialSource,
      }
      
      // Add custom percentages if provided
      if (customPercentages) {
        createData.customNeedsPercentage = customPercentages.needsPercentage
        createData.customWantsPercentage = customPercentages.wantsPercentage
        createData.customSavingsPercentage = customPercentages.savingsPercentage
      }
      
      const { data } = await budgetsAPI.create(createData)
      showToast('Budget created!', 'success')
      setShowCreate(false); load()
      
      // Reset form
      setCustomPercentages(null)
      setNewBudget({
        month: new Date().toISOString().slice(0,7),
        initialIncome: '',
        initialSource: 'Salary',
      })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create budget', 'error')
    } finally { setCreating(false) }
  }

  const handleAddIncome = async (e) => {
    e.preventDefault()
    try {
      await incomeAPI.add({ budgetId: selected.id, sourceName: incomeForm.sourceName, amount: Number(incomeForm.amount) })
      showToast('Income source added', 'success')
      setIncomeModal(false); setIncomeForm({ sourceName:'', amount:'' }); load()
    } catch { showToast('Failed to add income', 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget? All expenses will be removed.')) return
    try { await budgetsAPI.delete(id); showToast('Budget deleted', 'info'); load() }
    catch { showToast('Cannot delete', 'error') }
  }

  if (loading) return <div className="flex items-center justify-center" style={{ minHeight:'60vh' }}><LoadingSpinner /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Manage your monthly budgets and income sources</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Budget</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'var(--space-6)' }}>
        {/* Budget List */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
          <p className="text-xs text-grey" style={{ textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:600, padding:'0 var(--space-2)' }}>Your Budgets</p>
          {budgets.length === 0 && (
            <div className="empty-state" style={{ padding:'var(--space-8) var(--space-4)' }}>
              <div className="empty-state-icon">📅</div>
              <p className="text-sm text-grey">No budgets yet</p>
            </div>
          )}
          {budgets.map(b => (
            <div
              key={b.id}
              className={`card card-p ${selected?.id === b.id ? 'animate-glow' : ''}`}
              style={{
                cursor:'pointer',
                border: selected?.id === b.id ? '1px solid rgba(255,243,19,0.4)' : '1px solid var(--color-glass-border)',
                background: selected?.id === b.id ? 'var(--color-yellow-glow)' : 'var(--color-glass-white)',
              }}
              onClick={() => setSelected(b)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div style={{ fontWeight:600, fontSize:'var(--text-base)' }}>
                    {new Date(b.month).toLocaleString('default', { month:'long', year:'numeric' })}
                  </div>
                  <div className="text-sm text-grey">{fmt(b.totalIncome)} income</div>
                </div>
                {b.isActive && <span className="badge" style={{ background:'var(--color-yellow-glow)', color:'var(--color-yellow)', border:'1px solid rgba(255,243,19,0.3)' }}>Active</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Budget Detail */}
        {selected ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
            {/* Header */}
            <div className="card card-p">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {new Date(selected.month).toLocaleString('default', { month:'long', year:'numeric' })}
                </h2>
                <div className="flex gap-3">
                  <button className="btn btn-secondary btn-sm" onClick={() => setIncomeModal(true)}>+ Income</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
                </div>
              </div>

              {/* 50/30/20 Summary */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'var(--space-4)' }}>
                {[
                  { label:'Needs (50%)',   amt: selected.needsBudget,   color:'var(--color-needs)' },
                  { label:'Wants (30%)',   amt: selected.wantsBudget,   color:'var(--color-wants)' },
                  { label:'Savings (20%)', amt: selected.savingsBudget, color:'var(--color-savings)' },
                ].map(row => (
                  <div key={row.label} style={{ textAlign:'center', padding:'var(--space-4)', borderRadius:'var(--border-radius)', background:'var(--color-glass-white)', border:'1px solid var(--color-glass-border)' }}>
                    <div className="text-xs text-grey" style={{ textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'var(--space-2)' }}>{row.label}</div>
                    <div style={{ fontSize:'var(--text-2xl)', fontWeight:700, color: row.color }}>{fmt(row.amt)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Sources */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Income Sources</div>
                <div style={{ fontSize:'var(--text-xl)', fontWeight:700, color:'var(--color-yellow)' }}>{fmt(selected.totalIncome)}</div>
              </div>
              <div style={{ padding:'var(--space-4)' }}>
                {(selected.incomeSources || []).length === 0 ? (
                  <p className="text-sm text-grey" style={{ padding:'var(--space-4)', textAlign:'center' }}>No income sources. Add one above.</p>
                ) : (
                  <table className="table">
                    <thead><tr><th>Source</th><th className="text-right">Amount</th><th></th></tr></thead>
                    <tbody>
                      {(selected.incomeSources || []).map(inc => (
                        <tr key={inc.id}>
                          <td>{inc.sourceName}</td>
                          <td className="text-right font-semi text-yellow">{fmt(inc.amount)}</td>
                          <td>
                            <button className="btn btn-sm btn-danger" onClick={async () => {
                              await incomeAPI.delete(inc.id); showToast('Removed', 'info'); load()
                            }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">Select a budget</div>
            <p className="empty-state-text">Choose a month from the left or create a new budget.</p>
          </div>
        )}
      </div>

      {/* Create Budget Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal animate-slide-up">
            <div className="modal-header">
              <h2 className="modal-title">New Budget</h2>
              <button className="close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input className="input" type="month" value={newBudget.month}
                    onChange={e => setNewBudget(b => ({ ...b, month: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Primary Income Source</label>
                  <input className="input" type="text" placeholder="e.g. Salary, Freelance"
                    value={newBudget.initialSource}
                    onChange={e => setNewBudget(b => ({ ...b, initialSource: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Income Amount</label>
                  <input className="input" type="number" step="0.01" min="1" placeholder="5000.00"
                    value={newBudget.initialIncome}
                    onChange={e => setNewBudget(b => ({ ...b, initialIncome: e.target.value }))} required />
                  <span className="form-hint">Budget allocations will be calculated using 50/30/20 rule or custom percentages.</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? <span className="spinner spinner-sm" /> : 'Create Budget →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {incomeModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIncomeModal(false)}>
          <div className="modal animate-slide-up">
            <div className="modal-header">
              <h2 className="modal-title">Add Income Source</h2>
              <button className="close-btn" onClick={() => setIncomeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddIncome}>
              <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label">Source Name</label>
                  <input className="input" type="text" placeholder="Side hustle, Rental income..."
                    value={incomeForm.sourceName}
                    onChange={e => setIncomeForm(f => ({ ...f, sourceName: e.target.value }))} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00"
                    value={incomeForm.amount}
                    onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIncomeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Income</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
