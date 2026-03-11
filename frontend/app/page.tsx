'use client'
import Footer from '@/components/homepage/layout/Footer'
import Navbar from '@/components/homepage/layout/Navbar'
import Features from '@/components/homepage/sections/Feature'
import Hero from '@/components/homepage/sections/Hero'


function HomePage() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  )
}

export default HomePage