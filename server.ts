import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/music", (req, res) => {
    const musicDir = path.join(process.cwd(), "public", "asset", "music");
    if (!fs.existsSync(musicDir)) {
      return res.json({ songs: [] });
    }
    
    try {
      const files = fs.readdirSync(musicDir);
      const songs = files
        .filter(file => file.endsWith(".mp3") || file.endsWith(".wav") || file.endsWith(".ogg") || file.endsWith(".m4a"))
        .map(file => ({
          title: file.replace(/\.[^/.]+$/, ""),
          url: `/asset/music/${file}`
        }));
      res.json({ songs });
    } catch (err) {
      console.error("Error reading music directory:", err);
      res.json({ songs: [] });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
