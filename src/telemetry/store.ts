import { useState, useEffect, useCallback, useRef } from 'react';
import { telemetryBus } from './bus';
import { TelemetryTopic, TelemetryEnvelope, ConnectionStatus } from './schemas';
import { SimulationState } from '../types/simulation';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_IDENTITIES, INITIAL_ROLES, INITIAL_RELATIONSHIPS, INITIAL_ENVIRONMENTS, INITIAL_KNOWLEDGE_BASE, INITIAL_ORCHESTRATION } from '../lib/simulation-data';
import { TelemetryService } from '../core/telemetry-service';
import { telemetryClient } from './client';
import { TelemetryProcessor } from './processor';
import { ingestionManager } from './ingestion-manager';
import { ReplayEngine } from './replay';

/**
 * TelemetryStore
 * The single source of truth for the UI, driven entirely by the Telemetry Bus.
 * Implements buffering/batching to handle high-velocity telemetry streams.
 */
export function useTelemetryStore() {
  const [state, setState] = useState<SimulationState>({
    nodes: INITIAL_NODES,
    links: INITIAL_LINKS,
    identities: INITIAL_IDENTITIES,
    roles: INITIAL_ROLES,
    identityRelationships: INITIAL_RELATIONSHIPS,
    environments: INITIAL_ENVIRONMENTS,
    knowledgeBase: INITIAL_KNOWLEDGE_BASE,
    agentOrchestration: INITIAL_ORCHESTRATION,
    events: [],
    incidents: [],
    defenseRecommendations: [],
    isSimulating: false,
    threatLevel: 'low',
    metrics: TelemetryService.calculateMetrics(INITIAL_NODES),
    simulationSpeed: 3000,
    spreadVelocity: 1.0,
    activeDefenseModules: ['firewall'],
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  
  // Buffering Logic
  const eventQueue = useRef<TelemetryEnvelope[]>([]);
  const frameRef = useRef<number>(0);

  const processQueue = useCallback(() => {
    if (eventQueue.current.length === 0) {
      frameRef.current = requestAnimationFrame(processQueue);
      return;
    }

    const batch = [...eventQueue.current];
    eventQueue.current = [];

    setState(prev => {
      let nextState = prev;
      for (const envelope of batch) {
        if (envelope.topic === TelemetryTopic.UI_ACTION && envelope.payload?.action === 'REPLAY_STATE_RESTORE') {
          // Bypass normal processors and directly restore the full historical state
          nextState = envelope.payload.state;
        } else {
          nextState = TelemetryProcessor.process(nextState, envelope);

          // If recordable live event, cache state snapshot to stabilize seek requests
          if (envelope.topic !== TelemetryTopic.METRIC_TICK && 
              envelope.topic !== TelemetryTopic.UI_ACTION && 
              !envelope.payload?._isReplay) {
            ReplayEngine.recordSnapshotForEnvelope(envelope, nextState);
          }
        }
      }
      return nextState;
    });

    frameRef.current = requestAnimationFrame(processQueue);
  }, []);

  useEffect(() => {
    // Sync initial clean state with ReplayEngine for root reverts
    ReplayEngine.setInitialState(state);

    // Start WebSocket connection
    telemetryClient.connect();
    setConnectionStatus('reconnecting');

    // Start telemetry ingestion
    ingestionManager.startIngestion();

    // Start processing loop
    frameRef.current = requestAnimationFrame(processQueue);

    // Subscribe to ALL topics and queue them
    const unsubAll = telemetryBus.subscribe('*', (env) => {
      eventQueue.current.push(env);
      
      // Special handling for connection status which we want reactive outside the simulation state
      if (env.topic === TelemetryTopic.SYSTEM_LOG) {
        const msg = (env.payload as any).message;
        if (msg?.includes('Connection active')) setConnectionStatus('connected');
        if (msg?.includes('Connection failure')) setConnectionStatus('disconnected');
      }
    });

    return () => {
      unsubAll();
      cancelAnimationFrame(frameRef.current);
      ingestionManager.stopIngestion();
      telemetryClient.disconnect();
    };
  }, [processQueue]);

  return {
    state,
    connectionStatus,
    isOnline: connectionStatus === 'connected'
  };
}
