import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { User } from '../../../types';
import { updateUser } from '../../../services/users';

interface EditUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio || '',
    level: user.level || '',
    specialties: user.specialties || [],
    languages: user.languages || [],
    yearsOfExperience: user.yearsOfExperience || 0,
    hourlyRate: user.hourlyRate || 0,
    qualifications: user.qualifications || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await updateUser(user.id, formData);
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
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
                    src={formData.avatar}
                    alt={formData.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Avatar URL"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    role: e.target.value as 'admin' | 'instructor' | 'student'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {formData.role === 'instructor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        yearsOfExperience: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate
                    </label>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        hourlyRate: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
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
                              setFormData(prev => ({ ...prev, specialties: newSpecialties }));
                            }}
                            className="rounded border-gray-300 text-blue-600"
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
                              setFormData(prev => ({ ...prev, languages: newLanguages }));
                            }}
                            className="rounded border-gray-300 text-blue-600"
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
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {formData.role === 'instructor' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications
                  </label>
                  <textarea
                    value={formData.qualifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}