import { TelemetrySourceType } from '../telemetry/enterprise-schemas';

export const ENV = process.env.NODE_ENV || 'development';
export const IS_PROD = ENV === 'production';
export const IS_DEV = ENV === 'development';
export const IS_STAGING = ENV === 'staging';

export const CONFIG = {
  app: {
    name: 'SentinelX',
    port: parseInt(process.env.PORT || '3000', 10),
    host: '0.0.0.0',
    version: '1.0.0-enterprise',
  },
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    enabled: !!process.env.GEMINI_API_KEY,
  },
  telemetry: {
    pollIntervalMs: parseInt(process.env.TELEMETRY_POLL_INTERVAL || '3000', 10),
    maxCacheSize: parseInt(process.env.TELEMETRY_CACHE_SIZE || '1000', 10),
    rateLimitEps: parseInt(process.env.TELEMETRY_RATE_LIMIT || '500', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || (IS_PROD ? 'info' : 'debug'),
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
