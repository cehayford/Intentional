import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * ParticleFlow — animated particles flowing from income (top)
 * down into 3 category buckets at the bottom.
 * Rate is proportional to the 50/30/20 allocation.
 * Max 500 particles (200 on mobile).
 */
export default function ParticleFlow({ summary }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ─── Category bucket positions ───────────────────────────
    const BUCKETS = [
      { key:'needs',   x:-1.6, color: new THREE.Color(0x4ade80), ratio: summary ? summary.needsPercentage   / 100 : 0.5 },
      { key:'wants',   x:  0,  color: new THREE.Color(0x60a5fa), ratio: summary ? summary.wantsPercentage   / 100 : 0.3 },
      { key:'savings', x: 1.6, color: new THREE.Color(0xfacc15), ratio: summary ? summary.savingsPercentage / 100 : 0.2 },
    ]

    const SOURCE_Y =  2.2   // income source position (top)
    const BUCKET_Y = -1.8   // bucket position (bottom)

    // Draw bucket labels via sprites
    BUCKETS.forEach(b => {
      const geo = new THREE.SphereGeometry(0.15, 16, 16)
      const mat = new THREE.MeshStandardMaterial({ color: b.color, emissive: b.color, emissiveIntensity: 0.4 })
      const sphere = new THREE.Mesh(geo, mat)
      sphere.position.set(b.x, BUCKET_Y, 0)
      scene.add(sphere)
    })

    // Source node
    const srcGeo = new THREE.SphereGeometry(0.18, 16, 16)
    const srcMat = new THREE.MeshStandardMaterial({ color: 0xfff313, emissive: 0xfff313, emissiveIntensity: 0.5 })
    const srcMesh = new THREE.Mesh(srcGeo, srcMat)
    srcMesh.position.set(0, SOURCE_Y, 0)
    scene.add(srcMesh)

    // ─── Particle System ─────────────────────────────────────
    const isMobile  = window.innerWidth <= 767
    const MAX_COUNT = isMobile ? 200 : 500

    const positions = new Float32Array(MAX_COUNT * 3)
    const colors    = new Float32Array(MAX_COUNT * 3)
    const sizes     = new Float32Array(MAX_COUNT)

    // Metadata per particle (not in geometry)
    const particles = Array.from({ length: MAX_COUNT }, () => ({
      active:  false,
      x:       0, y: SOURCE_Y, z: 0,
      targetX: 0,
      t:       0,        // 0..1 journey progress
      speed:   0,
      bucket:  null,
    }))

    const geoP = new THREE.BufferGeometry()
    geoP.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geoP.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
    geoP.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

    const matP = new THREE.PointsMaterial({
      size:           0.06,
      vertexColors:   true,
      transparent:    true,
      opacity:        0.9,
      blending:       THREE.AdditiveBlending,
      depthWrite:     false,
    })

    const points = new THREE.Points(geoP, matP)
    scene.add(points)

    // Ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    // ─── Spawn particle ──────────────────────────────────────
    let spawnTimer = 0
    const spawnParticle = () => {
      // Pick bucket weighted by ratio
      const rand = Math.random()
      let cum = 0, bucket = BUCKETS[BUCKETS.length - 1]
      for (const b of BUCKETS) { cum += b.ratio; if (rand < cum) { bucket = b; break } }

      const p = particles.find(p => !p.active)
      if (!p) return
      p.active  = true
      p.x       = (Math.random() - 0.5) * 0.3
      p.y       = SOURCE_Y
      p.z       = (Math.random() - 0.5) * 0.3
      p.targetX = bucket.x + (Math.random() - 0.5) * 0.4
      p.t       = 0
      p.speed   = 0.006 + Math.random() * 0.008
      p.color   = bucket.color
    }

    // ─── Animation Loop ──────────────────────────────────────
    let animId, paused = false

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (paused) { renderer.render(scene, camera); return }

      // Spawn new particles
      spawnTimer++
      if (spawnTimer % 3 === 0) spawnParticle()

      // Update each particle
      particles.forEach((p, i) => {
        if (!p.active) {
          positions[i*3]   = 0
          positions[i*3+1] = -100 // hide
          positions[i*3+2] = 0
          return
        }

        p.t += p.speed
        // Bezier-like arc: x lerps to target, y follows parabola
        const t  = p.t
        const cx = p.x + (p.targetX - p.x) * t
        const cy = SOURCE_Y + (BUCKET_Y - SOURCE_Y) * t - Math.sin(t * Math.PI) * 0.5

        positions[i*3]   = cx
        positions[i*3+1] = cy
        positions[i*3+2] = p.z

        colors[i*3]   = p.color.r
        colors[i*3+1] = p.color.g
        colors[i*3+2] = p.color.b

        sizes[i] = 0.04 + Math.sin(t * Math.PI) * 0.03

        if (p.t >= 1) p.active = false
      })

      geoP.attributes.position.needsUpdate = true
      geoP.attributes.color.needsUpdate    = true
      geoP.attributes.size.needsUpdate     = true

      renderer.render(scene, camera)
    }
    animate()

    // Pause/play on visibility
    const onVisibility = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVisibility)

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [summary])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={mountRef} style={{ width:'100%', height:'100%' }} />
      <div className="viz-label">
        <div className="viz-legend-item">
          <div className="viz-legend-dot" style={{ background:'#fff313' }} />Income
        </div>
        <div style={{ color:'var(--color-mid-grey)', fontSize:'var(--text-xs)' }}>→</div>
        {[['#4ade80','Needs'],['#60a5fa','Wants'],['#facc15','Savings']].map(([c,l]) => (
          <div key={l} className="viz-legend-item">
            <div className="viz-legend-dot" style={{ background:c }} />{l}
          </div>
        ))}
      </div>
    </div>
  )
}
