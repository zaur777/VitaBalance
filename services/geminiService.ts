
import { GoogleGenAI, Type } from "@google/genai";
import { OrganAssessment, UserProfile, AssessmentResult, Language } from "../types";

const LANGUAGE_MAP: Record<Language, string> = {
  az: 'Azerbaijani',
  ru: 'Russian',
  tr: 'Turkish',
  en: 'English',
  de: 'German',
  fr: 'French',
  th: 'Thai'
};

export const analyzeHealthData = async (
  profile: UserProfile,
  assessments: OrganAssessment[],
  language: Language
): Promise<AssessmentResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please set it in your environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const flaggedOrgans = assessments
    .filter(a => a.needsSupport)
    .map(a => a.organ)
    .join(', ');

  const weight = parseFloat(profile.weightKg);
  const height = parseFloat(profile.heightCm) / 100;
  const bmi = weight / (height * height);
  const conditions = profile.chronicConditions.length > 0 ? profile.chronicConditions.join(', ') : 'None reported';

  const prompt = `
    Analyze the following health profile to provide a professional nutritional strategy.
    The final output MUST BE IN ${LANGUAGE_MAP[language]}.
    
    User Profile:
    - Name: ${profile.name}
    - Age: ${profile.age}
    - Weight: ${profile.weightKg} kg
    - Height: ${profile.heightCm} cm
    - Calculated BMI: ${bmi.toFixed(1)}
    - Reported Chronic Conditions/Allergies: ${conditions}
    - Diet: ${profile.dietType}
    - Energy/Tiredness Level: ${profile.tiredness}
    - Daily Movement: ${profile.dailyMovementKm} km
    - Work Environment: ${profile.workType}
    
    Organs Flagged for Nutritional Support:
    ${flaggedOrgans || 'None specifically flagged'}

    REQUIREMENTS:
    1. In the 'summary', 'recommendations', and 'weeklyPlan' descriptions, you MUST frequently use the word "healthy" (in ${LANGUAGE_MAP[language]}) (at least 5-7 times).
    2. Crucially, adapt all advice to the user's chronic conditions (e.g., low glycemic for diabetes, low sodium for blood pressure).
    3. Suggest specific vitamins and minerals (e.g., Vitamin D, Magnesium, B12, Lutein) that directly benefit the flagged areas and respect the chronic conditions.
    4. Create a comprehensive 7-DAY WEEKLY healthy diet plan (Monday to Sunday) that is safe for their reported conditions.
    5. Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deficiencies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            dietPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  meal: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["meal", "suggestion"]
              }
            },
            weeklyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snack: { type: Type.STRING }
                },
                required: ["day", "breakfast", "lunch", "dinner", "snack"]
              }
            },
            summary: {
              type: Type.STRING
            }
          },
          required: ["deficiencies", "recommendations", "dietPlan", "weeklyPlan", "summary"]
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    return JSON.parse(jsonStr) as AssessmentResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze health data.");
  }
};
