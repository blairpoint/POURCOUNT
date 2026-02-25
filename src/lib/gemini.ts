import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BottleAnalysis {
  id: string;
  brand: string;
  fullVolumeMl: number;
  fillPercentage: number;
  explanation: string;
}

export async function analyzeBottleMultiAngle(base64Images: string[]): Promise<BottleAnalysis[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze these images from a 360° precision scan of spirit bottles. 
  The images show the bottles from different angles (front, sides, back).
  
  1. Identify ALL spirit bottles.
  2. Synthesize information from all angles to perform a high-precision Geometric Volume Analysis:
     - Identify Brand and exact Bottle Shape.
     - Determine Full Volume (ml).
     - Calculate Fill Percentage: Use the multi-angle data to account for bottle thickness, base depth, and complex shapes (like square or irregular bottles).
     - Provide a "Confidence Score" for the estimation.
     - Explanation: Describe how the different angles helped refine the estimate.
  
  Return the result as an array of objects in JSON format.`;

  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img.split(",")[1] || img,
    },
  }));

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        ...imageParts
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING },
            fullVolumeMl: { type: Type.NUMBER },
            fillPercentage: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
          },
          required: ["brand", "fullVolumeMl", "fillPercentage", "explanation"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const results = JSON.parse(text) as Omit<BottleAnalysis, 'id'>[];
  return results.map(r => ({
    ...r,
    id: Math.random().toString(36).substring(7)
  }));
}

export async function analyzeBottleImage(base64Image: string): Promise<BottleAnalysis[]> {
  return analyzeBottleMultiAngle([base64Image]);
}
