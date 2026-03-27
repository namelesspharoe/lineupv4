import React from 'react';
import { Activity, Target, Mountain, Snowflake, TrendingUp, Award, Users } from 'lucide-react';

export function ProgressShowcase() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-10 sm:mb-14 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 border border-gray-700">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
            Track progress
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-white leading-tight">
            Master the mountain
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-1 sm:px-0">
            Milestones and skill bars keep every win visible—beginner to advanced.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-2xl font-semibold text-white">Sample skill path</h3>
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 bg-green-600 rounded-full self-start sm:self-auto">
                <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-white">Intermediate</span>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-5">
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
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 shrink-0" />
                        <span className="font-medium text-gray-300 truncate">{item.skill}</span>
                      </div>
                      <span className="font-bold text-white tabular-nums shrink-0">{item.progress}%</span>
                    </div>
                    <div className="h-2 sm:h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-700">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-white">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 shrink-0" />
                Example wins
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { title: 'First blue run', desc: 'Nailed an intermediate trail', icon: Mountain },
                  { title: 'Speed goal', desc: 'Comfortable on groomers', icon: Activity },
                  { title: '10 lessons', desc: 'Season consistency', icon: Users }
                ].map((achievement, i) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={i} className="bg-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-600 rounded-md sm:rounded-lg flex items-center justify-center shrink-0">
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-white">{achievement.title}</p>
                          <p className="text-[11px] sm:text-xs text-gray-400 leading-snug">{achievement.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
