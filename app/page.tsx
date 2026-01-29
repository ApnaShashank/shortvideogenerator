import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import HowItWorks from '@/components/HowItWorks'
import PlatformSupport from '@/components/PlatformSupport'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <PlatformSupport />
      <CTA />
      <Footer />
    </div>
  )
}
