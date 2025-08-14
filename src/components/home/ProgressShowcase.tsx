import React from 'react';
import { Activity, Target, Trophy } from 'lucide-react';

export function ProgressShowcase() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-200 via-white to-blue-200 text-transparent bg-clip-text">
            Transform Your Journey
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Track progress, achieve goals, and celebrate every milestone on your path to mastery.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Activity className="w-6 h-6 mb-4 text-blue-300" />
            <h3 className="text-lg font-semibold mb-2">Real-Time Progress</h3>
            <p className="text-blue-100 text-sm">Track performance metrics and see improvements instantly.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Target className="w-6 h-6 mb-4 text-blue-300" />
            <h3 className="text-lg font-semibold mb-2">Smart Goals</h3>
            <p className="text-blue-100 text-sm">AI-powered system adapts to your unique learning journey.</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Trophy className="w-6 h-6 mb-4 text-blue-300" />
            <h3 className="text-lg font-semibold mb-2">Achievements</h3>
            <p className="text-blue-100 text-sm">Unlock badges and share your victories with the community.</p>
          </div>
        </div>

        {/* Progress Preview */}
        <div className="mt-12 max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="space-y-4">
            {['Advanced Carving', 'Speed Control', 'Freestyle'].map((skill, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{skill}</span>
                  <span>{[85, 70, 60][i]}%</span>
                </div>
                <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-300 rounded-full"
                    style={{ width: `${[85, 70, 60][i]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}