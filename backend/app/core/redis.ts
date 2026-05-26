import { Redis } from "@upstash/redis";
import { logger } from "./logger";

class RedisManager {
  private static instance: RedisManager;
  private client: Redis;
  private isMock = false;

  private constructor() {
    this.client = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!,
    });

    logger.info("Upstash Redis REST client initialized.");
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient() {
    return this.client;
  }

  public getSubscriber() {
    return null;
  }

  public getIsMock() {
    return this.isMock;
  }
}

export const redisManager = RedisManager.getInstance();