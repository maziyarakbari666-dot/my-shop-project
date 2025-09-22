// Cache middleware for Express.js with Redis-like behavior using memory

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.maxSize = 1000; // Maximum cache entries
  }

  set(key, value, ttlSeconds = 300) {
    // Clear existing timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Set value
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  size() {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// Cache middleware factory
function createCacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    skipCache = () => false,
    onHit = () => {},
    onMiss = () => {}
  } = options;

  return (req, res, next) => {
    // Skip cache for non-GET requests or when skipCache returns true
    if (req.method !== 'GET' || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedData = memoryCache.get(cacheKey);

    if (cachedData) {
      // Cache hit
      onHit(cacheKey, req);
      
      // Set cache headers
      res.set({
        'X-Cache': 'HIT',
        'Cache-Control': `public, max-age=${ttl}`,
        'Content-Type': 'application/json; charset=utf-8'
      });

      return res.json(cachedData);
    }

    // Cache miss - intercept response
    onMiss(cacheKey, req);
    
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, data, ttl);
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${ttl}`
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

// Predefined cache middleware for common use cases
const productCache = createCacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const query = new URLSearchParams(req.query).toString();
    return `products:${query}`;
  },
  skipCache: (req) => {
    // Skip cache if user is authenticated (for personalized data)
    return req.user && req.user.role === 'admin';
  }
});

const categoryCache = createCacheMiddleware({
  ttl: 600, // 10 minutes - categories change less frequently
  keyGenerator: () => 'categories:all'
});

const settingsCache = createCacheMiddleware({
  ttl: 1800, // 30 minutes - settings change rarely
  keyGenerator: () => 'settings:public'
});

// Cache invalidation helpers
function invalidateCache(pattern) {
  const keys = memoryCache.keys();
  const keysToDelete = keys.filter(key => key.includes(pattern));
  keysToDelete.forEach(key => memoryCache.delete(key));
  return keysToDelete.length;
}

function invalidateProductCache() {
  return invalidateCache('products:');
}

function invalidateCategoryCache() {
  return invalidateCache('categories:');
}

function invalidateSettingsCache() {
  return invalidateCache('settings:');
}

// Cache statistics
function getCacheStats() {
  return {
    size: memoryCache.size(),
    maxSize: memoryCache.maxSize,
    keys: memoryCache.keys()
  };
}

module.exports = {
  createCacheMiddleware,
  productCache,
  categoryCache,
  settingsCache,
  invalidateCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateSettingsCache,
  getCacheStats,
  memoryCache
};
