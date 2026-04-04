import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toastRefs = useRef({})

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    // Trigger show animation
    setTimeout(() => {
      const toastElement = toastRefs.current[id]
      if (toastElement) {
        toastElement.classList.add('show')
      }
    }, 50)
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    const toastElement = toastRefs.current[id]
    if (toastElement) {
      toastElement.classList.add('hide')
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id))
        delete toastRefs.current[id]
      }, 300)
    } else {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }
  }, [])

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  }

  const getToastStyles = (type) => {
    const baseStyles = {
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderColor: '#10b981',
        iconColor: '#ffffff'
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderColor: '#ef4444',
        iconColor: '#ffffff'
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderColor: '#3b82f6',
        iconColor: '#ffffff'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderColor: '#f59e0b',
        iconColor: '#ffffff'
      }
    }
    return baseStyles[type] || baseStyles.info
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type)
          return (
            <div
              key={toast.id}
              ref={(el) => toastRefs.current[toast.id] = el}
              className={`toast toast-${toast.type}`}
              style={{
                background: styles.background,
                borderColor: styles.borderColor,
              }}
            >
              <div className="toast-icon" style={{ color: styles.iconColor }}>
                {icons[toast.type]}
              </div>
              <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
              </div>
              <button 
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
              {toast.duration > 0 && (
                <div 
                  className="toast-progress"
                  style={{
                    animationDuration: `${toast.duration}ms`
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
