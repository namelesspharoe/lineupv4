import React from 'react';
import { ThermometerSnowflake, Star, Wind, Sun } from 'lucide-react';
import { resortData } from '../../../../data/resortData';

export function ResortBanner() {
  return (
    <div className="relative h-80 rounded-2xl overflow-hidden">
      <img
        src={resortData.image}
        alt={resortData.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{resortData.name}</h1>
          <p className="text-white/80 text-lg">Today's Conditions</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card p-4">
            <ThermometerSnowflake className="w-5 h-5 text-white mb-2" />
            <p className="text-lg font-semibold text-white">{resortData.weather.temperature}</p>
            <p className="text-sm text-white/70">Temperature</p>
          </div>
          <div className="glass-card p-4">
            <Star className="w-5 h-5 text-white mb-2" />
            <p className="text-lg font-semibold text-white">{resortData.weather.condition}</p>
            <p className="text-sm text-white/70">Conditions</p>
          </div>
          <div className="glass-card p-4">
            <ThermometerSnowflake className="w-5 h-5 text-white mb-2" />
            <p className="text-lg font-semibold text-white">{resortData.weather.snowDepth}</p>
            <p className="text-sm text-white/70">Snow Depth</p>
          </div>
          <div className="glass-card p-4">
            <Wind className="w-5 h-5 text-white mb-2" />
            <p className="text-lg font-semibold text-white">{resortData.weather.wind}</p>
            <p className="text-sm text-white/70">Wind Speed</p>
          </div>
          <div className="glass-card p-4">
            <Sun className="w-5 h-5 text-white mb-2" />
            <p className="text-lg font-semibold text-white">{resortData.weather.visibility}</p>
            <p className="text-sm text-white/70">Visibility</p>
          </div>
        </div>
      </div>
    </div>
  );
}


