import { useState, useEffect } from 'react';
import { Achievement, KidProfile, StudentProgress } from '../../types';
import { getKidProfiles, deleteKidProfile } from '../../services/kids';
import { achievementService, progressService } from '../../services/progress';
import { KidProfileForm } from './KidProfileForm';
import { Plus, Edit, Trash2, AlertCircle, Baby } from 'lucide-react';
import { formatSkillLabel } from '../../utils/skillDescriptions';

interface KidProfileListProps {
  parentId: string;
  /** When true, omit the page-level title (e.g. dashboard already has a section header). */
  embedded?: boolean;
  /** After loading, render nothing if there are no profiles (e.g. dashboard). */
  hideWhenEmpty?: boolean;
  /** Wrap in the student dashboard card (header + border); use with `embedded` + `hideWhenEmpty`. */
  dashboardCard?: boolean;
}

export function KidProfileList({
  parentId,
  embedded,
  hideWhenEmpty,
  dashboardCard
}: KidProfileListProps) {
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<KidProfile | null>(null);
  const [parentProgress, setParentProgress] = useState<StudentProgress | null>(null);
  const [kidAchievementsByKid, setKidAchievementsByKid] = useState<Record<string, Achievement[]>>({});

  useEffect(() => {
    loadProfiles();
  }, [parentId]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [data, progress, kidAch] = await Promise.all([
        getKidProfiles(parentId),
        progressService.getStudentProgress(parentId),
        achievementService.getKidAchievementsGrouped(parentId)
      ]);
      setProfiles(data);
      setParentProgress(progress);
      setKidAchievementsByKid(kidAch);
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
    if (hideWhenEmpty) {
      return null;
    }
    return (
      <div className={`flex h-40 items-center justify-center ${embedded ? '' : 'h-64'}`}>
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  if (hideWhenEmpty && profiles.length === 0 && !error) {
    return null;
  }

  const body = (
    <div className="space-y-6">
      <div
        className={`flex items-center ${embedded ? 'justify-end' : 'justify-between'}`}
      >
        {!embedded && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Kid profiles</h2>
        )}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" />
          Add kid
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="rounded-xl border border-gray-100 bg-gray-50/80 p-5 dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{profile.name}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedProfile(profile)}
                  className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  aria-label={`Edit ${profile.name}`}
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(profile.id)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/50"
                  aria-label={`Remove ${profile.name}`}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Age: {profile.age}
                <span className="text-gray-400 dark:text-gray-500"> · </span>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {profile.discipline === 'snowboarding' ? 'Snowboard' : 'Ski'}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: profile.helmet_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Helmet</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: profile.jacket_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Jacket</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-600"
                  style={{ backgroundColor: profile.pants_color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Pants</span>
              </div>

              {(() => {
                const stats = parentProgress?.kids?.[profile.id];
                const badges = (kidAchievementsByKid[profile.id] ?? []).slice(0, 2);
                const lessons = stats?.lessonsCompleted ?? 0;
                const levelLabel = stats?.level
                  ? formatSkillLabel(String(stats.level).replace(/_/g, ' '))
                  : formatSkillLabel(String(profile.level).replace(/_/g, ' '));
                return (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-600">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{lessons}</span>{' '}
                      {lessons === 1 ? 'lesson' : 'lessons'}
                      <span className="text-gray-400 dark:text-gray-500"> · </span>
                      {levelLabel}
                      <span className="text-gray-400 dark:text-gray-500"> · </span>
                      {profile.discipline === 'snowboarding' ? '🏂' : '⛷️'}
                    </span>
                    {badges.length > 0 && (
                      <span className="flex items-center gap-1" title="Recent badges">
                        {badges.map((a) => (
                          <span key={a.id} className="text-lg leading-none" title={a.name}>
                            {a.icon}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {profile.allergies && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Allergies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{profile.allergies}</p>
              </div>
            )}

            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Emergency contact</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.emergency_contact_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.emergency_contact_relationship}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{profile.emergency_contact_phone}</p>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !error && !hideWhenEmpty && (
        <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No kid profiles yet. Add one so instructors see age, level, gear colors, and emergency info when you book.
        </p>
      )}

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

  if (dashboardCard) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600">
              <Baby className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Kids&apos; profiles</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lesson details, gear colors, allergies, and emergency contacts for children taking lessons
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">{body}</div>
      </div>
    );
  }

  return body;
}