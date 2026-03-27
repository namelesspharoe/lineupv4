import { useMemo, useState } from 'react';
import type { Lesson, User } from '../../../../types';
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Calendar,
  CheckCircle,
  XCircle,
  Trash,
  Clock,
  Target
} from 'lucide-react';
import {
  getStatusColor,
  formatStatus,
  getInstructorName,
  getStudentNames
} from '../utils/adminUtils';

type LessonStatusFilter = 'all' | 'available' | 'scheduled' | 'completed' | 'cancelled';

interface LessonTableProps {
  lessons: Lesson[];
  users: User[];
  onEditLesson: (lesson: Lesson) => void;
  onUpdateLessonStatus: (
    lessonId: string,
    status: 'available' | 'scheduled' | 'completed' | 'cancelled'
  ) => void;
  onDeleteLesson: (lessonId: string) => void;
}

function LessonTableToolbar({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: LessonStatusFilter;
  onStatusChange: (s: LessonStatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search lessons…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden />
        <label htmlFor="admin-lesson-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="admin-lesson-status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as LessonStatusFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All status</option>
          <option value="available">Available</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}

function LessonRowActionsMenu({
  lesson,
  open,
  onToggle,
  onEditLesson,
  onUpdateLessonStatus,
  onDeleteLesson,
  onClose
}: {
  lesson: Lesson;
  open: boolean;
  onToggle: () => void;
  onEditLesson: (l: Lesson) => void;
  onUpdateLessonStatus: (
    id: string,
    status: 'available' | 'scheduled' | 'completed' | 'cancelled'
  ) => void;
  onDeleteLesson: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-expanded={open}
        aria-label="Lesson actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onEditLesson(lesson);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Edit className="h-4 w-4" />
            Edit lesson
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateLessonStatus(lesson.id, 'scheduled');
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Calendar className="h-4 w-4" />
            Mark scheduled
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateLessonStatus(lesson.id, 'completed');
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <CheckCircle className="h-4 w-4" />
            Mark completed
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateLessonStatus(lesson.id, 'cancelled');
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <XCircle className="h-4 w-4" />
            Mark cancelled
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteLesson(lesson.id);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash className="h-4 w-4" />
            Delete lesson
          </button>
        </div>
      )}
    </div>
  );
}

export function LessonTable({
  lessons,
  users,
  onEditLesson,
  onUpdateLessonStatus,
  onDeleteLesson
}: LessonTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LessonStatusFilter>('all');
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesSearch = (lesson.title?.toLowerCase() || '').includes(q);
      const matchesStatus = selectedStatus === 'all' || lesson.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [lessons, searchQuery, selectedStatus]);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <LessonTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <div className="max-h-[min(70vh,42rem)] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[640px] table-fixed">
          <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm dark:bg-gray-800/95">
            <tr>
              <th className="w-[36%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Lesson
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Instructor
              </th>
              <th className="w-[18%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Student
              </th>
              <th className="w-[14%] px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="w-[18%] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  onClick={() => onEditLesson(lesson)}
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lesson.title || 'Untitled lesson'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                        {lesson.date ? new Date(lesson.date).toLocaleDateString() : 'No date'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0" aria-hidden />
                        {lesson.sessionType || 'morning'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-4 w-4 shrink-0" aria-hidden />
                        {lesson.skillLevel || 'Any level'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top text-sm text-gray-900 dark:text-gray-100">
                    {getInstructorName(lesson.instructorId, users)}
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-gray-900 dark:text-gray-100">
                    <span className="line-clamp-2">{getStudentNames(lesson.studentIds || [], users)}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lesson.status)}`}
                    >
                      {formatStatus(lesson.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right align-top text-sm font-medium">
                    <LessonRowActionsMenu
                      lesson={lesson}
                      open={openActionsId === lesson.id}
                      onToggle={() =>
                        setOpenActionsId((id) => (id === lesson.id ? null : lesson.id))
                      }
                      onEditLesson={onEditLesson}
                      onUpdateLessonStatus={onUpdateLessonStatus}
                      onDeleteLesson={onDeleteLesson}
                      onClose={() => setOpenActionsId(null)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedStatus !== 'all'
                    ? 'No lessons match your filters.'
                    : 'No lessons yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
