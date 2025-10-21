import { apiRequest } from "./queryClient";

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  imageUrl?: string;
}

export interface DesignIteration {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: string;
  aiResponse?: string;
}

export interface GenerateDesignRequest {
  prompt: string;
  baseDesignId?: number;
  previousImage?: string;
}

export interface GenerateDesignResponse {
  success: boolean;
  iteration: DesignIteration;
  message: string;
}

export interface ChatRequest {
  message: string;
  projectId?: number;
  context?: any;
}

export interface ChatResponse {
  success: boolean;
  response: ChatMessage;
}

export const api = {
  // Generate design with Gemini AI
  generateDesign: async (request: GenerateDesignRequest): Promise<GenerateDesignResponse> => {
    const response = await apiRequest("POST", "/api/generate-design", request);
    return response.json();
  },

  // Chat with AI assistant
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await apiRequest("POST", "/api/chat", request);
    return response.json();
  },

  // Export design for manufacturing
  exportDesign: async (projectId: number) => {
    const response = await apiRequest("POST", `/api/export-design/${projectId}`);
    return response.json();
  },

  // Create new project
  createProject: async (projectData: any) => {
    const response = await apiRequest("POST", "/api/projects", projectData);
    return response.json();
  },

  // Update project
  updateProject: async (projectId: number, updates: any) => {
    const response = await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
    return response.json();
  }
};
