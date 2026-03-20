import React, { useEffect, useMemo, useState } from 'react';
import { Mountain, User } from '../../../../types';
import { Plus, Search, Mountain as MountainIcon, MapPin, UserPlus, UserMinus, Users } from 'lucide-react';

interface MountainManagementProps {
  mountains: Mountain[];
  users: User[];
  onCreateMountain: (data: {
    name: string;
    description?: string;
    location?: string;
    privateLessonPrice?: number;
    groupLessonPrice?: number;
    baseDepthInches?: number;
    snowfall24hInches?: number;
    snowReportUpdatedAt?: string;
  }) => Promise<void>;
  onUpdateMountainSnow: (
    mountainId: string,
    raw: { baseDepthInches: string; snowfall24hInches: string }
  ) => Promise<void>;
  onAssignInstructorToMountain: (instructorId: string, mountainId: string) => Promise<void>;
  onUnassignInstructorFromMountain: (instructorId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function MountainManagement({
  mountains,
  users,
  onCreateMountain,
  onUpdateMountainSnow,
  onAssignInstructorToMountain,
  onUnassignInstructorFromMountain,
  onRefresh
}: MountainManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    location: '',
    privateLessonPrice: '',
    groupLessonPrice: '',
    baseDepthInches: '',
    snowfall24hInches: ''
  });
  const [snowEditForm, setSnowEditForm] = useState({
    baseDepthInches: '',
    snowfall24hInches: ''
  });
  const [assignment, setAssignment] = useState({
    mountainId: '',
    instructorId: ''
  });
  const [selectedMountainId, setSelectedMountainId] = useState<string | null>(mountains[0]?.id || null);

  const instructors = useMemo(
    () => users.filter((user) => user.role === 'instructor'),
    [users]
  );

  const filteredMountains = useMemo(
    () =>
      mountains.filter((mountain) => {
        const q = searchQuery.toLowerCase();
        return (
          mountain.name.toLowerCase().includes(q) ||
          (mountain.location || '').toLowerCase().includes(q) ||
          (mountain.description || '').toLowerCase().includes(q)
        );
      }),
    [mountains, searchQuery]
  );

  const selectedMountain = useMemo(
    () => filteredMountains.find((mountain) => mountain.id === selectedMountainId) || filteredMountains[0] || null,
    [filteredMountains, selectedMountainId]
  );

  useEffect(() => {
    if (!selectedMountain || selectedMountain.id !== selectedMountainId) {
      const nextSelectedMountainId = filteredMountains[0]?.id || mountains[0]?.id || null;
      setSelectedMountainId(nextSelectedMountainId);
    }
  }, [filteredMountains, mountains, selectedMountain, selectedMountainId]);

  useEffect(() => {
    if (!selectedMountain) {
      setSnowEditForm({ baseDepthInches: '', snowfall24hInches: '' });
      return;
    }
    setSnowEditForm({
      baseDepthInches:
        selectedMountain.baseDepthInches != null ? String(selectedMountain.baseDepthInches) : '',
      snowfall24hInches:
        selectedMountain.snowfall24hInches != null ? String(selectedMountain.snowfall24hInches) : ''
    });
  }, [selectedMountain]);

  const getMountainInstructors = (mountain: Mountain) => {
    return instructors.filter((instructor) => {
      const isListedOnMountain = mountain.instructorIds?.includes(instructor.id);
      const isMatchedByUser = instructor.mountainId === mountain.id || instructor.homeMountain === mountain.name;
      return isListedOnMountain || isMatchedByUser;
    });
  };

