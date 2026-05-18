import { 
  RawTelemetryEvent, 
  NormalizedTelemetryEvent, 
  TelemetrySourceType 
} from './enterprise-schemas';
import { Severity } from '../types/telemetry';
import { logger } from '../lib/logger';
import { CONFIG } from '../config';

export class TelemetryPipeline {
  private deduplicationCache = new Set<string>();
  private readonly MAX_CACHE_SIZE = CONFIG.telemetry.maxCacheSize;
  private readonly MAX_PAYLOAD_SIZE = 64 * 1024; // 64KB limit for raw payloads

  constructor() {}

  /**
   * Main entry point for a single raw event
   */
  public async process(rawEvent: RawTelemetryEvent): Promise<NormalizedTelemetryEvent | null> {
    try {
      // 1. Validation & Security Check
      if (!this.isValid(rawEvent)) {
        logger.warn('Validation failed for raw telemetry event', { sourceId: rawEvent.sourceId });
        return null;
      }

      // 2. Normalization
      const normalized = this.normalize(rawEvent);
      if (!normalized) {
        logger.warn('Normalization failed for raw telemetry event', { sourceType: rawEvent.sourceType });
        return null;
      }

      // 3. De-duplication
      if (this.isDuplicate(normalized)) {
        return null;
      }

      // 4. Enrichment
      const enriched = this.enrich(normalized);

      return enriched;
    } catch (error) {
      logger.error('Error in telemetry pipeline processing', error);
      return null;
    }
  }

  private isValid(raw: RawTelemetryEvent): boolean {
    // Ensure sourceId and rawPayload exist
    if (!raw.sourceId || !raw.rawPayload) return false;

    // Check payload size to prevent resource exhaustion attacks
    const payloadSize = JSON.stringify(raw.rawPayload).length;
    if (payloadSize > this.MAX_PAYLOAD_SIZE) {
      logger.error('Telemetry payload exceeds maximum size limit', { size: payloadSize, source: raw.sourceId });
      return false;
    }

    return true;
  }

  private normalize(raw: RawTelemetryEvent): NormalizedTelemetryEvent | null {
    const { sourceType, rawPayload, sourceId } = raw;
    
    // Universal mapping system (Simplified for implementation)
    let message = '';
    let severity: Severity = 'low';
    let targetAsset = '';
    let category = 'generic';

    switch (sourceType) {
      case TelemetrySourceType.FIREWALL:
        message = `Firewall Alert: ${rawPayload.rule_name || 'Generic Rule'} - ${rawPayload.action}`;
        severity = rawPayload.priority === 'high' ? 'high' : 'medium';
        targetAsset = rawPayload.dest_ip;
        category = 'network';
        break;
      case TelemetrySourceType.EDR:
        message = `EDR Alert: Process execution of ${rawPayload.process_name} flagged as suspicious`;
        severity = 'high';
        targetAsset = rawPayload.hostname;
        category = 'endpoint';
        break;
      case TelemetrySourceType.CLOUD_TRAIL:
        message = `Cloud Event: ${rawPayload.event_name} by ${rawPayload.user_id}`;
        severity = rawPayload.risk_level || 'low';
        targetAsset = rawPayload.resource_id;
        category = 'cloud';
        break;
      case TelemetrySourceType.K8S_AUDIT:
        message = `K8s Audit: ${rawPayload.verb} on ${rawPayload.resource}`;
        severity = rawPayload.decision === 'allow' ? 'low' : 'medium';
        targetAsset = rawPayload.namespace;
        category = 'container';
        break;
      default:
        message = rawPayload.description || rawPayload.message || 'Legacy Telemetry Event';
        severity = rawPayload.severity || 'low';
        targetAsset = rawPayload.asset_id;
    }

    return {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(rawPayload.timestamp || Date.now()),
      source: sourceId,
      sourceType,
      message,
      severity,
      targetAsset,
      category,
      eventSpecificData: rawPayload,
      tags: [sourceType, category],
      confidenceScore: raw.confidence || 0.8
    };
  }

  private isDuplicate(event: NormalizedTelemetryEvent): boolean {
    const hash = `${event.sourceType}:${event.message}:${event.targetAsset}`;
    if (this.deduplicationCache.has(hash)) return true;
    
    this.deduplicationCache.add(hash);
    if (this.deduplicationCache.size > this.MAX_CACHE_SIZE) {
      const first = this.deduplicationCache.values().next().value;
      this.deduplicationCache.delete(first);
    }
    return false;
  }

  private enrich(event: NormalizedTelemetryEvent): NormalizedTelemetryEvent {
    // Add threat intel data
    if (event.category === 'network' && event.eventSpecificData.src_ip) {
      event.tags.push('ip-reputation-check');
      // In a real system, we'd look up an IP reputation DB
      if (['8.8.8.8', '1.1.1.1'].includes(event.eventSpecificData.src_ip)) {
        event.tags.push('known-dns-provider');
      }
    }

    // Add asset metadata
    if (event.targetAsset) {
      event.tags.push(`asset:${event.targetAsset}`);
    }

    return event;
  }
}

export const telemetryPipeline = new TelemetryPipeline();
