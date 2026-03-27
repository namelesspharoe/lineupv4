import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  MessageSquare, 
  Mountain, 
  Star,
  ArrowRight,
  UserCircle,
  ChevronDown,
  ShieldCheck,
  Users,
  HeartHandshake
} from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: UserCircle,
      title: 'Create Profile',
      description: 'Sign up and add your level, goals, and preferences so we can match you with the right coach.',
      color: 'bg-gradient-to-br from-purple-600 to-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400',
      featured: true
    },
    {
      icon: Search,
      title: 'Browse & Compare',
      description: 'Read profiles and reviews, then pick who feels right.',
      color: 'bg-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-blue-400'
    },
    {
      icon: Calendar,
      title: 'Book Your Lesson',
      description: 'Choose time, lesson type, and confirm in a few taps.',
      color: 'bg-green-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-green-400'
    },
    {
      icon: MessageSquare,
      title: 'Connect & Prepare',
      description: 'Message your coach to align on plan and gear.',
      color: 'bg-purple-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400'
    },
    {
      icon: Mountain,
      title: 'Learn & Progress',
      description: 'On-snow coaching with clear next steps after each session.',
      color: 'bg-orange-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-orange-400'
    },
    {
      icon: Star,
      title: 'Track & Improve',
      description: 'Review feedback and book your next milestone.',
      color: 'bg-pink-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-pink-400'
    }
  ];

  const parentFaqs = [
    {
      icon: Users,
      iconBg: 'bg-sky-600 shadow-sky-950/40',
      question: 'How do I find an instructor who works well with kids?',
      answer:
        'Browse profiles and reviews from other families, look for coaches who teach juniors or beginners, and message instructors before you book. You stay in control of who teaches your child.'
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-emerald-600 shadow-emerald-950/40',
      question: 'What gives parents peace of mind?',
      answer:
        'Clear pricing before you commit, certified instructors, and easy in-app messaging so plans and expectations are never a mystery. Reschedule when life gets busy—we keep it straightforward.'
    },
    {
      icon: HeartHandshake,
      iconBg: 'bg-rose-600 shadow-rose-950/40',
      question: 'What if my child is nervous or brand new to snow?',
      answer:
        'Share their age, comfort level, and goals when you create your profile or message a coach. Many instructors specialize in first-timers and build confidence at a pace that feels right for kids.'
    },
    {
      icon: MessageSquare,
      iconBg: 'bg-violet-600 shadow-violet-950/40',
      question: 'Can I stay involved and talk to the coach?',
      answer:
        'Yes. Coordinate details, ask questions, and align on gear or meeting spots through messaging. Many parents like to confirm the plan ahead of time so everyone feels ready on the mountain.'
    }
  ];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            How It
            <span className="block text-blue-400">
              Works
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-1 sm:px-0">
            A simple path from match to first lesson—no guesswork.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto mb-12 sm:mb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isFeatured = step.featured;
              return (
                <div key={index} className="relative">
                  <div className={`absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-7 h-7 sm:w-8 sm:h-8 ${isFeatured ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-blue-600'} text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm z-10 shadow-lg`}>
                    {index + 1}
                  </div>
                  
                  <div className={`${step.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 h-full border ${isFeatured ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' : 'border-gray-700'} md:hover:border-gray-600 md:hover:shadow-xl transition-all duration-300 group`}>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 ${step.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 md:group-hover:scale-110 transition-transform shadow-lg`}>
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-[13px] sm:text-sm leading-relaxed">{step.description}</p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className={`w-8 h-8 ${isFeatured ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-blue-600'} rounded-full flex items-center justify-center shadow-lg`}>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Parents FAQ */}
        <div className="bg-gray-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 shadow-lg border border-gray-700">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-blue-400 mb-2">
              For parents
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight px-1 sm:px-0">
              Booking lessons for your kids?
            </h3>
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Peace of mind starts with choosing the right coach. Here are answers parents ask us most—finding someone who connects with children, staying in the loop, and knowing what to expect.
            </p>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
            {parentFaqs.map((item, index) => {
              const Icon = item.icon;
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-700/90 bg-gray-800/35 overflow-hidden transition-colors hover:border-gray-600/90"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="flex w-full items-start gap-3 sm:gap-4 text-left p-4 sm:p-5 touch-manipulation"
                    aria-expanded={isOpen}
                  >
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-lg flex items-center justify-center shadow-md ${item.iconBg}`}
                    >
                      <Icon className="w-5 h-5 text-white" aria-hidden />
                    </div>
                    <span className="flex-1 min-w-0 pt-0.5 text-base sm:text-lg font-semibold text-white leading-snug pr-2">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-gray-400 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <p className="px-4 sm:px-5 pb-4 sm:pb-5 pl-[4.25rem] sm:pl-20 text-gray-400 text-sm sm:text-base leading-relaxed border-t border-gray-700/50 pt-3 sm:pt-4">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
