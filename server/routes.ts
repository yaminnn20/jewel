import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDesignProjectSchema, insertManufacturingOrderSchema } from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenAI, Modality } from "@google/genai";

// Initialize Gemini AI for both text and image generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "");
const imageGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Base Designs Routes
  app.get("/api/base-designs", async (req, res) => {
    try {
      const category = req.query.category as string;
      const designs = category 
        ? await storage.getBaseDesignsByCategory(category)
        : await storage.getBaseDesigns();
      res.json(designs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch base designs" });
    }
  });

  app.get("/api/base-designs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const design = await storage.getBaseDesign(id);
      if (!design) {
        return res.status(404).json({ message: "Base design not found" });
      }
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch base design" });
    }
  });

  // Sub Designs Routes
  app.get("/api/sub-designs", async (req, res) => {
    try {
      const subDesigns = await storage.getSubDesigns();
      res.json(subDesigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sub designs" });
    }
  });

  // Design Projects Routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getDesignProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getDesignProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertDesignProjectSchema.parse(req.body);
      const project = await storage.createDesignProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateDesignProject(id, req.body);
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Failed to update project" });
    }
  });

  // AI Design Generation Route
  app.post("/api/generate-design", async (req, res) => {
    try {
      const { prompt, baseDesignId, previousImage } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get base design for context
      let baseDesign = null;
      if (baseDesignId) {
        baseDesign = await storage.getBaseDesign(baseDesignId);
      }

      // Create a comprehensive prompt for image generation
      let enhancedPrompt = `Generate a jewelry design image based on: "${prompt}"`;
      
      if (baseDesign) {
        enhancedPrompt += ` This should be a ${baseDesign.category} inspired by "${baseDesign.name}" - ${baseDesign.description}. Materials: ${baseDesign.specifications?.materials?.join(', ') || 'luxury materials'}.`;
      }

      enhancedPrompt += ` Create a professional jewelry photograph with white background, studio lighting, photorealistic detail, high quality suitable for luxury jewelry catalog.`;

      console.log("Sending image generation prompt to Gemini:", enhancedPrompt);

      // Use the new Google GenAI SDK for image generation
      const response = await imageGenAI.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: enhancedPrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });
      
      // Process the response to extract text and image data
      let imageUrl = null;
      let aiResponse = "";

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          aiResponse += part.text;
        } else if (part.inlineData) {
          // Convert base64 image data to data URL
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${imageData}`;
          console.log("Generated image successfully");
        }
      }

      // If no image was generated, use base design image as fallback
      if (!imageUrl) {
        console.log("No image generated, using base design image");
        imageUrl = baseDesign?.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600";
      }
      
      const designIteration = {
        id: Date.now().toString(),
        prompt: prompt,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
        aiResponse: aiResponse
      };

      res.json({
        success: true,
        iteration: designIteration,
        message: imageUrl.startsWith('data:') ? "AI-generated design created successfully" : "Design analysis completed successfully"
      });

    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ 
        message: "Failed to generate design. Please check your API key and try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Chat with AI Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, projectId, context } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      let contextPrompt = "You are an expert jewelry designer and consultant. Help customers with their jewelry design questions and modifications.";
      
      if (context) {
        contextPrompt += ` Current design context: ${JSON.stringify(context)}`;
      }

      const prompt = `${contextPrompt}\n\nCustomer message: ${message}\n\nProvide helpful, specific advice about jewelry design, materials, modifications, or styling. Keep responses concise and professional.`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const text = response.text();

      const chatResponse = {
        id: Date.now().toString(),
        content: text,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      // If projectId is provided, update the project's chat history
      if (projectId) {
        const project = await storage.getDesignProject(projectId);
        if (project) {
          const updatedChatHistory = [
            ...(project.chatHistory || []),
            {
              id: (Date.now() - 1000).toString(),
              content: message,
              isUser: true,
              timestamp: new Date().toISOString()
            },
            chatResponse
          ];
          
          await storage.updateDesignProject(projectId, {
            chatHistory: updatedChatHistory
          });
        }
      }

      res.json({
        success: true,
        response: chatResponse
      });

    } catch (error) {
      console.error("Chat Error:", error);
      res.status(500).json({ 
        message: "Failed to process chat message. Please check your API key and try again.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Manufacturing Routes
  app.post("/api/manufacturing-orders", async (req, res) => {
    try {
      const validatedData = insertManufacturingOrderSchema.parse(req.body);
      const order = await storage.createManufacturingOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to create manufacturing order" });
    }
  });

  app.get("/api/manufacturing-orders", async (req, res) => {
    try {
      const orders = await storage.getManufacturingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manufacturing orders" });
    }
  });

  // Export Design for Manufacturing
  app.post("/api/export-design/:projectId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getDesignProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const baseDesign = project.baseDesignId 
        ? await storage.getBaseDesign(project.baseDesignId)
        : null;

      const manufacturingSpecs = {
        materials: baseDesign?.specifications?.materials || ["Gold"],
        dimensions: baseDesign?.specifications?.dimensions || { width: "10mm", height: "15mm", depth: "5mm" },
        weight: baseDesign?.specifications?.weight || "3.0g",
        finish: "Polished",
        timeline: "3-4 weeks",
        price: 5000
      };

      const order = await storage.createManufacturingOrder({
        projectId: projectId,
        specifications: manufacturingSpecs
      });

      // Update project status
      await storage.updateDesignProject(projectId, { status: "manufacturing" });

      res.json({
        success: true,
        order: order,
        downloadLinks: {
          specifications: `/api/download/specs/${order.id}`,
          model3D: `/api/download/model/${order.id}`,
          renders: `/api/download/renders/${order.id}`
        }
      });

    } catch (error) {
      res.status(500).json({ message: "Failed to export design for manufacturing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
