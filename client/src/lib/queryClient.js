import { QueryClient } from '@tanstack/react-query';

// Get the current URL to determine the API base
const getApiBase = () => {
  if (typeof window === 'undefined') return '';

  // In development, use the dev server port (3000)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
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

// In Replit, the server runs on the same port as the frontend
const API_BASE_URL = window.location.hostname.includes('replit.dev') 
  ? `${window.location.protocol}//${window.location.host}` 
  : `${window.location.protocol}//${window.location.hostname}:3000`;

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

    if (!url) {
      throw new Error(`Invalid query key: ${queryKey}`);
    }

    const fullUrl = url.startsWith('/api/') ? `${API_BASE_URL}${url}` : url;
    console.log('🔵 Making API request to:', fullUrl);

    const response = await fetch(fullUrl, {
      credentials: "include",
    });

    if (!response.ok) {
      if (options.on401 === 'returnNull' && response.status === 401) {
        return null;
      }
      throw new Error(`Request failed with status ${response.status}`);
    }

    try {
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw error;
    }
  };
};

// API request helper function
export const apiRequest = async (method, url, data) => {
  const fullUrl = url.startsWith('/api/') ? `${API_BASE_URL}${url}` : url;
  console.log('🔵 Making API request to:', fullUrl);

  const options = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(fullUrl, options);

  return response;
};

export { fetchWithCredentials };