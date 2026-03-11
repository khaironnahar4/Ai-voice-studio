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
import Voices from '@/components/homepage/sections/Voices'


function HomePage() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Features />
      <Playground />
      <Voices />
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