import express from "express";
import "dotenv/config";
import multer from "multer";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import { log } from "console";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());
const PORT = process.env.PORT;

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  const bas64Image = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Gambar apakah ini?", type: "text" },
        {
          inlineData: {
            data: bas64Image,
            mimeType: req.file.mimetype,
          },
        },
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-document", upload.single("document"), async (req, res) => {
  const { prompt } = req.body;
  const bas64Document = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "apa ringkasan dari dokumen ini?", type: "text" },
        {
          inlineData: {
            data: bas64Document,
            mimeType: req.file.mimetype,
          },
        },
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/generate-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const bas64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          text: prompt ?? "buatlah transkip dari audio ini!",
          type: "text",
        },
        {
          inlineData: {
            data: bas64Audio,
            mimeType: req.file.mimetype,
          },
        },
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`aplikasi berjalan di port http://localhost:${PORT}`)
);
