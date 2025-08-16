import React from 'react';
import { 
  Search, 
  Calendar, 
  MessageSquare, 
  Mountain, 
  CheckCircle, 
  Star,
  ArrowRight
} from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: 'Find Your Instructor',
      description: 'Browse our network of certified instructors, read reviews, and find the perfect match for your skill level and goals.',
      color: 'bg-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-blue-400'
    },
    {
      icon: Calendar,
      title: 'Book Your Lesson',
      description: 'Choose your preferred date and time, select lesson type (private or group), and secure your spot instantly.',
      color: 'bg-green-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-green-400'
    },
    {
      icon: MessageSquare,
      title: 'Connect & Prepare',
      description: 'Message your instructor to discuss lesson plans, share your goals, and get personalized preparation tips.',
      color: 'bg-purple-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400'
    },
    {
      icon: Mountain,
      title: 'Learn & Progress',
      description: 'Meet your instructor on the mountain, receive expert instruction, and see immediate improvement in your skills.',
      color: 'bg-orange-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-orange-400'
    },
    {
      icon: Star,
      title: 'Track & Improve',
      description: 'Review your progress, get detailed feedback, and plan your next lesson to continue your development.',
      color: 'bg-pink-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-pink-400'
    }
  ];

  const benefits = [
    {
      title: 'No Hidden Fees',
      description: 'Transparent pricing with no surprise charges'
    },
    {
      title: 'Flexible Scheduling',
      description: 'Book lessons that fit your schedule'
    },
    {
      title: 'Quality Guaranteed',
      description: 'Satisfaction guaranteed or your money back'
    },
    {
      title: 'Expert Instructors',
      description: 'All instructors are certified professionals'
    }
  ];

  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It
            <span className="block text-blue-400">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Getting started is easy! Follow these simple steps to begin your skiing or snowboarding journey 
            with professional instruction.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-10">
                    {index + 1}
                  </div>
                  
                  {/* Step Card */}
                  <div className={`${step.bgColor} rounded-2xl p-6 h-full border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all duration-300 group`}>
                    <div className={`w-14 h-14 ${step.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                  </div>

                  {/* Arrow (except for last step) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-900 rounded-3xl p-12 shadow-lg border border-gray-700">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Why Students Love Our Platform
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join thousands of satisfied students who have transformed their skiing and snowboarding skills 
              with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join our community of skiers and snowboarders who are mastering the mountains 
              with professional instruction.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="/find-instructor"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Find Your Instructor
              </a>
              <a 
                href="/signup"
                className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white rounded-xl font-semibold transition-colors"
              >
                Create Account
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
