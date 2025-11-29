import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (aiClient) return aiClient;

  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  // Assume this variable is pre-configured, valid, and accessible in the execution context.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key is missing. Ensure 'process.env.API_KEY' is set.");
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

/**
 * Generates a clothing item based on a text prompt.
 */
export const generateClothingItem = async (prompt: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const fullPrompt = `Generate a high-quality, isolated fashion photo of a piece of clothing based on this description: "${prompt}". The background should be plain white or transparent.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", 
        }
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini generateClothingItem error:", error);
    throw error;
  }
};

/**
 * Generates a try-on image using the person image and clothing image.
 */
export const generateTryOn = async (personBase64: string, clothingBase64: string): Promise<string> => {
  try {
    const ai = getAiClient();

    const prompt = `
      You are an expert virtual try-on AI.
      I have provided two images:
      1. An image of a person.
      2. An image of a piece of clothing.

      Task: Generate a new, photorealistic full-body image of the person from the first image wearing the clothing from the second image.
      
      Requirements:
      - Preserve the person's identity, facial features, hair, and body shape as closely as possible.
      - Fit the clothing naturally onto the person's body, respecting physics (folds, lighting, drape).
      - Maintain a simple, clean, high-quality background.
      - The output must be a full-body shot.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: personBase64
            }
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: clothingBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
         imageConfig: {
          aspectRatio: "3:4", 
        }
      }
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No try-on image generated.");
  } catch (error) {
    console.error("Gemini generateTryOn error:", error);
    throw error;
  }
};