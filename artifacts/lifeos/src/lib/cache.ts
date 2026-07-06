/**
 * Client-side caching utilities for LifeOS
 * Provides in-memory and localStorage caching
 */

import { createLogger } from './logger';

const logger = createLogger('Cache');

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: number | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = window.setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300) {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now()
    };

    this.cache.set(key, entry);
    logger.debug(`Cache SET: ${key}`, { ttl: ttlSeconds });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug(`Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`Cache EXPIRED: ${key}`);
      return null;
    }

    logger.debug(`Cache HIT: ${key}`);
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string) {
    this.cache.delete(key);
    logger.debug(`Cache DELETE: ${key}`);
  }

  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  private cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup removed ${removed} expired entries`);
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.createdAt) / 1000),
        ttl: Math.round((entry.expiresAt - Date.now()) / 1000)
      }))
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

class LocalStorageCache {
  private prefix = 'lifeos-cache:';

  set<T>(key: string, value: T, ttlSeconds: number = 300) {
    try {
      const entry: CacheEntry<T> = {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
        createdAt: Date.now()
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      logger.debug(`LocalStorage SET: ${key}`, { ttl: ttlSeconds });
    } catch (error) {
      logger.warn('LocalStorage write failed', { key, error: (error as Error).message });
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) {
        logger.debug(`LocalStorage MISS: ${key}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(item);

      if (Date.now() > entry.expiresAt) {
        this.delete(key);
        logger.debug(`LocalStorage EXPIRED: ${key}`);
        return null;
      }

      logger.debug(`LocalStorage HIT: ${key}`);
      return entry.value;
    } catch (error) {
      logger.warn('LocalStorage read failed', { key, error: (error as Error).message });
      return null;
    }
  }

  delete(key: string) {
    try {
      localStorage.removeItem(this.prefix + key);
      logger.debug(`LocalStorage DELETE: ${key}`);
    } catch (error) {
      logger.warn('LocalStorage delete failed', { key, error: (error as Error).message });
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
      keys.forEach(k => localStorage.removeItem(k));
      logger.info('LocalStorage cache cleared');
    } catch (error) {
      logger.warn('LocalStorage clear failed', { error: (error as Error).message });
    }
  }
}

// Export singleton instances
export const memoryCache = new MemoryCache();
export const localStorageCache = new LocalStorageCache();

/**
 * Get cached value or compute and cache it
 */
export async function getCached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300,
  useLocalStorage: boolean = false
): Promise<T> {
  const cache = useLocalStorage ? localStorageCache : memoryCache;
  
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Compute value
  const value = await fn();

  // Cache result
  cache.set(key, value, ttlSeconds);

  return value;
}

/**
 * Cache key builder for common patterns
 */
export const CacheKeys = {
  ultraScore: (userId: string, date: string) => `ultra-score:${userId}:${date}`,
  metrics: (userId: string, dateRange: string) => `metrics:${userId}:${dateRange}`,
  logs: (userId: string, dateRange: string) => `logs:${userId}:${dateRange}`,
  hubScore: (userId: string, hubId: number, date: string) => `hub-score:${userId}:${hubId}:${date}`,
  automation: (userId: string) => `automation:${userId}`,
  dashboard: (userId: string, date: string) => `dashboard:${userId}:${date}`,
  habits: (userId: string) => `habits:${userId}`,
  projects: (userId: string) => `projects:${userId}`
};
