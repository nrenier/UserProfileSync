
import { Route } from "wouter";

export function Router() {
  return (
    <>
      <Route path="/" component={Dashboard} />
      <Route path="/suk-reports" component={SukReports} />
      <Route component={NotFound} />
    </>
  );
}
