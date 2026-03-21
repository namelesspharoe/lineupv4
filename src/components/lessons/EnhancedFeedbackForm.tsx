import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';
import { addLessonFeedback, updateLessonFeedback } from '../../services/lessons';
import { LessonFeedback, User } from '../../types';

interface EnhancedFeedbackFormProps {
  lessonId: string;
  studentId: string;
  onFeedbackSubmitted: () => void;
  onCancel: () => void;
  isOpen: boolean;
  existingFeedback?: LessonFeedback | null;
  /** From the booked lesson — pre-selects ski vs snowboard when no feedback exists yet. */
  defaultSport?: 'skiing' | 'snowboarding';
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
  isOpen,
  existingFeedback,
  defaultSport = 'skiing'
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

  useEffect(() => {
    if (isOpen && existingFeedback) {
      setSelectedSport((existingFeedback.sport === 'snowboarding' ? 'snowboarding' : 'skiing'));
      setSelectedLevel(existingFeedback.skillAssessment?.currentLevel ?? 'first_time');
      setCheckedSkills(new Set(existingFeedback.strengths ?? []));
      setRecommendations(existingFeedback.skillAssessment?.recommendations ?? '');
      setInstructorNotes(existingFeedback.instructorNotes ?? '');
    } else if (isOpen && !existingFeedback) {
      setSelectedSport(defaultSport === 'snowboarding' ? 'snowboarding' : 'skiing');
      setSelectedLevel('first_time');
      setCheckedSkills(new Set());
      setRecommendations('');
      setInstructorNotes('');
    }
  }, [isOpen, existingFeedback, defaultSport]);

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
      
      if (existingFeedback?.id) {
        await updateLessonFeedback(existingFeedback.id, feedback);
        setSuccess('Feedback updated successfully.');
      } else {
        await addLessonFeedback(lessonId, feedback);
        setSuccess('Feedback submitted successfully! Student progress has been updated.');
      }
      
      setTimeout(() => {
        onFeedbackSubmitted();
      }, 1500);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalPanel onClose={onCancel} labelledBy="enhanced-feedback-title" maxWidthClass="sm:max-w-4xl">
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <h2 id="enhanced-feedback-title" className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
          {existingFeedback ? 'Edit Feedback' : 'Lesson Feedback Form'}
        </h2>

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
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-md border border-gray-300 px-6 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {isSubmitting ? (existingFeedback ? 'Updating...' : 'Submitting...') : (existingFeedback ? 'Update Feedback' : 'Submit Feedback')}
              </button>
            </div>
          </form>
      </div>
    </ResponsiveModalPanel>
  );
}; 