
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
      const { prompt, baseDesignId, previousImage } = req.body;
      
      // Get base design for context
      const baseDesign = await storage.getBaseDesign(baseDesignId);
      
      // Create enhanced prompt for AI generation
      const enhancedPrompt = `Create a high-quality, photorealistic jewelry design based on: ${prompt}. 
        Base design: ${baseDesign?.name || 'custom design'} (${baseDesign?.category || 'jewelry'}).
        Style: Professional jewelry photography, studio lighting, white background, 4K resolution.
        Focus on: intricate details, precious metals, gemstones, craftsmanship.`;

      // Simulate AI generation with varied results
      const designVariations = [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
      ];
      
      // Select a different image based on the prompt hash for variety
      const promptHash = prompt.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const selectedImage = designVariations[Math.abs(promptHash) % designVariations.length];

      // Generate detailed AI response
      const aiResponses = [
        `I've created a stunning ${baseDesign?.category || 'jewelry'} design incorporating ${prompt}. The design features enhanced elegance with modern craftsmanship techniques.`,
        `Your custom design beautifully combines the classic elements of ${baseDesign?.name || 'the base design'} with the creative vision of "${prompt}". This piece showcases exceptional artistry.`,
        `I've generated a sophisticated interpretation of your request "${prompt}". The design maintains the timeless appeal while adding contemporary flair.`,
        `This unique ${baseDesign?.category || 'jewelry'} piece perfectly captures the essence of "${prompt}" with refined details and premium materials.`
      ];
      
      const selectedResponse = aiResponses[Math.abs(promptHash) % aiResponses.length];

      const iteration = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        prompt: enhancedPrompt,
        timestamp: new Date().toISOString(),
        aiResponse: selectedResponse
      };

      // Add a small delay to simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      res.json({
        success: true,
        iteration,
        message: "AI design generated successfully"
      });
    } catch (error) {
      console.error("Design generation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate design with AI"
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
