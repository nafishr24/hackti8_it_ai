import express from "express";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

const app = express();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
const PORT = process.env.PORT;

app.post("/api/chat", async (req, res) => {
  const { conv } = req.body;

  try {
    if (!Array.isArray(conv)) throw new Error("Must be an array");

    const contents = conv.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    res.status(200).json({ result: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () =>
  console.log(`aplikasi berjalan di port http://localhost:${PORT}`)
);
