import { useState, type FormEvent } from 'react';
import { KidProfile, type LessonSport } from '../../types';
import { createKidProfile, updateKidProfile } from '../../services/kids';
import { X } from 'lucide-react';
import { ResponsiveModalPanel } from '../common/ResponsiveModalPanel';

interface KidProfileFormProps {
  parentId: string;
  existingProfile?: KidProfile;
  onClose: () => void;
  onSave: () => void;
}

export function KidProfileForm({ parentId, existingProfile, onClose, onSave }: KidProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<KidProfile>>(() => ({
    parentId,
    name: '',
    age: 5,
    allergies: '',
    helmet_color: '',
    jacket_color: '',
    pants_color: '',
    level: 'first_time',
    discipline: 'skiing',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    ...(existingProfile || {}),
    parentId,
    discipline: (existingProfile?.discipline ?? 'skiing') as LessonSport
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: Partial<KidProfile> = {
        ...formData,
        discipline: formData.discipline ?? 'skiing'
      };
      if (existingProfile) {
        await updateKidProfile(existingProfile.id, payload);
      } else {
        await createKidProfile(
          payload as Required<Omit<KidProfile, 'id' | 'created_at' | 'updated_at'>>
        );
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Error saving kid profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModalPanel onClose={onClose} labelledBy="kid-profile-form-title">
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
          id="kid-profile-form-title"
          className="mb-4 text-xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-2xl"
        >
          {existingProfile ? 'Edit Kid Profile' : 'Add Kid Profile'}
        </h2>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Helmet Color
                </label>
                <input
                  type="color"
                  value={formData.helmet_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, helmet_color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 px-1 py-1 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jacket Color
                </label>
                <input
                  type="color"
                  value={formData.jacket_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, jacket_color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 px-1 py-1 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pants Color
                </label>
                <input
                  type="color"
                  value={formData.pants_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, pants_color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 px-1 py-1 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skill Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    level: e.target.value as KidProfile['level']
                  }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="first_time">First Time</option>
                  <option value="developing_turns">Developing Turns</option>
                  <option value="linking_turns">Linking Turns</option>
                  <option value="confident_turns">Confident Turns</option>
                  <option value="consistent_blue">Consistent Blue</option>
                </select>
              </div>

              <div className="col-span-2">
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Discipline</p>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Ski or snowboard so lessons and gear stay aligned.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'skiing' as const, label: 'Skiing', icon: '⛷️' },
                      { id: 'snowboarding' as const, label: 'Snowboarding', icon: '🏂' }
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, discipline: opt.id }))}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        formData.discipline === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400/70 dark:bg-blue-950/40'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {opt.icon}
                      </span>
                      <div className="mt-1 font-medium text-gray-900 dark:text-white">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allergies
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  rows={3}
                  placeholder="List any allergies or medical conditions..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_name: e.target.value 
                  }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_phone: e.target.value 
                  }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Emergency Contact Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_relationship: e.target.value 
                  }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg px-4 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto sm:py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:py-2"
              >
                {isSubmitting ? 'Saving...' : existingProfile ? 'Save Changes' : 'Add Profile'}
              </button>
            </div>
          </form>
      </div>
    </ResponsiveModalPanel>
  );
}