import React from 'react';
import { Hero } from '../components/home/Hero';
import { TopInstructors } from '../components/home/TopInstructors';
import { ProgressShowcase } from '../components/home/ProgressShowcase';

export function Home() {
  return (
    <div>
      <Hero />
      <ProgressShowcase />
      <TopInstructors />
    </div>
  );
}