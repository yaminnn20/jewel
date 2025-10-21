import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { DesignProject } from "@shared/schema";
import type { ChatMessage } from "@/lib/api";

interface ChatInterfaceProps {
  currentProject: DesignProject | null;
  onGenerateDesign: (prompt: string) => void;
  isGenerating: boolean;
}

export default function ChatInterface({
  currentProject,
  onGenerateDesign,
  isGenerating,
}: ChatInterfaceProps) {
  const [chatInput, setChatInput] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; file: File } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (localMessages.length === 0) {
      setLocalMessages([{
        id: "welcome",
        content: "Hello! I'm your AI jewelry design assistant. Upload a base design or describe what you'd like to create, and I'll help you bring your vision to life.",
        isUser: false,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Update local messages when project chat history changes
  useEffect(() => {
    if (currentProject?.chatHistory) {
      setLocalMessages(prev => {
        const welcomeMessage = prev.find(msg => msg.id === "welcome");
        const projectMessages = currentProject.chatHistory || [];
        return welcomeMessage ? [welcomeMessage, ...projectMessages] : projectMessages;
      });
    }
  }, [currentProject?.chatHistory]);

  const chatMutation = useMutation({
    mutationFn: api.chat,
    onSuccess: (response) => {
      setLocalMessages(prev => [...prev, response.response]);
    },
    onError: () => {
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Set the uploaded image for preview
      setUploadedImage({
        url: data.imageUrl,
        file: file
      });
      
      toast({
        title: "Image uploaded",
        description: "Your reference image has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDiscardImage = () => {
    setUploadedImage(null);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() && !uploadedImage) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput,
      isUser: true,
      timestamp: new Date().toISOString(),
      imageUrl: uploadedImage?.url
    };

    setLocalMessages(prev => [...prev, userMessage]);

    chatMutation.mutate({
      message: chatInput,
      projectId: currentProject?.id,
      context: {
        baseDesign: currentProject?.baseDesignId,
        currentDesign: currentProject?.currentDesignData,
      },
    });

    setChatInput("");
    setUploadedImage(null);
  };

  const handleQuickAction = (action: string) => {
    setChatInput(`Please help me ${action.toLowerCase()} for my design`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: "Change Color", icon: "fas fa-palette" },
    { label: "Resize", icon: "fas fa-expand-arrows-alt" },
    { label: "Add Gems", icon: "fas fa-gem" },
    { label: "Add Text", icon: "fas fa-font" },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Chat Interface */}
      <Card>
        <CardContent className="p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--navy))]">AI Design Assistant</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${chatMutation.isPending ? 'bg-[hsl(var(--ruby))] animate-pulse' : 'bg-[hsl(var(--emerald))]'}`}></div>
              <span className={`text-sm ${chatMutation.isPending ? 'text-[hsl(var(--ruby))]' : 'text-[hsl(var(--emerald))]'}`}>
                {chatMutation.isPending ? "Thinking..." : "Connected"}
              </span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {localMessages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start space-x-3 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-[hsl(var(--navy))]' 
                    : 'bg-gradient-to-br from-[hsl(var(--luxury-gold))] to-[hsl(var(--amethyst))]'
                }`}>
                  <i className={`${message.isUser ? 'fas fa-user' : 'fas fa-robot'} text-white text-sm`}></i>
                </div>
                <div className="flex-1">
                  {message.imageUrl && (
                    <div className="relative mb-2">
                      <img 
                        src={message.imageUrl} 
                        alt="Uploaded reference" 
                        className="rounded-lg max-w-xs max-h-48 object-contain"
                      />
                    </div>
                  )}
                  <div className={`rounded-lg p-3 max-w-xs ${
                    message.isUser 
                      ? 'bg-[hsl(var(--amethyst))] text-white ml-auto' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <span className={`text-xs text-muted-foreground mt-1 block ${message.isUser ? 'text-right' : ''}`}>
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--luxury-gold))] to-[hsl(var(--amethyst))] rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-robot text-white text-sm"></i>
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-lg p-3 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-[hsl(var(--amethyst))] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="space-y-4">
            {uploadedImage && (
              <div className="relative inline-block">
                <img 
                  src={uploadedImage.url} 
                  alt="Uploaded preview" 
                  className="rounded-lg max-h-32 object-contain"
                />
                <button
                  onClick={handleDiscardImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            )}
            <div className="relative">
              <Textarea
                placeholder="Describe your design modifications..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="resize-none pr-12"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={(!chatInput.trim() && !uploadedImage) || chatMutation.isPending || isGenerating}
                size="sm"
                className="absolute bottom-3 right-3 bg-[hsl(var(--amethyst))] hover:bg-[hsl(var(--amethyst))]/90 text-white"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.label)}
                  className="p-2 text-sm border-border hover:border-[hsl(var(--amethyst))] hover:text-[hsl(var(--amethyst))] transition-colors"
                >
                  <i className={`${action.icon} mr-1`}></i>
                  {action.label}
                </Button>
              ))}
            </div>

            {/* Generate Design Button */}
            <Button
              onClick={() => onGenerateDesign(chatInput || "Generate a new design variation")}
              disabled={isGenerating || !currentProject}
              className="w-full bg-[hsl(var(--emerald))] hover:bg-[hsl(var(--emerald))]/90 text-black font-medium"
            >
              <i className="fas fa-magic mr-2"></i>
              {isGenerating ? "Generating..." : "Generate Design from Chat"}
            </Button>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-[#a78bfa] bg-[#a78bfa]/5' 
                  : 'border-border hover:border-[#a78bfa]'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileInputChange}
              />
              <i className="fas fa-cloud-upload-alt text-2xl text-muted-foreground mb-2"></i>
              <p className="text-sm text-muted-foreground">
                {isDragging ? 'Drop your image here' : 'Drop reference images here or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[hsl(var(--navy))] mb-4">Recent Projects</h3>
          <div className="space-y-3">
            {currentProject && (
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <img 
                  src={currentProject.currentDesignData?.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40"} 
                  alt="Project Thumbnail" 
                  className="w-10 h-10 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-[hsl(var(--navy))]">{currentProject.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {currentProject.updatedAt ? formatTimestamp(currentProject.updatedAt.toString()) : "Active"}
                  </p>
                </div>
                <Badge variant="outline">{currentProject.status}</Badge>
              </div>
            )}
            
            {!currentProject && (
              <div className="text-center py-8">
                <i className="fas fa-folder-open text-4xl text-muted-foreground mb-2"></i>
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground">Start by selecting a base design</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
