import { useState, useEffect } from 'react'
import { expensesAPI, budgetsAPI } from '../api/client'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/layout/LoadingSpinner'

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n ?? 0)

const CATEGORIES = ['NEED', 'WANT', 'SAVINGS']

function ExpenseModal({ expense, budgetId, onSave, onClose }) {
  const { showToast } = useToast()
  const [form, setForm] = useState({
    budgetId: budgetId || '',
    category:    expense?.category    || 'NEED',
    amount:      expense?.amount      || '',
    description: expense?.description || '',
    expenseDate: expense?.expenseDate || new Date().toISOString().slice(0,10),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (expense?.id) {
        await expensesAPI.update(expense.id, form)
        showToast('Expense updated', 'success')
      } else {
        await expensesAPI.create(form)
        showToast('Expense logged!', 'success')
      }
      onSave()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save expense', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-slide-up">
        <div className="modal-header">
          <h2 className="modal-title">{expense?.id ? 'Edit Expense' : 'Log Expense'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
            {/* Category Selector */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div style={{ display:'flex', gap:'var(--space-2)' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${form.category === cat ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex:1, justifyContent:'center',
                      ...(form.category === cat && cat === 'NEED'    && { background:'var(--color-needs)',   border:'none', color:'#000' }),
                      ...(form.category === cat && cat === 'WANT'    && { background:'var(--color-wants)',   border:'none', color:'#000' }),
                      ...(form.category === cat && cat === 'SAVINGS' && { background:'var(--color-savings)', border:'none', color:'#000' }),
                    }}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                  >
                    {cat === 'NEED' ? '🏠 Need' : cat === 'WANT' ? '🎉 Want' : '💰 Savings'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                id="expense-amount"
                className="input"
                type="number" step="0.01" min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                id="expense-desc"
                className="input"
                type="text"
                placeholder="Grocery shopping, Netflix, etc."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                id="expense-date"
                className="input"
                type="date"
                value={form.expenseDate}
                onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="expense-save" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : expense?.id ? 'Update' : 'Log Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const { showToast } = useToast()
  const [expenses,  setExpenses]  = useState([])
  const [budgets,   setBudgets]   = useState([])
  const [budgetId,  setBudgetId]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)   // null | 'new' | expense-obj
  const [filter,    setFilter]    = useState({ category: '', search: '' })
  const [page,      setPage]      = useState(1)
  const PER_PAGE = 20

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (budgetId) loadExpenses() }, [budgetId, filter])

  const loadData = async () => {
    try {
      const { data } = await budgetsAPI.list()
      setBudgets(data)
      const current = data.find(b => b.isActive) || data[0]
      if (current) setBudgetId(current.id)
    } catch { showToast('Failed to load budgets', 'error') }
    finally { setLoading(false) }
  }

  const loadExpenses = async () => {
    try {
      const { data } = await expensesAPI.list({
        budgetId,
        category: filter.category || undefined,
        search:   filter.search   || undefined,
      })
      setExpenses(data.items || data)
    } catch {}
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    try {
      await expensesAPI.delete(id)
      showToast('Expense deleted', 'success')
      loadExpenses()
    } catch { showToast('Failed to delete', 'error') }
  }

  const catColor  = { NEED: 'var(--color-needs)', WANT: 'var(--color-wants)', SAVINGS: 'var(--color-savings)' }
  const catBadge  = { NEED: 'badge-need', WANT: 'badge-want', SAVINGS: 'badge-savings' }

  const paginated = expenses.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(expenses.length / PER_PAGE)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{expenses.length} entries this month</p>
        </div>
        <button id="add-expense-btn" className="btn btn-primary" onClick={() => setModal('new')}>
          + Log Expense
        </button>
      </div>

      {/* Filters */}
      <div className="card card-p mb-6" style={{ display:'flex', gap:'var(--space-4)', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:'1 1 200px' }}>
          <input
            className="input"
            placeholder="🔍 Search expenses..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
        </div>

        <div style={{ display:'flex', gap:'var(--space-2)' }}>
          {['', 'NEED', 'WANT', 'SAVINGS'].map(cat => (
            <button
              key={cat || 'all'}
              className={`btn btn-sm ${filter.category === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f => ({ ...f, category: cat }))}
            >
              {cat || 'All'}
            </button>
          ))}
        </div>

        {budgets.length > 1 && (
          <select
            className="select"
            style={{ width:'auto' }}
            value={budgetId || ''}
            onChange={e => setBudgetId(e.target.value)}
          >
            {budgets.map(b => (
              <option key={b.id} value={b.id}>
                {new Date(b.month).toLocaleString('default', { month:'long', year:'numeric' })}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center" style={{ minHeight:'300px' }}>
          <LoadingSpinner />
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💸</div>
          <div className="empty-state-title">No expenses yet</div>
          <p className="empty-state-text">Start logging your daily spending to track your 50/30/20 progress.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setModal('new')}>Log First Expense →</button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(exp => (
                  <tr key={exp.id}>
                    <td className="text-sm text-grey">
                      {new Date(exp.expenseDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                    </td>
                    <td>{exp.description || <span className="text-grey">No description</span>}</td>
                    <td><span className={`badge ${catBadge[exp.category]}`}>{exp.category}</span></td>
                    <td className="text-right font-semi" style={{ color: catColor[exp.category] }}>
                      {fmt(exp.amount)}
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-sm btn-secondary" onClick={() => setModal(exp)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              <span className="text-sm text-grey">Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modal && (
        <ExpenseModal
          expense={modal === 'new' ? null : modal}
          budgetId={budgetId}
          onSave={() => { setModal(null); loadExpenses() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
