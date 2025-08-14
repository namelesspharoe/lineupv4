import React, { useState } from 'react';
import { KidProfile } from '../../types';
import { createKidProfile, updateKidProfile } from '../../services/kids';
import { X } from 'lucide-react';

interface KidProfileFormProps {
  parentId: string;
  existingProfile?: KidProfile;
  onClose: () => void;
  onSave: () => void;
}

export function KidProfileForm({ parentId, existingProfile, onClose, onSave }: KidProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<KidProfile>>(
    existingProfile || {
      parentId,
      name: '',
      age: 5,
      allergies: '',
      helmet_color: '',
      jacket_color: '',
      pants_color: '',
      level: 'first_time',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (existingProfile) {
        await updateKidProfile(existingProfile.id, formData);
      } else {
        await createKidProfile(formData as Required<Omit<KidProfile, 'id' | 'created_at' | 'updated_at'>>);
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {existingProfile ? 'Edit Kid Profile' : 'Add Kid Profile'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Helmet Color
                </label>
                <input
                  type="color"
                  value={formData.helmet_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, helmet_color: e.target.value }))}
                  className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jacket Color
                </label>
                <input
                  type="color"
                  value={formData.jacket_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, jacket_color: e.target.value }))}
                  className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pants Color
                </label>
                <input
                  type="color"
                  value={formData.pants_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, pants_color: e.target.value }))}
                  className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    level: e.target.value as KidProfile['level']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="first_time">First Time</option>
                  <option value="developing_turns">Developing Turns</option>
                  <option value="linking_turns">Linking Turns</option>
                  <option value="confident_turns">Confident Turns</option>
                  <option value="consistent_blue">Consistent Blue</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="List any allergies or medical conditions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_name: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_phone: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    emergency_contact_relationship: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
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
                {isSubmitting ? 'Saving...' : (existingProfile ? 'Save Changes' : 'Add Profile')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}