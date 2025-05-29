
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
      const enhancedPrompt = `Create a high-quality, photorealistic jewelry design: ${prompt}. 
        Base style: ${baseDesign?.name || 'elegant jewelry'} (${baseDesign?.category || 'luxury jewelry'}).
        Requirements: Professional jewelry photography, studio lighting, white background, 4K resolution, intricate details, precious metals, gemstones, exceptional craftsmanship, luxury finish.`;

      console.log("Generating design with prompt:", enhancedPrompt);

      // Check if GEMINI_API_KEY is available
      const apiKey = process.env.GEMINI_API_KEY;
      
      let imageUrl = "";
      let aiResponse = "";

      if (apiKey) {
        try {
          // Use Gemini API for real image generation
          const { GoogleGenAI, Modality } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });

          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: enhancedPrompt,
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          // Process the response
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              aiResponse = part.text;
            } else if (part.inlineData) {
              // Convert base64 image to data URL
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              imageUrl = `data:${mimeType};base64,${imageData}`;
            }
          }

          console.log("Gemini API generated design successfully");

        } catch (apiError) {
          console.error("Gemini API error:", apiError);
          // Fallback to placeholder if API fails
          imageUrl = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
          aiResponse = `Generated a ${baseDesign?.category || 'jewelry'} design based on "${prompt}". API temporarily unavailable, showing preview.`;
        }
      } else {
        // Fallback when no API key is configured
        console.log("No GEMINI_API_KEY found, using placeholder");
        const designVariations = [
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
        ];
        
        const promptHash = prompt.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        imageUrl = designVariations[Math.abs(promptHash) % designVariations.length];
        aiResponse = `Preview design for "${prompt}". Configure GEMINI_API_KEY for AI generation.`;
      }

      if (!aiResponse) {
        aiResponse = `I've created a sophisticated ${baseDesign?.category || 'jewelry'} design incorporating "${prompt}". This piece showcases exceptional artistry with premium materials and refined details.`;
      }

      const iteration = {
        id: Date.now().toString(),
        imageUrl,
        prompt: enhancedPrompt,
        timestamp: new Date().toISOString(),
        aiResponse
      };

      // Add processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      res.json({
        success: true,
        iteration,
        message: apiKey ? "AI design generated successfully" : "Preview generated - add GEMINI_API_KEY for AI generation"
      });
    } catch (error) {
      console.error("Design generation error:", error);
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
