
import { Router, Route, Switch, useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { Dashboard } from "../pages/dashboard";
import { SukReports } from "../pages/suk-reports";
import { AuthPage } from "../pages/auth-page";
import { Landing } from "../pages/landing";
import { NotFound } from "../pages/not-found";
import { useEffect } from "react";

export default function AppRouter() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  // Comprehensive logging for router state
  useEffect(() => {
    console.log('\n🧭 === ROUTER STATE DEBUG ===');
    console.log('📍 Timestamp:', new Date().toISOString());
    console.log('🌐 Current location:', location);
    console.log('⏳ Is loading:', isLoading);
    console.log('👤 User exists:', !!user);
    console.log('👤 User data:', user ? { id: user.id, username: user.username, role: user.role } : 'no user');
    console.log('🍪 Document cookies:', document.cookie);
    console.log('===============================\n');
  }, [user, isLoading, location]);

  // Redirect authenticated users away from auth page
  useEffect(() => {
    console.log('\n🔀 === ROUTER REDIRECT CHECK ===');
    console.log('👤 User authenticated:', !!user);
    console.log('🌐 Current location:', location);
    
    if (user && location === "/auth") {
      console.log('🔀 Redirecting authenticated user from /auth to /');
      setLocation("/");
    } else if (user && location === "/auth") {
      console.log('🔀 No redirect needed');
    }
    console.log('==================================\n');
  }, [user, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, show landing page or auth page
  if (!user) {
    return (
      <Router>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={Landing} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // If user is authenticated, show main app
  return (
    <Router>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/suk-reports" component={SukReports} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}
