import { Navbar } from "~/components/nexus/Navbar";
import {
  Hero,
  Problem,
  Overview,
  Nova,
  Capabilities,
  Timeline,
  Screenshots,
  Future,
  CTA,
  Footer,
} from "~/components/nexus/Sections";



export default function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Overview />
        <Nova />
        <Capabilities />
        <Timeline />
        <Screenshots />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
