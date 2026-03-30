import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * SurplusRing — Torus ring:
 *   - Green  (surplus)  when totalRemaining > 0
 *   - Red    (deficit)  when totalRemaining < 0
 *   - Size proportional to surplus/deficit amount
 *   - Animated rotation + pulse glow
 *   - Tooltip on hover
 */
export default function SurplusRing({ summary }) {
  const mountRef  = useRef(null)
  const tooltipRef= useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ─── Compute state ────────────────────────────────────────
    const surplus  = summary ? Number(summary.surplusDeficit) : 200
    const isPlus   = surplus >= 0
    const absAmt   = Math.abs(surplus)

    // Ring radius ∝ clamped surplus amount (0.8..1.5)
    const maxExpected = 2000
    const t           = Math.min(absAmt / maxExpected, 1)
    const ringRadius  = 0.8 + t * 0.7

    const color = isPlus ? 0x34d399 : 0xf87171   // green / red
    const emissive = isPlus ? 0x34d399 : 0xf87171

    // ─── Lighting ─────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pointLight = new THREE.PointLight(color, 3, 10)
    pointLight.position.set(0, 0, 2)
    scene.add(pointLight)
    const dl = new THREE.DirectionalLight(0xffffff, 0.8)
    dl.position.set(5, 5, 5)
    scene.add(dl)

    // ─── Torus ───────────────────────────────────────────────
    const torusGeo = new THREE.TorusGeometry(ringRadius, 0.18, 32, 100)
    const torusMat = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.7,
      transparent: true,
      opacity: 0.95,
    })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    scene.add(torus)

    // Inner ring (thin, outline feel)
    const innerGeo = new THREE.TorusGeometry(ringRadius, 0.03, 16, 100)
    const innerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 })
    scene.add(new THREE.Mesh(innerGeo, innerMat))

    // Particle halo
    const haloCount = 80
    const haloPositions = new Float32Array(haloCount * 3)
    for (let i = 0; i < haloCount; i++) {
      const angle = (i / haloCount) * Math.PI * 2
      const jitter = (Math.random() - 0.5) * 0.4
      haloPositions[i*3]   = Math.cos(angle) * (ringRadius + jitter)
      haloPositions[i*3+1] = Math.sin(angle) * (ringRadius + jitter) * 0.3
      haloPositions[i*3+2] = (Math.random() - 0.5) * 0.3
    }
    const haloGeo = new THREE.BufferGeometry()
    haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3))
    const haloMat = new THREE.PointsMaterial({ color, size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false })
    scene.add(new THREE.Points(haloGeo, haloMat))

    // ─── Raycasting for tooltip ──────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObject(torus)
      if (tooltipRef.current) {
        if (hits.length > 0) {
          tooltipRef.current.style.opacity = '1'
          tooltipRef.current.style.left = `${e.clientX - el.getBoundingClientRect().left + 12}px`
          tooltipRef.current.style.top  = `${e.clientY - el.getBoundingClientRect().top  - 36}px`
        } else {
          tooltipRef.current.style.opacity = '0'
        }
      }
    }
    el.addEventListener('mousemove', onMouseMove)

    // ─── Animation ───────────────────────────────────────────
    let animId, t2 = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      t2 += 0.01
      torus.rotation.x = t2 * 0.4
      torus.rotation.y = t2 * 0.7
      // Pulse glow
      torusMat.emissiveIntensity = 0.3 + Math.sin(t2 * 2) * 0.15
      pointLight.intensity       = 2.5 + Math.sin(t2 * 2) * 0.8
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mousemove', onMouseMove)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [summary])

  const surplus = summary ? Number(summary.surplusDeficit) : 200
  const isPlus  = surplus >= 0

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={mountRef} style={{ width:'100%', height:'100%' }} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position:'absolute', pointerEvents:'none',
          background:'rgba(0,0,0,0.85)', border:'1px solid rgba(255,255,255,0.12)',
          borderRadius:'8px', padding:'8px 12px', fontSize:'12px',
          transition:'opacity 0.15s', opacity:0,
          whiteSpace:'nowrap', zIndex:10,
        }}
      >
        <span style={{ color: isPlus ? '#34d399' : '#f87171', fontWeight:700 }}>
          {isPlus ? '▲ Surplus' : '▼ Deficit'}:&nbsp;
          ${Math.abs(surplus).toFixed(2)}
        </span>
      </div>

      <div className="viz-label">
        <div className="viz-legend-item">
          <div className="viz-legend-dot" style={{ background: isPlus ? '#34d399' : '#f87171' }} />
          {isPlus ? 'Surplus' : 'Deficit'}: ${Math.abs(surplus).toFixed(2)}
        </div>
      </div>
    </div>
  )
}
