import express from "express";
import morgan from "morgan";
import compression from "compression";
import { registerRoutes } from "./routes";

const app = express();

// Basic middleware
app.use(compression());
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add session debugging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Session ID: ${req.sessionID || 'none'}`);
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('IsAuthenticated:', req.isAuthenticated ? req.isAuthenticated() : 'function not available');
  next();
});

// Register routes (includes auth setup)
import { setupAuth, initializeAdmin } from "./auth";

// Setup authentication
// Setup local authentication only
  setupAuth(app);

const httpServer = await registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist/public"));

  // Serve the React app for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile("index.html", { root: "dist/public" });
  });
} else {
  // In development, Vite handles the frontend
  const viteDevServer = await import("./vite-dev").then((m) => m.createViteDevServer());
  app.use(viteDevServer.ssrFixStacktrace);
}

const port = Number(process.env.PORT) || 3000;
httpServer.listen(port, "0.0.0.0", () => {
  console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${port}`);
});