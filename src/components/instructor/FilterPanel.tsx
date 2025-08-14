import React from 'react';
import { Slider } from './Slider';

// Define the structure of our filter state
interface FilterPanelProps {
  filters: {
    discipline: string[];    // Array of selected disciplines (ski/snowboard)
    level: string[];        // Array of selected skill levels
    price: number[];        // Array with min and max price [min, max]
    availability: string[]; // Array of selected availability options
    languages: string[];    // Array of selected languages
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    discipline: string[];
    level: string[];
    price: number[];
    availability: string[];
    languages: string[];
  }>>;
}

export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
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

  return (
    // Main filter container with responsive grid layout
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 mt-4 border-t border-gray-200">
      {/* Discipline Filter Section */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Discipline</h3>
        <div className="space-y-2">
          {/* Map through available disciplines and create checkboxes */}
          {['Ski', 'Snowboard'].map(discipline => (
            <label key={discipline} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.discipline.includes(discipline)}
                onChange={() => toggleFilter('discipline', discipline)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{discipline}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Skill Level Filter Section */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Level</h3>
        <div className="space-y-2">
          {/* Map through available skill levels and create checkboxes */}
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map(level => (
            <label key={level} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.level.includes(level)}
                onChange={() => toggleFilter('level', level)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range Filter Section */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Price Range ($/hour)</h3>
        {/* Custom range slider component for price selection */}
        <Slider
          min={0}
          max={200}
          value={filters.price}
          onChange={(value) => setFilters(prev => ({ ...prev, price: value }))}
        />
      </div>

      {/* Languages Filter Section */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Languages</h3>
        <div className="space-y-2">
          {/* Map through available languages and create checkboxes */}
          {['English', 'French', 'Spanish', 'Mandarin'].map(language => (
            <label key={language} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.languages.includes(language)}
                onChange={() => toggleFilter('languages', language)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">{language}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}