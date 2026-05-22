import express from 'express';
import { createServer, Server } from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { logger } from './core/logger';
import { WebSocketGateway } from './websocket/gateway';
import { TelemetryGenerator } from './telemetry/generator';
import { initializeDatabase } from './db/data-source';
import { DatabaseService } from './db/service';
import { TelemetryWorker } from './workers/telemetry-worker';
import { digitalTwinEngine } from './simulation/twin-engine';
import { graphIntelligenceEngine } from './simulation/graph-intelligence';
import { cloudTelemetryService } from './services/cloud-telemetry';
import { telemetryPipeline } from './telemetry/pipeline';

import { aiService } from './services/ai';

export class SentinelBackend {
  private app: express.Express;
  private server: Server;
  private gateway: WebSocketGateway;
  private telemetry: TelemetryGenerator;
  private isProd = process.env.NODE_ENV === 'production';
  private port = Number(process.env.PORT) || 3000;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.gateway = new WebSocketGateway(this.server);
    this.telemetry = new TelemetryGenerator();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    
    // Structured Request Logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (!req.url.match(/\.(ts|tsx|js|jsx|css|svg|png|jpg|json|woff2?)$/)) {
          logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        }
      });
      next();
    });
  }

  private setupRoutes() {
    // Health Check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    // --- Tactical Cloud Intelligence integrations ---
    this.app.get('/api/v1/cloud/shodan', async (req, res) => {
      try {
        const ip = (req.query.ip as string) || "104.244.42.1";
        const result = await cloudTelemetryService.queryShodan(ip);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/v1/cloud/virustotal', async (req, res) => {
      try {
        const target = (req.query.target as string) || "23.22.201.12";
        const result = await cloudTelemetryService.queryVirusTotal(target);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.get('/api/v1/cloud/aws', async (req, res) => {
      try {
        const result = await cloudTelemetryService.queryAWSCloudTrail();
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // --- Persisted History APIs ---
    
    this.app.get('/api/v1/telemetry/history', async (req, res) => {
      try {
        const limit = Number(req.query.limit) || 100;
        const history = await DatabaseService.getTelemetryHistory(limit);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
      }
    });

    this.app.get('/api/v1/incidents', async (req, res) => {
      try {
        const incidents = await DatabaseService.getIncidents();
        res.json(incidents);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch incidents' });
      }
    });

    this.app.get('/api/v1/replay/sessions', async (req, res) => {
      try {
        const sessions = await DatabaseService.getReplaySessions();
        res.json(sessions);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch replay sessions' });
      }
    });

    this.app.get('/api/v1/replay/sessions/:id/events', async (req, res) => {
      try {
        const events = await DatabaseService.getSessionEvents(req.params.id);
        res.json(events);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session events' });
      }
    });

    // --- Infrastructure Intelligence APIs ---

    this.app.get('/api/v1/infra/topology', async (req, res) => {
      try {
        const topology = await DatabaseService.getInfrastructureTopology();
        res.json(topology);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch topology' });
      }
    });

    this.app.get('/api/v1/infra/namespace/:namespace', async (req, res) => {
      try {
        const components = await DatabaseService.getInfrastructureByNamespace(req.params.namespace);
        res.json(components);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch namespace data' });
      }
    });

    // --- Cyber Range & Digital Twin Simulation APIs ---

    this.app.get('/api/v1/simulation/status', (req, res) => {
      try {
        res.json({
          scenario: digitalTwinEngine.scenario,
          status: digitalTwinEngine.status,
          tickCount: digitalTwinEngine.tickCount,
          threatLevel: digitalTwinEngine.threatLevel,
          sessionId: digitalTwinEngine.sessionId,
          nodes: Array.from(digitalTwinEngine.nodes.values()),
          sectors: digitalTwinEngine.getSectorMetrics(),
          aarTimeline: digitalTwinEngine.getAarTimeline(),
          survivabilityScore: digitalTwinEngine.getSurvivabilityScore(),
          operationalContinuity: digitalTwinEngine.getOperationalContinuity()
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch simulation status' });
      }
    });

    this.app.post('/api/v1/simulation/control', async (req, res) => {
      try {
        const { action, scenario } = req.body;
        if (action === 'start') {
          await digitalTwinEngine.start(scenario || 'idle');
        } else if (action === 'pause') {
          await digitalTwinEngine.pause();
        } else if (action === 'resume') {
          await digitalTwinEngine.resume();
        } else if (action === 'stop') {
          await digitalTwinEngine.stop();
        }
        res.json({ success: true, status: digitalTwinEngine.status, scenario: digitalTwinEngine.scenario });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/v1/simulation/node/action', (req, res) => {
       try {
         const { nodeName, action } = req.body;
         if (action === 'isolate') {
           digitalTwinEngine.isolateSimulatedNode(nodeName);
         } else if (action === 'scale') {
           digitalTwinEngine.scaleUpWorkload(nodeName);
         } else if (action === 'chaos') {
           digitalTwinEngine.injectChaosFailure(nodeName);
         } else if (action === 'rotate') {
           digitalTwinEngine.rotateNodeSecrets(nodeName);
         } else if (action === 'block') {
           digitalTwinEngine.blockNodeTraffic(nodeName);
         }
         res.json({ success: true });
       } catch (error) {
         res.status(500).json({ error: (error as Error).message });
       }
     });

    this.app.get('/api/v1/simulation/what-if/:nodeName', (req, res) => {
       try {
         const result = digitalTwinEngine.getWhatIfScenarios(req.params.nodeName);
         res.json(result);
       } catch (error) {
         res.status(500).json({ error: (error as Error).message });
       }
     });

    this.app.get('/api/v1/simulation/graph-analytics', (req, res) => {
      try {
        const nodes = Array.from(graphIntelligenceEngine.nodes.values());
        const edges = graphIntelligenceEngine.edges;
        res.json({
          nodes,
          edges
        });
      } catch (error) {
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/v1/telemetry/wazuh', async (req, res) => {
      try {
        const canonicalEvent = await telemetryPipeline.ingestWazuhAlert(req.body);
        res.json({ success: true, event: canonicalEvent });
      } catch (error) {
        logger.error('Wazuh ingestion API error', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/v1/telemetry/falco', async (req, res) => {
      try {
        const canonicalEvent = await telemetryPipeline.ingestFalcoAlert(req.body);
        res.json({ success: true, event: canonicalEvent });
      } catch (error) {
        logger.error('Falco ingestion API error', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    // --- AI Intelligence API Endpoints ---
    this.app.get('/api/ai/status', (req, res) => {
      res.json({ 
        active: !!process.env.GEMINI_API_KEY,
        provider: 'gemini'
      });
    });

    this.app.post('/api/ai/analyze/infra', async (req, res) => {
      try {
        const topology = await DatabaseService.getInfrastructureTopology();
        const events = await DatabaseService.getTelemetryHistory(50);
        const analysis = await aiService.analyzeInfra(topology, events);
        res.json(analysis);
      } catch (error) {
        logger.error('AI Infra Analysis Error', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/ai/analyze', async (req, res) => {
      try {
        const analysis = await aiService.analyze(req.body);
        res.json(analysis);
      } catch (error) {
        logger.error('AI Analysis Error', error);
        res.status(500).json({ error: (error as Error).message });
      }
    });

    this.app.post('/api/ai/stream', async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        await aiService.stream(req.body, (chunk) => {
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

    // Handle API 404 (Endpoint Not Found) so we never return raw index.html block on API misses
    this.app.use('/api', (req, res) => {
      res.status(404).json({ error: `API route '${req.originalUrl}' not found.` });
    });
  }

  public async start() {
    // Vite Integration
    if (!this.isProd) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      // Bypass Vite SPA fallback for API calls to prevent HTML answers
      this.app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) {
          return next();
        }
        vite.middlewares(req, res, next);
      });
      logger.info('Vite development middleware mounted');
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      this.app.use(express.static(distPath));
      this.app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
          return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
      logger.info('Serving production static files');
    }

    // Bind and start listening immediately so Cloud Run ingress checks and TCP probes pass
    this.server.listen(this.port, '0.0.0.0', () => {
      logger.info(`SENTINEL_X_BACKEND successfully bound port ${this.port}. Active ingress channel open.`);
      
      // Perform background service activation asynchronously
      (async () => {
        try {
          // 1. Initialize persistent storage
          await initializeDatabase();
          
          // 2. Start high-frequency background telemetry processor
          await TelemetryWorker.start();
          
          // 3. Initiate local and cloud indicators
          this.telemetry.start();
          cloudTelemetryService.start();
          
          logger.info('SentinelX active defense analytics, incident reconciliation, and core telemetry ingestion fully engaged.');
        } catch (error) {
          logger.error('CRITICAL: Background ingestion worker chain initialization failed.', error);
        }
      })();
    });
  }
}

// Instantiate and export for server.ts
export const sentinelBackend = new SentinelBackend();
