import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0];
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${response.statusText}${errorText ? `. ${errorText}` : ''}`);
        }
        
        return response.json();
      },
    },
  },
});

export async function apiRequest(method, url, data) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${response.statusText}${errorText ? `. ${errorText}` : ''}`);
  }

  return response;
}

export function getQueryFn(options = {}) {
  return async ({ queryKey }) => {
    const url = queryKey[0];
    try {
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401 && options.on401 === "returnNull") {
          return null;
        }
        const errorText = await response.text();
        throw new Error(`${response.status}: ${response.statusText}${errorText ? `. ${errorText}` : ''}`);
      }
      
      return response.json();
    } catch (error) {
      if (options.on401 === "returnNull" && error.message.includes('401')) {
        return null;
      }
      throw error;
    }
  };
}