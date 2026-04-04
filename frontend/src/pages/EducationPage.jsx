import React, { useState } from 'react'

const VIDEOS = [
  { id: '1', videoId: 'H3UzN1B2xJk', title: 'How I Manage My Money | Budgeting Tips' },
  { id: '2', videoId: 'a9hDjrYpJ8U', title: 'Money Habits Keeping You Poor' },
  { id: '3', videoId: 'kZcVf-0B4pE', title: 'How to Change Your Finances in 6 Months' },
  { id: '4', videoId: '7X3Y4Z5W6VQ', title: 'Why Everything Changes After $20K' },
  { id: '5', videoId: '9L8M7N6O5P4', title: 'Pay Off Debt Early or Invest?' },
  { id: '6', videoId: '3R2T1Y0U9I8', title: '5 Money Rules to Building Wealth' },
  { id: '7', videoId: '8K7J6H5G4F3', title: 'Things to Do Now If You Want to Be Rich' },
  { id: '8', videoId: '2Q1W0E9R8T7', title: 'Subconscious Spending Habits' },
]

function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`
  const fallbackUrl = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageLoaded(false)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleVideoError = () => {
    setVideoError(true)
    setIsPlaying(false)
  }

  const handlePlayClick = () => {
    if (!isPlaying && !videoError) {
      setIsPlaying(true)
      setVideoError(false)
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
        onClick={handlePlayClick}
      >
        {!isPlaying ? (
          <>
            {!imageError && (
              <img 
                src={thumbUrl} 
                alt={video.title}
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  objectFit: 'cover', opacity: imageLoaded ? 0.8 : 0, transition: 'all 0.3s ease'
                }}
                className="video-thumb"
              />
            )}
            
            {imageError && (
              <div 
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, var(--color-black-800), var(--color-black-600))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-mid-grey)', fontSize: 'var(--text-sm)', textAlign: 'center',
                  padding: 'var(--space-4)'
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>📹</div>
                  <div>Video Thumbnail</div>
                  <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>Click to play</div>
                </div>
              </div>
            )}
            
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
          <>
            {videoError && (
              <div 
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, var(--color-black-800), var(--color-black-600))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-mid-grey)', fontSize: 'var(--text-sm)', textAlign: 'center',
                  padding: 'var(--space-4)', zIndex: 3
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>⚠️</div>
                  <div>Video Unavailable</div>
                  <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>Click to retry</div>
                </div>
              </div>
            )}
            
            <iframe
              title={video.title}
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
              onError={handleVideoError}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0,
                display: videoError ? 'none' : 'block'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </>
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
