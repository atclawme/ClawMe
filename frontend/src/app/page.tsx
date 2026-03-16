import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import WhyHandles from '@/components/landing/WhyHandles'
import HowItWorks from '@/components/landing/HowItWorks'
import DevProof from '@/components/landing/DevProof'
import PrivacySafety from '@/components/landing/PrivacySafety'
import WaitlistForm from '@/components/landing/WaitlistForm'
import Footer from '@/components/landing/Footer'
import AttributionCapture from '@/components/AttributionCapture'

export default function Home() {
  return (
    <main className="bg-[#0A0A0F]">
      <AttributionCapture />
      <Nav />
      <Hero />
      <WhyHandles />
      <HowItWorks />
      <DevProof />
      <PrivacySafety />
      <WaitlistForm />
      <Footer />
    </main>
  )
}
