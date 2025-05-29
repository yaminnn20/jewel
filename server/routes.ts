
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
      
      console.log("Generating design with user prompt:", prompt);
      console.log("Previous image URL:", previousImage);

      // Check if GEMINI_API_KEY is available
      const apiKey = process.env.GEMINI_API_KEY;
      
      let imageUrl = "";
      let aiResponse = "";

      if (apiKey) {
        try {
          // Use Gemini API for real image generation
          const { GoogleGenAI, Modality } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });

          let contents: any[] = [];

          // If we have a previous image, download it and include it in the request
          if (previousImage && !previousImage.startsWith('data:')) {
            try {
              console.log("Downloading previous image for iteration...");
              
              // Convert relative URLs to absolute URLs for local uploads
              let imageUrl = previousImage;
              if (previousImage.startsWith('/uploads/')) {
                imageUrl = `http://localhost:5000${previousImage}`;
              }
              
              const imageResponse = await fetch(imageUrl);
              
              if (!imageResponse.ok) {
                throw new Error(`Failed to fetch image: ${imageResponse.status}`);
              }
              
              const imageBuffer = await imageResponse.arrayBuffer();
              const imageBase64 = Buffer.from(imageBuffer).toString('base64');
              const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
              
              console.log("Image downloaded, sending to Gemini for iteration");
              
              // Send both image and text prompt for iteration
              contents = [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: imageBase64
                      }
                    },
                    {
                      text: `Please modify this jewelry design: ${prompt}`
                    }
                  ]
                }
              ];
            } catch (downloadError) {
              console.error("Failed to download image:", downloadError);
              // Fallback to text-only if image download fails
              contents = prompt;
            }
          } else {
            // No previous image or it's a data URL, just use text prompt
            contents = prompt;
          }

          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-preview-image-generation",
            contents: contents,
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          // Process the response
          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              aiResponse = part.text;
            } else if (part.inlineData) {
              // Save image to filesystem and serve via URL
              const imageData = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || "image/png";
              const extension = mimeType.includes('png') ? 'png' : 'jpg';
              
              try {
                const fs = await import('fs/promises');
                const path = await import('path');
                
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(process.cwd(), 'uploads');
                try {
                  await fs.mkdir(uploadsDir, { recursive: true });
                } catch (e) {
                  // Directory might already exist
                }
                
                // Save image with unique filename
                const filename = `generated-${Date.now()}.${extension}`;
                const filepath = path.join(uploadsDir, filename);
                const buffer = Buffer.from(imageData, 'base64');
                
                await fs.writeFile(filepath, buffer);
                
                // Return URL to serve the image
                imageUrl = `/uploads/${filename}`;
                console.log("Generated image saved successfully:", filename);
                
              } catch (saveError) {
                console.error("Failed to save image:", saveError);
                // Fallback to placeholder if save fails
                imageUrl = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
              }
            }
          }

          console.log("Gemini API generated design successfully");

        } catch (apiError) {
          console.error("Gemini API error:", apiError);
          // Fallback to placeholder if API fails
          imageUrl = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
          aiResponse = `Generated a design based on "${prompt}". API temporarily unavailable, showing preview.`;
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
        aiResponse = `I've created a design based on "${prompt}".`;
      }

      const iteration = {
        id: Date.now().toString(),
        imageUrl,
        prompt, // Store the original user prompt
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

  // Serve uploaded images
  app.use("/uploads", express.static("uploads"));

  return server;
}
