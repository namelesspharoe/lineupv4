import { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { User } from '../../../types';
import { updateUser } from '../../../services/users';
import { studentSkillLevelUserFields } from '../../../utils/studentSkillLevel';
import { ResponsiveModalPanel } from '../../common/ResponsiveModalPanel';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  avatar?: string;
  yearsOfExperience?: string;
  hourlyRate?: string;
}

export function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'student',
    avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    bio: user.bio || '',
    level: user.level || 'beginner',
    specialties: user.specialties || [],
    languages: user.languages || [],
    yearsOfExperience: user.yearsOfExperience || 0,
    hourlyRate: user.hourlyRate || 0,
    payBaseRate: user.instructorPay?.baseRatePerHour ?? user.hourlyRate ?? 0,
    payTeachRate: user.instructorPay?.teachRatePerHour ?? user.hourlyRate ?? 0,
    qualifications: user.qualifications || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Update form data when user prop changes
  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'student',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: user.bio || '',
      level: user.level || 'beginner',
      specialties: user.specialties || [],
      languages: user.languages || [],
      yearsOfExperience: user.yearsOfExperience || 0,
      hourlyRate: user.hourlyRate || 0,
      payBaseRate: user.instructorPay?.baseRatePerHour ?? user.hourlyRate ?? 0,
      payTeachRate: user.instructorPay?.teachRatePerHour ?? user.hourlyRate ?? 0,
      qualifications: user.qualifications || ''
    });
    setFormErrors({});
    setError(null);
  }, [user]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.role === 'instructor') {
      if (formData.yearsOfExperience < 0) {
        errors.yearsOfExperience = 'Years of experience cannot be negative';
      }
      if (formData.hourlyRate < 0) {
        errors.hourlyRate = 'Hourly rate cannot be negative';
      }
      if (formData.payBaseRate < 0 || formData.payTeachRate < 0) {
        errors.hourlyRate = 'Pay rates cannot be negative';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare user data with proper defaults
      const userData: Record<string, unknown> = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        bio: formData.bio.trim(),
        specialties: formData.specialties || [],
        languages: formData.languages || [],
        yearsOfExperience: formData.yearsOfExperience || 0,
        hourlyRate: formData.role === 'instructor' ? formData.payTeachRate || 0 : formData.hourlyRate || 0,
        qualifications: formData.qualifications.trim()
      };

      if (formData.role === 'instructor') {
        userData.instructorPay = {
          baseRatePerHour: formData.payBaseRate || 0,
          teachRatePerHour: formData.payTeachRate || 0
        };
      }

      if (formData.role === 'student') {
        Object.assign(userData, studentSkillLevelUserFields(String(formData.level)));
      }

      await updateUser(user.id, userData as Partial<User>);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="edit-user-title" maxWidthClass="sm:max-w-4xl">
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
        <h2 id="edit-user-title" className="mb-4 text-2xl font-bold text-gray-900 dark:text-white sm:mb-6">
          Edit User
        </h2>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={formData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={formData.name}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                    }}
                  />
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => handleInputChange('avatar', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.avatar ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Avatar URL"
                  />
                </div>
                {formErrors.avatar && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.avatar}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {formData.role === 'instructor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.yearsOfExperience}
                      onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.yearsOfExperience ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.yearsOfExperience && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.yearsOfExperience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resort / non-lesson rate ($/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payBaseRate}
                      onChange={(e) => handleInputChange('payBaseRate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Global clock-in without a lesson</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson (teaching) rate ($/hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payTeachRate}
                      onChange={(e) => handleInputChange('payTeachRate', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">Clock-in tied to a lesson session</p>
                    {formErrors.hourlyRate && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.hourlyRate}</p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Alpine Skiing', 'Snowboarding', 'Cross-Country', 'Freestyle', 'Racing', 'Children'].map((specialty) => (
                        <label key={specialty} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.specialties.includes(specialty)}
                            onChange={(e) => {
                              const newSpecialties = e.target.checked
                                ? [...formData.specialties, specialty]
                                : formData.specialties.filter(s => s !== specialty);
                              handleInputChange('specialties', newSpecialties);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Languages
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['English', 'French', 'German', 'Italian', 'Spanish', 'Japanese'].map((language) => (
                        <label key={language} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.languages.includes(language)}
                            onChange={(e) => {
                              const newLanguages = e.target.checked
                                ? [...formData.languages, language]
                                : formData.languages.filter(l => l !== language);
                              handleInputChange('languages', newLanguages);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{language}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skill Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              )}

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {formData.role === 'instructor' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications
                  </label>
                  <textarea
                    value={formData.qualifications}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="List your certifications and qualifications..."
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
      </div>
    </ResponsiveModalPanel>
  );
}