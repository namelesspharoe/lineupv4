import { WeatherInfo } from '../types';

/** On-mountain / lesson support — adjust for your resort. */
export interface ResortSupportContacts {
  /** Full `tel:` href for ski patrol / snow safety (e.g. `tel:+16045550123`). */
  skiPatrolTelHref: string;
  /** If set, “Message supervisor” opens in-app chat with this user id. */
  lessonSupervisorUserId?: string;
  /** Used when `lessonSupervisorUserId` is not set (opens the user’s mail client). */
  lessonSupervisorMailto: string;
}

export interface ResortInfo {
  name: string;
  image: string;
  weather: WeatherInfo;
  supportContacts: ResortSupportContacts;
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
  },
  supportContacts: {
    // Replace with your resort’s published ski patrol / dispatch number.
    skiPatrolTelHref: "tel:+16049321234",
    lessonSupervisorUserId: undefined,
    lessonSupervisorMailto:
      "mailto:lessons@whistlerblackcomb.com?subject=Lesson%20supervisor%20(LineUp)"
  }
};