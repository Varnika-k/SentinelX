import Redis, { RedisOptions } from 'ioredis';
import { logger } from './logger';

class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private isMock = !process.env.REDIS_URL;

  private constructor() {
    this.init();
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private init() {
    const redisUrl = process.env.REDIS_URL;
    
    if (this.isMock || !redisUrl) {
      logger.warn('REDIS_URL not found. Running in MOCK (In-Memory) mode.');
      this.isMock = true;
      return;
    }

    const options: RedisOptions = {
      maxRetriesPerRequest: null, // Allow infinite reconnection attempts for pub/sub reliability
      retryStrategy: (times: number) => {
        // Exponential backoff with jitter
        const delay = Math.min(Math.pow(2, times) * 100 + Math.random() * 200, 10000);
        logger.info(`Redis reconnect attempt #${times} in ${Math.round(delay)}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.slice(0, targetError.length) === targetError) {
          return true;
        }
        return false;
      }
    };

    // Upstash or managed secure Redis cloud connections require TLS parameters
    if (redisUrl.startsWith('rediss://')) {
      options.tls = {
        rejectUnauthorized: false // Avoid self-signed or intermediate chain certificate issues in managed clouds
      };
    }

    try {
      this.client = new Redis(redisUrl, options);
      this.subscriber = new Redis(redisUrl, options);

      this.client.on('connect', () => {
        this.isMock = false;
        logger.info('Redis Core Client successfully connected to stream bus');
      });

      this.client.on('error', (err) => {
        logger.error('Redis Core Client connection error. Operating with local fallback...', err.message);
        // We do NOT crash; we rely on event-bus's local fallback mechanism
      });
      
      this.subscriber.on('connect', () => {
        logger.info('Redis Pub/Sub Subscriber successfully connected');
      });

      this.subscriber.on('error', (err) => {
        logger.error('Redis Subscriber connection error', err.message);
      });
    } catch (error) {
      logger.error('Critical failure during Redis Client initialization', error);
      this.isMock = true;
    }
  }

  public getClient(): Redis | null {
    return this.client;
  }

  public getSubscriber(): Redis | null {
    return this.subscriber;
  }

  public getIsMock(): boolean {
    return this.isMock;
  }
}

export const redisManager = RedisManager.getInstance();
