import { sentinelBackend } from './backend/app/main';
import { logger } from './backend/app/core/logger';

sentinelBackend.start().catch(err => {
  logger.error('CRITICAL: Backend startup failed', err);
  process.exit(1);
});
