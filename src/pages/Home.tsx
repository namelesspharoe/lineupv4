import React, { useState, useCallback } from 'react';
import { Hero } from '../components/home/Hero';
import { HomeMatchResults } from '../components/home/HomeMatchResults';
import { HowItWorks } from '../components/home/HowItWorks';
import { Testimonials } from '../components/home/Testimonials';
import { ProgressShowcase } from '../components/home/ProgressShowcase';
import { CTA } from '../components/home/CTA';
import { instructorMatchingService, type InstructorMatch } from '../services/instructorMatching';

export function Home() {
  const [lessonPrompt, setLessonPrompt] = useState('');
  const [matchVisible, setMatchVisible] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matches, setMatches] = useState<InstructorMatch[]>([]);
  const [submittedPrompt, setSubmittedPrompt] = useState('');

  const handleMatchSubmit = useCallback(async (text: string) => {
    setMatchVisible(true);
    setMatchLoading(true);
    setMatchError(null);
    setSubmittedPrompt(text);
    try {
      const result = await instructorMatchingService.matchGuestPromptWithInstructors(text, {
        maxResults: 3
      });
      setMatches(result);
    } catch (e: unknown) {
      setMatches([]);
      setMatchError(e instanceof Error ? e.message : 'Could not load matches. Try again.');
    } finally {
      setMatchLoading(false);
    }
  }, []);

  return (
    <div>
      <Hero
        lessonDescription={lessonPrompt}
        onLessonDescriptionChange={setLessonPrompt}
        onMatchSubmit={handleMatchSubmit}
        matchLoading={matchLoading}
      />
      <HomeMatchResults
        prompt={submittedPrompt}
        matches={matches}
        loading={matchLoading}
        error={matchError}
        visible={matchVisible}
      />
      <HowItWorks />
      <Testimonials />
      <ProgressShowcase />
      <CTA />
    </div>
  );
}
