import { QueryClient } from '@tanstack/react-query';

// Get the current URL to determine the API base
const getApiBase = () => {
  if (typeof window === 'undefined') return '';

  // In development, use the dev server port (5000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  // In production, use the same origin
  return window.location.origin;
};

// Create a fetch wrapper that includes credentials
const fetchWithCredentials = async (url, options = {}) => {
  const apiBase = getApiBase();
  const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText || response.statusText}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

// Create QueryClient with custom fetch
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: ({ queryKey }) => {
        const [url] = queryKey;
        return fetchWithCredentials(url);
      },
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error.message.includes('401') || error.message.includes('403')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    },
    mutations: {
      mutationFn: ({ url, options }) => fetchWithCredentials(url, options),
    },
  },
});

// Helper function for queries with custom error handling
export const getQueryFn = (options = {}) => {
  return async ({ queryKey }) => {
    const [url] = queryKey;
    try {
      return await fetchWithCredentials(url);
    } catch (error) {
      if (options.on401 === 'returnNull' && error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  };
};

// API request helper function
export const apiRequest = async (method, url, data) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
};

export { fetchWithCredentials };