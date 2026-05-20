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
    
    if (this.isMock) {
      logger.warn('REDIS_URL not found. Running in MOCK (In-Memory) mode.');
      return;
    }

    const options: RedisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    try {
      this.client = new Redis(redisUrl!, options);
      this.subscriber = new Redis(redisUrl!, options);

      this.client.on('connect', () => logger.info('Redis Client Connected'));
      this.client.on('error', (err) => logger.error('Redis Client Error', err));
      
      this.subscriber.on('connect', () => logger.info('Redis Subscriber Connected'));
    } catch (error) {
      logger.error('Failed to initialize Redis', error);
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
