'use client'
import Footer from '@/components/homepage/layout/Footer'
import Navbar from '@/components/homepage/layout/Navbar'
import CTABanner from '@/components/homepage/sections/CTABanner'
import FAQ from '@/components/homepage/sections/FAQ'
import Features from '@/components/homepage/sections/Feature'
import Hero from '@/components/homepage/sections/Hero'
import Playground from '@/components/homepage/sections/Playground'
import Pricing from '@/components/homepage/sections/Pricing'
import SocialProof from '@/components/homepage/sections/SocialProof'
import UseCases from '@/components/homepage/sections/UseCases'
import dynamic from 'next/dynamic'



function HomePage() {
  const VoiceSamples = dynamic(
  () => import("@/components/homepage/sections/voice-samples"),
  { ssr: false }   // audio API browser-only
)

//  const HeroScene = dynamic(() => import('@/components/homepage/sections/HeroScene'), { ssr: false })

  return (
    <main className="relative">
      <Navbar />
      <Hero />
      {/* <HeroScene /> */}
      {/* <Features /> */}
      <Features />
      {/* <HowItWorks /> */}
      <Playground />
      {/* <Voices /> */}
      <VoiceSamples />
      <SocialProof />
      <Pricing />
      <UseCases />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  )
}

export default HomePage