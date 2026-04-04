import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function LoginPage() {
  const { login }      = useAuth()
  const { showToast }  = useToast()
  const navigate       = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      showToast('Welcome back!', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
      showToast('Login failed', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-mark">$</div>
          <div className="auth-logo-text">Intentional</div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your spending tracker</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              className={`input ${error ? 'error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              className={`input ${error ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-link-row">
          No account?{' '}
          <span className="auth-link" onClick={() => navigate('/register')}>Create one →</span>
        </p>
      </div>

      {/* Background decoration */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'40vh',
        background:'linear-gradient(to top, rgba(255,243,19,0.03), transparent)',
        pointerEvents:'none',
      }} />
    </div>
  )
}
