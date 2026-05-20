import { TelemetrySourceType } from '../telemetry/enterprise-schemas';

const safeEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined' ? process.env : {} as Record<string, string>;

export const ENV = safeEnv.NODE_ENV || 'development';
export const IS_PROD = ENV === 'production';
export const IS_DEV = ENV === 'development';
export const IS_STAGING = ENV === 'staging';

export const CONFIG = {
  app: {
    name: 'SentinelX',
    port: parseInt(safeEnv.PORT || '3000', 10),
    host: '0.0.0.0',
    version: '1.0.0-enterprise',
  },
  ai: {
    apiKey: safeEnv.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    enabled: !!safeEnv.GEMINI_API_KEY,
  },
  telemetry: {
    pollIntervalMs: parseInt(safeEnv.TELEMETRY_POLL_INTERVAL || '3000', 10),
    maxCacheSize: parseInt(safeEnv.TELEMETRY_CACHE_SIZE || '1000', 10),
    rateLimitEps: parseInt(safeEnv.TELEMETRY_RATE_LIMIT || '500', 10),
  },
  logging: {
    level: safeEnv.LOG_LEVEL || (IS_PROD ? 'info' : 'debug'),
  },
};

/**
 * Validates that core environment variables are present
 */
export function validateConfig() {
  const missing = [];
  
  if (!CONFIG.ai.apiKey && IS_PROD) {
    missing.push('GEMINI_API_KEY');
  }

  if (missing.length > 0) {
    console.warn(`[Config] Missing environment variables in ${ENV}: ${missing.join(', ')}`);
    if (IS_PROD) {
       // In strict production, we might want to fail hard, but for this platform we'll just warn
       // throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
  }
}
