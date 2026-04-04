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
    <div className="auth-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 4vw, 2rem)',
      position: 'relative'
    }}>
      <div className="auth-card animate-slide-up" style={{
        width: '100%',
        maxWidth: 'clamp(320px, 90vw, 440px)',
        padding: 'clamp(1.5rem, 5vw, 2.5rem)',
        borderRadius: 'clamp(12px, 2vw, 20px)',
        background: 'var(--color-black-900)',
        border: '1px solid var(--color-black-600)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
      }}>
        <div className="auth-logo" style={{
          textAlign: 'center',
          marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
        }}>
          <div className="auth-logo-mark" style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }}>$</div>
          <div className="auth-logo-text" style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: '600',
            letterSpacing: '0.05em'
          }}>Intentional</div>
        </div>

        <h1 className="auth-heading" style={{
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
          textAlign: 'center'
        }}>Welcome back</h1>
        <p className="auth-sub" style={{
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
          color: 'var(--color-mid-grey)',
          textAlign: 'center',
          marginBottom: 'clamp(2rem, 6vw, 2.5rem)'
        }}>Sign in to your spending tracker</p>

        <form className="auth-form" onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(1rem, 3vw, 1.5rem)'
        }}>
          <div className="form-group">
            <label className="form-label" style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              display: 'block'
            }}>Email</label>
            <input
              id="login-email"
              className={`input ${error ? 'error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
              style={{
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                borderRadius: 'clamp(6px, 1vw, 8px)'
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              display: 'block'
            }}>Password</label>
            <input
              id="login-password"
              className={`input ${error ? 'error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              style={{
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                borderRadius: 'clamp(6px, 1vw, 8px)'
              }}
            />
          </div>

          {error && <p className="form-error" style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            textAlign: 'center',
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            borderRadius: 'clamp(4px, 1vw, 6px)',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#f87171'
          }}>{error}</p>}

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{
              padding: 'clamp(0.875rem, 2.5vw, 1.25rem)',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              borderRadius: 'clamp(6px, 1vw, 8px)',
              fontWeight: '600',
              minHeight: 'clamp(44px, 8vh, 52px)'
            }}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'Sign In'}
          </button>
        </form>

        <p className="auth-link-row" style={{
          textAlign: 'center',
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          color: 'var(--color-mid-grey)',
          marginTop: 'clamp(1.5rem, 4vw, 2rem)'
        }}>
          No account?{' '}
          <span 
            className="auth-link" 
            onClick={() => navigate('/register')}
            style={{
              color: 'var(--color-yellow)',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
          >Create one →</span>
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