  const parseOptionalInches = (label: string, s: string): number | undefined => {
    const t = s.trim();
    if (t === '') return undefined;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) {
      alert(`${label} must be a non-negative number or left blank.`);
      throw new Error('validation');
    }
    return n;
  };

  const handleCreateMountain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      return;
    }

    let baseDepthInches: number | undefined;
    let snowfall24hInches: number | undefined;
    try {
      baseDepthInches = parseOptionalInches('Base depth (inches)', createForm.baseDepthInches);
      snowfall24hInches = parseOptionalInches('24h snowfall (inches)', createForm.snowfall24hInches);
    } catch {
      return;
    }

    const snowReportUpdatedAt =
      baseDepthInches !== undefined || snowfall24hInches !== undefined
        ? new Date().toISOString()
        : undefined;

    try {
      setIsSubmitting(true);
      await onCreateMountain({
        name: createForm.name,
        description: createForm.description,
        location: createForm.location,
        privateLessonPrice: createForm.privateLessonPrice ? Number(createForm.privateLessonPrice) : 0,
        groupLessonPrice: createForm.groupLessonPrice ? Number(createForm.groupLessonPrice) : 0,
        baseDepthInches,
        snowfall24hInches,
        snowReportUpdatedAt
      });
      setCreateForm({
        name: '',
        description: '',
        location: '',
        privateLessonPrice: '',
        groupLessonPrice: '',
        baseDepthInches: '',
        snowfall24hInches: ''
      });
      await onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSnowReport = async () => {
    if (!selectedMountain) return;
    try {
      setIsSubmitting(true);
      await onUpdateMountainSnow(selectedMountain.id, snowEditForm);
      await onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!assignment.mountainId || !assignment.instructorId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onAssignInstructorToMountain(assignment.instructorId, assignment.mountainId);
      setAssignment({ mountainId: '', instructorId: '' });
      await onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignInstructor = async (instructorId: string) => {
    try {
      setIsSubmitting(true);
      await onUnassignInstructorFromMountain(instructorId);
      await onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Mountains</h2>
              <p className="text-sm text-gray-500">Create mountains and assign instructors to them.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MountainIcon className="w-4 h-4" />
              {mountains.length} total
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleCreateMountain} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mountain name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Vail"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={createForm.location}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Colorado"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional mountain description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Private lesson price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createForm.privateLessonPrice}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, privateLessonPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group lesson price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createForm.groupLessonPrice}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, groupLessonPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base depth (in)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={createForm.baseDepthInches}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, baseDepthInches: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional — sorts Book Lesson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">24h snowfall (in)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={createForm.snowfall24hInches}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, snowfall24hInches: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !createForm.name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Mountain
              </button>
            </div>
          </form>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Assign Instructor</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instructor</label>
                <select
                  value={assignment.instructorId}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, instructorId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                      {instructor.homeMountain ? ` - ${instructor.homeMountain}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mountain</label>
                <select
                  value={assignment.mountainId}
                  onChange={(e) => setAssignment((prev) => ({ ...prev, mountainId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select mountain</option>
                  {mountains.map((mountain) => (
                    <option key={mountain.id} value={mountain.id}>
                      {mountain.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAssignInstructor}
                  disabled={isSubmitting || !assignment.instructorId || !assignment.mountainId}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Assign Instructor
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mountains..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-4">
            {filteredMountains.length > 0 ? (
              filteredMountains.map((mountain) => {
                const mountainInstructors = getMountainInstructors(mountain);

                return (
                  <div
                    key={mountain.id}
                    onClick={() => setSelectedMountainId(mountain.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedMountainId(mountain.id);
                      }
                    }}
                    className={`cursor-pointer text-left border rounded-xl p-5 bg-white transition-colors ${
                      selectedMountain?.id === mountain.id
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{mountain.name}</h3>
                        {mountain.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4" />
                            {mountain.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {mountainInstructors.length} instructors
                      </div>
                    </div>

                    {mountain.description && <p className="text-sm text-gray-600 mb-4">{mountain.description}</p>}

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-gray-500">Private lesson</div>
                        <div className="font-semibold text-gray-900">
                          ${mountain.privateLessonPrice?.toFixed(2) ?? '0.00'}
                        </div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="text-gray-500">Group lesson</div>
                        <div className="font-semibold text-gray-900">
                          ${mountain.groupLessonPrice?.toFixed(2) ?? '0.00'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Assigned instructors</div>
                      {mountainInstructors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {mountainInstructors.map((instructor) => (
                            <span
                              key={instructor.id}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm"
                            >
                              {instructor.name}
                              <button
                                type="button"
                                onClick={() => handleUnassignInstructor(instructor.id)}
                                disabled={isSubmitting}
                                className="hover:text-blue-900 disabled:opacity-50"
                                aria-label={`Unassign ${instructor.name}`}
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No instructors assigned yet.</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                No mountains found.
              </div>
            )}

            <div className="border border-gray-200 rounded-xl p-5 bg-white h-fit">
              {selectedMountain ? (
                <>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedMountain.name}</h3>
                      {selectedMountain.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          {selectedMountain.location}
                        </div>
                      )}
                    </div>
                    <MountainIcon className="w-5 h-5 text-gray-400" />
                  </div>

                  {selectedMountain.description && (
                    <p className="text-sm text-gray-600 mb-4">{selectedMountain.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-gray-500">Private lesson</div>
                      <div className="font-semibold text-gray-900">
                        ${selectedMountain.privateLessonPrice?.toFixed(2) ?? '0.00'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-gray-500">Group lesson</div>
                      <div className="font-semibold text-gray-900">
                        ${selectedMountain.groupLessonPrice?.toFixed(2) ?? '0.00'}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Snow report</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Drives Book Lesson resort order (deepest base first). Save with empty fields to clear.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Base depth (in)</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={snowEditForm.baseDepthInches}
                          onChange={(e) =>
                            setSnowEditForm((prev) => ({ ...prev, baseDepthInches: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="—"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">24h snowfall (in)</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={snowEditForm.snowfall24hInches}
                          onChange={(e) =>
                            setSnowEditForm((prev) => ({ ...prev, snowfall24hInches: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="—"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSnowReport}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Save snow report
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">Members</h4>
                      <span className="text-sm text-gray-500">{getMountainInstructors(selectedMountain).length} total</span>
                    </div>
                    {getMountainInstructors(selectedMountain).length > 0 ? (
                      <div className="space-y-2">
                        {getMountainInstructors(selectedMountain).map((instructor) => (
                          <div key={instructor.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                            <div>
                              <div className="font-medium text-gray-900">{instructor.name}</div>
                              <div className="text-xs text-gray-500">{instructor.email}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUnassignInstructor(instructor.id)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              <UserMinus className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No instructors assigned yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select a mountain to view details.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
