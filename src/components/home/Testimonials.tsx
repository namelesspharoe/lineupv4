import React, { useState } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Testimonial {
  id: string;
  studentName: string;
  studentAvatar?: string;
  instructorName: string;
  rating: number;
  comment: string;
  tag: string;
  dateLabel: string;
}

/** Curated stories focused on why the platform helps—not live DB reviews. */
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    studentName: 'Sarah M.',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100',
    instructorName: 'Mike T.',
    rating: 5,
    comment:
      'I was juggling DMs, resort pages, and word-of-mouth. Here I compared coaches in one place, saw who actually teaches beginners, and booked a slot that fit my work schedule—huge time saver.',
    tag: 'Less back-and-forth',
    dateLabel: 'Ski trip · Colorado'
  },
  {
    id: '2',
    studentName: 'James K.',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    instructorName: 'Emma R.',
    rating: 5,
    comment:
      'My goals and level were already in my profile, so my instructor showed up prepared. We didn’t waste the first half hour re-explaining what I wanted—we started improving turns right away.',
    tag: 'Hit the snow running',
    dateLabel: 'Weekend lesson'
  },
  {
    id: '3',
    studentName: 'Priya N.',
    studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    instructorName: 'Alex P.',
    rating: 5,
    comment:
      'Booking for two kids used to mean a dozen texts and guesswork. We picked someone with family-friendly reviews, confirmed pricing upfront, and kept everything in one thread—way less stress for parents.',
    tag: 'Peace of mind',
    dateLabel: 'Family booking'
  },
  {
    id: '4',
    studentName: 'Marcus T.',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    instructorName: 'Jordan L.',
    rating: 5,
    comment:
      'I liked seeing lesson type and what we’d focus on before I paid. Meeting spot and timing were clear in the app, so there was no awkward confusion at the base of the mountain.',
    tag: 'Clear expectations',
    dateLabel: 'First time using the app'
  },
  {
    id: '5',
    studentName: 'Elena R.',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    instructorName: 'Chris D.',
    rating: 5,
    comment:
      'I came back mid-season and my past lessons were right there. Re-booking the same coach took two taps instead of hunting down a phone number—I kept momentum instead of starting over.',
    tag: 'Easy to return',
    dateLabel: 'Return visit'
  },
  {
    id: '6',
    studentName: 'Diego V.',
    studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    instructorName: 'Sam W.',
    rating: 5,
    comment:
      'I’m only in town for a week. I filtered for the mountain I was skiing, read a few profiles, and locked a Saturday morning in minutes. Felt like the app was built for short trips.',
    tag: 'Out-of-town friendly',
    dateLabel: 'One-week trip'
  }
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

function Avatar({
  src,
  name,
  className
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  const ok = Boolean(src && /^https?:\/\//i.test(src.trim()));
  if (ok) {
    return <img src={src!.trim()} alt="" className={className} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 border-2 border-slate-600/80`}
      aria-hidden
    >
      <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
        {initialsFromName(name)}
      </span>
    </div>
  );
}

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonials = TESTIMONIALS;

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[currentIndex];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14 md:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Quote className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
            Why riders use us
          </div>

          <h2 className="mb-4 text-3xl font-bold leading-tight text-white sm:mb-6 sm:text-4xl md:text-5xl">
            What riders
            <span className="block text-blue-400">are saying</span>
          </h2>

          <p className="px-1 text-base leading-relaxed text-gray-300 sm:px-0 sm:text-lg md:text-xl">
            Real-world ways the app makes booking, communication, and coming back for another lesson easier.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <article className="overflow-hidden rounded-2xl border border-gray-700/90 bg-gray-900 shadow-xl sm:mx-2 sm:rounded-3xl">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-violet-500" />
              <div className="px-5 py-8 sm:px-12 sm:py-10 md:px-14">
                <div className="mb-6 flex flex-col gap-6 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={current.studentAvatar}
                      name={current.studentName}
                      className="h-14 w-14 shrink-0 rounded-full object-cover shadow-lg sm:h-16 sm:w-16 sm:border-4 sm:border-gray-800"
                    />
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-white sm:text-lg">
                        {current.studentName}
                      </p>
                      <p className="text-sm text-gray-400">
                        Lesson with{' '}
                        <span className="text-gray-300">{current.instructorName}</span>
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-1 sm:justify-end"
                    aria-label={`${current.rating} out of 5 stars`}
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 sm:h-6 sm:w-6 ${
                          i < current.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <blockquote className="mb-8 border-l-4 border-blue-500/60 pl-4 text-base leading-relaxed text-gray-200 sm:mb-10 sm:pl-6 sm:text-lg md:text-xl">
                  <span className="text-gray-500">&ldquo;</span>
                  {current.comment}
                  <span className="text-gray-500">&rdquo;</span>
                </blockquote>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1 text-gray-300">
                    <Sparkles className="h-3.5 w-3.5 text-sky-400" aria-hidden />
                    {current.tag}
                  </span>
                  {current.dateLabel ? (
                    <>
                      <span className="hidden sm:inline" aria-hidden>
                        ·
                      </span>
                      <span>{current.dateLabel}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </article>

            <button
              type="button"
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-600 bg-gray-800 shadow-lg transition-colors hover:bg-gray-700 md:left-1 md:flex md:h-12 md:w-12 touch-manipulation"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 text-gray-300 md:h-6 md:w-6" />
            </button>
            <button
              type="button"
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-600 bg-gray-800 shadow-lg transition-colors hover:bg-gray-700 md:right-1 md:flex md:h-12 md:w-12 touch-manipulation"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 text-gray-300 md:h-6 md:w-6" />
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-4 sm:hidden">
            <button
              type="button"
              onClick={prevTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-600 bg-gray-900 shadow-lg touch-manipulation active:bg-gray-800"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5 text-gray-300" />
            </button>
            <button
              type="button"
              onClick={nextTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-600 bg-gray-900 shadow-lg touch-manipulation active:bg-gray-800"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </button>
          </div>

          <div className="mt-6 flex justify-center gap-2 sm:mt-8">
            {testimonials.map((t, index) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-2.5 min-h-[10px] w-2.5 min-w-[10px] rounded-full transition-colors touch-manipulation sm:h-3 sm:w-3 ${
                  index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
