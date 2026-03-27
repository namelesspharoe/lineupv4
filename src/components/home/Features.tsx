import React from 'react';
import { 
  Shield, 
  Clock, 
  Users, 
  Award, 
  MapPin, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Star,
  Zap,
  Heart,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Matching',
      description: 'Tell us your level and goals—we suggest instructors that fit.',
      color: 'bg-gradient-to-br from-purple-600 to-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400',
      featured: true
    },
    {
      icon: Shield,
      title: 'Certified Instructors',
      description: 'Vetted pros with real teaching experience on snow.',
      color: 'bg-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-blue-400'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Morning, afternoon, or full-day—pick what works for you.',
      color: 'bg-green-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-green-400'
    },
    {
      icon: Users,
      title: 'Personalized Learning',
      description: 'Lessons tailored to how you learn and what you want next.',
      color: 'bg-purple-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400'
    },
    {
      icon: Award,
      title: 'Progress Tracking',
      description: 'See skills and milestones as you improve over time.',
      color: 'bg-yellow-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-yellow-400'
    },
    {
      icon: MapPin,
      title: 'Multiple Locations',
      description: 'Coaches at popular resorts nationwide.',
      color: 'bg-red-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-red-400'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book in a few taps—confirm fast, reschedule when plans change.',
      color: 'bg-indigo-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-indigo-400'
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Chat with your instructor before and after lessons.',
      color: 'bg-pink-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-pink-400'
    },
    {
      icon: TrendingUp,
      title: 'Skill Development',
      description: 'Clear paths from first turns through advanced riding.',
      color: 'bg-orange-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-orange-400'
    }
  ];

  const benefits = [
    {
      icon: Star,
      title: 'Proven Results',
      description: 'Noticeable gains within a few lessons'
    },
    {
      icon: Zap,
      title: 'Fast Progress',
      description: 'Expert feedback keeps you moving forward'
    },
    {
      icon: Heart,
      title: 'Safe Learning',
      description: 'Solid technique and safety from day one'
    },
    {
      icon: CheckCircle,
      title: 'Quality Guaranteed',
      description: 'Backed by our certified instructor network'
    }
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Why Choose
            <span className="block text-blue-400">
              Our Platform
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-1 sm:px-0">
            Certified coaches, smart matching, and lessons built around your goals—all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isFeatured = feature.featured;
            return (
              <div key={index} className={`group ${isFeatured ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                <div className={`${feature.bgColor} rounded-xl sm:rounded-2xl p-4 sm:p-6 h-full border ${isFeatured ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' : 'border-gray-700'} transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-xl`}>
                  {isFeatured && (
                    <div className="mb-2 sm:mb-3 inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                      <span className="text-[11px] sm:text-xs font-semibold text-purple-300">NEW</span>
                    </div>
                  )}
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-transform md:group-hover:scale-110`}>
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-[13px] sm:text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-gray-700">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight px-1 sm:px-0">
              The Benefits You'll Experience
            </h3>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Thousands of riders level up on snow with us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={index}
                  className="flex flex-row items-start gap-4 rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 md:flex-col md:items-center md:text-center md:border-0 md:bg-transparent md:p-0 md:rounded-none"
                >
                  <div className="w-12 h-12 shrink-0 bg-gray-700 rounded-xl flex items-center justify-center shadow-md border border-gray-600 md:w-16 md:h-16 md:rounded-2xl md:mx-auto md:mb-4 md:shadow-lg">
                    <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1 md:flex-none">
                    <h4 className="text-base sm:text-lg font-semibold text-white mb-1 md:mb-2">{benefit.title}</h4>
                    <p className="text-gray-400 text-[13px] sm:text-sm leading-snug">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-10 sm:mt-14 md:mt-16">
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-300 text-sm sm:text-base mb-5 sm:mb-6 max-w-2xl mx-auto leading-relaxed">
              Book a lesson or create an account to get started.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
              <a 
                href="/find-instructor"
                className="inline-flex justify-center items-center min-h-[48px] px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-colors touch-manipulation"
              >
                Find Your Instructor
              </a>
              <a 
                href="/book-lesson"
                className="inline-flex justify-center items-center min-h-[48px] px-6 sm:px-8 py-3 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white active:border-gray-500 rounded-xl font-semibold transition-colors touch-manipulation"
              >
                Browse Lessons
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
