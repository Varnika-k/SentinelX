import { 
  RawTelemetryEvent, 
  TelemetryProcessorMetrics, 
  TelemetrySourceType 
} from './enterprise-schemas';
import { telemetryPipeline } from './pipeline';
import { 
  TelemetryConnector, 
  MockSIEMConnector, 
  CloudTrailConnector, 
  EDRConnector 
} from './connectors/base';
import { telemetryBus } from './bus';
import { TelemetryTopic } from './schemas';
import { logger } from '../lib/logger';
import { CONFIG } from '../config';

export class EnterpriseIngestionManager {
  private connectors: TelemetryConnector[] = [];
  private metrics: TelemetryProcessorMetrics = {
    totalIngested: 0,
    totalNormalized: 0,
    droppedCount: 0,
    avgConfidence: 0,
    activeConnectors: 0,
    throughputEps: 0
  };

  private pollInterval: any = null;
  private lastPollTime: number = Date.now();

  constructor() {
    this.initializeConnectors();
  }

  private initializeConnectors() {
    this.connectors = [
      new MockSIEMConnector({
        id: 'splunk-global-01',
        name: 'Enterprise Splunk SIEM',
        type: TelemetrySourceType.SIEM,
        enabled: true
      }),
      new CloudTrailConnector({
        id: 'aws-us-east-1',
        name: 'AWS CloudTrail Production',
        type: TelemetrySourceType.CLOUD_TRAIL,
        enabled: true
      }),
      new EDRConnector({
        id: 'crowdstrike-falcon',
        name: 'CrowdStrike Falcon',
        type: TelemetrySourceType.EDR,
        enabled: true
      })
    ];
    this.metrics.activeConnectors = this.connectors.length;
    logger.info(`Initialized ${this.metrics.activeConnectors} telemetry connectors`);
  }

  public startIngestion() {
    if (this.pollInterval) return;
    
    logger.info('Starting enterprise telemetry ingestion engine');
    this.pollInterval = setInterval(async () => {
      await this.pollAll();
    }, CONFIG.telemetry.pollIntervalMs);
  }

  public stopIngestion() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info('Stopped telemetry ingestion engine');
    }
  }

  private async pollAll() {
    const start = Date.now();
    const rawEvents: RawTelemetryEvent[] = [];
    
    try {
      for (const connector of this.connectors) {
        if (!connector.isEnabled()) continue;
        const polled = await connector.poll();
        rawEvents.push(...polled);
      }

      this.metrics.totalIngested += rawEvents.length;

      // Rate Limiting Check
      if (rawEvents.length > CONFIG.telemetry.rateLimitEps) {
        logger.warn(`Ingestion rate limit exceeded! Dropping ${rawEvents.length - CONFIG.telemetry.rateLimitEps} events.`);
        rawEvents.splice(CONFIG.telemetry.rateLimitEps);
      }

      for (const raw of rawEvents) {
        const normalized = await telemetryPipeline.process(raw);
        if (normalized) {
          this.metrics.totalNormalized++;
          
          telemetryBus.publish(TelemetryTopic.SYSTEM_LOG, {
            source: normalized.source,
            message: normalized.message,
            severity: normalized.severity,
            nodeId: normalized.targetAsset,
            metadata: {
              sourceType: normalized.sourceType,
              category: normalized.category,
              confidence: normalized.confidenceScore,
              tags: normalized.tags,
              ...normalized.eventSpecificData
            }
          });
        } else {
          this.metrics.droppedCount++;
        }
      }

      const end = Date.now();
      const duration = end - start;
      const timeSinceLastPoll = end - this.lastPollTime;
      this.lastPollTime = end;
      
      this.metrics.throughputEps = Math.round((rawEvents.length / (timeSinceLastPoll / 1000)) * 10) / 10;
      
      if (rawEvents.length > 0) {
        logger.debug(`Ingestion cycle completed: ${rawEvents.length} events processed in ${duration}ms`);
      }
    } catch (error) {
      logger.error('Critical failure in ingestion cycle', error);
    }
  }

  public getMetrics(): TelemetryProcessorMetrics {
    return { ...this.metrics };
  }
}

export const ingestionManager = new EnterpriseIngestionManager();
