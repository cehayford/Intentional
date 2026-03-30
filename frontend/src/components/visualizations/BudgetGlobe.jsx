import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * BudgetGlobe — Three.js sphere segmented into 3 arcs
 * Needs (green 50%) | Wants (blue 30%) | Savings (gold 20%)
 * Hover to highlight; click to drill into category.
 */
export default function BudgetGlobe({ summary, onCategoryClick }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    // ─── Scene Setup ────────────────────────────────────────
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 0, 3.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ─── Lighting ────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 5, 5)
    scene.add(dirLight)

    // Neon yellow rim light
    const rimLight = new THREE.PointLight(0xfff313, 1.5, 10)
    rimLight.position.set(-3, 2, -2)
    scene.add(rimLight)

    // ─── Build Segments ──────────────────────────────────────
    const pct = {
      needs:   summary ? summary.needsPercentage   / 100 : 0.50,
      wants:   summary ? summary.wantsPercentage   / 100 : 0.30,
      savings: summary ? summary.savingsPercentage / 100 : 0.20,
    }

    const SEGMENTS = [
      { key: 'needs',   color: 0x4ade80, pct: pct.needs,   label: 'Needs'   },
      { key: 'wants',   color: 0x60a5fa, pct: pct.wants,   label: 'Wants'   },
      { key: 'savings', color: 0xfacc15, pct: pct.savings,  label: 'Savings' },
    ]

    const group    = new THREE.Group()
    const meshes   = []
    let   startAng = 0

    SEGMENTS.forEach(seg => {
      const endAng = startAng + seg.pct * Math.PI * 2

      // Build sphere geometry masked to arc via UV/clip trick:
      // We use SphereGeometry with phiStart/phiLength for longitude bands
      const geo = new THREE.SphereGeometry(1, 64, 32, startAng, seg.pct * Math.PI * 2)

      const mat = new THREE.MeshStandardMaterial({
        color:       seg.color,
        roughness:   0.3,
        metalness:   0.6,
        transparent: true,
        opacity:     0.92,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.userData = { key: seg.key, originalColor: seg.color, originalOpacity: 0.92 }
      group.add(mesh)
      meshes.push(mesh)

      startAng = endAng
    })

    // Wireframe overlay
    const wireMat  = new THREE.MeshBasicMaterial({ color: 0xfff313, wireframe: true, transparent: true, opacity: 0.06 })
    const wireGeo  = new THREE.SphereGeometry(1.001, 24, 16)
    group.add(new THREE.Mesh(wireGeo, wireMat))

    scene.add(group)

    // ─── Raycasting for Hover/Click ──────────────────────────
    const raycaster  = new THREE.Raycaster()
    const mouse      = new THREE.Vector2()
    let   hoveredMesh = null

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshes)
      if (hoveredMesh) {
        hoveredMesh.material.emissive.setHex(0)
        hoveredMesh.material.opacity = hoveredMesh.userData.originalOpacity
      }
      if (hits.length > 0) {
        hoveredMesh = hits[0].object
        hoveredMesh.material.emissive.setHex(0xffffff)
        hoveredMesh.material.emissiveIntensity = 0.15
        hoveredMesh.material.opacity = 1
        el.style.cursor = 'pointer'
      } else {
        hoveredMesh = null
        el.style.cursor = 'default'
      }
    }

    const onClick = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(meshes)
      if (hits.length > 0 && onCategoryClick) {
        onCategoryClick(hits[0].object.userData.key)
      }
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('click',     onClick)

    // ─── Animation Loop ──────────────────────────────────────
    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      group.rotation.y += 0.003
      group.rotation.x  = Math.sin(Date.now() * 0.0003) * 0.1
      renderer.render(scene, camera)
    }
    animate()

    // ─── Resize ──────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(el.clientWidth, el.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ─── Cleanup ─────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('click',     onClick)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [summary])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={mountRef} style={{ width:'100%', height:'100%' }} />
      <div className="viz-label">
        {[
          { label:'Needs',   color:'#4ade80' },
          { label:'Wants',   color:'#60a5fa' },
          { label:'Savings', color:'#facc15' },
        ].map(l => (
          <div key={l.label} className="viz-legend-item">
            <div className="viz-legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  )
}
