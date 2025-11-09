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

// Object untuk menyimpan riwayat percakapan per session
// Dalam produksi, gunakan database seperti Redis atau MongoDB
const conversationSessions = new Map();

app.post("/api/chat", async (req, res) => {
  const { conv, sessionId = "default" } = req.body;

  try {
    // Dapatkan atau buat riwayat percakapan untuk session ini
    if (!conversationSessions.has(sessionId)) {
      conversationSessions.set(sessionId, []);
    }

    const sessionHistory = conversationSessions.get(sessionId);

    // Tambahkan pesan user ke riwayat session
    if (Array.isArray(conv)) {
      // Jika mengirim seluruh riwayat dari frontend
      sessionHistory.push(...conv);
    } else {
      // Jika mengirim single message
      sessionHistory.push(conv);
    }

    // Batasi riwayat untuk menghindari token berlebihan
    // Gemini memiliki limit token, jadi kita batasi riwayat
    const MAX_HISTORY = 10;
    const recentHistory = sessionHistory.slice(-MAX_HISTORY * 2); // 10 pasang Q&A

    // Siapkan konten untuk Gemini
    const contents = recentHistory.map(({ role, text }) => ({
      role: role === "bot" ? "model" : "user", // Convert role untuk Gemini
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    const botResponse = response.text;

    // Simpan respons bot ke riwayat
    sessionHistory.push({ role: "bot", text: botResponse });

    // Update session storage
    conversationSessions.set(sessionId, sessionHistory);

    res.status(200).json({
      result: botResponse,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk memulai percakapan baru
app.post("/api/chat/new", (req, res) => {
  const { sessionId = "default" } = req.body;
  conversationSessions.delete(sessionId);
  res.status(200).json({ message: "Conversation cleared", sessionId });
});

// Endpoint untuk mendapatkan riwayat percakapan
app.get("/api/chat/history/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const history = conversationSessions.get(sessionId) || [];
  res.status(200).json({ history });
});

app.listen(PORT, () =>
  console.log(`Aplikasi berjalan di port http://localhost:${PORT}`)
);
