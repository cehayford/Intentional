import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function RegisterPage() {
  const { register }   = useAuth()
  const { showToast }  = useToast()
  const navigate       = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name required'
    if (!form.email.includes('@')) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Minimum 8 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setLoading(true)
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password })
      showToast('Account created! Welcome 🎉', 'success')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message
      setErrors({ api: Array.isArray(msg) ? msg.join(', ') : msg || 'Registration failed' })
      showToast('Registration failed', 'error')
    } finally { setLoading(false) }
  }

  const field = (id, label, type, key, placeholder) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        id={id}
        className={`input ${errors[key] ? 'error' : ''}`}
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
      {errors[key] && <span className="form-error">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-mark">$</div>
          <div className="auth-logo-text">Intentional</div>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Start tracking your 50/30/20 budget today</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>
            {field('reg-first', 'First Name', 'text', 'firstName', 'Sarah')}
            {field('reg-last',  'Last Name',  'text', 'lastName',  'Smith')}
          </div>
          {field('reg-email',    'Email',            'email',    'email',    'you@example.com')}
          {field('reg-password', 'Password',         'password', 'password', '8+ characters')}
          {field('reg-confirm',  'Confirm Password', 'password', 'confirm',  'Repeat password')}

          {errors.api && <p className="form-error">{errors.api}</p>}

          {/* 50/30/20 explainer */}
          <div style={{
            background:'var(--color-yellow-glow)',
            border:'1px solid rgba(255,243,19,0.2)',
            borderRadius:'var(--border-radius)',
            padding:'var(--space-3) var(--space-4)',
            fontSize:'var(--text-xs)',
            color:'var(--color-mid-grey)',
          }}>
            <span style={{color:'var(--color-yellow)', fontWeight:600}}>50/30/20 Rule: </span>
            50% Needs · 30% Wants · 20% Savings
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? <span className="spinner spinner-sm" /> : 'Create Account →'}
          </button>
        </form>

        <p className="auth-link-row">
          Already have an account?{' '}
          <span className="auth-link" onClick={() => navigate('/login')}>Sign in</span>
        </p>
      </div>
    </div>
  )
}
