import { useSimulation } from '../hooks/useSimulation';
import { telemetryBus } from './bus';
import { TelemetryTopic, NodeUpdatePayload, AttackAlertPayload, MetricTickPayload } from './schemas';
import { useEffect } from 'react';

/**
 * TelemetryBridge
 * Connects the Simulation Hook to the Telemetry Bus
 * This allows the simulation to act as a "Mock Data Source" 
 * that mimics a real backend streaming events.
 */
export function useTelemetryBridge() {
  const { state, launchAttack, isolateNode, resetSimulation, setSimulationSpeed, toggleDefenseModule } = useSimulation();

  // Every time state changes, we could emit updates, 
  // but it's more efficient to let the simulation engine emit them directly.
  // For now, we sync the UI stats to the bus for other potential listeners.

  useEffect(() => {
    telemetryBus.publish(TelemetryTopic.METRIC_TICK, {
      source: 'simulation_engine',
      metrics: {
        ...state.metrics,
        threatLevel: state.threatLevel
      }
    } as MetricTickPayload);
  }, [state.metrics, state.threatLevel]);

  return {
    state,
    actions: {
      launchAttack,
      isolateNode,
      resetSimulation,
      setSimulationSpeed,
      toggleDefenseModule
    }
  };
}
