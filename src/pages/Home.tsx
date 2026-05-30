import { AboutSection } from '../components/sections/AboutSection';
import { ContactSection } from '../components/sections/ContactSection';
import { ExperienceImpactSection } from '../components/sections/ExperienceImpactSection';
import { FeaturedProjectsSection } from '../components/sections/FeaturedProjectsSection';
import { HeroSection } from '../components/sections/HeroSection';
import { TechStackSection } from '../components/sections/TechStackSection';
import { WhatIDoSection } from '../components/sections/WhatIDoSection';

export function Home() {
  return (
    <>
      <HeroSection />
      <div className="hero-divider" aria-hidden />
      <FeaturedProjectsSection />
      <TechStackSection />
      <div className="section-border w-full">
        <div className="page-container grid w-full lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-stretch">
          <AboutSection />
          <ExperienceImpactSection />
          <WhatIDoSection />
        </div>
      </div>
      <ContactSection />
    </>
  );
}
