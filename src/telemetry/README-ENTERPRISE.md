# SentinelX Enterprise Telemetry Integration Layer

## Overview
The Enterprise Telemetry Integration Layer is a high-fidelity, modular pipeline designed to ingest, normalize, and correlate security events from diverse infrastructure sources.

## Data Lifecycle

### 1. Ingestion Phase
Telemetry enters the system through **Connectors**.
- **Pull Model**: Connectors poll external APIs (e.g., Splunk, AWS CloudWatch).
- **Push Model**: Webhooks or Syslog listeners receive events in real-time.
- **Queueing**: Events are briefly buffered to handle bursts (Rate limiting: 500 EPS per source).

### 2. Normalization Pipeline
Raw payloads are transformed into the **Universal Telemetry Schema**.
- **Validation**: Strict schema checks to prevent ID poisoning or bloated payloads.
- **Mapping**: Source-specific fields (e.g., `dest_ip` vs `target_host`) are mapped to unified attributes.

### 3. Enrichment Layer
Normalized events are augmented with additional context:
- **Geo-IP**: Origin locations.
- **Asset Inventory**: Mapping IP/Hostnames to known internal assets.
- **Threat Intel**: Cross-referencing against reputation databases.

### 4. Correlation & Deduplication
- **Deduplication**: Sliding window cache (1000 events) to prevent alert fatigue.
- **Correlation**: Linking multiple low-severity events into a high-severity incident.

## Source Connectors Supported
- **AWS CloudTrail**: Lambda/IAM/S3 management events.
- **Kubernetes Audit**: API Server verb/resource monitoring.
- **Crowdstrike/EDR**: Endpoint process execution and memory injection alerts.
- **Enterprise SIEM (Splunk/QRadar)**: Multi-source aggregated security logs.
- **Network Flow**: Firewall traffic patterns and IDS/IPS triggers.

## Operational Metrics
Available via the `ingestionManager.getMetrics()` API:
- `totalIngested`: Count of raw events received.
- `totalNormalized`: Count of events successfully processed.
- `throughputEps`: Current Events Per Second throughput.
- `activeConnectors`: Count of healthy ingestion sources.

## Configuration
Connectors are configured in `ingestion-manager.ts`.
```typescript
{
  id: 'aws-us-east-1',
  name: 'AWS CloudTrail Production',
  type: TelemetrySourceType.CLOUD_TRAIL,
  enabled: true
}
```
