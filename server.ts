import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'JX Chat Gateway Proxy', timestamp: Date.now() });
  });

  // Proxy: Get Kilo live models (No API key needed)
  app.get('/api/kilo/models', async (req, res) => {
    try {
      const response = await fetch('https://api.kilo.ai/api/gateway/models', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JXChat/1.0.0',
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching Kilo models:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch models from Kilo' });
    }
  });

  // Proxy: Kilo Chat Completions with SSE Streaming (No API key needed)
  app.post('/api/kilo/chat/completions', async (req, res) => {
    try {
      const { model, messages, stream = true, temperature = 0.7 } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'messages array is required' });
      }

      let targetModel = model || 'kilo-auto/free';

      const forwardRequest = async (modelToUse: string) => {
        return await fetch('https://api.kilo.ai/api/gateway/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization header - 100% anonymous access for :free models
          },
          body: JSON.stringify({
            model: modelToUse,
            messages,
            stream,
            temperature,
          }),
        });
      };

      let kiloRes = await forwardRequest(targetModel);

      // If specific model returned 404 or provider error from upstream, fallback to kilo-auto/free!
      if (!kiloRes.ok && targetModel !== 'kilo-auto/free') {
        console.warn(`Model ${targetModel} failed (${kiloRes.status}), falling back to kilo-auto/free...`);
        targetModel = 'kilo-auto/free';
        kiloRes = await forwardRequest(targetModel);
      }

      if (!kiloRes.ok) {
        const errorText = await kiloRes.text();
        return res.status(kiloRes.status).send(errorText || 'Kilo Gateway error');
      }

      // Stream response to client
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        const reader = kiloRes.body?.getReader();
        if (!reader) {
          return res.status(500).send('Stream reader not available');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
      } else {
        const data = await kiloRes.json();
        res.json(data);
      }
    } catch (err: any) {
      console.error('Error proxying Kilo chat completion:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal proxy error' });
      }
    }
  });

  // Mount Vite or static build
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[JX Chat] Server running on port ${PORT} (dev: ${!isProd})`);
  });
}

startServer();
