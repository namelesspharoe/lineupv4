import React, { useState } from 'react';
import { X, Calendar, Clock, Target, Users, MapPin, Star, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { User, Lesson, LessonFeedback, StudentReview } from '../../../../types';
import { StudentReviewForm } from '../../../lessons/StudentReviewForm';

interface LessonDetailsModalProps {
  lesson: (Lesson & { instructor?: User }) | null;
  onClose: () => void;
  onLessonUpdate: () => void;
}

export function LessonDetailsModal({ lesson, onClose, onLessonUpdate }: LessonDetailsModalProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!lesson) return null;

  const canCancel = lesson.status === 'scheduled';
  const canReview = lesson.status === 'completed' && !lesson.studentReviews?.some((r: StudentReview) => r.studentId === lesson.studentIds[0]);
  const hasFeedback = lesson.feedback && lesson.feedback.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
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
                <div className="flex-1">
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

              {/* Lesson Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    {lesson.startTime && lesson.endTime ? `${lesson.startTime} - ${lesson.endTime}` : 'Time not specified'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Target className="w-4 h-4" />
                    <span>Skill Level</span>
                  </div>
                  <p className="text-lg font-medium text-gray-900">{lesson.skillLevel}</p>
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

              {lesson.instructor && (
                <div className="border-t border-gray-100 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor</h3>
                  <div className="flex items-center gap-4">
                    <img
                      src={lesson.instructor.avatar}
                      alt={lesson.instructor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{lesson.instructor.name}</p>
                      <p className="text-gray-600">{lesson.instructor.bio}</p>
                    </div>
                  </div>
                </div>
              )}

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
                  <p className="text-gray-600">{lesson.notes}</p>
                </div>
              )}

              {hasFeedback && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructor Feedback</h3>
                  {lesson.feedback?.map((feedback: LessonFeedback, index: number) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 mb-4">
                      {/* Performance Assessment */}
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Performance Assessment</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Technique</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.technique ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Control</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.control ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Confidence</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.confidence ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Safety</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.safety ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Overall</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= feedback.performance.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Feedback */}
                      <div className="space-y-4">
                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 block mb-2">Strengths:</span>
                            <ul className="list-disc list-inside space-y-1">
                              {feedback.strengths.map((strength, strengthIndex) => (
                                <li key={strengthIndex} className="text-green-700 bg-green-50 p-2 rounded border">{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600 block mb-2">Areas for Improvement:</span>
                            <ul className="list-disc list-inside space-y-1">
                              {feedback.areasForImprovement.map((area, areaIndex) => (
                                <li key={areaIndex} className="text-orange-700 bg-orange-50 p-2 rounded border">{area}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {feedback.instructorNotes && (
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Instructor Notes:</span>
                            <p className="text-gray-900 bg-white p-3 rounded border">{feedback.instructorNotes}</p>
                          </div>
                        )}

                        {feedback.homework && (
                          <div>
                            <span className="text-sm text-gray-600 block mb-1">Homework:</span>
                            <p className="text-gray-900 bg-white p-3 rounded border">{feedback.homework}</p>
                          </div>
                        )}
                      </div>

                      {/* Progress Update */}
                      {feedback.progressUpdate && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Progress Update</h4>
                          <div className="space-y-3">
                            {feedback.progressUpdate.skillsImproved && feedback.progressUpdate.skillsImproved.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 block mb-2">Skills Improved:</span>
                                <ul className="list-disc list-inside space-y-1">
                                  {feedback.progressUpdate.skillsImproved.map((skill, skillIndex) => (
                                    <li key={skillIndex} className="text-blue-700 bg-blue-50 p-2 rounded border">{skill}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.newSkillsLearned && feedback.progressUpdate.newSkillsLearned.length > 0 && (
                              <div>
                                <span className="text-sm text-gray-600 block mb-2">New Skills Learned:</span>
                                <ul className="list-disc list-inside space-y-1">
                                  {feedback.progressUpdate.newSkillsLearned.map((skill, skillIndex) => (
                                    <li key={skillIndex} className="text-purple-700 bg-purple-50 p-2 rounded border">{skill}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {feedback.progressUpdate.levelUp && (
                              <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                                <span className="text-green-800 font-medium">🎉 Level Up!</span>
                                {feedback.progressUpdate.newLevel && (
                                  <span className="ml-2 text-green-700">New level: {feedback.progressUpdate.newLevel}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sport Information */}
                      {feedback.sport && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Sport Focus: </span>
                          <span className="font-medium text-gray-900 capitalize">{feedback.sport}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Student Reviews */}
              {lesson.studentReviews && lesson.studentReviews.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reviews</h3>
                  <div className="space-y-4">
                    {lesson.studentReviews.map((review: StudentReview, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{review.rating}/5</span>
                        </div>
                        <p className="text-gray-900">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-100 pt-6 mt-6">
                <div className="flex flex-wrap gap-3">
                  {canCancel && (
                    <button
                      onClick={() => {
                        // Handle cancel
                        onClose();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel Lesson
                    </button>
                  )}
                  
                  {canReview && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Write Review
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      // Handle message instructor
                      onClose();
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Message Instructor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && (
        <StudentReviewForm
          lessonId={lesson.id}
          studentId={lesson.studentIds[0]}
          onClose={() => setShowReviewForm(false)}
          onSubmit={() => {
            setShowReviewForm(false);
            onLessonUpdate();
          }}
        />
      )}
    </>
  );
}


