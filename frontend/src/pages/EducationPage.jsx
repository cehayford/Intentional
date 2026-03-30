import React, { useState } from 'react'

const VIDEOS = [
  { id: '1', videoId: 'ryvKTI2v_-0', title: 'ACCOUNTANT EXPLAINS: How I manage my money on payday' },
  { id: '2', videoId: 'Q0uXGQu55GM', title: 'ACCOUNTANT EXPLAINS: Money Habits keeping you poor' },
  { id: '3', videoId: 's5U4gJ6S9Cg', title: 'ACCOUNTANT EXPLAINS: How to change your finances in 6 months' },
  { id: '4', videoId: 'm4vP-d8_wBw', title: 'ACCOUNTANT EXPLAINS: Why everything changes after $20K' },
  { id: '5', videoId: 'R234w1sR8_A', title: 'Should You Pay Off Debt Early or Invest?' },
  { id: '6', videoId: 'i5VZcgBsFcs', title: 'ACCOUNTANT EXPLAINS: 5 Money Rules to building wealth' },
  { id: '7', videoId: 'sVKQn2I44eg', title: '7 Things To Do NOW If You Want To Be Rich' },
  { id: '8', videoId: 'Jj8wEunx-oE', title: 'ACCOUNTANT EXPLAINS: 9 Subconscious spending habits' },
]

function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
  const fallbackUrl = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
    }
  }

  return (
    <div className="card h-full flex flex-col animate-slide-up" style={{ overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: 'var(--space-4)' }}>
        <div className="card-title" style={{ fontSize: 'var(--text-sm)', lineHeight: '1.4' }}>{video.title}</div>
      </div>
      
      <div 
        className="video-container" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          paddingTop: '56.25%', 
          background: 'var(--color-black-800)',
          cursor: isPlaying ? 'default' : 'pointer'
        }}
        onClick={() => !isPlaying && setIsPlaying(true)}
      >
        {!isPlaying ? (
          <>
            <img 
              src={imageError ? fallbackUrl : thumbUrl} 
              alt={video.title}
              onError={handleImageError}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.8, transition: 'all 0.3s ease'
              }}
              className="video-thumb"
            />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '60px', height: '60px', background: 'var(--color-yellow)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 243, 19, 0.4)', zIndex: 2
            }}>
              <div style={{
                width: 0, height: 0, borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent', borderLeft: '18px solid black',
                marginLeft: '4px'
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 'var(--space-3)', right: 'var(--space-3)',
              background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px',
              fontSize: '10px', fontWeight: 'bold', zIndex: 2
            }}>
              WATCH NOW
            </div>
          </>
        ) : (
          <iframe
            title={video.title}
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}

export default function EducationPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Education</h1>
          <p className="page-subtitle">Learn more about intentional spending with <a href="https://www.youtube.com/@nischa" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-yellow)', textDecoration: 'underline' }}>Nischa</a></p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 'var(--space-6)' 
      }}>
        {VIDEOS.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
