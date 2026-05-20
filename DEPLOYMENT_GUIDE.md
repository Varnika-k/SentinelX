# SentinelX Cloud-First Production Deployment Guide

## Architecture Overview
SentinelX is built as an enterprise-grade cloud-first platform:
- **Frontend**: React SPA designed for high-density, low-latency tactical displays.
- **Backend**: Express.js server bundled to a standalone CJS file, operating as a high-performance ingestion engine.
- **State & Storage**:
  - **Database**: Relational and telemetry data are persisted on a managed **Neon PostgreSQL** cluster.
  - **Event Bus**: In-memory fallback and global **Upstash Redis Pub/Sub** are utilized for resilient event streams and distributed telemetry synchronizations.

## Cloud Ingestion Core Config
Set the following environment variables in your production environment (Vercel, Railway, Render, or ECS):

```env
# Database Integration (Neon PostgreSQL)
DATABASE_URL="postgres://user:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"
DB_POOL_MAX=15   # Connection pool limit

# Streaming Bus (Upstash Redis)
REDIS_URL="rediss://default:token@cool-upstash-redis-12345.upstash.io:30000"

# External Intelligence
VIRUSTOTAL_API_KEY="vt-api-key-here"
SHODAN_API_KEY="shodan-api-key-here"

# AWS Security & Auditing
AWS_ACCESS_KEY_ID="aws-access-key-here"
AWS_SECRET_ACCESS_KEY="aws-secret-key-here"
AWS_DEFAULT_REGION="us-east-1"
```

## Scalability Strategy

### Managed Connection Pooling (Part 1)
- Connections to **Neon** are managed using standard client pooling. We configure an automatic warm-retry connection algorithm with 5 attempts and exponential backoff to handle colder serverless database spins elegantly.
- Production SSL mode is set with `rejectUnauthorized: false` to securely allow connecting to cloud-hosted databases.

### Managed Event Streaming & Resilience (Part 2)
- High-volume global event streaming runs on **Upstash Redis** utilizing TLS endpoints (`rediss://`).
- The pub/sub system has been modernized with automatic pattern matching (`psubscribe` and `pmessage`) for matching wildcard topics. If the Redis server experiences transient failures, the engine guarantees direct local client routing to prevent packet losses.

### Ingestion Performance & Telemetry Batching (Part 6)
- **Database I/O Minimization**: Rather than performing single SQL insertions for every packet, the backend utilizes `DatabaseService.saveTelemetry` buffering. It collects packets in-memory and flushes batch entries once it gets 35 events or passes 2 seconds, achieving massive I/O performance gains.
- **Fallback Recovery**: If a batch-insert throws a database exception, individual records are systematically written in a self-healing cascade to isolate corrupt structures.

## Deployment Platforms

### 1. Vercel & Railway (Recommended)
Deploying with a decoupled layout:
- **Client-Side (Vercel)**: Build static HTML assets into the `/dist` directory. Direct server configurations to proxy `/api/*` to the railway backend.
- **Backend Ingest Service (Railway / Render)**: Boots with `npm run start` calling the compiled CJS backend (`node dist/server.cjs`). Ensure `PORT=3000` is bound to `0.0.0.0` for ingress proxy routing.

### 2. Docker
To start the entire cloud platform stack locally or in custom virtual private clouds:
```bash
docker-compose up -d --build
```

