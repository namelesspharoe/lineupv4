import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, Users, DollarSign, Target, FileText, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { createLesson } from '../../services/lessons';
import { prepareLessonCheckout } from '../../lib/stripe';
import { User, Lesson, Mountain, LessonSport } from '../../types';
import type { LessonBookingDraft } from '../../types/cart';
import { format } from 'date-fns';
import { StudentSearch } from '../common/StudentSearch';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  getMountainById,
  getMountains,
  getStudentFacingMountainLessonRate,
  resolveLessonPriceFromMountain
} from '../../services/mountains';
import { getUserById } from '../../services/users';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';

interface UnifiedLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'book'; // 'create' for admin/instructor, 'book' for student
  instructor?: User; // Required for booking mode
  existingLesson?: Lesson; // For editing existing lessons
  isAdmin?: boolean; // For admin functionality
  /** When true, stacks above another dialog (z-index + Escape order). */
  nested?: boolean;
  /** Create mode: pre-fill lesson date (yyyy-MM-dd), e.g. from calendar day picker. */
  defaultDate?: string;
}

interface LessonFormData {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'private' | 'group' | 'workshop';
  sport: LessonSport;
  maxStudents: number;
  skillLevel: 'first_time' | 'developing_turns' | 'linking_turns' | 'confident_turns' | 'consistent_blue';
  price: number;
  description: string;
  skillsFocus: string[];
  notes: string;
  selectedStudents: User[];
}

const timeSlots = [
  { label: 'Morning (9:00 AM - 12:00 PM)', start: '09:00', end: '12:00' },
  { label: 'Afternoon (1:00 PM - 4:00 PM)', start: '13:00', end: '16:00' },
  { label: 'Full Day (9:00 AM - 5:00 PM)', start: '09:00', end: '17:00' }
];

const skillLevels = [
  { value: 'first_time', label: 'First Time' },
  { value: 'developing_turns', label: 'Developing Turns' },
  { value: 'linking_turns', label: 'Linking Turns' },
  { value: 'confident_turns', label: 'Confident Turns' },
  { value: 'consistent_blue', label: 'Consistent Blue Runs' }
];

const lessonTypeLabels: Record<'private' | 'group' | 'workshop', string> = {
  private: 'Private Lesson',
  group: 'Group Lesson',
  workshop: 'Workshop'
};

function getSessionTypeFromTimes(
  startTime: string,
  endTime: string
): 'morning' | 'afternoon' | 'full_day' {
  if (startTime === '09:00' && endTime === '12:00') return 'morning';
  if (startTime === '13:00' && endTime === '16:00') return 'afternoon';
  if (startTime === '09:00' && endTime === '17:00') return 'full_day';
  return 'morning';
}

