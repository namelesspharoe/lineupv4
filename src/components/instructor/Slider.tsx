import React from 'react';

interface SliderProps {
  min: number;
  max: number;
  value: number[];
  onChange: (value: number[]) => void;
}

export function Slider({ min, max, value, onChange }: SliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>${value[0]}</span>
        <span>${value[1]}</span>
      </div>
      <div className="relative h-1 bg-gray-200 rounded-full">
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
          className="absolute w-full h-1 opacity-0 cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="absolute w-full h-1 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}