import React from 'react';
import { Hero } from '../components/home/Hero';
import { Features } from '../components/home/Features';
import { HowItWorks } from '../components/home/HowItWorks';
import { TopInstructors } from '../components/home/TopInstructors';
import { Testimonials } from '../components/home/Testimonials';
import { ProgressShowcase } from '../components/home/ProgressShowcase';
import { CTA } from '../components/home/CTA';

export function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <HowItWorks />
      <TopInstructors />
      <Testimonials />
      <ProgressShowcase />
      <CTA />
    </div>
  );
}