import React from 'react';
import { Activity, Target, Trophy, Mountain, Snowflake, TrendingUp, Award, Users } from 'lucide-react';

export function ProgressShowcase() {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full text-sm font-semibold mb-6 border border-gray-700">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Track Your Progress
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Master the Mountain
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            From your first time on snow to advanced techniques, track your progress with detailed analytics, 
            personalized goals, and achievement milestones that celebrate every step of your journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">Real-Time Analytics</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Track performance metrics, lesson history, and skill improvements with detailed analytics 
              that show your progression over time.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">Personalized Goals</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Set custom goals based on your skill level and aspirations. Our AI adapts to your learning 
              style and suggests the perfect next steps.
            </p>
          </div>

          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:bg-gray-750 transition-all duration-300 group">
            <div className="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4 text-white">Achievement System</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Unlock badges, earn rewards, and celebrate milestones. Share your achievements with the 
              community and inspire others on their journey.
            </p>
          </div>
        </div>

        {/* Progress Preview */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Your Learning Journey</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded-full">
                <Snowflake className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Intermediate Level</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {[
                { skill: 'Basic Turns', progress: 95, color: 'bg-green-500', icon: Mountain },
                { skill: 'Speed Control', progress: 85, color: 'bg-blue-500', icon: Activity },
                { skill: 'Advanced Carving', progress: 70, color: 'bg-purple-500', icon: TrendingUp },
                { skill: 'Freestyle Basics', progress: 60, color: 'bg-pink-500', icon: Award },
                { skill: 'Mogul Techniques', progress: 45, color: 'bg-orange-500', icon: Target }
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-gray-300">{item.skill}</span>
                      </div>
                      <span className="font-bold text-white">{item.progress}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out group-hover:scale-105`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Recent Achievements */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-yellow-400" />
                Recent Achievements
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'First Blue Run', desc: 'Completed your first intermediate slope', icon: Mountain },
                  { title: 'Speed Demon', desc: 'Reached 30+ mph on groomed runs', icon: Activity },
                  { title: 'Lesson Master', desc: 'Completed 10 lessons this season', icon: Users }
                ].map((achievement, i) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={i} className="bg-gray-700 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-white">{achievement.title}</p>
                          <p className="text-xs text-gray-400">{achievement.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Ready to Track Your Progress?
            </h3>
            <p className="text-gray-300 mb-6">
              Start your personalized learning journey and see your skills improve with every lesson.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="/book-lesson"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Book Your First Lesson
              </a>
              <a 
                href="/progress"
                className="px-6 py-3 border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-semibold transition-all duration-300 hover:bg-gray-700"
              >
                View Full Progress
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}