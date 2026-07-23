import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history, model, systemInstruction } = req.body;
      const { GoogleGenAI } = await import('@google/genai');
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server.' });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      let config: any = {
        systemInstruction: systemInstruction || 'You are a helpful coding assistant.',
      };
      
      if (model === 'gemini-3.1-pro-preview') {
        config.thinkingConfig = { thinkingLevel: 'high' };
      }
      
      if (model === 'gemini-3.5-flash') {
        config.tools = [{ googleSearch: {} }];
      }

      const chat = ai.chats.create({
        model: model || 'gemini-3.5-flash',
        history: history || [],
        config
      });

      const response = await chat.sendMessage({ message });
      
      // Extract Google Search chunks if available
      let searchChunks = [];
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        searchChunks = response.candidates[0].groundingMetadata.groundingChunks;
      }

      res.json({ text: response.text, searchChunks });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message || 'Error generating response' });
    }
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gemini Copilot App is running' });
  });

  // Mock endpoint for GitHub OAuth
  app.post('/api/auth/github', (req, res) => {
    // In a real app, you would exchange the code for an access token
    res.json({ success: true, message: 'GitHub authenticated' });
  });

  // Mock endpoint for Google OAuth (Gemini Auth)
  app.post('/api/auth/google', (req, res) => {
    res.json({ success: true, message: 'Google authenticated for Gemini Pro' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
