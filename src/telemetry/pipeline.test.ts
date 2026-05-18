import { describe, it, expect } from 'vitest';
import { telemetryPipeline } from './pipeline';
import { TelemetrySourceType } from './enterprise-schemas';

describe('TelemetryPipeline', () => {
  it('should normalize firewall events correctly', async () => {
    const rawEvent = {
      sourceId: 'fw-01',
      sourceType: TelemetrySourceType.FIREWALL,
      ingestTimestamp: new Date(),
      rawPayload: {
        timestamp: '2024-01-01T00:00:00Z',
        rule_name: 'Deny All',
        action: 'blocked',
        priority: 'high',
        dest_ip: '10.0.0.1'
      }
    };

    const normalized = await telemetryPipeline.process(rawEvent);
    
    expect(normalized).not.toBeNull();
    expect(normalized?.message).toContain('Firewall Alert');
    expect(normalized?.severity).toBe('high');
    expect(normalized?.targetAsset).toBe('10.0.0.1');
    expect(normalized?.category).toBe('network');
  });

  it('should deduplicate identical events', async () => {
    const rawEvent = {
        sourceId: 'edr-01',
        sourceType: TelemetrySourceType.EDR,
        ingestTimestamp: new Date(),
        rawPayload: {
          hostname: 'WKSTN-01',
          process_name: 'malware.exe'
        }
    };

    const first = await telemetryPipeline.process(rawEvent);
    const second = await telemetryPipeline.process(rawEvent);

    expect(first).not.toBeNull();
    expect(second).toBeNull(); // Should be dropped as duplicate
  });
});
