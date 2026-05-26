import "reflect-metadata";
import { DataSource } from 'typeorm';
import { TelemetryEventEntity } from './entities/TelemetryEvent';
import { IncidentEntity } from './entities/Incident';
import { ReplaySessionEntity } from './entities/ReplaySession';
import { AIReportEntity } from './entities/AIReport';
import { InfrastructureNodeEntity } from './entities/InfrastructureNode';
import { SimulationSessionEntity } from './entities/SimulationSession';
import { UnifiedOperationalEventEntity } from './entities/UnifiedOperationalEventEntity';
import { GraphSnapshotEntity } from './entities/GraphSnapshotEntity';
import { logger } from '../core/logger';

const isProd = process.env.NODE_ENV === 'production';
const defaultDbPath = isProd ? '/tmp/database.sqlite' : 'database.sqlite';

// Neon & managed PostgreSQL connection configurations
const isPlaceholderDb = process.env.DATABASE_URL?.includes("ep-cool-name-123456");
const postgresConfig = (process.env.DATABASE_URL && !isPlaceholderDb)
  ? {
      type: "postgres" as const,
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: false,
      ssl: process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false }, // Crucial for Neon or managed clouds
      extra: {
        max: Number(process.env.DB_POOL_MAX) || 15, // connection pooling limit
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
      entities: [
        TelemetryEventEntity,
        IncidentEntity,
        ReplaySessionEntity,
        AIReportEntity,
        InfrastructureNodeEntity,
        SimulationSessionEntity,
        UnifiedOperationalEventEntity,
        GraphSnapshotEntity
      ],
      migrations: [],
      subscribers: [],
    }
  : null;

export let AppDataSource = postgresConfig
  ? new DataSource(postgresConfig)
  : new DataSource({
      type: "sqljs",
      location: defaultDbPath,
      autoSave: true,
      synchronize: true,
      logging: false,
      entities: [
        TelemetryEventEntity,
        IncidentEntity,
        ReplaySessionEntity,
        AIReportEntity,
        InfrastructureNodeEntity,
        SimulationSessionEntity,
        UnifiedOperationalEventEntity,
        GraphSnapshotEntity
      ],
      migrations: [],
      subscribers: [],
    });

export const initializeDatabase = async (attempts = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${attempts}...`);
      await AppDataSource.initialize();
      logger.info("Database connection successfully established", { 
        type: AppDataSource.options.type,
        host: postgresConfig ? "managed-postgres" : "in-memory-sqljs"
      });
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed: ${(error as Error).message}`);
      
      if (attempt === attempts) {
        if (postgresConfig) {
          logger.warn("All primary PostgreSQL connection attempts failed. Switching over to SQLJS fallback system for platform resilience.");
          
          AppDataSource = new DataSource({
            type: "sqljs",
            location: defaultDbPath,
            autoSave: true,
            synchronize: true,
            logging: false,
            entities: [
              TelemetryEventEntity,
              IncidentEntity,
              ReplaySessionEntity,
              AIReportEntity,
              InfrastructureNodeEntity,
              SimulationSessionEntity
            ],
            migrations: [],
            subscribers: [],
          });

          await AppDataSource.initialize();
          logger.info("Resilience database fallback successfully initialized (SQLJS/SQLite)");
          return;
        }
        
        logger.error("All database connection attempts exhausted. Crashing startup.");
        throw error;
      }
      logger.info(`Waiting ${delayMs / 1000}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

