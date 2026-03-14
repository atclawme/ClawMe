import Nav from '@/components/landing/Nav'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import WaitlistForm from '@/components/landing/WaitlistForm'
import Footer from '@/components/landing/Footer'
import AttributionCapture from '@/components/AttributionCapture'

export default function Home() {
  return (
    <main className="bg-[#0A0A0F]">
      <AttributionCapture />
      <Nav />
      <Hero />
      <HowItWorks />
      <WaitlistForm />
      <Footer />
    </main>
  )
}
