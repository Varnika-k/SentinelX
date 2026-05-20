import "reflect-metadata";
import { DataSource } from 'typeorm';
import { TelemetryEventEntity } from './entities/TelemetryEvent';
import { IncidentEntity } from './entities/Incident';
import { ReplaySessionEntity } from './entities/ReplaySession';
import { AIReportEntity } from './entities/AIReport';
import { InfrastructureNodeEntity } from './entities/InfrastructureNode';
import { SimulationSessionEntity } from './entities/SimulationSession';
import { logger } from '../core/logger';

const dbType = process.env.DATABASE_URL ? ("postgres" as const) : ("sqlite" as const);

export const AppDataSource = new DataSource({
    type: dbType as any,
    url: process.env.DATABASE_URL,
    database: process.env.DATABASE_URL ? undefined : "database.sqlite",
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

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connection established", { type: AppDataSource.options.type });
    } catch (error) {
        logger.error("Error during Data Source initialization", error);
        throw error;
    }
};
