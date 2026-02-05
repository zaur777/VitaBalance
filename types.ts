
export type Language = 'az' | 'ru' | 'tr' | 'en' | 'de' | 'fr' | 'th';

export enum OrganType {
  BRAIN = 'Brain',
  EYES = 'Eyes',
  HEART = 'Heart',
  LUNGS = 'Lungs',
  LIVER = 'Liver',
  STOMACH = 'Stomach',
  KIDNEYS = 'Kidneys',
  BONES = 'Bones & Joints',
  SKIN = 'Skin & Hair'
}

export interface OrganAssessment {
  organ: OrganType;
  needsSupport: boolean;
}

export interface DayPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface AssessmentResult {
  deficiencies: string[];
  recommendations: string[];
  dietPlan: {
    meal: string;
    suggestion: string;
  }[];
  weeklyPlan: DayPlan[];
  summary: string;
}

export interface UserProfile {
  name: string;
  age: string;
  dietType: string;
  tiredness: string;
  dailyMovementKm: string;
  workType: string;
  weightKg: string;
  heightCm: string;
  chronicConditions: string[];
}
