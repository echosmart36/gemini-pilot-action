import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

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
