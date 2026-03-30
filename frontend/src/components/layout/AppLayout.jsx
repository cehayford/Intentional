import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const ICONS = {
  dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  budgets:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  expenses:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  analytics: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
  education: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard',  icon: ICONS.dashboard },
  { path: '/budgets',   label: 'Budgets',    icon: ICONS.budgets },
  { path: '/expenses',  label: 'Expenses',   icon: ICONS.expenses },
  { path: '/analytics', label: 'Analytics',  icon: ICONS.analytics },
  { path: '/education', label: 'Education',  icon: ICONS.education },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [showCreators, setShowCreators] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-expanded' : ''}`}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:99 }}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">$</div>
          <div>
            <div className="sidebar-logo-text">Intentional</div>
            <div className="sidebar-logo-sub">Spending Tracker</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {NAV_ITEMS.map(item => (
            <a
              key={item.path}
              className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
            >
              <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
              <span className="sidebar-link-text">{item.label}</span>
            </a>
          ))}
          <div className="sidebar-section-label">Curated Content</div>
          <button 
            className="sidebar-link w-full" 
            onClick={() => { setShowCreators(true); setSidebarOpen(false) }}
            style={{ textAlign: 'left' }}
          >
            <span className="sidebar-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </span>
            <span className="sidebar-link-text">Creators We Love</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize:'var(--text-xs)', color:'var(--color-mid-grey)', marginBottom:'var(--space-3)' }}>
            Logged in as<br />
            <span style={{ color:'var(--color-off-white)', fontWeight:600 }}>
              {user?.firstName || user?.email}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm w-full" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="app-main">
        {/* Sticky Navbar */}
        <header className="navbar">
          <div className="navbar-brand">
            {/* Hamburger (mobile) */}
            <button
              className="btn-icon"
              onClick={() => setSidebarOpen(o => !o)}
              style={{ color:'var(--color-off-white)', display:'flex' }}
              title="Toggle Sidebar"
            >
              ☰
            </button>
            <div className="navbar-logo">$</div>
            <span className="navbar-title">
              {NAV_ITEMS.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>
          <div className="navbar-actions">
            <button
              className="btn-icon"
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              style={{ fontSize:'1.2rem', color:'var(--color-off-white)', marginRight:'var(--space-2)' }}
              title="Toggle Light Mode"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span style={{ fontSize:'var(--text-sm)', color:'var(--color-mid-grey)' }} className="hidden-mobile">
              {new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' })}
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/expenses')}>
              + Add Expense
            </button>
          </div>
        </header>

        <style>{`
          @media (max-width: 767px) {
            .hidden-mobile { display: none !important; }
          }
        `}</style>
        <div className="app-content">
          <Outlet />
        </div>

        <footer style={{ 
          textAlign: 'center', 
          padding: 'var(--space-12) var(--space-8) var(--space-8)', 
          fontSize: 'var(--text-xs)', 
          color: 'var(--color-mid-grey)',
          borderTop: '1px solid var(--color-glass-border)',
          marginTop: 'auto'
        }}>
          made with love by <a href="https://x.com/ce_hayford_" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-yellow)', transition: 'color 0.2s' }}>Raphael</a>
        </footer>
      </main>

      {/* ─── Creators Modal ─── */}
      {showCreators && (
        <div className="modal-overlay" onClick={() => setShowCreators(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Top Content Creators</h2>
                <p className="card-subtitle">Level up with these world-class educators</p>
              </div>
              <button className="close-btn" onClick={() => setShowCreators(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              {[
                { 
                  name: 'Dr. Shadé Zahrai', 
                  desc: 'Behavioral science expert specializing in leadership, success mindset, and psychology.', 
                  url: 'https://www.youtube.com/@Dr.ShadeZahrai',
                  initials: 'SZ'
                },
                { 
                  name: 'Justin Sung', 
                  desc: 'Learning and learning efficiency doctor. Master the ultimate learning skills.', 
                  url: 'https://www.youtube.com/@JustinSung',
                  initials: 'JS'
                },
                { 
                  name: 'Nischa', 
                  desc: 'Accountant and money expert. Master intentional spending and wealth creation.', 
                  url: 'https://www.youtube.com/@nischa',
                  initials: 'NI'
                }
              ].map((creator) => (
                <a 
                  key={creator.name} 
                  href={creator.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="card card-p flex items-center gap-4 hover-highlight"
                  style={{ textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  <div style={{ 
                    width: '50px', height: '50px', borderRadius: '12px', 
                    background: 'var(--color-yellow)', color: 'black',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {creator.initials}
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--color-off-white)', marginBottom: '4px' }}>{creator.name}</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-mid-grey)', lineHeight: '1.4' }}>{creator.desc}</p>
                    <span style={{ fontSize: '10px', color: 'var(--color-yellow)', marginTop: '4px', display: 'block' }}>Watch on YouTube ↗</span>
                  </div>
                </a>
              ))}
              
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreators(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-highlight:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(4px);
          border-color: var(--color-yellow);
        }
      `}</style>

      {/* Mobile: default to hidden already handled in CSS */}
    </div>
  )
}
