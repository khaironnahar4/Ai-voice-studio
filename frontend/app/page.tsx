'use client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

function HomePage() {
  return (
     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to VoiceBook
        </h1>
        <p className="text-slate-300 mb-8">
          Transform your stories into captivating audio experiences
        </p>
        <Link
         href="/dashboard">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default HomePage