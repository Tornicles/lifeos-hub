/**
 * Performance monitoring utilities for LifeOS
 * Tracks page load times, API response times, and user interactions
 */

import { createLogger } from './logger';

const logger = createLogger('Performance');

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring a performance mark
   */
  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure time since a mark and log it
   */
  measure(name: string, markName: string, metadata?: Record<string, any>) {
    const startTime = this.marks.get(markName);
    if (!startTime) {
      logger.warn(`Performance mark "${markName}" not found`);
      return;
    }

    const duration = Math.round(performance.now() - startTime);
    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      metadata
    });

    this.marks.delete(markName);
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Log if duration is above threshold
    if (metric.unit === 'ms' && metric.value > 1000) {
      logger.warn(`Slow operation detected: ${metric.name}`, {
        duration_ms: metric.value,
        ...metric.metadata
      });
    } else {
      logger.debug(`Performance metric recorded: ${metric.name}`, {
        value: metric.value,
        unit: metric.unit,
        ...metric.metadata
      });
    }

    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round(sum / metrics.length);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.marks.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure React component render time
 */
export function measureComponentRender(componentName: string) {
  const markName = `component-${componentName}-${Date.now()}`;
  performanceMonitor.mark(markName);

  return () => {
    performanceMonitor.measure(
      `Component Render: ${componentName}`,
      markName,
      { component: componentName }
    );
  };
}

/**
 * Measure API call duration
 */
export async function measureApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const markName = `api-${endpoint}-${Date.now()}`;
  performanceMonitor.mark(markName);

  try {
    const result = await fn();
    performanceMonitor.measure(
      `API Call: ${endpoint}`,
      markName,
      { endpoint, status: 'success' }
    );
    return result;
  } catch (error) {
    performanceMonitor.measure(
      `API Call: ${endpoint}`,
      markName,
      { endpoint, status: 'error', error: (error as Error).message }
    );
    throw error;
  }
}

/**
 * Measure database query duration
 */
export async function measureDbQuery<T>(
  queryName: string,
  fn: () => Promise<T>
): Promise<T> {
  const markName = `db-${queryName}-${Date.now()}`;
  performanceMonitor.mark(markName);

  try {
    const result = await fn();
    performanceMonitor.measure(
      `DB Query: ${queryName}`,
      markName,
      { query: queryName, status: 'success' }
    );
    return result;
  } catch (error) {
    performanceMonitor.measure(
      `DB Query: ${queryName}`,
      markName,
      { query: queryName, status: 'error', error: (error as Error).message }
    );
    throw error;
  }
}

/**
 * Report Web Vitals (LCP, FID, CLS)
 */
export function reportWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceMonitor.recordMetric({
        name: 'Largest Contentful Paint',
        value: Math.round(lastEntry.startTime),
        unit: 'ms',
        timestamp: Date.now()
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        performanceMonitor.recordMetric({
          name: 'First Input Delay',
          value: Math.round(entry.processingStart - entry.startTime),
          unit: 'ms',
          timestamp: Date.now()
        });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      performanceMonitor.recordMetric({
        name: 'Cumulative Layout Shift',
        value: Math.round(clsValue * 1000) / 1000,
        unit: 'count',
        timestamp: Date.now()
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 50) {
          performanceMonitor.recordMetric({
            name: 'Long Task',
            value: Math.round(entry.duration),
            unit: 'ms',
            timestamp: Date.now(),
            metadata: {
              name: entry.name,
              startTime: entry.startTime
            }
          });
        }
      });
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long tasks not supported
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  reportWebVitals();
  monitorLongTasks();
  
  logger.info('Performance monitoring initialized');
}
