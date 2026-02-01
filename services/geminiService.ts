
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { NewsItem, Language, Region, NewsGenre } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NEWS_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      fullDescription: { type: Type.STRING, description: "Detailed 3-4 paragraph background of the story." },
      source: { type: Type.STRING, description: "Platform name (e.g., X, Reddit, The Hindu, Deccan Herald)." },
      sourceUrl: { type: Type.STRING },
      timestamp: { type: Type.STRING, description: "Relative time like '2 hours ago' or 'Just now'." },
      category: { 
        type: Type.STRING,
        description: "Must be: Trending, Politics, Current Affairs, Sports, Entertainment, Business, Technology, Health, Crime, or Education"
      },
      region: { type: Type.STRING },
      isUrgent: { type: Type.BOOLEAN },
      isVerified: { type: Type.BOOLEAN, description: "True if from a verified official source or major news media outlet." }
    },
    required: ["id", "title", "summary", "fullDescription", "source", "sourceUrl", "timestamp", "category", "region", "isUrgent", "isVerified"]
  }
};

/**
 * Helper to wrap API calls with exponential backoff for 429 errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = 
      error?.message?.includes('429') || 
      error?.status === 429 || 
      error?.message?.includes('RESOURCE_EXHAUSTED');
    
    if (isQuotaError && retries > 0) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function fetchNews(
  language: Language,
  region: Region,
  cityName: string = "Bengaluru",
  genre: NewsGenre = NewsGenre.ALL
): Promise<NewsItem[]> {
  const regionQuery = region === Region.CITY ? cityName : region;
  const langText = language === Language.KANNADA ? "Kannada" : "English";
  let genreConstraint = genre === NewsGenre.ALL ? "a broad mix of topics" : `specifically ${genre}`;
  
  if (genre === NewsGenre.TRENDING) {
    genreConstraint = "high-engagement viral topics, internet trends, and breaking social media alerts";
  }

  const prompt = `Act as the "Voice Of Kalki" real-time information engine. 
  Aggregate the most recent (within 24 hours) data for ${regionQuery} in ${langText}. 
  
  HYPER-IMPORTANT: Blend traditional news media reports with current social media pulse (trending posts on X/Twitter, Reddit discussions, and local community social signals).
  Focus: ${genreConstraint}.
  
  For Kannada content: Use standard, easy-to-read journalism style.
  For English content: Use punchy, catchy digital media headlines.
  
  Return a JSON array of stories following the schema strictly. Ensure unique IDs.`;

  try {
    // Fix: Explicitly type the callWithRetry as GenerateContentResponse to resolve 'unknown' property access errors
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: NEWS_SCHEMA,
      },
    }));

    const newsData = JSON.parse(response.text || "[]") as NewsItem[];
    
    return newsData.map((item, index) => ({
      ...item,
      imageUrl: `https://picsum.photos/seed/${item.id || index + Date.now()}/1000/600`
    }));
  } catch (error: any) {
    console.error("News flow interrupted:", error);
    // Propagate quota error specifically so UI can handle it
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXHAUSTED');
    }
    return [];
  }
}

export async function getCityFromCoords(lat: number, lng: number): Promise<string | null> {
  const prompt = `Identify the specific city and state for coordinates Lat: ${lat}, Lng: ${lng}. Return only "City, State".`;
  try {
    // Fix: Explicitly type the callWithRetry as GenerateContentResponse to resolve 'unknown' property access errors
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    }));
    return response.text?.trim() || "Bengaluru, Karnataka";
  } catch (error) {
    return "Bengaluru, Karnataka";
  }
}
