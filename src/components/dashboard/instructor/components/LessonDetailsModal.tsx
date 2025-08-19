import React, { useEffect, useState } from 'react';
import { Users, Calendar, Clock, Target, MapPin, X, MessageSquare, Trash2, Plus } from 'lucide-react';
import type { User, Lesson } from '../../../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { completeLesson, startLesson } from '../../../../services/lessons';

interface LessonDetailsModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onAddStudent: (lessonId: string, currentStudentIds: string[], maxStudents: number) => void;
  onRemoveStudent: (lessonId: string, studentId: string, studentName: string) => void;
}

export function LessonDetailsModal({ lesson, onClose, onAddStudent, onRemoveStudent }: LessonDetailsModalProps) {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackStudentIndex, setFeedbackStudentIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [feedbackComplete, setFeedbackComplete] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const loadStudents = async () => {
      if (!lesson) return;
      setIsLoadingStudents(true);
      try {
        const studentPromises = lesson.studentIds.map(async (studentId) => {
          const studentDoc = await getDocs(query(
            collection(db, 'users'),
            where('id', '==', studentId)
          ));
          return studentDoc.docs[0]?.data() as User;
        });
        const loadedStudents = (await Promise.all(studentPromises)).filter(Boolean);
        setStudents(loadedStudents);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadStudents();
  }, [lesson]);

  if (!lesson) return null;

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'first_time':
        return 'First Time on Snow';
      case 'developing_turns':
        return 'Developing Basic Turns';
      case 'linking_turns':
        return 'Linking Turns Together';
      case 'confident_turns':
        return 'Confident Turn Control';
      case 'consistent_blue':
        return 'Consistent on Blue Runs';
      default:
        return level;
    }
  };

  const canStart = lesson.status === 'scheduled' || lesson.status === 'available';
  const canComplete = lesson.status === 'in_progress';

  const handleStartLesson = async () => {
    setIsStarting(true);
    try {
      await startLesson(lesson.id);
      onClose();
    } catch (error) {
      console.error('Error starting lesson:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCompleteLesson = () => {
    setShowFeedbackForm(true);
    setFeedbackStudentIndex(0);
    setFeedbackComplete(false);
  };

  const handleFeedbackSubmitted = async () => {
    if (feedbackStudentIndex < students.length - 1) {
      setFeedbackStudentIndex(feedbackStudentIndex + 1);
    } else {
      setShowFeedbackForm(false);
      setIsCompleting(true);
      await completeLesson(lesson.id);
      setIsCompleting(false);
      setFeedbackComplete(true);
    }
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
                <p className="text-gray-600">
                  {new Date(lesson.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Session Type</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{lesson.sessionType || 'morning'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span>Level</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{getLevelDescription(lesson.skillLevel)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span>Type</span>
                </div>
                <p className="text-lg font-medium text-gray-900">{lesson.type}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
                <p className="text-lg font-medium text-gray-900">Main Lodge</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Students</h3>
                {lesson.type !== 'private' && students.length < lesson.maxStudents && (
                  <button
                    onClick={() => onAddStudent(lesson.id, lesson.studentIds, lesson.maxStudents)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Student
                  </button>
                )}
              </div>

              {isLoadingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : students.length > 0 ? (
                <div className="space-y-3">
                  {students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">Level: {student.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/messages?student=${student.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveStudent(lesson.id, student.id, student.name);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-gray-600 mt-2">
                    {students.length} of {lesson.maxStudents} students
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg text-gray-500">
                  No students assigned yet
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Focus</h3>
              <div className="flex flex-wrap gap-2">
                {lesson.skillsFocus.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {lesson.notes && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700">
                  {lesson.notes}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-100 pt-6 mt-6 flex justify-end gap-3">
              {canStart && (
                <button
                  onClick={handleStartLesson}
                  disabled={isStarting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isStarting ? 'Starting...' : 'Start Lesson'}
                </button>
              )}

              {canComplete && (
                <button
                  onClick={handleCompleteLesson}
                  disabled={isCompleting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCompleting ? 'Completing...' : 'Complete Lesson'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



