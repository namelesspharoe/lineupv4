import React from 'react';
import { Mountain, Snowflake, ArrowRight, CheckCircle, Star, Users } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-sm font-semibold mb-6 border border-gray-700">
              <Snowflake className="w-5 h-5 text-blue-400" />
              Start Your Mountain Adventure Today
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
              Ready to Master
              <span className="block text-blue-400">
                the Slopes?
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who have transformed their skiing and snowboarding skills. 
              Your journey to becoming a confident rider starts here.
            </p>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Certified Instructors</p>
                <p className="text-sm text-gray-400">Professional guidance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Proven Results</p>
                <p className="text-sm text-gray-400">Fast skill improvement</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Community</p>
                <p className="text-sm text-gray-400">Join fellow riders</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <a 
              href="/find-instructor"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Mountain className="w-5 h-5" />
              Find Your Instructor
              <ArrowRight className="w-5 h-5" />
            </a>
            
            <a 
              href="/signup"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-600 hover:border-gray-500"
            >
              Create Free Account
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-gray-400 text-sm">Certified Instructors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">25k+</p>
              <p className="text-gray-400 text-sm">Lessons Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.9/5</p>
              <p className="text-gray-400 text-sm">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">98%</p>
              <p className="text-gray-400 text-sm">Satisfaction Rate</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-gray-800 rounded-2xl border border-gray-700">
            <p className="text-gray-300 text-sm">
              <strong>No commitment required.</strong> Book your first lesson and experience the difference. 
              Cancel or reschedule anytime with our flexible booking system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
