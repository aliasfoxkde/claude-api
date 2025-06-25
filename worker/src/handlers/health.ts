import { Context } from 'hono';
import { Env } from '../types';
import { puterClient } from '../utils/puter-client';

/**
 * Handle health check endpoint
 */
export async function handleHealth(c: Context<{ Bindings: Env }>) {
  try {
    const startTime = Date.now();
    
    // Test Puter client connectivity
    let puterStatus = 'unknown';
    let puterLatency = 0;

    try {
      const puterStartTime = Date.now();
      const models = await puterClient.getModels();
      puterLatency = Date.now() - puterStartTime;
      // If we get models back, Puter is working
      puterStatus = models && models.length > 0 ? 'healthy' : 'degraded';
    } catch (error) {
      puterStatus = 'unhealthy';
      console.error('Puter health check failed:', error);
    }

    // Test KV storage
    let kvStatus = 'unknown';
    let kvLatency = 0;
    
    try {
      const kvStartTime = Date.now();
      await c.env.API_KEYS.put('health-check', 'test', { expirationTtl: 60 });
      await c.env.API_KEYS.get('health-check');
      await c.env.API_KEYS.delete('health-check');
      kvLatency = Date.now() - kvStartTime;
      kvStatus = 'healthy';
    } catch (error) {
      kvStatus = 'unhealthy';
      console.error('KV health check failed:', error);
    }

    const totalLatency = Date.now() - startTime;
    const overallStatus = puterStatus === 'healthy' && kvStatus === 'healthy' ? 'healthy' : 'degraded';

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: c.env.ENVIRONMENT,
      services: {
        puter: {
          status: puterStatus,
          latency: puterLatency
        },
        kv: {
          status: kvStatus,
          latency: kvLatency
        }
      },
      latency: {
        total: totalLatency,
        unit: 'ms'
      },
      uptime: process.uptime ? Math.floor(process.uptime()) : null
    };

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    return c.json(healthData, statusCode);

  } catch (error) {
    console.error('Health check error:', error);
    
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      version: '1.0.0',
      environment: c.env.ENVIRONMENT
    }, 503);
  }
}

/**
 * Handle readiness check endpoint
 */
export async function handleReadiness(c: Context<{ Bindings: Env }>) {
  try {
    // Check if all required services are available
    const checks = await Promise.allSettled([
      // Test Puter client
      puterClient.getModels(),
      
      // Test KV storage
      c.env.API_KEYS.put('readiness-check', 'test', { expirationTtl: 60 })
        .then(() => c.env.API_KEYS.get('readiness-check'))
        .then(() => c.env.API_KEYS.delete('readiness-check'))
    ]);

    const allReady = checks.every(check => check.status === 'fulfilled');

    if (allReady) {
      return c.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          puter: 'ready',
          kv: 'ready'
        }
      });
    } else {
      return c.json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        checks: {
          puter: checks[0].status === 'fulfilled' ? 'ready' : 'not_ready',
          kv: checks[1].status === 'fulfilled' ? 'ready' : 'not_ready'
        }
      }, 503);
    }

  } catch (error) {
    console.error('Readiness check error:', error);
    
    return c.json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    }, 503);
  }
}

/**
 * Handle liveness check endpoint
 */
export async function handleLiveness(c: Context<{ Bindings: Env }>) {
  // Simple liveness check - just return that the worker is running
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: c.env.ENVIRONMENT
  });
}

/**
 * Handle metrics endpoint
 */
export async function handleMetrics(c: Context<{ Bindings: Env }>) {
  try {
    // This is a simplified metrics endpoint
    // In production, you might want to integrate with Cloudflare Analytics
    // or other monitoring services
    
    const metrics = {
      timestamp: new Date().toISOString(),
      worker: {
        version: '1.0.0',
        environment: c.env.ENVIRONMENT,
        region: c.req.cf?.colo || 'unknown'
      },
      requests: {
        // These would be actual metrics in production
        total: 0,
        success: 0,
        errors: 0,
        rate_limited: 0
      },
      latency: {
        // These would be actual metrics in production
        p50: 0,
        p95: 0,
        p99: 0
      },
      models: {
        available: await puterClient.getModels().then(models => models.length).catch(() => 0)
      }
    };

    return c.json(metrics);

  } catch (error) {
    console.error('Metrics error:', error);
    
    return c.json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
}
