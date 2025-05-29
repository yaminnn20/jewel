
import express, { type Request, Response } from "express";
import { createServer } from "http";
import { MemStorage } from "./storage";

const storage = new MemStorage();

export function registerRoutes(app: express.Application) {
  const server = createServer(app);

  // Get all base designs
  app.get("/api/base-designs", async (req: Request, res: Response) => {
    try {
      const baseDesigns = await storage.getBaseDesigns();
      res.json(baseDesigns);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch base designs"
      });
    }
  });

  // Get all sub designs
  app.get("/api/sub-designs", async (req: Request, res: Response) => {
    try {
      const subDesigns = await storage.getSubDesigns();
      res.json(subDesigns);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch sub designs"
      });
    }
  });

  // Get specific base design
  app.get("/api/base-designs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const baseDesign = await storage.getBaseDesign(id);
      
      if (!baseDesign) {
        return res.status(404).json({
          success: false,
          message: "Base design not found"
        });
      }
      
      res.json(baseDesign);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch base design"
      });
    }
  });

  // API routes
  app.post("/api/generate-design", async (req: Request, res: Response) => {
    try {
      // Placeholder for design generation logic
      const { prompt, baseDesignId, previousImage } = req.body;
      
      const iteration = {
        id: Date.now().toString(),
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        prompt,
        timestamp: new Date().toISOString(),
        aiResponse: "Design generated successfully"
      };

      res.json({
        success: true,
        iteration,
        message: "Design generated successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to generate design"
      });
    }
  });

  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { message, projectId, context } = req.body;
      
      const response = {
        id: Date.now().toString(),
        content: `I understand you said: "${message}". How can I help you with your jewelry design?`,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        response
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to process chat message"
      });
    }
  });

  app.post("/api/export-design/:projectId", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      
      res.json({
        success: true,
        message: `Design ${projectId} exported successfully`,
        downloadUrl: "/api/download/design-export.zip"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to export design"
      });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const projectData = req.body;
      
      const project = {
        id: Date.now(),
        ...projectData,
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        project
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to create project"
      });
    }
  });

  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;
      
      // In a real implementation, you would update the project in storage
      // For now, just return success
      res.json({
        success: true,
        message: "Project updated successfully"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update project"
      });
    }
  });

  return server;
}
