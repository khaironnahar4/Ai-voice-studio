import { useEffect,  useRef } from "react"
import * as THREE from "three"

// ── Shared palette ──────────────────────────────────────────────────────
const V = "rgb(120,62,246)"
const VL = "rgb(167,139,250)"
const C  = "rgb(34,211,238)"
const BG = "#0F0F1A"
const S2 = "#141424"
const BR = "rgba(40,40,70,1)"
 
// ── Three.js particle sphere ────────────────────────────────────────────
export default function ParticleSphere() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(0)
 
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
 
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
 
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100)
    camera.position.z = 3.2
 
    // Particles
    const COUNT = 2200
    const geo   = new THREE.BufferGeometry()
    const pos   = new Float32Array(COUNT * 3)
    const col   = new Float32Array(COUNT * 3)
    const orig  = new Float32Array(COUNT * 3)
 
    for (let i = 0; i < COUNT; i++) {
      const phi   = Math.acos(1 - 2 * (i + 0.5) / COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const r     = 1.55
      const x = Math.sin(phi) * Math.cos(theta) * r
      const y = Math.sin(phi) * Math.sin(theta) * r
      const z = Math.cos(phi) * r
      pos[i*3]=orig[i*3]=x; pos[i*3+1]=orig[i*3+1]=y; pos[i*3+2]=orig[i*3+2]=z
      const t = (y / r + 1) / 2
      col[i*3]   = 0.47 - t * 0.34
      col[i*3+1] = 0.24 + t * 0.59
      col[i*3+2] = 0.96 - t * 0.02
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    geo.setAttribute("color",    new THREE.BufferAttribute(col, 3))
 
    const mat = new THREE.PointsMaterial({ size:0.028, vertexColors:true, transparent:true, opacity:0.9, sizeAttenuation:true })
    const particles = new THREE.Points(geo, mat)
    scene.add(particles)
 
    const glowMat = new THREE.MeshBasicMaterial({ color:0x7C3EF6, transparent:true, opacity:0.04 })
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), glowMat))
 
    const rings: THREE.Mesh[] = []
    for (let r = 0; r < 4; r++) {
      const rg = new THREE.RingGeometry(1.35+r*0.14, 1.37+r*0.14, 80)
      const rm = new THREE.MeshBasicMaterial({ color: r%2===0?0x7C3EF6:0x22D3EE, transparent:true, opacity:0.07, side:THREE.DoubleSide })
      const ring = new THREE.Mesh(rg, rm)
      ring.rotation.x = Math.PI/2; ring.rotation.y = (r/4)*Math.PI*0.5
      scene.add(ring); rings.push(ring)
    }
 
    let mx = 0, my = 0
    const onMouse = e => { mx = (e.clientX/innerWidth-0.5)*2; my = (e.clientY/innerHeight-0.5)*2 }
    addEventListener("mousemove", onMouse)
 
    function resize() {
      const w = canvas.parentElement?.clientWidth  || 480
      const h = canvas.parentElement?.clientHeight || 480
      renderer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix()
    }
    resize(); addEventListener("resize", resize)
 
    const clock = new THREE.Clock()
    const posArr = geo.attributes.position.array
 
    function animate() {
      rafRef.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      for (let i = 0; i < COUNT; i++) {
        const wave = 1 + 0.07 * Math.sin(t*1.8 + i*0.009)
        posArr[i*3]=orig[i*3]*wave; posArr[i*3+1]=orig[i*3+1]*wave; posArr[i*3+2]=orig[i*3+2]*wave
      }
      geo.attributes.position.needsUpdate = true
      particles.rotation.y = t*0.08 + mx*0.18
      particles.rotation.x = t*0.04 + my*0.10
      rings.forEach((ring, i) => { ring.rotation.z=t*0.25*(i%2===0?1:-1); ring.material.opacity=0.05+0.05*Math.sin(t*1.4+i*0.8) })
      glowMat.opacity = 0.03 + 0.02*Math.sin(t*1.1)
      renderer.render(scene, camera)
    }
    animate()
 
    return () => {
      cancelAnimationFrame(rafRef.current)
      removeEventListener("mousemove", onMouse)
      removeEventListener("resize", resize)
      renderer.dispose()
    }
  }, [])
 
  return <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block" }}/>
}