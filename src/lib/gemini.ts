import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface BottleAnalysis {
  id: string;
  brand: string;
  fullVolumeMl: number;
  fillPercentage: number;
  explanation: string;
}

export async function analyzeBottleImage(base64Image: string): Promise<BottleAnalysis[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this image as a LiDAR-enhanced precision inventory system.
  1. Identify ALL spirit bottles.
  2. For EACH bottle, perform a Geometric Volume Analysis:
     - Identify Brand and Bottle Shape (e.g., Cylindrical, Tapered, Square).
     - Determine Full Volume (ml).
     - Calculate Fill Percentage: Analyze the liquid line relative to the bottle's total height. Account for the reduced volume in the neck and shoulders of the bottle.
     - Provide a "Confidence Score" for the estimation.
     - Explanation: Describe the visual cues (e.g., "Liquid is exactly at the top of the label on a 700ml cylindrical bottle").
  
  Return the result as an array of objects in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1] || base64Image,
          },
        },
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
