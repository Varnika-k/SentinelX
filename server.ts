import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AIOrchestrator } from './src/server/ai/orchestrator';
import { GeminiProvider } from './src/server/ai/gemini-provider';
import { CONFIG, validateConfig } from './src/config';
import { logger } from './src/lib/logger';

// Validate Configuration on Startup
validateConfig();

const PORT = CONFIG.app.port;
const isProd = process.env.NODE_ENV === 'production';

// Initialize AI Orchestration
const orchestrator = new AIOrchestrator();
if (CONFIG.ai.apiKey) {
  orchestrator.registerProvider(new GeminiProvider(CONFIG.ai.apiKey));
  logger.info('AI Core Initialized with Gemini Provider');
} else {
  logger.warn('GEMINI_API_KEY missing. AI Intelligence Engine limited.');
}

async function bootstrap() {
  const app = express();
  app.use(express.json());
  
  // Structured Request Logging Middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // Skip logging common assets and source files to reduce noise
      if (req.url.match(/\.(ts|tsx|js|jsx|css|svg|png|jpg|json|woff2?)$/) || req.url.startsWith('/src/')) {
        return;
      }
      logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  const server = createServer(app);

  // --- System Health & Diagnostics ---
  
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      version: CONFIG.app.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  });

  // --- AI Intelligence API Endpoints ---
  
  app.get('/api/ai/status', (req, res) => {
    res.json({ 
      active: !!process.env.GEMINI_API_KEY,
      provider: 'gemini'
    });
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const analysis = await orchestrator.analyze(req.body);
      res.json(analysis);
    } catch (error) {
      logger.error('AI Analysis Error', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/ai/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      await orchestrator.stream(req.body, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      logger.error('AI Stream Error', error);
      res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
      res.end();
    }
  });
  const wss = new WebSocketServer({ server });

  // --- Telemetry Core Logic ---

  interface TelemetryEvent {
    topic: string;
    payload: any;
  }

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info(`WebSocket Client connected. Total: ${clients.size}`);

    ws.on('close', () => {
      clients.delete(ws);
      logger.info('WebSocket Client disconnected.');
    });

    // Initial greeting / handshake
    ws.send(JSON.stringify({
      topic: 'system:log',
      payload: {
        source: 'backend',
        message: 'SENTINEL_X_BACKEND: Secure connection established.',
        severity: 'low',
        timestamp: new Date().toISOString()
      }
    }));
  });

  const broadcast = (topic: string, payload: any) => {
    const message = JSON.stringify({ topic, payload, timestamp: new Date().toISOString() });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // --- Mock Telemetry Generator ---
  // Mimics real-world enterprise infrastructure events
  
  const NODE_IDS = ['gw-1', 'fw-1', 'srv-1', 'db-1', 'pc-1', 'pc-2', 'hr-1'];
  
  setInterval(() => {
    const rand = Math.random();
    
    if (rand < 0.1) {
      // Failed Login / Brute Force
      const targetId = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)];
      broadcast('attack:alert', {
        source: 'IDS_EXTERNAL',
        attackType: 'bruteforce',
        targetId,
        severity: 'medium',
        message: `High frequency failed login attempts on ${targetId}`,
        origin: `192.168.1.${Math.floor(Math.random() * 255)}`
      });
    } else if (rand < 0.15) {
      // Suspicious Traffic
      broadcast('system:log', {
        source: 'NET_FLOW',
        message: 'Anomalous outbound traffic detected to unlisted ASN',
        severity: 'low'
      });
    } else if (rand < 0.18) {
      // Privilege Escalation simulation (Meta-event)
      broadcast('threat:escalation', {
        source: 'EDR_AGENT',
        message: 'CRITICAL: Lateral movement detected from PC-1 towards DB-1',
        severity: 'high',
        targetId: 'db-1'
      });
    }
  }, 5000);

  // --- Vite / Express Pipeline ---

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend running at http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

bootstrap().catch(err => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
