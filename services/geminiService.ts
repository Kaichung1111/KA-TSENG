import { GoogleGenAI, Type } from "@google/genai";
import { Flow, FlowNode, FlowEdge } from "../types";

const parseGeminiResponse = (text: string): { nodes: FlowNode[], edges: FlowEdge[] } | null => {
  try {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};

export const generateFlowFromPrompt = async (prompt: string): Promise<{ nodes: FlowNode[], edges: FlowEdge[] } | null> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `
    You are an expert workflow architect. 
    Create a node-based workflow for the user's request.
    Return strictly JSON.
    Layout logic: 
    - Start node at x: 200, y: 50.
    - Subsequent nodes should flow downwards (increase y by ~150px).
    - Branching should spread x by ~250px.
    - Keep coordinates within x: 0-800 range if possible.
    
    Output Schema:
    {
      "nodes": [
        { "id": "string", "label": "string", "type": "start|task|decision|milestone", "x": number, "y": number, "status": "pending" }
      ],
      "edges": [
        { "id": "string", "source": "nodeId", "target": "nodeId" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a workflow for: ${prompt}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["start", "task", "decision", "milestone"] },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ["pending", "completed"] }
                },
                required: ["id", "label", "type", "x", "y", "status"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  source: { type: Type.STRING },
                  target: { type: Type.STRING }
                },
                required: ["id", "source", "target"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    if (response.text) {
      return parseGeminiResponse(response.text);
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
