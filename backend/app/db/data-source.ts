import "reflect-metadata";
import { DataSource } from 'typeorm';
import { TelemetryEventEntity } from './entities/TelemetryEvent';
import { IncidentEntity } from './entities/Incident';
import { ReplaySessionEntity } from './entities/ReplaySession';
import { AIReportEntity } from './entities/AIReport';
import { InfrastructureNodeEntity } from './entities/InfrastructureNode';
import { SimulationSessionEntity } from './entities/SimulationSession';
import { logger } from '../core/logger';

const isProd = process.env.NODE_ENV === 'production';
const defaultDbPath = isProd ? '/tmp/database.sqlite' : 'database.sqlite';

// Neon & managed PostgreSQL connection configurations
const postgresConfig = process.env.DATABASE_URL
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
        SimulationSessionEntity
      ],
      migrations: [],
      subscribers: [],
    }
  : null;

export const AppDataSource = postgresConfig
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
        SimulationSessionEntity
      ],
      migrations: [],
      subscribers: [],
    });

export const initializeDatabase = async (attempts = 5, delayMs = 5000) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${attempts}...`);
      await AppDataSource.initialize();
      logger.info("Database connection successfully established", { 
        type: AppDataSource.options.type,
        host: process.env.DATABASE_URL ? "managed-postgres" : "in-memory-sqljs"
      });
      return;
    } catch (error) {
      logger.error(`Database connection attempt ${attempt} failed: ${(error as Error).message}`);
      if (attempt === attempts) {
        logger.error("All database connection attempts exhausted. Crashing startup.");
        throw error;
      }
      logger.info(`Waiting ${delayMs / 1000}s before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

