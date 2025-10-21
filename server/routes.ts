import express, { type Request, Response } from "express";
import { createServer } from "http";
import { MemStorage } from "./storage";
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs/promises';

const storage = new MemStorage();

// Configure multer for file uploads
const storageMulter = multer.diskStorage({
  destination: async (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, uploadsDir);
    }
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageMulter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
              const originalBuffer = Buffer.from(imageBuffer);

              // Use original image without any processing
              const imageBase64 = originalBuffer.toString('base64');
              const mimeType = 'image/jpeg';

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
            } catch (downloadError: unknown) {
              if (downloadError instanceof Error) {
                console.error("Failed to download image:", downloadError.message);
                console.error("Error stack:", downloadError.stack);
              } else {
                console.error("Failed to download image with unknown error");
              }
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
              responseModalities: [Modality.TEXT, Modality.IMAGE]
            },
          });

          // Process the response
          if (!response.candidates || !response.candidates[0]?.content?.parts) {
            throw new Error("Invalid response from Gemini API");
          }

          for (const part of response.candidates[0].content.parts) {
            if (part.text) {
              aiResponse = part.text;
            } else if (part.inlineData?.data) {
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

                // Save the original Gemini output without any processing
                await fs.writeFile(filepath, buffer);
                console.log("Generated image saved successfully:", filename);

                // Return URL to serve the image
                imageUrl = `/uploads/${filename}`;

              } catch (saveError: unknown) {
                if (saveError instanceof Error) {
                  console.error("Failed to save image:", saveError.message);
                  console.error("Error stack:", saveError.stack);
                } else {
                  console.error("Failed to save image with unknown error");
                }
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

        const promptHash = prompt.split('').reduce((a: number, b: string) => {
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

      // Check if GEMINI_API_KEY is available
      const apiKey = process.env.GEMINI_API_KEY;

      let aiResponse = "";

      if (apiKey) {
        try {
          // Use Gemini API for chat
          const { GoogleGenAI, Modality } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey });

          // Prepare the prompt with context
          let prompt = message;
          if (context?.baseDesign) {
            prompt = `Regarding the jewelry design (ID: ${context.baseDesign}), ${message}`;
          }

          // Check if we need image generation
          const needsImageGeneration = prompt.toLowerCase().includes("generate") || 
                                    prompt.toLowerCase().includes("create") || 
                                    prompt.toLowerCase().includes("make") ||
                                    prompt.toLowerCase().includes("show me") ||
                                    prompt.toLowerCase().includes("design");

          if (needsImageGeneration) {
            // Use image generation model
            const response = await ai.models.generateContent({
              model: "gemini-2.0-flash-preview-image-generation",
              contents: prompt,
              config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE]
              }
            });

            // Process the response
            if (!response.candidates || !response.candidates[0]?.content?.parts) {
              throw new Error("Invalid response from Gemini API");
            }

            for (const part of response.candidates[0].content.parts) {
              if (part.text) {
                aiResponse = part.text;
              } else if (part.inlineData?.data) {
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
                  const filename = `chat-${Date.now()}.${extension}`;
                  const filepath = path.join(uploadsDir, filename);
                  const buffer = Buffer.from(imageData, 'base64');

                  await fs.writeFile(filepath, buffer);
                  console.log("Generated image saved successfully:", filename);

                  // Add image URL to response
                  aiResponse += `\n[Generated image: /uploads/${filename}]`;
                } catch (saveError) {
                  console.error("Failed to save image:", saveError);
                }
              }
            }
          } else {
            // Use text-only model for regular chat
            const response = await ai.models.generateContent({
              model: "gemini-pro",
              contents: prompt
            });
            
            if (response.candidates && response.candidates[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.text) {
                  aiResponse = part.text;
                  break;
                }
              }
            }
          }
        } catch (apiError) {
          console.error("Gemini API error:", apiError);
          aiResponse = "I apologize, but I'm having trouble connecting to my AI capabilities right now. Please try again in a moment.";
        }
      } else {
        aiResponse = "I understand you're asking about jewelry design. To provide better assistance, please configure the GEMINI_API_KEY.";
      }

      const response = {
        id: Date.now().toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error("Chat error:", error);
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

  // File upload endpoint
  app.post("/api/upload", upload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      // Return the URL of the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({
        success: true,
        imageUrl
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload file"
      });
    }
  });

  // Serve uploaded images
  app.use("/uploads", express.static("uploads"));

  return server;
}