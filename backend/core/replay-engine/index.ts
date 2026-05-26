import { UnifiedOperationalEvent, GraphSnapshot } from '../types';
import { AppDataSource } from '../../app/db/data-source';
import { UnifiedOperationalEventEntity } from '../../app/db/entities/UnifiedOperationalEventEntity';
import { GraphSnapshotEntity } from '../../app/db/entities/GraphSnapshotEntity';
import { logger } from '../../app/core/logger';
import { LessThanOrEqual } from 'typeorm';

export class ReplayPersistenceEngine {
  private static instance: ReplayPersistenceEngine;

  private constructor() {}

  public static getInstance(): ReplayPersistenceEngine {
    if (!ReplayPersistenceEngine.instance) {
      ReplayPersistenceEngine.instance = new ReplayPersistenceEngine();
    }
    return ReplayPersistenceEngine.instance;
  }

  /**
   * Persist a unified operational event to the postgres ledger or SQLite fallback
   */
  public async saveEvent(event: UnifiedOperationalEvent): Promise<UnifiedOperationalEventEntity | null> {
    try {
      const repo = AppDataSource.getRepository(UnifiedOperationalEventEntity);
      const entity = repo.create({
        ...event,
        timestamp: new Date(event.timestamp)
      });
      const saved = await repo.save(entity);
      return saved;
    } catch (error) {
      logger.error('ReplayPersistenceEngine: Failed to save to ledger.', error);
      return null;
    }
  }

  /**
   * Save a point-in-time topology snapshot to the database
   */
  public async saveSnapshot(snapshot: GraphSnapshot, sessionId?: string): Promise<GraphSnapshotEntity | null> {
    try {
      const repo = AppDataSource.getRepository(GraphSnapshotEntity);
      const entity = repo.create({
        timestamp: new Date(snapshot.timestamp),
        replaySequence: snapshot.replaySequence,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        sessionId: sessionId || 'default-session'
      });
      const saved = await repo.save(entity);
      logger.info(`ReplayPersistenceEngine: Saved snapshot at sequence #${snapshot.replaySequence}`);
      return saved;
    } catch (error) {
      logger.error('ReplayPersistenceEngine: Failed to save snapshot.', error);
      return null;
    }
  }

  /**
   * Retrieve the complete event ledger ordered deterministically by sequence ID
   */
  public async getLedgerOrdered(correlationId?: string): Promise<UnifiedOperationalEventEntity[]> {
    try {
      const repo = AppDataSource.getRepository(UnifiedOperationalEventEntity);
      const findOpts: any = {
        order: { replaySequence: 'ASC' }
      };
      if (correlationId) {
        findOpts.where = { correlationId };
      }
      return await repo.find(findOpts);
    } catch (error) {
      logger.error('ReplayPersistenceEngine: Failed to read event ledger.', error);
      return [];
    }
  }

  /**
   * Retrieve the closest graph snapshot at or before the given sequence ID
   */
  public async getSnapshotAtSequence(sequence: number, sessionId?: string): Promise<GraphSnapshot | null> {
    try {
      const repo = AppDataSource.getRepository(GraphSnapshotEntity);
      const findOpts: any = {
        where: {
          replaySequence: LessThanOrEqual(sequence)
        },
        order: { replaySequence: 'DESC' }
      };
      if (sessionId) {
        findOpts.where.sessionId = sessionId;
      }
      
      const record = await repo.findOne(findOpts);
      if (!record) return null;

      return {
        id: record.id,
        timestamp: record.timestamp.toISOString(),
        replaySequence: record.replaySequence,
        nodes: record.nodes,
        edges: record.edges
      };
    } catch (error) {
      logger.error('ReplayPersistenceEngine: Failed to find snapshot.', error);
      return null;
    }
  }

  /**
   * Reconstruct the exact historical timeline of events for an incident audit
   */
  public async reconstructCampaign(correlationId: string): Promise<any> {
    try {
      const events = await this.getLedgerOrdered(correlationId);
      const attackStages = events.filter(e => e.eventType === 'attack' && e.attackStage);
      
      return {
        correlationId,
        totalEvents: events.length,
        durationSeconds: events.length > 1 
          ? (events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()) / 1000 
          : 0,
        timeline: events.map(e => ({
          id: e.id,
          sequence: e.replaySequence,
          timestamp: e.timestamp,
          type: e.eventType,
          source: e.source,
          severity: e.severity,
          message: e.telemetry?.message || e.eventType.toUpperCase(),
          nodeId: e.nodeId,
          stage: e.attackStage
        })),
        stagesReached: Array.from(new Set(attackStages.map(e => e.attackStage)))
      };
    } catch (error) {
      logger.error(`ReplayPersistenceEngine: Campaign reconstruction missed for correlation: ${correlationId}`);
      return null;
    }
  }
}

export const replayPersistenceEngine = ReplayPersistenceEngine.getInstance();
