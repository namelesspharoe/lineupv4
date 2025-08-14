import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { progressService } from '../../../services/progress';
import { getStudentFeedback } from '../../../services/lessons';
import { StudentProgress, SkillProgress, Achievement, LessonFeedback } from '../../../types';

export const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [skillProgress, setSkillProgress] = useState<SkillProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<LessonFeedback[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProgressData();
    }
  }, [user?.id]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const [
        progressData,
        skillData,
        achievementsData,
        feedbackData,
        analyticsData
      ] = await Promise.all([
        progressService.getStudentProgress(user!.id),
        progressService.getSkillProgress(user!.id),
        progressService.getStudentAchievements(user!.id),
        getStudentFeedback(user!.id),
        progressService.getProgressAnalytics(user!.id)
      ]);

      setProgress(progressData);
      setSkillProgress(skillData);
      setAchievements(achievementsData);
      setRecentFeedback(feedbackData.slice(0, 5)); // Last 5 feedback
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'first_time': 'bg-gray-100 text-gray-800',
      'developing_turns': 'bg-blue-100 text-blue-800',
      'linking_turns': 'bg-green-100 text-green-800',
      'confident_turns': 'bg-yellow-100 text-yellow-800',
      'consistent_blue': 'bg-purple-100 text-purple-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Progress Dashboard</h1>
        <p className="text-gray-600">
          Track your skiing journey and see how far you've come!
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Lessons</p>
              <p className="text-2xl font-bold text-gray-900">
                {progress?.totalLessons || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {progress?.completedLessons || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className={`text-2xl font-bold ${getPerformanceColor(progress?.averageRating || 0)}`}>
                {progress?.averageRating ? progress.averageRating.toFixed(1) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getLevelColor(progress?.overallLevel || 'first_time')}`}>
                {progress?.overallLevel?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'First Time'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Progress */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Skills Progress</h2>
          </div>
          <div className="p-6">
            {skillProgress.length > 0 ? (
              <div className="space-y-4">
                {skillProgress.slice(0, 5).map((skill) => (
                  <div key={skill.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-900">{skill.skillName}</h3>
                      <span className="text-sm text-gray-500">
                        {formatDate(skill.progressDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(skill.currentLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {skill.currentLevel}/5
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{skill.instructorNotes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No skill assessments yet</p>
            )}
          </div>
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Achievements</h2>
          </div>
          <div className="p-6">
            {achievements.length > 0 ? (
              <div className="space-y-4">
                {achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{achievement.name}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(achievement.unlockedDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No achievements yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
        </div>
        <div className="p-6">
          {recentFeedback.length > 0 ? (
            <div className="space-y-6">
              {recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Lesson on {formatDate(feedback.date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Instructor feedback
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getPerformanceColor(feedback.performance.overall)}`}>
                        {feedback.performance.overall}/5
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {Object.entries(feedback.performance).map(([key, value]) => (
                      key !== 'overall' && (
                        <div key={key} className="text-center">
                          <p className="text-xs text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="font-medium text-gray-900">{value}/5</p>
                        </div>
                      )
                    ))}
                  </div>

                  {/* Strengths */}
                  {feedback.strengths.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.strengths.map((strength, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {feedback.areasForImprovement.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                      <div className="flex flex-wrap gap-2">
                        {feedback.areasForImprovement.map((improvement, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            {improvement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructor Notes */}
                  {feedback.instructorNotes && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{feedback.instructorNotes}</p>
                    </div>
                  )}

                  {/* Homework */}
                  {feedback.homework && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Homework</h4>
                      <p className="text-sm text-gray-600">{feedback.homework}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No feedback yet</p>
          )}
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Progress chart coming soon...</p>
        </div>
      </div>
    </div>
  );
}; 