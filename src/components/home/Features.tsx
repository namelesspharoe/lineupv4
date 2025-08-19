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
  CheckCircle
} from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Certified Instructors',
      description: 'All our instructors are certified professionals with years of experience teaching skiing and snowboarding.',
      color: 'bg-blue-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-blue-400'
    },
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book lessons that fit your schedule with morning, afternoon, or full-day options available.',
      color: 'bg-green-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-green-400'
    },
    {
      icon: Users,
      title: 'Personalized Learning',
      description: 'Get customized instruction tailored to your skill level, goals, and learning style.',
      color: 'bg-purple-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-purple-400'
    },
    {
      icon: Award,
      title: 'Progress Tracking',
      description: 'Track your improvement with detailed analytics, skill assessments, and achievement milestones.',
      color: 'bg-yellow-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-yellow-400'
    },
    {
      icon: MapPin,
      title: 'Multiple Locations',
      description: 'Find instructors at your favorite mountain resorts across the country.',
      color: 'bg-red-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-red-400'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Simple, secure booking process with instant confirmation and easy rescheduling.',
      color: 'bg-indigo-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-indigo-400'
    },
    {
      icon: MessageSquare,
      title: 'Direct Communication',
      description: 'Message your instructor directly to discuss lesson plans and ask questions.',
      color: 'bg-pink-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-pink-400'
    },
    {
      icon: TrendingUp,
      title: 'Skill Development',
      description: 'Structured learning paths from beginner to advanced techniques and freestyle.',
      color: 'bg-orange-600',
      bgColor: 'bg-gray-800',
      iconColor: 'text-orange-400'
    }
  ];

  const benefits = [
    {
      icon: Star,
      title: 'Proven Results',
      description: 'Students see significant improvement in just a few lessons'
    },
    {
      icon: Zap,
      title: 'Fast Progress',
      description: 'Accelerated learning with expert guidance and feedback'
    },
    {
      icon: Heart,
      title: 'Safe Learning',
      description: 'Learn proper technique and safety practices from day one'
    },
    {
      icon: CheckCircle,
      title: 'Quality Guaranteed',
      description: 'Satisfaction guaranteed with our certified instructor network'
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose
            <span className="block text-blue-400">
              Our Platform
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience the difference that professional ski and snowboard instruction makes. Our platform connects you 
            with certified instructors who are passionate about helping you master the slopes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group">
                <div className={`${feature.bgColor} rounded-2xl p-6 h-full border border-gray-700 transition-all duration-300`}>
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-800 rounded-3xl p-12 border border-gray-700">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              The Benefits You'll Experience
            </h3>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Join thousands of students who have transformed their skiing and snowboarding skills 
              with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-gray-600">
                    <IconComponent className="w-8 h-8 text-blue-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                  <p className="text-gray-400 text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Start Your Journey?
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
                href="/book-lesson"
                className="px-8 py-3 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white rounded-xl font-semibold transition-colors"
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
