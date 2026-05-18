/**
 * Application Error Boundary & Global Error Handling
 */

import { logger } from './logger';

export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    logger.error('Uncaught Client Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logger.error('Unhandled Promise Rejection', {
      reason: typeof reason === 'object' && reason !== null ? (reason.message ? reason : { raw_type: typeof reason, has_own_props: Object.keys(reason).length > 0, value: String(reason) }) : reason,
      promise: event.promise ? '[Promise Object]' : 'undefined',
      message: reason?.message || String(reason),
      stack: reason?.stack || 'No stack trace available'
    });
  });

  logger.info('Global client-side error handling initialized');
}
