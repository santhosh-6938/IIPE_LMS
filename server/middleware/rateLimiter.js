const rateLimitMap = new Map();

// Rate limiting middleware
const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create rate limit data for this key
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, {
        requests: [],
        blockedUntil: null
      });
    }

    const rateLimitData = rateLimitMap.get(key);

    // Check if currently blocked
    if (rateLimitData.blockedUntil && rateLimitData.blockedUntil > now) {
      return res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil((rateLimitData.blockedUntil - now) / 1000)
      });
    }

    // Clean old requests
    rateLimitData.requests = rateLimitData.requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (rateLimitData.requests.length >= max) {
      // Block for the remaining window time
      rateLimitData.blockedUntil = now + windowMs;
      
      return res.status(429).json({
        success: false,
        message: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    rateLimitData.requests.push(now);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': Math.max(0, max - rateLimitData.requests.length),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

// Specific rate limiters for different endpoints
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts. Please try again later.',
  keyGenerator: (req) => {
    const email = req.body?.email || req.body?.rollNumber;
    return email ? `auth:${email}` : `auth:${req.ip}`;
  }
});

const emailVerificationRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  message: 'Too many verification code requests. Please try again later.',
  keyGenerator: (req) => `email:${req.body?.email || req.ip}`
});

const generalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests. Please try again later.'
});

// Cleanup old rate limit data periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, data] of rateLimitMap.entries()) {
    // Remove if no recent requests and not blocked
    const hasRecentRequests = data.requests.some(timestamp => timestamp > now - maxAge);
    const isBlocked = data.blockedUntil && data.blockedUntil > now;
    
    if (!hasRecentRequests && !isBlocked) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000); // Cleanup every hour

module.exports = {
  rateLimiter,
  authRateLimiter,
  emailVerificationRateLimiter,
  generalRateLimiter
};
