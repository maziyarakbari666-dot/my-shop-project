'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch } from '../utils/cache';

export function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const {
    immediate = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
    dependencies = []
  } = options;

  const fetchData = useCallback(async (requestUrl = url, requestOptions = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await cachedFetch(requestUrl, {
        signal: abortControllerRef.current.signal,
        ...requestOptions
      }, cacheTTL);

      setData(response);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'An error occurred');
        
        if (onError) {
          onError(err);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheTTL, onSuccess, onError]);

  const refetch = useCallback((newUrl, newOptions) => {
    return fetchData(newUrl, newOptions);
  }, [fetchData]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, url, fetchData, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    reset
  };
}

export function useApiMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const mutate = useCallback(async (url, options = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mutate,
    loading,
    error,
    reset
  };
}

// Hook for paginated data
export function usePaginatedApi(baseUrl, options = {}) {
  const [allData, setAllData] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const {
    pageSize = 12,
    searchQuery = '',
    dependencies = []
  } = options;

  const loadData = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      params.set('pageSize', String(pageSize));
      params.set('page', String(pageNum));
      
      const url = `${baseUrl}?${params.toString()}`;
      
      const response = await cachedFetch(url, {
        headers: {
          'Cache-Control': 'max-age=300',
        }
      });

      if (response?.products) {
        if (isLoadMore) {
          setAllData(prev => [...prev, ...response.products]);
        } else {
          setAllData(response.products);
        }
        
        const total = Number(response.total || 0);
        const loaded = (isLoadMore ? allData.length : 0) + (response.products?.length || 0);
        setHasMore(loaded < total);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [baseUrl, pageSize, searchQuery, allData.length]);

  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadData(nextPage, true);
    }
  }, [hasMore, loadingMore, page, loadData]);

  const refresh = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
    loadData(1, false);
  }, [loadData]);

  useEffect(() => {
    refresh();
  }, [searchQuery, ...dependencies]);

  return {
    data: allData,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh
  };
}
