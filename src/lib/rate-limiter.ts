/**
 * Simple in-memory rate limiter for API endpoints
 * In production, use Redis or a dedicated rate limiting service
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      this.limits.delete(identifier)
    }

    if (!entry) {
      // First request
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      }
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment count
    entry.count++
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }
}

// Create rate limiters for different endpoints
export const chatRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10 // 10 requests per minute
})

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20 // 20 requests per minute
})

export const embeddingRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50 // 50 requests per minute
})

// Cleanup old entries every 5 minutes
setInterval(() => {
  chatRateLimiter.cleanup()
  searchRateLimiter.cleanup()
  embeddingRateLimiter.cleanup()
}, 5 * 60 * 1000)

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  getIdentifier: (request: Request) => string
) {
  return function(handler: Function) {
    return async function(request: Request, ...args: any[]) {
      const identifier = getIdentifier(request)
      const result = rateLimiter.isAllowed(identifier)

      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            remaining: result.remaining,
            resetTime: new Date(result.resetTime).toISOString()
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
            }
          }
        )
      }

      // Add rate limit headers to response
      const response = await handler(request, ...args)
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
      
      return response
    }
  }
}
