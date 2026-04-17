'use client'

/**
 * VoceraHero.tsx
 *
 * Install deps:
 *   npm install three gsap @types/three
 *
 * Usage in your page:
 *   import dynamic from 'next/dynamic'
 *   const VoceraHero = dynamic(() => import('@/components/sections/VoceraHero'), { ssr: false })
 *
 * The section pins itself using GSAP ScrollTrigger and morphs
 * a Three.js particle system through 4 states:
 *   Cloud → Text → Vortex → Sphere (audio-reactive)
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ─── Types ─────────────────────────────────────────────────── */
interface ParticleState {
  c2t: number   // cloud → text progress
  t2v: number   // text  → vortex progress
  v2s: number   // vortex → sphere progress
  rot: number   // current rotation speed
}

/* ─── Particle position generators ──────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function genCloud(n: number): Float32Array {
  const p = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    const r = 3.5 + Math.random() * 3.5
    p[i * 3]     = r * Math.sin(ph) * Math.cos(th)
    p[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
    p[i * 3 + 2] = r * Math.cos(ph)
  }
  return p
}

function genText(n: number, mobile: boolean): Float32Array {
  const off = document.createElement('canvas')
  off.width = 1200; off.height = 300
  const ctx = off.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${mobile ? 90 : 138}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('VOCERA AI', 600, 150)
  const { data } = ctx.getImageData(0, 0, 1200, 300)

  const pts: [number, number][] = []
  const step = mobile ? 3 : 2
  for (let y = 0; y < 300; y += step) {
    for (let x = 0; x < 1200; x += step) {
      if (data[(y * 1200 + x) * 4 + 3] > 110) pts.push([x, y])
    }
  }
  if (!pts.length) return genCloud(n)

  const p = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const [px, py] = pts[Math.floor(Math.random() * pts.length)]
    p[i * 3]     = (px / 1200 - 0.5) * (mobile ? 12 : 15.5)
    p[i * 3 + 1] = -(py / 300 - 0.5) * (mobile ? 3 : 3.9)
    p[i * 3 + 2] = (Math.random() - 0.5) * 0.25
  }
  return p
}

function genVortex(n: number, mobile: boolean): Float32Array {
  const p = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const prog = i / n
    const t = prog * Math.PI * 22
    const h = (prog - 0.5) * (mobile ? 5.5 : 8)
    const r = Math.max(0.25, (mobile ? 1.6 : 2.2) * (Math.abs(h / (mobile ? 2.75 : 4)) + 0.12))
    const ph = (i % 4) * (Math.PI / 2)
    p[i * 3]     = r * Math.cos(t + ph) + (Math.random() - 0.5) * 0.1
    p[i * 3 + 1] = h + (Math.random() - 0.5) * 0.08
    p[i * 3 + 2] = r * Math.sin(t + ph) + (Math.random() - 0.5) * 0.1
  }
  return p
}

function genSphere(n: number, radius: number): Float32Array {
  const p = new Float32Array(n * 3)
  const g = Math.PI * (1 + Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const th = Math.acos(1 - 2 * (i + 0.5) / n)
    const ph = g * i
    p[i * 3]     = radius * Math.sin(th) * Math.cos(ph)
    p[i * 3 + 1] = radius * Math.cos(th)
    p[i * 3 + 2] = radius * Math.sin(th) * Math.sin(ph)
  }
  return p
}

/* ─── GLSL shaders ───────────────────────────────────────────── */
const VERTEX_SHADER = /* glsl */`
  attribute float aS;
  attribute vec3 aC;
  attribute float aN;
  uniform float uT;
  varying vec3 vC;
  void main() {
    vC = aC;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 1.0 + 0.18 * sin(uT * 2.5 + aN * 47.3);
    gl_PointSize = aS * twinkle * (550.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const FRAGMENT_SHADER = /* glsl */`
  varying vec3 vC;
  void main() {
    vec2 uv = gl_PointCoord * 2.0 - 1.0;
    float d = dot(uv, uv);
    if (d > 1.0) discard;
    float a = pow(1.0 - sqrt(d), 1.7);
    gl_FragColor = vec4(vC * (0.9 + a * 0.5), a);
  }
