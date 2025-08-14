import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { addLessonFeedback } from '../../services/lessons';
import { LessonFeedback, User } from '../../types';

interface EnhancedFeedbackFormProps {
  lessonId: string;
  studentId: string;
  onFeedbackSubmitted: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const SKILL_LEVELS = [
  'first_time',
  'developing_turns', 
  'linking_turns',
  'confident_turns',
  'consistent_blue'
];

const SPORTS = [
  { value: 'skiing', label: 'Skiing', icon: '⛷️' },
  { value: 'snowboarding', label: 'Snowboarding', icon: '🏂' }
];

// Skill checklists for each sport and level
const SKILL_CHECKLISTS = {
  snowboarding: {
    first_time: [
      'Putting on/taking off gear',
      'Heelside J turn',
      'Toeside J turn',
      'Getting on/off the lift'
    ],
    developing_turns: [
      'Traverse heelside/toeside',
      'Control speed with edges',
      'Linking turns'
    ],
    linking_turns: [
      'Connect turns on greens',
      'Control speed with turn shape'
    ],
    confident_turns: [
      'Ride green runs comfortable',
      'Begin to transition to steeper slopes (blues)'
    ],
    consistent_blue: [
      'Maintain speed and control across all blue runs',
      'Confidently ride varied terrain (moguls, trees, ungroomed)',
      'Focus on carving efficiency and tighter turn shapes'
    ]
  },
  skiing: {
    first_time: [
      'Putting on/taking off gear',
      'Learn to slide and stop with a wedge'
    ],
    developing_turns: [
      'Turn both skis using a wedge shape',
      'Control speed with turn shape, not just braking'
    ],
    linking_turns: [
      'Link wedge turns smoothly on green terrain',
      'Control speed by completing turns',
      'Try matching skis at the end of each turn'
    ],
    confident_turns: [
      'Link parallel turns on blue runs',
      'Begin to transition to steeper terrain (blue)'
    ],
    consistent_blue: [
      'Make confident parallel turns on all blue runs',
      'Handle moguls, variable snow, and narrow trails',
      'Focus on carving efficiency and shaping turns'
    ]
  }
};

export const EnhancedFeedbackForm: React.FC<EnhancedFeedbackFormProps> = ({
  lessonId,
  studentId,
  onFeedbackSubmitted,
  onCancel,
  isOpen
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<'skiing' | 'snowboarding'>('skiing');
  const [selectedLevel, setSelectedLevel] = useState<string>('first_time');
  const [checkedSkills, setCheckedSkills] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState('');
  const [instructorNotes, setInstructorNotes] = useState('');

  // Get current checklist based on sport and level
  const currentChecklist = SKILL_CHECKLISTS[selectedSport][selectedLevel as keyof typeof SKILL_CHECKLISTS[typeof selectedSport]] || [];

  const handleSkillToggle = (skill: string) => {
    const newCheckedSkills = new Set(checkedSkills);
    if (newCheckedSkills.has(skill)) {
      newCheckedSkills.delete(skill);
    } else {
      newCheckedSkills.add(skill);
    }
    setCheckedSkills(newCheckedSkills);
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setCheckedSkills(new Set()); // Reset checked skills when level changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!user?.id) {
      setError('User not authenticated. Please log in again.');
      setIsSubmitting(false);
      return;
    }

    if (!selectedLevel) {
      setError('Please select a skill level');
      setIsSubmitting(false);
      return;
    }

    if (!recommendations.trim()) {
      setError('Please provide recommendations for the student');
      setIsSubmitting(false);
      return;
    }

    try {
      // Create feedback object
      const feedback: Omit<LessonFeedback, 'id' | 'createdAt' | 'updatedAt'> = {
        lessonId,
        studentId,
        instructorId: user.id,
        date: new Date().toISOString().split('T')[0],
        sport: selectedSport,
        
        // Performance Assessment (default values)
        performance: {
          technique: 3,
          control: 3,
          confidence: 3,
          safety: 3,
          overall: 3
        },
        
        // Skill Assessment
        skillAssessment: {
          currentLevel: selectedLevel,
          nextSteps: Array.from(checkedSkills),
          recommendations: recommendations,
          areasOfFocus: currentChecklist.filter(skill => !checkedSkills.has(skill))
        },
        
        // Detailed Feedback
        strengths: Array.from(checkedSkills),
        areasForImprovement: currentChecklist.filter(skill => !checkedSkills.has(skill)),
        instructorNotes: instructorNotes,
        homework: '',
        
        // Progress Tracking
        progressUpdate: {
          skillsImproved: Array.from(checkedSkills),
          newSkillsLearned: Array.from(checkedSkills),
          levelUp: false,
          newLevel: ''
        }
      };
      
      console.log('Submitting feedback:', feedback);
      
      await addLessonFeedback(lessonId, feedback);
      setSuccess('Feedback submitted successfully! Student progress has been updated.');
      
      // Close form after a short delay to show success message
      setTimeout(() => {
        onFeedbackSubmitted();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Lesson Feedback Form</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Sport Selection */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Sport Focus</h3>
              <div className="grid grid-cols-2 gap-4">
                {SPORTS.map(sport => (
                  <button
                    key={sport.value}
                    type="button"
                    onClick={() => {
                      setSelectedSport(sport.value as 'skiing' | 'snowboarding');
                      setCheckedSkills(new Set()); // Reset when sport changes
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSport === sport.value
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{sport.icon}</div>
                    <div className="font-medium">{sport.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level Selection */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Skill Level Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SKILL_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleLevelChange(level)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedLevel === level
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">
                      {level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Checklist */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">
                {selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} Skills Checklist - {
                  selectedLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </h3>
              
              <div className="space-y-3">
                {currentChecklist.map((skill, index) => (
                  <label key={index} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={checkedSkills.has(skill)}
                      onChange={() => handleSkillToggle(skill)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">
                  <strong>Completed Skills:</strong> {checkedSkills.size} / {currentChecklist.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Progress:</strong> {Math.round((checkedSkills.size / currentChecklist.length) * 100)}%
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Provide specific recommendations for improvement..."
                required
              />
            </div>

            {/* Instructor Notes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Instructor Notes (Optional)</h3>
              <textarea
                value={instructorNotes}
                onChange={(e) => setInstructorNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Additional notes or observations..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 