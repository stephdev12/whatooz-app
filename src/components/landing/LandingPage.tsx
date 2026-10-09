'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { StageExactNav } from './StageExactNav'
import { StageExactHero } from './StageExactHero'
import { StageExactStory } from './StageExactStory'
import { StageExactFeatures } from './StageExactFeatures'
import { StageExactPricing } from './StageExactPricing'
import { StageExactFaq } from './StageExactFaq'
import { StageExactFooter } from './StageExactFooter'
import '@/styles/stage-exact.css'

interface LandingPageProps {
  isAuthenticated?: boolean
}

export default function LandingPage({ isAuthenticated = false }: LandingPageProps) {
  const router = useRouter()

  const handleOpenApp = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  const handleSelectPlan = (planId: string) => {
    if (isAuthenticated) {
      router.push(`/dashboard/settings?plan=${planId}`)
    } else {
      router.push(`/login?plan=${planId}`)
    }
  }

  return (
    <div className="stage-landing-page min-h-screen bg-[#171717] font-sans antialiased text-[#171717]">
      {/* 1. Exact Stage Navigation */}
      <StageExactNav
        isAuthenticated={isAuthenticated}
        onOpenApp={handleOpenApp}
      />

      {/* 2. Exact Stage Hero with Landscape Parallax Layers (Single Primary CTA) */}
      <main id="main">
        <StageExactHero onStartTrial={handleOpenApp} />

        {/* 3. Problem Story Manifesto (Framer Motion Word-by-Word Reading Highlight) */}
        <StageExactStory />

        {/* 4. Clean Light Features with Modern Phone Mockups */}
        <StageExactFeatures />

        {/* 5. Clean Stage Pricing */}
        <StageExactPricing onSelectPlan={handleSelectPlan} />

        {/* 6. Clean Stage FAQ */}
        <StageExactFaq />
      </main>

      {/* 7. Exact Stage Closing CTA & Footer */}
      <StageExactFooter onStartTrial={handleOpenApp} />
    </div>
  )
}
