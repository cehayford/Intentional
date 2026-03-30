import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), duration)
  }, [])

  const icons = { success: '✓', error: '✕', info: '◆' }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast ${toast.type} animate-slide-up`}>
          <span style={{fontSize:'1rem'}}>{icons[toast.type]}</span>
          <span>{toast.message}</span>
          <button className="btn-icon" onClick={() => setToast(null)} style={{marginLeft:'auto', color:'var(--color-mid-grey)'}}>✕</button>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
