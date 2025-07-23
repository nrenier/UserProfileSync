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

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (user && location === "/auth") {
      setLocation("/");
    }
  }, [user, location, setLocation]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If user is not authenticated, show landing page or auth page
  if (!user) {
    return (
      <Router>
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/" component={Landing} /> {/* Changed to a route */}
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