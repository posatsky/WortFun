import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client on the server
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to generate word lists using Gemini
app.post("/api/generate-words", async (req, res) => {
  try {
    const { topic, difficulty, pairCount } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const count = Math.min(Math.max(Number(pairCount) || 8, 4), 20); // default 8, min 4, max 20
    const levelText = difficulty || "A1-A2";

    const prompt = `Генеруй список слів та фраз для вивчення німецької мови на тему "${topic}" для рівня складності ${levelText}.
Потрібно згенерувати точно ${count} пар слів/фраз.
Для іменників обов'язково вказуй артикль (der/die/das).
Кожна пара повинна містити:
1. German (німецька слово/фраза з артиклем якщо це іменник)
2. Ukrainian (український переклад)
3. ExampleGerman (просте приклад речення німецькою)
4. ExampleUkrainian (переклад прикладу українською)

Згенеруй також назву списку (title) та короткий опис (description) українською мовою.`;

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "Ти — досвідчений викладач німецької мови для українськомовних студентів. Генеруй точно сформатоване JSON значення з коректними перекладами та артиклями.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Назва списку (наприклад: Їжа в ресторані)" },
            description: { type: Type.STRING, description: "Короткий опис списку" },
            category: { type: Type.STRING, description: "Тематична категорія" },
            pairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  german: { type: Type.STRING, description: "Слово/фраза німецькою" },
                  ukrainian: { type: Type.STRING, description: "Переклад українською" },
                  exampleGerman: { type: Type.STRING, description: "Приклад речення німецькою" },
                  exampleUkrainian: { type: Type.STRING, description: "Переклад прикладу" },
                },
                required: ["german", "ukrainian"],
              },
            },
          },
          required: ["title", "description", "pairs"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const data = JSON.parse(text);
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Error generating vocabulary:", err);
    return res.status(500).json({
      error: "Failed to generate vocabulary list",
      details: err.message || "Unknown error",
    });
  }
});

// API endpoint for AI topic recommendations/ideas
app.get("/api/ai-ideas", async (_req, res) => {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Запропонуй 6 цікавих і практичних тем для вивчення німецьких слів для українців (різні рівні A1-B2). Поверни масив об'єктів з 'topic', 'level', 'description', 'iconName'.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              level: { type: Type.STRING },
              description: { type: Type.STRING },
              suggestedPairCount: { type: Type.NUMBER },
            },
            required: ["topic", "level", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    const ideas = JSON.parse(text);
    return res.json({ success: true, ideas });
  } catch (err: any) {
    console.error("Error fetching AI ideas:", err);
    return res.status(500).json({ error: "Failed to get topic ideas" });
  }
});

// Start Express server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WortPaar server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
