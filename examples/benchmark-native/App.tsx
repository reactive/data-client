/**
 * Minimal Run/status UI + auto-run from Android intent extras.
 * Prevents overlapping runs. Sustained visual update during measurement.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, StatusBar } from 'react-native';

import BenchNative from './src/BenchNative';
import { setAnimationTickListener } from './src/measure';
import { executeMeasurement } from './src/runOrchestration';
import { scenarioId } from './src/scenario';
import type { GCScenarioConfig, LaunchConfig } from './src/types';
import { parseLaunchConfig } from './src/validateConfig';

const DEFAULT_CONFIG: GCScenarioConfig = {
  candidateKind: 'entity',
  pattern: 'unique',
  count: 1000,
  control: 'gc',
};

export default function App() {
  const [status, setStatus] = useState('Ready');
  const [lastId, setLastId] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState(0);
  const [config, setConfig] = useState<GCScenarioConfig>(DEFAULT_CONFIG);
  const [samples, setSamples] = useState(1);
  const [label, setLabel] = useState<string | undefined>(undefined);
  const runningRef = useRef(false);
  const autoStarted = useRef(false);

  const runWithConfig = useCallback(
    async (cfg: GCScenarioConfig, sampleCount: number, runLabel?: string) => {
      if (runningRef.current) {
        setStatus('Busy — overlapping runs blocked');
        return;
      }
      runningRef.current = true;
      setLastId(scenarioId(cfg));
      try {
        await executeMeasurement({
          config: cfg,
          samples: sampleCount,
          label: runLabel,
          onStatus: setStatus,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(`Error: ${message}`);
      } finally {
        runningRef.current = false;
      }
    },
    [],
  );

  const runOnce = useCallback(() => {
    void runWithConfig(config, samples, label);
  }, [config, label, runWithConfig, samples]);

  useEffect(() => {
    setAnimationTickListener(t => {
      setAnimPhase(t);
    });
    return () => setAnimationTickListener(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await BenchNative.getLaunchConfig();
        if (cancelled) return;
        let parsed: LaunchConfig;
        try {
          parsed = parseLaunchConfig(raw);
        } catch (e) {
          setStatus(
            `Invalid launch config: ${e instanceof Error ? e.message : String(e)}`,
          );
          return;
        }
        const cfg: GCScenarioConfig = {
          candidateKind: parsed.candidateKind,
          pattern: parsed.pattern,
          count: parsed.count,
          control: parsed.control,
        };
        setConfig(cfg);
        setSamples(parsed.samples);
        setLabel(parsed.label);
        if (parsed.autoRun && !autoStarted.current) {
          autoStarted.current = true;
          setTimeout(() => {
            if (cancelled) return;
            void runWithConfig(cfg, parsed.samples, parsed.label);
          }, 50);
        }
      } catch (e) {
        if (!cancelled) {
          setStatus(
            `Launch config unavailable: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runWithConfig]);

  const pulse = ((animPhase / 16) % 40) / 40;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>GC Bench (Hermes release)</Text>
      <Text style={styles.meta}>
        {config.candidateKind}/{config.pattern}/{config.count}/{config.control}
      </Text>
      {lastId ? <Text style={styles.id}>{lastId}</Text> : null}
      <Text style={styles.status}>{status}</Text>

      <View
        style={[
          styles.anim,
          {
            transform: [{ translateX: pulse * 120 - 60 }],
            opacity: 0.35 + pulse * 0.65,
          },
        ]}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={runOnce}
        accessibilityRole="button"
        accessibilityLabel="Run GC benchmark"
      >
        <Text style={styles.buttonText}>Run</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f2f4f7',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111',
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  id: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 14,
    color: '#222',
    marginBottom: 24,
  },
  anim: {
    width: 48,
    height: 48,
    backgroundColor: '#2a6f97',
    marginBottom: 32,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#1b4332',
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
