import React from 'react';
import { Slider } from './Slider';
import { X } from 'lucide-react';

// Define the structure of our filter state
interface FilterPanelProps {
  /** Omit outer card — use inside a parent panel (e.g. beside resort picker). */
  embedded?: boolean;
  /** Wider gaps and fewer columns per row so filters are not squeezed (e.g. Book Lesson full-width). */
  layout?: 'default' | 'comfortable';
  filters: {
    discipline: string[];    // Array of selected disciplines (ski/snowboard)
    level: string[];        // Array of selected skill levels
    price: number[];        // Array with min and max price [min, max]
    availability: string[]; // Array of selected availability options
    languages: string[];    // Array of selected languages
    gender: string[];       // Array of selected genders
    certification: string[]; // Array of selected certification levels
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    discipline: string[];
    level: string[];
    price: number[];
    availability: string[];
    languages: string[];
    gender: string[];
    certification: string[];
  }>>;
  onClear?: () => void;
}

const PRICE_SLIDER_MAX = 500;

export function FilterPanel({ embedded = false, layout = 'default', filters, setFilters, onClear }: FilterPanelProps) {
  // Helper function to toggle filter values in arrays
  // If value exists in array, remove it; if it doesn't exist, add it
  const toggleFilter = (category: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).reduce((acc, arr) => acc + arr.length, 0) + 
    (filters.price[0] > 0 || filters.price[1] < PRICE_SLIDER_MAX ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({
      discipline: [],
      level: [],
      price: [0, PRICE_SLIDER_MAX],
      availability: [],
      languages: [],
      gender: [],
      certification: []
    });
    onClear?.();
  };

  const shellClass = embedded
    ? undefined
    : 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 md:p-6';

  return (
    <div className={shellClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Main filter container with responsive grid layout */}
      <div
        className={
          layout === 'comfortable'
            ? 'grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-10'
            : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }
      >
        {/* Discipline Filter Section */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Discipline</h4>
          <div className="space-y-2">
            {['Ski', 'Snowboard'].map(discipline => (
              <label key={discipline} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -ml-1.5">
                <input
                  type="checkbox"
                  checked={filters.discipline.includes(discipline)}
                  onChange={() => toggleFilter('discipline', discipline)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{discipline}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Filter Section */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Gender</h4>
          <div className="space-y-2">
            {['Male', 'Female', 'Non-binary'].map(gender => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -ml-1.5">
                <input
                  type="checkbox"
                  checked={filters.gender.includes(gender)}
                  onChange={() => toggleFilter('gender', gender)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter Section */}
        <div
          className={
            layout === 'comfortable'
              ? 'sm:col-span-2 lg:col-span-3'
              : 'sm:col-span-2 lg:col-span-1'
          }
        >
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
            Price Range: ${filters.price[0]} - ${filters.price[1]}/hour
          </h4>
          <Slider
            min={0}
            max={PRICE_SLIDER_MAX}
            value={filters.price}
            onChange={(value) => setFilters(prev => ({ ...prev, price: value }))}
          />
        </div>

        {/* Languages Filter Section */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">Languages</h4>
          <div className="space-y-2">
            {['English', 'French', 'Spanish', 'Mandarin'].map(language => (
              <label key={language} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-1.5 -ml-1.5">
                <input
                  type="checkbox"
                  checked={filters.languages.includes(language)}
                  onChange={() => toggleFilter('languages', language)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{language}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}