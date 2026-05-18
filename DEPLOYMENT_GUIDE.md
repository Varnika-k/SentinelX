# SentinelX Production Deployment Guide

## Architecture Overview
SentinelX is built as a full-stack TypeScript application with a bifurcated architecture:
- **Frontend**: React-based SPA optimized for high-density telemetry visualization.
- **Backend**: Express.js server handling AI orchestration, telemetry ingestion, and WebSocket broadcasting.

## Deployment Options

### 1. Docker (Recommended)
The platform is fully containerized. To deploy in a production environment:

```bash
# Build and start services
docker-compose up -d --build
```

The Dockerfile uses a multi-stage build to minimize image size and ensure security.

### 2. Kubernetes
For enterprise-scale deployments, use the provided infrastructure concepts to create:
- **Deployments**: Standard stateless pods for the backend.
- **Services**: Load balancer for ingress.
- **ConfigMaps/Secrets**: Manage `GEMINI_API_KEY` and environment variables.

## Scalability Strategy

### Telemetry Ingestion
- Currently handles up to 500 EPS per source via internal buffering.
- For >10,000 EPS, implement the Kafka connector (see `ingestion-manager.ts` placeholders).

### Database
- Use a Time-Series Database (e.g., TimescaleDB or InfluxDB) for long-term telemetry storage.
- Current implementation uses an in-memory sliding window for the visualization layer.

### AI Engine
- The platform uses Gemini 1.5 Flash for high-speed, low-latency analysis.
- For higher throughput, implement request batching or dedicated inference clusters.

## Monitoring & Observability
- **Logs**: Structured JSON logs are emitted to stdout.
- **Metrics**: Access `/api/health` for basic system health.
- **Diagnostics**: Use the internal Telemetry Console (Terminal icon) for real-time pipeline monitoring.

## Security Controls
- **Rate Limiting**: Implemented at the ingestion gate.
- **Input Validation**: No raw payload is processed without normalization and schema checks.
- **Environment Separation**: Ensure `NODE_ENV=production` is set to enable strict security headers and disabled HMR.
