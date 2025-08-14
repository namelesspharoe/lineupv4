import React from 'react';
import { InstructorRankings } from '../components/instructor/InstructorRankings';
import { Trophy, Star, TrendingUp } from 'lucide-react';

export function InstructorRankingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Instructor Rankings</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Discover the top-performing ski and snowboard instructors based on their performance metrics, 
              student satisfaction, and teaching excellence.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Performance Based</h3>
              <p className="text-gray-600 text-sm">
                Rankings calculated using multiple performance metrics including ratings, lesson success, and student satisfaction.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Updated Daily</h3>
              <p className="text-gray-600 text-sm">
                Rankings are recalculated daily to reflect the most current instructor performance and achievements.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Trophy className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Achievement Badges</h3>
              <p className="text-gray-600 text-sm">
                Instructors earn badges and tier levels based on their performance, experience, and student feedback.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings Section */}
      <div className="container mx-auto px-6 py-12">
        <InstructorRankings limit={20} showRankChange={true} />
      </div>

      {/* How Rankings Work */}
      <div className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">How Rankings Work</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Performance Score Calculation</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Average Rating</span>
                    <span className="font-semibold text-blue-600">30%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Experience (Total Lessons)</span>
                    <span className="font-semibold text-blue-600">20%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Completion Rate</span>
                    <span className="font-semibold text-blue-600">15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Repeat Student Rate</span>
                    <span className="font-semibold text-blue-600">15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Lesson Success Rate</span>
                    <span className="font-semibold text-blue-600">10%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Response Time</span>
                    <span className="font-semibold text-blue-600">10%</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tier System</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">D</div>
                    <div>
                      <div className="font-semibold text-purple-900">Diamond</div>
                      <div className="text-sm text-purple-700">90+ Performance Score</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">P</div>
                    <div>
                      <div className="font-semibold text-blue-900">Platinum</div>
                      <div className="text-sm text-blue-700">80-89 Performance Score</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">G</div>
                    <div>
                      <div className="font-semibold text-yellow-900">Gold</div>
                      <div className="text-sm text-yellow-700">70-79 Performance Score</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">S</div>
                    <div>
                      <div className="font-semibold text-gray-900">Silver</div>
                      <div className="text-sm text-gray-700">60-69 Performance Score</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">B</div>
                    <div>
                      <div className="font-semibold text-amber-900">Bronze</div>
                      <div className="text-sm text-amber-700">Below 60 Performance Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
