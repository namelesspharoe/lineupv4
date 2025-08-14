import React, { useState, useEffect } from 'react';
import { KidProfile } from '../../types';
import { getKidProfiles, deleteKidProfile } from '../../services/kids';
import { KidProfileForm } from './KidProfileForm';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';

interface KidProfileListProps {
  parentId: string;
}

export function KidProfileList({ parentId }: KidProfileListProps) {
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<KidProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, [parentId]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getKidProfiles(parentId);
      setProfiles(data);
    } catch (err: any) {
      console.error('Error loading kid profiles:', err);
      setError(err.message || 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) {
      return;
    }

    try {
      await deleteKidProfile(id);
      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      setError(err.message || 'Failed to delete profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Kid Profiles</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Kid Profile
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProfile(profile)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-gray-600">Age: {profile.age}</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: profile.helmet_color }}
                />
                <span className="text-sm text-gray-600">Helmet</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: profile.jacket_color }}
                />
                <span className="text-sm text-gray-600">Jacket</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: profile.pants_color }}
                />
                <span className="text-sm text-gray-600">Pants</span>
              </div>
            </div>

            {profile.allergies && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700">Allergies</h4>
                <p className="text-sm text-gray-600">{profile.allergies}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700">Emergency Contact</h4>
              <p className="text-sm text-gray-600">{profile.emergency_contact_name}</p>
              <p className="text-sm text-gray-600">{profile.emergency_contact_relationship}</p>
              <p className="text-sm text-gray-600">{profile.emergency_contact_phone}</p>
            </div>
          </div>
        ))}
      </div>

      {showAddForm && (
        <KidProfileForm
          parentId={parentId}
          onClose={() => setShowAddForm(false)}
          onSave={loadProfiles}
        />
      )}

      {selectedProfile && (
        <KidProfileForm
          parentId={parentId}
          existingProfile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onSave={loadProfiles}
        />
      )}
    </div>
  );
}