import { WeatherInfo } from '../types';

export interface ResortInfo {
  name: string;
  image: string;
  weather: WeatherInfo;
}

export const resortData: ResortInfo = {
  name: "Whistler Blackcomb",
  image: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=2000",
  weather: {
    temperature: "-2°C",
    condition: "Light Snow",
    snowDepth: "280cm",
    wind: "12 km/h",
    visibility: "Good"
  }
};