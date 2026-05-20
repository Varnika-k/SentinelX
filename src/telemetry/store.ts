import { useState, useEffect, useCallback, useRef } from 'react';
import { telemetryBus } from './bus';
import { TelemetryTopic, TelemetryEnvelope, ConnectionStatus } from './schemas';
import { SimulationState } from '../types/simulation';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_IDENTITIES, INITIAL_ROLES, INITIAL_RELATIONSHIPS, INITIAL_ENVIRONMENTS, INITIAL_KNOWLEDGE_BASE, INITIAL_ORCHESTRATION } from '../lib/simulation-data';
import { TelemetryService } from '../core/telemetry-service';
import { telemetryClient } from './client';
import { TelemetryProcessor } from './processor';
import { ingestionManager } from './ingestion-manager';

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
        nextState = TelemetryProcessor.process(nextState, envelope);
      }
      return nextState;
    });

    frameRef.current = requestAnimationFrame(processQueue);
  }, []);

  useEffect(() => {
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
