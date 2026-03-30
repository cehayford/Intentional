import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * MonthlyBars — 3D stacked bar chart (12 months × 3 categories).
 * Camera drag/rotate. Click bar → month detail callback.
 */
export default function MonthlyBars({ history = [], onMonthClick }) {
  const mountRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return
    const el = mountRef.current

    const scene    = new THREE.Scene()
    scene.fog      = new THREE.Fog(0x000000, 10, 30)
    const camera   = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100)
    camera.position.set(0, 4, 10)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 5)
    dirLight.castShadow = true
    scene.add(dirLight)
    const pl = new THREE.PointLight(0xfff313, 0.8, 20)
    pl.position.set(0, 5, 0)
    scene.add(pl)

    // ─── Generate sample data if backend hasn't loaded yet ───
    const months = history.length > 0 ? history : Array.from({ length: 12 }, (_, i) => ({
      label:        new Date(2026, i - 11, 1).toLocaleString('default', { month: 'short' }),
      needsSpent:   800  + Math.random() * 400,
      wantsSpent:   400  + Math.random() * 300,
      savingsSpent: 200  + Math.random() * 200,
    }))

    const maxTotal = Math.max(...months.map(m => m.needsSpent + m.wantsSpent + m.savingsSpent))
    const SCALE    = 4 / maxTotal
    const BAR_W    = 0.5
    const BAR_GAP  = 0.8
    const START_X  = -(months.length * BAR_GAP) / 2

    // Grid floor
    const gridHelper = new THREE.GridHelper(20, 20, 0x232323, 0x1a1a1a)
    scene.add(gridHelper)

    const COLORS = { needs: 0x4ade80, wants: 0x60a5fa, savings: 0xfacc15 }
    const bars   = []

    months.forEach((m, i) => {
      const x = START_X + i * BAR_GAP
      let   y = 0

      const segments = [
        { val: m.needsSpent,   color: COLORS.needs,   key: 'needs' },
        { val: m.wantsSpent,   color: COLORS.wants,   key: 'wants' },
        { val: m.savingsSpent, color: COLORS.savings,  key: 'savings' },
      ]

      segments.forEach(seg => {
        const h = seg.val * SCALE
        if (h < 0.01) return
        const geo  = new THREE.BoxGeometry(BAR_W, h, BAR_W)
        const mat  = new THREE.MeshStandardMaterial({
          color: seg.color, roughness: 0.4, metalness: 0.5, transparent: true, opacity: 0.9,
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x, y + h / 2, 0)
        mesh.castShadow = mesh.receiveShadow = true
        mesh.userData = { month: m, key: seg.key, originalColor: seg.color }
        scene.add(mesh)
        bars.push(mesh)
        y += h
      })
    })

    // ─── Camera drag (orbit-lite) ─────────────────────────────
    let isDragging = false, prevX = 0, prevY = 0
    let theta = 0, phi = Math.PI / 5, radius = 10

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY }
    const onMouseUp   = ()  => { isDragging = false }
    const onMouseMove = (e) => {
      if (!isDragging) return
      theta -= (e.clientX - prevX) * 0.005
      phi    = Math.max(0.1, Math.min(Math.PI / 2.2, phi - (e.clientY - prevY) * 0.005))
      prevX  = e.clientX; prevY = e.clientY
    }

    const raycaster = new THREE.Raycaster()
    const mouse     = new THREE.Vector2()
    const onClick   = (e) => {
      const rect = el.getBoundingClientRect()
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(bars)
      if (hits.length > 0 && onMonthClick) onMonthClick(hits[0].object.userData.month)
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseup',   onMouseUp)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('click',     onClick)

    let animId
    const animate = () => {
      animId = requestAnimationFrame(animate)
      // Auto-rotate when not dragging
      if (!isDragging) theta += 0.003

      camera.position.x = radius * Math.sin(theta) * Math.sin(phi)
      camera.position.y = radius * Math.cos(phi)
      camera.position.z = radius * Math.cos(theta) * Math.sin(phi)
      camera.lookAt(0, 1, 0)

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
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseup',   onMouseUp)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('click',     onClick)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [history])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <div ref={mountRef} style={{ width:'100%', height:'100%' }} />
      <div className="viz-label">
        {[['#4ade80','Needs'],['#60a5fa','Wants'],['#facc15','Savings']].map(([c,l]) => (
          <div key={l} className="viz-legend-item">
            <div className="viz-legend-dot" style={{ background:c }} />{l}
          </div>
        ))}
        <span style={{ fontSize:'var(--text-xs)', color:'var(--color-mid-grey)' }}>Drag to rotate</span>
      </div>
    </div>
  )
}