export function UnifiedLessonModal({ 
  isOpen, 
  onClose, 
  mode, 
  instructor, 
  existingLesson,
  isAdmin = false,
  nested = false,
  defaultDate
}: UnifiedLessonModalProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [isLoadingInstructors, setIsLoadingInstructors] = useState(false);
  const [instructorMountainLabel, setInstructorMountainLabel] = useState<string | null>(null);
  const [isLoadingMountain, setIsLoadingMountain] = useState(false);

  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '12:00',
    type: 'private',
    sport: 'skiing',
    maxStudents: 10,
    skillLevel: 'first_time',
    price: instructor?.price || 0,
    description: '',
    skillsFocus: [],
    notes: '',
    selectedStudents: []
  });

  const getAutoLessonTitle = useCallback(() => {
    const typeLabel = lessonTypeLabels[formData.type] || 'Lesson';
    const dateLabel = formData.date ? format(new Date(formData.date), 'MMM d, yyyy') : 'Date TBD';

    let instructorName: string | undefined;

    if (mode === 'book' && instructor) {
      instructorName = instructor.name;
    } else if (isAdmin && selectedInstructorId) {
      const selectedInstructor = instructors.find(i => i.id === selectedInstructorId);
      instructorName = selectedInstructor?.name;
    } else if (user) {
      instructorName = user.name;
    }

    const safeInstructorName = instructorName || 'Instructor';
    return `${safeInstructorName} ${typeLabel} - ${dateLabel}`;
  }, [
    formData.type,
    formData.date,
    mode,
    instructor,
    isAdmin,
    selectedInstructorId,
    instructors,
    user
  ]);

  useEffect(() => {
    if (existingLesson) {
      setFormData({
        title: existingLesson.title,
        date: existingLesson.date,
        startTime: existingLesson.startTime || '09:00',
        endTime: existingLesson.endTime || '12:00',
        type: existingLesson.type,
        sport: existingLesson.sport ?? 'skiing',
        maxStudents: existingLesson.maxStudents,
        skillLevel: existingLesson.skillLevel,
        price: existingLesson.price,
        description: existingLesson.description,
        skillsFocus: existingLesson.skillsFocus,
        notes: existingLesson.notes || '',
        selectedStudents: []
      });
      setSelectedInstructorId(existingLesson.instructorId || '');
    } else if (instructor) {
      setFormData((prev) => ({
        ...prev,
        // Students book at resort rates; price is filled from mountains in a separate effect.
        price:
          mode === 'book' && !isAdmin ? prev.price : instructor.price || prev.price,
        selectedStudents: []
      }));
    }
  }, [existingLesson, instructor, mode, isAdmin]);

  useEffect(() => {
    if (!isOpen || existingLesson || mode !== 'create' || !defaultDate) return;
    setFormData((prev) => (prev.date === defaultDate ? prev : { ...prev, date: defaultDate }));
  }, [isOpen, defaultDate, existingLesson, mode]);

  useEffect(() => {
    if (existingLesson) return;

    const autoTitle = getAutoLessonTitle();

    setFormData(prev => {
      let changed = false;
      const updates: Partial<LessonFormData> = {};

      if (prev.title !== autoTitle) {
        updates.title = autoTitle;
        changed = true;
      }

      if (mode === 'book' && instructor) {
        const autoDescription = `${lessonTypeLabels[prev.type] || 'Lesson'} experience with ${instructor.name || 'Instructor'}`;
        if (prev.description !== autoDescription) {
          updates.description = autoDescription;
          changed = true;
        }

        if (!(mode === 'book' && !isAdmin)) {
          const instructorRate = instructor.price ?? prev.price;
          if (instructorRate && prev.price !== instructorRate) {
            updates.price = instructorRate;
            changed = true;
          }
        }
      }

      return changed ? { ...prev, ...updates } : prev;
    });
  }, [mode, instructor, getAutoLessonTitle, existingLesson, isAdmin]);

  // Student booking: lesson price from mountain only (not instructor hourlyRate).
  useEffect(() => {
    if (!isOpen || mode !== 'book' || isAdmin || !instructor?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [fullUser, mountains] = await Promise.all([
          getUserById(instructor.id),
          getMountains().catch(() => [] as Mountain[])
        ]);
        if (cancelled) return;
        const merged: User = fullUser ? { ...instructor, ...fullUser } : instructor;
        const rate = getStudentFacingMountainLessonRate(merged, mountains);
        if (rate != null) {
          setFormData((prev) => ({ ...prev, price: rate }));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, isAdmin, instructor]);

  // Load instructors for admin functionality
  useEffect(() => {
    const loadInstructors = async () => {
      if (!isAdmin) return;

      try {
        setIsLoadingInstructors(true);
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'instructor'),
          orderBy('name'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        const fetchedInstructors = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        
        setInstructors(fetchedInstructors);
      } catch (err) {
        console.error('Error loading instructors:', err);
        setError('Failed to load instructors');
      } finally {
        setIsLoadingInstructors(false);
      }
    };

    loadInstructors();
  }, [isAdmin]);

  useEffect(() => {
    if (!isOpen) {
      setInstructorMountainLabel(null);
      setIsLoadingMountain(false);
      return;
    }

    const targetInstructor: User | undefined =
      mode === 'book' && instructor
        ? instructor
        : isAdmin && selectedInstructorId
          ? instructors.find((i) => i.id === selectedInstructorId)
          : undefined;

    if (!targetInstructor?.id) {
      setInstructorMountainLabel(null);
      setIsLoadingMountain(false);
      return;
    }

    let cancelled = false;

    const resolveMountain = async () => {
      setIsLoadingMountain(true);
      try {
        // Booking often passes a slim User (no homeMountain/mountainId). Always load Firestore profile.
        const fullUser = await getUserById(targetInstructor.id);
        if (cancelled) return;

        const homeMountain =
          (fullUser?.homeMountain?.trim() || targetInstructor.homeMountain?.trim()) || undefined;
        const mountainId = fullUser?.mountainId || targetInstructor.mountainId;

        if (homeMountain) {
          setInstructorMountainLabel(homeMountain);
          return;
        }

        if (mountainId) {
          const mountain = await getMountainById(mountainId);
          if (!cancelled) {
            setInstructorMountainLabel(mountain?.name ?? null);
          }
          return;
        }

        if (!cancelled) {
          setInstructorMountainLabel(null);
        }
      } catch {
        if (!cancelled) {
          setInstructorMountainLabel(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMountain(false);
        }
      }
    };

    void resolveMountain();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, instructor, isAdmin, selectedInstructorId, instructors]);

  const handleTimeSlotChange = (index: number) => {
    setSelectedTimeSlot(index);
    const slot = timeSlots[index];
    setFormData(prev => ({
      ...prev,
      startTime: slot.start,
      endTime: slot.end
    }));
  };

  const handleStudentSelect = (student: User) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: [...prev.selectedStudents, student]
    }));
  };

  const handleStudentRemove = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.filter(s => s.id !== studentId)
    }));
  };

  const calculateTotal = () => {
    const hours = calculateHours();
    return formData.price * hours;
  };

  const calculateHours = () => {
    const start = new Date(`2000-01-01T${formData.startTime}`);
    const end = new Date(`2000-01-01T${formData.endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  const studentPayFirst =
    mode === 'book' && user?.role === 'student' && !isAdmin && !existingLesson;

  const buildBookingDraft = (): LessonBookingDraft | null => {
    if (!instructor) return null;
    return {
      title: formData.title,
      instructorId: instructor.id,
      date: formData.date,
      sport: formData.sport,
      sessionType: getSessionTypeFromTimes(formData.startTime, formData.endTime),
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type,
      maxStudents: formData.maxStudents,
      skillLevel: formData.skillLevel,
      skillsFocus: formData.skillsFocus,
      notes: formData.notes,
      description: formData.description
    };
  };

  const handleAddToCart = () => {
    const draft = buildBookingDraft();
    if (!draft || !instructor) {
      setError('Missing lesson details');
      return;
    }
    addItem(draft, { instructorName: instructor.name });
    onClose();
  };

  const handleBuyNow = async () => {
    if (!user || !instructor) return;
    const draft = buildBookingDraft();
    if (!draft) {
      setError('Missing lesson details');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/checkout/cancel`;
      const url = await prepareLessonCheckout([draft], successUrl, cancelUrl);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentPayFirst) {
      return;
    }
    if (!user) {
      setError('You must be logged in to create lessons');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Debug: Log admin status and user info
      console.log('UnifiedLessonModal - Debug info:', {
        isAdmin,
        userRole: user?.role,
        userId: user?.id,
        selectedInstructorId,
        mode
      });

      let priceForLesson = formData.price;
      if (priceForLesson <= 0 && mode === 'book' && !isAdmin && instructor) {
        const resolved = await resolveLessonPriceFromMountain({
          price: 0,
          instructorId: instructor.id,
          type: formData.type
        });
        if (resolved != null && resolved > 0) {
          priceForLesson = resolved;
        }
      }

      const lessonData = {
        title: formData.title,
        instructorId: isAdmin && selectedInstructorId ? selectedInstructorId : (mode === 'book' && instructor ? instructor.id : user.id),
        studentIds: mode === 'book' ? [user.id] : formData.selectedStudents.map(s => s.id),
        date: formData.date,
        sport: formData.sport,
        sessionType: getSessionTypeFromTimes(formData.startTime, formData.endTime),
        startTime: formData.startTime,
        endTime: formData.endTime,
        status: (mode === 'book' ? 'scheduled' : 'available') as 'available' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
        type: formData.type,
        maxStudents: formData.maxStudents,
        skillLevel: formData.skillLevel,
        price: priceForLesson,
        description: formData.description,
        skillsFocus: formData.skillsFocus,
        notes: formData.notes
      };

      console.log('Creating lesson with data:', lessonData);
      const lessonId = await createLesson(lessonData);
      console.log('Lesson created successfully:', lessonId);
      
      onClose();
      // You might want to show a success message or redirect
    } catch (err) {
      console.error('Error creating lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lesson');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const titleText =
    (mode === 'create' ? 'Create New Lesson' : 'Book Lesson') + (existingLesson ? ' — Edit' : '');

  return (
    <ResponsiveModalPanel
      onClose={onClose}
      labelledBy="unified-lesson-title"
      nested={nested}
      maxWidthClass="sm:max-w-2xl"
    >
      <div className="flex shrink-0 items-center justify-end border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 sm:absolute sm:inset-x-0 sm:top-0 sm:z-20 sm:border-0 sm:bg-transparent sm:px-4 sm:py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-6 pt-2 sm:px-6 sm:pb-6 sm:pt-16">
        <h2
          id="unified-lesson-title"
          className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl"
        >
          {titleText}
        </h2>

        <form
          onSubmit={(e) => {
            if (studentPayFirst) {
              e.preventDefault();
              return;
            }
            void handleSubmit(e);
          }}
          className="space-y-6"
        >
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Lesson Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Title
                </label>
                <>
                  <input
                    type="text"
                    value={formData.title}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Automatically generated from instructor name, lesson type, and date.
                  </p>
                </>
              </div>

              {mode === 'book' && instructor && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Instructor mountain</p>
                      {isLoadingMountain ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Loading…</p>
                      ) : instructorMountainLabel ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{instructorMountainLabel}</p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Not assigned to a mountain yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructor
                  </label>
                  {isLoadingInstructors ? (
                    <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading instructors...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedInstructorId}
                      onChange={(e) => setSelectedInstructorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select an instructor</option>
                      {instructors.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name || 'Unknown Instructor'}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedInstructorId && (
                    <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Instructor mountain</p>
                          {isLoadingMountain ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Loading…</p>
                          ) : instructorMountainLabel ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{instructorMountainLabel}</p>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              Not assigned to a mountain yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lesson Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'private' | 'group' | 'workshop'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="private">Private Lesson</option>
                    <option value="group">Group Lesson</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Discipline</p>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Keeps ski vs snowboard progress separate for the student.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'skiing' as const, label: 'Skiing', icon: '⛷️' },
                      { id: 'snowboarding' as const, label: 'Snowboarding', icon: '🏂' }
                    ] as const
                  ).map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sport: opt.id }))}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        formData.sport === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400/70 dark:bg-blue-950/40'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="mt-1 font-medium text-gray-900 dark:text-white">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Selection - Only show for create mode */}
            {mode === 'create' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assign Students</h3>
                <StudentSearch
                  onStudentSelect={handleStudentSelect}
                  onStudentRemove={handleStudentRemove}
                  selectedStudents={formData.selectedStudents}
                  placeholder="Search students by name or email..."
                />
              </div>
            )}

            {/* Time Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Time Selection</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSlotChange(index)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedTimeSlot === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400/60 dark:bg-blue-900/20 dark:text-blue-200'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">{slot.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {slot.start} - {slot.end}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Level */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Skill Level</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill Level
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    skillLevel: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {skillLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requirements or notes..."
                />
              </div>
            </div>

            {/* Submit / pay-first actions */}
            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-1 sm:py-2"
              >
                Cancel
              </button>
              {studentPayFirst ? (
                <>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-500 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-950/40 sm:flex-1 sm:py-2"
                  >
                    Add to cart
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBuyNow()}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-2"
                  >
                    {isLoading ? 'Redirecting…' : 'Buy now'}
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-2"
                >
                  {isLoading ? 'Creating...' : mode === 'create' ? 'Create Lesson' : 'Book Lesson'}
                </button>
              )}
            </div>
          </form>
      </div>
    </ResponsiveModalPanel>
  );
} 