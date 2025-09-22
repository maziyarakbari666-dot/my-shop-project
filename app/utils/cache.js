// Advanced caching utility for better performance

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemorySize = 100; // Maximum number of items in memory
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Generate cache key
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}${sortedParams ? '?' + sortedParams : ''}`;
  }

  // Get from memory cache
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    // Update access time for LRU
    item.lastAccess = now;
    return item.data;
  }

  // Set to memory cache
  setToMemory(key, data, ttl = this.defaultTTL) {
    const now = Date.now();
    
    // Remove oldest items if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, {
      data,
      expiry: now + ttl,
      lastAccess: now
    });
  }

  // Cleanup memory cache (LRU)
  cleanupMemoryCache() {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    
    // Remove oldest 20% of items
    const removeCount = Math.floor(entries.length * 0.2);
    for (let i = 0; i < removeCount; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  // Get from localStorage (if available)
  getFromStorage(key) {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (now > parsed.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Cache localStorage read error:', error);
      return null;
    }
  }

  // Set to localStorage (if available)
  setToStorage(key, data, ttl = this.defaultTTL) {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const item = {
        data,
        expiry: Date.now() + ttl
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.warn('Cache localStorage write error:', error);
    }
  }

  // Get data (checks memory first, then localStorage)
  get(key) {
    // Try memory cache first
    let data = this.getFromMemory(key);
    if (data !== null) return data;

    // Try localStorage
    data = this.getFromStorage(key);
    if (data !== null) {
      // Put back in memory for faster access
      this.setToMemory(key, data);
      return data;
    }

    return null;
  }

  // Set data (to both memory and localStorage)
  set(key, data, ttl = this.defaultTTL) {
    this.setToMemory(key, data, ttl);
    this.setToStorage(key, data, ttl);
  }

  // Clear specific key
  clear(key) {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`cache_${key}`);
      } catch (error) {
        console.warn('Cache localStorage delete error:', error);
      }
    }
  }

  // Clear all cache
  clearAll() {
    this.memoryCache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Cache localStorage clear error:', error);
      }
    }
  }

  // Clean expired items from localStorage
  cleanupStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (item && now > item.expiry) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Remove invalid cache entries
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }
}

// Create global cache instance
const cache = new CacheManager();

// Cleanup storage on page load
if (typeof window !== 'undefined') {
  cache.cleanupStorage();
  
  // Cleanup every 10 minutes
  setInterval(() => {
    cache.cleanupStorage();
  }, 10 * 60 * 1000);
}

export default cache;

// Fetch with cache wrapper
export async function cachedFetch(url, options = {}, cacheTTL = 5 * 60 * 1000) {
  const cacheKey = cache.generateKey(url, options.params || {});
  
  // Try to get from cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'max-age=300',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the successful response
    cache.set(cacheKey, data, cacheTTL);
    
    return data;
  } catch (error) {
    console.warn('Cached fetch error:', error);
    throw error;
  }
}
