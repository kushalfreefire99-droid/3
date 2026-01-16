import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for per-IP requests
 * 20 requests per 15 minutes per IP
 */
export const perIPLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil(((req as any).rateLimit?.resetTime?.getTime() - Date.now()) / 1000) || 900;
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter,
      retryAfterMinutes: Math.ceil(retryAfter / 60)
    });
  }
});

/**
 * Global rate limiter
 * 100 requests per minute globally
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    error: 'Server is experiencing high traffic, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});
