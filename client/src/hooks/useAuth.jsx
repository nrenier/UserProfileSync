import { createContext, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    onSuccess: (data) => {
      console.log('🔍 useAuth Query Success - User data received:', data);
    },
    onError: (error) => {
      console.log('❌ useAuth Query Error:', error);
    }
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {
      console.log('\n🔐 === FRONTEND LOGIN MUTATION START ===');
      console.log('📍 Timestamp:', new Date().toISOString());
      console.log('👤 Attempting login for username:', username);
      console.log('🌐 Current location:', window.location.href);
      console.log('🍪 Document cookies before login:', document.cookie);

      // Determine correct API base URL
      const apiBaseUrl = window.location.hostname.includes('replit.dev') 
        ? `${window.location.protocol}//${window.location.host}` 
        : `${window.location.protocol}//${window.location.hostname}:3000`;
      
      console.log('🌐 Using API base URL:', apiBaseUrl);
      const loginUrl = `${apiBaseUrl}/api/login`;
      console.log('🌐 Full login URL:', loginUrl);

      const requestBody = { username, password };
      console.log('📝 Request body:', { username, password: '[HIDDEN]' });

      try {
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          credentials: 'include',
        });

        console.log('📡 Login response received');
        console.log('📡 Response status:', response.status);
        console.log('📡 Response statusText:', response.statusText);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('🍪 Document cookies after response:', document.cookie);

        if (!response.ok) {
          const error = await response.json();
          console.log('❌ Login failed - Error response:', error);
          throw new Error(error.message || 'Credenziali non valide');
        }

        const userData = await response.json();
        console.log('✅ Login successful - User data received:', userData);
        console.log('==========================================\n');
        return userData;
        
      } catch (fetchError) {
        console.log('❌ Fetch error during login:', fetchError);
        console.log('❌ Error type:', typeof fetchError);
        console.log('❌ Error message:', fetchError.message);
        throw fetchError;
      }
    },
    onSuccess: (user) => {
      console.log('✅ Login mutation onSuccess, setting user data:', user);
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error) => {
      console.log('❌ Login mutation onError:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}