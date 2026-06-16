import { Navbar } from "~/components/nexus/Navbar";
import { AuroraBackground, Particles } from "~/components/nexus/Background";
import {
  Hero,
  Problem,
  Overview,
  Nova,
  // Capabilities,
  // Timeline,
  HowItWorksSection,
  Screenshots,
  // Future,
  CTA,
  Footer,
} from "~/components/nexus/Sections";



export default function Index() {
  return (
    <div className="relative min-h-screen bg-background">
      <Navbar />
      <main>
        <div className="relative">
          <AuroraBackground />
          <Particles count={30} />
          <Hero />
          <Problem />
          <Overview />
        </div>
        <Nova />
        {/* <Capabilities /> */}
        {/* <Timeline /> */}
        <HowItWorksSection />
        <Screenshots />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
