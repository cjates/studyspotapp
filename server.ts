import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Helper function to handle model generation with retries and fallbacks
async function generateWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Attempting summary with model: ${model} (attempt ${attempt}/2)`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err.message || err);
        console.warn(`Model ${model} attempt ${attempt} failed:`, errStr);
        
        // Check if error is transient (503, 429, UNAVAILABLE, high demand)
        const isTransient = 
          errStr.includes("503") || 
          errStr.includes("429") || 
          errStr.includes("UNAVAILABLE") || 
          errStr.includes("demand") ||
          errStr.includes("temporary");
          
        if (isTransient) {
          if (attempt < 2) {
            // Wait 1-2 seconds with simple backoff
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        } else {
          // If it is a non-transient error, switch models immediately
          break;
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content with all available models.");
}

// API route for Gemini study spot reviews summarization
app.post("/api/gemini/summarize", async (req, res) => {
  const { spotName, reviews } = req.body;

  if (!spotName || !reviews || !Array.isArray(reviews)) {
    res.status(400).json({ error: "Missing spotName or reviews array." });
    return;
  }

  // Fallback summary that will be returned if no API key is set or if Gemini fails
  const fallbackSummary = `**Green Wave Core Pulse (Offline/Demo Mode)**:\n*   **Prime Study Real Estate:** Outstandingly rated by peers for productivity.\n*   **Tech & Utilities:** Adequate power outlets and solid Wi-Fi performance.\n*   *Tip:* Grab a refreshing beverage from PJ's Coffee nearby to stay focused!`;

  if (reviews.length === 0) {
    res.json({
      summary: "No student reports or reviews available yet to summarize! Be the first to add one below.",
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. Returning offline fallback summary.");
    res.json({
      error: "Gemini API key is not configured.",
      summary: fallbackSummary,
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const reviewsText = reviews
      .map(
        (r: any, idx: number) =>
          `Review #${idx + 1} (${r.rating} stars) by ${r.user_name || "Anonymous"}: "${r.comment}" (Quietness: ${
            r.quiet_level || "n/a"
          }, Outlets: ${r.outlets || "n/a"})`
      )
      .join("\n\n");

    const prompt = `You are a helpful student assistant at Tulane University. Consolidate and summarize the following anonymous student reviews for the study spot named '${spotName}'. Tell students what the overall vibe is, if it's quiet, outlet availability, WiFi speed/stability, and suitability for group or solo work. Keep the style encouraging, concise, informative and use local Tulane lingo (like PJ's Coffee, Howie T, Lavin-Bernick Center, Green Wave) naturally if suitable. Format with markdown bullets (maximum 3 bullet points, under 120 words total). Do not mention that you were given reviews, just write a summary of the spot based on what other students say.

Reviews:
${reviewsText}`;

    const summaryText = await generateWithFallback(ai, prompt);

    res.json({ summary: summaryText || "Unable to consolidate reviews." });
  } catch (err: any) {
    console.error("Error generating Gemini summary:", err);
    res.json({
      error: "Failed to generate live summary: " + (err.message || err),
      summary: fallbackSummary,
    });
  }
});

// Setup Vite middleware for development or serve built files for production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for client-side routing
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
