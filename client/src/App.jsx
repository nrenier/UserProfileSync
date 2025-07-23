import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { NotFound } from "./pages/not-found";
import { Landing } from "./pages/landing";
import { Dashboard } from "./pages/dashboard";
import { SUKReports } from "./pages/suk-reports";
import { AuthPage } from "./pages/auth-page";
import { Sidebar } from "./components/layout/sidebar";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/suk-reports" component={SUKReports} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout({ children }) {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AuthenticatedLayout>
            <Router />
          </AuthenticatedLayout>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;