`

/* ─── Color palettes per state ───────────────────────────────── */
const CC = [0.38, 0.18, 0.88] // cloud   → deep violet
const TC = [0.84, 0.87, 1.00] // text    → near white
const VC = [0.12, 0.80, 1.00] // vortex  → cyan
const SC = [0.72, 0.38, 1.00] // sphere  → violet-rose

/* ─── Component ──────────────────────────────────────────────── */
export default function VoceraHero() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const heroRef     = useRef<HTMLDivElement>(null)
  const playWrapRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const btnsRef     = useRef<HTMLDivElement>(null)
  const tagRef      = useRef<HTMLParagraphElement>(null)
  const scrlRef     = useRef<HTMLDivElement>(null)
  const playBtnRef  = useRef<HTMLButtonElement>(null)
  const piconRef    = useRef<HTMLSpanElement>(null)
  const isPlayingRef = useRef(false)
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const freqDataRef  = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !heroRef.current) return

    const isMob  = window.innerWidth < 768
    const N      = isMob ? 1400 : 4800
    const SPHERE_R = isMob ? 1.8 : 2.7

    /* ── Renderer ─────────────────────────────────── */
    let W = window.innerWidth, H = window.innerHeight
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isMob,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMob ? 1.5 : 2))
    renderer.setSize(W, H)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(62, W / H, 0.01, 100)
    camera.position.z = 9

    /* ── Material ─────────────────────────────────── */
    const uT = { value: 0 }
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT },
    })

    /* ── Particle data ────────────────────────────── */
    const pCloud  = genCloud(N)
    const pText   = genText(N, isMob)
    const pVortex = genVortex(N, isMob)
    const pSphere = genSphere(N, SPHERE_R)

    // Precompute sphere angles for audio reactivity
    const sphereAngles = new Float32Array(N * 2)
    const GOLDEN = Math.PI * (1 + Math.sqrt(5))
    for (let i = 0; i < N; i++) {
      sphereAngles[i * 2]     = Math.acos(1 - 2 * (i + 0.5) / N)
      sphereAngles[i * 2 + 1] = GOLDEN * i
    }

    // Per-particle noise
    const noiseArr = new Float32Array(N)
    for (let i = 0; i < N; i++) noiseArr[i] = Math.random()

    // Working buffers
    const positions = pCloud.slice()
    const colors    = new Float32Array(N * 3)
    const sizes     = new Float32Array(N)

    for (let i = 0; i < N; i++) {
      const n = noiseArr[i]
      colors[i * 3]     = 0.38 + n * 0.25
      colors[i * 3 + 1] = 0.18 + n * 0.15
      colors[i * 3 + 2] = 0.82 + n * 0.18
      sizes[i] = isMob ? 0.013 + n * 0.005 : 0.0095 + n * 0.006
    }

    /* ── Geometry ─────────────────────────────────── */
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aC',       new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aS',       new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aN',       new THREE.BufferAttribute(noiseArr, 1))

    const particles = new THREE.Points(geo, material)
    scene.add(particles)

    /* ── Background stars ─────────────────────────── */
    const STAR_COUNT = isMob ? 250 : 550
    const starGeo    = new THREE.BufferGeometry()
    const starPos    = new Float32Array(STAR_COUNT * 3)
    const starCol    = new Float32Array(STAR_COUNT * 3)
    const starSiz    = new Float32Array(STAR_COUNT)
    const starNoise  = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) {
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      const r  = 10 + Math.random() * 8
      starPos[i * 3]     = r * Math.sin(ph) * Math.cos(th)
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th)
      starPos[i * 3 + 2] = r * Math.cos(ph)
      starCol[i * 3] = starCol[i * 3 + 1] = 0.35 + Math.random() * 0.35
      starCol[i * 3 + 2] = 0.6 + Math.random() * 0.4
      starSiz[i]   = 0.003 + Math.random() * 0.007
      starNoise[i] = Math.random()
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('aC',       new THREE.BufferAttribute(starCol, 3))
    starGeo.setAttribute('aS',       new THREE.BufferAttribute(starSiz, 1))
    starGeo.setAttribute('aN',       new THREE.BufferAttribute(starNoise, 1))
    scene.add(new THREE.Points(starGeo, material))

    /* ── Central glow sphere ──────────────────────── */
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending,
    })
    const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), glowMaterial)
    scene.add(glowSphere)

    /* ── Scroll-driven state ──────────────────────── */
    const S: ParticleState = { c2t: 0, t2v: 0, v2s: 0, rot: 0.0018 }

    /* ── GSAP ScrollTrigger ───────────────────────── */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current!,
        start: 'top top',
        end: '+=290%',
        pin: true,
        scrub: 1.5,
        pinType: 'transform',
      },
    })

    tl.to(btnsRef.current,     { opacity: 0, y: -22, duration: 2 }, 0)
      .to(tagRef.current,      { opacity: 0, y: -10, duration: 1.5 }, 0)
      .to(scrlRef.current,     { opacity: 0, duration: 1 }, 0)
      .to(headlineRef.current, {
        scale: isMob ? 1.22 : 1.38,
        y: isMob ? -22 : -28,
        duration: 2.5,
        ease: 'power2.inOut',
      }, 0.6)

    tl.to(S, { c2t: 1, duration: 2.5, ease: 'power2.inOut' }, 2.8)
      .to(headlineRef.current, { opacity: 0, duration: 1 }, 4.2)

    tl.to(S, { t2v: 1, duration: 2, ease: 'power1.inOut' }, 5.2)
      .to(S, { rot: 0.016, duration: 1.5 }, 5.2)
      .to(S, { rot: 0.004, duration: 1 }, 6.8)

    tl.to(S, { v2s: 1, duration: 2.2, ease: 'power2.inOut' }, 7.2)
      .to(glowMaterial, { opacity: 0.18, duration: 1 }, 7.8)

    tl.to(playWrapRef.current, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 8.2)
      .to(S, { rot: 0.003, duration: 1 }, 8.5)
      .to(heroRef.current, { opacity: 0, duration: 1 }, 9.6)

    // Enable pointer events on play button when visible
    ScrollTrigger.create({
      trigger: heroRef.current!,
      start: 'top top',
      end: '+=290%',
      onUpdate(self) {
        if (!playWrapRef.current) return
        playWrapRef.current.style.pointerEvents = self.progress > 0.68 ? 'all' : 'none'
      },
    })

    /* ── Audio synthesis ──────────────────────────── */
    function initAudio() {
      if (audioCtxRef.current) return
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.78
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current  = analyser
      freqDataRef.current  = new Uint8Array(analyser.frequencyBinCount)
    }

    function startAudio() {
      initAudio()
      const ctx      = audioCtxRef.current!
      const analyser = analyserRef.current!
      const master   = ctx.createGain()
      master.gain.setValueAtTime(0, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.5)
      master.connect(analyser)

      const cfg: Array<[number, OscillatorType, number, number, number, number]> = [
        [165, 'sawtooth', 0.5,  700,  2.0, 0],
        [330, 'sine',     0.28, 1150, 3.5, 0.3],
        [495, 'sine',     0.16, 1900, 4.5, 0.1],
        [660, 'sine',     0.08, 2700, 5.0, 0.2],
        [825, 'sine',     0.04, 3400, 5.5, 0.15],
      ]

      const oscs = cfg.map(([freq, type, gain, fFreq, fQ, delay]) => {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = freq
        osc.frequency.linearRampToValueAtTime(freq * 1.002, ctx.currentTime + 1.2)
        osc.frequency.linearRampToValueAtTime(freq * 0.999, ctx.currentTime + 2.4)
        const g   = ctx.createGain(); g.gain.value = gain
        const fil = ctx.createBiquadFilter()
        fil.type = 'bandpass'; fil.frequency.value = fFreq; fil.Q.value = fQ
        osc.connect(fil); fil.connect(g); g.connect(master)
        osc.start(ctx.currentTime + delay)
        return osc
      })

      master.gain.setValueAtTime(0.22, ctx.currentTime + 3.8)
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.0)

      const stopTimer = setTimeout(() => {
        oscs.forEach(o => { try { o.stop() } catch (_) {} })
        isPlayingRef.current = false
        if (piconRef.current)  piconRef.current.textContent = '▶'
        if (playBtnRef.current) playBtnRef.current.classList.remove('playing')
      }, 5500)

      return stopTimer
    }

    let audioTimer: ReturnType<typeof setTimeout>
    const handlePlay = () => {
      if (isPlayingRef.current) return
      isPlayingRef.current = true
      if (piconRef.current)  piconRef.current.textContent  = '■'
      if (playBtnRef.current) playBtnRef.current.classList.add('playing')
      audioTimer = startAudio()
    }
    playBtnRef.current?.addEventListener('click', handlePlay)

    /* ── Render loop ──────────────────────────────── */
    const clock = new THREE.Clock()
    let rafId: number

    function updateParticles() {
      const p = positions
      const c = colors
      const hasAudio = isPlayingRef.current && analyserRef.current && S.v2s > 0.75
      if (hasAudio) analyserRef.current!.getByteFrequencyData(freqDataRef.current!)

      for (let i = 0; i < N; i++) {
        const i3 = i * 3
        const n  = noiseArr[i]

        let x = lerp(pCloud[i3],     pText[i3],   S.c2t)
        x = lerp(x, pVortex[i3],   S.t2v)
        x = lerp(x, pSphere[i3],   S.v2s)

        let y = lerp(pCloud[i3 + 1], pText[i3 + 1], S.c2t)
        y = lerp(y, pVortex[i3 + 1], S.t2v)
        y = lerp(y, pSphere[i3 + 1], S.v2s)

        let z = lerp(pCloud[i3 + 2], pText[i3 + 2], S.c2t)
        z = lerp(z, pVortex[i3 + 2], S.t2v)
        z = lerp(z, pSphere[i3 + 2], S.v2s)

        if (hasAudio) {
          const th  = sphereAngles[i * 2]
          const ph  = sphereAngles[i * 2 + 1]
          const eq  = Math.sin(th)
          const bin = Math.floor(eq * (freqDataRef.current!.length - 1))
          const amp = freqDataRef.current![bin] / 255
          const ra  = SPHERE_R * (1 + amp * 0.58)
          const blend = Math.min(1, S.v2s * 1.2)
          x = lerp(x, ra * Math.sin(th) * Math.cos(ph), blend)
          y = lerp(y, ra * Math.cos(th), blend)
          z = lerp(z, ra * Math.sin(th) * Math.sin(ph), blend)
        }

        p[i3] = x; p[i3 + 1] = y; p[i3 + 2] = z

        let r = lerp(CC[0], TC[0], S.c2t); r = lerp(r, VC[0], S.t2v); r = lerp(r, SC[0], S.v2s)
        let g = lerp(CC[1], TC[1], S.c2t); g = lerp(g, VC[1], S.t2v); g = lerp(g, SC[1], S.v2s)
        let b = lerp(CC[2], TC[2], S.c2t); b = lerp(b, VC[2], S.t2v); b = lerp(b, SC[2], S.v2s)
        r += n * 0.1 - 0.05; g += n * 0.07 - 0.035; b += n * 0.06 - 0.03

        if (hasAudio) {
          const eq  = Math.sin(sphereAngles[i * 2])
          const bin = Math.floor(eq * (freqDataRef.current!.length - 1))
          const amp = freqDataRef.current![bin] / 255
          r = Math.min(1.5, r + amp * 0.55)
          g += amp * 0.08
        }

        c[i3] = r; c[i3 + 1] = g; c[i3 + 2] = b
      }

      geo.attributes.position.needsUpdate = true
      geo.attributes.aC.needsUpdate = true
    }

    function animate() {
      rafId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      uT.value = t

      particles.rotation.y += S.rot
      if (S.c2t < 0.5) {
        particles.rotation.x = Math.sin(t * 0.35) * 0.004
        particles.rotation.z = Math.cos(t * 0.28) * 0.003
      }
      camera.position.x = Math.sin(t * 0.09) * 0.28
      camera.position.y = Math.cos(t * 0.13) * 0.18
      camera.lookAt(0, 0, 0)

      updateParticles()
      renderer.render(scene, camera)
    }
    animate()

    /* ── Resize ───────────────────────────────────── */
    function onResize() {
      W = window.innerWidth; H = window.innerHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
      ScrollTrigger.refresh()
    }
    window.addEventListener('resize', onResize)

    /* ── Cleanup ──────────────────────────────────── */
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      playBtnRef.current?.removeEventListener('click', handlePlay)
      clearTimeout(audioTimer)
      ScrollTrigger.getAll().forEach(t => t.kill())
      tl.kill()
      renderer.dispose()
      geo.dispose()
      material.dispose()
      starGeo.dispose()
      glowMaterial.dispose()
      audioCtxRef.current?.close()
    }
  }, [])

  return (
    <>
      {/* ── Hero Section ───────────────────────────── */}
      <section
        ref={heroRef}
        className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#03030e]"
        style={{ isolation: 'isolate' }}
      >
        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 15%, rgba(3,3,14,0.45) 55%, rgba(3,3,14,0.88) 100%)'
          }}
        />

        {/* Three.js canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0 block" />

        {/* Headline + Buttons */}
        <div className="relative z-10 text-center px-6 will-change-transform">
          <h1
            ref={headlineRef}
            className="font-display font-extrabold leading-[1.06] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(2rem, 6.5vw, 5.5rem)', transformOrigin: 'center center' }}
          >
            Welcome to
            <br />
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(115deg, #c084fc 0%, #818cf8 45%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Vocera AI
            </span>
          </h1>

          <div ref={btnsRef} className="flex gap-3 justify-center mt-10 flex-wrap">
            <button
              className="px-8 py-3.5 rounded-[10px] text-white font-sans font-semibold text-[15px] tracking-wide transition-all duration-200
                         hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                boxShadow: '0 4px 24px rgba(124,58,237,.35), inset 0 1px 0 rgba(255,255,255,.12)',
              }}
            >
              Start for Free
            </button>
            <button
              className="px-8 py-3.5 rounded-[10px] font-sans font-medium text-[15px] tracking-wide border transition-all duration-200
                         bg-white/[0.04] border-white/[0.12] text-white/80 hover:bg-white/[0.07] hover:border-indigo-400/40 hover:text-white
                         backdrop-blur-md"
            >
              ↗ Hear Sample Voices
            </button>
          </div>

          <p
            ref={tagRef}
            className="mt-5 font-sans text-[12px] text-white/25 uppercase tracking-[0.14em]"
          >
            3 Providers &bull; 200+ Voices &bull; 100+ Languages
          </p>
        </div>

        {/* Play Button (appears in sphere stage) */}
        <div
          ref={playWrapRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 pointer-events-none
                     flex flex-col items-center gap-4"
        >
          <button
            ref={playBtnRef}
            aria-label="Play audio sample"
            className="relative w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl
                       transition-all duration-300 hover:scale-105
                       [&.playing]:shadow-[0_0_50px_rgba(124,58,237,0.6)]"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1.5px solid rgba(139,92,246,0.45)',
              paddingLeft: '3px',
            }}
          >
            {/* Pulse rings */}
            <span
              className="absolute rounded-full border border-[rgba(139,92,246,0.22)] animate-[rpulse_2.8s_ease-out_infinite]"
              style={{ inset: '-14px' }}
            />
            <span
              className="absolute rounded-full border border-[rgba(139,92,246,0.22)] animate-[rpulse_2.8s_ease-out_infinite_0.9s]"
              style={{ inset: '-26px' }}
            />
            <span ref={piconRef}>▶</span>
          </button>
          <p className="font-sans text-[11px] text-white/30 uppercase tracking-[0.2em]">
            Hear Vocera AI
          </p>
        </div>

        {/* Scroll cue */}
        <div
          ref={scrlRef}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2
                     animate-[sfloat_2.5s_ease-in-out_infinite]"
        >
          <div
            className="w-px h-9"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(167,139,250,0.6))' }}
          />
          <span className="font-sans text-[10px] text-white/25 uppercase tracking-[0.2em]">scroll</span>
        </div>
      </section>

      {/* ── Next Section Teaser ─────────────────────── */}
      <section className="min-h-screen bg-[#03030e] flex items-center justify-center flex-col gap-6 px-6 py-20">
        <div
          className="font-sans text-[11px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full"
          style={{ color: 'rgba(167,139,250,0.6)', border: '1px solid rgba(167,139,250,0.2)' }}
        >
          Core Capabilities
        </div>
        <h2
          className="font-display font-bold tracking-[-0.02em] text-center"
          style={{ fontSize: 'clamp(2rem,4vw,3.5rem)', color: 'rgba(255,255,255,0.85)' }}
        >
          Voices that come alive
        </h2>
        <p className="font-sans text-base text-white/30 max-w-md text-center leading-relaxed">
          Convert any text into natural-sounding speech using the world&apos;s most advanced AI voice providers.
        </p>
      </section>
    </>
  )
}
