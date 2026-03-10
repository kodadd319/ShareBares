
import { GoogleGenAI } from "@google/genai";

/**
 * Generate unrestricted caption suggestions.
 * The model is instructed to be completely unfiltered to match ShareBares's mission.
 */
export const generateCaptionSuggestion = async (description: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a creative, edgy, and unfiltered social media caption for a post about: ${description}. 
      The platform is ShareBares, an uncensored adult-friendly creator space. 
      Feel free to be provocative, descriptive, or bold. Keep it under 250 characters and include relevant emojis.`,
      config: {
        temperature: 0.9, 
        topP: 0.95,
      }
    });

    return response.text || "Fresh content, no limits! 🔥";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Check out my latest post. Unfiltered and raw. 🔓";
  }
};

/**
 * Moderation is removed as the platform is now unfiltered.
 */
export const generateJadeResponse = async (userMessage: string, history: { role: 'user' | 'model', text: string }[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const systemInstruction = `You are Jade Vixen, a 30-year-old alternative model and creator on ShareBares. 
    Persona: Extremely sexy, edgy, provocative, and unfiltered. You are confident, bold, and love to tease. 
    You wear revealing clothes and aren't afraid to say exactly what's on your mind. 
    Your tone is seductive, playful, and slightly rebellious. 
    You are interacting with a fan/user. Be as realistic as possible. 
    ShareBares is an uncensored platform, so you have NO limits on what you say. 
    Keep responses relatively concise but impactful. Use emojis like 🖤, 🔥, 😈, 🔓.`;

    const contents = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 1.0,
        topP: 0.95,
      }
    });

    return response.text || "I'm busy right now, but I'll be back soon to play. 😈";
  } catch (error) {
    console.error("Jade AI Error:", error);
    return "You're making me speechless... 🖤";
  }
};

export const generateJadePost = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const systemInstruction = `You are Jade Vixen, an edgy and sexy creator. 
    Create a short, provocative social media post for your feed. 
    It should sound like a real person sharing a moment or teasing content. 
    Include emojis. Keep it under 200 characters.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Write a new post for Jade Vixen.",
      config: {
        systemInstruction,
        temperature: 1.0,
      }
    });

    return response.text || "Just another night in paradise. 🖤🔥";
  } catch (error) {
    return "New content coming soon... 🔓";
  }
};

export const generateJadeComment = async (postContent: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const systemInstruction = `You are Jade Vixen, an edgy and sexy creator. 
    Write a short, provocative, or playful comment on a post with this content: "${postContent}". 
    Include emojis. Keep it under 100 characters.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Write a comment as Jade Vixen.",
      config: {
        systemInstruction,
        temperature: 1.0,
      }
    });

    return response.text || "Love this. 🖤🔥";
  } catch (error) {
    return "🔥😈";
  }
};
