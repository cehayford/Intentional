export default function LoadingSpinner({ size = 'md', text = '' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--space-4)' }}>
      <div className={`spinner ${size === 'sm' ? 'spinner-sm' : ''}`} />
      {text && <p style={{ fontSize:'var(--text-sm)', color:'var(--color-mid-grey)' }}>{text}</p>}
    </div>
  )
}
