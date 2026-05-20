import { AppDataSource } from './data-source';
import { TelemetryEventEntity } from './entities/TelemetryEvent';
import { IncidentEntity } from './entities/Incident';
import { ReplaySessionEntity } from './entities/ReplaySession';
import { InfrastructureNodeEntity } from './entities/InfrastructureNode';
import { SimulationSessionEntity } from './entities/SimulationSession';
import { TelemetryEvent, InfraEntityType } from '../schemas/telemetry';
import { logger } from '../core/logger';
import { Between } from 'typeorm';

export class DatabaseService {
  private static get telemetryRepo() {
    return AppDataSource.getRepository(TelemetryEventEntity);
  }
  private static get incidentRepo() {
    return AppDataSource.getRepository(IncidentEntity);
  }
  private static get replayRepo() {
    return AppDataSource.getRepository(ReplaySessionEntity);
  }
  private static get infraRepo() {
    return AppDataSource.getRepository(InfrastructureNodeEntity);
  }
  private static get simulationRepo() {
    return AppDataSource.getRepository(SimulationSessionEntity);
  }

  static async saveSimulationSession(session: Partial<SimulationSessionEntity>) {
    try {
      if (session.id) {
        const existing = await this.simulationRepo.findOneBy({ id: session.id });
        if (existing) {
          this.simulationRepo.merge(existing, session);
          return await this.simulationRepo.save(existing);
        }
      }
      const newSession = this.simulationRepo.create(session);
      return await this.simulationRepo.save(newSession);
    } catch (err) {
      logger.error('Failed to save simulation session', err);
    }
  }

  static async getSimulationSessions() {
    return await this.simulationRepo.find({ order: { updatedAt: 'DESC' } });
  }

  static async getSimulationSession(id: string) {
    return await this.simulationRepo.findOneBy({ id });
  }

  static async saveInfrastructureNode(node: Partial<InfrastructureNodeEntity>) {
    const existing = await this.infraRepo.findOneBy({ name: node.name });
    if (existing) {
      this.infraRepo.merge(existing, node);
      return await this.infraRepo.save(existing);
    }
    const newNode = this.infraRepo.create(node);
    return await this.infraRepo.save(newNode);
  }

  static async getInfrastructureTopology() {
    return await this.infraRepo.find();
  }

  static async getInfrastructureByNamespace(namespace: string) {
    return await this.infraRepo.findBy({ namespace });
  }

  static async updateNodeRisk(nodeName: string, riskDelta: number) {
    const node = await this.infraRepo.findOneBy({ name: nodeName });
    if (node) {
      node.riskScore = Math.max(0, Math.min(100, node.riskScore + riskDelta));
      if (node.riskScore > 80) node.status = 'critical';
      else if (node.riskScore > 40) node.status = 'warning';
      else node.status = 'healthy';
      return await this.infraRepo.save(node);
    }
  }

  private static telemetryBuffer: any[] = [];
  private static flushTimeout: NodeJS.Timeout | null = null;

  static async saveTelemetry(event: TelemetryEvent) {
    try {
      const entity = this.telemetryRepo.create({
        ...event,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        payload: event.payload
      });
      
      // Buffer the entity for batch inserts, dramatic I/O optimization
      this.telemetryBuffer.push(entity);
      
      if (this.telemetryBuffer.length >= 35) {
        await this.flushTelemetry();
      } else if (!this.flushTimeout) {
        // Lazy-timer initialization
        this.flushTimeout = setTimeout(() => {
          this.flushTelemetry().catch(err => logger.error('Async telemetry flush failed', err));
        }, 2000);
      }
      
      return entity;
    } catch (error) {
      logger.error('Failed to buffer telemetry event for batching', error);
    }
  }

  private static async flushTelemetry() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.telemetryBuffer.length === 0) return;

    const batch = [...this.telemetryBuffer];
    this.telemetryBuffer = [];

    try {
      await this.telemetryRepo.save(batch);
    } catch (error) {
      logger.error(`Critical telemetry batch save failed. Executing graceful self-recovering individual writes...`, error);
      // Save individually to avoid complete packet drops
      for (const entity of batch) {
        try {
          await this.telemetryRepo.save(entity);
        } catch (individualError) {
          logger.error('Failed to write individual fallback telemetry event', individualError);
        }
      }
    }
  }

  static async getTelemetryHistory(limit = 100, skip = 0) {
    return await this.telemetryRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
      skip: skip
    });
  }

  static async getEventsInRange(start: Date, end: Date) {
    return await this.telemetryRepo.find({
      where: {
        timestamp: Between(start, end)
      },
      order: { timestamp: 'ASC' }
    });
  }

  static async createIncident(data: Partial<IncidentEntity>) {
    const incident = this.incidentRepo.create(data);
    return await this.incidentRepo.save(incident);
  }

  static async getIncidents() {
    return await this.incidentRepo.find({ order: { startTime: 'DESC' } });
  }

  static async createReplaySession(name: string, start: Date, end: Date, description?: string) {
    const session = this.replayRepo.create({
      name,
      startTime: start,
      endTime: end,
      description
    });
    return await this.replayRepo.save(session);
  }

  static async getReplaySessions() {
    return await this.replayRepo.find({ order: { createdAt: 'DESC' } });
  }

  static async getSessionEvents(sessionId: string) {
    const session = await this.replayRepo.findOneBy({ id: sessionId });
    if (!session) return [];
    return await this.getEventsInRange(session.startTime, session.endTime);
  }
}
