import express, { type Request, Response } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./vite";

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

// Error handling
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

export default app;
