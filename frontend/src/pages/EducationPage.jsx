import React, { useState } from 'react'

const VIDEOS = [
  { id: '1', videoId: 'NEzqHbtGa9U', title: 'How To Manage Your Money Like The 1%' },
  { id: '2', videoId: 'Q0uXGQu55GM', title: 'Money Habits Keeping You Poor' },
  { id: '3', videoId: '7XVmhedNiIQ', title: 'How to Change Your Finances in 6 Months' },
  { id: '4', videoId: 'fxh6BI7JjjE', title: 'Why Everything Changes After $20K' },
  { id: '5', videoId: '61hBIjorM5k', title: 'Pay Off Debt Early or Invest?' },
  { id: '6', videoId: 'FpcZdYU4MIg', title: 'Money Truths School Didn\'t Teach You' },
  { id: '7', videoId: 'uXTREehuNFU', title: '8 TINY Habits to Become Financially Literate' },
  { id: '8', videoId: 'vJabNEwZIuc', title: 'Master Financial Literacy in 54 Minutes' },
  { id: '9', videoId: 'i6ABsEk1w6s', title: 'If I Wanted to Become a Millionaire In 2026' },
]

function VideoCard({ video }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const thumbUrl = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`

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
    <div className="card h-full flex flex-col animate-slide-up" style={{ 
        overflow: 'hidden',
        minHeight: 'clamp(280px, 40vh, 400px)'
      }}>
      <div className="card-header" style={{ 
        padding: 'clamp(0.75rem, 2vw, 1rem)' 
      }}>
        <div className="card-title" style={{ 
          fontSize: 'clamp(0.875rem, 2vw, 0.875rem)', 
          lineHeight: '1.4' 
        }}>{video.title}</div>
      </div>
      
      <div 
        className="video-container" 
        style={{ 
          position: 'relative', 
          width: '100%', 
          paddingTop: '56.25%', 
          background: 'var(--color-black-800)',
          cursor: isPlaying ? 'default' : 'pointer',
          flex: 1
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
              width: 'clamp(48px, 8vw, 60px)', 
              height: 'clamp(48px, 8vw, 60px)', 
              background: 'var(--color-yellow)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 243, 19, 0.4)', zIndex: 2,
              transition: 'transform 0.2s ease'
            }}>
              <div style={{
                width: 0, height: 0, borderTop: 'clamp(8px, 1.5vw, 10px) solid transparent',
                borderBottom: 'clamp(8px, 1.5vw, 10px) solid transparent', borderLeft: 'clamp(14px, 2.5vw, 18px) solid black',
                marginLeft: 'clamp(2px, 0.5vw, 4px)'
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 'clamp(8px, 2vw, 12px)', right: 'clamp(8px, 2vw, 12px)',
              background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px',
              fontSize: 'clamp(8px, 2vw, 10px)', fontWeight: 'bold', zIndex: 2
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', 
        gap: 'clamp(1rem, 3vw, 1.5rem)',
        padding: 'clamp(1rem, 4vw, 2rem)'
      }}>
        {VIDEOS.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}
