import { useState, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
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

interface EditUserFormState {
  name: string;
  email: string;
  role: string;
  avatar: string;
  bio: string;
  level: string;
  specialties: string[];
  languages: string[];
  yearsOfExperience: number;
  hourlyRate: number;
  payBaseRate: number;
  payTeachRate: number;
  qualifications: string;
}

const AVATAR_FALLBACK =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

const INSTRUCTOR_SPECIALTIES = [
  'Alpine Skiing',
  'Snowboarding',
  'Cross-Country',
  'Freestyle',
  'Racing',
  'Children'
] as const;

const INSTRUCTOR_LANGUAGES = [
  'English',
  'French',
  'German',
  'Italian',
  'Spanish',
  'Japanese'
] as const;

function buildInitialFormState(u: User): EditUserFormState {
  return {
    name: u.name || '',
    email: u.email || '',
    role: u.role || 'student',
    avatar: u.avatar || AVATAR_FALLBACK,
    bio: u.bio || '',
    level: u.level || 'beginner',
    specialties: u.specialties || [],
    languages: u.languages || [],
    yearsOfExperience: u.yearsOfExperience || 0,
    hourlyRate: u.hourlyRate || 0,
    payBaseRate: u.instructorPay?.baseRatePerHour ?? u.hourlyRate ?? 0,
    payTeachRate: u.instructorPay?.teachRatePerHour ?? u.hourlyRate ?? 0,
    qualifications: u.qualifications || ''
  };
}

function inputClass(errored: boolean): string {
  return [
    'w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500',
    'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
    errored ? 'border-red-300 dark:border-red-600' : 'border-gray-300'
  ].join(' ');
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 md:p-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function IdentityFields({
  formData,
  formErrors,
  onChange
}: {
  formData: EditUserFormState;
  formErrors: FormErrors;
  onChange: (field: keyof EditUserFormState, value: string | number | string[]) => void;
}) {
  return (
    <FormSection title="Profile & account">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="md:col-span-2">
          <Label>Profile photo</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <img
              src={formData.avatar || AVATAR_FALLBACK}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-600"
              onError={(e) => {
                e.currentTarget.src = AVATAR_FALLBACK;
              }}
            />
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => onChange('avatar', e.target.value)}
              className={inputClass(!!formErrors.avatar)}
              placeholder="Avatar URL"
            />
          </div>
          <FieldError message={formErrors.avatar} />
        </div>

        <div>
          <Label>Role *</Label>
          <select
            value={formData.role}
            onChange={(e) => onChange('role', e.target.value)}
            className={inputClass(false)}
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <Label>Name *</Label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={inputClass(!!formErrors.name)}
            required
          />
          <FieldError message={formErrors.name} />
        </div>

        <div className="md:col-span-2">
          <Label>Email *</Label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={inputClass(!!formErrors.email)}
            required
          />
          <FieldError message={formErrors.email} />
        </div>
      </div>
    </FormSection>
  );
}

function InstructorFields({
  formData,
  formErrors,
  onChange
}: {
  formData: EditUserFormState;
  formErrors: FormErrors;
  onChange: (field: keyof EditUserFormState, value: string | number | string[]) => void;
}) {
  return (
    <FormSection title="Instructor">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div>
          <Label>Years of experience</Label>
          <input
            type="number"
            min={0}
            value={formData.yearsOfExperience}
            onChange={(e) => onChange('yearsOfExperience', parseInt(e.target.value, 10) || 0)}
            className={inputClass(!!formErrors.yearsOfExperience)}
          />
          <FieldError message={formErrors.yearsOfExperience} />
        </div>

        <div>
          <Label>Resort / non-lesson rate ($/hr)</Label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={formData.payBaseRate}
            onChange={(e) => onChange('payBaseRate', parseFloat(e.target.value) || 0)}
            className={inputClass(!!formErrors.hourlyRate)}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Global clock-in without a lesson</p>
        </div>

        <div>
          <Label>Lesson (teaching) rate ($/hr)</Label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={formData.payTeachRate}
            onChange={(e) => onChange('payTeachRate', parseFloat(e.target.value) || 0)}
            className={inputClass(!!formErrors.hourlyRate)}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Clock-in tied to a lesson session</p>
          <FieldError message={formErrors.hourlyRate} />
        </div>

        <div className="md:col-span-2">
          <Label>Specialties</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INSTRUCTOR_SPECIALTIES.map((specialty) => (
              <label key={specialty} className="flex cursor-pointer items-center gap-2 rounded-md py-0.5">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...formData.specialties, specialty]
                      : formData.specialties.filter((s) => s !== specialty);
                    onChange('specialties', next);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <Label>Languages</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {INSTRUCTOR_LANGUAGES.map((language) => (
              <label key={language} className="flex cursor-pointer items-center gap-2 rounded-md py-0.5">
                <input
                  type="checkbox"
                  checked={formData.languages.includes(language)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...formData.languages, language]
                      : formData.languages.filter((l) => l !== language);
                    onChange('languages', next);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{language}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </FormSection>
  );
}

function StudentFields({
  formData,
  onChange
}: {
  formData: EditUserFormState;
  onChange: (field: keyof EditUserFormState, value: string | number | string[]) => void;
}) {
  return (
    <FormSection title="Student">
      <div>
        <Label>Skill level</Label>
        <select
          value={formData.level}
          onChange={(e) => onChange('level', e.target.value)}
          className={inputClass(false)}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>
    </FormSection>
  );
}

function AboutFields({
  formData,
  role,
  onChange
}: {
  formData: EditUserFormState;
  role: string;
  onChange: (field: keyof EditUserFormState, value: string | number | string[]) => void;
}) {
  return (
    <FormSection title="About">
      <div className="space-y-4">
        <div>
          <Label>Bio</Label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange('bio', e.target.value)}
            rows={4}
            className={inputClass(false)}
            placeholder="Tell us about yourself..."
          />
        </div>
        {role === 'instructor' && (
          <div>
            <Label>Qualifications</Label>
            <textarea
              value={formData.qualifications}
              onChange={(e) => onChange('qualifications', e.target.value)}
              rows={4}
              className={inputClass(false)}
              placeholder="List your certifications and qualifications..."
            />
          </div>
        )}
      </div>
    </FormSection>
  );
}

export function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState<EditUserFormState>(() => buildInitialFormState(user));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    setFormData(buildInitialFormState(user));
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
    } catch (err: unknown) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EditUserFormState, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
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
          Edit user profile
        </h2>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <IdentityFields formData={formData} formErrors={formErrors} onChange={handleInputChange} />

          {formData.role === 'instructor' && (
            <InstructorFields formData={formData} formErrors={formErrors} onChange={handleInputChange} />
          )}

          {formData.role === 'student' && (
            <StudentFields formData={formData} onChange={handleInputChange} />
          )}

          <AboutFields formData={formData} role={formData.role} onChange={handleInputChange} />

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
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveModalPanel>
  );
}
